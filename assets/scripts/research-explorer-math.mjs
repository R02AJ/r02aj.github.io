// Pure numerical helpers shared by the explorers and their regression tests.
export const TAU = 2 * Math.PI;
export const dot = (a,b) => a[0]*b[0]+a[1]*b[1];
const cross = (a,b) => a[0]*b[1]-a[1]*b[0];
export function supportBody(t, deformation) {
  const e=.09*deformation, h=1+e*Math.cos(3*t), dh=-3*e*Math.sin(3*t);
  return { q:[h*Math.cos(t)-dh*Math.sin(t), h*Math.sin(t)+dh*Math.cos(t)],
    p:[Math.cos(t)/h,Math.sin(t)/h], h, curvatureRadius:1-8*e*Math.cos(3*t) };
}
export function bodyPolygon(deformation, n=240) {
  return Array.from({length:n},(_,i)=>supportBody(TAU*i/n,deformation).q);
}
export function nextCollision(pos, velocity, polygon) {
  let best=null;
  for(let i=0;i<polygon.length;i++) {
    const a=polygon[i], b=polygon[(i+1)%polygon.length], edge=[b[0]-a[0],b[1]-a[1]], delta=[a[0]-pos[0],a[1]-pos[1]];
    const den=cross(velocity,edge); if(Math.abs(den)<1e-12) continue;
    const t=cross(delta,edge)/den, u=cross(delta,velocity)/den;
    if(t>1e-7&&u>=-1e-9&&u<=1+1e-9&&(!best||t<best.time)) {
      const length=Math.hypot(...edge), tangent=edge.map(v=>v/length);
      best={time:t,tangent,normal:[tangent[1],-tangent[0]]};
    }
  }
  return best;
}
export function reflectedAngle(incoming, tangent, normal, deformation) {
  const target=dot(supportBody(incoming,deformation).p,tangent);
  const f=t=>dot(supportBody(t,deformation).p,tangent)-target;
  const n=180;
  for(let i=0;i<n;i++) {
    let lo=TAU*i/n, hi=TAU*(i+1)/n, flo=f(lo);
    if(flo*f(hi)>0) continue;
    for(let j=0;j<32;j++) { const mid=(lo+hi)/2, fm=f(mid); if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;} }
    const angle=(lo+hi)/2;
    if(dot(supportBody(angle,deformation).q,normal)<-1e-8) return angle;
  }
  // A grazing state has no separated second root; it is not seeded by the demo.
  return incoming+Math.PI;
}
export function advanceParticle(p, distance, deformation, polygon) {
  let remaining=distance;
  for(let k=0;k<8&&remaining>1e-8;k++) {
    const velocity=supportBody(p.angle,deformation).q, hit=nextCollision(p.pos,velocity,polygon);
    const step=hit?Math.min(remaining,hit.time):remaining;
    p.pos=[p.pos[0]+velocity[0]*step,p.pos[1]+velocity[1]*step];
    remaining-=step;
    if(hit&&step>=hit.time-1e-10) {
      p.trail.push([...p.pos]);
      p.angle=reflectedAngle(p.angle,hit.tangent,hit.normal,deformation);
      p.pos=[p.pos[0]-hit.normal[0]*1e-7,p.pos[1]-hit.normal[1]*1e-7];
    }
  }
  return p;
}
// Preserve a particle's radial position when the display table changes. This
// changes only the interactive picture; every subsequent chord uses the new gauge.
export function remapParticle(p, oldPolygon, newPolygon) {
  const length=Math.hypot(...p.pos);
  if(length<1e-10){p.trail=[];return p;}
  const direction=p.pos.map(x=>x/length);
  const oldRadius=nextCollision([0,0],direction,oldPolygon)?.time;
  const newRadius=nextCollision([0,0],direction,newPolygon)?.time;
  if(oldRadius&&newRadius){
    const fraction=Math.min(length/oldRadius,1-1e-6);
    p.pos=direction.map(x=>x*newRadius*fraction);
  }
  p.trail=[];
  return p;
}
export function ridgePrediction(label) { return [-2*label/7,2*label/7]; }
export function normalCDF(x) {
  const a=Math.abs(x), t=1/(1+.2316419*a);
  const tail=Math.exp(-a*a/2)/Math.sqrt(TAU)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?1-tail:tail;
}
export function optionReference(strike, maturity) {
  const s=.25*Math.sqrt(maturity), d1=(-Math.log(strike)+s*s/2)/s, d2=d1-s;
  return {price:normalCDF(d1)-strike*normalCDF(d2), slope:-normalCDF(d2), density:Math.exp(-d2*d2/2)/(Math.sqrt(TAU)*strike*s)};
}
export function foldedPoint(u,v,progress) {
  const R=1.15,r=.54;
  const roll=Math.min(1,progress*2), bend=Math.max(0,progress*2-1);
  const y=roll<1e-5?r*v:r*Math.sin(roll*v)/roll;
  const z=roll<1e-5?0:r*(Math.cos(roll*v)-1)/roll+roll*r;
  if(bend<1e-5)return [R*u,y,z];
  return [(R/bend+z)*Math.sin(bend*u),y,(R/bend+z)*Math.cos(bend*u)-R/bend+R*bend];
}
