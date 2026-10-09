const THREE_CDN = new URL("../vendor/three.module.js", import.meta.url).href;
const TAU = Math.PI * 2;

const CONFIG = {
  minkowski: {
    label: "A translucent convex plate with luminous billiard particles",
    background:
      "radial-gradient(circle at 30% 22%, rgba(255,190,124,.28), transparent 30%), radial-gradient(circle at 72% 38%, rgba(91,226,218,.2), transparent 32%), linear-gradient(145deg,#16131b,#182b31 55%,#2a1d19)",
  },
  attention: {
    label: "Two translucent evidence ellipsoids sharing a present prediction but separating after a common update",
    background:
      "radial-gradient(circle at 28% 24%, rgba(141,116,255,.28), transparent 31%), radial-gradient(circle at 72% 42%, rgba(78,235,222,.22), transparent 32%), linear-gradient(145deg,#10131f,#1c1830 54%,#10292c)",
  },
  alpha: {
    label: "A floating mountainous market-state surface, with emerging hills shaded red",
    background:
      "radial-gradient(circle at 30% 22%, rgba(89,237,210,.25), transparent 30%), radial-gradient(circle at 76% 42%, rgba(228,153,74,.2), transparent 30%), linear-gradient(145deg,#091c24,#102e32 54%,#1e1a25)",
  },
  "chebyshev-production": {
    label: "A luminous sculptural option-price surface with a fine spectral grid",
    background:
      "radial-gradient(circle at 24% 22%, rgba(255,232,176,.32), transparent 30%), radial-gradient(circle at 76% 35%, rgba(77,214,219,.25), transparent 33%), linear-gradient(145deg,#f7f0df,#e5f4f4 55%,#cfE3e8)",
  },
};

export async function ResearchKineticVisual({
  container,
  variant = "minkowski",
  fit = "default",
  interactive = true,
  importThree = () => import(THREE_CDN),
} = {}) {
  const target = typeof container === "string" ? document.querySelector(container) : container;
  if (!(target instanceof Element)) throw new Error("ResearchKineticVisual: container not found");
  const normalized = Object.hasOwn(CONFIG, variant) ? variant : "minkowski";
  const root = document.createElement("div");
  root.className = `pkv pkv--${normalized}`;
  root.style.background = CONFIG[normalized].background;
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", CONFIG[normalized].label);
  target.appendChild(root);

  const fallback = makeFallback(normalized);
  root.appendChild(fallback);

  let THREE;
  try {
    const module = await importThree();
    THREE = module.default || module;
  } catch {
    fallback.classList.add("is-visible");
    return noopHandle(root);
  }

  if (!canUseWebGL()) {
    fallback.classList.add("is-visible");
    return noopHandle(root);
  }

  const state = {
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    hover: 0,
    hoverTarget: 0,
    fit,
    reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    mobile: window.matchMedia?.("(max-width: 720px)")?.matches ?? false,
    visible: true,
    running: false,
    disposed: false,
    frame: 0,
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, normalized === "chebyshev-production" ? 0.6 : 0.28, fit === "hero" ? 6.8 : 6.15);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    fallback.classList.add("is-visible");
    return noopHandle(root);
  }
  fallback.remove();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.mobile ? 1.3 : 1.7));
  renderer.domElement.className = "pkv-canvas";
  root.appendChild(renderer.domElement);

  addLights(THREE, scene, normalized);
  const visual = createVisual(THREE, scene, state, normalized);

  const resize = () => {
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render(performance.now());
  };

  const render = (now) => {
    const t = now * 0.001;
    state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.07;
    state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.07;
    state.hover += (state.hoverTarget - state.hover) * 0.07;
    visual.update(t, camera);
    renderer.render(scene, camera);
  };

  const loop = (now) => {
    if (!state.running || state.disposed) return;
    if (state.visible) render(now);
    state.frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (state.running || state.disposed || state.reducedMotion) return;
    state.running = true;
    state.frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    state.running = false;
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
  };

  const onPointerMove = (event) => {
    if (!interactive) return;
    const rect = root.getBoundingClientRect();
    state.pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    state.pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (state.reducedMotion) render(performance.now());
  };
  const onPointerEnter = () => {
    state.hoverTarget = 1;
  };
  const onPointerLeave = () => {
    state.hoverTarget = 0;
    state.pointer.tx = 0;
    state.pointer.ty = 0;
  };

  if (interactive) {
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerenter", onPointerEnter, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  const intersection = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
        state.visible = entry?.isIntersecting ?? true;
        if (state.visible) start();
        else stop();
      }, { rootMargin: "160px" })
    : null;
  intersection?.observe(root);

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(root);
  window.addEventListener("resize", resize, { passive: true });
  resize();
  if (!intersection) start();

  return {
    root,
    start,
    stop,
    dispose() {
      stop();
      state.disposed = true;
      intersection?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerenter", onPointerEnter);
      root.removeEventListener("pointerleave", onPointerLeave);
      visual.dispose();
      renderer.dispose();
      root.remove();
    },
  };
}

function createVisual(THREE, scene, state, variant) {
  if (variant === "attention") return createAttention(THREE, scene, state);
  if (variant === "alpha") return createAlpha(THREE, scene, state);
  if (variant === "chebyshev-production") return createChebyshevProduction(THREE, scene, state);
  return createMinkowski(THREE, scene, state);
}

function createMinkowski(THREE, scene, state) {
  const group = new THREE.Group();
  group.rotation.set(-0.12, -0.15, -0.22);
  scene.add(group);

  const plateGeometry = new THREE.SphereGeometry(1.55, state.mobile ? 44 : 72, state.mobile ? 24 : 40);
  const plateMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe6a56a,
    emissive: 0x402415,
    emissiveIntensity: 0.18,
    roughness: 0.2,
    metalness: 0.08,
    transmission: 0.45,
    thickness: 0.8,
    clearcoat: 0.85,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.scale.set(1.2, 0.76, 0.18);
  group.add(plate);

  const contourMaterial = new THREE.LineBasicMaterial({ color: 0x79e7dd, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending });
  const contours = [];
  for (let k = 0; k < 9; k += 1) {
    const points = [];
    for (let i = 0; i < 160; i += 1) {
      const a = (i / 160) * TAU;
      const r = 0.62 + k * 0.075;
      points.push(new THREE.Vector3(Math.cos(a) * 1.86 * r, Math.sin(a) * 1.18 * r, 0.31 + k * 0.012));
    }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), contourMaterial.clone());
    group.add(line);
    contours.push(line);
  }

  const angles = [0.12, 1.56, 2.78, 4.1, 5.28];
  const orbitPoints = angles.map((a) => new THREE.Vector3(Math.cos(a) * 1.83, Math.sin(a) * 1.16, 0.42));
  orbitPoints.push(orbitPoints[0].clone());
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffd28c, transparent: true, opacity: 0.76, blending: THREE.AdditiveBlending });
  group.add(new THREE.Line(orbitGeometry, orbitMaterial));

  const particleCount = state.mobile ? 46 : 82;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({ color: 0xf9ecce, size: 0.055, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  return objectHandle(group, () => {
    const speed = 0.22 + state.hover * 0.55;
    const t = performance.now() * 0.001;
    for (let i = 0; i < particleCount; i += 1) {
      const progress = (t * speed + i / particleCount) * angles.length;
      const segment = Math.floor(progress) % angles.length;
      const local = progress - Math.floor(progress);
      const a = orbitPoints[segment];
      const b = orbitPoints[segment + 1];
      const wobble = Math.sin(t * 1.3 + i * 0.71) * 0.055;
      particlePositions[i * 3] = a.x + (b.x - a.x) * local + wobble;
      particlePositions[i * 3 + 1] = a.y + (b.y - a.y) * local - wobble * 0.6;
      particlePositions[i * 3 + 2] = 0.46 + Math.sin(t * 2 + i) * 0.035;
    }
    particleGeometry.attributes.position.needsUpdate = true;
    group.rotation.y += 0.0012 + state.hover * 0.0012;
    group.rotation.x = -0.12 - state.pointer.y * 0.12;
    group.rotation.z = -0.22 + state.pointer.x * 0.12;
    plateMaterial.opacity = 0.44 + state.hover * 0.12;
  });
}

function createAttention(THREE, scene, state) {
  const group = new THREE.Group();
  group.rotation.set(-0.08, -0.18, -0.05);
  scene.add(group);
  const glass = (color) => new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.1, roughness: 0.18, transmission: 0.55, thickness: 0.65, transparent: true, opacity: 0.42, depthWrite: false });
  const evidenceGeometry = new THREE.SphereGeometry(1, state.mobile ? 28 : 48, 24);
  const sourceA = new THREE.Mesh(evidenceGeometry, glass(0x7f67e8));
  const sourceB = new THREE.Mesh(evidenceGeometry, glass(0x36d9cf));
  const target = new THREE.Mesh(new THREE.SphereGeometry(.16,24,16), new THREE.MeshBasicMaterial({color:0xffe4b3}));
  sourceA.scale.set(1.45,.62,.62);
  sourceB.scale.set(1.45,.62,.62);
  sourceA.rotation.z = .65;
  sourceB.rotation.z = -.65;
  sourceA.position.set(-.65,.38,0);
  sourceB.position.set(-.65,-.38,.15);
  target.position.set(.7,0,.4);
  for (const [index,source] of [sourceA,sourceB].entries()) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.01,24,16), new THREE.MeshBasicMaterial({color:index?0x8fe9da:0xc1a6fa,wireframe:true,transparent:true,opacity:.14}));
    source.add(mesh);
  }
  group.add(sourceA, sourceB, target);

  const curves = [
    new THREE.CubicBezierCurve3(new THREE.Vector3(-1.6,.9,.2), new THREE.Vector3(.7,-.3,.8), new THREE.Vector3(.7,0,.4), new THREE.Vector3(1.7,1.15,.25)),
    new THREE.CubicBezierCurve3(new THREE.Vector3(-1.6,-.9,.2), new THREE.Vector3(.7,.3,-.3), new THREE.Vector3(.7,0,.4), new THREE.Vector3(1.7,-1.15,.25)),
  ];
  const tubes = curves.map((curve, i) => {
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, state.mobile ? 48 : 80, 0.038, 10, false),
      new THREE.MeshBasicMaterial({ color: i ? 0x4fe5d8 : 0xa78cff, transparent: true, opacity: 0.74, blending: THREE.AdditiveBlending }),
    );
    group.add(mesh);
    return mesh;
  });

  const particleGeometry = new THREE.SphereGeometry(0.085, 16, 12);
  const particles = Array.from({ length: state.mobile ? 10 : 18 }, (_, i) => {
    const mesh = new THREE.Mesh(particleGeometry, new THREE.MeshBasicMaterial({ color: i % 2 ? 0x62f1df : 0xc2aaff }));
    group.add(mesh);
    return mesh;
  });

  return objectHandle(group, (t) => {
    particles.forEach((particle, i) => {
      const curve = curves[i % 2];
      particle.position.copy(curve.getPoint((t * (0.14 + state.hover * 0.16) + i / particles.length) % 1));
    });
    group.rotation.y = Math.sin(t * 0.2) * 0.12 + state.pointer.x * 0.18;
    group.rotation.x = -0.08 - state.pointer.y * 0.14;
    tubes.forEach((tube, i) => { tube.material.opacity = 0.58 + state.hover * 0.24 + Math.sin(t * 1.2 + i) * 0.06; });
  });
}

function createAlpha(THREE, scene, state) {
  const group = new THREE.Group();
  scene.add(group);
  const geometry = new THREE.PlaneGeometry(3.7, 2.85, state.mobile ? 28 : 46, state.mobile ? 22 : 36);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: .34, metalness: .13,
    transparent: true, opacity: .9, emissive: 0x163d3d, emissiveIntensity: .15,
  }));
  group.add(mesh);
  const wire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: 0xc7fff0, wireframe: true, transparent: true, opacity: .15, depthWrite: false,
  }));
  group.add(wire);
  const valley = new THREE.Color(0x4b637b), base = new THREE.Color(0x5bbaad), peak = new THREE.Color(0xeaa681), rising = new THREE.Color(0xef5355), color = new THREE.Color();
  return objectHandle(group, t => {
    for (let i=0; i<position.count; i++) {
      const x=position.getX(i), y=position.getY(i);
      const g1=Math.exp(-2.7*((x+.75)**2+(y-.35)**2));
      const g2=Math.exp(-3.1*((x-.65)**2+(y+.55)**2));
      const g3=Math.exp(-3.9*((x+.1)**2+(y-.95)**2));
      const w1=.58+.3*Math.sin(t*.62), w2=.48+.32*Math.sin(t*.55+2.3);
      const z=w1*g1+w2*g2+.38*g3-.46*Math.exp(-2.8*((x-.28)**2+(y-.22)**2))+.13*Math.sin(2.2*x+1.6*y+t*.16);
      position.setZ(i,z-.12);
      color.copy(z<0?valley:base).lerp(peak,Math.max(0,z)*.85);
      const emergence=Math.max(0,Math.cos(t*.62))*g1+Math.max(0,Math.cos(t*.55+2.3))*g2;
      color.lerp(rising,Math.min(.92,emergence*.9));
      color.toArray(colors,i*3);
    }
    position.needsUpdate=true; geometry.attributes.color.needsUpdate=true;
    geometry.computeVertexNormals();
    group.rotation.set(-.76-state.pointer.y*.12,.18+Math.sin(t*.15)*.18+state.pointer.x*.18,-.26+Math.sin(t*.12)*.06);
    group.position.y=.08+Math.sin(t*.4)*.1;
  });
}

function createChebyshevProduction(THREE, scene, state) {
  const group=new THREE.Group();
  scene.add(group);
  const geometry=new THREE.PlaneGeometry(3.85,2.75,state.mobile?30:52,state.mobile?24:40);
  const position=geometry.attributes.position, colors=new Float32Array(position.count*3);
  const low=new THREE.Color(0x75cbd0), high=new THREE.Color(0xffe3ad), color=new THREE.Color();
  const height=(x,y)=>.25*Math.log1p(Math.exp(-2.2*x))+.16*(y+1.4)*Math.exp(-.75*x*x)-.53;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=height(x,y);
    position.setZ(i,z);color.copy(low).lerp(high,Math.max(0,Math.min(1,(z+.5)/1.1)));color.toArray(colors,i*3);
  }
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({
    vertexColors:true,side:THREE.DoubleSide,roughness:.26,metalness:.12,transparent:true,opacity:.85,
  })));
  group.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
    color:0xffffff,wireframe:true,transparent:true,opacity:.35,depthWrite:false,
  })));
  for(let j=0;j<9;j++){
    const points=Array.from({length:81},(_,i)=>{
      const x=-1.92+i*3.84/80,y=-1.37+j*2.74/8;
      return new THREE.Vector3(x,y,height(x,y)+.006);
    });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({
      color:j%3===0?0xba8d59:0x4b9297,transparent:true,opacity:j%3===0?.62:.38,
    })));
  }
  const dots=new Float32Array(54*3);
  for(let i=0;i<54;i++){
    const x=-1.75+(i%9)*.43,y=-1.22+Math.floor(i/9)*.47;
    dots.set([x,y,height(x,y)+.02],i*3);
  }
  const dotGeometry=new THREE.BufferGeometry();
  dotGeometry.setAttribute("position",new THREE.BufferAttribute(dots,3));
  group.add(new THREE.Points(dotGeometry,new THREE.PointsMaterial({color:0xfff9df,size:.035,transparent:true,opacity:.85})));
  return objectHandle(group,t=>{
    group.rotation.set(-.72-state.pointer.y*.11,-.22+Math.sin(t*.16)*.22+state.pointer.x*.18,-.13);
    group.position.y=Math.sin(t*.32)*.08;
  });
}

function objectHandle(group, update) {
  return {
    update(t, camera) {
      update(t);
      camera.position.x += (0 - camera.position.x) * 0.025;
      camera.lookAt(0, 0, 0);
    },
    dispose() {
      group.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      group.removeFromParent();
    },
  };
}

function addLights(THREE, scene, variant) {
  const light = variant === "chebyshev-production" ? 0xfff8e9 : 0xcfefff;
  scene.add(new THREE.AmbientLight(light, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3.5, 4.8, 5.5);
  scene.add(key);
  const rim = new THREE.PointLight(variant === "minkowski" || variant === "alpha" ? 0xffa45e : 0xa582ff, 5.4, 12);
  rim.position.set(-3, -1.8, 3.6);
  scene.add(rim);
  const fill = new THREE.PointLight(0x55eadb, 4.4, 11);
  fill.position.set(2.8, 1.4, -2.4);
  scene.add(fill);
}

function makeFallback(variant) {
  const fallback = document.createElement("div");
  fallback.className = `pkv-fallback pkv-fallback--${variant}`;
  for (let i = 0; i < 9; i += 1) {
    const span = document.createElement("span");
    span.style.setProperty("--i", String(i));
    fallback.appendChild(span);
  }
  return fallback;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

function noopHandle(root) {
  return { root, start() {}, stop() {}, dispose() { root.remove(); } };
}
