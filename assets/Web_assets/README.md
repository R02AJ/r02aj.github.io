# Paper Kinetic Visuals

Standalone Three.js hero visuals for research-page paper cards.

## Files

- `PaperKineticVisual.js` exports the reusable component:
  `PaperKineticVisual({ variant: "hamjepa" | "chebyshev" | "foliation" })`
- `paper-kinetic-visual.css` contains the wrapper, canvas, and static fallback styling.
- `demo.html` mounts all variants for local inspection.

## Usage

```html
<link rel="stylesheet" href="./Web_assets/paper-kinetic-visual.css">

<div id="paper-visual"></div>

<script type="module">
  import { PaperKineticVisual } from "./Web_assets/PaperKineticVisual.js";

  PaperKineticVisual({
    container: "#paper-visual",
    variant: "hamjepa",
  });
</script>
```

Use `variant: "chebyshev"` for the spectral surface / fog sculpture.
Use `variant: "foliation"` for the torus foliation sculpture.

The module dynamically imports Three.js from jsDelivr. If Three.js cannot load,
the CSS fallback remains visible. Users with `prefers-reduced-motion: reduce`
get a static rendered frame instead of continuous animation.

## Integration Notes

- The visuals contain no labels, axes, tick marks, legends, or plot UI.
- They are intended as abstract kinetic paper identity objects.
- They are responsive; mobile uses lower geometry density and device-pixel ratio.
- The returned handle supports `start()`, `stop()`, and `dispose()`.
