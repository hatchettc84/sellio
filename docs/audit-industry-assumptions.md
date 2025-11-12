# Industry-Specific Assumption Audit

_Date: 2025-11-10_

This document highlights the areas of the current Spotlight implementation that assume a webinar-focused SaaS, along with recommended actions to generalize the platform for the multi-tenant marketplace vision.

## Summary

| Area | Observation | Impact | Recommendation |
| --- | --- | --- | --- |
| Navigation & UI copy | Multiple components hardcode "webinar", "leads", and webinar-specific CTAs (e.g. `src/components/ReusableComponent/LayoutComponents/Header.tsx`, `src/lib/data.ts`). | Limits branding flexibility and confuses non-webinar tenants. | Replace hardcoded copy with feature-flagged labels sourced from tenant configuration. |
| Data model | Prisma models such as `Webinar`, `Attendance`, and onboarding steps reference webinar-specific workflows. | Couples persistence to webinar domain and complicates schema reuse. | Introduce abstract entities (e.g. `Engagement`, `Session`) or plan migration path to tenant-defined product types. |
| Workflow/Onboarding | `OnBoarding.tsx` guides users through Stripe connection, AI agent creation, and webinar creation in a fixed order. | Prevents alternate onboarding paths (e.g. datasets-first tenants). | Convert onboarding steps to tenant-configured checklist stored per tenant tier. |
| API routes | `/api/stripe-webhook`, `/api/stripe-connect`, and `src/action/webinar.ts` expose webinar-specific functionality without tenant guards. | Hard to extend for other product types and lacks consistent isolation. | Create generalized product onboarding APIs and gate by tenant feature flags. |
| Email templates | `src/lib/webinarStartEmailTemplate.tsx` sends webinar-branded messaging. | Breaks immersion for tenants selling different services/software. | Externalize templates and allow tenant-provided copy via CMS or config. |
| Marketing assets | `public/` assets (e.g. `glowCard.png`, `ilfthumbnail.png`) reference webinar imagery. | Limits ability to reskin experience per tenant vertical. | Support tenant-specific asset bundles stored in object storage. |

## Detailed Findings

### 1. UI & Navigation
- `src/lib/data.ts`: `sidebarData` titles (Home, Webinars, Leads, AI Agents, Settings) assume a CRM + webinar workflow.
- `src/components/ReusableComponent/LayoutComponents/Header.tsx`: references "Next webinar" and webinar-specific quick actions.
- `src/app/(protectedRoutes)/webinars/*`: entire route group dedicated to webinars; breadcrumbs, CTA copy, and empty states mention webinars explicitly.
- `src/app/(protectedRoutes)/lead/page.tsx`: "The home to all your customers" but data model tied to webinar funnel tags.

**Recommendation:** introduce tenant-specific navigation config (stored in `TenantRuntimeConfig` or a CMS) and refactor layout components to consume dynamic labels/icons.

### 2. Data & Domain Models
- Prisma schema contains `Webinar`, `Attendance`, `Attendee`, `CallStatusEnum`, `CtaTypeEnum` tied to webinar events.
- Onboarding actions in `src/action/onboarding.ts` track "connectStripe", "createAiAgent", "createWebinar" booleans.
- `src/action/webinar.ts` interacts with webinar-specific flows, including CTA creation and Stream video integration.

**Recommendation:** plan a migration that maps `Webinar` to a generic `OfferingSession` (or similar). Consider feature toggles to hide webinar fields for non-webinar tenants.

### 3. Integrations & External Services
- Stream video client (`src/lib/stream/`), Stripe webhook (`src/app/api/stripe-webhook/route.ts`), and `scripts/provision-tenant.mjs` assume webinar livestreaming and Stripe-based monetization.
- AI agents (`src/lib/tenant/provisioning.ts`) seeded with scripts referencing webinar demo data.

**Recommendation:** isolate integrations behind tenant capability flags (e.g. `videoStreaming`, `paymentProcessing`) and provide adapters per tenant.

### 4. Communication Templates
- `src/lib/webinarStartEmailTemplate.tsx` uses webinar language ("Your webinar is about to start").
- Automated emails in `src/action/resend.ts` assume webinar attendees.

**Recommendation:** store email templates per tenant with merge variables instead of hardcoded JSX.

### 5. Marketing & Static Assets
- `public/featurecard.png`, `public/temporaryvideo.mp4`, `public/ilfthumbnail.png` depict webinar-focused screens.
- `README.md` markets the app as "AI Webinar SaaS".

**Recommendation:** move marketing collateral to tenant-specific directories and update documentation to describe the multi-tenant platform.

## Next Steps
1. Define tenant metadata schema (e.g. capabilities, preferred terminology) and update UI components to consume it.
2. Introduce abstraction layer for webinar-centric models; evaluate database migration strategy before onboarding new industries.
3. Create localization/resource files for key UI strings to avoid hardcoded references.
4. Inventory third-party integrations per tenant type and wrap them behind service interfaces with feature flags.
5. Plan communication template overhaul so tenants can supply branding and copy.

