/**
 * LLM Service for generating webinar selling scripts
 * Supports OpenAI and Anthropic APIs
 */

type LLMProvider = 'openai' | 'anthropic'

interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model?: string
}

interface ScriptGenerationContext {
  webinarTitle: string
  webinarDescription: string
  ctaType: string
  ctaLabel: string
  tags: string[]
  datasetContent?: string[]
  datasetNames?: string[]
}

/**
 * Generate selling script using LLM
 */
export async function generateScriptWithLLM(
  context: ScriptGenerationContext,
  config: LLMConfig
): Promise<string> {
  const prompt = buildScriptPrompt(context)

  switch (config.provider) {
    case 'openai':
      return generateWithOpenAI(prompt, config)
    case 'anthropic':
      return generateWithAnthropic(prompt, config)
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
  }
}

/**
 * Build the prompt for script generation
 */
function buildScriptPrompt(context: ScriptGenerationContext): string {
  const { webinarTitle, webinarDescription, ctaType, ctaLabel, tags, datasetContent, datasetNames } = context

  let prompt = `You are an expert sales script writer. Generate a comprehensive, conversational selling script for a webinar AI agent.

WEBINAR INFORMATION:
- Title: ${webinarTitle}
- Description: ${webinarDescription || 'Not provided'}
- Call-to-Action Type: ${ctaType}
- CTA Label: ${ctaLabel}
- Tags/Topics: ${tags.length > 0 ? tags.join(', ') : 'None specified'}

`

  if (datasetContent && datasetContent.length > 0) {
    prompt += `DATA SOURCES AVAILABLE:
The following datasets have been provided to inform the script:
${datasetNames?.map((name, i) => `\n${i + 1}. ${name}`).join('')}

DATASET CONTENT:
${datasetContent.map((content, i) => `\n--- Dataset ${i + 1} ---\n${content.substring(0, 2000)}...`).join('\n\n')}

Use this data to:
- Provide specific examples and case studies
- Reference real product/service details
- Include data-driven insights
- Make the script more personalized and credible

`
  }

  prompt += `SCRIPT REQUIREMENTS:
1. Create a natural, conversational script that an AI agent can use during a live webinar
2. Include an engaging introduction that welcomes attendees
3. Structure the script with clear sections: Introduction, Main Content, Engagement Points, Call-to-Action, Closing
4. Include specific talking points based on the webinar information
5. Add natural conversation prompts and questions to engage attendees
6. Make the CTA (${ctaLabel}) feel natural and compelling
7. Include guidance on handling common questions and objections
8. Keep the tone professional but friendly and consultative
9. Make it actionable - the AI agent should know exactly what to say and when

FORMAT:
Use markdown formatting with clear sections. Include:
- ## Section headers for major parts
- Specific dialogue examples in quotes
- Bullet points for key talking points
- Guidance on tone and delivery

Generate the complete selling script now:`

  return prompt
}

/**
 * Generate script using OpenAI API
 */
async function generateWithOpenAI(prompt: string, config: LLMConfig): Promise<string> {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not provided. Set OPENAI_API_KEY environment variable.')
  }

  const model = config.model || 'gpt-4o'
  const apiUrl = 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert sales script writer specializing in creating conversational, engaging scripts for AI-powered webinar agents. Your scripts are natural, persuasive, and data-driven.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

/**
 * Generate script using Anthropic API
 */
async function generateWithAnthropic(prompt: string, config: LLMConfig): Promise<string> {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not provided. Set ANTHROPIC_API_KEY environment variable.')
  }

  const model = config.model || 'claude-3-5-sonnet-20241022'
  const apiUrl = 'https://api.anthropic.com/v1/messages'

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system:
          'You are an expert sales script writer specializing in creating conversational, engaging scripts for AI-powered webinar agents. Your scripts are natural, persuasive, and data-driven.',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.content[0]?.text || ''
  } catch (error) {
    console.error('Anthropic API error:', error)
    throw error
  }
}

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig(): LLMConfig | null {
  // Check for OpenAI
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    }
  }

  // Check for Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    }
  }

  return null
}

