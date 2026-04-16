
# Personal Website

Premium static Astro site for research projects, web-native summaries, CV downloads, and contact surfaces.

## Stack
- Astro + TypeScript
- Tailwind CSS (v4)
- MDX content collections
- React islands for constrained interactivity
- Motion for subtle client-side storytelling modules

## Prerequisites
- Node `>=22.12.0` (required by this repo)
- npm (project uses `package-lock.json`)

## Install
```bash
npm install
```

## Development
```bash
npm run dev
```

## Production Build
```bash
npm run build
```

## Type + Astro Diagnostics
```bash
npm run astro -- check
```

## Preview Build
```bash
npm run preview
```

## Route Map
- `/`
- `/research`
- `/research/hamjepa`
- `/research/chebyshev-option-surfaces`
- `/research/geometric-stochastic-modelling`
- `/summaries`
- `/summaries/hamjepa`
- `/summaries/chebyshev-option-surfaces`
- `/cv`
- `/about`
- `/404`
- `/sitemap.xml`
- `/robots.txt`

## Content Locations
- Projects: `src/content/projects/*.mdx`
- Summaries: `src/content/summaries/*.mdx`
- Site-wide identity/links: `src/data/site.ts`
- SEO/layout shell: `src/layouts/BaseLayout.astro`

## Pre-Launch Replacements
1. Set final site URL:
- Update `siteUrl` in `src/data/site.ts`.
- Update `site` in `astro.config.mjs`.

2. Replace link placeholders:
- `siteConfig.links.hamjepaPaper` in `src/data/site.ts`
- `siteConfig.links.hamjepaCode` in `src/data/site.ts`

3. Add CV PDFs (optional but recommended):
- Put source files named:
  - `RJenAlv_cv.pdf`
  - `RobJenAlv_cv.pdf`
- The `/cv` route auto-copies them to:
  - `public/files/robert-jenkinson-alvarez-quant-cv.pdf`
  - `public/files/robert-jenkinson-alvarez-research-cv.pdf`

4. Add figure/media assets:
- Place files in `public/images`.
- Research pages auto-surface relevant files by explicit names and keyword matching.

5. Social preview image:
- Default: `public/social-preview.svg`
- Replace with your own image if desired and update `siteConfig.socialPreview`.

## SEO and Structured Data
- Canonical URLs are emitted from the configured site URL.
- Open Graph and Twitter metadata are generated in `BaseLayout`.
- JSON-LD:
  - `Person` schema on `/` and `/about`
  - `ScholarlyArticle`-like schema on research project pages (or `CreativeWork` for ongoing work)
- Sitemap generated at `/sitemap.xml`.
- Robots policy generated at `/robots.txt`.

## Accessibility and Motion
- Semantic landmarks and skip link included in global layout.
- Visible focus states are defined globally.
- Mobile menu supports keyboard interaction and `Escape`.
- Reduced motion is respected in CSS animations, reveal effects, and Motion islands.

## Performance Notes
- Static-first rendering by default.
- Motion/React islands are loaded only where needed (`client:visible`).
- Figure components use stable aspect ratios to reduce CLS.
- Non-critical media is lazy-loaded.

## Optional Analytics Integration
Recommended insertion point:
- `src/layouts/BaseLayout.astro` inside `<head>` (for script tags)
- or before `</body>` for deferred client analytics scripts

Keep analytics opt-in and privacy-conscious.

## GitHub Pages Deployment
This repository is a GitHub Pages user site for `R02AJ/r02aj.github.io`.

- Site URL: `https://r02aj.github.io/`
- Astro `site`: `https://r02aj.github.io`
- No Astro base path is used (`/` root deploy)
- Deployment workflow: `.github/workflows/deploy.yml`
- Pushes to `main` trigger deployment

Required GitHub setting:
1. Open `Settings -> Pages`.
2. Set `Source` to **GitHub Actions**.

