// ---------- environments
const THEMES={
 ash:{bg:0x2a1e18,fog:0x2e221b,dens:0.045,hemi:[0xa08070,0x2a1c14,1.0],moon:[0xffc8a0,1.2],exp:1.1,ground:'dirt',R:20},
 forest:{bg:0x0b1a17,fog:0x0e211c,dens:0.05,hemi:[0x7aaa9a,0x142018,1.0],moon:[0xb8e0d0,1.3],exp:1.1,ground:'moss',R:20},
 duel:{bg:0x060a14,fog:0x0a1020,dens:0.04,hemi:[0x6a7aa0,0x0a0c14,0.85],moon:[0x9ab0e0,1.5],exp:1.15,ground:'stone',R:16},
 kak:{bg:0x6c5a66,fog:0x7a6470,dens:0.011,hemi:[0xe0c8b4,0x40302a,1.2],moon:[0xffc890,2.1],exp:1.1,ground:'dirt',R:200},
 house:{bg:0x05070d,fog:0x0b0d13,dens:0.022,hemi:[0x8c7c6c,0x1c1612,0.55],moon:[0x9ab0e0,0.7],exp:1.2,ground:'stone',R:60},
 green:{bg:0x9fbfd8,fog:0xa9c2c4,dens:0.0032,hemi:[0xe4f0ff,0x4a5a30,1.35],moon:[0xfff0d8,2.6],exp:1.05,ground:'moss',R:200},
 ps1:{bg:0x05060b,fog:0x090b12,dens:0.03,hemi:[0x8a94c0,0x1c1610,0.62],moon:[0xb8c4ff,0.55],exp:1.1,ground:'stone',R:999},
 w0:{bg:0x8c919a,fog:0x8e9298,dens:0.012,hemi:[0xdfe6f0,0x5a4a3a,1.1],moon:[0xffe0c0,1.6],exp:1.0,ground:'dirt',R:999},
 temple:{bg:0x070914,fog:0x0c1022,dens:0.016,hemi:[0x6a78b8,0x1a1410,0.42],moon:[0x9fb4ff,0.85],exp:1.0,ground:'stone',R:30}
};
let ENV=null;const flames=[],rain={obj:null};
function addFire(g,x,y,z,sc=1,li=0){for(let i=0;i<3;i++){const f=flameSprite();f.position.set(x+rnd(-.15,.15)*sc,y+0.3*sc,z+rnd(-.15,.15)*sc);f.scale.set(0.6*sc,1.1*sc,1);g.add(f);flames.push({s:f,b:sc,ph:rnd(0,9),x,y,z})}
 if(li<STATIC.length){const l=STATIC[li];l.position.set(x,y+0.8*sc,z);l.color.set(0xff8030);l.userData.base=5*sc;l.distance=16*sc;l.intensity=5*sc}}
function stoneLantern(g,x,z,lit=true){if(ASSET.ok&&ASSET.parts.PR){const L=new Group();L.position.set(x,0,z);L.rotation.y=Math.random()*0.5;g.add(L);addPart(L,'PR','lantern');return addPart(L,'PR','lanternwin',{mat:()=>lit?M.lampOn:M.lampOff}).all[0]}const m=M.stoneL;mesh(new THREE.BoxGeometry(0.5,0.12,0.5),m,x,0.06,z,g);mesh(new THREE.CylinderGeometry(0.1,0.12,0.7,8),m,x,0.45,z,g);mesh(new THREE.BoxGeometry(0.4,0.3,0.4),m,x,0.95,z,g);
 const w=mesh(new THREE.BoxGeometry(0.22,0.18,0.42),lit?M.lampOn:M.lampOff,x,0.95,z,g);const r=mesh(new THREE.ConeGeometry(0.42,0.28,4),m,x,1.25,z,g);r.rotation.y=Math.PI/4;mesh(new THREE.SphereGeometry(0.06,6,4),m,x,1.42,z,g);return w}
function makeMirror(g,x,z,yaw){const m=new Group();m.position.set(x,0,z);m.rotation.y=yaw;g.add(m);
 mesh(new THREE.BoxGeometry(0.1,1.2,0.1),M.wood,-0.55,0.6,0,m);mesh(new THREE.BoxGeometry(0.1,1.2,0.1),M.wood,0.55,0.6,0,m);
 const d=mesh(new THREE.CylinderGeometry(0.6,0.6,0.06,32),M.bronze,0,1.35,0,m);d.rotation.x=Math.PI/2;
 const face=mesh(new THREE.CircleGeometry(0.52,32),M.mirrorOff,0,1.35,0.035,m);
 const lant=stoneLantern(g,x+Math.cos(yaw)*1.6,z-Math.sin(yaw)*1.6,false);
 return{x,z,act:false,face,lant}}
function makeGate(g,x,z){const t=new Group();t.position.set(x,0,z);g.add(t);const r=M.torii;
 if(LVok('portal')){portalRing(t,0,0);const glow=mesh(new THREE.CircleGeometry(1.5,40),new MB({color:0xffc080,transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),0,1.75,0,t);t.visible=false;return{t,glow,x,z}}
 if(ASSET.ok&&ASSET.parts.PR){addPart(t,'PR','torii');addPart(t,'PR','toriib')}else{for(const s of[-1,1])mesh(new THREE.CylinderGeometry(0.16,0.2,4,10),r,s*1.6,2,0,t);
 mesh(new THREE.BoxGeometry(4.6,0.28,0.4),r,0,4.05,0,t);mesh(new THREE.BoxGeometry(3.8,0.18,0.3),r,0,3.4,0,t);}
 const glow=mesh(new THREE.PlaneGeometry(3,3.3),new MB({color:0xffc080,transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),0,1.7,0,t);
 t.visible=false;return{t,glow,x,z}}
function inst(geo,mat,n,fn,g){const im=new THREE.InstancedMesh(geo,mat,n);const o=new THREE.Object3D();for(let i=0;i<n;i++){fn(o,i);o.updateMatrix();im.setMatrixAt(i,o.matrix)}im.castShadow=true;im.receiveShadow=true;g.add(im);return im}
function ringPos(rmin,rmax){const a=rnd(0,Math.PI*2),r=Math.sqrt(rnd(rmin*rmin,rmax*rmax));return[Math.cos(a)*r,Math.sin(a)*r]}
// ---------- Blender-окружение (EV__*), с откатом на процедурные формы
const EVok=p=>ASSET.ok&&!!(ASSET.parts.EV&&ASSET.parts.EV[p]);
function evAdd(g,part,x,y,z,ry=0,sc=1){const o=new Group();o.position.set(x,y,z);o.rotation.y=ry;if(sc.length)o.scale.set(...sc);else o.scale.setScalar(sc);g.add(o);addPart(o,'EV',part);return o}
function evInst(g,part,n,fn,shadow=true){const L=ASSET.parts.EV[part];{const k={grass:0.5,bamboo:0.0011,bambooleaf:0.0011}[part];if(k)for(const it of L)addSway(it.mat,k)}const d=new THREE.Object3D();const ms=L.map(it=>{const m=new THREE.InstancedMesh(it.geo,it.mat,n);m.castShadow=shadow;m.receiveShadow=true;g.add(m);return m});
 for(let i=0;i<n;i++){fn(d,i);d.updateMatrix();for(const m of ms)m.setMatrixAt(i,d.matrix)}return ms}
function groundMat(name,rep){const m=ASSET.ok&&ASSET.mats[name];if(!m)return null;const c=m.clone();for(const k of['map','normalMap','roughnessMap','metalnessMap']){if(c[k]){c[k]=c[k].clone();c[k].wrapS=c[k].wrapT=THREE.RepeatWrapping;c[k].repeat.set(rep,rep);c[k].anisotropy=8;c[k].needsUpdate=true}}return c}
// ---------- GPU rain: instanced streaks + ground ripples (all animated in shaders)
function makeRain(g){
 const N=9000,R=15,H=13;const q=new THREE.BufferGeometry();const pos=new Float32Array(N*12),uv=new Float32Array(N*8),dr=new Float32Array(N*16),idx=new Uint32Array(N*6);
 for(let i=0;i<N;i++){const o=[Math.random()*2*R,Math.random()*H,Math.random()*2*R,Math.random()];const c=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
  for(let k=0;k<4;k++){pos.set([c[k][0],c[k][1],0],(i*4+k)*3);uv.set([c[k][0]+.5,c[k][1]+.5],(i*4+k)*2);dr.set(o,(i*4+k)*4)}idx.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6)}
 q.setAttribute('position',new THREE.BufferAttribute(pos,3));q.setAttribute('uv',new THREE.BufferAttribute(uv,2));q.setAttribute('drop',new THREE.BufferAttribute(dr,4));q.setIndex(new THREE.BufferAttribute(idx,1));
 const U={uT:{value:0},uC:{value:new THREE.Vector3()},uCam:{value:new THREE.Vector3()},uLit:{value:0},uStr:{value:1}};
 const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
  vertexShader:`attribute vec4 drop;uniform float uT,uStr;uniform vec3 uC,uCam;varying vec2 vUv;varying float vA;
  void main(){float sp=9.0+drop.w*4.0;vec3 p=vec3(mod(drop.x-uC.x+uT*0.6,${(2*R).toFixed(1)})-${R.toFixed(1)}+uC.x,mod(drop.y-uT*sp,${H.toFixed(1)}),mod(drop.z-uC.z,${(2*R).toFixed(1)})-${R.toFixed(1)}+uC.z);
   vec3 dir=normalize(vec3(0.06,-1.0,0.0));vec3 v=normalize(p-uCam);vec3 side=normalize(cross(dir,v));float len=(0.35+drop.w*0.35)*uStr;
   p+=side*position.x*0.022+dir*position.y*len;vUv=uv;vec4 mv=modelViewMatrix*vec4(p,1.0);float d=-mv.z;vA=smoothstep(0.6,2.0,d)*(1.0-smoothstep(10.0,${R}.0,length(p.xz-uC.xz)));gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uLit;varying vec2 vUv;varying float vA;void main(){float a=(1.0-abs(vUv.x*2.0-1.0))*smoothstep(0.0,0.5,vUv.y)*vA*(0.32+uLit*0.5);gl_FragColor=vec4(mix(vec3(0.62,0.7,0.85),vec3(1.0),uLit),a);}`});
 const m=new Mesh(q,mat);m.frustumCulled=false;m.renderOrder=5;g.add(m);
 // ripples
 const RN=700,rq=new THREE.InstancedBufferGeometry();rq.copy(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));rq.instanceCount=RN;
 const ro=new Float32Array(RN*2);for(let i=0;i<RN;i++){ro[i*2]=Math.random();ro[i*2+1]=Math.random()*37.0}rq.setAttribute('seed',new THREE.InstancedBufferAttribute(ro,2));
 const rmat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
  vertexShader:`attribute vec2 seed;uniform float uT;uniform vec3 uC;varying vec2 vUv;varying float vPh;
  float h(float n){return fract(sin(n)*43758.5453);}
  void main(){float rate=1.6+seed.x;float k=uT*rate+seed.x*7.0;float cyc=floor(k);vPh=fract(k);
   vec3 p=vec3(uC.x+(h(cyc*1.7+seed.y)-0.5)*24.0,0.03,uC.z+(h(cyc*3.1+seed.y*1.3)-0.5)*24.0);float s=0.08+vPh*0.3;
   p+=vec3(position.x*s,0.0,position.z*s);vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader:`uniform float uLit;varying vec2 vUv;varying float vPh;void main(){float r=length(vUv-0.5)*2.0;float ring=smoothstep(0.75,0.9,r)*(1.0-smoothstep(0.9,1.0,r))+0.5*smoothstep(0.4,0.5,r)*(1.0-smoothstep(0.5,0.58,r))*(1.0-vPh);
   gl_FragColor=vec4(vec3(0.7,0.78,0.9)+uLit*0.3,ring*(1.0-vPh)*0.16);}`});
 const rm=new Mesh(rq,rmat);rm.frustumCulled=false;rm.renderOrder=4;g.add(rm);
 rain.obj=m;rain.rip=rm;rain.U=U;rain.T=0;rain.last=null;rain.flash=0;rain.next=8+Math.random()*10;}
function puddleTex(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#d8d8d8';x.fillRect(0,0,512,512);
 for(let i=0;i<70;i++){const px=Math.random()*512,py=Math.random()*512,r=20+Math.random()*70;const gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(70,70,70,0.9)');gr.addColorStop(0.6,'rgba(90,90,90,0.55)');gr.addColorStop(1,'rgba(216,216,216,0)');x.fillStyle=gr;
  for(const dx of[-512,0,512])for(const dy of[-512,0,512]){x.save();x.translate(dx,dy);x.beginPath();x.ellipse(px,py,r,r*(0.5+Math.random()*0.5),Math.random()*3,0,7);x.fill();x.restore()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,18);return t}
// лучи света (god rays): мягкие аддитивные полосы, повёрнутые к камере вокруг своей оси
const rayTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');for(let i=0;i<64;i++){const e=Math.pow(Math.sin(Math.PI*i/63),2.2);const gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,`rgba(255,255,255,${0.9*e})`);gr.addColorStop(0.7,`rgba(255,255,255,${0.35*e})`);gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(i,0,1,256)}return new THREE.CanvasTexture(c)})();
function godRays(g,theme){if(theme==='duel'||theme==='house'||theme==='ps1'||theme==='w0')return[];const col=theme==='ash'?0xffa070:0xc8f0d8,n=theme==='forest'?9:5,out=[];
 for(let i=0;i<n;i++){const m=new Mesh(new THREE.PlaneGeometry(1,1),new MB({map:rayTex,color:col,transparent:true,opacity:theme==='forest'?0.075:0.05,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  const a=rnd(0,Math.PI*2),r=rnd(4,16),w=rnd(1.2,3.2),h=rnd(9,15);m.scale.set(w,h,1);m.position.set(Math.cos(a)*r,h*0.45,Math.sin(a)*r);m.userData={tilt:theme==='forest'?0.28:0.4,ph:rnd(0,6),op:m.material.opacity};m.renderOrder=3;g.add(m);out.push(m)}return out}
function buildEnv(theme){
 if(ASSET.ok&&ASSET.mats.ev_kawara&&!ASSET.mats.ev_kawara.userData.fx){const k=ASSET.mats.ev_kawara;k.userData.fx=1;k.metalness=0;k.envMapIntensity=0.25;k.roughness=0.8;k.color.multiplyScalar(0.55)}
 if(ENV){scene.remove(ENV);ENV.traverse(o=>{if(o.geometry)o.geometry.dispose()})}flames.length=0;for(const l of STATIC){l.intensity=0;l.userData.base=0}
 const T=THEMES[theme],g=new Group();ENV=g;scene.add(g);
 const LN=LOCN[theme],LOC=!!LN&&LVok(LN);
 scene.background=new THREE.Color(T.bg);scene.fog=new THREE.FogExp2(T.fog,LOC&&theme==='duel'?0.02:LOC&&theme==='ash'?0.035:T.dens);hemi.color.set(T.hemi[0]);hemi.groundColor.set(T.hemi[1]);hemi.intensity=T.hemi[2];moon.color.set(T.moon[0]);moon.intensity=T.moon[1];
 const gm=groundMat({ash:'ground_ash',forest:'ground_moss',duel:'ground_paving'}[theme],theme==='duel'?44:40)||new MS({map:TX[T.ground],roughness:theme==='duel'?0.75:0.95,metalness:theme==='duel'?0.05:0});if(theme==='duel'){gm.roughnessMap=puddleTex();gm.roughness=0.8;gm.envMapIntensity=0.55;gm.color.multiplyScalar(0.85)}const gr=new Mesh(new THREE.PlaneGeometry(160,160),gm);gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;g.add(gr);if(theme==='house')gr.position.y=-0.06;
 if(LOC){if(theme==='ash')gr.position.y=-7;else gr.visible=false}
 const moonS=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:theme==='ash'?0xff9060:0xd8e4ff,fog:false,toneMapped:false}));moonS.material.opacity=0.55;moonS.material.transparent=true;moonS.position.set(-50,55,70);moonS.scale.set(6,6,1);g.add(moonS);
 const env={mirrors:[],gate:null};setGrade(theme);
 env.rays=godRays(g,theme);
 if(theme==='ash'&&LOC){locAdd(g,'village');const L=LAYOUT.ash;L.fires.forEach(([x,y,z],i)=>addFire(g,x,y,z,1.5,i));for(const e of L.embers)embersSpots.push(e);
 }else if(theme==='ash'){
  const houses=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2+rnd(-.1,.1),r=rnd(24,30);houses.push([Math.cos(a)*r,Math.sin(a)*r,a])}
  if(EVok('minka')){houses.forEach(([x,z,a],i)=>{const burnt=i%2===0,s=rnd(0.9,1.12);evAdd(g,burnt?'minkab':'minka',x,0,z,-a-Math.PI/2+rnd(-.15,.15),s);if(burnt)addFire(g,x*0.97,3.4*s,z*0.97,2.2,i/2|0);
    if(i%3===1)evAdd(g,'barrel',x*0.86+rnd(-1,1),0,z*0.86+rnd(-1,1),rnd(0,6));if(i%5===2)evAdd(g,'cart',x*0.8,0,z*0.8,-a+rnd(-.5,.5))});
   evAdd(g,'well',9,0,7,0.4);
  }else
  houses.forEach(([x,z,a],i)=>{const h=new Group();h.position.set(x,0,z);h.rotation.y=-a+Math.PI/2;g.add(h);const w=rnd(5,7),d=rnd(4,5),hh=rnd(2.4,3.2);
   mesh(new THREE.BoxGeometry(w,hh,d),M.charWood,0,hh/2,0,h).receiveShadow=true;const roof=mesh(new THREE.CylinderGeometry(0.01,d*0.85,2.2,4,1),M.thatch,0,hh+1.05,0,h);roof.scale.set(w/d*1.1,1,1);roof.rotation.y=Math.PI/4;roof.scale.set(1.25*w/d,1,1);
   mesh(new THREE.BoxGeometry(1,1.6,0.05),M.lampOn,rnd(-w/3,w/3),1,d/2+0.01,h);
   if(i%2===0)addFire(g,x*0.97,hh+1.2,z*0.97,2.2,i/2|0)});
  if(EVok('fence')){for(let i=0;i<12;i++){const [x,z]=ringPos(8,19);evAdd(g,i%3?'fenceb':'fence',x,0,z,rnd(0,6))}}else for(let i=0;i<10;i++){const [x,z]=ringPos(8,19);const f=new Group();f.position.set(x,0,z);f.rotation.y=rnd(0,6);g.add(f);for(let k=0;k<6;k++)mesh(new THREE.BoxGeometry(0.08,rnd(0.7,1.1),0.08),M.charWood,k*0.35,0.45,0,f);mesh(new THREE.BoxGeometry(2,0.07,0.07),M.charWood,0.9,0.75,0,f)}
  if(EVok('scarecrow')){for(let i=0;i<6;i++){const [x,z]=ringPos(5,17);evAdd(g,'scarecrow',x,0,z,rnd(0,6)).rotation.z=rnd(-.12,.12)}}else for(let i=0;i<6;i++){const [x,z]=ringPos(5,17);const d=new Group();d.position.set(x,0,z);g.add(d);mesh(new THREE.CylinderGeometry(0.04,0.04,1.8,5),M.wood,0,0.9,0,d);const b=mesh(new THREE.CylinderGeometry(0.22,0.25,0.8,8),M.thatch,0,1.3,0,d);mesh(new THREE.BoxGeometry(1,0.08,0.08),M.wood,0,1.45,0,d);mesh(new THREE.SphereGeometry(0.17,8,6),M.thatch,0,1.85,0,d)}
  for(let i=0;i<8;i++){const [x,z]=ringPos(6,18);embersSpots.push([x,z]);if(EVok('debris')){evAdd(g,'debris',x,0,z,rnd(0,6),rnd(0.6,1.0));continue}const deb=mesh(new THREE.BoxGeometry(rnd(0.6,1.4),0.25,rnd(0.4,1)),M.charWood,x,0.12,z,g);deb.rotation.y=rnd(0,3)}
 }else if(theme==='forest'){
  if(LOC){locAdd(g,'sagano');const L=LAYOUT.forest;if(EVok('shrine')){evAdd(g,'shrine',L.shrine[0],0,L.shrine[1],Math.PI/2);stoneLantern(g,L.shrine[0]+0.6,L.shrine[1]+1.9,true)}}else{
  const bg=new THREE.CylinderGeometry(0.07,0.09,14,7);bg.translate(0,7,0);
  if(EVok('bamboo')){const pl=(o,i)=>{let x,z;do{[x,z]=ringPos(i<150?9:14,40)}while(Math.hypot(x,z+14)<3);o.position.set(x,0,z);o.rotation.set(rnd(-.05,.05),rnd(0,6),rnd(-.05,.05));const k=rnd(.8,1.2);o.scale.set(k,rnd(.8,1.15),k)};
   const seed=[];const pl2=(o,i)=>{if(!seed[i]){seed[i]=1}pl(o,i)};const R0=Math.random;let st=7;const rr=()=>{st=(st*16807)%2147483647;return st/2147483647};
   Math.random=rr;evInst(g,'bamboo',520,pl);st=7;evInst(g,'bambooleaf',520,pl,true);Math.random=R0;
   inst(bg,M.bamboo,380,(o)=>{const[x,z]=ringPos(40,62);o.position.set(x,0,z);o.rotation.set(rnd(-.06,.06),rnd(0,6),rnd(-.06,.06));o.scale.set(rnd(.7,1.3),rnd(.8,1.2),rnd(.7,1.3))},g)}
  else  inst(bg,M.bamboo,900,(o,i)=>{let x,z;do{[x,z]=ringPos(i<200?9:17,60)}while(Math.hypot(x,z+14)<3);o.position.set(x,0,z);o.rotation.set(rnd(-.06,.06),rnd(0,6),rnd(-.06,.06));o.scale.set(rnd(.7,1.3),rnd(.8,1.2),rnd(.7,1.3))},g);
  const nodeG=new THREE.CylinderGeometry(0.1,0.1,0.06,7);
  const lg=new THREE.ConeGeometry(0.025,0.4,3);lg.translate(0,0.2,0);if(EVok('grass'))evInst(g,'grass',2200,(o)=>{const[x,z]=ringPos(1,28);o.position.set(x,0,z);o.rotation.set(0,rnd(0,6),0);o.scale.setScalar(rnd(.7,1.5))},false);else inst(lg,M.grass,4000,(o)=>{const[x,z]=ringPos(1,26);o.position.set(x,0,z);o.rotation.set(rnd(-.4,.4),rnd(0,6),rnd(-.4,.4));o.scale.set(1,rnd(.5,1.3),1)},g);
  if(EVok('rock1')){for(let i=0;i<18;i++){const[x,z]=ringPos(6,24);evAdd(g,'rock'+(1+i%3),x,0,z,rnd(0,6),rnd(0.6,1.4))}evAdd(g,'shrine',-8.5,0,-3.5,Math.PI/2-0.3);stoneLantern(g,-8.2,-1.8,true)}else for(let i=0;i<14;i++){const[x,z]=ringPos(7,21);const r=mesh(new THREE.DodecahedronGeometry(rnd(0.4,1.1),0),M.rock,x,0.2,z,g);r.scale.y=0.6;r.rotation.set(rnd(0,3),rnd(0,3),0);r.receiveShadow=true}
  }
  const lamps=LOC?LAYOUT.forest.lamps:[[-4,-10],[4,6],[-6,12],[7,-4]];lamps.forEach(([x,z],i)=>{stoneLantern(g,x,z,true);const l=STATIC[i];l.position.set(x,1.0,z);l.color.set(0xffa050);l.userData.base=3;l.distance=10;l.intensity=3});
  const fogM=new MB({map:TX.dot,color:0x9ac0b0,transparent:true,opacity:0.07,depthWrite:false,fog:false});for(let i=0;i<24;i++){const s=new THREE.Sprite(fogM);const[x,z]=ringPos(6,26);s.position.set(x,rnd(0.5,2),z);s.scale.set(rnd(8,16),rnd(3,5),1);g.add(s)}
 }else if(theme==='house'){buildHouseEnv(g,env);
 }else if(theme==='kak'){gr.visible=false;buildKakEnv(g,env);
 }else if(theme==='green'){gr.visible=false;buildGreenEnv(g,env);
 }else if(theme==='temple'){gr.visible=false;buildTempleEnv(g,env);
 }else if(theme==='ps1'){gr.visible=false;buildPs1Env(g,env);
 }else if(theme==='w0'){gr.visible=false;buildW0Env(g,env);
 }else{
  const pil=new THREE.CylinderGeometry(0.28,0.3,7,12);pil.translate(0,3.5,0);for(let i=0;i<14;i++){const a=i/14*Math.PI*2;if(EVok('pillar'))evAdd(g,'pillar',Math.cos(a)*17,0,Math.sin(a)*17,-a);else mesh(pil,M.pillar,Math.cos(a)*17,0,Math.sin(a)*17,g)}
  const ring=mesh(new THREE.TorusGeometry(17,0.3,8,96),EVok('pillar')&&ASSET.mats.ev_vermilion||M.pillar,0,EVok('pillar')?7.5:7,0,g);if(EVok('pillar')){const r2=mesh(new THREE.TorusGeometry(17,0.16,6,96),ASSET.mats.ev_vermilion,0,5.4,0,g);r2.rotation.x=Math.PI/2}ring.rotation.x=Math.PI/2;
  if(LOC){locAdd(g,'scifi',false);if(LVok('manor'))manorExt(g,env);else if(HOok('ext'))houseExt(g,env);for(const sx of[-1,1])stoneLantern(g,sx*3.2,-23.5,true)}
  else if(EVok('wall')){const n=27;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=Math.cos(a)*26,z=Math.sin(a)*26;if(z<-15&&Math.abs(x)<13)continue;evAdd(g,'wall',x,0,z,-a+Math.PI/2,[1.03,1,1])}
   if(HOok('ext'))houseExt(g,env);else evAdd(g,'hall',0,0,-31,0);for(const sx of[-1,1]){stoneLantern(g,sx*3.2,-23.5,true)}}
  else  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const w=mesh(new THREE.BoxGeometry(20,6,1),M.wall,Math.cos(a)*26,3,Math.sin(a)*26,g);w.rotation.y=-a+Math.PI/2;const rf=mesh(new THREE.BoxGeometry(22,0.4,3),M.roof,Math.cos(a)*26,6.2,Math.sin(a)*26,g);rf.rotation.y=-a+Math.PI/2}
  const bt=new Group();bt.position.set(0,0,9);g.add(bt);if(EVok('shoro'))addPart(bt,'EV','shoro');else for(const s of[-1,1])mesh(new THREE.BoxGeometry(0.35,5,0.35),M.pillar,s*1.8,2.5,0,bt);if(!EVok('shoro'))mesh(new THREE.BoxGeometry(4.4,0.35,0.5),M.pillar,0,5,0,bt);
  const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new THREE.Vector2(0.35+t*0.55+Math.pow(t,4)*0.25,-t*1.8))}let bell;if(ASSET.ok&&ASSET.parts.PR){bell=new Group();bell.position.set(0,4.8,0);bt.add(bell);addPart(bell,'PR','bell')}else bell=mesh(new THREE.LatheGeometry(pts,24),M.bellM,0,4.8,0,bt);env.bell=bell;
  for(const [x,z,i] of[[-6,4,0],[6,4,1],[-6,-8,2],[6,-8,3]]){const b=new Group();b.position.set(x,0,z);g.add(b);if(EVok('brazier')){addPart(b,'EV','brazier');addFire(g,x,1.32,z,1,i);continue}for(let k=0;k<3;k++){const l=mesh(new THREE.CylinderGeometry(0.03,0.03,1.3,4),M.iron,Math.cos(k*2.1)*0.18,0.6,Math.sin(k*2.1)*0.18,b);l.rotation.set(Math.sin(k*2.1)*0.25,0,-Math.cos(k*2.1)*0.25)}mesh(new THREE.CylinderGeometry(0.32,0.2,0.2,10),M.iron,0,1.25,0,b);addFire(g,x,1.1,z,1,i)}
  makeRain(g);const mistM=new MB({map:TX.dot,color:0x8a98b8,transparent:true,opacity:0.06,depthWrite:false,fog:false});for(let i=0;i<18;i++){const sp=new THREE.Sprite(mistM);const[x,z]=ringPos(4,22);sp.position.set(x,rnd(0.3,1.2),z);sp.scale.set(rnd(9,15),rnd(1.5,3),1);g.add(sp)}
 }
 if(theme!=='duel')rain.obj=null;
 env.theme=theme;env.R=T.R;if(theme==='house')env.mirrors=[];env.nav=theme==='kak'?kakNavV():LOC&&theme!=='duel'?navOf(LN):null;return env}
const embersSpots=[];
function extraMats(){Object.assign(M,{stoneL:new MS({color:0x4a4e4a,roughness:0.95}),lampOn:new MB({color:0xffb060,toneMapped:false}),lampOff:new MS({color:0x2a2a22}),bronze:new MS({color:0x8a6a30,roughness:0.35,metalness:1}),
 mirrorOff:new MS({color:0x6a5a3a,roughness:0.15,metalness:1}),mirrorOn:new MB({color:0xffe0a0,toneMapped:false}),torii:new MS({color:0x8a1810,roughness:0.6,emissive:0x300500}),charWood:new MS({color:0x17110d,roughness:0.95}),
 thatch:new MS({color:0x3a2e20,roughness:1}),bamboo:new MS({color:0x2c4a36,roughness:0.6}),grass:new MS({color:0x1c3424,roughness:1,side:THREE.DoubleSide}),rock:new MS({color:0x3a403a,roughness:0.9}),
 pillar:new MS({color:0x2a1210,roughness:0.7}),wall:new MS({color:0x1a1a1e,roughness:0.9}),roof:new MS({color:0x101216,roughness:0.6}),bellM:new MS({color:0x4a4630,roughness:0.4,metalness:1}),iron:new MS({color:0x1a1816,roughness:0.6,metalness:0.8})})}
extraMats();
// ---------- enemy rigs
const glintCols={red:0xff2a2a,purple:0xc050ff,blue:0x60b0ff};
function genmaMat(){return M.genma.clone()}
function veinsOn(parent,n,h,rad){for(let i=0;i<n;i++){const pts=[];let a=rnd(0,6),y=rnd(0.1,h);for(let k=0;k<5;k++){pts.push(new V3(Math.cos(a)*rad,y,Math.sin(a)*rad));a+=rnd(-.4,.4);y+=rnd(-.12,.12)}
 const tg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,0.008,3,false);const m=new Mesh(tg,M.vein);parent.add(m)}}
function rigAsh(big){if(!big&&ASSET.skins.ronin)return rigAshX();if(ASSET.ok&&ASSET.parts.GE)return rigAshA(big);const gm=genmaMat(),s=big?1.3:1;const root=new Group(),hips=new Group();hips.position.y=0.88;root.add(hips);root.scale.setScalar(s);
 const legs=[];for(const sd of[-1,1]){const th=new Group();th.position.x=sd*0.11;hips.add(th);mesh(new THREE.CapsuleGeometry(0.07,0.7,4,8),gm,0,-0.43,0,th);legs.push(th)}
 const torso=new Group();hips.add(torso);torso.rotation.x=0.4;
 const b=mesh(new THREE.CapsuleGeometry(0.19,0.42,4,10),gm,0,0.35,0,torso);b.scale.set(1.15,1,0.85);
 mesh(new THREE.BoxGeometry(0.44,0.14,0.3),M.rot,0,0.3,0.03,torso);mesh(new THREE.BoxGeometry(0.4,0.1,0.3),M.rot,0,0.14,0.03,torso);
 veinsOn(torso,6,0.6,0.2);
 const head=new Group();head.position.set(0,0.74,0.08);torso.add(head);head.rotation.x=-0.3;
 mesh(new THREE.SphereGeometry(0.12,10,8),gm,0,0,0,head);
 const hat=mesh(new THREE.ConeGeometry(big?0.55:0.45,0.2,16),M.hat,0,0.12,0,head);
 if(big){for(let i=0;i<22;i++){const a=i/22*Math.PI*2;if(Math.sin(a)<-0.5)continue;const f=mesh(new THREE.ConeGeometry(0.018,rnd(0.22,0.42),5),M.bone,Math.sin(a)*0.45,-0.12,Math.cos(a)*0.45,head);f.rotation.x=Math.PI}}
 const arm=new Group();arm.position.set(-0.24,0.55,0.05);torso.add(arm);
 let weap,tip=new THREE.Object3D();
 if(!big){weap=new Group();arm.add(weap);weap.rotation.x=-0.4;mesh(new THREE.CylinderGeometry(0.02,0.02,2.2,6),M.wood,0,0,0.5,weap).rotation.x=Math.PI/2;mesh(new THREE.ConeGeometry(0.04,0.25,6),M.bone,0,0,1.7,weap).rotation.x=Math.PI/2;tip.position.set(0,0,1.8);weap.add(tip);
  mesh(new THREE.CapsuleGeometry(0.05,0.4,3,6),gm,0,-0.1,0.15,arm).rotation.x=1.2}
 else{mesh(new THREE.CapsuleGeometry(0.06,0.45,3,6),gm,0,-0.25,0,arm);weap=makeSword(1.2,M.sotaA,false);weap.position.y=-0.5;arm.add(weap);tip=weap.userData.tip;
  const arm2=new Group();arm2.position.set(0.24,0.55,0.05);torso.add(arm2);mesh(new THREE.CapsuleGeometry(0.06,0.45,3,6),gm,0,-0.25,0,arm2);root.userData.arm2=arm2}
 const gl=glintSprite();scene.add(gl);
 return{root,hips,torso,legs,arm,weap,tip,gl,mat:gm,upper:torso,kind:big?'gasa':'ash',head}}
function rigKama(){if(ASSET.km)return rigKamaX();if(ASSET.ok&&ASSET.parts.KA)return rigKamaA();const gm=genmaMat();const root=new Group(),body=new Group();body.position.y=0.38;root.add(body);
 const b=mesh(new THREE.SphereGeometry(0.3,12,8),gm,0,0,0,body);b.scale.set(0.7,0.6,1.3);
 const head=new Group();head.position.set(0,0.12,0.42);body.add(head);mesh(new THREE.SphereGeometry(0.14,10,8),gm,0,0,0,head);for(const s of[-1,1])mesh(new THREE.ConeGeometry(0.04,0.14,5),gm,s*0.08,0.14,0,head);
 for(const s of[-1,1])mesh(new THREE.BoxGeometry(0.03,0.015,0.01),M.eye,s*0.05,0.03,0.13,head);
 const tail=mesh(new THREE.CapsuleGeometry(0.04,0.5,3,6),gm,0,0.1,-0.5,body);tail.rotation.x=-1;
 const legs=[];for(const [x,z] of[[-0.15,0.25],[0.15,0.25],[-0.15,-0.25],[0.15,-0.25]]){const l=new Group();l.position.set(x,-0.05,z);body.add(l);mesh(new THREE.CapsuleGeometry(0.03,0.28,3,5),gm,0,-0.17,0,l);legs.push(l)}
 const arm=new Group();arm.position.set(0,-0.02,0.3);body.add(arm);for(const s of[-1,1]){const sk=mesh(new THREE.TorusGeometry(0.22,0.014,4,14,Math.PI*0.9),M.bone,s*0.16,0,0.1,arm);sk.rotation.set(0,Math.PI/2,0)}
 veinsOn(body,3,0.1,0.22);const tip=new THREE.Object3D();tip.position.set(0,0,0.4);arm.add(tip);const gl=glintSprite();scene.add(gl);
 return{root,hips:body,torso:body,legs,arm,weap:arm,tip,gl,mat:gm,upper:head,kind:'kama'}}
function rigYumi(){if(ASSET.skins.archer)return rigYumiX();if(ASSET.ok&&ASSET.parts.YU)return rigYumiA();const gm=genmaMat();const root=new Group(),body=new Group();body.position.y=0.5;root.add(body);
 const b=mesh(new THREE.SphereGeometry(0.34,12,10),gm,0,0,0,body);b.scale.set(1,1.2,0.9);veinsOn(body,5,0.4,0.3);
 const neck=[];for(let i=0;i<7;i++){neck.push(mesh(new THREE.SphereGeometry(0.06,6,5),gm,0,0.35+i*0.08,0.05,body))}
 const head=new Group();body.add(head);mesh(new THREE.SphereGeometry(0.12,10,8),M.pale,0,0,0,head);const hair=mesh(new THREE.ConeGeometry(0.15,0.7,8,1,true),M.hair,0,-0.25,-0.05,head);hair.rotation.x=Math.PI+0.2;
 const arm=new Group();arm.position.set(0,0.15,0.3);body.add(arm);const bow=mesh(new THREE.TorusGeometry(0.55,0.015,4,20,Math.PI*0.8),M.wood,0,0,0,arm);bow.rotation.set(0,Math.PI/2,Math.PI/2+0.3*0);bow.rotation.z=Math.PI*0.6;
 const tip=new THREE.Object3D();head.add(tip);const gl=glintSprite();scene.add(gl);
 return{root,hips:body,torso:body,legs:[],arm,weap:arm,tip,gl,mat:gm,upper:head,kind:'yumi',neck,head}}
function rigSota(){if(ASSET.skins.sota)return rigSotaX();if(ASSET.ok&&ASSET.parts.SO&&ASSET.mats.SO_skin)M.sotaSkin=ASSET.mats.SO_skin;const h=makeHuman({set:'SO',scale:1.1,pants:M.sotaK,pants2:M.sotaK,kimono:M.sotaK,vest:M.sotaV,skin:M.sotaSkin,cape:null,tsR:M.sotaA,tsL:M.sotaA,armor:M.sotaA,obi:M.sotaA,eyes:true,horns:true,len:{R:0.9,L:0.86}});
 const gl=glintSprite();scene.add(gl);return{...h,root:h.root,tip:h.arms.R.sw.userData.tip,gl,mat:null,upper:h.torso,kind:'sota',human:h}}
M.pale=new MS({color:0xcfc5b5,roughness:0.6});M.sotaSkin=new MS({color:0x9c7b66,roughness:0.6});

// ---------- риги на моделях из Blender
function tarMat(){const gm=genmaMat();const t=ASSET.mats.tar;if(t&&t.normalMap){gm.normalMap=t.normalMap;gm.normalScale=new THREE.Vector2(1.2,1.2)}return gm}
function adder(gm){const mm=m=>m&&m.name==='tar'?gm:m;return(g,pre,p)=>addPart(g,pre,p,{mat:mm})}
function rigAshA(big){const gm=tarMat(),add=adder(gm),s=big?1.3:1;const root=new Group(),hips=new Group();hips.position.y=0.88;root.add(hips);root.scale.setScalar(s);add(hips,'GE','hips');
 const legs=[];for(const [sd,k] of[[-1,'R'],[1,'L']]){const th=new Group();th.position.x=sd*0.11;hips.add(th);add(th,'GE','thigh'+k);legs.push(th)}
 const torso=new Group();hips.add(torso);torso.rotation.x=0.4;add(torso,'GE','torso');
 const head=new Group();head.position.set(0,0.74,0.08);torso.add(head);head.rotation.x=-0.3;add(head,big?'GA':'GE','head');
 const arm=new Group();arm.position.set(-0.24,0.55,0.05);torso.add(arm);let weap,tip;const arm2=new Group();arm2.position.set(0.24,0.55,0.05);torso.add(arm2);
 if(!big){add(arm,'GE','arm');weap=new Group();weap.position.set(0,-0.381,0);weap.rotation.x=-0.4;arm.add(weap);add(weap,'GE','weap');tip=new THREE.Object3D();tip.position.copy(ASSET.tips.GE__weap||new THREE.Vector3(0,0,1.7));weap.add(tip);add(arm2,'GE','arm2')}
 else{add(arm,'GA','arm');weap=makeSword(1.2,M.sotaA,false);weap.position.y=-0.5;arm.add(weap);tip=weap.userData.tip;add(arm2,'GA','arm2');root.userData.arm2=arm2}
 const gl=glintSprite();scene.add(gl);
 return{root,hips,torso,legs,arm,weap,tip,gl,mat:gm,upper:torso,kind:big?'gasa':'ash',head}}
function rigKamaA(){const gm=tarMat(),add=adder(gm);const root=new Group(),body=new Group();body.position.y=0.38;root.add(body);add(body,'KA','body');
 const head=new Group();head.position.set(0,0.12,0.42);body.add(head);add(head,'KA','head');
 const legs=[];for(const [x,z] of[[-0.15,0.25],[0.15,0.25],[-0.15,-0.25],[0.15,-0.25]]){const l=new Group();l.position.set(x,-0.05,z);body.add(l);add(l,'KA','leg');legs.push(l)}
 const arm=new Group();arm.position.set(0,-0.02,0.3);body.add(arm);add(arm,'KA','arm');
 const tip=new THREE.Object3D();tip.position.set(0,0,0.4);arm.add(tip);const gl=glintSprite();scene.add(gl);
 return{root,hips:body,torso:body,legs,arm,weap:arm,tip,gl,mat:gm,upper:head,kind:'kama'}}
function rigYumiA(){const gm=tarMat(),add=adder(gm);const root=new Group(),body=new Group();body.position.y=0.5;root.add(body);add(body,'YU','body');
 const neck=[];for(let i=0;i<7;i++){const g=new Group();g.position.set(0,0.35+i*0.08,0.05);body.add(g);add(g,'YU','neckseg');neck.push(g)}
 const head=new Group();body.add(head);add(head,'YU','head');
 const arm=new Group();arm.position.set(0,0.15,0.3);body.add(arm);add(arm,'YU','arm');
 const tip=new THREE.Object3D();head.add(tip);const gl=glintSprite();scene.add(gl);
 return{root,hips:body,torso:body,legs:[],arm,weap:arm,tip,gl,mat:gm,upper:head,kind:'yumi',neck,head}}

// ---------- v0.10: внешние модели (blender/ext -> niten_ext.glb): скины на риге игры + кролик-кама + тыква
// копии материалов на каждого врага (вспышки урона/заморозки не затрагивают остальных)
function skinMM(n,f){const mm={};for(const p of(ASSET.skins[n]||{parts:[]}).parts){const m=p.mat;if(m&&!mm[m.name]){const c=m.clone();c.userData.em=!!c.emissiveMap;if(f)f(c);mm[m.name]=c}}return mm}
function mmProxy(mm){const L=Object.values(mm).filter(m=>m.emissive&&!m.userData.em);return{list:L,emissive:{set:c=>{for(const m of L)m.emissive.set(c)}},color:{set:()=>{for(const m of L)m.color.multiplyScalar(0.5)}}}}
function rigHumanX(name,kind,o={}){const mm=skinMM(name);const h=makeHuman({set:'XS',xs:name,matMap:mm,scale:o.scale||1,len:o.len||{R:0.9,L:0.86},tsR:M.sotaA,tsL:M.sotaA});
 const gl=glintSprite();scene.add(gl);return{...h,root:h.root,tip:h.arms.R.sw.userData.tip,gl,mat:mmProxy(mm),mm,upper:h.torso,kind,human:h}}
// Куро-асигару: ронин с яри (копьё старой модели GE в правой руке)
function rigAshX(){const r=rigHumanX('ronin','ash',{scale:1.0});const A=r.human.arms;A.L.sw.visible=false;A.R.sw.visible=false;
 const weap=new Group();weap.position.set(0,0,-0.45);A.R.hand.add(weap);let tip;
 if(ASSET.parts.GE&&ASSET.parts.GE.weap){addPart(weap,'GE','weap',{mat:m=>m&&m.name==='tar'?M.wood:m});tip=new THREE.Object3D();tip.position.copy(ASSET.tips.GE__weap||new V3(0,0,1.7));weap.add(tip)}
 else{mesh(new THREE.CylinderGeometry(0.02,0.02,2.2,6),M.wood,0,0,0.5,weap).rotation.x=Math.PI/2;mesh(new THREE.ConeGeometry(0.04,0.25,6),M.bone,0,0,1.7,weap).rotation.x=Math.PI/2;tip=new THREE.Object3D();tip.position.set(0,0,1.8);weap.add(tip)}
 r.weap=weap;r.tip=tip;r.arm=A.R.sh;return r}
// лучник-скелет: лук в левой руке, стрелы вылетают из лука (r.head)
function rigYumiX(){const r=rigHumanX('archer','yumi',{scale:1.0});const A=r.human.arms;A.L.sw.visible=false;A.R.sw.visible=false;
 const bow=new Group();A.L.hand.add(bow);const pts=[];for(let i=0;i<=12;i++){const z=-0.6+i*0.1;pts.push(new V3(0,0.16*(z/0.6)*(z/0.6)-0.02,z))}
 mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,0.014,5,false),M.wood,0,0,0,bow);
 const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[0],new V3(0,0.14,0),pts[12]]),new THREE.LineBasicMaterial({color:0xd8d0c0}));bow.add(line);
 const head=new THREE.Object3D();head.position.set(0,0.05,0);bow.add(head);r.bow=bow;r.string=line;r.head=head;r.tip=head;r.neck=[];return r}
function rigSotaX(){const r=rigHumanX('sota','sota',{scale:1.1,len:{R:0.9,L:0.86}});const nk=r.human.neck;
 for(const s of[-1,1]){const h=mesh(new THREE.ConeGeometry(0.03,0.24,6),M.chitin,s*0.075,0.2,0.0,nk);h.rotation.set(-0.35,0,s*-0.55);h.visible=false;r.horns.push(h)}
 return r}
// Кама-итати: кролик-крыса со своим скелетом и клипами (AnimationMixer)
function rigKamaX(){const root=new Group(),body=new Group();root.add(body);const km=skClone(ASSET.km.src);body.add(km);
 let mat=null;km.traverse(o=>{if(o.isMesh){if(!mat){mat=o.material.clone()}o.material=mat;o.frustumCulled=false;o.castShadow=true}});
 const mixer=new THREE.AnimationMixer(km),act={};for(const c of ASSET.km.clips){const a=mixer.clipAction(c);act[c.name.slice(3)]=a}
 for(const k of['crouch','leap','hit'])if(act[k]){act[k].setLoop(THREE.LoopOnce,1);act[k].clampWhenFinished=true}
 if(act.idle)act.idle.play();
 const head=new Group();head.position.set(0,0.4,0.3);body.add(head);const arm=new Group();arm.position.set(0,0.25,0.35);body.add(arm);const tip=new THREE.Object3D();tip.position.set(0,0,0.25);arm.add(tip);
 const gl=glintSprite();scene.add(gl);return{root,hips:body,torso:body,legs:[],arm,weap:arm,tip,gl,mat,upper:head,kind:'kama',mixer,act,cur:'idle',lt:null}}
function kamaPlay(r,n,fade=0.18){if(r.cur===n||!r.act[n])return;const a=r.act[n],b=r.act[r.cur];a.reset();a.play();if(b)a.crossFadeFrom(b,fade,false);r.cur=n}
