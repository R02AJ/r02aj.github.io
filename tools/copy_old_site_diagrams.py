from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIST = Path("/Users/robjenkinson/Documents/Website/dist")
HAM_PAGE = SOURCE_DIST / "research/hamjepa/index.html"
HAM_COMPONENT_CSS = [
    SOURCE_DIST / "_astro/HamJepaPipelineDiagram.UGeXedYN.css",
    SOURCE_DIST / "_astro/hamjepa@_@astro.BrlOoFcM.css",
]

OUT_FRAGMENT_JSON = ROOT / "assets/generated-diagrams/hamjepa-old-astro-fragments.json"
OUT_CSS = ROOT / "assets/stylesheets/old-astro-hamjepa-diagrams.css"


def extract_balanced_tag(text: str, start: int, tag: str) -> str:
    pattern = re.compile(rf"</?{tag}\b[^>]*>", re.I)
    depth = 0
    for match in pattern.finditer(text, start):
        raw = match.group(0)
        if raw.startswith("</"):
            depth -= 1
            if depth == 0:
                return text[start : match.end()]
        elif raw.endswith("/>"):
            continue
        else:
            depth += 1
    raise ValueError(f"Could not find balanced </{tag}> from offset {start}")


def extract_figure(text: str, marker: str) -> str:
    marker_at = text.index(marker)
    start = text.rfind("<figure", 0, marker_at)
    if start == -1:
        raise ValueError(f"Could not find figure start for {marker}")
    return sanitize_fragment(extract_balanced_tag(text, start, "figure"))


def extract_div(text: str, marker: str) -> str:
    marker_at = text.index(marker)
    start = text.rfind("<div", 0, marker_at)
    if start == -1:
        raise ValueError(f"Could not find div start for {marker}")
    return sanitize_fragment(extract_balanced_tag(text, start, "div"))


def sanitize_fragment(fragment: str) -> str:
    # Keep the exact visible SVG/caption rendering, but remove non-visual
    # fallback label text from the static Clarity source.
    return re.sub(
        r"(<desc\b[^>]*>).*?(</desc>)",
        r"\1Diagram copied from the old working Astro site.\2",
        fragment,
        flags=re.S,
    )


def main() -> None:
    page = HAM_PAGE.read_text(encoding="utf-8", errors="ignore")
    fragments = {
        "hamjepa_pipeline": extract_figure(page, 'id="hamjepa-pipeline-title"'),
        "hamjepa_leapfrog": extract_figure(page, 'id="hamjepa-leapfrog-title"'),
        "encoder_construction": extract_figure(page, 'id="hamjepa-encoder-title"'),
        "symplectic_comparison": extract_figure(page, 'id="hamjepa-symplectic-map-title"'),
        "predictor_not_enough": extract_figure(page, 'id="hamjepa-predictor-gap-title"'),
        "matching_choice": extract_figure(page, 'id="hamjepa-matching-title"'),
        "regularizer_sequence": extract_div(page, 'class="ham-regularizer-sequence"'),
    }

    OUT_FRAGMENT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_FRAGMENT_JSON.write_text(json.dumps(fragments, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    css = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in HAM_COMPONENT_CSS)
    OUT_CSS.write_text(
        "/* Exact rendered HamJEPA diagram component CSS copied from the old Astro dist. */\n"
        + css
        + "\n",
        encoding="utf-8",
    )

    print(f"Copied {len(fragments)} old-site HamJEPA diagram fragments to {OUT_FRAGMENT_JSON.relative_to(ROOT)}")
    print(f"Copied old-site HamJEPA diagram CSS to {OUT_CSS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
