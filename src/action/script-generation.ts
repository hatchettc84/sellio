'use server'

import { runTenantOperation } from '@/lib/tenant/auth'
import type { WebinarFormState } from '@/store/useWebinarStore'
import { generateScriptWithLLM, getLLMConfig } from '@/lib/llm/script-generator'

/**
 * Generate selling script from LLM based on webinar data and datasets
 */
export async function generateWebinarScript(
  formData: WebinarFormState,
  datasetIds?: string[]
) {
  try {
    return await runTenantOperation(async (prisma, context) => {
      // Get datasets for the tenant
      const datasets = await prisma.dataset.findMany({
        where: {
          tenantId: context.tenantId,
          status: 'READY',
          ...(datasetIds && datasetIds.length > 0
            ? { id: { in: datasetIds } }
            : {}),
        },
        take: 5, // Limit to 5 most recent datasets
        orderBy: {
          updatedAt: 'desc',
        },
      })

      // If no datasets, return a basic template
      if (datasets.length === 0) {
        return {
          success: true,
          script: generateBasicScript(formData),
          message: 'Generated basic script (no datasets available)',
        }
      }

      // Extract content from datasets
      // In production, you would read the actual dataset content from storage
      // For now, we'll use dataset metadata and attempt to read content if available
      const datasetContent: string[] = []
      const datasetNames: string[] = []

      for (const dataset of datasets) {
        datasetNames.push(dataset.name)
        // If storagePath exists, you could read the actual content here
        // For now, we'll use metadata
        if (dataset.metadata && typeof dataset.metadata === 'object') {
          const metadataStr = JSON.stringify(dataset.metadata)
          datasetContent.push(`Dataset: ${dataset.name}\n${dataset.description || ''}\nMetadata: ${metadataStr}`)
        } else {
          datasetContent.push(`Dataset: ${dataset.name} (${dataset.documentsCount} documents)\n${dataset.description || ''}`)
        }
      }

      // Try to use real LLM if configured, otherwise fall back to template
      const llmConfig = getLLMConfig()
      let script: string

      if (llmConfig) {
        try {
          script = await generateScriptWithLLM(
            {
              webinarTitle: formData.basicInfo.webinarName || 'Webinar',
              webinarDescription: formData.basicInfo.description || '',
              ctaType: formData.cta.ctaType,
              ctaLabel: formData.cta.ctaLabel || '',
              tags: formData.cta.tags || [],
              datasetContent: datasetContent.length > 0 ? datasetContent : undefined,
              datasetNames: datasetNames.length > 0 ? datasetNames : undefined,
            },
            llmConfig
          )
        } catch (llmError) {
          console.error('LLM generation failed, falling back to template:', llmError)
          script = generateBasicScript(formData)
        }
      } else {
        // No LLM configured, use template
        console.warn('No LLM API key configured. Using template script. Set OPENAI_API_KEY or ANTHROPIC_API_KEY for real generation.')
        script = generateBasicScript(formData)
      }

      return {
        success: true,
        script,
        message: `Generated script using ${datasets.length} dataset(s)`,
        datasetIds: datasets.map((d) => d.id),
      }
    })
  } catch (error) {
    console.error('Error generating script:', error)
    return {
      success: false,
      script: generateBasicScript(formData),
      message: error instanceof Error ? error.message : 'Failed to generate script',
    }
  }
}

/**
 * Generate basic script template (fallback when LLM is not available)
 */
function generateBasicScript(formData: WebinarFormState): string {
  const webinarTitle = formData.basicInfo.webinarName || 'Webinar'
  const webinarDescription = formData.basicInfo.description || ''
  const ctaType = formData.cta.ctaType
  const ctaLabel = formData.cta.ctaLabel || ''
  const tags = formData.cta.tags || []

  // Generate a comprehensive production-ready selling script
  const script = `# PRODUCTION WEBINAR SCRIPT: ${webinarTitle}

## WEBINAR DETAILS
**Title:** ${webinarTitle}
**Description:** ${webinarDescription || 'High-converting webinar presentation'}
**CTA:** ${ctaLabel}
**CTA Type:** ${ctaType === 'BOOK_A_CALL' ? 'Schedule a Call' : 'Purchase'}
${tags.length > 0 ? `**Topics:** ${tags.join(', ')}` : ''}

---

## YOUR ROLE AS AI PRESENTER
You are a professional sales presenter and expert conversationalist running this live webinar. You must:
- Deliver value-packed content that educates and inspires
- Build genuine rapport and trust with attendees
- Create urgency and desire for the solution
- Guide attendees smoothly toward the call-to-action
- Handle objections with empathy and expertise
- Keep energy high and engagement consistent

---

## PRE-WEBINAR CHECKLIST (Before Going Live)
- [ ] Test audio and video quality
- [ ] Confirm CTA links are working: ${ctaLabel}
- [ ] Have all slides/materials ready
- [ ] Check chat/Q&A functionality
- [ ] Prepare poll questions if applicable
- [ ] Set up breakout rooms if needed

---

## COMPLETE WEBINAR SCRIPT

### PHASE 1: WELCOME & WARM-UP (0-5 minutes)

**Opening Lines:**
"Hey everyone! Welcome to ${webinarTitle}! I'm so excited you're here today. This is going to be incredibly valuable, and I promise you'll walk away with actionable strategies you can implement immediately.

While everyone is joining, let me know in the chat - where are you joining from today? And what's the #1 challenge you're hoping to solve?"

**Build Connection:**
- Welcome attendees by name as they join
- Acknowledge their challenges and goals
- Create a safe, engaging environment
- Set expectations for the session

**Housekeeping:**
"Quick housekeeping - this webinar will be about [X] minutes. We'll have time for Q&A, and yes, this will be recorded and sent to you afterward. Feel free to ask questions in the chat anytime - I'll address them throughout."

---

### PHASE 2: INTRODUCTION & CREDIBILITY (5-10 minutes)

**Your Story:**
"Let me tell you why I created this webinar. ${webinarDescription ? webinarDescription : 'I\'ve seen too many people struggle with [problem], and I know there\'s a better way.'}

[Share brief personal story or case study that demonstrates expertise and relatability]"

**What You'll Learn:**
"By the end of this session, you'll discover:
${tags.length > 0 ? tags.map((tag, i) => `${i + 1}. ${tag}`).join('\n') : '1. The exact framework to solve your biggest challenge\n2. Real-world examples of success\n3. A clear action plan to get started today'}

And most importantly, you'll understand exactly how to ${ctaType === 'BOOK_A_CALL' ? 'get personalized help implementing this' : 'access the complete solution'}."

**Social Proof:**
"I've helped [X number] of people/companies achieve [specific result]. For example, [specific success story with numbers and outcomes]."

---

### PHASE 3: PROBLEM AGITATION (10-20 minutes)

**Identify the Problem:**
"Let's talk about the elephant in the room. How many of you have experienced [specific pain point]? Type 'YES' in the chat if this resonates."

**Agitate the Pain:**
- Describe the current situation in vivid detail
- Quantify the cost of inaction (time, money, opportunity)
- Show empathy: "I know how frustrating this is..."
- Use stories of past clients who had this problem

**Common Mistakes:**
"Most people try to solve this by [common approach], but that rarely works because [reason]. Let me show you why..."

[Present 2-3 common mistakes and why they fail]

---

### PHASE 4: SOLUTION INTRODUCTION (20-35 minutes)

**The Framework:**
"Here's the system that changes everything: [Your Framework Name]

It works in [3-5] simple steps:

**Step 1: [Name]**
[Detailed explanation with examples]
- Why this matters: [benefit]
- How to implement: [actionable steps]
- Common pitfall to avoid: [warning]

**Step 2: [Name]**
[Detailed explanation with examples]
- Why this matters: [benefit]
- How to implement: [actionable steps]
- Results you can expect: [outcomes]

**Step 3: [Name]**
[Detailed explanation with examples]
- Why this matters: [benefit]
- How to implement: [actionable steps]
- Time frame for results: [timeline]

[Continue for all steps]"

**Proof & Results:**
"Don't just take my word for it. Let me show you real results:
- [Client/Customer 1]: Achieved [specific result] in [timeframe]
- [Client/Customer 2]: Increased [metric] by [percentage]
- [Client/Customer 3]: Went from [before state] to [after state]

[Show screenshots, testimonials, data if available]"

**Live Demonstration:**
"Let me show you exactly how this works in practice..."
[Provide detailed walkthrough, screen share if applicable]

---

### PHASE 5: ENGAGEMENT & Q&A (35-45 minutes)

**Interactive Element:**
"Now I want to hear from you. Let's do a quick poll: [Relevant question]"

**Address Questions:**
Monitor chat actively and address questions like:

**Q: "Will this work for [specific situation]?"**
A: "Absolutely! In fact, this is especially powerful for [their situation] because [specific reason]. Let me give you an example..."

**Q: "How long does it take to see results?"**
A: "Great question! Most people see [initial results] within [timeframe], and [full results] within [longer timeframe]. The key is [specific factor]."

**Q: "What if I've tried similar things before?"**
A: "I hear you. The difference here is [unique differentiator]. Plus, you'll have [support/resources] to ensure success."

---

### PHASE 6: THE OFFER (45-55 minutes)

**Transition to CTA:**
"Now, I know what you're thinking - 'This is great, but how do I actually get started?'

That's exactly what I want to talk about next. Because knowing this information is one thing, but having the right support to implement it successfully is another."

**Present the Solution:**
${ctaType === 'BOOK_A_CALL' ? `
"I\'d love to offer you a complimentary strategy session where we can:
- Dive deep into your specific situation
- Create a custom action plan
- Identify the fastest path to your goals
- Determine if we're a good fit to work together

This isn't a sales call - it's a genuine opportunity for you to get personalized advice from me directly."
` : `
"I've packaged everything we\'ve discussed today - plus tools, templates, and ongoing support - into a comprehensive program called [Program Name].

Here's everything you get:
- [Specific deliverable 1]
- [Specific deliverable 2]
- [Specific deliverable 3]
- [Bonus 1]
- [Bonus 2]
- [Guarantee]

The investment is normally [higher price], but for attendees of this webinar today only, you can get started for just [special price]."
`}

**Create Urgency:**
"Here's what makes this time-sensitive: ${ctaType === 'BOOK_A_CALL' ? 'I only have [X] consultation slots available this week, and they fill up fast. Once they\'re gone, the next available time isn\'t until [later date].' : 'This special pricing is only available for the next [24/48] hours. After that, the price goes back up to [regular price].'}"

**Risk Reversal:**
"And just so you feel completely comfortable, ${ctaType === 'BOOK_A_CALL' ? 'there\'s absolutely zero obligation. If we get on the call and it\'s not a fit, no problem at all. You\'ll still walk away with valuable insights.' : 'this comes with my [X-day] money-back guarantee. If you\'re not completely satisfied, just let me know and I\'ll refund every penny.'}"

**Clear CTA:**
"${ctaLabel}

${ctaType === 'BOOK_A_CALL' ? 'Click the button on your screen right now to choose your preferred time slot. I\'ll see you on our call!' : 'Click the button below to get instant access. You can start implementing this today.'}"

**Repeat CTA:**
(Say this 2-3 times during the offer section)

---

### PHASE 7: OBJECTION HANDLING (55-60 minutes)

**Common Objections:**

**"I need to think about it"**
Response: "I totally understand. What specifically do you need to think about? Is it the time commitment, the investment, or something else? Let's talk through it right now while I have you."

**"I can't afford it"**
Response: "I hear you, and here's what I'd say - can you afford NOT to solve this? What's it costing you to stay where you are? Plus, ${ctaType === 'BOOK_A_CALL' ? 'the strategy call is completely free' : 'we have payment plans available to make this accessible'}."

**"I don't have time"**
Response: "That's exactly WHY you need this. This system is designed to [save time/create efficiency]. In fact, [Client Name] was in your exact position and found this actually gave them [X hours] back per week."

**"I need to talk to my [spouse/business partner]"**
Response: "Absolutely! This is an important decision. Why don't you ${ctaType === 'BOOK_A_CALL' ? 'grab a time slot now so you don\'t miss out, and you can always reschedule if needed' : 'take advantage of the webinar pricing now, and take your time going through the material with them'}? That way you lock in today's benefits."

---

### PHASE 8: FINAL PUSH & CLOSING (60-65 minutes)

**Last Call:**
"We're at the end of our time together, and I want to make sure everyone who wants to take action gets the chance.

Let me be direct: The people who succeed are the ones who take action TODAY, not tomorrow or next week. They see an opportunity and they seize it.

Right now, you have everything you need to make this decision. You understand the problem. You know the solution. You've seen the proof.

The only question is: Are you ready to commit to your success?

${ctaLabel} - the link is in the chat and on your screen. Do it now while I'm here to answer any final questions."

**Final Questions:**
"Who has any last questions? Don't be shy - this is your chance to get clarity on anything."

[Address 2-3 final questions, always circling back to the CTA]

---

### PHASE 9: THE CLOSE (65-70 minutes)

**Express Gratitude:**
"Thank you so much for being here today and for your engagement. I know your time is valuable, and I'm honored you spent it with me.

For those of you who've already taken action and ${ctaType === 'BOOK_A_CALL' ? 'booked your call' : 'enrolled'}, congratulations! I'm excited to work with you and help you achieve [desired outcome].

For those who haven't yet, remember - ${ctaLabel}. This opportunity won't last forever."

**Promise Fulfillment:**
"As promised, I'll send you the recording of this webinar within the next 24 hours. You'll also receive [any promised resources/bonuses].

But remember - the special ${ctaType === 'BOOK_A_CALL' ? 'consultation offer' : 'pricing'} is only available during this limited window."

**Final CTA:**
"One more time - ${ctaLabel}. The link is in the chat. I'll stay on for a few more minutes if anyone has additional questions."

---

## POST-WEBINAR FOLLOW-UP SEQUENCE

**Immediately After:**
- Send thank-you email with recording
- Remind about CTA with urgency (deadline approaching)
- Share any promised resources

**24 Hours Later:**
- Email: "Did you miss something? Re-watch now + Last chance for [special offer]"
- Highlight key takeaways
- Strong CTA with countdown

**48 Hours Later:**
- Final reminder email
- Testimonials from recent clients/customers
- Very last chance messaging

---

## CONVERSATION GUIDELINES FOR AI DELIVERY

**Tone & Energy:**
- Enthusiastic but authentic
- Professional yet conversational
- Confident without being pushy
- Empathetic to attendee challenges
- High energy throughout - this is a performance!

**Pacing:**
- Vary your speed - slow down for important points
- Use strategic pauses for emphasis
- Never rush through the CTA section
- Allow time for chat responses

**Engagement Tactics:**
- Call out attendees by name
- Use interactive polls and questions
- Acknowledge chat messages: "Great question, Sarah!"
- Create participation: "Type X in chat if you agree"
- Share relevant stories and examples

**Natural Language:**
- Use contractions (I'll, don't, you're)
- Include verbal fillers naturally: "you know", "right"
- Show personality and humor when appropriate
- Avoid sounding robotic or overly scripted

**Objection Prevention:**
- Address concerns before they're raised
- Use "You might be wondering..." technique
- Provide proof at every claim
- Over-deliver on value before asking for anything

---

## KEY SUCCESS METRICS

Track these during and after the webinar:
- Number of attendees (live)
- Engagement rate (chat activity)
- Poll participation rate
- ${ctaType === 'BOOK_A_CALL' ? 'Calls booked' : 'Sales completed'}
- Conversion rate (CTA clicks / attendees)
- Average watch time
- Replay views
- Follow-up email open rates

---

## EMERGENCY SCENARIOS

**Technical Difficulties:**
"Looks like we're having some technical issues. Give me just one moment... [pause] ...and we're back! Sorry about that. Let me pick up where we left off."

**Low Engagement:**
"Hey everyone, I want to make sure this is valuable for you. Can you do me a favor and type '1' in the chat if you're still with me? Great! Now let me ask you..."

**Tough Question:**
"That's a really thoughtful question. Let me give you the most honest answer I can... [answer thoroughly and redirect to value]"

**Time Running Over:**
"I know we're going a bit long, but I want to make sure you get everything you came for. For those who need to leave, the recording will cover everything. For everyone else, let's power through these last few critical points."

---

## FINAL REMINDERS

✅ Always tie back to the transformation and outcome
✅ Use specific numbers and data when possible
✅ Tell stories - people remember stories, not facts
✅ Make the CTA clear, simple, and repeated often
✅ Remove friction from the buying/booking process
✅ Follow up relentlessly with non-converters
✅ Collect feedback to improve future webinars

**YOUR MISSION:** Help every attendee see that ${ctaType === 'BOOK_A_CALL' ? 'scheduling a call' : 'making this investment'} is the obvious next step to achieve their goals. Make it a no-brainer decision.

---

**Remember:** This isn't just a presentation - it's a transformation opportunity for your attendees. Deliver massive value, build genuine trust, and guide them confidently toward taking action on: ${ctaLabel}

Good luck! 🚀`

  return script
}
