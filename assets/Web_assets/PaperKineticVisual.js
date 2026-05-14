const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const TAU = Math.PI * 2;

const VARIANTS = {
  hamjepa: {
    accent: "#8dd6ff",
    background:
      "radial-gradient(circle at 25% 20%, rgba(93, 231, 255, 0.24), transparent 28%), radial-gradient(circle at 72% 34%, rgba(222, 74, 255, 0.23), transparent 30%), radial-gradient(circle at 52% 82%, rgba(93, 255, 178, 0.14), transparent 34%), linear-gradient(135deg, #07111f, #111022 46%, #061a22)",
  },
  chebyshev: {
    accent: "#88efe6",
    background:
      "radial-gradient(circle at 22% 22%, rgba(255, 235, 180, 0.28), transparent 28%), radial-gradient(circle at 76% 36%, rgba(72, 214, 221, 0.23), transparent 32%), radial-gradient(circle at 62% 84%, rgba(202, 118, 54, 0.15), transparent 30%), linear-gradient(135deg, #f7f1e5, #e8f6f6 46%, #d4e8ec)",
  },
  foliation: {
    accent: "#98edf1",
    background:
      "radial-gradient(circle at 27% 21%, rgba(184, 237, 245, 0.28), transparent 30%), radial-gradient(circle at 72% 31%, rgba(203, 184, 255, 0.2), transparent 29%), radial-gradient(circle at 54% 78%, rgba(255, 255, 255, 0.58), transparent 34%), linear-gradient(135deg, #fbfaf5, #eff8f8 48%, #ece8f6)",
  },
};

const VARIANT_LABELS = {
  hamjepa: "Abstract moving phase-space ribbon sculpture",
  chebyshev: "Abstract spectral surface and fog sculpture",
  foliation: "Abstract torus foliation sculpture with luminous invariant leaves",
};

export async function PaperKineticVisual({
  container,
  variant = "hamjepa",
  fit = "default",
  interactive = true,
  autoStart = true,
  className = "",
  importThree = () => import(THREE_CDN),
} = {}) {
  const target = resolveContainer(container);
  const normalized = normalizeVariant(variant);
  const root = document.createElement("div");
  root.className = `pkv pkv--${normalized}${className ? ` ${className}` : ""}`;
  root.style.background = VARIANTS[normalized].background;
  root.setAttribute("data-paper-kinetic-visual", normalized);
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", VARIANT_LABELS[normalized]);
  target.appendChild(root);

  const fallback = makeFallback(normalized);
  root.appendChild(fallback);

  let THREE;
  try {
    const threeModule = await importThree();
    THREE = threeModule.default || threeModule;
  } catch {
    fallback.classList.add("is-visible");
    return makeNoopHandle(root);
  }

  if (!canUseWebGL()) {
    fallback.classList.add("is-visible");
    return makeNoopHandle(root);
  }

  const state = {
    root,
    variant: normalized,
    fit,
    reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    mobile:
      window.matchMedia?.("(max-width: 720px)")?.matches ||
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      false,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    hover: 0,
    hoverTarget: 0,
    timeScale: 1,
    running: false,
    disposed: false,
    frame: 0,
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  if (normalized === "hamjepa") {
    camera.position.set(0, fit === "hero" ? 0.18 : 0.14, fit === "hero" ? 7.05 : 6.2);
  } else if (normalized === "foliation") {
    camera.position.set(0, 0.48, 6.75);
  } else {
    camera.position.set(0, 0.42, 5.8);
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
  } catch {
    fallback.classList.add("is-visible");
    return makeNoopHandle(root);
  }
  fallback.remove();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.mobile ? 1.35 : 1.75));
  renderer.domElement.className = "pkv-canvas";
  root.appendChild(renderer.domElement);

  addLightRig(THREE, scene, normalized);
  const visual =
    normalized === "hamjepa"
      ? createHamjepaVisual(THREE, scene, state)
      : normalized === "foliation"
        ? createFoliationVisual(THREE, scene, state)
        : createChebyshevVisual(THREE, scene, state);

  const resize = () => {
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  };

  const onPointerMove = (event) => {
    if (!interactive) return;
    const rect = root.getBoundingClientRect();
    state.pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    state.pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (state.reducedMotion) renderOnce(performance.now());
  };
  const onPointerEnter = () => {
    state.hoverTarget = 1;
    if (state.reducedMotion) renderOnce(performance.now());
  };
  const onPointerLeave = () => {
    state.hoverTarget = 0;
    state.pointer.tx = 0;
    state.pointer.ty = 0;
    if (state.reducedMotion) renderOnce(performance.now());
  };

  if (interactive) {
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerenter", onPointerEnter, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  const renderOnce = (now) => {
    const t = now * 0.001;
    state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.08;
    state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.08;
    state.hover += (state.hoverTarget - state.hover) * 0.08;
    state.timeScale = 0.78 + state.hover * 0.78 + Math.abs(state.pointer.x) * 0.16;
    visual.update(t, camera);
    renderer.render(scene, camera);
  };

  const loop = (now) => {
    if (!state.running || state.disposed) return;
    renderOnce(now);
    state.frame = requestAnimationFrame(loop);
  };

  const handle = {
    root,
    start() {
      if (state.disposed || state.running) return;
      state.running = true;
      state.frame = requestAnimationFrame(loop);
    },
    stop() {
      state.running = false;
      if (state.frame) cancelAnimationFrame(state.frame);
      state.frame = 0;
    },
    dispose() {
      this.stop();
      state.disposed = true;
      window.removeEventListener("resize", resize);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerenter", onPointerEnter);
      root.removeEventListener("pointerleave", onPointerLeave);
      visual.dispose?.();
      renderer.dispose();
      root.remove();
    },
  };

  renderOnce(performance.now());
  if (autoStart && !state.reducedMotion) handle.start();
  return handle;
}

export function mountPaperKineticVisual(selector, options = {}) {
  return PaperKineticVisual({ ...options, container: selector });
}

function normalizeVariant(variant) {
  return variant === "chebyshev" || variant === "foliation" ? variant : "hamjepa";
}

function resolveContainer(container) {
  if (typeof container === "string") {
    const el = document.querySelector(container);
    if (!el) throw new Error(`PaperKineticVisual: container not found: ${container}`);
    return el;
  }
  if (container instanceof Element) return container;
  throw new Error("PaperKineticVisual: pass a DOM element or selector as container.");
}

function makeNoopHandle(root) {
  return {
    root,
    start() {},
    stop() {},
    dispose() {
      root.remove();
    },
  };
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

function makeFallback(variant) {
  const fallback = document.createElement("div");
  fallback.className = `pkv-fallback pkv-fallback--${variant}`;
  const spans = variant === "hamjepa" ? 7 : variant === "foliation" ? 11 : 9;
  for (let i = 0; i < spans; i += 1) {
    const span = document.createElement("span");
    span.style.setProperty("--i", `${i}`);
    fallback.appendChild(span);
  }
  return fallback;
}

function addLightRig(THREE, scene, variant) {
  const ambient = variant === "hamjepa" ? 0xbadfff : variant === "foliation" ? 0xf7fbff : 0xfff6de;
  scene.add(new THREE.AmbientLight(ambient, variant === "foliation" ? 1.28 : 1.15));
  const key = new THREE.DirectionalLight(0xffffff, variant === "hamjepa" ? 2.35 : variant === "foliation" ? 1.85 : 1.7);
  key.position.set(3.2, 4.8, 5.6);
  scene.add(key);
  const rim = new THREE.PointLight(variant === "hamjepa" ? 0x9b5cff : variant === "foliation" ? 0xb9a7ff : 0xdca65c, variant === "foliation" ? 3.9 : 6.2, 11);
  rim.position.set(-3.2, -1.8, 3.8);
  scene.add(rim);
  const fill = new THREE.PointLight(variant === "hamjepa" ? 0x4df5d0 : variant === "foliation" ? 0x86f3ef : 0x64d9e8, variant === "foliation" ? 3.6 : 4.2, 10);
  fill.position.set(2.8, 1.2, -2.8);
  scene.add(fill);
}

function createHamjepaVisual(THREE, scene, state) {
  const group = new THREE.Group();
  scene.add(group);

  const palette = [0x58dcff, 0x7f6cff, 0xf05dff, 0x38f7b4, 0x25f0ff, 0xba6dff];
  const ribbons = palette.map((color, index) => {
    const mesh = makeRibbonMesh(THREE, {
      color,
      index,
      phase: index * 0.77,
      width: state.mobile ? 0.075 : 0.105,
      segments: state.mobile ? 160 : 240,
    });
    mesh.rotation.set(index * 0.33, index * 0.22, index * 0.27);
    group.add(mesh);
    return mesh;
  });

  const particles = makeHamjepaParticles(THREE, state.mobile ? 86 : 150);
  group.add(particles.points);

  const halo = makeHaloShell(THREE);
  group.add(halo);

  return {
    update(t, camera) {
      const slow = t * state.timeScale;
      const open = 1 + state.hover * 0.12;
      const twist = state.pointer.x * 0.55 + state.hover * 0.28;

      group.rotation.y = slow * 0.18 + state.pointer.x * 0.28;
      group.rotation.x = Math.sin(slow * 0.23) * 0.14 - state.pointer.y * 0.2;
      group.rotation.z = Math.sin(slow * 0.18) * 0.12;
      const fitScale = state.fit === "hero" ? (state.mobile ? 0.94 : 0.9) : 1;
      group.scale.setScalar(fitScale * (1 + Math.sin(slow * 0.74) * 0.026 + state.hover * 0.035));

      ribbons.forEach((mesh, index) => {
        updateRibbonGeometry(mesh, slow, open, twist);
        mesh.material.opacity = 0.33 + state.hover * 0.1 + Math.sin(slow + index) * 0.025;
        mesh.material.emissiveIntensity = 0.16 + state.hover * 0.16;
      });

      particles.update(slow, state);
      halo.rotation.y = -slow * 0.12;
      halo.rotation.x = slow * 0.08;
      halo.material.opacity = 0.06 + state.hover * 0.04;

      camera.position.x += (state.pointer.x * 0.46 - camera.position.x) * 0.04;
      camera.position.y += (0.14 - state.pointer.y * 0.2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    },
    dispose() {
      ribbons.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      particles.dispose();
      halo.geometry.dispose();
      halo.material.dispose();
    },
  };
}

function makeRibbonMesh(THREE, params) {
  const geometry = new THREE.BufferGeometry();
  const vertexCount = (params.segments + 1) * 2;
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
  const indices = [];
  for (let i = 0; i < params.segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setIndex(indices);
  const material = new THREE.MeshPhysicalMaterial({
    color: params.color,
    emissive: params.color,
    emissiveIntensity: 0.18,
    roughness: 0.18,
    metalness: 0.02,
    transmission: 0.62,
    thickness: 0.55,
    clearcoat: 0.9,
    clearcoatRoughness: 0.13,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = params;
  updateRibbonGeometry(mesh, 0, 1, 0);
  return mesh;
}

function updateRibbonGeometry(mesh, time, open, twistPush) {
  const { segments, phase, width, index } = mesh.userData;
  const positions = mesh.geometry.attributes.position.array;
  const normals = mesh.geometry.attributes.normal.array;
  const uvs = mesh.geometry.attributes.uv.array;
  const scratchA = { x: 0, y: 0, z: 0 };
  const scratchB = { x: 0, y: 0, z: 0 };
  const scratchC = { x: 0, y: 0, z: 0 };
  const eps = 0.006;

  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const t = u * TAU;
    hamjepaCurve(t, phase, time, open, index, scratchA);
    hamjepaCurve(t + eps, phase, time, open, index, scratchB);
    hamjepaCurve(t - eps, phase, time, open, index, scratchC);

    const tangent = normalize3(
      scratchB.x - scratchC.x,
      scratchB.y - scratchC.y,
      scratchB.z - scratchC.z,
    );
    let side = cross3(tangent, { x: 0.1, y: 1, z: 0.2 });
    if (length3(side) < 0.001) side = cross3(tangent, { x: 1, y: 0, z: 0 });
    side = normalize3(side.x, side.y, side.z);
    const binormal = normalize3(...Object.values(cross3(tangent, side)));
    const twist = t * (1.55 + index * 0.12) + phase + time * 0.42 + twistPush;
    const ribbonSide = normalize3(
      side.x * Math.cos(twist) + binormal.x * Math.sin(twist),
      side.y * Math.cos(twist) + binormal.y * Math.sin(twist),
      side.z * Math.cos(twist) + binormal.z * Math.sin(twist),
    );
    const localWidth = width * (1 + 0.2 * Math.sin(t * 3 + phase + time));
    const base = i * 6;
    positions[base] = scratchA.x + ribbonSide.x * localWidth;
    positions[base + 1] = scratchA.y + ribbonSide.y * localWidth;
    positions[base + 2] = scratchA.z + ribbonSide.z * localWidth;
    positions[base + 3] = scratchA.x - ribbonSide.x * localWidth;
    positions[base + 4] = scratchA.y - ribbonSide.y * localWidth;
    positions[base + 5] = scratchA.z - ribbonSide.z * localWidth;

    normals[base] = ribbonSide.x;
    normals[base + 1] = ribbonSide.y;
    normals[base + 2] = ribbonSide.z;
    normals[base + 3] = -ribbonSide.x;
    normals[base + 4] = -ribbonSide.y;
    normals[base + 5] = -ribbonSide.z;

    const uv = i * 4;
    uvs[uv] = u;
    uvs[uv + 1] = 0;
    uvs[uv + 2] = u;
    uvs[uv + 3] = 1;
  }
  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.geometry.attributes.normal.needsUpdate = true;
  mesh.geometry.attributes.uv.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
}

function hamjepaCurve(t, phase, time, open, index, out) {
  const p = 2 + (index % 2);
  const q = 3 + ((index + 1) % 3);
  const breathing = 0.07 * Math.sin(time * 0.9 + phase);
  const r = 1.22 + breathing + index * 0.012;
  const tube = (0.47 + 0.06 * Math.sin(time * 0.7 + phase)) * open;
  const a = p * t + phase * 0.8 + Math.sin(time * 0.27 + phase) * 0.15;
  const b = q * t + phase + Math.cos(time * 0.23 + phase) * 0.18;
  out.x = (r + tube * Math.cos(b)) * Math.cos(a) + 0.12 * Math.sin(5 * t + phase);
  out.y = (r + tube * Math.cos(b)) * Math.sin(a) + 0.12 * Math.cos(4 * t + phase);
  out.z = tube * Math.sin(b) + 0.2 * Math.sin(2 * t + time * 0.18 + phase);
  return out;
}

function makeHamjepaParticles(THREE, count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const offsets = Array.from({ length: count }, (_, i) => ({
    curve: i % 6,
    phase: Math.random() * TAU,
    speed: 0.32 + Math.random() * 0.48,
    lane: (Math.random() - 0.5) * 0.1,
  }));
  const palette = [
    [0.45, 0.9, 1],
    [0.9, 0.35, 1],
    [0.45, 1, 0.72],
    [0.7, 0.55, 1],
  ];
  for (let i = 0; i < count; i += 1) {
    const c = palette[i % palette.length];
    colors.set(c, i * 3);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  const scratch = { x: 0, y: 0, z: 0 };
  return {
    points,
    update(time, state) {
      for (let i = 0; i < count; i += 1) {
        const item = offsets[i];
        const t = item.phase + time * item.speed * (1.2 + state.hover * 1.9);
        hamjepaCurve(t, item.curve * 0.77, time, 1 + state.hover * 0.14, item.curve, scratch);
        positions[i * 3] = scratch.x + Math.sin(t * 4) * item.lane;
        positions[i * 3 + 1] = scratch.y + Math.cos(t * 3) * item.lane;
        positions[i * 3 + 2] = scratch.z + Math.sin(t * 5) * item.lane;
      }
      geometry.attributes.position.needsUpdate = true;
      material.opacity = 0.64 + state.hover * 0.28;
      material.size = 0.038 + state.hover * 0.016;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function makeHaloShell(THREE) {
  const geometry = new THREE.IcosahedronGeometry(2.05, 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x92f0ff,
    transparent: true,
    opacity: 0.055,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

function createFoliationVisual(THREE, scene, state) {
  const group = new THREE.Group();
  group.rotation.set(0.16, 0.12, -0.04);
  scene.add(group);

  const body = makeFoliationTorusBody(THREE);
  group.add(body.mesh);

  const leaves = makeFoliationLeaves(THREE, state.mobile ? 18 : 30, state.mobile ? 150 : 230);
  group.add(leaves.group);

  const ribbons = makeFoliationRibbons(THREE, state.mobile ? 5 : 9, state.mobile ? 130 : 190);
  group.add(ribbons.group);

  const particles = makeFoliationParticles(THREE, state.mobile ? 74 : 132);
  group.add(particles.points);

  const shadow = makeFoliationShadow(THREE);
  group.add(shadow.mesh);

  return {
    update(t, camera) {
      const mobileScale = state.mobile ? 0.74 : 1;
      const slow = t * (0.52 + state.hover * 0.12);
      const mode = 0.5 + 0.5 * Math.sin(t * 0.095);
      const slope = 1.5 + mode * 0.18 + state.pointer.x * 0.055 + state.hover * 0.035;
      const open = 1 + state.hover * 0.09;
      const tension = 0.7 + mode * 0.45 + Math.abs(state.pointer.x) * 0.2;
      const motionLift = 1 + state.hover * 0.16;
      const idleYaw = t * (0.155 + state.hover * 0.018);
      const idlePitch = 0.15 + Math.sin(t * 0.23) * (0.58 * mobileScale);
      const idleRoll = -0.04 + Math.sin(t * 0.31) * (0.12 * mobileScale);
      const pointerYaw = state.pointer.x * 0.26 * mobileScale;
      const pointerPitch = -state.pointer.y * 0.2 * mobileScale;
      const pointerRoll = state.pointer.x * 0.055 * mobileScale;

      group.rotation.set(
        idlePitch * motionLift + pointerPitch,
        idleYaw + pointerYaw,
        idleRoll + pointerRoll,
      );
      group.scale.setScalar(1 + Math.sin(t * 0.7) * 0.012 + state.hover * 0.016);

      body.update(slow, state, mode);
      leaves.update(slow, state, slope, mode, open, tension);
      ribbons.update(slow, state, slope, mode, open, tension);
      particles.update(slow, state, slope, mode, open);
      shadow.update(slow, state);

      camera.position.x += (state.pointer.x * 0.16 - camera.position.x) * 0.035;
      camera.position.y += (0.48 - state.pointer.y * 0.08 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);
    },
    dispose() {
      body.dispose();
      leaves.dispose();
      ribbons.dispose();
      particles.dispose();
      shadow.dispose();
    },
  };
}

function makeFoliationTorusBody(THREE) {
  const geometry = new THREE.TorusGeometry(1.36, 0.46, 80, 192);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xf5fbff,
    emissive: 0xbdeff2,
    emissiveIntensity: 0.05,
    roughness: 0.16,
    metalness: 0.02,
    transmission: 0.56,
    thickness: 0.62,
    clearcoat: 0.82,
    clearcoatRoughness: 0.16,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return {
    mesh,
    update(time, state, mode) {
      const s = 1 + Math.sin(time * 0.9) * 0.012 + state.hover * 0.012;
      mesh.scale.setScalar(s);
      material.opacity = 0.27 + mode * 0.04 + state.hover * 0.08;
      material.emissiveIntensity = 0.035 + state.hover * 0.055;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function makeFoliationLeaves(THREE, count, segments) {
  const group = new THREE.Group();
  const palette = [0xb9ffff, 0xd8d4ff, 0xf5fbff, 0x93dfe5, 0xd9f2ff, 0xc7b7ff];
  const leaves = [];
  for (let i = 0; i < count; i += 1) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
    const material = new THREE.LineBasicMaterial({
      color: palette[i % palette.length],
      transparent: true,
      opacity: 0.22 + (i % 5) * 0.018,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);
    leaves.push({
      line,
      phase: (i / count) * TAU + (i % 2) * 0.045,
      drift: 0.15 + (i % 7) * 0.018,
      turnBias: ((i % 4) - 1.5) * 0.1,
      lift: ((i % 3) - 1) * 0.004,
    });
  }

  const point = { x: 0, y: 0, z: 0 };
  const normal = { x: 0, y: 0, z: 0 };
  return {
    group,
    update(time, state, slope, mode, open, tension) {
      leaves.forEach((leaf, index) => {
        const positions = leaf.line.geometry.attributes.position.array;
        const turns = 2.0 + mode * 2.15 + leaf.turnBias;
        const drift = time * leaf.drift * (0.45 + state.hover * 0.55);
        const peel = (0.018 + state.hover * 0.075 + mode * 0.018 + leaf.lift) * open;
        for (let i = 0; i <= segments; i += 1) {
          const u = (i / segments) * TAU * turns + drift;
          const ripple = 0.02 * tension * Math.sin(u * 1.8 + time * 0.6 + leaf.phase);
          torusFoliationPoint(u, leaf.phase + ripple, slope, time, peel, point, normal);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        leaf.line.geometry.attributes.position.needsUpdate = true;
        leaf.line.geometry.computeBoundingSphere();
        leaf.line.material.opacity = 0.18 + state.hover * 0.2 + mode * 0.045 + (index % 4) * 0.01;
      });
    },
    dispose() {
      leaves.forEach((leaf) => {
        leaf.line.geometry.dispose();
        leaf.line.material.dispose();
      });
    },
  };
}

function makeFoliationRibbons(THREE, count, segments) {
  const group = new THREE.Group();
  const ribbons = [];
  const palette = [0xeefcff, 0xc9f8f6, 0xd7cfff, 0xb9e8ff, 0xf8f4ff];
  for (let i = 0; i < count; i += 1) {
    const geometry = new THREE.BufferGeometry();
    const vertexCount = (segments + 1) * 2;
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
    const indices = [];
    for (let s = 0; s < segments; s += 1) {
      const a = s * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(indices);
    const material = new THREE.MeshPhysicalMaterial({
      color: palette[i % palette.length],
      emissive: palette[i % palette.length],
      emissiveIntensity: 0.04,
      roughness: 0.2,
      metalness: 0.01,
      transmission: 0.34,
      thickness: 0.2,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    ribbons.push({
      mesh,
      phase: (i / count) * TAU + 0.22,
      width: 0.032 + (i % 3) * 0.006,
      turnBias: ((i % 5) - 2) * 0.12,
      lift: 0.026 + (i % 2) * 0.012,
    });
  }

  const point = { x: 0, y: 0, z: 0 };
  const before = { x: 0, y: 0, z: 0 };
  const after = { x: 0, y: 0, z: 0 };
  const normal = { x: 0, y: 0, z: 0 };
  const normalBefore = { x: 0, y: 0, z: 0 };
  const normalAfter = { x: 0, y: 0, z: 0 };
  return {
    group,
    update(time, state, slope, mode, open, tension) {
      ribbons.forEach((ribbon, index) => {
        const positions = ribbon.mesh.geometry.attributes.position.array;
        const normals = ribbon.mesh.geometry.attributes.normal.array;
        const uvs = ribbon.mesh.geometry.attributes.uv.array;
        const turns = 2.08 + mode * 1.65 + ribbon.turnBias;
        const drift = time * (0.065 + index * 0.006) * (0.65 + state.hover * 0.5);
        const peel = (ribbon.lift + state.hover * 0.095 + mode * 0.018) * open;
        const width = ribbon.width * (1 + state.hover * 0.26 + mode * 0.16);
        for (let i = 0; i <= segments; i += 1) {
          const u = (i / segments) * TAU * turns + drift;
          const phase = ribbon.phase + 0.018 * tension * Math.sin(u * 2 + time * 0.5);
          torusFoliationPoint(u, phase, slope, time, peel, point, normal);
          torusFoliationPoint(u - 0.01, phase, slope, time, peel, before, normalBefore);
          torusFoliationPoint(u + 0.01, phase, slope, time, peel, after, normalAfter);
          const tangent = normalize3(after.x - before.x, after.y - before.y, after.z - before.z);
          let side = cross3(normal, tangent);
          if (length3(side) < 0.001) side = cross3({ x: 0, y: 1, z: 0 }, tangent);
          side = normalize3(side.x, side.y, side.z);
          const waveWidth = width * (1 + 0.12 * Math.sin(u * 2.2 + time + ribbon.phase));
          const base = i * 6;
          positions[base] = point.x + side.x * waveWidth;
          positions[base + 1] = point.y + side.y * waveWidth;
          positions[base + 2] = point.z + side.z * waveWidth;
          positions[base + 3] = point.x - side.x * waveWidth;
          positions[base + 4] = point.y - side.y * waveWidth;
          positions[base + 5] = point.z - side.z * waveWidth;

          normals[base] = normal.x;
          normals[base + 1] = normal.y;
          normals[base + 2] = normal.z;
          normals[base + 3] = normal.x;
          normals[base + 4] = normal.y;
          normals[base + 5] = normal.z;

          const uv = i * 4;
          uvs[uv] = i / segments;
          uvs[uv + 1] = 0;
          uvs[uv + 2] = i / segments;
          uvs[uv + 3] = 1;
        }
        ribbon.mesh.geometry.attributes.position.needsUpdate = true;
        ribbon.mesh.geometry.attributes.normal.needsUpdate = true;
        ribbon.mesh.geometry.attributes.uv.needsUpdate = true;
        ribbon.mesh.geometry.computeBoundingSphere();
        ribbon.mesh.material.opacity = 0.12 + state.hover * 0.13 + mode * 0.04;
        ribbon.mesh.material.emissiveIntensity = 0.035 + state.hover * 0.075;
      });
    },
    dispose() {
      ribbons.forEach((ribbon) => {
        ribbon.mesh.geometry.dispose();
        ribbon.mesh.material.dispose();
      });
    },
  };
}

function makeFoliationParticles(THREE, count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = Array.from({ length: count }, (_, i) => ({
    phase: ((i % 24) / 24) * TAU + Math.random() * 0.08,
    u: Math.random() * TAU * 2,
    speed: 0.11 + Math.random() * 0.16,
    lift: 0.058 + Math.random() * 0.07,
    warm: i % 11 === 0,
  }));
  seeds.forEach((seed, i) => {
    const color = seed.warm ? [0.96, 0.78, 1] : i % 3 === 0 ? [0.76, 1, 0.98] : [0.7, 0.86, 1];
    colors.set(color, i * 3);
  });
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.034,
    vertexColors: true,
    transparent: true,
    opacity: 0.76,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  const point = { x: 0, y: 0, z: 0 };
  const normal = { x: 0, y: 0, z: 0 };
  return {
    points,
    update(time, state, slope, mode, open) {
      seeds.forEach((seed, i) => {
        const travel = seed.u + time * seed.speed * (1 + state.hover * 1.8);
        const turns = 2.35 + mode * 1.8;
        torusFoliationPoint(travel * turns, seed.phase, slope, time, seed.lift * open + state.hover * 0.045, point, normal);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      });
      geometry.attributes.position.needsUpdate = true;
      material.opacity = 0.5 + state.hover * 0.34;
      material.size = 0.028 + state.hover * 0.014;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function makeFoliationShadow(THREE) {
  const geometry = new THREE.CircleGeometry(1.75, 72);
  const material = new THREE.MeshBasicMaterial({
    color: 0x8da5ad,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.98;
  mesh.scale.set(1.18, 0.46, 1);
  return {
    mesh,
    update(time, state) {
      const s = 1 + Math.sin(time * 0.55) * 0.025 + state.hover * 0.03;
      mesh.scale.set(1.18 * s, 0.46 * s, 1);
      material.opacity = 0.085 + state.hover * 0.035;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function torusFoliationPoint(u, phase, slope, time, peel, out, normalOut) {
  const R = 1.36;
  const r = 0.46 * (1 + 0.018 * Math.sin(time * 0.7 + phase));
  const v = slope * u + phase + 0.018 * Math.sin(u * 3 + time * 0.42 + phase);
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const cv = Math.cos(v);
  const sv = Math.sin(v);
  const normal = normalize3(cv * cu, sv, cv * su);
  out.x = (R + r * cv) * cu + normal.x * peel;
  out.y = r * sv + normal.y * peel;
  out.z = (R + r * cv) * su + normal.z * peel;
  if (normalOut) {
    normalOut.x = normal.x;
    normalOut.y = normal.y;
    normalOut.z = normal.z;
  }
  return out;
}

function createChebyshevVisual(THREE, scene, state) {
  const group = new THREE.Group();
  group.rotation.x = -0.34;
  scene.add(group);

  const surface = makeSpectralSurface(THREE, state.mobile ? 46 : 72, state.mobile ? 34 : 54);
  group.add(surface.mesh);
  const grid = makeChebyshevGrid(THREE, state.mobile ? 13 : 19, state.mobile ? 12 : 17);
  group.add(grid.lines);
  const quotes = makeQuoteParticles(THREE, state.mobile ? 58 : 96);
  group.add(quotes.points);
  const fog = makeFogPatch(THREE, state.mobile ? 130 : 230);
  group.add(fog.points);

  return {
    update(t, camera) {
      const slow = t * (0.72 + state.hover * 0.2);
      group.rotation.y = state.pointer.x * 0.3 + Math.sin(slow * 0.2) * 0.08;
      group.rotation.x = -0.36 - state.pointer.y * 0.22 + Math.sin(slow * 0.16) * 0.035;
      group.rotation.z = Math.sin(slow * 0.18) * 0.04;
      group.scale.setScalar(1 + state.hover * 0.025);
      surface.update(slow, state);
      grid.update(slow, state);
      quotes.update(slow, state);
      fog.update(slow, state);
      camera.position.x += (state.pointer.x * 0.36 - camera.position.x) * 0.04;
      camera.position.y += (0.42 - state.pointer.y * 0.14 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    },
    dispose() {
      surface.dispose();
      grid.dispose();
      quotes.dispose();
      fog.dispose();
    },
  };
}

function makeSpectralSurface(THREE, nx, ny) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(nx * ny * 3);
  const normals = new Float32Array(nx * ny * 3);
  const indices = [];
  for (let y = 0; y < ny - 1; y += 1) {
    for (let x = 0; x < nx - 1; x += 1) {
      const a = y * nx + x;
      indices.push(a, a + 1, a + nx, a + 1, a + nx + 1, a + nx);
    }
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xdff8f3,
    roughness: 0.2,
    metalness: 0.03,
    transmission: 0.48,
    thickness: 0.42,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.z = -0.08;
  const update = (time, state) => {
    let i = 0;
    for (let y = 0; y < ny; y += 1) {
      const v = y / (ny - 1);
      const yy = (v - 0.5) * 2.15;
      for (let x = 0; x < nx; x += 1) {
        const u = x / (nx - 1);
        const xx = (u - 0.5) * 3.25;
        const z = spectralHeight(xx, yy, time, state.hover);
        positions[i] = xx;
        positions[i + 1] = yy;
        positions[i + 2] = z;
        normals[i] = 0;
        normals[i + 1] = 0;
        normals[i + 2] = 1;
        i += 3;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.computeVertexNormals();
    material.opacity = 0.5 + state.hover * 0.14;
  };
  update(0, { hover: 0 });
  return {
    mesh,
    update,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function makeChebyshevGrid(THREE, nx, ny) {
  const lines = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x4cced5,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
  });
  const curves = [];
  const makeLine = (samples) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(samples * 3), 3));
    const line = new THREE.Line(geometry, material.clone());
    lines.add(line);
    return line;
  };

  for (let i = 0; i < nx; i += 1) {
    const u = cheb01(i, nx - 1);
    curves.push({ kind: "u", value: u, line: makeLine(72) });
  }
  for (let j = 0; j < ny; j += 1) {
    const v = cheb01(j, ny - 1);
    curves.push({ kind: "v", value: v, line: makeLine(72) });
  }

  const update = (time, state) => {
    curves.forEach((curve, index) => {
      const attr = curve.line.geometry.attributes.position;
      const arr = attr.array;
      const samples = attr.count;
      for (let s = 0; s < samples; s += 1) {
        const a = s / (samples - 1);
        const u = curve.kind === "u" ? curve.value : a;
        const v = curve.kind === "v" ? curve.value : a;
        const x = (u - 0.5) * 3.25;
        const y = (v - 0.5) * 2.15;
        const z = spectralHeight(x, y, time, state.hover) + 0.018;
        arr[s * 3] = x;
        arr[s * 3 + 1] = y;
        arr[s * 3 + 2] = z;
      }
      attr.needsUpdate = true;
      curve.line.material.opacity = 0.34 + state.hover * 0.36 + (index % 3) * 0.018;
    });
  };
  update(0, { hover: 0 });
  return {
    lines,
    update,
    dispose() {
      curves.forEach((curve) => {
        curve.line.geometry.dispose();
        curve.line.material.dispose();
      });
    },
  };
}

function makeQuoteParticles(THREE, count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = Array.from({ length: count }, (_, i) => ({
    u: Math.random(),
    v: Math.random(),
    lift: 0.06 + Math.random() * 0.28,
    phase: Math.random() * TAU,
    warm: i % 5 === 0,
  }));
  seeds.forEach((seed, i) => {
    const color = seed.warm ? [1, 0.62, 0.28] : [0.28, 0.94, 0.95];
    colors.set(color, i * 3);
  });
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  return {
    points,
    update(time, state) {
      seeds.forEach((seed, i) => {
        const x = (seed.u - 0.5) * 3.25;
        const y = (seed.v - 0.5) * 2.15;
        const z = spectralHeight(x, y, time, state.hover) + seed.lift + Math.sin(time * 0.9 + seed.phase) * 0.02;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      });
      geometry.attributes.position.needsUpdate = true;
      material.opacity = 0.58 + state.hover * 0.24;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function makeFogPatch(THREE, count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = Array.from({ length: count }, () => {
    const r = Math.sqrt(Math.random()) * 0.5;
    const a = Math.random() * TAU;
    return {
      r,
      a,
      h: (Math.random() - 0.35) * 0.5,
      phase: Math.random() * TAU,
      spin: 0.35 + Math.random() * 0.75,
    };
  });
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffc16a,
    size: 0.06,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  return {
    points,
    update(time, state) {
      const centerX = 0.62 + state.pointer.x * 0.08;
      const centerY = -0.16 + state.pointer.y * 0.05;
      seeds.forEach((seed, i) => {
        const angle = seed.a + time * seed.spin * (0.25 + state.hover * 0.8);
        const r = seed.r * (1 + Math.sin(time + seed.phase) * 0.08);
        const x = centerX + Math.cos(angle) * r * 0.95;
        const y = centerY + Math.sin(angle) * r * 0.7;
        const z = spectralHeight(x, y, time, state.hover) + 0.1 + seed.h + Math.sin(time * 1.4 + seed.phase) * 0.04;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      });
      geometry.attributes.position.needsUpdate = true;
      material.opacity = 0.18 + state.hover * 0.32;
      material.size = 0.045 + state.hover * 0.025;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function spectralHeight(x, y, time, hover) {
  const bowl = 0.16 * x * x - 0.08 * y * y;
  const wave = 0.16 * Math.sin(1.4 * x + time * 0.42) * Math.cos(1.1 * y - time * 0.26);
  const local = 0.18 * Math.exp(-((x - 0.62) ** 2 / 0.34 + (y + 0.16) ** 2 / 0.18));
  return bowl + wave + local * (0.8 + hover * 0.35);
}

function cheb01(i, n) {
  return (1 - Math.cos((i / n) * Math.PI)) / 2;
}

function normalize3(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return { x: x / length, y: y / length, z: z / length };
}

function cross3(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function length3(a) {
  return Math.hypot(a.x, a.y, a.z);
}
