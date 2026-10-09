import {TAU,supportBody,bodyPolygon,advanceParticle,remapParticle,ridgePrediction,optionReference,foldedPoint} from './research-explorer-math.mjs?v=20261009';

const teal='#82ded3', gold='#edc288', lilac='#b7a6e2', muted='#a4bdbd', white='#eef4ee';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mix=(a,b,t)=>a+(b-a)*t;
function line(c,points,color,width=1,close=false,fill=null) {
  if(!points.length)return;
  c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);
  if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill();}
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function dot(c,x,y,r,color,glow=false) {
  c.save();if(glow){c.shadowBlur=14;c.shadowColor=color;}
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();c.restore();
}
function text(c,s,x,y,color=muted,align='left',size=12) {
  c.fillStyle=color;c.font=`${size}px Poppins, sans-serif`;c.textAlign=align;c.fillText(s,x,y);
}
function project(p,w,h,scale=1) {
  const yaw=.38, tilt=.68, x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw), z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
  const y=p[1]*Math.cos(tilt)-z*Math.sin(tilt), depth=p[1]*Math.sin(tilt)+z*Math.cos(tilt);
  const s=Math.min(w/8.5,h/5)*scale;
  return [w/2+x*s,h*.51-y*s,depth];
}
const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));

function foliation(env) {
  const {c,w,h,value,mode}=env, t=value/100;
  text(c,mode==='circle'?'ONE PERIODIC DIRECTION':'TWO PERIODIC DIRECTIONS',20,28);
  if(mode==='circle') {
    const points=sample(180,s=>{const u=(s-.5)*TAU,a=Math.max(.00001,t);
      return [w/2+Math.sin(a*u)/a*Math.min(w/8,h/4),h*.51+(Math.cos(a*u)-1)/a*Math.min(w/8,h/4)+t*Math.min(w/8,h/4)];});
    line(c,points,teal,2.4);dot(c,...points[0],5,gold,true);dot(c,...points.at(-1),5,gold,true);
    const p=points[90];text(c,'S¹',w/2,h*.85,white,'center',18);
    if(t<.9){text(c,'0',points[0][0],points[0][1]+24,gold,'center');text(c,'1',points.at(-1)[0],points.at(-1)[1]+24,gold,'center');}
    env.status(t<.99?'The two gold endpoints represent the same point of a periodic interval.':'The endpoints meet: a circle is the one-dimensional torus.');
  } else {
    // Draw a translucent surface first, sorted back-to-front.
    const faces=[],N=32,M=20;
    for(let i=0;i<N;i++)for(let j=0;j<M;j++){
      const pts=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>project(foldedPoint((a/N-.5)*TAU,(b/M-.5)*TAU,t),w,h,1+.45*Math.max(0,t*2-1)));
      faces.push({pts,z:pts.reduce((s,p)=>s+p[2],0),shade:(i+j)%2});
    }
    faces.sort((a,b)=>a.z-b.z);
    for(const f of faces)line(c,f.pts.map(p=>p.slice(0,2)),'rgba(116,216,205,.13)',.6,true,f.shade?'rgba(91,176,167,.12)':'rgba(125,132,190,.10)');
    for(let k=0;k<=8;k++){
      const u=(k/8-.5)*TAU;
      line(c,sample(90,s=>project(foldedPoint(u,(s-.5)*TAU,t),w,h,1+.45*Math.max(0,t*2-1)).slice(0,2)),k===0||k===8?gold:'rgba(157,207,207,.38)',k===0||k===8?2:1);
      line(c,sample(90,s=>project(foldedPoint((s-.5)*TAU,u,t),w,h,1+.45*Math.max(0,t*2-1)).slice(0,2)),k===0||k===8?lilac:'rgba(157,207,207,.30)',k===0||k===8?2:1);
    }
    // A (1,1) winding; periodic endpoints match at the fully closed torus.
    line(c,sample(200,s=>project(foldedPoint((s-.5)*TAU,(s-.5)*TAU,t),w,h,1+.45*Math.max(0,t*2-1)).slice(0,2)),gold,2.5);
    text(c,t<.49?'rectangle':t<.99?'cylinder → torus':'T² · a closed rational winding',w/2,h-22,white,'center');
    env.status(t<.49?'Opposite purple edges come together first: the rectangle rolls into a cylinder.':t<.99?'Now identify the cylinder’s two ends. The gold trajectory winds around both periodic directions.':'Both pairs of edges are identified. The gold rational winding closes on the torus.');
  }
  env.output(Math.round(value)+'%');
}

function holonomy({c,w,h,mode,status}) {
  const shift=mode==='shift',x0=w*.15,x1=w*.85,cy=h*.52,gap=h*.19;
  for(let i=-1;i<=1;i++){
    const y0=cy+i*gap,dy=shift?-gap*.48:0,color=[lilac,teal,gold][i+1];
    const pts=sample(90,t=>[mix(x0,x1,t),y0+dy*t+Math.sin(TAU*t)*h*.05]);
    line(c,pts,color,2);dot(c,x0,y0,4,color);dot(c,x1,y0+dy,4,color,true);
    text(c,'t'+(i+2),x0-15,y0+4,color,'right');
    text(c,shift?'H(t'+(i+2)+')':'t'+(i+2),x1+12,y0+dy+4,color);
  }
  text(c,'start',x0,25,muted,'center');text(c,'after one primitive period',x1,25,muted,'center',w<500?9:12);
  status(shift?'The family can be preserved while a leaf returns with a different label. This weaker condition does not imply rigidity.':'Each labelled leaf closes in its primitive class. This is the hypothesis used by the theorem.');
}

function makeBilliard() {
  let deformation=-1,polygon=[],particles=[];
  const seed=()=>{
    particles=Array.from({length:6},(_,i)=>({pos:[.11*Math.cos(i),.11*Math.sin(i)],angle:.31+i*.93,trail:[]}));
    // Start with a few complete chords, including when reduced motion is enabled.
    for(const p of particles)advanceParticle(p,4,deformation,polygon);
  };
  return env=>{
    const {c,w,h,value,dt,paused,reset}=env,d=value/100;
    if(deformation<0||reset){deformation=d;polygon=bodyPolygon(d);seed();}
    else if(d!==deformation){
      const next=bodyPolygon(d);
      for(const p of particles)remapParticle(p,polygon,next);
      deformation=d;polygon=next;
    }
    const scale=Math.min(w/3.9,h/2.8),map=([x,y])=>[w*.5+x*scale*1.45,h*.53-y*scale*.87];
    text(c,'TABLE = UNIT BALL OF THE GAUGE',18,27,muted,'left',w<500?10:12);
    const shape=polygon.map(map);
    c.save();c.shadowColor='#50bcb3';c.shadowBlur=24;
    line(c,shape,'rgba(167,237,218,.7)',1.8,true,'rgba(61,126,125,.16)');c.restore();
    for(const r of [.25,.5,.75])line(c,polygon.map(([x,y])=>map([x*r,y*r])),'rgba(156,198,192,.09)',1,true);
    line(c,[[w/2-5,h*.53],[w/2+5,h*.53]],muted,.8);
    line(c,[[w/2,h*.53-5],[w/2,h*.53+5]],muted,.8);
    for(let i=0;i<particles.length;i++){
      const p=particles[i],color=[teal,gold,lilac,'#cbefc1','#97bfdc','#e3aba2'][i];
      if(!paused)advanceParticle(p,dt*.52,d,polygon);
      if(p.trail.length>14)p.trail.splice(0,p.trail.length-14);
      line(c,[...p.trail,p.pos].map(map),color+'66',1);
      dot(c,...map(p.pos),3.5,color,true);
    }
    text(c,d<.005?'inner-product gauge':'asymmetric non-inner-product gauge',w/2,h-20,white,'center',w<500?10:12);
    env.output(Math.round(value)+'%');
    env.status(d<.005?'Ellipse: table and gauge become a round disk together under a linear change of coordinates.':'The body remains smooth and strictly convex, but is no longer an ellipse. It cannot have the theorem’s full invariant-graph foliation.');
  };
}

function memory(env) {
  const {c,w,h,value}=env,y=value/100,preds=ridgePrediction(y);
  text(c,'DIFFERENT EVIDENCE · ONE COMMON UPDATE',18,27,muted,'left',w<500?9:12);
  for(let i=0;i<2;i++){
    const cx=w*(i?.73:.27),cy=h*.42,r=Math.min(w*.155,h*.2),sign=i?-1:1,color=i?gold:teal;
    line(c,[[cx-r*1.3,cy],[cx+r*1.3,cy]],'#527172',.7);
    line(c,[[cx,cy-r*1.3],[cx,cy+r*1.3]],'#527172',.7);
    // Level sets x^T C x = 1, drawn using their exact radial function.
    const ellipse=sample(160,t=>{const a=t*TAU,rad=r/Math.sqrt(1+sign*Math.cos(a)*Math.sin(a));return[cx+rad*Math.cos(a),cy-rad*Math.sin(a)];});
    line(c,ellipse,color,1.7,true,color+'10');
    text(c,i?'History −':'History +',cx,cy-r*1.55,white,'center');
    const x=cx+r*(4*y/7), yy=cy-r*preds[i];line(c,[[cx,cy],[x,yy]],color,2.5);dot(c,x,yy,4,color,true);
    text(c,'query e₂',cx,h*.72,muted,'center');
    text(c,(preds[i]>=0?'+':'−')+Math.abs(preds[i]).toFixed(3),cx,h*.80,color,'center',w<500?22:28);
    text(c,y===1?(i?'+2/7':'−2/7'):'updated prediction',cx,h*.87,muted,'center',11);
  }
  env.output(y.toFixed(2));
  env.status(y<.005?'At y = 0, both predictors are zero everywhere. The evidence ellipses are already different.':'The same observation produces opposite answers at e₂. A memory storing only the old predictor cannot recover this difference.');
}

function alpha(env) {
  const {c,w,h,value}=env,cost=value/100,left=w*.12,right=w*.9,top=h*.18,bottom=h*.81;
  const X=x=>mix(left,right,(x+2)/4),Y=y=>mix(bottom,top,(y+3.2)/4.5);
  line(c,[[left,Y(0)],[right,Y(0)]],'#698485',1);
  line(c,[[X(0),top],[X(0),bottom]],'#405e62',1);
  const gross=x=>.5+.55*x-.35*x*x;
  line(c,sample(160,t=>{const x=-2+4*t;return[X(x),Y(gross(x))];}),teal,2.3);
  line(c,sample(160,t=>{const x=-2+4*t;return[X(x),Y(gross(x)-cost)];}),gold,2.3);
  const gx=X(.45);line(c,[[gx,Y(gross(.45))],[gx,Y(gross(.45)-cost)]],white,1.5);
  dot(c,X(0),Y(gross(0)-cost),4,gold,true);
  text(c,'gross',left,28,teal);text(c,'after friction',left+65,28,gold);
  text(c,'adverse scenario',left,h*.92,muted);text(c,'favourable scenario',right,h*.92,muted,'right');
  text(c,'zero payoff',right,Y(0)-8,muted,'right',10);
  env.output(cost.toFixed(2));
  env.status(cost<.5?'Friction reduces every scenario payoff. Gross forecast value and net economic value remain separate quantities.':'At this friction level, even the central scenario has no positive net payoff. Predictability alone is not a trading decision.');
}

function surface(env) {
  const {c,w,h,value,mode}=env,T=value/100,field=mode||'price';
  const zmax={price:.45,slope:1,density:5.5}[field];
  const val=(k,t)=>optionReference(k,t)[field];
  const projectSurface=(k,t,z)=>{
    const x=(k-1)*5.3, y=(t-1.05)*1.7, height=field==='slope'?(z+1)*2.3:z/zmax*2.3;
    const s=Math.min(w/6.7,h/5.2);
    return[w*.5+(x*.9+y*.52)*s,h*.7+(y*.4-x*.2-height)*s];
  };
  const rows=22,cols=38,faces=[];
  for(let j=rows-1;j>=0;j--)for(let i=0;i<cols;i++){
    const pts=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const k=.6+a/cols*.8,t=.1+b/rows*1.9;return projectSurface(k,t,val(k,t));});
    line(c,pts,'rgba(149,225,217,.28)',.65,true,`rgba(71,158,155,${.1+j/rows*.09})`);
  }
  line(c,sample(160,s=>{const k=.6+s*.8;return projectSurface(k,T,val(k,T));}),gold,2.6);
  const marker=projectSurface(1,T,val(1,T));dot(c,...marker,4,gold,true);
  text(c,{price:'CALL PRICE / FORWARD',slope:'STRIKE DERIVATIVE',density:'RISK-NEUTRAL DENSITY'}[field],18,27,teal,'left',w<500?10:12);
  text(c,'K / F   0.6 → 1.4',w*.1,h-22,muted,'left',10);
  text(c,'expiry   0.1 → 2 yr',w*.9,h-22,muted,'right',10);
  text(c,'at K/F = 1: '+val(1,T).toFixed(3),w*.9,49,gold,'right',11);
  env.output(T.toFixed(2)+' yr');
  env.status({price:'The gold curve selects one expiry. Calls decrease with strike and remain convex in this analytic reference model.',slope:'The plotted quantity is ∂C/∂K, not spot delta. The same reference model keeps it between −1 and 0.',density:'The plotted quantity is ∂²C/∂K². It is nonnegative; shorter expiries concentrate its mass near the forward.'}[field]);
}

function slopes(env) {
  const {c,w,h,mode}=env,scale=Math.min(w/5,h/3.6),cx=w*.5,cy=h*.5;
  const map=(x,y)=>[cx+x*scale,cy-y*scale];
  line(c,[map(-1.8,0),map(1.8,0)],'#567374',1);
  line(c,[map(0,-1.3),map(0,1.3)],'#567374',1);
  if(mode==='two'){
    line(c,sample(180,t=>map(Math.cos(t*TAU),Math.sin(t*TAU))),teal,1.5);
    for(const x of [-1,1]){dot(c,...map(x,0),5,gold,true);text(c,'('+x+', 0)',...map(x,-.3),gold,'center');}
    dot(c,...map(0,0),3,teal);text(c,'rational centre',...map(0,.18),teal,'center');
    env.status('Two rational slopes lie on a rational-centred circle: this set does not force rigidity.');
  } else if(mode==='three') {
    for(const x of [-1,0,1]){dot(c,...map(x,0),5,gold,true);text(c,'('+x+', 0)',...map(x,-.3),gold,'center');}
    text(c,'No circle contains three distinct collinear points.',w/2,h*.2,teal,'center',w<500?10:12);
    env.status('Three distinct collinear rational slopes lie on no sphere at all. With the common-volume hypothesis, this set forces zero vertical force.');
  } else {
    const mid=Math.SQRT2/2,offset=-mid;const m=(x,y)=>map(x+offset,y);
    line(c,sample(180,t=>m(mid+mid*Math.cos(t*TAU),mid*Math.sin(t*TAU))),lilac,1);
    line(c,[m(mid,-1.2),m(mid,1.2)],lilac,1);
    dot(c,...m(0,0),5,gold,true);dot(c,...m(Math.SQRT2,0),5,gold,true);
    text(c,'(0, 0)',...m(0,-.3),gold,'center');text(c,'(√2, 0)',...m(Math.SQRT2,-.3),gold,'center');
    text(c,'every centre has x = √2/2',w/2,h*.17,lilac,'center');
    env.status('Circles exist, but every possible centre has an irrational first coordinate. No rational-centred circle exists: the shared-volume hypothesis forces rigidity.');
  }
}

const renderers={foliation,holonomy,memory,alpha,surface,slopes};
for(const root of document.querySelectorAll('[data-explorer]')) {
  const canvas=root.querySelector('canvas'),c=canvas.getContext('2d');
  if(!c){root.querySelector('[data-status]').textContent='Canvas is unavailable in this browser. The explanation below gives the result.';continue;}
  const slider=root.querySelector('[data-slider]'),out=root.querySelector('[data-value]'),status=root.querySelector('[data-status]');
  const state={value:Number(slider?.value||0),mode:root.querySelector('[data-mode][aria-pressed=true]')?.dataset.mode,paused:reduced,visible:false,dirty:true,reset:false,frame:0,last:0};
  const render=root.dataset.explorer==='minkowski'?makeBilliard():renderers[root.dataset.explorer];
  const set=(el,s)=>{if(el&&el.textContent!==s)el.textContent=s;};
  function paint(now) {
    state.frame=0;
    if(!state.visible)return;
    const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0);
    const gradient=c.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#102029');gradient.addColorStop(.6,'#17343a');gradient.addColorStop(1,'#29272f');
    c.fillStyle=gradient;c.fillRect(0,0,w,h);
    for(let i=1;i<12;i++){line(c,[[w*i/12,0],[w*i/12,h]],'rgba(172,220,210,.025)',1);}
    render({...state,c,w,h,dt:state.last?Math.min(.045,(now-state.last)/1000):0,output:s=>set(out,s),status:s=>set(status,s)});
    state.last=now;state.reset=false;state.dirty=false;
    if(root.dataset.explorer==='minkowski'&&!state.paused)state.frame=requestAnimationFrame(paint);
  }
  function request(){state.dirty=true;if(state.visible&&!state.frame)state.frame=requestAnimationFrame(paint);}
  slider?.addEventListener('input',()=>{state.value=Number(slider.value);request();});
  for(const button of root.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{
    state.mode=button.dataset.mode;for(const b of root.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b===button));request();
  });
  const pause=root.querySelector('[data-pause]');
  const pauseLabel=()=>{if(pause){pause.textContent=state.paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(state.paused));}};
  pauseLabel();pause?.addEventListener('click',()=>{state.paused=!state.paused;state.last=0;pauseLabel();request();});
  root.querySelector('[data-reset]')?.addEventListener('click',()=>{state.reset=true;request();});
  new ResizeObserver(request).observe(canvas);
  new IntersectionObserver(([entry])=>{state.visible=entry.isIntersecting;state.last=0;if(state.visible)request();else if(state.frame){cancelAnimationFrame(state.frame);state.frame=0;}},{rootMargin:'100px'}).observe(root);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state.frame)cancelAnimationFrame(state.frame);state.frame=0;}else request();});
}
