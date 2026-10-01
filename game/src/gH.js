// ---------- v0.9 «ЗАБЫТЫЙ ДОМ»: усадьба во дворе колокола, ключ Соты, вход, засада, планировка дома, комнаты, ёкаи, тайники, карта (M)
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const HOok=p=>ASSET.ok&&!!(ASSET.parts.HO&&ASSET.parts.HO[p]);
const hmat=n=>ASSET.mats['ho_'+n]||M.wall;
const HDENS={plaster:1.0,hinoki:0.7,cedar:0.8,post:0.9,tatami:0.55,floor:0.6,stone:0.6,snow:0.4,gravel:0.7,redcloth:1.5,gold:3,lacq_black:1,kawara:1};
function uvBox(w,h,d,dn){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,D=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*D[f][0]*dn,uv.getY(k)*D[f][1]*dn)}return g}
// батчер: все боксы одного материала сливаются в один меш
const HB={L:{},add(m,w,h,d,x,y,z,dn){(this.L[m]=this.L[m]||[]).push(uvBox(w,h,d,dn??HDENS[m]??1).translate(x,y,z))},
 flush(g,noCast){for(const k in this.L){const geo=mergeGeometries(this.L[k],false);const ms=new Mesh(geo,hmat(k));ms.castShadow=!(noCast&&noCast.includes(k));ms.receiveShadow=true;g.add(ms)}this.L={}}};
function hp(g,part,x,y,z,ry=0,s=1,pre='HO',mat){const o=new Group();o.position.set(x,y,z);o.rotation.y=ry;if(s.length)o.scale.set(...s);else o.scale.setScalar(s);g.add(o);if(ASSET.ok&&ASSET.parts[pre]&&ASSET.parts[pre][part])o.userData.parts=addPart(o,pre,part,mat?{mat}:{});return o}
const unlit=m=>m&&m.name==='ho_shoji_lit'?hmat('shoji'):m;
// ================================================================ ДВОР С КОЛОКОЛОМ: усадьба вместо дальнего зала
const HX={z:-34,door:-28.95};
function houseExt(g,env){if(ASSET.mats.ho_shoji_lit)ASSET.mats.ho_shoji_lit.emissiveIntensity=0.5;const o=hp(g,'ext',0,0,HX.z);const dL=hp(g,'extdoorL',-0.6,0.62,HX.z+5.05),dR=hp(g,'extdoorR',0.6,0.62,HX.z+5.05);
 const glow=new Mesh(new THREE.PlaneGeometry(2.6,2.8),new MB({map:TX.dot,color:0xffb060,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.position.set(0,2.0,HX.z+5.3);g.add(glow);
 const inner=new Mesh(new THREE.PlaneGeometry(2.4,2.5),new MB({color:0x7a5236}));inner.position.set(0,1.87,HX.z+4.9);inner.visible=false;g.add(inner);
 env.hdoor={L:dL,R:dR,glow,inner,open:0};
 const lm=[[-1.9,3.37,HX.z+7.0],[1.9,3.37,HX.z+7.0]];env.hlamps=lm}
const stepY=z=>z>-26.75?0:z>-27.5?0.24:z>-28.25?0.48:0.62;
function updDuelDoor(){const D=LV.env.hdoor;if(!D)return;D.glow.material.opacity=LV.duelOpen&&!CS.on?0.18+Math.sin(G.frame*0.06)*0.08:CS.on&&CS.k==='door'?D.glow.material.opacity:0;
 D.L.position.x=-0.6-1.2*D.open;D.R.position.x=0.6+1.2*D.open;D.inner.visible=D.open>0.02}
// ключ с тела Соты: поднять, осмотреть, понять, от чего он
function startHouseKeyCS(x,z){const key=itemModel('housekey');scene.add(key);key.position.set(x,0.03,z);key.rotation.set(Math.PI/2,0,0);const hand=new V3();
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.4;SFX.draw(false)}
 const fin=()=>{scene.remove(key);LV.duelOpen=true;addItem('housekey');P.csRx=0;csEnd([['Юки','Дом ждёт. Подойди к двери и нажми X.']]);pop('Получено: '+ITEMS.housekey.n,RAR.q[1])};
 csStart('hkey',t=>{const H=CS.H;CS.bars=Math.min(ek(t,0,18),1-ek(t,600,620));const hf=new V3(fwdX(P.yaw),0,fwdZ(P.yaw)),hr=new V3(hf.z,0,-hf.x);
  if(t===1){const d=Math.hypot(P.x-x,P.z-z)||1;H.to=[x+(P.x-x)/d*0.5,z+(P.z-z)/d*0.5];H.spd=0.032;H.gait=0}
  if(t===60){H.to=null;H.yaw=Math.atan2(x-P.x,z-P.z);H.yawK=0.2}
  if(t<130)cam([P.x+hr.x*2.3+hf.x*1.7,1.25,P.z+hr.z*2.3+hf.z*1.7],[x,0.35,z],0,[0,0,0],[0,0,0]);
  if(t>=60&&t<130){P.csPose=P.csPose||{p:POSE.take,w:0};P.csPose.p=POSE.take;P.csPose.w=ek(t,62,92)}
  if(t>=95){hero.arms.R.hand.getWorldPosition(hand);const k=t<125?ek(t,95,118):1;key.position.lerpVectors(new V3(x,0.03,z),hand,k);key.rotation.set(Math.PI/2*(1-k)+Math.sin(t*0.03)*0.3*k,P.yaw+t*0.01,0.4*k)}
  if(t===96){SFX.soul();flashL(x,0.4,z,0xffd27a,4,20)}
  if(t>=125&&t<330){P.csPose.p=POSE.inspect;P.csPose.w=ek(t,125,160);P.csLook=Math.sin(t*0.02)*0.15;
   cam([P.x+hf.x*1.2+hr.x*0.5,1.6,P.z+hf.z*1.2+hr.z*0.5],[P.x+hf.x*0.3,1.38,P.z+hf.z*0.3],ek(t,125,330),[P.x+hf.x*0.85+hr.x*0.35,1.52,P.z+hf.z*0.85+hr.z*0.35],[P.x+hf.x*0.3,1.4,P.z+hf.z*0.3]);CS.card=t>=150&&t<320?'housekey':null}
  if(t===150)csSay('Акира','Ключ… кованый, тяжёлый. На бородке — родовой мон.',150,270);
  if(t===275)csSay('Акира','Он от того дома впереди. Двери там такие же старые.',275,390);
  if(t===330){H.yaw=Math.atan2(0-P.x,HX.door-P.z);H.yawK=0.05;P.csLook=null}
  if(t>=330&&t<480){P.csPose.w=lerp(P.csPose.w,0.35,0.05);const b=new V3(P.x-fwdX(P.yaw)*2.2+hr.x*0.6,1.85,P.z-fwdZ(P.yaw)*2.2+hr.z*0.6);cam([b.x,b.y,b.z],[0,2.0,HX.door],0)}
  if(t===395)csSay('Акира','Что ты прятал там, Сота?',395,500);
  if(t>=480){const k=ek(t,480,620);cam([1.3,2.0,-11],[0,2.6,HX.door],k,[1.1,2.5,-19.0],[0,2.4,HX.door]);if(t%14===0)flashL(0,1.6,HX.door+0.6,0xffb060,3,24)}
  if(t>=620){CS.card=null;fin()}},()=>{CS.card=null;fin()})}
// дверь: подняться на крыльцо, отпереть, створки разъезжаются, войти
function startDoorCS(){const D=LV.env.hdoor;const key=itemModel('housekey');key.visible=false;scene.add(key);const hand=new V3(),lock=new V3(0.04,1.25,HX.door+0.06);
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.4;SFX.draw(false)}
 const go=()=>{scene.remove(key);const oni=P.oni,mana=P.mana,hp=P.hp;G.subs=[];takeItem('housekey');loadChapter(3);P.oni=oni;P.mana=mana;P.hp=Math.max(hp,P.max*0.6);startHouseArrival()};
 csStart('door',t=>{const H=CS.H;CS.bars=1;
  if(t===1){H.to=[0,-26.5];H.spd=0.03;H.gait=0}
  if(t===50){H.to=[0,-28.45];H.spd=0.02}
  P.y=lerp(P.y,stepY(P.z),0.25);
  if(t<150)cam([3.6,1.5,-22.5],[0,1.5,-28],ek(t,0,150),[2.0,1.9,-25.0],[0,1.7,-29])
  if(t===140){H.to=null;H.yaw=Math.PI;H.yawK=0.2;P.csPose={p:POSE.unlock,w:0}}
  if(t>=140&&t<240){P.csPose.w=ek(t,140,165);hero.arms.R.hand.getWorldPosition(hand);key.visible=true;key.position.lerpVectors(hand,lock,ek(t,165,190));key.rotation.set(Math.PI/2,0,t>=195?ek(t,195,210)*Math.PI/2:0);
   cam([1.7,1.65,-26.0],[0,1.25,HX.door],ek(t,150,240),[1.3,1.55,-26.6],[0,1.25,HX.door])}
  if(t===210){SFX.clang();sparks(lock.x,lock.y,lock.z,18,[1,0.8,0.4]);G.shake=0.06}
  if(t>=225&&P.csPose)P.csPose.w=1-ek(t,225,250);
  if(t>=240){D.open=ek(t,240,300);if(t===242){SFX.bell();key.visible=false}if(t%6===0)flashL(0,1.6,HX.door+0.4,0xffb070,2+D.open*3,14);D.glow.material.opacity=0.12+D.open*0.12;
   cam([1.8,2.0,-24.2],[0,1.6,HX.door-1],ek(t,240,360),[0.9,1.9,-25.6],[0,1.6,HX.door-1])}
  if(t===300){P.csPose=null;H.to=[0,-31];H.spd=0.022}
  CS.fade=ek(t,320,370);if(t>=372)go()},null)}
// ================================================================ ПЛАНИРОВКА ДОМА
const HR=[
 {id:'genkan',n:'Прихожая',x0:-3.5,x1:3.5,z0:-17,z1:-11,h:3.2,fl:'stone',cl:'cedar'},
 {id:'hall',n:'Зал предков',x0:-10,x1:10,z0:-11,z1:5,h:6.8,fl:'floor',cl:'cedar'},
 {id:'study',n:'Кабинет',x0:-20,x1:-10,z0:-11,z1:-3,h:3.2,fl:'tatami',cl:'hinoki'},
 {id:'bed',n:'Спальня',x0:-20,x1:-10,z0:-3,z1:5,h:3.2,fl:'tatami',cl:'hinoki'},
 {id:'store',n:'Кладовая',x0:10,x1:20,z0:-11,z1:-3,h:3.2,fl:'cedar',cl:'cedar'},
 {id:'kitchen',n:'Кухня',x0:10,x1:20,z0:-3,z1:5,h:3.6,fl:'floor',cl:'cedar'},
 {id:'garden',n:'Внутренний сад',x0:-10,x1:10,z0:5,z1:15,h:0,fl:'snow'},
 {id:'dojo',n:'Додзё',x0:-10,x1:10,z0:15,z1:25,h:5,fl:'hinoki',cl:'cedar'}];
// стены: [ось, координата, от, до, высота, проёмы[[a,b,тип]]]
const HW=[
 ['z',-17,-3.5,3.5,3.2,[[-1.3,1.3,'door']]],['z',-11,-20,-10,3.2,[]],['z',-11,-10,10,6.8,[[1,3]]],['z',-11,10,20,3.2,[]],
 ['z',-3,-20,-10,3.2,[[-16,-14]]],['z',-3,10,20,3.6,[[14,16]]],['z',5,-20,-10,3.2,[]],['z',5,-10,10,6.8,[[-1.5,1.5]]],['z',5,10,20,3.6,[]],
 ['z',15,-10,10,5,[[-1.5,1.5,'gate']]],['z',25,-10,10,5,[[-1.3,1.3,'exit']]],
 ['x',-3.5,-17,-11,3.2,[]],['x',3.5,-17,-11,3.2,[]],['x',-20,-11,5,3.2,[]],['x',20,-11,5,3.6,[]],
 ['x',-10,-11,5,6.8,[[-8,-6],[0,2]]],['x',10,-11,5,6.8,[[-8,-6],[0,2]]],['x',-10,5,15,3.2,[]],['x',10,5,15,3.2,[]],['x',-10,15,25,5,[]],['x',10,15,25,5,[]]];
// комнатные волны: [тип, x, z, доп]
const HWAVES={
 hall:{en:[['musha',0,0,'case1'],['musha',0,0,'case2'],['chochin',-3,-1],['chochin',3,1.5]],say:[['Юки','Доспехи в витринах… они пустые — и всё же встают!']]},
 study:{en:[['moku',-15,-10.84,0],['chochin',-13,-6],['chochin',-17,-5],['chochin',-15,-8.5]],say:[['Юки','Сёдзи смотрят на тебя. Бей глаза — и береги спину!']]},
 bed:{en:[['musha',-17.5,2.5],['musha',-12.5,-1.5],['chochin',-15,0.5]],say:[['Акира','Здесь кто-то спал… давно.']]},
 store:{en:[['chochin',13,-9],['chochin',17,-9.5],['chochin',15,-5],['musha',18,-6]],say:[['Юки','Фонари! Они прыгают — уворачивайся вбок.']]},
 kitchen:{en:[['moku',19.84,-1.2,-Math.PI/2],['chochin',12,-1],['chochin',16,3],['chochin',13,3.5],['chochin',17,-1.5]],say:[['Юки','Очаг ещё тёплый… и стена открыла глаза.']]},
 garden:{en:[['musha',-5,11],['musha',5,12],['chochin',-2,13],['chochin',2,8.5],['moku',9.84,7.6,-Math.PI/2]],say:[['Юки','Снег в доме… это сад. Двери в додзё держат кости — очисти сад.']]},
 dojo:{boss:true,en:[['shogun',0,22]],say:[['Кагэмару','Ты принёс в этот дом кровь его сына.'],['Акира','Я пришёл за правдой. Отойди.'],['Кагэмару','Правда спит под этим полом. Ложись рядом с ней!']]}};
// сундуки дома: x, z, yaw, комната, скрытый
const HCH=[[-8.8,-10.25,0,'hall'],[17.6,-10.35,0,'store'],[11.3,4.3,Math.PI,'kitchen'],[-7,24.0,Math.PI,'dojo'],
 [-19.35,-7,Math.PI/2,'study','shelf'],[-17.5,-1.2,Math.PI/2,'bed','tatami'],[8.0,13.6,Math.PI,'garden','snow']];
CHESTS.house=HCH.map(c=>[c[0],c[1],c[2]]);
const roomAt=(x,z,ins=0)=>HR.find(r=>x>r.x0+ins&&x<r.x1-ins&&z>r.z0+ins&&z<r.z1-ins)||null;
function wallPush(o,r){const W=LV.walls;if(!W)return;for(const w of W){if(w.off)continue;const cx=clamp(o.x,w.x0,w.x1),cz=clamp(o.z,w.z0,w.z1),dx=o.x-cx,dz=o.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;
 if(d2>1e-8){const d=Math.sqrt(d2);o.x=cx+dx/d*r;o.z=cz+dz/d*r}else{const a=o.x-w.x0,b=w.x1-o.x,c=o.z-w.z0,e=w.z1-o.z,m=Math.min(a,b,c,e);if(m===a)o.x=w.x0-r;else if(m===b)o.x=w.x1+r;else if(m===c)o.z=w.z0-r;else o.z=w.z1+r}}}
function inWall(x,z,pad=0){const W=LV.walls;if(!W)return false;for(const w of W)if(!w.off&&w.cam!==false&&x>w.x0-pad&&x<w.x1+pad&&z>w.z0-pad&&z<w.z1+pad)return true;return false}
// камера не проходит сквозь стены и потолок
function camClip(T,C){const W=LV.walls;if(!W)return;let tm=1;const dx=C.x-T.x,dz=C.z-T.z;
 for(const w of W){if(w.off||w.cam===false)continue;const e=0.2;let t0=-1e9,t1=1e9,miss=false;
  for(const [o,d,a,b] of[[T.x,dx,w.x0-e,w.x1+e],[T.z,dz,w.z0-e,w.z1+e]]){if(Math.abs(d)<1e-6){if(o<a||o>b){miss=true;break}}else{let u=(a-o)/d,v=(b-o)/d;if(u>v){const q=u;u=v;v=q}t0=Math.max(t0,u);t1=Math.min(t1,v)}}
  if(!miss&&t0<=t1&&t0>0.02&&t0<tm)tm=t0}
 const k=Math.max(0.14,tm-0.03),pk=G.camK??1;G.camK=k<pk?k:lerp(pk,k,0.07);C.x=T.x+dx*G.camK;C.z=T.z+dz*G.camK;C.y=T.y+(C.y-T.y)*Math.max(G.camK,0.45)+(1-G.camK)*0.55;
 const r=roomAt(C.x,C.z)||roomAt(T.x,T.z);if(r&&r.h)C.y=Math.min(C.y,r.h-0.3)}
// ---------- постройка
function buildHouseEnv(g,env){const sn=ASSET.mats.ho_snow;if(sn&&!sn.userData.tw){sn.userData.tw=1;sn.map=null;sn.color.set(0xdfe7f0);if(sn.normalScale)sn.normalScale.set(0.6,0.6);sn.roughness=0.95;sn.needsUpdate=true}const H=env.H={walls:[],open:[],lamps:[],spots:[],cases:[],koi:[],drifts:[],shelf:null,tatami:null,ext:null};const W=env.walls=H.walls;const T=0.2;
 const col=(x0,x1,z0,z1,o={})=>{const w=Object.assign({x0,x1,z0,z1},o);W.push(w);return w};
 const lamp=(x,y,z,c=0xffa860,i=2.6,d=9)=>H.lamps.push([x,y,z,c,i,d]);
 // ---- стены
 for(const [ax,c,a,b,h,ops] of HW){const segs=[];let s=a;for(const o of ops.slice().sort((p,q)=>p[0]-q[0])){segs.push([s,o[0]]);s=o[1]}segs.push([s,b]);
  const put=(m,u0,u1,y0,y1,th)=>{const L=u1-u0,mid=(u0+u1)/2,hh=y1-y0;if(L<=0.001||hh<=0.001)return;if(ax==='z')HB.add(m,L,hh,th,mid,(y0+y1)/2,c);else HB.add(m,th,hh,L,c,(y0+y1)/2,mid)};
  for(const [u0,u1] of segs){if(u1-u0<0.01)continue;put('hinoki',u0,u1,0,0.9,T+0.03);put('plaster',u0,u1,0.9,h,T);put('post',u0,u1,2.15,2.27,T+0.07);put('post',u0,u1,h-0.14,h,T+0.08);
   const n=Math.max(1,Math.round((u1-u0)/1.82));for(let k=0;k<=n;k++){const u=u0+(u1-u0)*k/n;put('post',u-0.1,u+0.1,0,h,T+0.08)}
   if(ax==='z')col(u0,u1,c-T/2,c+T/2);else col(c-T/2,c+T/2,u0,u1)}
  for(const o of ops){put('plaster',o[0],o[1],2.27,h,T);put('post',o[0],o[1],2.15,2.27,T+0.1);put('post',o[0]-0.06,o[0]+0.06,0,2.2,T+0.12);put('post',o[1]-0.06,o[1]+0.06,0,2.2,T+0.12);put('lacq_black',o[0],o[1],0,0.03,T+0.04);
   const cx=ax==='z'?(o[0]+o[1])/2:c,cz=ax==='z'?c:(o[0]+o[1])/2,wd=o[1]-o[0];
   const w=ax==='z'?col(o[0],o[1],c-0.12,c+0.12,{off:true}):col(c-0.12,c+0.12,o[0],o[1],{off:true});
   const op={ax,c,a:o[0],b:o[1],cx,cz,type:o[2]||'',w,k:0,want:0,rooms:[roomAt(cx+(ax==='x'?-0.6:0),cz+(ax==='z'?-0.6:0)),roomAt(cx+(ax==='x'?0.6:0),cz+(ax==='z'?0.6:0))].filter(Boolean).map(r=>r.id)};
   if(op.type==='door'||op.type==='exit'){w.off=false;const dz=op.type==='door'?0.13:-0.13;op.dL=hp(g,'extdoorL',cx-0.6,0,cz+dz,0,[1.05,0.9,1],'HO',unlit);op.dR=hp(g,'extdoorR',cx+0.6,0,cz+dz,0,[1.05,0.9,1],'HO',unlit);op.open=0}
   else{op.bars=hp(g,'bars',cx,0,cz,ax==='z'?0:Math.PI/2,[wd/1.8,1,1]);op.bars.visible=false;if(op.type==='gate'){op.want=1;op.k=1;w.off=false;op.bars.visible=true}}
   H.open.push(op)}}
 // ---- полы и потолки
 for(const r of HR){const w=r.x1-r.x0,d=r.z1-r.z0,cx=(r.x0+r.x1)/2,cz=(r.z0+r.z1)/2;HB.add(r.fl,w,0.04,d,cx,-0.02,cz);
  if(r.fl==='tatami'){for(let x=r.x0;x<=r.x1+0.01;x+=1.82)HB.add('lacq_black',0.035,0.006,d,x,0.003,cz,1);for(let z=r.z0;z<=r.z1+0.01;z+=0.91)HB.add('lacq_black',w,0.006,0.035,cx,0.003,z,1)}
  if(r.h){HB.add(r.cl,w,0.06,d,cx,r.h+0.03,cz);for(let x=r.x0+1.82;x<r.x1-0.1;x+=1.82)HB.add('post',0.09,0.1,d,x,r.h-0.05,cz);for(let z=r.z0+1.82;z<r.z1-0.1;z+=1.82)HB.add('post',w,0.1,0.09,cx,r.h-0.05,z);
   HB.add('kawara',w+0.4,0.2,d+0.4,cx,r.h+0.2,cz)}}
 // ---- ПРИХОЖАЯ
 HB.add('hinoki',7,0.05,2.6,0,0.025,-12.3);HB.add('post',7,0.12,0.14,0,0.06,-13.6);
 hp(g,'tansu',-3.1,0,-12.6,Math.PI/2);col(-3.4,-2.85,-13.25,-11.95,{cam:false});hp(g,'tansu',-3.1,0,-14.0,Math.PI/2);col(-3.4,-2.85,-14.65,-13.35,{cam:false});
 hp(g,'byobu',2.9,0,-15.2,-Math.PI/2,0.85);hp(g,'andon',2.9,0,-12.4);lamp(2.9,0.7,-12.4,0xffa050,2.2,8);
 hp(g,'tokonoma',-1.25,0,-11.48,Math.PI);col(-2.15,-0.35,-11.85,-11.1,{cam:false});hp(g,'pendant',-1.9,3.2,-13.2);lamp(-1.9,1.9,-13.2,0xffb070,2.8,9);
 // ---- ЗАЛ ПРЕДКОВ: галерея, лестницы, витрины доспехов, драпировки
 HB.add('floor',20,0.14,2.5,0,3.38,-9.75);HB.add('post',20,0.28,0.24,0,3.3,-8.5);
 for(const x of[-3.2,3.2,-9.2,9.2]){HB.add('post',0.26,3.3,0.26,x,1.65,-8.5);col(x-0.15,x+0.15,-8.65,-8.35,{cam:false})}
 for(const sx of[-1,1]){hp(g,'stairs',sx*6.5,0,-4.25);col(sx*6.5-0.85,sx*6.5+0.85,-8.45,-4.1,{cam:false})}
 for(const [x,s] of[[-2,1],[2,1],[-4.8,0.4],[4.8,0.4],[-8.6,0.6],[8.6,0.6]])hp(g,'rail',x,3.45,-8.45,0,[s,1,1]);
 for(const x of[-8,-4,0,4,8])hp(g,'drape',x,3.18,-8.36);
 for(let x=-9.45;x<9.6;x+=0.92)hp(g,'fusuma',x,3.45,-10.86);
 for(const x of[-8.6,-4.6,-0.6,3.4,7.4])hp(g,'ramma',x+0.92,5.5,-10.86);
 for(const sx of[-1,1])for(const z of[-6.5,-1.2,3.2]){HB.add('redcloth',0.04,3.0,1.3,sx*9.86,5.0,z);HB.add('gold',0.05,0.08,1.4,sx*9.85,6.52,z);HB.add('gold',0.05,0.05,1.3,sx*9.85,3.55,z)}
 const cs=[[-9.35,-3.9,Math.PI/2],[-9.35,3.3,Math.PI/2,'case1'],[9.35,-3.9,-Math.PI/2,'case2'],[9.35,3.3,-Math.PI/2]];
 for(const [x,z,ry,tag] of cs){const o=hp(g,'armorcase',x,0,z,ry);col(x-0.55,x+0.55,z-0.55,z+0.55,{cam:false});
  const glass=(o.userData.parts?o.userData.parts.all:[]).filter(m=>m.material&&m.material.name==='ho_glass');
  const rig=makeHuman({set:'MU',scale:0.98,pants:M.sotaK,pants2:M.sotaK,kimono:M.sotaK,vest:M.sotaV,skin:M.sotaSkin,cape:null,tsR:M.sotaA,tsL:M.sotaA,armor:M.sotaA,obi:M.sotaA,eyes:true,horns:false,len:{R:0.9,L:0.86}});
  rig.arms.L.sw.visible=false;rig.arms.R.sw.visible=false;rig.root.position.set(x,0.5,z);rig.root.rotation.y=ry;g.add(rig.root);applyPose(rig,POSE.sheath,0,0,0,{});rig.root.traverse(m=>{if(m.isMesh)m.castShadow=true});
  H.cases.push({x,z,ry,tag,glass,rig,o});lamp(x+Math.sin(ry)*0.6,2.3,z+Math.cos(ry)*0.6,0xffd8a0,1.6,5)}
 for(const sx of[-1,1]){hp(g,'byobu',sx*6.6,0,4.55,Math.PI,1);hp(g,'nobori',sx*3.2,0,4.4,Math.PI);hp(g,'andon',sx*8.9,0,4.2);hp(g,'andon',sx*8.9,0,-7.6)}
 hp(g,'kamidana',0,3.7,4.72,Math.PI);
 for(const [x,z] of[[-4.5,-2],[4.5,-2],[-4.5,2.5],[4.5,2.5],[0,0.2]]){hp(g,'pendant',x,4.9,z);HB.add('ink',0.015,1.9,0.015,x,5.85,z);lamp(x,3.4,z,0xffb070,3.2,11)}
 for(const sx of[-1,1])for(let x=sx*2.1;Math.abs(x)<9.3;x+=sx*0.92){hp(g,'shoji',x,0,4.86);hp(g,'shojil',x,0,5.14,Math.PI)}
 lamp(0,2.6,-9.6,0xff9a50,1.8,7);
 // ---- КАБИНЕТ: стол с картой, шкафы (за одним — тайник), мокумокурэн на стене
 hp(g,'desk',-15,0,-8.4,0);col(-15.62,-14.38,-8.72,-8.08,{cam:false});hp(g,'zabuton',-15,0,-7.6);
 const map=itemModel('map');map.position.set(-15.05,0.355,-8.42);map.rotation.y=0.3;g.add(map);H.mapObj=map;
 H.spots.push({k:'map',x:-15,z:-7.55,r:1.3,label:'X — взять: план дома'});
 const sh=hp(g,'shelf',-19.78,0,-7,Math.PI/2);H.shelf={o:sh,w:col(-20,-19.55,-7.95,-6.05,{cam:false}),z0:-7};
 H.spots.push({k:'shelf',x:-19.0,z:-7,r:1.3,label:'X — осмотреть книжный шкаф: из-за него тянет холодом',ch:4});
 hp(g,'shelf',-19.78,0,-9.6,Math.PI/2);col(-20,-19.55,-10.55,-8.65,{cam:false});hp(g,'shelf',-19.78,0,-4.4,Math.PI/2);col(-20,-19.55,-5.35,-3.45,{cam:false});
 hp(g,'tokonoma',-11.6,0,-3.45,Math.PI);col(-12.5,-10.7,-3.85,-3.1,{cam:false});hp(g,'byobu',-11.3,0,-9.9,-Math.PI/2*0.6,0.8);
 hp(g,'andon',-13.9,0,-8.9);lamp(-13.9,0.7,-8.9,0xffa050,2.4,8);hp(g,'pendant',-15,3.2,-6.5);lamp(-15,1.9,-6.5,0xffb070,2.2,8);
 // ---- СПАЛЬНЯ: футоны, ширма, зеркало, тайник под татами
 for(const x of[-16.8,-15.4])hp(g,'futon',x,0,1.7);col(-17.4,-14.8,0.7,2.7,{cam:false});
 hp(g,'byobu',-11.6,0,3.6,-2.4,0.9);hp(g,'kyodai',-19.6,0,-2.2,Math.PI/2);hp(g,'tansu',-19.7,0,3.4,Math.PI/2);col(-20,-19.4,2.75,4.05,{cam:false});
 hp(g,'andon',-13.6,0,4.2);lamp(-13.6,0.7,4.2,0xffa050,2.2,8);hp(g,'pendant',-15,3.2,0);lamp(-15,1.9,0,0xffb070,2,8);
 {const tt=new Mesh(uvBox(0.9,0.05,1.8,0.55),hmat('tatami'));tt.position.set(-17.5,0.03,-1.2);tt.rotation.z=0.025;tt.castShadow=true;tt.receiveShadow=true;g.add(tt);H.tatami=tt;
  const hr=new Mesh(uvBox(0.94,0.055,0.04,1),hmat('lacq_black'));hr.position.set(0,0,0.9);tt.add(hr);const hr2=hr.clone();hr2.position.z=-0.9;tt.add(hr2)}
 H.spots.push({k:'tatami',x:-16.6,z:-1.2,r:1.3,label:'X — приподнять татами: оно лежит неровно',ch:5});
 // ---- КЛАДОВАЯ
 for(const [x,z] of[[11.0,-10.4],[11.0,-9.75],[11.62,-10.4],[13.3,-10.5],[19.3,-3.8],[19.3,-4.45],[18.65,-3.8]])hp(g,'crate',x,0,z,rnd(-0.1,0.1));
 col(10.6,12.0,-10.8,-9.4,{cam:false});col(12.95,13.65,-10.85,-10.15,{cam:false});col(18.3,19.7,-4.85,-3.4,{cam:false});
 {const o=hp(g,'crate',11.0,0.6,-10.4,0.2)}
 for(const [x,z] of[[15.2,-10.5],[15.85,-10.5],[15.5,-10.5]]){const o=hp(g,'tawara',x,z===-10.5&&x===15.5?0.45:0,z,Math.PI/2)}col(14.8,16.3,-10.85,-10.1,{cam:false});
 hp(g,'yari',19.84,0,-7,-Math.PI/2);hp(g,'rack',19.75,0.9,-8.9,-Math.PI/2);hp(g,'rack',19.75,0.9,-5.2,-Math.PI/2);
 hp(g,'lantern',15,2.6,-7);HB.add('ink',0.012,0.35,0.012,15,3.0,-7);lamp(15,2.3,-7,0xffa860,2.4,9);
 // ---- КУХНЯ
 HB.add('gravel',4.6,0.03,7.6,17.6,0.0,1,0.7);hp(g,'kamado',19.45,0,1.2,-Math.PI/2);col(19.0,20,0.3,2.1,{cam:false});addFire(g,18.95,0.15,0.75,0.35,99);addFire(g,18.95,0.15,1.65,0.35,99);
 hp(g,'irori',13.6,0,0.6);col(13.0,14.2,0,1.2,{cam:false});addFire(g,13.6,0.02,0.6,0.5,99);lamp(13.6,0.8,0.6,0xff7a30,3.2,9);lamp(19,0.8,1.2,0xff6a20,2.2,6);
 for(const x of[11.3,12.1])hp(g,'zabuton',x,0,1.6);hp(g,'tansu',10.5,0,-2.3,Math.PI/2);hp(g,'shelf',14.5,0,4.78,Math.PI);col(13.55,15.45,4.5,4.9,{cam:false});
 hp(g,'tawara',18.5,0,4.4,0.2);hp(g,'tawara',17.8,0,4.5,-0.1);
 // ---- ВНУТРЕННИЙ САД: снег, дерево, пруд с кои, фонари, карнизы, сугроб-тайник
 HB.add('gravel',2.6,0.03,10,0,0.0,10,0.7);for(let z=6;z<15;z+=1.1)HB.add('stone',0.9,0.06,0.55,(z*7%3-1)*0.15,0.02,z,0.8);
 hp(g,'tree',-5,0,10.2);col(-5.35,-4.65,9.85,10.55);hp(g,'pond',4.6,0,9.4);col(2.3,6.9,7.6,11.5,{cam:false});
 for(let i=0;i<5;i++){const k=hp(g,'koi',4.6,0.04,9.4);k.userData.ph=i*1.3;k.userData.r=0.6+i*0.22;H.koi.push(k)}
 stoneLantern(g,-1.9,7.0,true);stoneLantern(g,1.9,13.3,true);stoneLantern(g,-8.2,13.6,true);lamp(-1.9,1.0,7.0,0xffa050,2.4,8);lamp(1.9,1.0,13.3,0xffa050,2.4,8);lamp(-8.2,1,13.6,0xffa050,2,7);
 for(const sx of[-1,1])for(const z of[7.2,11.3])hp(g,'eave',sx*10,0,z,-sx*Math.PI/2);
 for(const x of[-8,-4,4,8])hp(g,'eave',x,1.8,15,Math.PI);for(const x of[-8,-4,4,8])hp(g,'eave',x,3.6,5,0);
 const sm=hmat('snow');for(let i=0;i<14;i++){const a=i/14;const x=i%2?rnd(-9.4,-6):rnd(6,9.4),z=rnd(5.6,14.4);if(Math.hypot(x-8,z-13.6)<1.4)continue;const d=new Mesh(new THREE.SphereGeometry(rnd(0.5,1.0),10,6,0,6.283,0,1.57),sm);d.scale.y=0.35;d.position.set(x,0,z);d.receiveShadow=true;g.add(d)}
 {const d=new Mesh(new THREE.SphereGeometry(1.0,14,8,0,6.283,0,1.57),sm);d.scale.set(1.15,0.55,0.9);d.position.set(8.0,0,13.6);d.receiveShadow=true;d.castShadow=true;g.add(d);H.drift=d}
 H.spots.push({k:'snow',x:8.0,z:12.4,r:1.4,label:'X — разгрести сугроб: под снегом что-то блестит',ch:6});
 // ---- ДОДЗЁ
 for(const sx of[-1,1]){hp(g,'yari',sx*9.84,0,18.5,-sx*Math.PI/2);hp(g,'rack',sx*9.75,0.9,21.5,-sx*Math.PI/2);hp(g,'nobori',sx*8.5,0,24.4,Math.PI);hp(g,'lantern',sx*6,3.6,19);hp(g,'lantern',sx*6,3.6,23);lamp(sx*6,3.3,19,0xffa860,2.6,10);lamp(sx*6,3.3,23,0xffa860,2.6,10)}
 hp(g,'kamidana',0,3.4,24.72,Math.PI);for(const x of[-4.5,4.5])hp(g,'tokonoma',x,0,24.55,Math.PI);col(-5.4,-3.6,24.2,24.9,{cam:false});col(3.6,5.4,24.2,24.9,{cam:false});
 HB.flush(g,['kawara']);
 env.mirrors=[];return H}
// ---------- загрузка главы «Забытый дом»
function houseLoad(cp){const H=LV.H;H.cur=null;H.fight=null;H.queue=[];H.lampT=0;LV.active=false;
 G.hcleared=G.hcleared||new Set();G.hreveal=G.hreveal||new Set();G.hseen=G.hseen||new Set();
 // сундуки: комнаты и тайники
 LV.chests.forEach((c,i)=>{const d=HCH[i];c.room=d[3];c.hide=d[4]||null;if(c.hide&&!G.hreveal.has(c.hide)&&c.state!=='open'){c.state='hidden';c.g.visible=false}else if(c.state!=='open'&&G.hcleared.has(c.room))c.state='locked';if(c.state==='locked'||c.state==='open')c.seal.visible=false});
 for(const s of H.spots){if(s.k==='map'&&G.hasMap){s.done=true;H.mapObj.visible=false}if(s.ch!=null&&G.hreveal.has(s.k)){s.done=true;revealPose(s.k,1)}}
 for(const c of H.cases)if(c.tag&&G.hcleared.has('hall')){c.rig.root.visible=false;for(const m of c.glass)m.visible=false}
 for(const op of H.open)if(op.type==='gate'&&G.hcleared.has('garden')){op.want=0;op.k=0;op.w.off=true;op.bars.visible=false}
 if(G.hcleared.has('dojo')){const ex=H.open.find(o=>o.type==='exit');ex.w.off=true}
 if(!G.ambushDone){const e=mkEnemy('musha',-0.7,-9.9);e.state='csIdle';e.yaw=Math.PI/2;enemies.push(e);H.ambushE=e}
 LV.env.mirrors.forEach((m,i)=>{if(G.cp&&G.cp.chap===3&&i<=(G.cp.mi||0))activateMirror(m,true)})}
function revealPose(k,v){const H=LV.H;if(k==='shelf'){H.shelf.o.position.z=H.shelf.z0+1.9*v;H.shelf.w.z0=-7.95+1.9*v;H.shelf.w.z1=-6.05+1.9*v}
 else if(k==='tatami'){H.tatami.position.x=-17.5+0.95*v;H.tatami.rotation.z=0.025+v*0.35;H.tatami.position.y=0.03+v*0.18}
 else if(k==='snow'){H.drift.scale.set(1.15*(1-v*0.9),Math.max(0.02,0.55*(1-v)),0.9*(1-v*0.9))}}
function assignLamps(){const L=LV.H.lamps,px=P.x,pz=P.z;const s=L.map(l=>[l,Math.hypot(l[0]-px,l[2]-pz)-l[4]*0.4]).sort((a,b)=>a[1]-b[1]);
 STATIC.forEach((l,i)=>{const q=s[i]&&s[i][0];if(!q){l.intensity=0;l.userData.base=0;return}l.position.set(q[0],q[1],q[2]);l.color.set(q[3]);l.distance=q[5];l.userData.base=q[4]})}
function saveHouseCP(mi){G.cp={chap:3,wave:0,mi,oni:P.oni}}
// ---------- комнатные бои
function setBars(id,on){for(const op of LV.H.open){if(op.type==='door'||op.type==='exit')continue;if(!op.rooms.includes(id))continue;if(op.type==='gate'&&!G.hcleared.has('garden')){continue}op.want=on?1:0}}
function startRoomFight(r){const H=LV.H,Wv=HWAVES[r.id];H.fight=r.id;LV.active=true;setBars(r.id,true);for(const s of Wv.say||[])say(s[0],s[1]);SFX.taiko(1.3);SFX.clang();
 Wv.en.forEach((q,i)=>H.queue.push({q,at:G.frame+30+i*28}))}
function spawnHouseEnemy(q){const [t,x0,z0,a]=q;let x=x0,z=z0,e;
 if(typeof a==='string'&&a.startsWith('case')){const c=LV.H.cases.find(c=>c.tag===a);x=c.x+Math.sin(c.ry)*0.95;z=c.z+Math.cos(c.ry)*0.95;for(const m of c.glass)m.visible=false;c.rig.root.visible=false;
  for(let i=0;i<60;i++)FX.add.add({x:c.x+rnd(-0.5,0.5),y:rnd(0.6,2.4),z:c.z+rnd(-0.5,0.5),vx:Math.sin(c.ry)*rnd(0.01,0.05)+rnd(-.02,.02),vy:rnd(0,0.03),vz:Math.cos(c.ry)*rnd(0.01,0.05)+rnd(-.02,.02),g:0.003,life:rnd(30,60),s:rnd(0.02,0.05),r:1.4,gg:1.6,b:1.9,a:0.8});
  SFX.clang();SFX.hit();flashL(c.x,1.5,c.z,0x80c0ff,6,20);e=mkEnemy(t,x,z);e.yaw=c.ry}
 else{e=mkEnemy(t,x,z);if(t==='chochin'){e.y=2.4;e.vy=-0.01}if(t==='moku'){e.yaw=a;e.hx=x;e.hz=z}
  for(let i=0;i<26;i++)FX.add.add({x:x+rnd(-.4,.4),y:rnd(0.1,1.8),z:z+rnd(-.4,.4),vx:0,vy:rnd(0.005,0.02),vz:0,life:rnd(30,60),s:rnd(0.05,0.1),r:0.5,gg:1.0,b:1.8,a:0.6});flashL(x,1.2,z,t==='moku'?0xb050ff:0x7ab0ff,5,18);SFX.grab()}
 if(e.d.boss){G.bossBar=e;SFX.bell()}enemies.push(e)}
function endRoomFight(){const H=LV.H,id=H.fight;H.fight=null;LV.active=false;G.hcleared.add(id);setBars(id,false);SFX.bell();pop(HR.find(r=>r.id===id).n+' — очищено','#cfc6b0');
 let n=0;for(const c of LV.chests){if(c.room!==id||c.state==='open')continue;n++;if(c.state==='sealed'){c.state='locked';c.burn=1}}
 const lack=n;if(n)pop('Печати о-фуда сгорели','#ffd27a');for(let i=0;i<lack;i++)spawnWI('key',P.x+rnd(-1,1),1.5,P.z+rnd(-1,1),rnd(-0.02,0.02),0.06,rnd(-0.02,0.02));
 if(id==='garden'){for(const op of H.open)if(op.type==='gate'){op.want=0}say('Юки','Кости у дверей додзё рассыпались. Там — хозяин дома.')}
 if(id==='hall'&&!G.hasMap)say('Юки','Слева — кабинет. Если в доме есть план, он там.');
 const mi=LV.env.mirrors.reduce((b,m,i)=>m.act?i:b,0);saveHouseCP(mi)}
function updHouse(ts){const H=LV.H;
 if(G.frame%10===0)assignLamps();
 for(const [i,m] of LV.env.mirrors.entries())if(!m.act&&Math.hypot(P.x-m.x,P.z-m.z)<1.8){activateMirror(m);saveHouseCP(i)}
 if(!G.ambushDone&&!CS.on&&P.state!=='dead'&&P.z>-11.75&&P.x>0.4&&P.x<3.6){startAmbushCS();return}
 const r=roomAt(P.x,P.z,0.3);if(r&&r.id!==H.cur){H.cur=r.id;if(!G.hseen.has(r.id)){G.hseen.add(r.id);if(r.id!=='genkan')pop(r.n,'#e6c98a')}}
 if(!H.fight&&G.ambushDone){const r2=roomAt(P.x,P.z,1.3);if(r2&&HWAVES[r2.id]&&!G.hcleared.has(r2.id))startRoomFight(r2)}
 for(let i=H.queue.length-1;i>=0;i--)if(G.frame>=H.queue[i].at){spawnHouseEnemy(H.queue[i].q);H.queue.splice(i,1)}
 if(H.fight){if(G.frame%30===0)SFX.taiko(G.frame%120===0?1:0.55);if(!H.queue.length&&!enemies.some(e=>!e.dead))endRoomFight()}
 for(const op of H.open){if(op.bars){op.k=lerp(op.k,op.want,0.12);if(Math.abs(op.k-op.want)<0.01)op.k=op.want;op.bars.visible=op.k>0.01;op.bars.position.y=(op.k-1)*2.3;op.w.off=op.k<0.5;if(op.want&&op.k<0.95&&G.frame%3===0)dust(op.cx,op.cz,1)}
  if(op.dL){op.dL.position[op.ax==='z'?'x':'z']=(op.ax==='z'?op.cx:op.cz)-0.6-1.15*op.open;op.dR.position[op.ax==='z'?'x':'z']=(op.ax==='z'?op.cx:op.cz)+0.6+1.15*op.open}}
 for(const k of H.koi){const u=k.userData,a=G.frame*0.008*(1+u.r*0.3)+u.ph;k.position.set(4.6+Math.cos(a)*u.r*1.5,0.05,9.4+Math.sin(a)*u.r);k.rotation.y=-a+Math.PI}
 // снег над садом, пылинки у ламп
 if(G.frame%2===0&&P.z>-2)FX.norm.add({x:rnd(-9.8,9.8),y:rnd(6,8),z:rnd(5.2,14.8),vx:0,vy:-rnd(0.35,0.6)/60,vz:0,life:rnd(500,800),s:rnd(0.03,0.05),r:0.85,gg:0.88,b:0.95,a:0.85,sw:rnd(0,6),w:0.5,g:0.00001,stick:true});
 if(G.frame%9===0){const l=H.lamps[(Math.random()*H.lamps.length)|0];if(Math.hypot(l[0]-P.x,l[2]-P.z)<9)FX.add.add({x:l[0]+rnd(-1,1),y:l[1]+rnd(-0.8,0.6),z:l[2]+rnd(-1,1),vx:rnd(-.1,.1)/60,vy:rnd(-.05,.08)/60,vz:rnd(-.1,.1)/60,life:rnd(120,220),s:0.02,r:1.6,gg:1.2,b:0.7,a:0.5,pulse:rnd(0,6),fade:false})}
 // тайники «дышат»: сквозняк, блеск
 for(const s of H.spots){if(s.done||s.ch==null)continue;if(G.frame%14===0&&Math.hypot(s.x-P.x,s.z-P.z)<7)FX.add.add({x:s.x+rnd(-0.4,0.4),y:rnd(0.1,1.2),z:s.z+rnd(-0.4,0.4),vx:rnd(-.1,.1)/60,vy:rnd(0.05,0.2)/60,vz:rnd(-.1,.1)/60,life:90,s:0.025,r:1.2,gg:0.8,b:1.8,a:0.5})}
 if(H.reveal){const R=H.reveal;R.t+=ts;const v=ease(Math.min(1,R.t/80));revealPose(R.k,v);if(R.t%6<1)dust(R.x,R.z,1);if(R.t>=80){H.reveal=null;const c=LV.chests[R.ch];c.g.visible=true;c.state=G.hcleared.has(c.room)?'locked':'sealed';c.seal.visible=c.state==='sealed';sparks(c.x,0.5,c.z,40,[0.8,0.5,1]);flashL(c.x,0.8,c.z,0xb080ff,6,30);SFX.bell();pop('Тайник найден!','#c9a0ff');if(c.state==='locked'&&!invCount('key')&&!WI.some(o=>o.id==='key'))spawnWI('key',c.x+Math.sin(c.yaw)*1.0,0.8,c.z+Math.cos(c.yaw)*1.0)}
  else{const c=LV.chests[R.ch];if(R.k!=='shelf'){c.g.visible=v>0.4;c.g.position.y=-0.6*(1-v)}}}}
function houseSpot(s){const H=LV.H;if(s.k==='map'){startMapCS(s);return}if(s.k==='exit'){startExitCS();return}
 if(s.ch!=null){if(H.reveal)return;s.done=true;G.hreveal.add(s.k);const c=LV.chests[s.ch];H.reveal={k:s.k,t:0,ch:s.ch,x:s.x,z:s.z};c.g.position.y=s.k==='shelf'?0:-0.6;SFX.grab();if(s.k==='snow')for(let i=0;i<40;i++)FX.norm.add({x:c.x+rnd(-1,1),y:rnd(0.1,0.6),z:c.z+rnd(-1,1),vx:rnd(-1,1)/60,vy:rnd(0.5,1.5)/60,vz:rnd(-1,1)/60,life:rnd(40,80),s:rnd(0.04,0.08),r:0.9,gg:0.9,b:1,a:0.8,g:0.0002})}}
// ================================================================ КАТСЦЕНЫ ДОМА
function startHouseArrival(){const H=LV.H;const dr=H.open.find(o=>o.type==='door');dr.open=1;P.drawn=false;P.yaw=0;P.x=0;P.z=-14.6;
 csStart('arrive',t=>{CS.bars=1-ek(t,330,380);CS.fade=1-ek(t,0,60);dr.open=1-ek(t,40,110);if(t===100){SFX.clang();G.shake=0.08}
  if(t===40)G.card={t:30,title:LV.c.title,name:LV.c.name};
  if(t<200)cam([0.9,1.5,-12.0],[0,1.35,-15.4],ek(t,0,200),[0.6,1.6,-12.5],[0,1.45,-15.4]);
  else cam([-1.2,1.9,-16.5],[0.6,1.3,-11],ek(t,200,380),[-0.4,2.3,-16.6],[0,1.4,-12]);
  if(t===120)csSay('Юки','Тепло… и пахнет ладаном. Здесь давно никто не живёт — но лампы горят.',120,250);
  if(t===255)csSay('Акира','Кто-то ждал гостей.',255,350);
  if(t>=380){dr.open=0;csEnd([['Юки','Зал впереди, за проходом справа. Осторожно.']])}},()=>{dr.open=0;CS.fade=0;csEnd()})}
// засада: самурай из-за угла, падение, отбивается лёжа, его прижимают, бросок Ёи насквозь — клинок ломается
function startAmbushCS(){const H=LV.H,e=H.ambushE;if(!e){G.ambushDone=true;return}
 if(!P.drawn){P.drawn=true}const props=[];let yoi=null,hilt=null;const shards=[];const tv=new V3(),tv3=new V3();
 const fin=()=>{for(const p of props)ENV.attach(p);if(yoi)scene.remove(yoi);P.csRx=0;P.y=0;P.hideL=false;G.oneBlade=true;G.ambushDone=true;H.ambushE=null;
  if(!e.dead){killEnemy(e,-1,0,{knock:8});}if(hilt)hilt.visible=false;addItem('yoihilt');pop('Ёи сломана. Дальше — одна катана · ПКМ — удар перчаткой Они','#e6c98a');
  csEnd([['Юки','Акацуки ещё с тобой. Левой — бей перчаткой Они (ПКМ).']]);saveHouseCP(0)};
 csStart('ambush',t=>{const C=CS.H;CS.bars=1;
  if(t===1){C.to=[2.0,-10.35];C.spd=0.03;C.gait=0.2;e.state='cs';e.x=-0.7;e.z=-10.1;e.yaw=Math.PI/2}
  if(t<40)cam([2.5,1.75,-13.6],[1.7,1.35,-9.6],ek(t,0,40),[2.4,1.7,-13.2],[1.6,1.35,-9.6]);
  // выпад из-за угла
  if(t>=30&&t<50){const k=ek(t,30,48);e.x=lerp(-0.7,P.x-1.15,k);e.csPose=mixPose(POSE.crane,POSE.nUp,Math.min(1,k*1.6));e.anim+=2}
  if(t===34){C.to=null;C.yaw=-Math.PI/2;C.yawK=0.35;SFX.roar&&SFX.roar()}
  if(t>=40&&t<70)cam([3.6,1.0,-12.6],[0.8,1.2,-10.2]);
  if(t===46){e.csPose=POSE.nDown;SFX.swingR()}
  if(t===49){G.shake=0.45;SFX.clang();(SFX.impact||SFX.hit)(1.2);sparks(P.x-0.3,1.3,P.z,120);flashL(P.x,1.4,P.z,0xffd8a0,8,16);P.csPose={p:POSE.hurt,w:1}}
  if(t>=49&&t<75){const k=ek(t,49,72);P.csRx=-1.5*k;P.y=0.16*k;P.x+=0.022*(1-k)}
  if(t===72){dust(P.x+0.6,P.z,14);G.shake=0.25;SFX.taiko(1.2)}
  // лежит на спине и отбивает удары сверху
  if(t>=75&&t<165){P.csPose={p:POSE.block,w:1};const T=(t-75)%28,k=T<14?ek(T,0,14):1-ek(T,14,28);e.x=lerp(e.x,P.x-1.05,0.1);e.csPose=T<14?mixPose(POSE.crane,POSE.nUp,k):mixPose(POSE.nDown,POSE.nUp,k);
   if(T===14&&t<160){SFX.clang();sparks(P.x+0.35,0.75,P.z,90);G.shake=0.18;P.ld=(P.ld||0)-0.03;flashL(P.x+0.3,0.8,P.z,0xffe0b0,5,8)}
   const a=0.9+(t-75)*0.004;cam([P.x+Math.cos(a)*1.9,0.5,P.z+Math.sin(a)*1.9],[P.x-0.7,1.0,P.z])}
  if(t===85)csSay('Юки','Акира! Сверху!',85,160);
  // наваливается и прижимает к полу
  if(t>=165&&t<218){const k=ek(t,165,195);e.x=lerp(P.x-1.05,P.x-0.5,k);e.csPose=mixPose(POSE.nDown,POSE.kneel,k);e.csRx=0.45*k;P.csPose={p:POSE.block,w:1};P.csLook=Math.sin(t*0.9)*0.06;G.shake=Math.max(G.shake,0.04);
   cam([P.x-0.1,1.45,P.z+1.55],[P.x-0.25,0.55,P.z],ek(t,165,218),[P.x+0.1,1.25,P.z+1.25],[P.x-0.25,0.6,P.z])}
  if(t===172)csSay('Акира','…Тяжёлый… как камень!',172,240);
  // бросок Ёи: клинок проходит сквозь грудь
  if(t===218){P.hideL=true;yoi=hero.arms.L.sw.clone(true);yoi.visible=true;hero.arms.L.sw.getWorldPosition(tv);yoi.position.copy(tv);scene.add(yoi);P.csPose={p:POSE.lThrust,w:1};SFX.swingL()}
  if(yoi&&t>=218&&t<262){e.rig.human.torso.getWorldPosition(tv3);tv3.y+=0.3;const from=tv.clone(),dir=tv3.clone().sub(from).normalize(),k=ek(t,218,230),end=tv3.clone().addScaledVector(dir,0.55);
   if(t<=230){yoi.position.lerpVectors(from,end,k);yoi.lookAt(yoi.position.clone().add(dir))}
   if(t===229){SFX.hit();(SFX.impact||SFX.hit)(1.5);G.shake=0.4;sparks(tv3.x,tv3.y,tv3.z,120,[0.5,0.8,1]);flashL(tv3.x,tv3.y,tv3.z,0x80c0ff,9,22);e.csPose=POSE.hurt;e.csRx=0.2}
   if(t>230&&t%3===0)FX.add.add({x:yoi.position.x+rnd(-.1,.1),y:yoi.position.y+rnd(-.1,.1),z:yoi.position.z+rnd(-.1,.1),vx:0,vy:0.01,vz:0,life:30,s:0.08,r:0.8,gg:1.4,b:2.2,a:0.7});
   if(t>230&&t%4===0)flashL(yoi.position.x,yoi.position.y,yoi.position.z,0x9ad0ff,2+(t-230)*0.25,6);
   cam([P.x-0.6,1.0,P.z+2.1],[P.x-0.55,0.95,P.z],ek(t,218,262),[P.x-0.45,0.95,P.z+1.6],[P.x-0.55,1.0,P.z])}
  if(t===236)csSay('Акира','Ёи… прости.',236,300);
  // клинок ломается — вспышка отбрасывает обоих
  if(t===262){const c=yoi.position.clone();yoi.visible=false;G.shake=0.8;SFX.clang();SFX.clang();(SFX.impact||SFX.hit)(2);SFX.bell();sparks(c.x,c.y,c.z,260,[0.6,0.85,1]);flashL(c.x,c.y,c.z,0xb0e0ff,16,40);
   hilt=itemModel('yoihilt');hilt.position.copy(c);scene.add(hilt);props.push(hilt);hilt.userData.v=new V3(0.035,0.07,0.02);
   for(let i=0;i<7;i++){const s=itemModel('shard');s.position.copy(c);scene.add(s);props.push(s);const a=rnd(0,6.28);s.userData.v=new V3(Math.cos(a)*rnd(0.03,0.08),rnd(0.03,0.1),Math.sin(a)*rnd(0.03,0.08));s.userData.w=new V3(rnd(-.3,.3),rnd(-.3,.3),rnd(-.3,.3));shards.push(s)}
   e.csFly={vx:-0.13,vy:0.09};P.csPose={p:POSE.hurt,w:1}}
  if(t>262){for(const s of[...shards,hilt]){if(!s)continue;const v=s.userData.v;if(!v)continue;s.position.add(v);v.y-=0.005;if(s.position.y<0.02){s.position.y=0.02;v.multiplyScalar(0.4);v.y=Math.abs(v.y)>0.01?-v.y*0.4:0}if(s.userData.w&&v.lengthSq()>1e-5){s.rotation.x+=s.userData.w.x;s.rotation.y+=s.userData.w.y}}
   if(t<300){P.x+=0.035*(1-ek(t,262,300))}
   const F=e.csFly;if(F&&!e.dead){e.x+=F.vx;e.y=Math.max(0,e.y+F.vy);F.vy-=0.006;F.vx*=0.95;e.csRx=lerp(e.csRx||0,-1.2,0.1);if(t===285){e.csRx=0;e.csPose=null;killEnemy(e,-1,0,{knock:9});e.y=0;G.shake=0.3;dust(e.x,e.z,20)}}
   if(e.dead){updEnemy(e,1)}
   if(t<330)cam([P.x+0.6,1.6,P.z+3.6],[P.x-1.6,0.7,P.z],ek(t,262,330),[P.x+0.9,1.9,P.z+4.4],[P.x-1.6,0.6,P.z])}
  if(t===300)csSay('Юки','Он рассыпался… Акира, вставай!',300,380);
  // встаёт, подбирает рукоять, смотрит на неё
  if(t>=330&&t<400){const k=ek(t,330,385);P.csRx=-1.5*(1-k);P.y=0.16*(1-k);P.csPose={p:k<0.6?POSE.kneel:POSE.crane,w:1-k*0.6};cam([P.x+1.6,1.4,P.z+2.2],[P.x,1.0,P.z],k)}
  if(t===400&&hilt){C.to=[hilt.position.x+0.55,hilt.position.z];C.spd=0.025;C.gait=0}
  if(t>=400&&t<470)cam([P.x+1.8,1.5,P.z+1.6],[P.x-0.4,0.7,P.z]);
  if(t===470&&hilt){C.to=null;C.yaw=Math.atan2(hilt.position.x-P.x,hilt.position.z-P.z);P.csPose={p:POSE.take,w:0}}
  if(t>=470&&t<520&&P.csPose)P.csPose.w=ek(t,470,495);
  if(t>=500&&hilt){hero.arms.R.hand.getWorldPosition(tv);const k=ek(t,500,520);hilt.position.lerp(tv,k>0.99?1:k*0.3+0.05);if(k>=1)hilt.rotation.set(-0.6+Math.sin(t*0.02)*0.2,P.yaw+1.4,0.2);hilt.userData.v=null}
  if(t>=520){if(P.csPose&&P.csPose.p!==POSE.inspect)P.csPose={p:POSE.inspect,w:0};P.csPose.w=ek(t,520,550);const hf=new V3(fwdX(P.yaw),0,fwdZ(P.yaw)),hr=new V3(hf.z,0,-hf.x);
   cam([P.x+hf.x*1.15+hr.x*0.5,1.6,P.z+hf.z*1.15+hr.z*0.5],[P.x+hf.x*0.3,1.35,P.z+hf.z*0.3],ek(t,520,700),[P.x+hf.x*0.85+hr.x*0.35,1.5,P.z+hf.z*0.85+hr.z*0.35],[P.x+hf.x*0.3,1.38,P.z+hf.z*0.3]);CS.card=t>=545&&t<690?'yoihilt':null}
  if(t===530)csSay('Акира','Отцовский клинок… Он отдал себя за меня.',530,640);
  if(t>=700){CS.card=null;fin()}},()=>{CS.card=null;for(const s of shards)s.position.y=0.02;if(hilt)hilt.position.y=0.02;fin()})}
function startMapCS(s){const H=LV.H;s.done=true;const mp=H.mapObj;if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.4;SFX.draw(false)}const tv=new V3(),tv2=new V3();
 const fin=()=>{mp.visible=false;G.hasMap=true;addItem('map');CS.card=null;csEnd([['Юки','На плане пометки «?». Тайники… M — открыть карту.']]);pop('M — карта дома','#e6c98a')};
 csStart('map',t=>{const C=CS.H;CS.bars=Math.min(ek(t,0,15),1-ek(t,300,320));if(t===1){C.to=[-15,-7.65];C.spd=0.03;C.gait=0}if(t===45){C.to=null;C.yaw=Math.PI;C.yawK=0.25}
  if(t<110)cam([-13.4,1.7,-6.4],[-15,0.5,-8.3],ek(t,0,110),[-13.9,1.4,-6.9],[-15,0.4,-8.4]);
  if(t>=50&&t<110){P.csPose=P.csPose||{p:POSE.take,w:0};P.csPose.w=ek(t,50,80)}
  if(t>=85){hero.arms.R.hand.getWorldPosition(tv);hero.arms.L.hand.getWorldPosition(tv2);const k=ek(t,85,110);mp.position.lerp(tv.clone().lerp(tv2,0.5),k*0.4+(k>=1?0.6:0));if(k>=1)mp.rotation.set(-1.0,P.yaw+Math.PI,0)}
  if(t===90)SFX.soul();
  if(t>=110){P.csPose.p=POSE.read;P.csPose.w=ek(t,110,140);const hf=new V3(fwdX(P.yaw),0,fwdZ(P.yaw));cam([P.x+hf.x*1.3+0.4,1.65,P.z+hf.z*1.3],[P.x,1.35,P.z],ek(t,110,300),[P.x+hf.x*0.95+0.3,1.6,P.z+hf.z*0.95],[P.x,1.4,P.z]);CS.card=t>140?'map':null}
  if(t===140)csSay('Акира','План дома… и чьи-то пометки. Тайники?',140,280);
  if(t>=320)fin()},()=>fin())}
function startExitCS(){const H=LV.H,ex=H.open.find(o=>o.type==='exit');if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.4;SFX.draw(false)}
 csStart('hexit',t=>{const C=CS.H;CS.bars=1;if(t===1){C.to=[0,24.0];C.spd=0.03;C.gait=0}
  cam([2.4,1.8,20.5],[0,1.6,25],ek(t,0,240),[0.8,1.7,22.6],[0,1.6,26]);
  if(t>=70){ex.open=ek(t,70,140);if(t%8===0)flashL(0,1.6,25.4,0xfff0d8,1.5+ex.open*3.5,12)}if(t===72)SFX.bell();
  if(t===150){C.to=[0,26.2];C.spd=0.022}
  CS.fadeC='255,248,236';CS.fade=ek(t,170,230);
  if(t===150)csSay('Акира','Сота… я узнаю, что здесь случилось.',150,230);
  if(t>=240){CS.fadeC='0,0,0';csEnd();G.mode='victory';G.noPauseOnUnlock=true;document.exitPointerLock&&document.exitPointerLock();setTimeout(()=>G.noPauseOnUnlock=false,100)}},null)}
function houseBossDown(e){const H=LV.H;const ex=H.open.find(o=>o.type==='exit');ex.w.off=true;ex.open=0.08;
 H.spots.push({k:'exit',x:0,z:23.9,r:1.6,label:'X — открыть дверь в глубину дома'});spawnWI('key',e.x,1.2,e.z,0.01,0.08,0.01);
 say('Кагэмару','…Он… ждёт тебя… внизу…');say('Юки','Страж пал. Дверь за додзё открыта.')}
// ================================================================ ЁКАИ ДОМА
function redMat(n,c,em){const m=ASSET.mats[n];if(!m)return null;const k=m.clone();k.color.set(c);if(em!=null&&k.emissive){k.emissive.set(em)}return k}
let _shogunMM=null;
function rigMusha(boss){const AM=ASSET.mats;if(AM.MU_eye&&!AM.MU_eye.userData.tw){AM.MU_eye.userData.tw=1;AM.MU_eye.emissiveIntensity=Math.min(AM.MU_eye.emissiveIntensity,4);if(AM.MU_ghost)AM.MU_ghost.emissiveIntensity=Math.min(AM.MU_ghost.emissiveIntensity,1.2)}let mm={};if(boss){_shogunMM=_shogunMM||{MU_kozane:redMat('MU_kozane',0x9a2018),MU_eye:redMat('MU_eye',0xff5020,0xff4010),MU_kimono2:redMat('MU_kimono2',0x3a0c0a),MU_obi:redMat('MU_obi',0x5a1010),MU_ghost:redMat('MU_ghost',0xff5030,0xff3010)};mm=_shogunMM}
 const h=makeHuman({set:'MU',scale:boss?1.28:1.03,matMap:mm,pants:M.sotaK,pants2:M.sotaK,kimono:M.sotaK,vest:M.sotaV,skin:M.sotaSkin,cape:null,tsR:M.sotaA,tsL:M.sotaA,armor:M.sotaA,obi:M.sotaA,eyes:true,horns:false,len:{R:boss?1.05:0.92,L:0.86}});
 h.arms.L.sw.visible=false;const gl=glintSprite();scene.add(gl);return{...h,root:h.root,tip:h.arms.R.sw.userData.tip,gl,mat:null,upper:h.torso,kind:'musha',human:h}}
function rigChochin(){const root=new Group(),body=new Group();body.position.y=0.62;root.add(body);addPart(body,'TC','body');body.traverse(m=>{if(m.material&&m.material.emissive){m.material=m.material.clone();m.material.emissiveIntensity=Math.min(m.material.emissiveIntensity,1)*0.35}});const eye=new Group();eye.position.set(0,0.09,0.27);body.add(eye);addPart(eye,'TC','eye');
 const tg=new Group();tg.position.set(0,-0.14,0.27);body.add(tg);addPart(tg,'TC','tongue');const gl=glintSprite();scene.add(gl);return{root,body,eye,tg,tip:eye,gl,mat:null,upper:body,kind:'chochin'}}
function rigMoku(){const root=new Group(),panel=new Group();root.add(panel);const pp=addPart(panel,'MK','panel');const iris=pp.all.filter(m=>m.material&&m.material.name==='mk_iris');
 const ic=iris.map(m=>{m.material=m.material.clone();return m.material});const tip=new THREE.Object3D();tip.position.set(0,1.3,0.1);panel.add(tip);const gl=glintSprite();scene.add(gl);return{root,panel,ic,tip,gl,mat:null,upper:panel,kind:'moku'}}
// ИИ самурая-призрака (и босса): комбо, рывок, иай, у босса — вторая фаза с призывом фонарей
function updMusha(e,ts,d,ty){e.st+=ts;const B=e.t==='shogun',sp=(B&&e.phase===2?1.3:1);
 if(e.state==='cs'||e.state==='csIdle'){e.vx=e.vz=0;return}
 if(e.state==='intro'){e.yaw=ty;e.inv=1;if(!G.subs.length){e.state='move';e.st=0;e.cd=50;e.inv=0}return}
 if(e.state==='trans'){e.inv=1;if(e.st%10<1)tar(e.x,1.3,e.z,8,1.2);if(e.st>150){e.state='move';e.st=0;e.inv=0;e.cd=30}return}
 if(e.state==='enter'){e.yaw=turn(e.yaw,ty,0.1);if(e.st>30){e.state='move';e.st=0;e.cd=rnd(30,70)}return}
 if(B&&e.phase===1&&e.hp<e.max*0.5){e.phase=2;e.state='trans';e.st=0;e.inv=1;G.shake=0.3;SFX.bell();SFX.roar&&SFX.roar();say('Кагэмару','Дом, встань за меня!');say('Юки','Фонари! Сначала их — потом его.');
  LV.H.queue.push({q:['chochin',e.x+3,e.z-2],at:G.frame+40},{q:['chochin',e.x-3,e.z-2],at:G.frame+70});return}
 const dx=P.x-e.x,dz=P.z-e.z,v=e.d.spd/60*sp,dm=e.d.dm||1;
 switch(e.state){
 case'move':e.yaw=turn(e.yaw,ty,0.12);if(d>2.6){e.x+=dx/d*v*ts;e.z+=dz/d*v*ts}else if(d<1.6){e.x-=dx/d*v*0.5*ts;e.z-=dz/d*v*0.5*ts}else{e.x+=-dz/d*v*0.4*ts;e.z+=dx/d*v*0.4*ts}
  e.cd-=ts*sp;if(e.cd<=0&&P.state!=='dead'){const r=Math.random();if(d>6)sotaAtk(e,'dash');else if(r<(B?0.25:0.14))sotaAtk(e,'iai');else{sotaAtk(e,'combo');e.comboN=B?3:2}e.atk.dmg=Math.round(e.atk.dmg*dm);if(!B&&e.atk.k==='slash')e.atk.wind+=8}break;
 case'wind':if(e.atk.k!=='dash'||e.st<e.atk.wind-6)e.yaw=turn(e.yaw,ty,0.15);if(e.st>=e.atk.wind){e.state='act';e.st=0;const a=e.atk;
   if(a.k==='slash'){e.vx+=fwdX(e.yaw)*0.07;e.vz+=fwdZ(e.yaw)*0.07;SFX.swingR();if(d<=a.reach*(B?1.15:1)&&(dx*fwdX(e.yaw)+dz*fwdZ(e.yaw))/d>0.4)hitPlayer(e,a.dmg,{issen:true})}
   else if(a.k==='dash'){e.vx=fwdX(e.yaw)*0.36;e.vz=fwdZ(e.yaw)*0.36;SFX.swingR()}
   else if(a.k==='iai'){const fx=e.x,fz=e.z,dd=Math.max(d,0.1);e.x=P.x+dx/dd*2.4;e.z=P.z+dz/dd*2.4;arenaClamp(e,0.6);lines.push({x1:fx,z1:fz,x2:e.x,z2:e.z,life:24});SFX.swingL();G.shake=0.2;
    const sx=e.x-fx,sz=e.z-fz,sl=sx*sx+sz*sz||1,t=clamp(((P.x-fx)*sx+(P.z-fz)*sz)/sl,0,1),px=fx+sx*t,pz=fz+sz*t;if(Math.hypot(P.x-px,P.z-pz)<1.0&&d<9)hitPlayer(e,a.dmg,{unblock:true});e.yaw+=Math.PI}}break;
 case'act':if(e.atk.k==='dash'&&!e.hitDone&&d<1.3){e.hitDone=true;hitPlayer(e,e.atk.dmg,{issen:true})}if(e.st>=e.atk.act){e.state='rec';e.st=0}break;
 case'rec':if(e.st>=e.atk.rec){if(e.comboN>1){e.comboN--;e.atk={...e.atk,wind:Math.round((B?14:18)/sp)};e.state='wind';e.st=0}else{e.state='move';e.st=0;e.cd=rnd(B?40:60,B?90:130)/sp}}break;
 case'stag':if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=20}break;}}
// мокумокурэн: неподвижен на стене, глаза копят взгляд и выпускают самонаводящиеся сферы
function updMoku(e,ts,d,ty){e.st+=ts;if(e.hx!=null){e.x=e.hx;e.z=e.hz}e.vx=e.vz=0;
 switch(e.state){case'enter':if(e.st>50){e.state='move';e.st=0;e.cd=rnd(40,90)}break;
 case'move':e.cd-=ts;if(e.cd<=0&&d<14&&P.state!=='dead'){e.state='wind';e.st=0;e.atk={k:'gaze',wind:54,act:1,rec:50,dmg:12};SFX.grab()}break;
 case'wind':if(e.st>=e.atk.wind){e.state='act';e.st=0;e.rig.tip.getWorldPosition(tv1);for(const off of[-0.35,0.35]){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:0xc060ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));m.scale.setScalar(0.45);scene.add(m);
   const dx=P.x-tv1.x,dz=P.z-tv1.z,L=Math.hypot(dx,dz)||1;proj.push({k:'orb',x:tv1.x+Math.cos(e.yaw)*off,y:tv1.y,z:tv1.z-Math.sin(e.yaw)*off,vx:dx/L*0.07,vy:0,vz:dz/L*0.07,life:260,dmg:e.atk.dmg,m,src:e})}SFX.ice&&SFX.ice()}break;
 case'act':e.state='rec';e.st=0;break;
 case'rec':if(e.st>=e.atk.rec){e.state='move';e.st=0;e.cd=rnd(70,130)}break;
 case'stag':if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=40}break;
 default:e.state='move'}}
function updOrb(p,ts){if(!p.refl){const tx=P.x-p.x,ty=P.y+1.15-p.y,tz=P.z-p.z,L=Math.hypot(tx,ty,tz)||1;p.vx+=tx/L*0.0028*ts;p.vy+=ty/L*0.0028*ts;p.vz+=tz/L*0.0028*ts;const v=Math.hypot(p.vx,p.vy,p.vz);if(v>0.085){p.vx*=0.085/v;p.vy*=0.085/v;p.vz*=0.085/v}}
 p.m.position.set(p.x,p.y,p.z);p.m.material.opacity=0.7+Math.sin(G.frame*0.5)*0.3;if(G.frame%2===0)FX.add.add({x:p.x,y:p.y,z:p.z,vx:0,vy:0,vz:0,life:18,s:0.1,r:1.4,gg:0.5,b:2,a:0.6});
 if(inWall(p.x,p.z)){p.life=0;sparks(p.x,p.y,p.z,16,[0.7,0.3,1]);return}
 if(!p.refl&&Math.hypot(p.x-P.x,p.z-P.z)<0.5&&p.y>P.y&&p.y<P.y+1.9){const r=hitPlayer(p,p.dmg,{proj:true});if(r==='block'||r==='issen'){p.refl=true;p.vx*=-1.6;p.vy=0;p.vz*=-1.6;p.life=120}else if(r!=='dodge'){p.life=0;sparks(p.x,p.y,p.z,30,[0.7,0.3,1])}}
 if(p.refl)for(const e of enemies)if(!e.dead&&Math.hypot(e.x-p.x,e.z-p.z)<0.9){dmgEnemy(e,30,p.vx*8,p.vz*8,{knock:4});p.life=0;break}}
function syncHouseEnemy(e,t){const r=e.rig,wind=e.state==='wind',k=wind?ease(e.st/e.atk.wind):0,act=e.state==='act'||e.state==='rec';
 if(r.kind==='chochin'){const mv=(e.state==='move'||e.state==='enter')?1:0,ph=e.anim*0.13,hop=Math.abs(Math.sin(ph));
  r.body.position.y=0.62+(mv?hop*0.26:Math.sin(t*2.4+e.anim)*0.05)-(wind?0.12*k:0);const sq=mv?(1-hop)*0.12:wind?0.15*k:0;r.body.scale.set(1+sq,1-sq,1+sq);
  r.body.rotation.x=wind?-0.35*k:act?0.4:Math.sin(t*1.7+e.anim)*0.08;r.body.rotation.z=Math.sin(t*1.3+e.anim)*0.1;
  r.tg.rotation.x=Math.sin(t*7+e.anim)*0.35+(act?0.9:wind?-0.5*k:0);r.tg.scale.y=1+(act?0.6:0);
  const ly=angDiff(Math.atan2(P.x-e.x,P.z-e.z),e.yaw);r.eye.rotation.set(-0.2,clamp(ly,-0.8,0.8),0)}
 else if(r.kind==='moku'){const op=e.state==='enter'?ek(e.st,0,50):1;r.panel.scale.set(1,1,1);for(const m of r.ic){m.emissiveIntensity=(wind?3+12*k:1.5+Math.sin(t*3)*0.5)*op}r.panel.position.z=Math.sin(t*1.1+e.anim)*0.01;
  if(e.state==='enter'&&e.st<3)for(let i=0;i<20;i++)FX.add.add({x:e.x+rnd(-0.9,0.9),y:rnd(0.1,2),z:e.z,vx:0,vy:0.01,vz:0,life:40,s:0.06,r:1.2,gg:0.4,b:1.8,a:0.6})}}
function smokeFx(){for(let i=0;i<90;i++){const a=rnd(0,6.28),r=rnd(0.3,5.5);FX.norm.add({x:P.x+Math.cos(a)*r,y:rnd(0.1,1.8),z:P.z+Math.sin(a)*r,vx:Math.cos(a)*rnd(0.1,0.6)/60,vy:rnd(0.2,0.6)/60,vz:Math.sin(a)*rnd(0.1,0.6)/60,life:rnd(120,220),s:rnd(0.3,0.6),r:0.3,gg:0.3,b:0.32,a:0.5})}flashL(P.x,1,P.z,0xffffff,6,10);SFX.fire();G.shake=0.1}
// ================================================================ КАРТА (M)
function drawMap(){const HH=LV.H;X.fillStyle='rgba(0,0,0,0.78)';X.fillRect(0,0,W,H);
 const mx0=-21,mx1=21,mz0=-18,mz1=26,s=Math.min((W-420)/(mx1-mx0),(H-150)/(mz1-mz0)),cx=W/2-80,cy=H/2+12,zc=(mz0+mz1)/2;
 const SX=x=>cx-x*s,SY=z=>cy-(z-zc)*s;
 const pw=(mx1-mx0)*s+60,ph=(mz1-mz0)*s+60;X.fillStyle='#d9c9a3';X.fillRect(cx-pw/2,cy-ph/2,pw,ph);X.fillStyle='#5a3a1a';X.fillRect(cx-pw/2-10,cy-ph/2-12,pw+20,12);X.fillRect(cx-pw/2-10,cy+ph/2,pw+20,12);
 for(const r of HR){const seen=G.hseen.has(r.id),x0=SX(r.x1),y0=SY(r.z1),w=(r.x1-r.x0)*s,h=(r.z1-r.z0)*s;X.fillStyle=r.id==='garden'?(seen?'#c9d2cf':'#b9b29a'):seen?'#cdb98e':'#b4a47e';X.fillRect(x0,y0,w,h);
  if(!seen){X.save();X.beginPath();X.rect(x0,y0,w,h);X.clip();X.strokeStyle='rgba(90,70,40,0.25)';X.lineWidth=1;for(let k=-h;k<w;k+=9){X.beginPath();X.moveTo(x0+k,y0);X.lineTo(x0+k+h,y0+h);X.stroke()}X.restore()}
  if(G.hcleared.has(r.id)){X.fillStyle='rgba(60,90,40,0.10)';X.fillRect(x0,y0,w,h)}
  if(r.id===HH.cur){X.strokeStyle='rgba(160,30,20,0.7)';X.lineWidth=2;X.strokeRect(x0+3,y0+3,w-6,h-6)}
  X.fillStyle=seen?'#3a2a1a':'rgba(58,42,26,0.55)';X.font='bold 15px Georgia,serif';X.textAlign='center';X.fillText(r.n,x0+w/2,y0+18)}
 X.strokeStyle='#2a1c10';X.lineCap='square';
 for(const [ax,c,a,b,,ops] of HW){let st=a;const segs=[];for(const o of ops.slice().sort((p,q)=>p[0]-q[0])){segs.push([st,o[0]]);st=o[1]}segs.push([st,b]);X.lineWidth=4;
  for(const [u0,u1] of segs){X.beginPath();if(ax==='z'){X.moveTo(SX(u0),SY(c));X.lineTo(SX(u1),SY(c))}else{X.moveTo(SX(c),SY(u0));X.lineTo(SX(c),SY(u1))}X.stroke()}
  for(const o of ops){X.lineWidth=2;X.strokeStyle=o[2]==='exit'||o[2]==='door'?'#7a1a14':'rgba(42,28,16,0.35)';X.setLineDash([3,4]);X.beginPath();if(ax==='z'){X.moveTo(SX(o[0]),SY(c));X.lineTo(SX(o[1]),SY(c))}else{X.moveTo(SX(c),SY(o[0]));X.lineTo(SX(c),SY(o[1]))}X.stroke();X.setLineDash([]);X.strokeStyle='#2a1c10'}}
 // декор: пруд, дерево, лестницы
 X.fillStyle='rgba(60,90,110,0.5)';X.beginPath();X.ellipse(SX(4.6),SY(9.5),2.3*s,1.9*s,0,0,7);X.fill();X.fillStyle='rgba(150,110,30,0.6)';X.beginPath();X.arc(SX(-5),SY(10.2),2.4*s,0,7);X.fill();
 X.strokeStyle='rgba(42,28,16,0.5)';X.lineWidth=1;for(const sx of[-1,1]){for(let k=0;k<9;k++){const z=-4.25-k*0.5;X.beginPath();X.moveTo(SX(sx*6.5-0.8),SY(z));X.lineTo(SX(sx*6.5+0.8),SY(z));X.stroke()}}
 X.fillStyle='rgba(42,28,16,0.18)';X.fillRect(SX(10),SY(-8.5),20*s,2.5*s);
 // зеркала
 for(const m of LV.env.mirrors){X.fillStyle=m.act?'#e6b84a':'#8a7a5a';X.beginPath();X.arc(SX(m.x),SY(m.z),6,0,7);X.fill();X.strokeStyle='#3a2a10';X.lineWidth=1.5;X.stroke()}
 // сундуки: «?» — обычные (золото) и скрытые (фиолетовые), открытые — ✓
 LV.chests.forEach(c=>{const x=SX(c.x),y=SY(c.z),op=c.state==='open',hid=!!c.hide;X.beginPath();X.arc(x,y,11,0,7);X.fillStyle=op?'rgba(90,80,60,0.5)':hid?'#6a3a9a':'#b8862a';X.fill();X.strokeStyle='#2a1c10';X.lineWidth=1.5;X.stroke();
  X.fillStyle=op?'#e8dcc0':'#fff4dc';X.font='bold 15px Georgia,serif';X.textAlign='center';X.fillText(op?'✓':'?',x,y+5)});
 // игрок
 {const x=SX(P.x),y=SY(P.z),a=Math.PI-P.yaw;X.save();X.translate(x,y);X.rotate(-a+Math.PI);X.fillStyle='#b01818';X.beginPath();X.moveTo(0,-11);X.lineTo(7,8);X.lineTo(0,4);X.lineTo(-7,8);X.closePath();X.fill();X.restore()}
 // легенда
 const lx=cx+pw/2+30;let ly=cy-ph/2+10;X.textAlign='left';X.fillStyle='#e7dcc4';X.font='bold 26px Georgia,serif';X.fillText('Забытый дом',lx,ly+20);ly+=56;X.font='15px Georgia,serif';
 const leg=[['#b01818','▲  Акира'],['#e6b84a','●  зеркало-сакр'],['#b8862a','?  сундук'],['#6a3a9a','?  тайник'],['#c8bca0','✓  открыто']];for(const [c,t] of leg){X.fillStyle=c;X.fillText(t,lx,ly);ly+=26}
 const tot=LV.chests.length,opn=LV.chests.filter(c=>c.state==='open').length,hf=LV.chests.filter(c=>c.hide&&c.state!=='hidden').length;ly+=12;X.fillStyle='#d8cfb8';X.fillText('Сундуков открыто: '+opn+' / '+tot,lx,ly);ly+=24;X.fillText('Тайников найдено: '+hf+' / 3',lx,ly);ly+=24;
 X.fillText('Комнат очищено: '+G.hcleared.size+' / '+Object.keys(HWAVES).length,lx,ly);ly+=40;X.fillStyle='rgba(230,220,200,0.6)';X.font='14px Georgia,serif';X.fillText('M / Esc — закрыть',lx,ly);X.textAlign='left'}
