// ---------- v0.19: HP-бары над головами (SAO — обычные мобы, Demon Slayer — боссы), «умные» мобы (уклонения, тактика), онигири
// Модели: sao_health_bar.glb (Sockona), demon_slayer_ui_concept_art.glb (Yaanaa), onigiri_1.glb (DevCentral) — CC BY 4.0, см. README.
// blender/ext/v18.py hud19(): плоские части V8H__saoB/saoI (рамка/полоса, ширина 1 м), V8H__dsBack/dsHp/dsIco/dsChain (2.2 м), V8G__oni.
const HPB={m:new Map(),K:null,tmp:new V3()};
const HB_HIDE=new Set(['intro','csIdle','cs','hidden','locked','mzwait']);
const HB_C={hi:0x12d83c,mid:0xf2b814,lo:0xf01c1c,p2:0x9a3cff};
function hbMat(col,o={}){return new MB({color:col,transparent:true,opacity:o.op??1,depthWrite:false,depthTest:true,toneMapped:false,fog:false,side:THREE.DoubleSide})}
function hbKinds(){if(HPB.K)return HPB.K;const P0=(ASSET.parts&&ASSET.parts.V8H)||{};
 const items=k=>(P0[k]||[]).map(it=>{const g=it.geo.clone();const c=it.mat&&it.mat.color?it.mat.color.clone():new THREE.Color(1,1,1);if(it.mat&&it.mat.emissive&&it.mat.emissive.r+it.mat.emissive.g+it.mat.emissive.b>0.3)c.copy(it.mat.emissive).multiplyScalar(1.1);return{g,c}});
 const fin=(K,ref)=>{const bb=new THREE.Box3();ref.computeBoundingBox();const c=new V3();ref.boundingBox.getCenter(c);
  for(const p of K.parts){p.g.translate(-c.x,-c.y,-c.z);p.g.computeBoundingBox();bb.union(p.g.boundingBox)}
  const ip=K.parts.find(p=>p.inner);if(ip){const x0=ip.g.boundingBox.min.x;ip.g.translate(-x0,0,0);ip.x0=x0;ip.g.computeBoundingBox();ip.g.computeBoundingSphere()}
  K.minY=bb.min.y;K.maxY=bb.max.y;K.w=bb.max.x-bb.min.x;return K};
 const K={};
 {const fr=items('saoB'),inn=items('saoI');
  if(fr.length&&inn.length){K.sao=fin({parts:[{g:inn[0].g.clone(),mat:hbMat(0x06080a,{op:0.6}),ro:39},...fr.map(p=>({g:p.g,mat:hbMat(0xaebcc6),ro:40})),{g:inn[0].g,inner:1,ro:42}]},fr[0].g)}
  else{const a=new THREE.PlaneGeometry(1.04,0.1),b=new THREE.PlaneGeometry(1,0.068);K.sao=fin({parts:[{g:a,mat:hbMat(0x101418,{op:0.8}),ro:40},{g:b,inner:1,ro:42}]},a)}}
 {const bk=items('dsBack'),hp=items('dsHp'),ic=items('dsIco'),ch=items('dsChain');
  if(bk.length&&hp.length){const parts=[...bk.map(p=>({g:p.g,mat:hbMat(0x050505,{op:0.92}),ro:40})),{g:hp[0].g,inner:1,col:0xc81010,ro:42},
    ...ch.map(p=>({g:p.g,mat:hbMat(0x5c5c66),ro:43})),...ic.map(p=>({g:p.g,mat:hbMat(p.c.g>0.5?0x40ff40:0x5a0c06),ro:p.c.g>0.5?45:44}))];K.ds=fin({parts},hp[0].g)}
  else{const a=new THREE.PlaneGeometry(2.2,0.13),b=new THREE.PlaneGeometry(2.1,0.08);K.ds=fin({parts:[{g:a,mat:hbMat(0x050505,{op:0.9}),ro:40},{g:b,inner:1,col:0xc81010,ro:42}]},a)}}
 K.trS=hbMat(0xc8c0b0,{op:0.75});K.trD=hbMat(0xc8a070,{op:0.85});return HPB.K=K}
function hbLabel(b,txt){const c=b.cv||(b.cv=document.createElement('canvas'));c.width=1024;c.height=96;const x=c.getContext('2d');x.clearRect(0,0,1024,96);
 x.font='bold 54px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=9;x.strokeStyle='rgba(0,0,0,0.85)';x.strokeText(txt,512,50);x.fillStyle='#ecd394';x.fillText(txt,512,50);
 if(!b.lab){const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const m=new MB({map:tx,transparent:true,depthWrite:false,toneMapped:false,fog:false,side:THREE.DoubleSide});
  b.lab=new Mesh(new THREE.PlaneGeometry(2.6,0.244),m);b.lab.renderOrder=46;b.lab.scale.y=1/1.3;b.g.add(b.lab)}else b.lab.material.map.needsUpdate=true}
function hbMk(e,boss){const K=hbKinds(),k=boss?K.ds:K.sao,g=new Group(),b={g,boss,k,fr:1,tf:1,last:1,hold:0,lf:G.frame,col:-1,labK:''};
 for(const p of k.parts){let m;if(p.inner){b.inM=hbMat(p.col||HB_C.hi);b.in=m=new Mesh(p.g,b.inM);m.position.x=p.x0;b.tr=new Mesh(p.g,boss?K.trD:K.trS);b.tr.position.x=p.x0;b.tr.renderOrder=41;b.tr.frustumCulled=false;g.add(b.tr)}
  else m=new Mesh(p.g,p.mat);m.renderOrder=p.ro;m.frustumCulled=false;g.add(m)}
 if(boss)b.labY=k.maxY+0.17;scene.add(g);return b}
function hbDel(e,b){scene.remove(b.g);b.inM.dispose();if(b.lab){b.lab.material.map.dispose();b.lab.material.dispose();b.lab.geometry.dispose()}HPB.m.delete(e)}
function hbSync(force){if(force){try{eatSync();ONI.m.visible=true;ONI.m.scale.setScalar(1)}catch(e){}}const show=force||(G.mode==='play'&&!CS.on&&!(PS&&PS.cine));let alive=null;
 if(HPB.m.size){alive=new Set(enemies);for(const [e,b] of HPB.m)if(!alive.has(e))hbDel(e,b)}
 if(!show){for(const b of HPB.m.values())b.g.visible=false;return}
 const cp=camera.position;
 for(const e of enemies){let b=HPB.m.get(e);const boss=!!(e.d.boss||(e===G.bossBar&&e.elite));
  const dc=Math.hypot(e.x-cp.x,e.z-cp.z),far=dc>34;
  const hid=!force&&(far||(e.dead&&e.deathT>50)||HB_HIDE.has(e.state)||!e.rig.root.visible||(e.spawnK!=null&&e.spawnK<0.5));
  if(hid){if(b)b.g.visible=false;continue}
  if(b&&b.boss!==boss){hbDel(e,b);b=null}if(!b){b=hbMk(e,boss);HPB.m.set(e,b)}
  const fr=clamp(Math.max(0,e.hp)/(e.max||1),0,1),df=Math.max(0,Math.min(6,G.frame-b.lf));b.lf=G.frame;
  if(fr<b.last-1e-4)b.hold=G.frame+38;b.last=fr;b.fr=fr>b.fr?lerp(b.fr,fr,0.12):lerp(b.fr,fr,0.45);
  if(G.frame>b.hold)b.tf=Math.max(b.fr,b.tf-0.011*df);if(b.tf<b.fr)b.tf=b.fr;
  b.in.scale.x=Math.max(1e-3,b.fr);b.tr.scale.x=Math.max(1e-3,b.tf);b.tr.visible=b.tf-b.fr>0.002;
  const col=boss?(e.phase===2?HB_C.p2:0xc81010):(fr>0.5?HB_C.hi:fr>0.2?HB_C.mid:HB_C.lo);if(col!==b.col){b.col=col;b.inM.color.setHex(col)}
  if(boss){const lk=e.d.name+(e.phase===2?(e.t==='sota'?' — Демон':' — Ярость'):'');if(lk!==b.labK){b.labK=lk;hbLabel(b,lk);b.lab.position.set(0,b.labY,0)}}
  const s=boss?(e.d.boss?1.1:0.95):clamp(0.62+0.2*e.d.h,0.75,1.05),H=e.d.h*(boss?1.04:1)+(boss?0.42:0.3);
  const sc=s*clamp(0.35+dc*0.08,0.7,1.8)*(e.dead?0.6+0.4*Math.max(0,1-e.deathT/50):1);
  b.g.scale.set(sc,sc*1.3,sc);b.g.position.set(e.x,e.y+(e.gy||0)+H-b.k.minY*sc*1.3,e.z);b.g.quaternion.copy(camera.quaternion);
  if(!force&&b.g.position.distanceTo(cp)<2.3){b.g.visible=false;continue}b.g.visible=true}}
window.__hb=HPB;window.__r19=()=>R19;
// ---------- ИИ: чтение атаки игрока, уклонения, наказание, «очередь» атакующих, обход с флангов
const R19={f:-1,st:'',t:0,start:false,att:0,n:0};
const DG_NO=new Set(['moku','shogun']),FL_NO=new Set(['moku','yumi','sota','shogun','musha']);
function r19Frame(){if(R19.f===G.frame)return;R19.f=G.frame;const s=P.state,a=s==='atk'||s==='issen'||s==='dive';R19.start=a&&(R19.st!==s||P.t<R19.t);R19.st=s;R19.t=P.t;
 let n=0,m=0;for(const o of enemies){if(o.dead)continue;m++;if((o.state==='wind'||o.state==='act')&&Math.hypot(o.x-P.x,o.z-P.z)<4.5)n++}R19.att=n;R19.n=m}
function dodgeStart(e){const rx=P.x-e.x,rz=P.z-e.z,L=Math.hypot(rx,rz)||1,ux=rx/L,uz=rz/L,back=Math.random()<0.3,s=Math.random()<0.5?-1:1;
 let vx=back?-ux:-uz*s-ux*0.35,vz=back?-uz:ux*s-uz*0.35;const n=Math.hypot(vx,vz)||1,sp=(e.t==='kama'||e.t==='dog'||e.t==='chochin')?0.2:e.d.boss?0.19:0.16;
 e.vx=vx/n*sp;e.vz=vz/n*sp;e.state='dodge';e.st=0;e.inv=1;e.dgCD=rnd(150,260)*(e.d.boss?0.8:1);e.atk=e.atk||e.d.atk&&e.d.atk[0]||null;e.hitDone=true;
 hitTilt(e,vx/n,vz/n,0.05);(SFX.swingL||(()=>{}))();dust(e.x,e.z,5);R19.dodges=(R19.dodges||0)+1}
function aiPre(e,ts,d){r19Frame();
 if(e.state==='dodge'){e.st+=ts;if(e.st>13)e.inv=0;e.yaw=turn(e.yaw,Math.atan2(P.x-e.x,P.z-e.z),0.2);
  if(G.frame%3===0)FX.add.add({x:e.x,y:e.d.h*0.55,z:e.z,vx:0,vy:0,vz:0,life:14,s:Math.max(0.5,e.d.h*0.55),r:0.28,gg:0.3,b:0.5,a:0.32});
  if(LV.ps1){const gy=psGround(e);e.gy=e.gy==null?gy:lerp(e.gy,gy,0.35)}
  if(e.st>=20){e.state='move';e.st=0;e.inv=0;e.cd=Math.min(e.cd,rnd(8,26))}return true}
 if(e.dgCD>0)e.dgCD-=ts;
 if(e.state!=='move'||P.state==='dead'||e.frozen>0)return false;
 if(R19.start&&!DG_NO.has(e.t)&&!(e.dgCD>0)){const a=P.atk,rc=(a&&a.reach||2.6)+1.1;
  if(d<rc){const dot=((e.x-P.x)*fwdX(P.yaw)+(e.z-P.z)*fwdZ(P.yaw))/d;if(dot>0.15){let ch=[0.12,0.2,0.3][G.diff]??0.2;if(e.d.boss||e.elite)ch+=0.1;if(e.t==='kama'||e.t==='dog'||e.t==='wraith')ch+=0.08;
   e.dgCD=rnd(40,80);if(ADM.noDodge)ch=0;if(ADM.dodge)ch=1;if(Math.random()<ch){dodgeStart(e);return true}}}}
 // наказание: игрок ест, оглушён или выдохся — бить сразу
 if((P.state==='eat'||P.state==='hurt'||P.st<10)&&d<e.d.range+1.6&&e.cd>8)e.cd=8;
 // не больше 2 (на «Демоне» 3) одновременных атак рядом с игроком — остальные выжидают и обходят
 if(!e.d.boss&&e.cd<=ts+0.01&&d<5&&R19.att>=(G.diff===2?3:2))e.cd=rnd(14,36);
 if(!FL_NO.has(e.t)&&R19.n>1&&d>e.d.range+0.2&&d<6.5){const sd=e.side||(e.side=Math.random()<0.5?-1:1),sp=e.d.spd/60*0.32;e.x+=-(P.z-e.z)/d*sd*sp*ts;e.z+=(P.x-e.x)/d*sd*sp*ts}
 return false}
// ---------- HP: всем мобам больше здоровья (один раз при старте)
let Q19OK=false;function q19Init(){if(Q19OK)return;Q19OK=true;for(const k in ET){const d=ET[k];d.hp=Math.round(d.hp*(d.boss?1.4:1.7))}}
// ---------- онигири: модель в правой руке, процедурная поза «взять у пояса — к губам — 3 укуса — убрать руку»
const ONI={m:null,B:[46,72,98],N:124,o:[0.0,-0.085,0.045,0.9,0,0]};window.__oni=ONI;
function oniMesh(){if(ONI.m!==null)return ONI.m;const L=(ASSET.parts&&ASSET.parts.V8G&&ASSET.parts.V8G.oni)||[];
 if(!L.length){const g=new THREE.ConeGeometry(0.05,0.07,3);g.rotateX(Math.PI/2);ONI.m=new Mesh(g,new MS({color:0xf4f0e6,roughness:0.9}))}
 else{const it=L[0],sm=it.mat||{};ONI.m=new Mesh(it.geo,new MS({map:sm.emissiveMap||sm.map||null,color:0xffffff,roughness:0.85,metalness:0}))}
 ONI.m.castShadow=true;ONI.m.visible=false;ONI.m.name='onigiri';return ONI.m}
const EATP={grab:{c:0.12,tx:0.08,ty:0.12,R:[0.25,0.25,0.32,-0.85,-0.5],L:[-0.3,0.3,0.1,-1.2,-1.5]},
 mouth:{c:0.03,tx:0.0,ty:-0.08,R:[-1.4,1.0,0,-2.6,-1.5],L:[-0.4,0.4,0.15,-1.3,-1.3]},
 chew:{c:0.05,tx:0.02,ty:-0.05,R:[-1.1,0.85,0.05,-2.35,-1.3],L:[-0.4,0.4,0.15,-1.3,-1.3]}};
function eatPose(base){const t=P.t,E=window.__EATP||EATP;if(t<14)return mixPose(base,E.grab,ease(t/14));if(t<36)return mixPose(E.grab,E.mouth,ease((t-14)/22));
 let k=0;for(const b of ONI.B)k=Math.max(k,1-Math.abs(t-b)/11);k=clamp(k,0,1);const p=mixPose(E.chew,E.mouth,t<46?1:ease(k));p.c+=0.05*k;
 if(t<104)return p;return mixPose(p,base,ease((t-104)/20))}
function oniBite(k){const m=oniMesh();m.getWorldPosition(HPB.tmp);const v=HPB.tmp;
 for(let i=0;i<7;i++)FX.norm.add({x:v.x+rnd(-.03,.03),y:v.y+rnd(-.02,.02),z:v.z+rnd(-.03,.03),oy:0,vx:rnd(-.012,.012),vy:rnd(0,.018),vz:rnd(-.012,.012),g:0.0011,life:rnd(30,50),s:rnd(0.008,0.014),r:0.95,gg:0.93,b:0.86,a:0.95,drag:0.98})}
function eatTick(ts,dirY){const s=P;if(dodgeHit()&&!P.air){P.state='idle';P.t=0;startDodge(dirY);return 0}
 let mv=0;if(dirY!=null){P.yaw=turn(P.yaw,dirY,0.08);mv=1.1/60}
 while(P.eatB<3&&P.t>=ONI.B[P.eatB]){const k=P.eatB++,h=[13,13,14][k];if(k===0)P.food=Math.max(0,P.food-1);P.hp=Math.min(P.max,P.hp+h);pop('+'+h,'#ffd98a');if(k!==1)SFX.heal();oniBite(k)}
 if(P.t>=ONI.N){P.state='idle';P.t=0}return mv}
function eatSync(){const m=oniMesh(),h=hero&&hero.arms&&hero.arms.R&&hero.arms.R.hand;if(!h)return;if(m.parent!==h||window.__oniO){if(m.parent!==h)h.add(m);const o=window.__oniO||ONI.o;m.position.set(o[0],o[1],o[2]);m.rotation.set(o[3],o[4],o[5])}
 const on=P.state==='eat'&&P.t>=9&&P.eatB<3;m.visible=on;if(on){const g=Math.min(1,(P.t-9)/5),s=[1,0.74,0.46][P.eatB]||0.46;m.scale.setScalar(g*s)}}
