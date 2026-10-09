import * as THREE from '../vendor/three.module.js';

// Only sampled display prices are served. No calibration code or fitted
// coefficients are required by this viewer.
export function sampleSurface(data, m, tau) {
  const bracket=(axis,x)=>{
    let i=0; while(i<axis.length-2&&axis[i+1]<x)i++;
    return [i,Math.max(0,Math.min(1,(x-axis[i])/(axis[i+1]-axis[i])))];
  };
  const [i,u]=bracket(data.m,m),[j,v]=bracket(data.tau,tau);
  const p=data.prices;
  return (1-u)*((1-v)*p[j][i]+v*p[j+1][i])+u*((1-v)*p[j][i+1]+v*p[j+1][i+1]);
}

async function mount(root) {
  const stage=root.querySelector('.saved-surface-stage'),caption=root.querySelector('[data-surface-caption]');
  const spin=root.querySelector('[data-surface-spin]'),reset=root.querySelector('[data-surface-reset]');
  let renderer;
  try {
    const response=await fetch(root.dataset.savedSurface);
    if(!response.ok)throw Error('Saved surface data unavailable');
    const data=await response.json();
    if(data.m.length<2||data.tau.length<2||data.prices.length!==data.tau.length||data.prices.some(row=>row.length!==data.m.length||row.some(x=>!Number.isFinite(x))))throw Error('Invalid saved grid');
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    const canvas=renderer.domElement;
    canvas.tabIndex=0; canvas.setAttribute('aria-label','Saved option surface. Drag to rotate, Shift-drag to pan, scroll to zoom. Arrow keys rotate; plus and minus zoom.');
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100),group=new THREE.Group();
    scene.add(group,new THREE.AmbientLight(0xf1ffff,2));
    const key=new THREE.DirectionalLight(0xfff1d0,2.5);key.position.set(-3,6,4);scene.add(key);
    const fill=new THREE.DirectionalLight(0x82cdd2,1.4);fill.position.set(4,2,-3);scene.add(fill);
    const maxPrice=Math.max(...data.prices.flat()),m0=data.m[0],m1=data.m.at(-1),t0=data.tau[0],t1=data.tau.at(-1);
    const point=(m,tau)=>new THREE.Vector3(4*(m-m0)/(m1-m0)-2,sampleSurface(data,m,tau)/maxPrice*2-.75,2.9*(tau-t0)/(t1-t0)-1.45);
    const nx=64,ny=42,positions=[],colors=[],indices=[];
    const low=new THREE.Color(0x54a7b5),high=new THREE.Color(0xf5d9a3),color=new THREE.Color();
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const p=point(m0+(m1-m0)*i/nx,t0+(t1-t0)*j/ny);
      positions.push(p.x,p.y,p.z);color.copy(low).lerp(high,(p.y+.75)/2);colors.push(color.r,color.g,color.b);
      if(i<nx&&j<ny){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1);}
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.42,metalness:.08})));
    const gridMaterial=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.56});
    for(let j=0;j<=14;j++){
      const tau=t0+(t1-t0)*j/14,points=Array.from({length:65},(_,i)=>{const p=point(m0+(m1-m0)*i/64,tau);p.y+=.007;return p;});
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));
    }
    for(let i=0;i<=20;i++){
      const m=m0+(m1-m0)*i/20,points=Array.from({length:43},(_,j)=>{const p=point(m,t0+(t1-t0)*j/42);p.y+=.007;return p;});
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));
    }
    const axes=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2,-.77,-1.45),new THREE.Vector3(2.15,-.77,-1.45),
      new THREE.Vector3(-2,-.77,-1.45),new THREE.Vector3(-2,-.77,1.6),
      new THREE.Vector3(-2,-.77,-1.45),new THREE.Vector3(-2,1.4,-1.45),
    ]),new THREE.LineBasicMaterial({color:0x719495,transparent:true,opacity:.7}));group.add(axes);
    const labels=document.createElement('div');labels.className='saved-surface-axis';
    labels.textContent='Log-moneyness m · Maturity τ (years) · Forward-discounted call price';stage.appendChild(labels);
    caption.textContent=data.caption+' Display mesh interpolates the archived grid; it does not recalibrate the surface.';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let auto=!reduced,visible=false,frame=0,last=0,pointer=null,idleUntil=0,yaw=-.5,pitch=.08,zoom=7.6,panX=0,panY=0;
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    const label=()=>{spin.textContent=auto?'Pause rotation':'Resume rotation';spin.setAttribute('aria-pressed',String(auto));};label();
    const render=()=>{
      group.rotation.set(pitch,yaw,0);group.position.set(panX,panY,0);
      camera.position.set(0,zoom*.54,zoom*.84);camera.lookAt(0,.15,0);renderer.render(scene,camera);
      // Expose view state on the rendered element for accessibility/debug checks.
      canvas.dataset.orientation=[pitch,yaw].map(x=>x.toFixed(4)).join(',');canvas.dataset.zoom=zoom.toFixed(2);
    };
    const tick=now=>{
      frame=0;if(!visible||document.hidden)return;
      if(auto&&!pointer&&now>idleUntil)yaw+=(last?Math.min(.05,(now-last)/1000):0)*.1;
      last=now;render();if(auto||pointer)frame=requestAnimationFrame(tick);
    };
    const request=()=>{if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);};
    const resize=()=>{const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();request();};
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;if(visible)request();else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe(stage);
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;e.preventDefault();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,pan:e.shiftKey||e.button===2};canvas.setPointerCapture(e.pointerId);request();});
    canvas.addEventListener('pointermove',e=>{
      if(!pointer||e.pointerId!==pointer.id)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;
      if(pointer.pan){panX=clamp(panX+dx*.006,-1.8,1.8);panY=clamp(panY-dy*.006,-1.3,1.3);}
      else{yaw+=dx*.007;pitch=clamp(pitch+dy*.005,-.65,.75);}render();
    });
    const release=e=>{if(pointer?.id!==e.pointerId)return;pointer=null;idleUntil=performance.now()+1500;last=0;request();};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(e.deltaY*.001),4,13);idleUntil=performance.now()+1500;render();},{passive:false});
    canvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();
      if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;
      if(e.key==='ArrowUp')pitch=clamp(pitch-.08,-.65,.75);if(e.key==='ArrowDown')pitch=clamp(pitch+.08,-.65,.75);
      if(e.key==='+'||e.key==='=')zoom=clamp(zoom*.9,4,13);if(e.key==='-')zoom=clamp(zoom/ .9,4,13);
      idleUntil=performance.now()+1500;render();
    });
    spin.addEventListener('click',()=>{auto=!auto;label();last=0;request();});
    reset.addEventListener('click',()=>{yaw=-.5;pitch=.08;zoom=7.6;panX=0;panY=0;idleUntil=0;render();request();});
    document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else request();});
    resize();root.dataset.surfaceReady='true';
  } catch(error) {
    renderer?.dispose();caption.textContent='The saved surface viewer is unavailable in this browser. The summary PDF remains available above.';
    spin.disabled=true;reset.disabled=true;root.dataset.surfaceReady='false';console.error('Saved surface:',error.message);
  }
}
if(typeof document!=='undefined')for(const root of document.querySelectorAll('[data-saved-surface]'))mount(root);
