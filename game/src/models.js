import * as THREE from 'three';
import {ASSET,addPart} from './assets.js';
import {ANIMS} from './anims.js';
export {ASSET,ANIMS};
const {Group,Mesh,MeshStandardMaterial:MS,MeshBasicMaterial:MB,CapsuleGeometry:Cap,BoxGeometry:Box,SphereGeometry:Sph,CylinderGeometry:Cyl,DoubleSide}=THREE;
export const M={};
const ms=(c,r=0.8,m=0,x={})=>new MS({color:c,roughness:r,metalness:m,...x});
export function initMats(){
 Object.assign(M,{skin:ms(0xb0806a,.6),kimono:ms(0x1f2227,.9),vest:ms(0x7a1c15,.85),cape:ms(0x3c4044,1,0,{side:DoubleSide}),pants:ms(0x25272d,.95,0,{side:DoubleSide}),pants2:ms(0x17181c,.95),
 hair:ms(0x0e0c0b,.45),obi:ms(0x3b2f22,.9),dark:ms(0x0f0e0d,.9),blade:ms(0xdfe4ec,.15,1),handle:ms(0x15110e,.9),tsubaR:ms(0xc8a030,.35,1),tsubaL:ms(0x2a3552,.4,.9),
 lapis:new MS({color:0x2a5aff,emissive:0x1a40ff,emissiveIntensity:1.5}),glove:ms(0xa49c8c,.3,1),gloveDark:ms(0x5a5446,.4,1),orb:new MB({color:0x9ad8ff}),
 genma:new THREE.MeshPhysicalMaterial({color:0x06070c,roughness:.2,metalness:.3,clearcoat:1,clearcoatRoughness:.08,iridescence:1,iridescenceIOR:1.8,iridescenceThicknessRange:[250,700]}),
 vein:new MB({color:0xd0102a}),rot:ms(0x3a2a1e,.9,.3),hat:ms(0x2c2823,.9),bone:ms(0xd2c29e,.55),wood:ms(0x3b2f25,.9),
 sotaK:ms(0x140c0e,.8),sotaV:ms(0x5a0c10,.5,.4),sotaA:ms(0x2a0808,.4,.6),eye:new MB({color:0xff2a2a}),purple:new MB({color:0xb040ff}),chitin:ms(0x201028,.3,.4)});
}
export const mesh=(geo,mat,x=0,y=0,z=0,p)=>{const m=new Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;if(p)p.add(m);return m};
function bladeGeo(len){const g=new Box(0.007,0.032,len,1,1,12);g.translate(0,0,len/2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const z=p.getZ(i),t=z/len;let y=p.getY(i);y*=1-0.55*t*t;if(t>0.94&&y>0)y*=(1-t)/0.06;p.setY(i,y+0.07*t*t);}g.computeVertexNormals();return g}
const SWL={SW_A:0.74,SW_Y:0.69,SW_S:0.9,SW_G:1.2,KN:0.75};
function makeSwordA(len,tsuba,pre0){const g=new Group();const pre=pre0&&ASSET.parts[pre0]?pre0:len>1.05?'SW_G':tsuba===M.tsubaR?'SW_A':tsuba===M.tsubaL?'SW_Y':'SW_S';
 const inner=new Group();g.add(inner);inner.scale.z=len/SWL[pre];
 for(const p of Object.keys(ASSET.parts[pre]||{}))if(!(pre==='KN'&&p==='saya'))addPart(inner,pre,p,{mat:m=>m&&m.name==='blade_steel'?M.blade:m});
 const tip=new THREE.Object3D();tip.position.copy(ASSET.tips[pre]||new THREE.Vector3(0,0.035,0.085+SWL[pre]));inner.add(tip);const base=new THREE.Object3D();base.position.set(0,0,0.25);inner.add(base);
 g.userData={tip,base};return g}
export function makeSword(len,tsuba,lapis,pre){if(ASSET.ok)return makeSwordA(len,tsuba,pre);const g=new Group();
 mesh(new Cyl(0.017,0.017,0.26,6),M.handle,0,0,-0.07,g).rotation.x=Math.PI/2;
 const ts=mesh(new Cyl(0.045,0.045,0.012,lapis?16:8),tsuba,0,0,0.07,g);ts.rotation.x=Math.PI/2;
 if(lapis)mesh(new Sph(0.012,8,6),M.lapis,0,0.03,0.07,g);
 const b=mesh(bladeGeo(len),M.blade,0,0,0.08,g);
 const tip=new THREE.Object3D();tip.position.set(0,0.07,0.08+len);g.add(tip);const base=new THREE.Object3D();base.position.set(0,0,0.25);g.add(base);
 g.userData={tip,base};return g}
function makeHumanA(o){const pre=o.set,S=o.xs&&ASSET.skins[o.xs];const mm=m=>(o.matMap&&m&&o.matMap[m.name])||m;const NO={all:[],special:{}};const add=S?()=>NO:(g,p)=>addPart(g,pre,p,{mat:mm});
 const J=S?S.J:null,off=(a,b)=>J[a].clone().sub(J[b]);
 const root=new Group(),hips=new Group();hips.position.y=0.92;root.add(hips);root.scale.setScalar(o.scale||1);const hp0=add(hips,'hips');
 const legs=[];for(const [sd,k,ti] of[[-1,'R',3],[1,'L',5]]){const th=new Group();th.position.set(sd*0.1,0,0);if(J)th.position.copy(off(ti,0));hips.add(th);add(th,'thigh'+k);const kn=new Group();kn.position.y=-0.44;if(J)kn.position.copy(off(ti+1,ti));th.add(kn);add(kn,'shin'+k);legs.push({th,kn})}
 const torso=new Group();if(J)torso.position.copy(off(1,0));hips.add(torso);add(torso,'torso');
 const neck=new Group();neck.position.y=0.6;if(J)neck.position.copy(off(2,1));torso.add(neck);const nk=add(neck,'neck');
 const horns=[];for(const h of['horn0','horn2'])if(nk.special[h]){nk.special[h].visible=false;horns.push(nk.special[h])}
 const arms={};
 for(const [k,side,ai] of[['R',-1,7],['L',1,10]]){const sh=new Group();sh.rotation.order='YXZ';sh.position.set(side*0.22,0.5,0);if(J)sh.position.copy(off(ai,1));torso.add(sh);add(sh,'upperArm'+k);
  const el=new Group();el.position.y=-0.29;if(J)el.position.copy(off(ai+1,ai));sh.add(el);add(el,'foreArm'+k);
  const hand=new Group();hand.position.y=-0.28;if(J)hand.position.copy(off(ai+2,ai+1));el.add(hand);const hp=add(hand,'hand'+k);let orb=hp.special.orb||null;
  if(orb){orb.castShadow=false}else if(k==='L'&&o.glove){if(S){orb=mesh(new Sph(0.026,10,8),M.orb,0.04,0.0,0.01,hand);orb.castShadow=false}else{orb=new THREE.Object3D();orb.position.set(0.044,0.025,0);hand.add(orb)}}
  const sw=makeSword(o.len[k],k==='R'?o.tsR:o.tsL,k==='L'&&o.lapis,o.kn?'KN':undefined);hand.add(sw);
  arms[k]={sh,el,hand,sw,orb}}
 let cape=null;if(!S){const cp=addPart(torso,pre,'cape',{mat:mm});if(cp.special.cape){cape=cp.special.cape;cape.userData.base=cape.geometry.attributes.position.array.slice()}}
 if(hp0.skin)skinSkirt(hp0.skin,root,hips,legs);
 const h={root,hips,torso,neck,legs,arms,cape,horns};
 if(S)skinBody(h,S,mm);
 if(o.kn&&ASSET.parts.KN&&ASSET.parts.KN.saya&&ANIMS.sockets){h.saya=[];for(const k of['R','L']){const s=ANIMS.sockets[k],g=new Group();g.position.set(s[0],s[1],s[2]);g.quaternion.set(s[3],s[4],s[5],s[6]);const inn=new Group();inn.scale.z=o.len[k]/SWL.KN;g.add(inn);addPart(inn,'KN','saya');hips.add(g);h.saya.push(g)}}
 return h}
// v0.10: тело — один SkinnedMesh (верх/низ отдельно, чтобы враг мог «распасться» по поясу без растяжения).
function skinBody(h,S,mm){const {root}=h;root.updateMatrixWorld(true);const J=[h.hips,h.torso,h.neck,h.legs[0].th,h.legs[0].kn,h.legs[1].th,h.legs[1].kn,h.arms.R.sh,h.arms.R.el,h.arms.R.hand,h.arms.L.sh,h.arms.L.el,h.arms.L.hand];
 const sk=new THREE.Skeleton(J);const list=[];
 for(const p of S.parts)for(const half of[p.up,p.lo]){const m=new THREE.SkinnedMesh(half.geo,mm(p.mat));m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.userData.cut=half.cut;root.add(m);m.updateMatrixWorld(true);m.bind(sk,m.matrixWorld);list.push(m)}
 h.skinMeshes=list;h.cut=()=>{for(const m of list)m.geometry=m.userData.cut}}
// Юбка хакама/кусадзури: GPU-скиннинг к бёдрам, чтобы ноги не проходили сквозь ткань.
function skinSkirt(list,root,hips,legs){root.updateMatrixWorld(true);
 const bones=[hips,legs[0].th,legs[1].th];
 const sk=new THREE.Skeleton(bones.map(b=>b));
 for(const m of list){const g=m.geometry,p=g.attributes.position,n=p.count,si=new Uint16Array(n*4),sw=new Float32Array(n*4);
  for(let i=0;i<n;i++){const x=p.getX(i),y=p.getY(i);let s=Math.min(1,Math.max(0,(0.02-y)/0.32));s=s*s*(3-2*s);const t=Math.max(-1,Math.min(1,x/0.11));
   const wl=s*(0.5+0.5*t)*0.92,wr=s*(0.5-0.5*t)*0.92;si.set([0,1,2,0],i*4);sw.set([1-wl-wr,wr,wl,0],i*4)}
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
  m.bind(sk,m.matrixWorld)}}
export function makeHuman(o){if(ASSET.ok&&o.set)return makeHumanA(o);
 const root=new Group(),hips=new Group();hips.position.y=0.92;root.add(hips);root.scale.setScalar(o.scale||1);
 const legs=[];
 for(const side of[-1,1]){const th=new Group();th.position.set(side*0.1,0,0);hips.add(th);
  mesh(new Cap(0.07,0.32,4,8),o.pants,0,-0.22,0,th);const kn=new Group();kn.position.y=-0.44;th.add(kn);
  mesh(new Cap(0.055,0.34,4,8),o.pants2,0,-0.21,0,kn);mesh(new Box(0.1,0.05,0.24),M.dark,0,-0.45,0.05,kn);legs.push({th,kn})}
 mesh(new Cyl(0.21,0.36,0.6,14,1,true),o.pants,0,-0.28,0,hips);
 const torso=new Group();hips.add(torso);
 const ch=mesh(new Cap(0.15,0.3,4,12),o.kimono,0,0.3,0,torso);ch.scale.set(1.2,1,0.8);
 if(o.vest){const v=mesh(new Cap(0.152,0.22,4,12),o.vest,0,0.33,0,torso);v.scale.set(1.25,1,0.86)}
 if(o.armor){const a=mesh(new Box(0.36,0.2,0.26),o.armor,0,0.22,0,torso);for(const s of[-1,1]){const sp=mesh(new Box(0.14,0.04,0.2),o.armor,s*0.26,0.52,0,torso);sp.rotation.z=s*0.4}}
 mesh(new Cyl(0.19,0.19,0.08,12),o.obi||M.obi,0,0.1,0,torso).scale.z=0.75;
 const neck=new Group();neck.position.y=0.6;torso.add(neck);
 mesh(new Sph(0.105,14,10),o.skin,0,0.1,0.01,neck);
 const hr=mesh(new Sph(0.114,14,8,0,Math.PI*2,0,Math.PI*0.55),M.hair,0,0.115,-0.01,neck);hr.rotation.x=-0.35;
 const pt=mesh(new Cap(0.028,0.24,3,6),M.hair,0,0.1,-0.17,neck);pt.rotation.x=0.9;
 for(let i=0;i<5;i++){const s=mesh(new Cap(0.008,0.1,2,4),M.hair,-0.06+i*0.03,0.1,0.1,neck);s.rotation.x=-0.3}
 if(o.eyes)for(const s of[-1,1])mesh(new Box(0.03,0.012,0.01),M.eye,s*0.038,0.11,0.1,neck);
 const horns=[];if(o.horns)for(const s of[-1,1]){const h=mesh(new THREE.ConeGeometry(0.03,0.22,6),M.chitin,s*0.06,0.22,-0.02,neck);h.rotation.set(-0.5,0,s*-0.4);h.visible=false;horns.push(h)}
 const arms={};
 for(const [k,side] of[['R',-1],['L',1]]){const sh=new Group();sh.rotation.order='YXZ';sh.position.set(side*0.22,0.5,0);torso.add(sh);
  const up=mesh(new Cap(0.055,0.22,4,8),o.kimono,0,-0.14,0,sh);up.scale.set(1.35,1,1.35);
  const el=new Group();el.position.y=-0.29;sh.add(el);
  const glove=k==='L'&&o.glove;
  mesh(new Cap(0.042,0.2,4,8),glove?M.glove:o.skin,0,-0.13,0,el);
  if(glove){for(let i=0;i<4;i++){const r=mesh(new THREE.TorusGeometry(0.05,0.012,6,12),M.gloveDark,0,-0.05-i*0.055,0,el);r.rotation.x=Math.PI/2}}
  const hand=new Group();hand.position.y=-0.28;el.add(hand);mesh(new Sph(0.045,8,6),glove?M.glove:o.skin,0,0,0,hand);
  let orb=null;if(glove){orb=mesh(new Sph(0.035,10,8),M.orb,0,-0.02,0.04,hand);orb.castShadow=false}
  const sw=makeSword(o.len[k],k==='R'?o.tsR:o.tsL,k==='L'&&o.lapis);hand.add(sw);
  arms[k]={sh,el,hand,sw,orb}}
 let cape=null;
 if(o.cape){const g=new THREE.CylinderGeometry(0.25,0.34,0.95,10,8,true,Math.PI*0.62,Math.PI*0.76);g.translate(0,-0.475,0);cape=mesh(g,o.cape,0,0.6,0.02,torso);cape.userData.base=g.attributes.position.array.slice();
  const hood=mesh(new THREE.TorusGeometry(0.17,0.05,6,12,Math.PI*1.2),o.cape,0,0.58,-0.02,torso);hood.rotation.set(Math.PI/2,0,-Math.PI*0.1+Math.PI);}
 return{root,hips,torso,neck,legs,arms,cape,horns}}
// ---------- poses
// arm: [shoulderPitch, across(yaw), abduct, elbow, bladePitchTotal]
export const POSE={
 sheath:{c:0.05,tx:0.03,ty:0.08,R:[0.06,0.05,0.14,-0.22,-0.16],L:[-0.3,0.3,0.1,-1.2,-1.5]},
 crane:{c:0.12,tx:0.08,ty:0.12,R:[-0.3,0.02,0.36,-0.5,1.05],L:[-0.6,0.12,0.38,-0.65,-0.3]},
 // v0.13: «Путь одной катаны» — Акацуки в правой (катате, остриём к врагу), левая — кулак Они у груди
 one:{c:0.2,tx:0.12,ty:-0.3,R:[-1.05,0.3,0.22,-0.55,0.35],L:[-0.75,-0.55,0.2,-1.9,-1.2]},
 tiger:{c:0.32,tx:0.35,ty:0.1,R:[-0.45,0.25,0.25,-0.3,0.95],L:[-0.4,0.25,0.25,-0.3,1.0]},
 water:{c:0.14,tx:0.1,ty:0,R:[-1.3,0.55,0.1,-0.9,-1.2],L:[-1.2,0.55,0.1,-0.9,-1.95]},
 rUp:{c:0.1,tx:-0.12,ty:0.55,R:[-3.0,0.1,0.3,-0.5,-3.7],L:[0.3,0.1,0.3,-0.3,2.5]},
 rDown:{c:0.32,tx:0.45,ty:-0.55,R:[-0.6,0.7,0.15,-0.1,0.95],L:[0.4,0.1,0.3,-0.3,2.5]},
 lBack:{c:0.16,tx:0.05,ty:0.5,R:[-2.7,0.2,0.3,-0.4,-0.55],L:[0.6,0.1,0.2,-2.1,0]},
 lThrust:{c:0.26,tx:0.3,ty:-0.45,R:[-2.7,0.2,0.3,-0.4,-0.55],L:[-1.5,0.2,0,-0.05,0]},
 nUp:{c:0.1,tx:-0.15,ty:0,R:[-2.9,0.25,0.15,-0.4,-3.5],L:[-2.9,0.25,0.15,-0.4,-3.4]},
 nDown:{c:0.36,tx:0.5,ty:0,R:[-0.8,0.45,0.1,-0.1,0.8],L:[-0.8,0.45,0.1,-0.1,0.85]},
 block:{c:0.26,tx:0.15,ty:0,R:[-1.3,0.6,0.1,-1.0,-0.9],L:[-1.25,0.6,0.1,-1.0,-2.2]},
 dodge:{c:0.55,tx:0.5,ty:0,R:[0.5,0,0.4,-0.2,1.9],L:[0.5,0,0.4,-0.2,1.9]},
 absorb:{c:0.16,tx:0.1,ty:-0.5,R:[-2.7,0.2,0.3,-0.4,-0.55],L:[-1.55,0.1,0,0,1.5]},
 issen:{c:0.5,tx:0.45,ty:-0.8,R:[-1.45,-0.9,0.35,0,0.05],L:[0.5,0.1,0.3,-0.3,2.5]},
 hurt:{c:0.2,tx:-0.35,ty:0.2,R:[-0.35,0,0.5,-0.4,0.9],L:[-0.35,0,0.5,-0.4,0.9]},
 dead:{c:0.62,tx:0.9,ty:0,R:[0.2,0,0.3,-0.2,1.4],L:[0.2,0,0.3,-0.2,1.4]},
 eat:{c:0.1,tx:0,ty:0,R:[-2.7,0.2,0.3,-0.4,-0.55],L:[-2.0,0.6,0,-2.1,1.3]},
 spinA:{c:0.4,tx:0.3,ty:1.3,R:[-1.6,-1.3,0.1,0,0],L:[-1.6,-1.3,0.1,0,0]},
 spinB:{c:0.4,tx:0.3,ty:-1.3,R:[-1.6,-1.3,0.1,0,0],L:[-1.6,-1.3,0.1,0,0]},
 rest:{c:0.06,tx:0.07,ty:0.06,R:[-0.22,0.02,0.38,-0.45,1.0],L:[-0.2,0.02,0.38,-0.4,1.05]},
 fall:{c:0.4,tx:-0.3,ty:0.1,R:[-2.3,0.3,0.95,-0.7,-0.6],L:[-2.1,0.3,0.95,-0.7,-0.6]},
 kneel:{c:0.62,tx:0.55,ty:0.15,R:[-0.3,0.1,0.25,-0.15,-0.2],L:[-0.55,0.3,0.35,-1.1,-1.3]},
 reach:{c:0.16,tx:0.12,ty:-0.38,R:[0.1,0.05,0.2,-0.3,-0.2],L:[-1.5,0.05,0.12,-0.12,-2.6]},
 unlock:{c:0.55,tx:0.45,ty:-0.12,R:[-0.95,0.15,0.08,-0.25,-0.5],L:[-0.1,0.1,0.28,-0.5,-0.4]},
 take:{c:0.55,tx:0.62,ty:0,R:[-0.95,0.22,0.05,-0.15,-0.4],L:[-0.95,0.22,0.05,-0.15,-0.4]},
 inspect:{c:0.06,tx:0.05,ty:-0.12,R:[-1.25,-0.45,0.1,-1.45,-1.3],L:[-0.15,0.1,0.25,-0.6,-0.5]},
 read:{c:0.08,tx:0.12,ty:0,R:[-1.0,-0.5,0.08,-1.35,-1.4],L:[-1.0,-0.5,0.08,-1.35,-1.4]},
 iai:{c:0.5,tx:0.4,ty:0.6,R:[-0.4,0.6,0.2,-1.2,2.84],L:[-0.3,0.6,0.2,-1.2,2.8]},
 // v0.10: ронин с яри и лучник-скелет
 yariG:{c:0.22,tx:0.12,ty:0.35,R:[-0.55,0.35,0.12,-1.0,0.12],L:[-0.2,0.1,0.25,-0.5,0.4]},
 yariW:{c:0.3,tx:0.05,ty:0.6,R:[-0.15,0.25,0.3,-1.55,0.05],L:[-0.3,0.1,0.25,-0.6,0.4]},
 yariT:{c:0.38,tx:0.35,ty:-0.1,R:[-1.45,0.1,0.05,-0.05,0.0],L:[0.3,0.1,0.3,-0.3,0.4]},
 bowIdle:{c:0.06,tx:0.05,ty:0.05,R:[-0.1,0.05,0.18,-0.35,0.2],L:[-0.35,0.15,0.2,-0.45,-1.4]},
 bowDraw:{c:0.12,tx:0.04,ty:0.55,R:[-1.45,0.75,0.05,-2.0,-0.2],L:[-1.5,-0.35,0.05,0,-1.57]}
};
// ---------- клипы из Blender (blender/anim.py -> anims.js)
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3();
export function heroJoints(h){return[h.hips,h.torso,h.neck,h.legs[0].th,h.legs[0].kn,h.legs[1].th,h.legs[1].kn,h.arms.R.sh,h.arms.R.el,h.arms.R.hand,h.arms.L.sh,h.arms.L.el,h.arms.L.hand]}
function clipIdx(C,t){const ns=C.h.length/3,f=Math.max(0,Math.min(C.n,t))/ANIMS.step,i=Math.min(ns-1,Math.floor(f));return[i,Math.min(ns-1,i+1),f-i]}
export function applyClip(h,name,t,w,legW=w){const C=ANIMS.clips[name];if(!C||w<=0.001)return;const [i,j,k]=clipIdx(C,t),J=h.J||(h.J=heroJoints(h)),q=C.q;
 for(let n=0;n<13;n++){const a=(i*13+n)*4,b=(j*13+n)*4;_q.set(q[a],q[a+1],q[a+2],q[a+3]);_q2.set(q[b],q[b+1],q[b+2],q[b+3]);if(_q.dot(_q2)<0)_q2.set(-_q2.x,-_q2.y,-_q2.z,-_q2.w);_q.slerp(_q2,k);J[n].quaternion.slerp(_q,n>=3&&n<=6?legW:w)}
 const hp=C.h;_v.set(hp[i*3],hp[i*3+1],hp[i*3+2]).lerp(_v2.set(hp[j*3],hp[j*3+1],hp[j*3+2]),k);h.hips.position.lerp(_v,legW)}
// меч из клипа: {p,q,a} в пространстве бёдер (a=1 — «в руке»)
export function clipSword(name,side,t,out){const C=ANIMS.clips[name];const S=C&&C.sw&&C.sw[side];if(!S)return null;const [i,j,k]=clipIdx(C,t),a=i*8,b=j*8;
 out.p.set(S[a],S[a+1],S[a+2]).lerp(_v2.set(S[b],S[b+1],S[b+2]),k);out.q.set(S[a+3],S[a+4],S[a+5],S[a+6]);_q2.set(S[b+3],S[b+4],S[b+5],S[b+6]);if(out.q.dot(_q2)<0)_q2.set(-_q2.x,-_q2.y,-_q2.z,-_q2.w);out.q.slerp(_q2,k);out.a=S[a+7]+(S[b+7]-S[a+7])*k;return out}
export function mixPose(a,b,t){const r={c:a.c+(b.c-a.c)*t,tx:a.tx+(b.tx-a.tx)*t,ty:a.ty+(b.ty-a.ty)*t,R:[],L:[]};for(let i=0;i<5;i++){r.R[i]=a.R[i]+(b.R[i]-a.R[i])*t;r.L[i]=a.L[i]+(b.L[i]-a.L[i])*t}return r}
export function applyPose(h,p,walk=0,ph=0,t=0,o={}){
 const run=o.run??1,idle=(o.idle??0)*(1-walk),A1=0.36+0.26*run,K1=0.55+0.75*run;
 const br=Math.sin(t*1.7+(o.seed||0)),sway=Math.sin(t*0.45+(o.seed||0)*2);
 const bob=walk*(0.022+0.03*run)*(0.5-0.5*Math.cos(2*ph))+idle*br*0.006;
 h.hips.position.y=0.92-p.c*0.28-bob-walk*run*0.035;h.hips.position.x=idle*sway*0.025;
 h.torso.rotation.set(p.tx+walk*run*0.16+idle*br*0.02,p.ty-Math.sin(ph)*0.14*walk+idle*(o.look||0)*0.25,-idle*sway*0.03);
 h.hips.rotation.set(0,-p.ty*0.3+Math.sin(ph)*0.12*walk,idle*sway*0.035+Math.cos(ph)*0.04*walk);
 if(h.neck)h.neck.rotation.set(-walk*run*0.1+idle*br*0.015,idle*(o.look||0)*0.55,0);
 for(let i=0;i<2;i++){const L=h.legs[i],q=ph+i*Math.PI,sq=Math.sin(q),cq=Math.cos(q),side=i?1:-1;
  const swing=-sq*A1*walk,kneeSw=Math.pow(Math.max(0,cq),1.5)*K1*walk,stance=Math.max(0,-cq)*Math.max(0,sq)*0.25*walk;
  const crouch=i?p.c*0.6-p.c*0.1:p.c*0.9;
  L.th.rotation.x=swing-crouch-kneeSw*0.25;L.kn.rotation.x=(i?p.c*1.3:p.c*1.6)+kneeSw+stance+walk*run*0.15;
  L.th.rotation.z=side*(0.06+p.c*0.15)+(i?-1:1)*idle*sway*0.03*side}
 const Ar=h.arms;const r=p.R,l=p.L,as=Math.sin(ph)*walk*(0.12+0.1*run);
 Ar.R.sh.rotation.set(r[0]+as,r[1],-r[2]-idle*br*0.02);Ar.R.el.rotation.x=r[3]-walk*run*0.15;Ar.R.hand.rotation.x=r[4]-r[0]-r[3]-as*0.5;
 const asL=o.lockL?as*0.15:as;Ar.L.sh.rotation.set(l[0]-asL,-l[1],l[2]+idle*br*0.02);Ar.L.el.rotation.x=l[3]-walk*run*0.15;Ar.L.hand.rotation.x=l[4]-l[0]-l[3]+asL*0.5;
 if(h.cape){const g=h.cape.geometry,pa=g.attributes.position,b=h.cape.userData.base;for(let i=0;i<pa.count;i++){const y=b[i*3+1],x=b[i*3],d=-y;pa.array[i*3+2]=b[i*3+2]-d*d*(0.12+walk*0.35)-Math.sin(t*3+x*4+d*3)*0.025*d-p.c*d*0.2}pa.needsUpdate=true;g.computeVertexNormals()}
}
