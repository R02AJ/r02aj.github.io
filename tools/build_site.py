from __future__ import annotations

import html
import json
import os
import re
import subprocess
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/robjenkinson/Documents/Website")
OLD_DIAGRAM_FRAGMENTS = ROOT / "assets/generated-diagrams/hamjepa-old-astro-fragments.json"

SITE = {
    "name": "Robert Jenkinson Álvarez",
    "name_ascii": "Robert Jenkinson Alvarez",
    "role": "Researcher",
    "email": "mailto:robert.j.jenkinson.alvarez@bath.edu",
    "github": "https://github.com/R02AJ",
    "linkedin": "https://www.linkedin.com/in/robert-jenkinson-álvarez-9707a9224",
    "arxiv_author": "https://arxiv.org/search/q-fin?searchtype=author&query=Alvarez,+R+J",
    "zenodo": "https://zenodo.org/records/19006204",
    "cheb_arxiv": "https://arxiv.org/abs/2512.01967",
    "hamjepa_code": "https://github.com/R02AJ/HamJEPA-HamSIGReg",
}

NAV_DOT_COLORS = {
    "home": "#f59e0b",
    "research": "#8aa6cf",
    "resume": "#7f9f87",
    "about": "#c88774",
}

PROJECTS = {
    "hamjepa": {
        "short": "HamJEPA",
        "title": "Beyond Isotropy in JEPAs: Hamiltonian Geometry and Symplectic Prediction",
        "category": "Geometric ML",
        "abstract": (
            "JEPAs usually target an isotropic latent cloud; HamJEPA instead predicts between views "
            "with a symplectic map on phase space."
        ),
        "metrics": [
            "ImageNet-100 q linear probe: 31.92 vs 24.40",
            "q kNN: 24.92 vs 20.10 at 45 epochs",
        ],
        "links": [
            ("Project page", "research/hamjepa.html", False),
            ("Technical summary", "research/hamjepa.html#technical-summary", False),
            ("Visual guide", "research/hamjepa.html#visual-guide", False),
            ("Paper PDF", "assets/files/beyond_isotropy_in_jepa.pdf", True),
            ("Zenodo", SITE["zenodo"], True),
        ],
        "paper_pdf": "assets/files/beyond_isotropy_in_jepa.pdf",
        "summary_pdf": "assets/files/summary_hamjepa.pdf",
        "hero": "assets/images/hamjepa/energy_drift_heatmap_sigreg_vs_hamjepa.png",
    },
    "chebyshev-option-surfaces": {
        "short": "Chebyshev option surfaces",
        "title": "Arbitrage-Free Option Price Surfaces via Chebyshev Tensor Bases and a Hamiltonian Fog Post-Fit",
        "category": "Quantitative Finance",
        "abstract": (
            "We fit an arbitrage-carrying forward-discounted call surface directly in price space, "
            "enforce static no-arbitrage through sparse linear operators, and use a local fog layer where quotes are inconsistent."
        ),
        "metrics": [
            "98–99% inside-spread coverage",
            "<1% static no-arb violations",
        ],
        "links": [
            ("Project page", "research/chebyshev-option-surfaces.html", False),
            ("Technical summary", "research/chebyshev-option-surfaces.html#technical-summary", False),
            ("Visual guide", "research/chebyshev-option-surfaces.html#visual-guide", False),
            ("Paper PDF", "assets/files/Arbitrage_Free_Option_Price_Surfaces.pdf", True),
            ("arXiv", SITE["cheb_arxiv"], True),
        ],
        "paper_pdf": "assets/files/Arbitrage_Free_Option_Price_Surfaces.pdf",
        "summary_pdf": "assets/files/summaries/chebyshev-technical-summary.pdf",
        "hero": "assets/images/chebyshev/00_hero_price_sheet.png",
    },
}

ONGOING = [
    (
        "Financial Hamiltonian Theory & Computational Aspects",
        "Quantitative finance",
        "A Hamiltonian state space for spot, rates, volatility factors, and option sheets, with symplectic time stepping and no-arbitrage checks built in.",
    ),
    (
        "Hamiltonian Fog Calibration of Arbitrage-Free Option Surfaces",
        "Quantitative finance",
        "A local post-fit for quote regions the global surface cannot reconcile: a price sheet coupled to a fog density over (m, τ, u).",
    ),
    (
        "Self-Minkowski billiard rigidity",
        "Geometric analysis",
        "A geometric-analysis project on whether total integrability of the self-Minkowski billiard in K = {N ≤ 1} forces the norm N to be Euclidean, equivalently K to be a centered ellipse after a linear change of coordinates.",
    ),
]


def rel(depth: int, path: str) -> str:
    if path.startswith(("http://", "https://", "mailto:")):
        return path
    return "../" * depth + path


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write(path: str, content: str) -> None:
    out = ROOT / path
    ensure_parent(out)
    out.write_text(content, encoding="utf-8")


def escape_attr(value: str) -> str:
    return html.escape(value, quote=True)


def link_button(label: str, href: str, depth: int, external: bool = False, icon: str | None = None) -> str:
    target = ' target="_blank" rel="noreferrer noopener"' if external or href.startswith("http") else ""
    icon_html = f' <i class="{icon}"></i>' if icon else ""
    return f'<a href="{escape_attr(rel(depth, href))}" class="button icon"{target}>{html.escape(label)}{icon_html}</a>'


def nav(active: str, depth: int) -> str:
    items = [
        ("Home", "index.html", "home"),
        ("Research", "research.html", "research"),
        ("CV", "resume.html", "resume"),
        ("About", "about.html", "about"),
    ]
    links = "\n".join(
        f'<a class="{"active" if key == active else ""}" href="{rel(depth, href)}" data-dot-color="{NAV_DOT_COLORS[key]}">{label}</a>'
        for label, href, key in items
    )
    return f"""
    <div class="nav-bar">
      <div class="nav-container-small container">
        <a class="mobile-brand" href="{rel(depth, 'index.html')}" aria-label="Home">{SITE['name']}</a>
        <button class="menu-bar mobile-menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-mobile-menu">
          <span class="menu-default" aria-hidden="true">
            <svg viewBox="0 0 100 100" focusable="false">
              <path d="M18 32H82"></path>
              <path d="M18 50H82"></path>
              <path d="M18 68H82"></path>
            </svg>
          </span>
        </button>
      </div>
      <div class="nav-container container" id="site-mobile-menu">
        <nav class="menu" aria-label="Primary navigation">
          {links}
          <span class="menu-dot" aria-hidden="true"></span>
        </nav>
        <div class="social" aria-label="Social links">
          <span class="icon"><a href="{SITE['github']}" target="_blank" rel="noreferrer noopener" aria-label="GitHub"><i class="fa-brands fa-github"></i></a></span>
          <span class="icon"><a href="{SITE['linkedin']}" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn"><i class="fa-brands fa-linkedin"></i></a></span>
        </div>
      </div>
    </div>
    """


def mathjax_head() -> str:
    return """
    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({
        jax: ["input/TeX", "output/SVG"],
        extensions: ["tex2jax.js"],
        TeX: {
          extensions: ["AMSmath.js", "AMSsymbols.js"]
        },
        SVG: {
          scale: 95,
          font: "TeX",
          linebreaks: { automatic: true }
        },
        tex2jax: {
          inlineMath: [ ['$','$'], ["\\\\(","\\\\)"] ],
          displayMath: [ ['$$','$$'], ["\\\\[","\\\\]"] ],
          processEscapes: true
        }
      });
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_SVG"></script>
    """


def page(
    title: str,
    description: str,
    active: str,
    body: str,
    depth: int = 0,
    toc: bool = False,
    mathjax: bool = False,
    paper_visuals: bool = False,
) -> str:
    prefix = "../" * depth
    navbar = ""
    math_head = mathjax_head() if mathjax else ""
    paper_css = f'  <link rel="stylesheet" type="text/css" media="all" href="{prefix}assets/Web_assets/paper-kinetic-visual.css">\n' if paper_visuals else ""
    paper_script = f'  <script type="module" src="{prefix}assets/scripts/paper-visual-init.js"></script>\n' if paper_visuals else ""
    return f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{escape_attr(description)}">
  <meta name="robots" content="all">
  <title>{html.escape(title)}</title>
  <link rel="shortcut icon" type="image/x-icon" href="{prefix}favicon.ico">
  <link rel="stylesheet" type="text/css" media="all" href="{prefix}assets/stylesheets/main_free.css">
  <link href="{prefix}assets/fontawesome-free-7.2.0-web/css/all.min.css" rel="stylesheet">
{paper_css.rstrip()}
  <link rel="stylesheet" type="text/css" media="all" href="{prefix}assets/stylesheets/robert-clarity.css">
  <link rel="stylesheet" type="text/css" media="all" href="{prefix}assets/stylesheets/old-astro-hamjepa-diagrams.css">
  {navbar}
  {math_head}
</head>
<body class="page-{active}" style="--nav-dot-color: {NAV_DOT_COLORS.get(active, NAV_DOT_COLORS['home'])};">
  {nav(active, depth)}
  {body}
  {footer(depth)}
  <script src="{prefix}clarity/clarity.js"></script>
  <script src="{prefix}assets/scripts/main.js"></script>
  <script src="{prefix}assets/scripts/site.js"></script>
{paper_script.rstrip()}
</body>
</html>
"""


def footer(depth: int) -> str:
    return f"""
    <footer>
      <div class="container site-footer-inner">
        <p>© {SITE['name']}. Built on the <a href="https://shikun.io/projects/clarity" target="_blank" rel="noreferrer noopener">Clarity Template</a>, thanks to Shikun Liu.</p>
        <p><a href="{SITE['email']}">Email</a> · <a href="{SITE['github']}" target="_blank" rel="noreferrer noopener">GitHub</a> · <a href="{SITE['linkedin']}" target="_blank" rel="noreferrer noopener">LinkedIn</a></p>
      </div>
    </footer>
    """


def metrics(items: list[str]) -> str:
    return '<ul class="metric-row">' + "".join(f"<li>{html.escape(item)}</li>" for item in items) + "</ul>"


def link_row(links: list[tuple[str, str, bool]], depth: int) -> str:
    parts = []
    for label, href, external in links:
        target = ' target="_blank" rel="noreferrer noopener"' if external or href.startswith("http") else ""
        parts.append(f'<a href="{escape_attr(rel(depth, href))}"{target}>{html.escape(label)} <span aria-hidden="true">→</span></a>')
    return '<div class="link-row">' + "".join(parts) + "</div>"


def button_row(links: list[tuple[str, str, bool]], depth: int) -> str:
    return '<div class="button-row">' + "".join(
        link_button(label, href, depth, external=external, icon='fa-solid fa-arrow-up-right-from-square' if external or href.startswith('http') else 'fa-solid fa-arrow-right')
        for label, href, external in links
    ) + "</div>"


def project_resource_buttons(slug: str, depth: int) -> str:
    project = PROJECTS[slug]
    if slug == "hamjepa":
        links = [
            ("Paper PDF", project["paper_pdf"], True, "fa-solid fa-book-open"),
            ("Code", SITE["hamjepa_code"], True, "fa-solid fa-code"),
            ("Paper", SITE["zenodo"], True, "fa-solid fa-arrow-up-right-from-square"),
        ]
    else:
        links = [
            ("Paper PDF", project["paper_pdf"], True, "fa-solid fa-book-open"),
            ("Paper", SITE["cheb_arxiv"], True, "fa-solid fa-arrow-up-right-from-square"),
        ]
    return '<div class="button-row project-resource-row">' + "".join(
        link_button(label, href, depth, external=external, icon=icon)
        for label, href, external, icon in links
    ) + "</div>"


def project_hero_visual_class(slug: str) -> str:
    return "paper-kinetic-slot paper-kinetic-slot--hero"


def emphasize_caption_lead(caption: str) -> str:
    stripped = caption.strip()
    if not stripped or stripped.startswith("<strong"):
        return caption
    clause = re.match(r"(.{24,160}?[,:;])(\s+.*)$", stripped, flags=re.S)
    if clause:
        lead, rest = clause.group(1), clause.group(2)
        return f"<strong>{lead}</strong>{rest}"
    sentence = re.match(r"(.+?[.!?])(\s+.+)$", stripped, flags=re.S)
    if sentence:
        lead, rest = sentence.group(1), sentence.group(2)
        if len(lead) <= 180:
            return f"<strong>{lead}</strong>{rest}"
    soft_split = re.match(
        r"(.{4,140}?)(\s+(?:plus|for|evaluated|separating|provides?|through|summarizes?|anchors?|is|are|preserves?|tracks?|tests?|keeps?|balances?|acts?|reparameterizes?|generates?|must)\b.*)$",
        stripped,
        flags=re.S,
    )
    if soft_split:
        lead, rest = soft_split.group(1), soft_split.group(2)
        return f"<strong>{lead}</strong>{rest}"
    return f"<strong>{stripped}</strong>"


def old_hamjepa_hero_style() -> str:
    return textwrap.dedent("""
    background:
      radial-gradient(circle at 50% 50%, #9BD4E5 0%, #5FA9D4 80%),
      linear-gradient(120deg, #A8D5A2 0%, #D6EAC7 50%, transparent 100%),
      linear-gradient(200deg, #F8C7D8 15%, #E1C4F4 40%, transparent 80%),
      linear-gradient(45deg, #FFF4D6 0%, #FCEABB 30%, transparent 70%);
    background-blend-mode: overlay, lighten, screen, normal;
    """).strip().replace("\n", " ")


def old_chebyshev_hero_style() -> str:
    return textwrap.dedent("""
    background:
      radial-gradient(circle at 72% 44%, rgba(221, 206, 205, 0.96) 0%, rgba(221, 206, 205, 0.74) 48%, transparent 78%),
      linear-gradient(135deg, #DDCECD 0%, #ECE1DF 58%, #F6F6F6 100%);
    background-blend-mode: multiply, normal;
    """).strip().replace("\n", " ")


def project_hero_style(slug: str) -> str:
    if slug == "hamjepa":
        return old_chebyshev_hero_style()
    return old_hamjepa_hero_style()


def project_card(slug: str, depth: int = 0) -> str:
    project = PROJECTS[slug]
    visual_variant = "hamjepa" if slug == "hamjepa" else "chebyshev"
    visual_id = "hamjepa-card-visual" if slug == "hamjepa" else "chebyshev-card-visual"
    return f"""
    <div class="project-container robert-project">
      <a href="{escape_attr(rel(depth, project['links'][0][1]))}">
        <div class="project-cover kinetic-project-cover">
          <div id="{visual_id}" class="paper-kinetic-slot paper-kinetic-slot--card" data-paper-visual="{visual_variant}"></div>
        </div>
      </a>
      <div class="project-info">
        <p class="project-kicker">{html.escape(project['category'])}</p>
        <h2 class="project-title"><a href="{escape_attr(rel(depth, project['links'][0][1]))}">{html.escape(project['title'])}</a></h2>
        <p class="project-intro">{html.escape(project['abstract'])}</p>
      </div>
    </div>
    """


def project_tab_selector(active: str | None = None) -> str:
    entries = [
        ("Technical summary", "#technical-summary", "technical-summary"),
        ("Visual guide", "#visual-guide", "visual-guide"),
    ]
    tabs = '<nav class="project-tabs" aria-label="Project content selector">' + "".join(
        f'<a class="project-tab{" active" if key == active else ""}" href="{href}" data-tab="{key}">{label}</a>'
        for label, href, key in entries
    ) + "</nav>"
    return f'<div class="project-tab-nav">{tabs}</div>'


def project_tab_panels(slug: str, depth: int) -> str:
    summary = preprocess_summary(slug, depth)
    if slug == "hamjepa":
        guide = ham_visual_content(depth)
    else:
        guide = preprocess_cheb_visual(depth)
    p = PROJECTS[slug]
    return f"""
    <div class="container blog main first project-tab-shell">
      {project_tab_selector(active='technical-summary')}
    </div>
    <div class="project-tab-panels">
      <section class="container blog main prose-panel project-tab-panel active" data-tab-panel="technical-summary">
        <p class="caption">Downloadable summary PDF: <a href="{rel(depth, p['summary_pdf'])}" target="_blank" rel="noreferrer noopener">open PDF</a>.</p>
        {summary}
      </section>
      <section class="container blog main prose-panel project-tab-panel" data-tab-panel="visual-guide">
        {guide}
      </section>
    </div>
    """


def project_page(slug: str) -> str:
    p = PROJECTS[slug]
    depth = 1
    visual_variant = "hamjepa" if slug == "hamjepa" else "chebyshev"
    visual_id = "hamjepa-hero-visual" if slug == "hamjepa" else "chebyshev-hero-visual"
    visual_fit = ' data-paper-fit="hero"' if slug == "hamjepa" else ""
    body = f"""
    <div class="container blog project-hero--{slug}" id="first-content" style="{project_hero_style(slug)}">
      <div class="blog-title">
        <div class="blog-intro">
          <div>
            <h1 class="title">{p['title']}</h1>
            <p class="author">by {SITE['name']}</p>
            <p class="abstract">{p['abstract']}</p>
            <div class="link">{project_resource_buttons(slug, depth)}</div>
          </div>
          <div class="info"><p>{p['category']}</p>{metrics(p['metrics'])}</div>
        </div>
        <div class="blog-cover">
          <div id="{visual_id}" class="{project_hero_visual_class(slug)}" data-paper-visual="{visual_variant}"{visual_fit}></div>
        </div>
      </div>
    </div>

    {project_tab_panels(slug, depth)}
    """
    return page(f"{p['title']} | {SITE['name_ascii']}", p["abstract"], "research", body, depth=depth, mathjax=True, paper_visuals=True)


def pandoc(markdown: str) -> str:
    proc = subprocess.run(
        ["pandoc", "-f", "markdown+tex_math_dollars+raw_html+pipe_tables", "-t", "html", "--mathjax"],
        input=markdown,
        text=True,
        capture_output=True,
        check=True,
    )
    return proc.stdout


def strip_frontmatter(text: str) -> str:
    return re.sub(r"^---\n.*?\n---\n", "", text, flags=re.S)


def normalize_math_notation(text: str) -> str:
    text = re.sub(r"\\tilde\s+([A-Za-z])", r"\\tilde{\1}", text)
    text = re.sub(r"(?<![A-Za-z])z\\?~", r"$\\tilde{z}$", text)
    spacing_tilde = "\u02dc"
    combining_tilde = "\u0303"
    text = text.replace("z" + spacing_tilde, r"$\tilde{z}$")
    text = text.replace("z " + spacing_tilde, r"$\tilde{z}$")
    text = text.replace("z" + combining_tilde, r"$\tilde{z}$")
    text = re.sub(r"z\^\s*\\sim", r"\\tilde{z}", text)
    text = re.sub(r"(\\tilde\{z\}\\sim\s*)\\mathcal N", r"\1\\mathcal{N}", text)
    return text


def remove_imports(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("import "))


def summary_table_html(title: str, columns: list[str], rows: list[list[str]], caption: str | None = None) -> str:
    head = "".join(f"<th>{html.escape(col)}</th>" for col in columns)
    body = "".join(
        "<tr>" + "".join(f"<td>{html.escape(cell)}</td>" for cell in row) + "</tr>"
        for row in rows
    )
    caption_html = f'<p class="summary-table-caption">{html.escape(caption)}</p>' if caption else ""
    return textwrap.dedent(f"""
    <div class="summary-table-block">
      <p class="summary-table-caption-head">{html.escape(title)}</p>
      <div class="summary-table-wrap">
        <table class="summary-table"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>
      </div>
      {caption_html}
    </div>
    """).strip()


HAM_TABLES = [
    summary_table_html(
        "CIFAR-100, 30 epochs",
        ["Method", "kNN@20", "Linear"],
        [
            ["SIGReg", "26.56 ± 0.18", "30.43 ± 0.30"],
            ["HamJEPA q", "31.45 ± 0.27", "33.95 ± 0.24"],
            ["HamJEPA p", "29.71 ± 0.25", "33.07 ± 0.36"],
            ["HamJEPA (q,p)", "30.88 ± 0.39", "34.18 ± 0.17"],
        ],
    ),
    summary_table_html(
        "ImageNet-100, 45 epochs",
        ["Method", "kNN@20", "Linear"],
        [
            ["SIGReg q", "20.10", "24.40"],
            ["SIGReg p", "18.78", "23.86"],
            ["SIGReg (q,p)", "20.94", "25.54"],
            ["HamJEPA q", "24.92", "31.92"],
            ["HamJEPA p", "24.72", "32.08"],
            ["HamJEPA (q,p)", "24.64", "32.04"],
        ],
    ),
    summary_table_html(
        "CIFAR-100, 80 epochs: predictor-family ablation",
        ["Method", "Variant", "Linear", "kNN@20", "kNN best"],
        [
            ["SIGReg", "single", "33.95", "27.98", "28.71 @ k=1"],
            ["MLP-HJEPA", "q", "42.26", "28.10", "28.10 @ k=20"],
            ["MLP-HJEPA", "p", "41.90", "28.30", "28.30 @ k=20"],
            ["MLP-HJEPA", "(q,p)", "42.77", "28.15", "28.15 @ k=20"],
            ["HamJEPA", "q", "44.59", "34.43", "34.43 @ k=20"],
            ["HamJEPA", "p", "44.44", "32.96", "32.96 @ k=20"],
            ["HamJEPA", "(q,p)", "44.52", "33.66", "33.66 @ k=20"],
        ],
        "The 30-epoch CIFAR table reports SIGReg only as a single baseline; explicit q/p/(q,p) decomposition is reported there for HamJEPA, for both methods on ImageNet-100, and for HamJEPA plus non-symplectic MLP-HJEPA at 80 epochs.",
    ),
]


def box_replacements(text: str) -> str:
    replacements = {
        "SummaryKeyBox": "summary-box-key",
        "SummaryTakeBox": "summary-box-take",
        "SummaryFogBox": "summary-box-fog",
    }
    for tag, cls in replacements.items():
        pattern = re.compile(rf'<{tag}\s+title="([^"]+)">\s*(.*?)\s*</{tag}>', re.S)
        text = pattern.sub(
            lambda m: f'<aside class="summary-box {cls}"><p class="summary-box-title">{html.escape(m.group(1))}</p><div class="summary-box-body">\n{m.group(2)}\n</div></aside>',
            text,
        )
    return text


def replace_html_tokens(rendered: str, replacements: dict[str, str]) -> str:
    for token, html_block in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        token_re = re.escape(token)
        rendered = re.sub(rf"<p>\s*{token_re}\s*</p>", lambda _: html_block, rendered)
        rendered = re.sub(rf"<pre><code>\s*{token_re}\s*</code></pre>", lambda _: html_block, rendered)
        rendered = rendered.replace(token, html_block)
    return rendered


def old_ham_diagrams() -> dict[str, str]:
    if not OLD_DIAGRAM_FRAGMENTS.exists():
        raise FileNotFoundError(
            "Missing old-site HamJEPA diagram fragments. Run tools/copy_old_site_diagrams.py first."
        )
    return json.loads(OLD_DIAGRAM_FRAGMENTS.read_text(encoding="utf-8"))


def old_ham_diagram(key: str) -> str:
    diagrams = old_ham_diagrams()
    try:
        return diagrams[key]
    except KeyError as exc:
        raise KeyError(f"Missing old-site HamJEPA diagram fragment: {key}") from exc


def preprocess_summary(slug: str, depth: int = 1) -> str:
    path = SOURCE / "src/content/summaries" / ("hamjepa.mdx" if slug == "hamjepa" else "chebyshev-option-surfaces.mdx")
    text = normalize_math_notation(remove_imports(strip_frontmatter(path.read_text(encoding="utf-8"))))
    text = box_replacements(text)
    replacements: dict[str, str] = {}
    if slug == "hamjepa":
        table_iter = iter(HAM_TABLES)
        table_index = 0

        def table_repl(_: re.Match[str]) -> str:
            nonlocal table_index
            token = f"HTMLTOKEN_HAM_TABLE_{table_index}"
            replacements[token] = next(table_iter)
            table_index += 1
            return f"\n\n{token}\n\n"

        text = re.sub(r"<SummaryTable\s+.*?/>", table_repl, text, flags=re.S)
        pipeline_token = "HTMLTOKEN_HAM_PIPELINE_DIAGRAM"
        replacements[pipeline_token] = old_ham_diagram("hamjepa_pipeline")
        text = text.replace(
            "<HamJepaPipelineDiagram />",
            f"\n\n{pipeline_token}\n\n",
        )
        leapfrog_token = "HTMLTOKEN_HAM_LEAPFROG_DIAGRAM"
        replacements[leapfrog_token] = old_ham_diagram("hamjepa_leapfrog")
        text = text.replace(
            "<HamJepaLeapfrogDiagram />",
            f"\n\n{leapfrog_token}\n\n",
        )
    return replace_html_tokens(pandoc(text), replacements)


def summary_page(slug: str) -> str:
    p = PROJECTS[slug]
    depth = 1
    content = preprocess_summary(slug)
    actions = [(label, href, external) for label, href, external in p["links"][2:]]
    body = f"""
    <div class="container blog" id="first-content" style="background-color: #E0E4E6;">
      <div class="blog-title no-cover">
        <div class="blog-intro">
          <div>
            <h1 class="title">{p['title']}</h1>
            <p class="author">Technical summary · {p['category']}</p>
            <p class="abstract">{p['abstract']}</p>
            <div class="link">{selector(slug, depth, active='summary')}</div>
            <div class="link">{button_row(actions, depth)}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container blog main first">
      <p class="caption">Downloadable summary PDF: <a href="{rel(depth, p['summary_pdf'])}" target="_blank" rel="noreferrer noopener">open PDF</a>.</p>
    </div>
    <div class="container blog main prose-panel">
      {content}
    </div>
    """
    return page(f"{p['title']} | Technical summary", p["abstract"], "research", body, depth=depth, toc=True, mathjax=True)


def media_html(depth: int, src: str, alt: str) -> str:
    url = rel(depth, src)
    if src.endswith(".mp4") or src.endswith(".webm"):
        mime = "video/webm" if src.endswith(".webm") else "video/mp4"
        return f'<video class="source-media" autoplay muted loop playsinline preload="metadata"><source src="{escape_attr(url)}" type="{mime}"></video>'
    return f'<img class="source-media" src="{escape_attr(url)}" alt="{escape_attr(alt)}" loading="lazy" decoding="async">'


def figure(
    depth: int,
    src: str,
    alt: str,
    caption: str | None = None,
    title: str | None = None,
    figure_class: str = "source-figure",
    media_class: str = "source-media",
    caption_mode: str = "auto",
) -> str:
    title_html = f'<p class="source-figure-title">{html.escape(title)}</p>' if title else ""
    caption_html = ""
    if caption:
        escaped_caption = html.escape(caption, quote=False)
        if caption_mode == "plain":
            caption_body = escaped_caption
        elif caption_mode == "sentence":
            sentence = re.match(r"(.+?[.!?])(\s+.+)$", escaped_caption, flags=re.S)
            caption_body = f"<strong>{sentence.group(1)}</strong>{sentence.group(2)}" if sentence else f"<strong>{escaped_caption}</strong>"
        else:
            caption_body = emphasize_caption_lead(escaped_caption)
        caption_html = f"<figcaption>{caption_body}</figcaption>"
    return textwrap.dedent(f"""
    <figure class="{figure_class}">
      {title_html}
      <div class="source-media-shell">{media_html(depth, src, alt).replace('class="source-media"', f'class="{media_class}"')}</div>
      {caption_html}
    </figure>
    """).strip()


def resolve_cheb_media(stem: str) -> str:
    if stem in {"00_hero_price_sheet_orbit", "16_fog_lattice_orbit"}:
        return f"assets/images/chebyshev/{stem}.mp4"
    return f"assets/images/chebyshev/{stem}.png"


def preprocess_cheb_visual(depth: int) -> str:
    text = (SOURCE / "src/content/chebyshev-visual-guide-body.mdx").read_text(encoding="utf-8")
    text = normalize_math_notation(remove_imports(strip_frontmatter(text)))
    replacements: dict[str, str] = {}

    def repl(match: re.Match[str]) -> str:
        stem, alt, caption = match.group(1), match.group(2), match.group(3).strip()
        src = resolve_cheb_media(stem)
        token = f"HTMLTOKEN_CHEB_FIGURE_{len(replacements)}"
        replacements[token] = figure(depth, src, alt, caption, caption_mode="plain")
        return f"\n\n{token}\n\n"

    text = re.sub(
        r'<ChebyshevSectionMedia\s+stem="([^"]+)"\s+alt="([^"]+)">\s*(.*?)\s*</ChebyshevSectionMedia>',
        repl,
        text,
        flags=re.S,
    )
    return replace_html_tokens(pandoc(text), replacements)


def cheb_visual_page() -> str:
    slug = "chebyshev-option-surfaces"
    p = PROJECTS[slug]
    depth = 1
    content = preprocess_cheb_visual(depth)
    body = f"""
    <div class="container blog" id="first-content" style="background-color: #E0E4E6;">
      <div class="blog-title">
        <div class="blog-intro">
          <div>
            <h1 class="title">{p['title']}</h1>
            <p class="author">Visual guide · {p['category']}</p>
            <p class="abstract">Visual overview of the forward-discounted call sheet, sparse no-arbitrage operators, and local Hamiltonian fog refinement.</p>
            <div class="link">{selector(slug, depth, active='guide')}</div>
            <div class="link">{button_row([(label, href, external) for label, href, external in p['links'][1:]], depth)}</div>
          </div>
        </div>
        <div class="blog-cover">
          <img class="foreground" src="{rel(depth, p['hero'])}" alt="Forward-discounted call sheet">
          <img class="background" src="{rel(depth, p['hero'])}" alt="">
        </div>
      </div>
    </div>
    <div class="container blog main prose-panel">
      {content}
    </div>
    """
    return page(f"{p['title']} | Visual guide", p["abstract"], "research", body, depth=depth, toc=True, mathjax=True)


def ham_visual_content(depth: int) -> str:
    pipeline = old_ham_diagram("hamjepa_pipeline")
    encoder = old_ham_diagram("encoder_construction")
    leapfrog = old_ham_diagram("hamjepa_leapfrog")
    symplectic = old_ham_diagram("symplectic_comparison")
    predictor_gap = old_ham_diagram("predictor_not_enough")
    regularizers = old_ham_diagram("regularizer_sequence")
    matching = old_ham_diagram("matching_choice")
    content = f"""
      <section id="intro">
        <h1>HamJEPA visual guide</h1>
        <p class="text">HamJEPA has three moving parts: the encoder splits features into q,p, the predictor transports the state with a Hamiltonian rollout, and encoder-side regularizers keep the state cloud from collapsing.</p>
      </section>
      <section id="highest-level">
        <h2>1. HamJEPA full overview</h2>
        <p class="text">Two views are encoded to phase-space states, one state is evolved by a symplectic predictor, and the predicted target is matched while encoder-side anti-collapse controls remain active.</p>
        {pipeline}
      </section>
      <section id="encoder-construction">
        <h2>2. How the encoder constructs the phase-space state</h2>
        <p class="text">The split is implemented at token level: the channel stack for each token is partitioned into q and p halves before flattening, so s=[q;p] is a construction choice with the split preserved by an identity projector.</p>
        {encoder}
      </section>
      <section id="predictor-rollout">
        <h2>3. What the predictor is doing</h2>
        <p class="text">The predictor uses a Hamiltonian rollout $H_\\phi(q,p)=T(p)+V_\\phi(q)$ with half-kick, drift, and half-kick updates repeated for K steps. The mapping is structured transport, not free-form regression.</p>
        {leapfrog}
      </section>
      <section id="symplectic-geometry">
        <h2>4. What symplectic means geometrically</h2>
        <p class="text">Symplectic transport allows deformations but constrains local volume behavior, separating geometric transport from unconstrained collapse.</p>
        {symplectic}
      </section>
      <section id="predictor-not-enough">
        <h2>5. Why the predictor alone is not enough</h2>
        <p class="text">Symplecticity constrains the predictor, but it does not by itself prevent encoder collapse. A collapsed encoder could still map many different views to almost the same latent state, and a perfectly symplectic predictor would then only move around an already-degenerate state cloud.</p>
        {predictor_gap}
      </section>
      <section id="regularizers">
        <h2>6. Encoder-side anti-collapse regularizers</h2>
        <p class="text">The regularizers act on scale, variance, projected volume, spectrum, and batch mean.</p>
        {regularizers}
      </section>
      <section id="matching-choice">
        <h2>7. Why CIFAR-100 and ImageNet-100 use different matching choices</h2>
        <p class="text">Matching/readout choices are dataset-regime dependent. These choices are explained so that q, p, and (q,p) comparisons are interpretable.</p>
        <div class="mini-grid">
          <article class="mini-panel"><h3>CIFAR-100</h3><p>Emphasize matching mainly q: the content coordinate remains the cleanest readout while p stays more auxiliary.</p></article>
          <article class="mini-panel"><h3>ImageNet-100</h3><p>Match the full [q;p] state: both coordinates are directly constrained and p becomes more informative.</p></article>
        </div>
        {matching}
      </section>
      <section id="how-to-read">
        <h2>8. Construction</h2>
        <p class="text">The diagrams move from phase-space encoding to symplectic prediction, then to the regularizers that keep the encoder output non-degenerate.</p>
      </section>
      <section id="further-results">
        <h1>Further results</h1>
        <p class="text">Epoch ImageNet-100 training-readout figures.</p>
        {figure(depth, "assets/images/hamjepa/fig_imagenet_qp_decomposition_SIGReg_tokens.png", "ImageNet-100 q/p decomposition for SIGReg tokens", "q/p decomposition across pretraining (ImageNet-100). Frozen features are extracted at sparse pretraining checkpoints and evaluated with a linear probe and best kNN top-1 across evaluated k values. For SIGReg+tokens, concatenating (q,p) is consistently better than either half alone, indicating that the split halves are complementary and/or that doubling feature dimension helps.", "SIGReg+tokens")}
        {figure(depth, "assets/images/hamjepa/fig_imagenet_qp_decomposition_MV_HJEPA.png", "ImageNet-100 q/p decomposition for HamJEPA", "For HamJEPA, q, p, and (q,p) track each other closely, suggesting that both phase-space coordinates are individually informative and largely redundant under the symplectic objective.", "HamJEPA", caption_mode="plain")}
        {figure(depth, "assets/images/hamjepa/fig_imagenet_epoch_dynamics.png", "ImageNet-100 training dynamics", "ImageNet-100 training dynamics from sparse checkpoints. Linear probe, best kNN, effective-rank proxy, and probe accuracy versus effective rank are shown for q. HamJEPA improves steadily and shows increasing effective rank, while SIGReg+tokens improves modestly while its effective rank decreases.", "ImageNet-100 training dynamics", caption_mode="sentence")}
      </section>
      <section id="selected-geometry-diagnostics">
        <h1>Selected geometry diagnostics</h1>
        <h2>1. Videos: drift in trajectory geometry</h2>
        <p class="text">We compare rollouts by energy drift, reversibility, area preservation, symplecticity defect, and ensemble stability. Non-symplectic rollouts distort orbit structure and accumulate directional energy bias, while symplectic rollouts preserve qualitative orbit geometry with bounded oscillatory error consistent with modified-Hamiltonian intuition from backward error analysis.</p>
        {figure(depth, "assets/images/hamjepa/visualizing_drift_sigreg_vs_hamjepa.gif", "Phase-plane drift comparison", "Phase-plane drift plus energy trace.", "Phase-plane drift", caption_mode="plain")}
        {figure(depth, "assets/images/hamjepa/energy_surface_sigreg_vs_hamjepa.mp4", "Energy surface comparison", "Energy surface comparison for SIGReg and HamJEPA.", "Energy surface view", caption_mode="plain")}
        <h2>2. Energy drift across initial conditions</h2>
        <p class="text">Drift is evaluated over initial states (q0, p0) using stabilized relative energy error ΔH/(H0+ε). The sym-log visualization separates near-zero residual structure from broad systematic bias; leapfrog remains balanced and bounded while Euler exhibits coherent directional accumulation.</p>
        {figure(depth, "assets/images/hamjepa/energy_drift_heatmap.png", "Energy drift heatmap", "Drift evaluated over initial states (q0,p0).", "Nonlinear pendulum drift", caption_mode="plain")}
        {figure(depth, "assets/images/hamjepa/energy_drift_heatmap_sigreg_vs_hamjepa.png", "Alternate energy drift comparison", "Sym-log drift view separating near-zero residual structure from broad bias.", "Alternate drift view", caption_mode="plain")}
        <h2>3. Time reversibility</h2>
        <p class="text">Reversibility is tested by comparing a forward rollout and the reflected reverse map R(q,p)=(q,-p). Leapfrog is self-adjoint and therefore supports forward-reverse consistency; Euler is not. This diagnostic tests structural integrity, not only pointwise prediction accuracy.</p>
        {figure(depth, "assets/images/hamjepa/time_reversibility_heatmap.png", "Time reversibility heatmap", "Forward-reverse consistency tests structural integrity, not only point prediction.", "Forward-reverse defect map", caption_mode="plain")}
        <h2>4. Liouville / area preservation</h2>
        <p class="text">Hamiltonian flow preserves phase-space volume; in two dimensions this is area preservation. The grid-area trajectory is the quantitative diagnostic, while hull-area overlays provide qualitative deformation context. With unwrapped q, leapfrog stays near-area-preserving and Euler drifts.</p>
        {figure(depth, "assets/images/hamjepa/liouville_area_preservation.png", "Liouville area preservation plot", "Hamiltonian flow preserves phase-space volume; in two dimensions this is area preservation.", "Quantitative area metric", caption_mode="plain")}
        {figure(depth, "assets/images/hamjepa/liouville_blob_area.png", "Liouville blob deformation", "Hull-area overlays provide qualitative deformation context.", "Blob deformation check", caption_mode="plain")}
        <h2>5. Symplecticity defect</h2>
        <p class="text">Symplecticity is tested directly through J(x)^T Ω J(x)=Ω and defect d(x)=||J^T ΩJ-Ω||_F. This is stricter than energy drift alone and isolates structural violations; diagnostics use unwrapped coordinates and float64 Jacobians.</p>
        {figure(depth, "assets/images/hamjepa/symplecticity_defect_hist.png", "Symplecticity defect histogram", "Direct test of J(x)^T Ω J(x)=Ω through Frobenius defect.", "Defect distribution", caption_mode="plain")}
        <h2>6. Long-horizon energy behavior</h2>
        <p class="text">Energy error is summarized by median trajectory and IQR band, which is more robust than mean-only views under heavy-tail rollout paths. Symplectic rollout shows bounded oscillatory behavior; non-symplectic rollout shows monotone accumulation.</p>
        {figure(depth, "assets/images/hamjepa/energy_vs_time.png", "Energy versus time", "Median trajectory and IQR band summarize long-horizon energy behavior.", "Median + IQR drift over time", caption_mode="plain")}
        <h2>7. Covariance stability</h2>
        <p class="text">Ensemble diagnostics track tr(Cov), log det(Cov), and λ_min(Cov). These are not invariants of general nonlinear Hamiltonian flow, but they remain useful comparative indicators of rollout health and degeneration risk.</p>
        {figure(depth, "assets/images/hamjepa/covariance_stability.png", "Covariance stability diagnostics", "Ensemble diagnostics track trace, log determinant, and minimum eigenvalue of covariance.", "Ensemble covariance diagnostics", caption_mode="plain")}
        <h2>8. Sliced-projection diagnostics</h2>
        <p class="text">This LeJEPA paper-inspired sliced-projection diagnostic follows a Cramér-Wold viewpoint: instead of only aggregating distribution checks, compare many 1D projections to expose direction-dependent geometric distortion.</p>
        {figure(depth, "assets/images/hamjepa/lejepa_style_projection_cartoon.png", "Projection cartoon", "A 2D slice is projected onto many directions. Black is the reference distribution, green tracks the symplectic rollout, and orange indicates distorted non-symplectic projections.", "Projection cartoon", caption_mode="plain")}
        {figure(depth, "assets/images/hamjepa/lejepa_style_projection_sketch.png", "Projection sketch", "Initial phase-space cloud and whitened final distributions: leapfrog remains close to the reference shape while Euler introduces directional mismatch after transport.", "Projection sketch")}
        {figure(depth, "assets/images/hamjepa/lejepa_style_directional_discrepancy.png", "Directional discrepancy curve", "Direction-dependent mismatch is summarized by g(theta)=W1(<u(theta), Z_model>, <u(theta), Z_ref>). Broad peaks reveal anisotropic rollout distortion hidden by aggregate-only metrics.", "Directional discrepancy", caption_mode="plain")}
      </section>
    """
    return content


def home_page() -> str:
    body = f"""
    <div class="container" id="first-content">
      <div class="home-container">
        <div class="home-intro">
          <h1 class="title">{SITE['name']}</h1>
          <p>{SITE['role']}</p>
          <p><em>I work on representation learning, option-surface modelling, structure-preserving financial dynamics, and geometric analysis. I like models where the geometry is something you discover, not something you inherit.</em></p>
          <div class="home-actions">
            {link_button('Research', 'research.html', 0, icon='fa-solid fa-arrow-right')}
            {link_button('CV', 'resume.html', 0, icon='fa-regular fa-file-lines')}
            {link_button('Email', SITE['email'], 0, icon='fa-regular fa-envelope')}
          </div>
        </div>
        <div class="home-profile">
          <div id="home-foliation-visual" class="home-kinetic-visual paper-kinetic-slot paper-kinetic-slot--home" data-paper-visual="foliation"></div>
        </div>
      </div>
    </div>
    """
    return page(f"{SITE['name_ascii']}", "Personal research site for Robert Jenkinson Alvarez.", "home", body, paper_visuals=True)


def projects_page() -> str:
    ongoing_html = "".join(
        f"""<div class="paper-container ongoing-row">
          <div class="paper-conference"><p>{html.escape(cat)}<br>Ongoing</p></div>
          <div class="paper-info"><p><b>{html.escape(title)}</b></p><p>{html.escape(desc)}</p></div>
        </div><hr class="soft">"""
        for title, cat, desc in ONGOING
    )
    body = f"""
    <div class="container" id="first-content">
      <div class="page-title">
        <h1 class="title">Research</h1>
        <p>Completed research and ongoing work in geometric machine learning, quantitative finance, and geometric analysis.</p>
      </div>
    </div>

    <div class="container">
      <div class="section-title"><h2>Completed work</h2></div>
      <div class="project-page date">
        <div class="project-block">
          {project_card('hamjepa')}
          {project_card('chebyshev-option-surfaces')}
        </div>
      </div>
    </div>

    <div class="container" id="ongoing">
      <div class="section-title"><h2>Ongoing work</h2></div>
      <div class="paper-page ongoing-page">
        <hr class="hard">
        {ongoing_html}
      </div>
    </div>
    """
    return page("Research | Robert Jenkinson Alvarez", "Research projects and ongoing work.", "research", body, paper_visuals=True)


def resume_page() -> str:
    evidence = [
        ("HamJEPA", "A JEPA variant that predicts between views by rolling a q,p state through a symplectic Hamiltonian map instead of forcing the latent cloud toward an isotropic Gaussian."),
        ("Arbitrage-free option surfaces", "Fits forward-discounted call prices with Chebyshev tensors and sparse no-arbitrage operators; local fog handles inconsistent quote patches."),
        ("Geometric stochastic modelling", "A joint spot–curve–surface model where no-arbitrage and transport structure are built into the state update, not checked after calibration."),
        ("Optiver / market making", "Quant trading and market-making training focused on options quoting, inventory risk, hedge execution, and latency-aware decisions under live exchange simulation."),
    ]
    evidence_html = "".join(f"<article class='mini-panel'><h3>{html.escape(t)}</h3><p>{html.escape(b)}</p></article>" for t, b in evidence)
    body = f"""
    <div class="container" id="first-content">
      <div class="page-title">
        <h1 class="title">Curriculum Vitae</h1>
        <p>CV downloads, education, and selected evidence.</p>
        <p class="page-actions">
          {link_button('Quant CV', 'assets/files/robert-jenkinson-alvarez-quant-cv.pdf', 0, external=True, icon='fa-regular fa-file-pdf')}
          {link_button('Research CV', 'assets/files/robert-jenkinson-alvarez-research-cv.pdf', 0, external=True, icon='fa-regular fa-file-pdf')}
        </p>
      </div>
    </div>
    <div class="container blog main first">
      <div class="about-container cv-section">
        <div class="about-intro"><p>EDUCATION</p></div>
        <div class="about-content cv-education">
          <p><b>MSc Financial Mathematics (Distinction)</b><br>London School of Economics and Political Science<br>2023–2024</p>
          <p><b>BSc Mathematics (First-Class Honours)</b><br>University of Bath<br>2020–2023</p>
        </div>
      </div>
    </div>
    <div class="container blog main gray">
      <h1>Selected evidence</h1>
      <div class="mini-grid">{evidence_html}</div>
    </div>
    """
    return page("Curriculum Vitae | Robert Jenkinson Alvarez", "CV downloads and selected evidence.", "resume", body)


def about_page() -> str:
    body = f"""
    <div class="container" id="first-content">
      <div class="page-title">
        <h1 class="title">About</h1>
        <p>I build models where geometry is not just a tool, but the central principle. My work spans representation learning, option‑surface construction, Hamiltonian financial dynamics, and geometric analysis.</p>
        <p>I received a BSc in Mathematics (First‑Class Honours) from the University of Bath and an MSc in Financial Mathematics (Distinction) from the London School of Economics, with a training program in derivatives quant trading and market‑making at Optiver. Since then, I have been pursuing independent research across quantitative finance and pure mathematics: a deliberate choice that has produced published pre‑prints, an options surface engine, and ongoing work on several deep rigidity problems.</p>
      </div>
    </div>
    <div class="container blog main first">
      <h1>Research taste</h1>
      <p class="text">The projects I’m most proud of start with a careful choice of state variable, then let the geometry dictate the dynamics. This means I reach for tools like Hamiltonian/symplectic structures, convex optimisation, Chebyshev tensors, and spectral diagnostics because they respect what should be invariant.</p>
    </div>
    <div class="container blog main">
      <h1>Links / contact</h1>
      <div class="link-row about-links">
        <a href="{SITE['github']}" target="_blank" rel="noreferrer noopener">GitHub →</a>
        <a href="{SITE['linkedin']}" target="_blank" rel="noreferrer noopener">LinkedIn →</a>
        <a href="{SITE['arxiv_author']}" target="_blank" rel="noreferrer noopener">arXiv Author →</a>
        <a href="{SITE['zenodo']}" target="_blank" rel="noreferrer noopener">HamJEPA Zenodo →</a>
        <a href="{SITE['cheb_arxiv']}" target="_blank" rel="noreferrer noopener">Chebyshev arXiv →</a>
        <a href="{SITE['email']}">Email →</a>
      </div>
      <p class="text">Best reached by email for research discussions or serious opportunities; include the technical context and constraints.</p>
    </div>
    """
    return page("About | Robert Jenkinson Alvarez", "About Robert Jenkinson Alvarez.", "about", body)


def redirect_page(title: str, target: str = "index.html") -> str:
    escaped_target = escape_attr(target)
    return f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url={escaped_target}">
  <title>{html.escape(title)}</title>
</head>
<body>
  <p><a href="{escaped_target}">Open {SITE['name']}</a></p>
</body>
</html>
"""


def site_css() -> str:
    return (ROOT / "assets/stylesheets/robert-clarity.css").read_text(encoding="utf-8")


def build() -> None:
    write("assets/stylesheets/robert-clarity.css", site_css())
    write("index.html", home_page())
    write("research.html", projects_page())
    write("projects.html", redirect_page("Research | Robert Jenkinson Álvarez", "research.html"))
    write("resume.html", resume_page())
    write("about.html", about_page())
    write("research/hamjepa.html", project_page("hamjepa"))
    write("research/hamjepa-summary.html", redirect_page("HamJEPA technical summary", "hamjepa.html#technical-summary"))
    write("research/hamjepa-visual-guide.html", redirect_page("HamJEPA visual guide", "hamjepa.html#visual-guide"))
    write("research/chebyshev-option-surfaces.html", project_page("chebyshev-option-surfaces"))
    write("research/chebyshev-summary.html", redirect_page("Chebyshev technical summary", "chebyshev-option-surfaces.html#technical-summary"))
    write("research/chebyshev-visual-guide.html", redirect_page("Chebyshev visual guide", "chebyshev-option-surfaces.html#visual-guide"))
    write("research/hamjepa/index.html", redirect_page("HamJEPA", "../hamjepa.html"))
    write("research/hamjepa/technical-summary.html", redirect_page("HamJEPA technical summary", "../hamjepa.html#technical-summary"))
    write("research/hamjepa/visual-guide.html", redirect_page("HamJEPA visual guide", "../hamjepa.html#visual-guide"))
    write("research/chebyshev-option-surfaces/index.html", redirect_page("Chebyshev option surfaces", "../chebyshev-option-surfaces.html"))
    write("research/chebyshev-option-surfaces/technical-summary.html", redirect_page("Chebyshev technical summary", "../chebyshev-option-surfaces.html#technical-summary"))
    write("research/chebyshev-option-surfaces/visual-guide.html", redirect_page("Chebyshev visual guide", "../chebyshev-option-surfaces.html#visual-guide"))
    write("projects/hamjepa.html", redirect_page("HamJEPA", "../research/hamjepa.html"))
    write("projects/hamjepa-summary.html", redirect_page("HamJEPA technical summary", "../research/hamjepa.html#technical-summary"))
    write("projects/hamjepa-visual-guide.html", redirect_page("HamJEPA visual guide", "../research/hamjepa.html#visual-guide"))
    write("projects/chebyshev-option-surfaces.html", redirect_page("Chebyshev option surfaces", "../research/chebyshev-option-surfaces.html"))
    write("projects/chebyshev-summary.html", redirect_page("Chebyshev technical summary", "../research/chebyshev-option-surfaces.html#technical-summary"))
    write("projects/chebyshev-visual-guide.html", redirect_page("Chebyshev visual guide", "../research/chebyshev-option-surfaces.html#visual-guide"))
    write("projects/hamjepa/index.html", redirect_page("HamJEPA", "../../research/hamjepa.html"))
    write("projects/hamjepa/technical-summary.html", redirect_page("HamJEPA technical summary", "../../research/hamjepa.html#technical-summary"))
    write("projects/hamjepa/visual-guide.html", redirect_page("HamJEPA visual guide", "../../research/hamjepa.html#visual-guide"))
    write("projects/chebyshev-option-surfaces/index.html", redirect_page("Chebyshev option surfaces", "../../research/chebyshev-option-surfaces.html"))
    write("projects/chebyshev-option-surfaces/technical-summary.html", redirect_page("Chebyshev technical summary", "../../research/chebyshev-option-surfaces.html#technical-summary"))
    write("projects/chebyshev-option-surfaces/visual-guide.html", redirect_page("Chebyshev visual guide", "../../research/chebyshev-option-surfaces.html#visual-guide"))
    write("clarity.html", redirect_page("Robert Jenkinson Álvarez"))
    write("minimal.html", redirect_page("Robert Jenkinson Álvarez"))


if __name__ == "__main__":
    build()
