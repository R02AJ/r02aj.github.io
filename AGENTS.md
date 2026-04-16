# AGENTS.md

## 1. Project Brief
Build and maintain a premium, static-first personal research website for Robert Jenkinson Alvarez using Astro + TypeScript.

Primary identity line:
Geometric machine learning, quantitative finance, and structure-preserving models.

The product objective is clear communication of research projects, web-native summaries, CV downloads, background, external links, and visual assets with high editorial quality.

## 2. Working Agreements
- Always preserve the premium editorial design language.
- Prefer static Astro pages with only small React islands where interactivity is necessary.
- Run the production build after meaningful implementation steps.
- Keep implementation pragmatic, readable, and maintainable.
- Do not invent technical claims beyond the content provided in prompts/content.

## 3. Design Rules
- Visual tone: restrained, premium, modern editorial.
- Large typography, disciplined whitespace, soft borders, subtle gradients/glows.
- Use alternating dark and light surfaces where meaningful; avoid all-dark monotony.
- Keep navigation minimal and footer structured.
- Keep animations subtle, performant, and optional under `prefers-reduced-motion`.
- Avoid generic portfolio clichés, giant emoji usage, or template-like sections.
- Never copy OpenAI assets, branding, logos, illustrations, exact layouts, or text.

## 4. Content Rules
- Keep copy sharp, concise, and mathematically literate.
- Every research page should include: thesis, problem, core idea, method, results, visuals, links.
- Every summary page should be web-native writing, not a PDF dump.
- Explicitly label ongoing work as ongoing and avoid over-claiming.

## 5. Build/Test Rules
- Primary package manager: npm, unless `pnpm-lock.yaml` already exists.
- Validate with production build before handoff.
- Keep static-first architecture and avoid unnecessary client JS.

## 6. Accessibility/Performance Rules
- Use semantic HTML, clear heading order, and keyboard-friendly controls.
- Maintain strong contrast and visible focus states.
- Honor reduced-motion preferences.
- Optimize for Core Web Vitals by limiting heavy effects and JS payload.

## 7. Asset & Branding Safety
Never copy or reuse OpenAI brand assets, naming, logos, illustrations, or proprietary copy. Inspiration may be taken from the level of polish and editorial discipline only.
