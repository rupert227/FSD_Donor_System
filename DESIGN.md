---
name: FSD Donor System
description: A calm, formal working desk for Caritas Manila donor officers, from first lead to receipt.
colors:
  caritas-maroon: "#6b0f0f"
  maroon-tint: "#fdf2f0"
  maroon-wash: "#fce8e6"
  alert-red: "#fa4454"
  canvas: "#f7f6f6"
  surface-white: "#ffffff"
  surface-soft: "#f3f2f1"
  surface-soft-hover: "#eceae8"
  surface-amber: "#fff7ed"
  warning-surface-strong: "#fef3c7"
  warning-line: "#fde68a"
  warning-icon: "#d97706"
  warning-ink: "#78350f"
  ink: "#1c1a1a"
  ink-secondary: "#5c5757"
  ink-muted: "#9ca3af"
  line-soft: "#e3dfdf"
  line-strong: "#d1d5db"
  control-stroke: "#8a8484"
  chart-navy: "#1f4e79"
  chart-sky: "#4a90d9"
typography:
  page-title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  body-strong:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
  caption:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  sm: "4px"
  button: "5px"
  dropdown: "6px"
  card: "8px"
  panel: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  page: "40px"
components:
  button-primary:
    backgroundColor: "{colors.caritas-maroon}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: "36px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: "36px"
    padding: "0 12px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-soft-hover}"
  field-select:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.dropdown}"
    height: "36px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.card}"
    padding: "20px"
  nav-tab-active:
    textColor: "{colors.caritas-maroon}"
    typography: "{typography.body}"
    padding: "0 12px"
  badge-neutral:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    height: "22px"
    padding: "0 8px"
---

# Design System: FSD Donor System

## Overview

**Creative North Star: "The Steward's Desk"**

A calm, orderly working desk for people who handle other people's generosity.
The officer sits in front of records; letters are produced on letterhead; the
Caritas maroon appears sparingly so that when it appears, it means "this is the
action" or "this is where you are". The voice is calm, formal and precise:
quiet surfaces, clear hierarchy, plain language, no playfulness. The interface
is the workshop, and the letter is the product.

Density is moderate and consistent. Pages are white cards on a warm-grey canvas,
fields are 36px tall, buttons are quiet, and every screen has one obvious
primary action. Depth comes from thin borders first and shadow only when
something floats.

**Key Characteristics:**
- Warm-grey canvas, white bordered cards, one maroon action per view.
- IBM Plex Sans throughout, small and steady type (12 to 14px in the app).
- Borders before shadows; shadows only for floating things and the letter sheet.
- The letter sheet is a separate artifact with its own size and type, not app UI.
- Desktop-first: a 1000px minimum width, no mobile layout.

## Colors

A restrained palette: one deep maroon accent, a warm-neutral ink and canvas
family, and a tiny set of functional colors.

### Primary
- **Caritas Maroon** (#6b0f0f): the brand accent. Primary buttons, the active
  navigation tab and its underline, links such as "Edit on record", the
  selected row in dropdowns, and the letterhead name. Its tints are **Maroon
  Tint** (#fdf2f0, selected backgrounds) and **Maroon Wash** (#fce8e6, avatar
  and initials backgrounds).

### Functional
- **Alert Red** (#fa4454): notification count badges and required-field stars.
- **Chart Navy** (#1f4e79) and **Chart Sky** (#4a90d9): the two bar colors in
  charts and reports; never used for interface chrome.

### Neutral
- **Canvas** (#f7f6f6): the page background behind every card.
- **Surface White** (#ffffff): cards, fields, the navbar and the letter sheet.
- **Surface Soft** (#f3f2f1) and **Soft Hover** (#eceae8): search fields,
  grey viewers, and the hover state of every quiet control.
- **Surface Amber** (#fff7ed): warm highlight surface for attention states.
  Its companions are **Warning Surface Strong** (#fef3c7, hover and the
  highlight behind unfilled prompts), **Warning Line** (#fde68a, borders),
  **Warning Icon** (#d97706, the warning triangle and page-break line) and
  **Warning Ink** (#78350f, text on amber). Use these theme tokens, never raw
  Tailwind `amber-*`.
- **Ink** (#1c1a1a): primary text. **Ink Secondary** (#5c5757): labels and
  helper text. **Ink Muted** (#9ca3af): placeholders and disabled hints only; at about 2.4:1
  it fails contrast on white, so it is never used for text a person must read.
- **Line Soft** (#e3dfdf): card and section borders. **Line Strong**
  (#d1d5db): dividers under the navbar and around quiet buttons.
  **Control Stroke** (#8a8484): the darker border on fields and dropdowns so
  they read as editable.

### Named Rules
**The One Maroon Rule.** Maroon marks the single primary action per view, the
active tab and links. It is never used as a background for large areas and
never as decoration.

**The Editable Looks Editable Rule.** Only editable fields get the darker
Control Stroke border. Saved data is shown as label over value with no box.

## Typography

**Display Font:** IBM Plex Sans (with sans-serif)
**Body Font:** IBM Plex Sans (with sans-serif)

**Character:** One humanist sans at small, steady sizes. Hierarchy comes from
weight (400, 500, 600) and the ink colour, not from size jumps.

### Hierarchy
- **Page Title** (600, 22px, 28px line): one per page, beside the object icon.
- **Body** (400, 14px, 20px line): field values, paragraphs and table text.
- **Body Strong** (600, 14px, 20px line): section headings inside cards such
  as "From the prospect record".
- **Label** (500, 13px, 18px line): field labels, button text, tab text.
- **Caption** (400, 12px, 16px line): helper text, breadcrumbs, badges, in Ink
  Secondary. 12px is the smallest size in the builder.

### Named Rules
**The Letter Has Its Own Type Rule.** The letter sheet is set at 11pt body with
a 1.5 line height, a 28px bold maroon "CARITAS MANILA" and a 9pt footer. These
sizes belong to the printed document and never feed back into the app scale.

## Layout

An app shell with a fixed top navbar (brand, global search, notifications,
profile) and a second row of module tabs, above a `main` area with 40px
(2.5rem) padding on the warm-grey canvas. The shell sets a 1000px minimum width.
Content is a column of white cards separated by 20px gaps.

Forms live in cards with 20px padding and 20px between fields; a card footer
carries the actions, right-aligned, separated by a thin border. The proposal
builder is a two-column page at 1024px and wider: a fixed details card (420px, 460px from 1280px wide)
and a flexible preview card; below that it stacks.

Spacing steps in use: 4, 8, 12, 16, 20, 24, 40 px.

## Elevation & Depth

Hybrid, leaning flat. Surfaces rest flat on the canvas with a thin border and at
most a barely-there shadow. Real shadows appear only on things that float:
dropdown lists and the letter sheet.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04)`): the default
  whisper under cards and the search field.
- **Small** (Tailwind `shadow-sm`): the most common card shadow in the app.
- **Large** (Tailwind `shadow-lg`): dropdown menus.
- **Sheet** (`0 2px 6px rgba(28, 26, 26, 0.08), 0 8px 24px rgba(28, 26, 26, 0.12)`):
  the letter page in the preview viewer, from the Figma design.

### Named Rules
**The Borders Before Shadows Rule.** To separate a surface, add a Line Soft
border first. Use a shadow only when the element visibly floats above others.

## Shapes

Gently rounded, never pill-shaped except avatars and count badges. Buttons use
5px, dropdowns and fields 6px, cards 8px (the team's panel token is 10px),
badges 4px. Borders are 1px; the only 2px line is the active tab underline.

## Components

### Buttons
- **Shape:** gently rounded (5px, `--button-radius`); 36px tall in the app.
- **Primary:** Caritas Maroon background, white 13px/500 text, 16px side
  padding; hover lowers opacity to 90%. One per view (for example "Generate
  proposal").
- **Secondary:** white background, 1px Line Strong border, Ink text; hover is
  Soft Hover.
- **Icon button:** 32px square, no border, Soft Hover on hover.
- **Cursor:** every button and select shows the hand cursor (`cursor-pointer`);
  Tailwind v4 resets it, so it is added per element. Navigation uses `<Link>`.

### Cards / Containers
- **Corner Style:** 8px (panel token 10px).
- **Background:** Surface White on the Canvas.
- **Border:** 1px Line Soft.
- **Internal Padding:** 20px; footer separated by a top border, 16px by 20px.

### Inputs / Fields
- **Style:** 36px tall, white, 1px Control Stroke border, 6px radius, 14px text.
- **Labels:** 13px/500 above the control with an 8px gap; a required field adds
  a red `*`; helper text is 12px Ink Secondary below.
- **Read-only data:** label (13px/500, Ink Secondary) over value (14px), no box.
- **Disabled:** reduced opacity and a not-allowed cursor.

### Navigation
- **Style:** a module switcher on the left, then text tabs at 14px/500.
- **Active:** Caritas Maroon text with a 2px maroon underline; inactive tabs are
  Ink and gain Soft Hover.
- **Inside a card:** the Preview / Edit tabs repeat the same underline pattern.
  They are real tabs (`role="tab"`, `aria-selected`, a linked `tabpanel`), and
  the Left and Right arrow keys move between them.

### Readiness Checklist
A white, Line Soft bordered card titled "Before you generate" with one row per
fact that can need action: Length and Prompts (the signatory is already
shown by its own select, so it has no row). Each row is a status icon (check, warning
triangle, or dash for "not known yet"), a 13px label in Ink Secondary and the
value. Only a row that needs action gets color (Warning Icon, bold value). Each
leftover prompt is an amber-outlined button showing its full text. Rows are
computed from the current letter on every render, never stored.

### Motion and Focus
- **Motion:** short and calm. Colors ease over 150ms on controls; the "Show
  all" block slides open over 200ms (grid row `0fr` to `1fr`, with `inert`
  while closed); notices fade and drop a few pixels in; the sheet eases between
  zoom levels over 200ms, only right after a zoom click. Under
  `prefers-reduced-motion` everything in the builder is turned off, and nothing
  animates in print. Wrapper class: `ui-motion`.
- **Confirmations:** questions about losing work are asked in the page, never
  with the browser dialog. An amber panel above the footer names the risk and
  offers two outlined buttons; the safe one ("Keep my edits", "Keep editing")
  takes focus first, and Escape closes the panel.
- **Focus:** one maroon 2px keyboard-focus ring with a 2px offset on every
  button, link, select and input, from the `focus-scope` wrapper class. The
  letter text box keeps its own ring.

### Status Badge
- **Style:** 22px tall, 4px radius, 12px/500, a 6px dot, Surface Soft
  background with a Line Soft border.

### Letter Sheet (signature component)
A real US Letter page (816 by 1056 px at 96 dpi) with Caritas letterhead: the
logo, "CARITAS MANILA" in maroon, a black "Social Services and Development
Ministry" band, a maroon hairline, 1-inch side margins, and a gray address
footer. It scales with zoom, prints at true size with `@page` set to 8.5 by 11
in, and marks unfilled `[prompts]` and `{placeholders}` on screen with a soft
Warning Surface Strong tint and a dotted Warning Icon underline (no bold). The
marks are an editing aid and do not print.

## Do's and Don'ts

### Do:
- **Do** keep one maroon primary action per view and use the Secondary style
  for everything else.
- **Do** use the shared tokens (`brand-primary`, `border-border-soft`,
  `surface-soft-hover`, `text-text-secondary`) and the existing 36px control
  height before inventing new values.
- **Do** mark non-document chrome with `no-print` so only the letter prints.
- **Do** keep the letterhead out of a `<header>` element; the team's print CSS
  hides every `<header>`.
- **Do** run Prettier (with the Tailwind plugin) on files you change.
- **Do** measure the sheet before the browser paints (a layout effect) so
  switching Preview and Edit never shows a frame at the old height.

### Don't:
- **Don't** use maroon for large backgrounds or decoration.
- **Don't** add shadows to flat cards; add a border instead.
- **Don't** resize the letter's type to fit the app scale, or the app's type to
  fit the letter.
- **Don't** show editable and read-only values in the same style.

## Known Gaps (builder vs Figma)

The code is the authority for the system. Figma is the design target and a
reference, not a strict 1:1 spec, including in the modules Leon develops
(Donor Conversion and its proposal builder). These notes record where the
builder knowingly differs, so each difference is a choice and not an accident.
- **Page title font:** Figma uses Poppins SemiBold; the app has only IBM Plex
  Sans loaded.
- **Control height and radius:** the team's pages use 36px and 5px; the builder
  follows Figma's 32px buttons with 6px radius in its footer and toolbar.
- **Field border:** Figma `#8a8484` matches `control-stroke`; the team's
  `border-strong` is the lighter `#d1d5db`.
- **Notices:** the builder's amber notices now use the warning tokens in
  `globals.css`; Figma's blue info notice was dropped in favour of the
  Readiness Checklist.
- **Eyebrow and breadcrumb:** Figma shows a "Proposals" label above the title;
  the builder omits it, and uses a "← Proposals" back link at the start of
  the title row (before the icon, with a thin divider) instead of a breadcrumb,
  so the page name is not repeated.
