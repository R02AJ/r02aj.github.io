export type NavItem = {
  href: string;
  label: string;
};

const DEFAULT_SITE_URL = 'https://www.robertjenkinsonalvarez.com';
const resolvedSiteUrl = (import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE || DEFAULT_SITE_URL)
  .toString()
  .replace(/\/+$/, '');

export const siteConfig = {
  siteUrl: resolvedSiteUrl,
  name: 'Robert Jenkinson Alvarez',
  role: 'Researcher',
  tagline:
    'Geometric machine learning, quantitative finance, and structure-preserving models.',
  identityStatement:
    'Research at the intersection of geometric ML, quantitative finance, and structure-preserving modelling.',
  shortBio:
    'I work at the intersection of geometric machine learning, quantitative finance, and structure-preserving modelling. My recent work includes Hamiltonian geometry for JEPA-style representation learning, arbitrage-free option-surface construction with Chebyshev tensor bases and a Hamiltonian fog post-fit, and ongoing work on geometric stochastic modelling for spot, rates, and options.',
  email: 'mailto:robert.j.jenkinson.alvarez@bath.edu',
  socialPreview: {
    imagePath: '/social-preview.svg',
    imageAlt:
      'Robert Jenkinson Alvarez research website preview: geometric ML, quantitative finance, and structure-preserving models.',
    twitterCard: 'summary_large_image'
  },
  links: {
    email: 'mailto:robert.j.jenkinson.alvarez@bath.edu',
    github: 'https://github.com/R02AJ',
    linkedin: 'https://www.linkedin.com/in/robert-jenkinson-álvarez-9707a9224',
    arxivAuthor:
      'https://arxiv.org/search/q-fin?searchtype=author&query=Alvarez,+R+J',
    zenodo: 'https://zenodo.org/records/19006204',
    chebyshevPaper: 'https://arxiv.org/abs/2512.01967',
    hamjepaPaper: '/files/beyond_isotropy_in_jepa.pdf',
    hamjepaCode: '[PASTE_HAMJEPA_GITHUB_URL_IF_AVAILABLE]'
  },
  education: [
    {
      degree: 'MSc Financial Mathematics (Distinction)',
      institution: 'London School of Economics and Political Science',
      years: '2023-2024'
    },
    {
      degree: 'BSc Mathematics (First-Class Honours)',
      institution: 'University of Bath',
      years: '2020-2023'
    }
  ],
  nav: [
    { href: '/research', label: 'Research' },
    { href: '/about', label: 'About / CV' }
  ] as NavItem[],
  primaryNavCta: {
    href: '/',
    label: 'Home'
  },
  focusAreas: [
    {
      title: 'Geometric deep learning',
      description:
        'Structure-aware representation learning with phase-space priors, Hamiltonian geometry, and symplectic predictors for self-supervised systems.'
    },
    {
      title: 'Quantitative finance',
      description:
        'Chebyshev option-surface construction, Hamiltonian fog calibration, and Financial Hamiltonian Theory & Computational Aspects for joint surface, rate, and spot dynamics.'
    },
    {
      title: 'Geometric analysis',
      description:
        'Symmetry, rigidity, and mixed-boundary elliptic PDE, with sub-spherical-sector symmetry as the current platform problem and quantitative symplectic geometry as a longer-run bridge.'
    }
  ],
  projectOrder: [
    'hamjepa',
    'chebyshev-option-surfaces'
  ]
} as const;

export function isPlaceholderLink(href: string): boolean {
  return href.startsWith('[') && href.endsWith(']');
}

export function withBase(pathname = '/'): string {
  if (!pathname) return pathname;
  if (
    pathname.startsWith('http://') ||
    pathname.startsWith('https://') ||
    pathname.startsWith('mailto:') ||
    pathname.startsWith('tel:') ||
    pathname.startsWith('data:') ||
    pathname.startsWith('#')
  ) {
    return pathname;
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (!base) return normalizedPath;
  if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}` || '/';
}

export function toAbsoluteUrl(pathname = '/'): string {
  return new URL(withBase(pathname), `${siteConfig.siteUrl}/`).toString();
}
