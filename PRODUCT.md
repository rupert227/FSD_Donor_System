# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Caritas Manila donor officers, each working one unit's module day to day:
Donor Conversion (turning prospects into donors), Donor Retention (renewals
and existing donors) and Donor Care (transactions, receipts, duplicate
records). A Division Head oversees all units through reports and the
dashboard. The schema also defines a System Administrator role. Officers work
at desktop browsers.

## Product Purpose

One system that carries a donor from first lead to receipt: track a prospect
through the pipeline, produce the proposal and renewal letters on Caritas
letterhead, record transactions and issue receipts, and report on all of it.
Success is that an officer can finish each of these tasks inside the app. The
project is judged in the team's ISANDE1 course evaluation.

## Positioning

The prospect and donor records are the single source of truth: letters fill
themselves in from the record, the officer can still edit the final text, and
the pipeline stage changes when a letter is sent, not when it is drafted.

## Operating Context

- Modules and routes: Dashboard, Donor Conversion (`/donor-conv`: Prospects,
  Proposals, Reports), Donor Retention (`/donor-retn`: Donors, Renewals,
  Reports), Donor Care (`/donor-care`: Transactions, Receipts, Duplicates,
  Reports), plus Notifications and Preferences.
- Pipeline stages: New Lead, Under Research, Outreach Started, Proposal Sent,
  Secured Donor. A proposal can be made once outreach has started.
- Letters are customized per prospect. The officer previews, may edit the
  text, downloads a PDF (browser print, US Letter 8.5 x 11 in), and sends it.
  Generating saves the final letter text; sending sets the proposal and
  pipeline status.
- Letter length: one page by default, because long letters are a burden to
  read; the officer may override and allow more pages.
- The team's reports already use the same print-to-PDF approach.

## Capabilities and Constraints

- Built by a student team of four as an academic prototype. It runs on sample
  data until Supabase access arrives; nothing may claim real donors or real
  sending. Database design is approved by the team's backend developer.
- Stack: Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
  primitives, Lucide icons, Postgres (Docker locally, Supabase planned).
- Desktop-first; `html, body` have a 1000px minimum width and there is no
  mobile requirement.
- Philippine context: amounts in pesos (PHP), Philippine addresses and phone
  formats, and a formal tone suited to a Catholic social-service organisation.
- Terminology: prospect, donor, officer, signatory, proposal, renewal, receipt,
  pipeline stage.
- Undecided: where signatories come from; honorific and surname data for
  salutations (the default is honorific plus surname, otherwise the full
  name); the key of the "sender" story in Jira; sign-in (DTI0-4) is not built.

## Brand Commitments

Caritas Manila's name, logo and letterhead are used as given, and letters
follow the real template wording (for example the closing "In opus interesti,"
and the Matthew 25:40 quotation).

## Evidence on Hand

- Logo: `public/caritas_logo.png`.
- Real proposal letter template (the "Corporate funding request" wording),
  supplied by the team.
- Sample prospects: `src/lib/mock-data/leads.ts`. Sample officers, templates
  and signatories: `src/lib/sample-data.ts`.
- Database design: `docs/01-schema.md` and `supabase/schema.sql`.
- Absent, so never fabricate: real donor data, real officer contact details
  (sample ones are made up except one officer's title and email from the real
  template), a database connection, authentication, a real signatory list.

## Product Principles

- The record is the source of truth: prefer filling from saved data, and send
  the officer to correct the record, not retype it.
- The officer has the last word: generated letters stay editable, and checks
  warn and offer Continue instead of blocking.
- Status follows real events: nothing moves to "Proposal Sent" until the letter
  is sent.
- Exhaust sensible fallbacks before asking: use known officer and prospect
  details first, and leave a visible `[prompt]` only when nothing matches.
- Respect the reader of the letter: short, formal, and correct for a Philippine
  Catholic organisation.
