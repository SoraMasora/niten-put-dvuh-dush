// ---------- environments
const THEMES={
 ash:{bg:0x2a1e18,fog:0x2e221b,dens:0.045,hemi:[0xa08070,0x2a1c14,1.0],moon:[0xffc8a0,1.2],exp:1.1,ground:'dirt',R:20},
 forest:{bg:0x0b1a17,fog:0x0e211c,dens:0.05,hemi:[0x7aaa9a,0x142018,1.0],moon:[0xb8e0d0,1.3],exp:1.1,ground:'moss',R:20},
 duel:{bg:0x060a14,fog:0x0a1020,dens:0.04,hemi:[0x6a7aa0,0x0a0c14,0.85],moon:[0x9ab0e0,1.5],exp:1.15,ground:'stone',R:16}
};
let ENV=null;const flames=[],rain={obj:null};
function addFire(g,x,y,z,sc=1,li=0){for(let i=0;i<3;i++){const f=flameSprite();f.position.set(x+rnd(-.15,.15)*sc,y+0.3*sc,z+rnd(-.15,.15)*sc);f.scale.set(0.6*sc,1.1*sc,1);g.add(f);flames.push({s:f,b:sc,ph:rnd(0,9),x,y,z})}
 if(li<STATIC.length){const l=STATIC[li];l.position.set(x,y+0.8*sc,z);l.color.set(0xff8030);l.userData.base=5*sc;l.distance=16*sc;l.intensity=5*sc}}
function stoneLantern(g,x,z,lit=true){const m=M.stoneL;mesh(new THREE.BoxGeometry(0.5,0.12,0.5),m,x,0.06,z,g);mesh(new THREE.CylinderGeometry(0.1,0.12,0.7,8),m,x,0.45,z,g);mesh(new THREE.BoxGeometry(0.4,0.3,0.4),m,x,0.95,z,g);
 const w=mesh(new THREE.BoxGeometry(0.22,0.18,0.42),lit?M.lampOn:M.lampOff,x,0.95,z,g);const r=mesh(new THREE.ConeGeometry(0.42,0.28,4),m,x,1.25,z,g);r.rotation.y=Math.PI/4;mesh(new THREE.SphereGeometry(0.06,6,4),m,x,1.42,z,g);return w}
function makeMirror(g,x,z,yaw){const m=new Group();m.position.set(x,0,z);m.rotation.y=yaw;g.add(m);
 mesh(new THREE.BoxGeometry(0.1,1.2,0.1),M.wood,-0.55,0.6,0,m);mesh(new THREE.BoxGeometry(0.1,1.2,0.1),M.wood,0.55,0.6,0,m);
 const d=mesh(new THREE.CylinderGeometry(0.6,0.6,0.06,32),M.bronze,0,1.35,0,m);d.rotation.x=Math.PI/2;
 const face=mesh(new THREE.CircleGeometry(0.52,32),M.mirrorOff,0,1.35,0.035,m);
 const lant=stoneLantern(g,x+Math.cos(yaw)*1.6,z-Math.sin(yaw)*1.6,false);
 return{x,z,act:false,face,lant}}
function makeGate(g,x,z){const t=new Group();t.position.set(x,0,z);g.add(t);const r=M.torii;
 for(const s of[-1,1])mesh(new THREE.CylinderGeometry(0.16,0.2,4,10),r,s*1.6,2,0,t);
 mesh(new THREE.BoxGeometry(4.6,0.28,0.4),r,0,4.05,0,t);mesh(new THREE.BoxGeometry(3.8,0.18,0.3),r,0,3.4,0,t);
 const glow=mesh(new THREE.PlaneGeometry(3,3.3),new MB({color:0xffc080,transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),0,1.7,0,t);
 t.visible=false;return{t,glow,x,z}}
function inst(geo,mat,n,fn,g){const im=new THREE.InstancedMesh(geo,mat,n);const o=new THREE.Object3D();for(let i=0;i<n;i++){fn(o,i);o.updateMatrix();im.setMatrixAt(i,o.matrix)}im.castShadow=true;im.receiveShadow=true;g.add(im);return im}
function ringPos(rmin,rmax){const a=rnd(0,Math.PI*2),r=Math.sqrt(rnd(rmin*rmin,rmax*rmax));return[Math.cos(a)*r,Math.sin(a)*r]}
function buildEnv(theme){
 if(ENV){scene.remove(ENV);ENV.traverse(o=>{if(o.geometry)o.geometry.dispose()})}flames.length=0;for(const l of STATIC){l.intensity=0;l.userData.base=0}
 const T=THEMES[theme],g=new Group();ENV=g;scene.add(g);
 scene.background=new THREE.Color(T.bg);scene.fog=new THREE.FogExp2(T.fog,T.dens);hemi.color.set(T.hemi[0]);hemi.groundColor.set(T.hemi[1]);hemi.intensity=T.hemi[2];moon.color.set(T.moon[0]);moon.intensity=T.moon[1];
 const gm=new MS({map:TX[T.ground],roughness:theme==='duel'?0.28:0.95,metalness:theme==='duel'?0.15:0});const gr=new Mesh(new THREE.PlaneGeometry(160,160),gm);gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;g.add(gr);
 const moonS=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:theme==='ash'?0xff9060:0xd8e4ff,fog:false,toneMapped:false}));moonS.material.opacity=0.55;moonS.material.transparent=true;moonS.position.set(-50,55,70);moonS.scale.set(6,6,1);g.add(moonS);
 const env={mirrors:[],gate:null};
 if(theme==='ash'){
  const houses=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2+rnd(-.1,.1),r=rnd(24,30);houses.push([Math.cos(a)*r,Math.sin(a)*r,a])}
  houses.forEach(([x,z,a],i)=>{const h=new Group();h.position.set(x,0,z);h.rotation.y=-a+Math.PI/2;g.add(h);const w=rnd(5,7),d=rnd(4,5),hh=rnd(2.4,3.2);
   mesh(new THREE.BoxGeometry(w,hh,d),M.charWood,0,hh/2,0,h).receiveShadow=true;const roof=mesh(new THREE.CylinderGeometry(0.01,d*0.85,2.2,4,1),M.thatch,0,hh+1.05,0,h);roof.scale.set(w/d*1.1,1,1);roof.rotation.y=Math.PI/4;roof.scale.set(1.25*w/d,1,1);
   mesh(new THREE.BoxGeometry(1,1.6,0.05),M.lampOn,rnd(-w/3,w/3),1,d/2+0.01,h);
   if(i%2===0)addFire(g,x*0.97,hh+1.2,z*0.97,2.2,i/2|0)});
  for(let i=0;i<10;i++){const [x,z]=ringPos(8,19);const f=new Group();f.position.set(x,0,z);f.rotation.y=rnd(0,6);g.add(f);for(let k=0;k<6;k++)mesh(new THREE.BoxGeometry(0.08,rnd(0.7,1.1),0.08),M.charWood,k*0.35,0.45,0,f);mesh(new THREE.BoxGeometry(2,0.07,0.07),M.charWood,0.9,0.75,0,f)}
  for(let i=0;i<6;i++){const [x,z]=ringPos(5,17);const d=new Group();d.position.set(x,0,z);g.add(d);mesh(new THREE.CylinderGeometry(0.04,0.04,1.8,5),M.wood,0,0.9,0,d);const b=mesh(new THREE.CylinderGeometry(0.22,0.25,0.8,8),M.thatch,0,1.3,0,d);mesh(new THREE.BoxGeometry(1,0.08,0.08),M.wood,0,1.45,0,d);mesh(new THREE.SphereGeometry(0.17,8,6),M.thatch,0,1.85,0,d)}
  for(let i=0;i<8;i++){const [x,z]=ringPos(6,18);embersSpots.push([x,z]);const deb=mesh(new THREE.BoxGeometry(rnd(0.6,1.4),0.25,rnd(0.4,1)),M.charWood,x,0.12,z,g);deb.rotation.y=rnd(0,3)}
 }else if(theme==='forest'){
  const bg=new THREE.CylinderGeometry(0.07,0.09,14,7);bg.translate(0,7,0);
  inst(bg,M.bamboo,900,(o,i)=>{let x,z;do{[x,z]=ringPos(i<200?9:17,60)}while(Math.hypot(x,z+14)<3);o.position.set(x,0,z);o.rotation.set(rnd(-.06,.06),rnd(0,6),rnd(-.06,.06));o.scale.set(rnd(.7,1.3),rnd(.8,1.2),rnd(.7,1.3))},g);
  const nodeG=new THREE.CylinderGeometry(0.1,0.1,0.06,7);
  const lg=new THREE.ConeGeometry(0.025,0.4,3);lg.translate(0,0.2,0);inst(lg,M.grass,4000,(o)=>{const[x,z]=ringPos(1,26);o.position.set(x,0,z);o.rotation.set(rnd(-.4,.4),rnd(0,6),rnd(-.4,.4));o.scale.set(1,rnd(.5,1.3),1)},g);
  for(let i=0;i<14;i++){const[x,z]=ringPos(7,21);const r=mesh(new THREE.DodecahedronGeometry(rnd(0.4,1.1),0),M.rock,x,0.2,z,g);r.scale.y=0.6;r.rotation.set(rnd(0,3),rnd(0,3),0);r.receiveShadow=true}
  const lamps=[[-4,-10],[4,6],[-6,12],[7,-4]];lamps.forEach(([x,z],i)=>{stoneLantern(g,x,z,true);const l=STATIC[i];l.position.set(x,1.0,z);l.color.set(0xffa050);l.userData.base=3;l.distance=10;l.intensity=3});
  const fogM=new MB({map:TX.dot,color:0x9ac0b0,transparent:true,opacity:0.07,depthWrite:false,fog:false});for(let i=0;i<24;i++){const s=new THREE.Sprite(fogM);const[x,z]=ringPos(6,26);s.position.set(x,rnd(0.5,2),z);s.scale.set(rnd(8,16),rnd(3,5),1);g.add(s)}
 }else{
  const pil=new THREE.CylinderGeometry(0.28,0.3,7,12);pil.translate(0,3.5,0);for(let i=0;i<14;i++){const a=i/14*Math.PI*2;mesh(pil,M.pillar,Math.cos(a)*17,0,Math.sin(a)*17,g)}
  const ring=mesh(new THREE.TorusGeometry(17,0.35,6,48),M.pillar,0,7,0,g);ring.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const w=mesh(new THREE.BoxGeometry(20,6,1),M.wall,Math.cos(a)*26,3,Math.sin(a)*26,g);w.rotation.y=-a+Math.PI/2;const rf=mesh(new THREE.BoxGeometry(22,0.4,3),M.roof,Math.cos(a)*26,6.2,Math.sin(a)*26,g);rf.rotation.y=-a+Math.PI/2}
  const bt=new Group();bt.position.set(0,0,9);g.add(bt);for(const s of[-1,1])mesh(new THREE.BoxGeometry(0.35,5,0.35),M.pillar,s*1.8,2.5,0,bt);mesh(new THREE.BoxGeometry(4.4,0.35,0.5),M.pillar,0,5,0,bt);
  const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new THREE.Vector2(0.35+t*0.55+Math.pow(t,4)*0.25,-t*1.8))}const bell=mesh(new THREE.LatheGeometry(pts,24),M.bellM,0,4.8,0,bt);env.bell=bell;
  for(const [x,z,i] of[[-6,4,0],[6,4,1],[-6,-8,2],[6,-8,3]]){const b=new Group();b.position.set(x,0,z);g.add(b);for(let k=0;k<3;k++){const l=mesh(new THREE.CylinderGeometry(0.03,0.03,1.3,4),M.iron,Math.cos(k*2.1)*0.18,0.6,Math.sin(k*2.1)*0.18,b);l.rotation.set(Math.sin(k*2.1)*0.25,0,-Math.cos(k*2.1)*0.25)}mesh(new THREE.CylinderGeometry(0.32,0.2,0.2,10),M.iron,0,1.25,0,b);addFire(g,x,1.1,z,1,i)}
  const rg=new THREE.BufferGeometry(),N=3000,rp=new Float32Array(N*6);for(let i=0;i<N;i++){const x=rnd(-14,14),y=rnd(0,12),z=rnd(-14,14);rp.set([x,y,z,x-0.02,y-0.35,z],i*6)}rg.setAttribute('position',new THREE.BufferAttribute(rp,3));
  rain.obj=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0x8090b0,transparent:true,opacity:0.35}));rain.obj.frustumCulled=false;g.add(rain.obj);rain.arr=rp;rain.N=N;
 }
 if(theme!=='duel')rain.obj=null;
 env.theme=theme;env.R=T.R;return env}
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
function rigAsh(big){const gm=genmaMat(),s=big?1.3:1;const root=new Group(),hips=new Group();hips.position.y=0.88;root.add(hips);root.scale.setScalar(s);
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
function rigKama(){const gm=genmaMat();const root=new Group(),body=new Group();body.position.y=0.38;root.add(body);
 const b=mesh(new THREE.SphereGeometry(0.3,12,8),gm,0,0,0,body);b.scale.set(0.7,0.6,1.3);
 const head=new Group();head.position.set(0,0.12,0.42);body.add(head);mesh(new THREE.SphereGeometry(0.14,10,8),gm,0,0,0,head);for(const s of[-1,1])mesh(new THREE.ConeGeometry(0.04,0.14,5),gm,s*0.08,0.14,0,head);
 for(const s of[-1,1])mesh(new THREE.BoxGeometry(0.03,0.015,0.01),M.eye,s*0.05,0.03,0.13,head);
 const tail=mesh(new THREE.CapsuleGeometry(0.04,0.5,3,6),gm,0,0.1,-0.5,body);tail.rotation.x=-1;
 const legs=[];for(const [x,z] of[[-0.15,0.25],[0.15,0.25],[-0.15,-0.25],[0.15,-0.25]]){const l=new Group();l.position.set(x,-0.05,z);body.add(l);mesh(new THREE.CapsuleGeometry(0.03,0.28,3,5),gm,0,-0.17,0,l);legs.push(l)}
 const arm=new Group();arm.position.set(0,-0.02,0.3);body.add(arm);for(const s of[-1,1]){const sk=mesh(new THREE.TorusGeometry(0.22,0.014,4,14,Math.PI*0.9),M.bone,s*0.16,0,0.1,arm);sk.rotation.set(0,Math.PI/2,0)}
 veinsOn(body,3,0.1,0.22);const tip=new THREE.Object3D();tip.position.set(0,0,0.4);arm.add(tip);const gl=glintSprite();scene.add(gl);
 return{root,hips:body,torso:body,legs,arm,weap:arm,tip,gl,mat:gm,upper:head,kind:'kama'}}
function rigYumi(){const gm=genmaMat();const root=new Group(),body=new Group();body.position.y=0.5;root.add(body);
 const b=mesh(new THREE.SphereGeometry(0.34,12,10),gm,0,0,0,body);b.scale.set(1,1.2,0.9);veinsOn(body,5,0.4,0.3);
 const neck=[];for(let i=0;i<7;i++){neck.push(mesh(new THREE.SphereGeometry(0.06,6,5),gm,0,0.35+i*0.08,0.05,body))}
 const head=new Group();body.add(head);mesh(new THREE.SphereGeometry(0.12,10,8),M.pale,0,0,0,head);const hair=mesh(new THREE.ConeGeometry(0.15,0.7,8,1,true),M.hair,0,-0.25,-0.05,head);hair.rotation.x=Math.PI+0.2;
 const arm=new Group();arm.position.set(0,0.15,0.3);body.add(arm);const bow=mesh(new THREE.TorusGeometry(0.55,0.015,4,20,Math.PI*0.8),M.wood,0,0,0,arm);bow.rotation.set(0,Math.PI/2,Math.PI/2+0.3*0);bow.rotation.z=Math.PI*0.6;
 const tip=new THREE.Object3D();head.add(tip);const gl=glintSprite();scene.add(gl);
 return{root,hips:body,torso:body,legs:[],arm,weap:arm,tip,gl,mat:gm,upper:head,kind:'yumi',neck,head}}
function rigSota(){const h=makeHuman({scale:1.1,pants:M.sotaK,pants2:M.sotaK,kimono:M.sotaK,vest:M.sotaV,skin:M.sotaSkin,cape:null,tsR:M.sotaA,tsL:M.sotaA,armor:M.sotaA,obi:M.sotaA,eyes:true,horns:true,len:{R:0.9,L:0.86}});
 const gl=glintSprite();scene.add(gl);return{...h,root:h.root,tip:h.arms.R.sw.userData.tip,gl,mat:null,upper:h.torso,kind:'sota',human:h}}
M.pale=new MS({color:0xcfc5b5,roughness:0.6});M.sotaSkin=new MS({color:0x9c7b66,roughness:0.6});
