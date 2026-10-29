import { $, getJSON } from './lib.js';
import { countries, hasChart } from './data.js?v=3';

export async function createGlobe(onSelect, initial = countries[0]) {
 const canvas = $('globe'), ctx = canvas.getContext('2d');
 if (!window.d3 || !window.topojson || !ctx) throw new Error('Globe dependencies unavailable');
 const d3 = window.d3;
 const world = await getJSON('./assets/countries-110m.json');
 const features = window.topojson.feature(world,world.objects.countries).features;
 // world-atlas leaves Kosovo without an id; 383 is its ISO numeric code.
 const featureId = f => f.id!=null?String(f.id).padStart(3,'0'):f.properties.name==='Kosovo'?'383':'';
 const byId = new Map(countries.map(c=>[c.id,c]));
 const drawn = new Set(features.map(featureId));
 const markers = countries.filter(c=>!drawn.has(c.id));
 const projection = d3.geoOrthographic().rotate([-initial.center[0],-initial.center[1]]).clipAngle(90).precision(.5);
 const path = d3.geoPath(projection,ctx), grid=d3.geoGraticule10();
 let width=0,height=0,radius=0,centerY=0,selected=initial,drag=null,animation=0,zoom=1,pinchDistance=0,pinching=false,zoomAnimation=0,lastTap=null,zoomFallback=0;
 const touchPoints=new Map();
 const minZoom=.65,maxZoom=2.2;
 const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw() {
  ctx.clearRect(0,0,width,height);
  // Deterministic stars keep the canvas still when idle (no perpetual animation loop).
    for(let i=0;i<45;i++){ctx.fillStyle=`rgba(111,91,130,${.12+(i%4)*.08})`;ctx.beginPath();ctx.arc((i*97+31)%width,(i*67+17)%height,i%3===0?1:.5,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.shadowColor='#b47ad2';ctx.shadowBlur=23;ctx.beginPath();path({type:'Sphere'});ctx.fillStyle='#f6eff9';ctx.fill();ctx.restore();
    const ocean=ctx.createRadialGradient(width/2-radius*.4,centerY-radius*.5,10,width/2,centerY,radius);
    ocean.addColorStop(0,'#fff5df');ocean.addColorStop(.58,'#d9eefa');ocean.addColorStop(1,'#aacce4');
  ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=ocean;ctx.fill();
    ctx.beginPath();path(grid);ctx.strokeStyle='#ffffffa8';ctx.lineWidth=.5;ctx.stroke();
    for(const f of features){ctx.beginPath();path(f);const id=featureId(f),active=id===selected.id,listed=byId.get(id),charted=!!listed&&hasChart(listed);ctx.fillStyle=active?'#ef7f91':charted?'#d5c4ea':'#eeebf0';ctx.strokeStyle=active?'#fff6e8':charted?'#a894bc':'#cdc4d6';ctx.lineWidth=active?1.3:.55;ctx.fill();ctx.stroke();}
    const view=projection.invert([width/2,centerY]);
    for(const c of markers){if(d3.geoDistance(view,c.center)>=Math.PI/2)continue;const [x,y]=projection(c.center),active=c.id===selected.id;ctx.beginPath();ctx.arc(x,y,active?4.2:2.6,0,Math.PI*2);ctx.fillStyle=active?'#ef7f91':hasChart(c)?'#9a76c0':'#cdc4d6';ctx.fill();ctx.strokeStyle=active?'#fff6e8':'#ffffffcc';ctx.lineWidth=active?1.3:.8;ctx.stroke();}
    const shade=ctx.createRadialGradient(width/2-radius*.38,centerY-radius*.45,radius*.2,width/2,centerY,radius);shade.addColorStop(0,'#ffffff24');shade.addColorStop(.75,'#ffffff00');shade.addColorStop(1,'#34425a24');ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=shade;ctx.fill();
    ctx.beginPath();path({type:'Sphere'});ctx.strokeStyle='#ffffffd6';ctx.lineWidth=.8;ctx.stroke();
  const center=projection.invert([width/2,centerY]);
  $('coordinate').textContent=`${Math.abs(center[1]).toFixed(1)}° ${center[1]>=0?'N':'S'} · ${Math.abs(center[0]).toFixed(1)}° ${center[0]>=0?'E':'W'}`;
 }
 function setZoom(value){zoom=Math.max(minZoom,Math.min(maxZoom,value));projection.scale(radius*zoom);draw();}
 function animateZoom(target){cancelAnimationFrame(zoomAnimation);clearTimeout(zoomFallback);const from=zoom,begin=performance.now();function frame(now){const t=motion?Math.min((now-begin)/280,1):1;setZoom(from+(target-from)*(1-Math.pow(1-t,3)));if(t<1)zoomAnimation=requestAnimationFrame(frame);}zoomAnimation=requestAnimationFrame(frame);zoomFallback=setTimeout(()=>{cancelAnimationFrame(zoomAnimation);setZoom(target);},400);}
 // Two quick taps in roughly the same spot reset the zoom (also covers mouse double-click and iOS, which skips dblclick).
 function registerTap(e){const now=performance.now();if(lastTap&&now-lastTap.time<320&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<32){lastTap=null;animateZoom(1);}else lastTap={time:now,x:e.clientX,y:e.clientY};}
 function touchGap(){const points=[...touchPoints.values()];return Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);}
 function resize(){const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;width=box.width;height=box.height;centerY=height*.47;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);radius=Math.min(width*.46,height*.44);projection.translate([width/2,centerY]).scale(radius*zoom);draw();}
 function countryAtCenter(){const center=projection.invert([width/2,centerY]);const containing=features.find(f=>d3.geoContains(f,center));if(containing){const id=featureId(containing),mapped=byId.get(id);if(mapped)return mapped;return {code:null,id,name:containing.properties.name,en:containing.properties.name,center:d3.geoCentroid(containing)};}return countries.reduce((best,c)=>d3.geoDistance(center,c.center)<d3.geoDistance(center,best.center)?c:best,countries[0]);}
 function snap(country){selected=country;cancelAnimationFrame(animation);const start=projection.rotate(),target=[-country.center[0],-country.center[1],0];let delta=((target[0]-start[0]+540)%360)-180;const begin=performance.now();function frame(now){const t=motion?Math.min((now-begin)/650,1):1;const ease=1-Math.pow(1-t,4);projection.rotate([start[0]+delta*ease,start[1]+(target[1]-start[1])*ease,0]);draw();if(t<1)animation=requestAnimationFrame(frame);}animation=requestAnimationFrame(frame);}
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){if(touchPoints.size>=2)return;cancelAnimationFrame(animation);canvas.setPointerCapture(e.pointerId);touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPoints.size===1)drag={id:e.pointerId,x:e.clientX,y:e.clientY,rotation:projection.rotate()};else{drag=null;pinching=true;pinchDistance=touchGap();}return;}if(!e.isPrimary)return;cancelAnimationFrame(animation);canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,rotation:projection.rotate()};});
 canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&touchPoints.has(e.pointerId)){touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPoints.size===2){const distance=touchGap();if(pinchDistance>0){cancelAnimationFrame(zoomAnimation);clearTimeout(zoomFallback);setZoom(zoom*distance/pinchDistance);}pinchDistance=distance;return;}}if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;projection.rotate([drag.rotation[0]+(e.clientX-drag.x)*.4,Math.max(-80,Math.min(80,drag.rotation[1]-(e.clientY-drag.y)*.4)),0]);selected=countryAtCenter();draw();});
 canvas.addEventListener('wheel',e=>{e.preventDefault();cancelAnimationFrame(zoomAnimation);clearTimeout(zoomFallback);setZoom(zoom*Math.exp(-e.deltaY*.002));},{passive:false});
 function finish(e){let moved=false;if(e.pointerType==='touch'&&touchPoints.has(e.pointerId)){const wasPinching=pinching;touchPoints.delete(e.pointerId);if(touchPoints.size===1){const [id,point]=touchPoints.entries().next().value;drag={id,x:point.x,y:point.y,rotation:projection.rotate()};pinchDistance=0;return;}moved=!!drag?.moved;drag=null;pinchDistance=0;pinching=false;if(wasPinching)return;}else{if(!drag||drag.id!==e.pointerId)return;moved=!!drag.moved;drag=null;}const country=countryAtCenter();snap(country);if(moved||e.type==='pointercancel')onSelect(country);else registerTap(e);}
 canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
 canvas.addEventListener('keydown',e=>{const r=projection.rotate();if(e.key==='ArrowLeft')r[0]-=12;else if(e.key==='ArrowRight')r[0]+=12;else if(e.key==='ArrowUp')r[1]=Math.min(80,r[1]+10);else if(e.key==='ArrowDown')r[1]=Math.max(-80,r[1]-10);else if(e.key==='Enter'){const c=countryAtCenter();snap(c);onSelect(c);e.preventDefault();return;}else return;e.preventDefault();cancelAnimationFrame(animation);projection.rotate(r);selected=countryAtCenter();draw();});
 new ResizeObserver(resize).observe(canvas);resize();$('globe-loading').hidden=true;
 return {select:snap,refresh:draw};
}
