// v0.14: ГЛАВА 6 «Родная деревня» (Какарико, данные — gK.js): свободная локация без боя, рельеф (высота земли GY),
// дома с интерьерами (вход/выход — X у двери), НПС с диалогами, кузнец Рэн (ковка, починка Ёи, улучшение клинков), карта деревни (M).
let GY=0;
const KK={room:-1,door:null,npcs:[],smith:null,rooms:[],vill:[],view:-1,hilt:null};
const KNAME={sarah:'Сара',orc:'Гурц',girl:'Мика',smith:'Рэн'},KEYE={sarah:1.5,orc:1.85,girl:1.08,smith:1.45},KDOOR={A:'Старый дом',C:'Дом Сары',D:'Таверна',F:'Дом Мики'};
function kakNavV(){const N=KAKD.nav;if(!N.g){const b=atob(N.b),n=N.w*N.h,g=new Uint8Array(n);for(let k=0;k<n;k++)g[k]=(b.charCodeAt(k>>3)>>(7-(k&7)))&1;N.g=g;N.dist=new Int32Array(n).fill(-1);N.q=new Int32Array(n);N.pc=-1;N.ft=-99;
  const s=atob(N.gh),u=new Uint16Array(n);for(let k=0;k<n;k++)u[k]=s.charCodeAt(2*k)|(s.charCodeAt(2*k+1)<<8);N.G=u;navHB(N)}return N}
// высота земли деревни: билинейно по сетке gh (см над ho)
function kakGH(x,z){const N=kakNavV();let fx=(x-N.x0)/N.cs-0.5,fz=(z-N.z0)/N.cs-0.5;fx=clamp(fx,0,N.w-1.001);fz=clamp(fz,0,N.h-1.001);const i=fx|0,j=fz|0,a=fx-i,b=fz-j,W=N.w,U=N.G,k=j*W+i;
 return((U[k]*(1-a)+U[k+1]*a)*(1-b)+(U[k+W]*(1-a)+U[k+W+1]*a)*b)/100+N.ho}
// nav интерьера: стены, мебель (col) и НПС — непроходимы; поле на 0.6 м шире комнаты (камера не выходит за стены)
function kakRoomNav(k){const R=KAKD.rooms[k];if(R.N)return R.N;const cs=0.2,m=0.6,w=Math.ceil((R.w+2*m)/cs),h=Math.ceil((R.d+2*m)/cs),n=w*h,g=new Uint8Array(n),Ht=new Uint8Array(n),Hl=new Uint8Array(n).fill(255),H10=Math.min(250,Math.round(R.h/0.1)),pad=0.3;
 const col=R.col.concat([[R.npc[0]-0.22,R.npc[1]-0.22,R.npc[0]+0.22,R.npc[1]+0.22]]);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const x=-R.w/2-m+(i+.5)*cs,z=-R.d/2-m+(j+.5)*cs,c=j*w+i,inR=Math.abs(x)<R.w/2-0.08&&Math.abs(z)<R.d/2-0.08;let ok=Math.abs(x)<R.w/2-pad&&Math.abs(z)<R.d/2-pad,furn=false;
  for(const q of col)if(x>q[0]-pad&&x<q[2]+pad&&z>q[1]-pad&&z<q[3]+pad){ok=false;if(x>q[0]&&x<q[2]&&z>q[1]&&z<q[3])furn=true}
  g[c]=ok?1:0;Ht[c]=!inR?255:furn?11:ok?H10:0;if(ok)Hl[c]=H10}
 R.N={x0:R.ox-R.w/2-m,z0:-R.d/2-m,cs,w,h,g,Ht,Hl,hs:0.1,ho:0,dist:new Int32Array(n).fill(-1),q:new Int32Array(n),pc:-1,ft:-99};return R.N}
function buildKakEnv(g,env){KK.vill=[locAdd(g,'kak'),locAdd(g,'kaks'),locAdd(g,'kakd')];KK.rooms=[0,1,2].map(k=>{const r=locAdd(g,'kakin'+k);r.visible=false;const R=KAKD.rooms[k];
  if(R.fire)addFire(r,R.ox+R.fire[0],R.fire[1]-0.35,R.fire[2],0.45,99);r.traverse(o=>{const m=o.material;if(m&&m.emissive&&!m.userData.kdim){m.userData.kdim=1;m.emissiveIntensity=Math.min(m.emissiveIntensity??1,0.35)}});return r});
 const F=KAKD.smithy.pts.forge;addFire(KK.vill[1],F[0],F[1]-0.4,F[2],0.45,99);KK.view=-1;env.kak=true}
function kakRig(id,name,sc){const r=rigHumanX(name,'npc',{scale:sc});scene.remove(r.gl);r.arms.L.sw.visible=false;r.arms.R.sw.visible=false;if(r.human.saya)for(const s of r.human.saya)s.visible=false;return r}
function kakLoad(cp){LV.kak=true;G.kak=G.kak||{map:false,girl:false,fixed:false,n:{}};G.forge=G.forge||{R:0,L:0};KK.room=-1;KK.door=null;KK.npcs=[];KK.smith=null;KK.hilt=null;
 const sp=KAKD.spawn;P.x=sp[0];P.z=sp[1];P.yaw=1.85;G.camYaw=P.yaw;G.camDist=4.6;P._nx=undefined;GY=kakGH(P.x,P.z);
 if(ASSET.skins&&ASSET.skins.sarah){
  for(const d of KAKD.doors){if(!d.npc||KK.npcs.some(n=>n.room===d.room))continue;const R=KAKD.rooms[d.room],gi=d.npc==='girl'&&!ASSET.skins.girl,sc=gi?0.74:1;
   const r=kakRig(d.npc,gi?'sarah':d.npc,sc);KK.rooms[d.room].add(r.root);const x=R.ox+R.npc[0],z=R.npc[1];
   if(gi)for(const m of Object.values(r.mm))if(m.color)m.color.offsetHSL(0.02,0.08,0.04);
   KK.npcs.push({id:d.npc,n:KNAME[d.npc],r,x,y:0,z,yaw:Math.atan2(R.ox-x,R.d/2-z),yaw0:Math.atan2(R.ox-x,R.d/2-z),room:d.room,t:Math.random()*99,eye:KEYE[d.npc]*(gi?0.98:1),talk:0,tt:0})}
  if(ASSET.skins.smith){const S=KAKD.smithy.pts,yaw=Math.PI,an=S.anvil,lx=Math.cos(yaw),lz=-Math.sin(yaw),fx=Math.sin(yaw),fz=Math.cos(yaw),r=kakRig('smith','smith',1);KK.vill[1].add(r.root);
   const hm=new Group();const hw=new Mesh(new THREE.CylinderGeometry(0.016,0.019,0.66,8),ASSET.mats.ho_wood||M.wood);hw.rotation.x=Math.PI/2;hw.position.z=0.27;hm.add(hw);const hh=new Mesh(new THREE.BoxGeometry(0.075,0.2,0.085),new MS({color:0x3a3a40,roughness:0.45,metalness:0.85}));hh.position.z=0.6;hm.add(hh);r.arms.R.hand.add(hm);hm.traverse(o=>{if(o.isMesh)o.castShadow=true});
   KK.smith={id:'smith',n:KNAME.smith,r,x:an[0]+lx*0.12-fx*0.86,y:S.smith[1],z:an[2]+lz*0.12-fz*0.86,yaw,yaw0:yaw,room:-1,t:0,ft:0,eye:KEYE.smith,talk:0,tt:0,forge:1,spd:0.6,hm}}}
 kakView(-1)}
// вид: деревня (k<0) или интерьер k — видимость, свет, фон
function kakView(k){KK.view=k;const T=THEMES.kak;for(const g of KK.vill)g.visible=k<0;KK.rooms.forEach((r,i)=>r.visible=i===k);
 for(const l of STATIC){l.intensity=0;l.userData.base=0}
 const L=(i,x,y,z,c,b,d)=>{const l=STATIC[i];l.position.set(x,y,z);l.color.set(c);l.userData.base=b;l.intensity=b;l.distance=d};
 if(k<0){scene.background.set(T.bg);scene.fog.color.set(T.fog);scene.fog.density=T.dens;hemi.intensity=T.hemi[2];moon.intensity=T.moon[1];
  const F=KAKD.smithy.pts.forge;L(0,F[0],F[1]+0.3,F[2],0xff7a30,4,11);
  KAKD.doors.forEach((d,i)=>{if(i<4)L(i+1,d.x+0.95*d.nz+0.5*d.nx,d.y+2.0,d.z-0.95*d.nx+0.5*d.nz,0xffb060,2.2,8)})}
 else{const R=KAKD.rooms[k];scene.background.set(0x0b0806);scene.fog.color.set(0x140e0a);scene.fog.density=0.02;hemi.intensity=0.5;moon.intensity=0;
  if(R.fire)L(0,R.ox+R.fire[0],R.fire[1]+0.3,R.fire[2],0xff8a40,3.2,10);(R.lamps||[]).forEach((p,i)=>{if(i<4)L(i+1,R.ox+p[0],p[1],p[2],0xffc070,2.4,8)})}
 if(LV.env&&LV.env.rays)for(const r of LV.env.rays)r.visible=k<0}
function kakCamFix(C){if(KK.room>=0){const R=KAKD.rooms[KK.room];C.x=clamp(C.x,R.ox-R.w/2+0.25,R.ox+R.w/2-0.25);C.z=clamp(C.z,-R.d/2+0.25,R.d/2-0.25);C.y=clamp(C.y,0.5,R.h-0.3)}
 else{const g=kakGH(C.x,C.z)+0.45;if(C.y<g)C.y=g}}
// ---------- кадр: высота земли, НПС, кузнец
function kakNpcAnim(n,ts){n.t+=ts;const r=n.r;r.root.position.set(n.x,n.y,n.z);r.root.rotation.y=n.yaw;applyPose(r,POSE.sheath,0,0,n.t/60,{idle:1,seed:n.x});
 if(n.forge&&!n.talk){const p=n.ft;n.ft+=n.spd*ts;applyClip(r,'forge',n.ft%36,1);if(Math.floor(n.ft/36)>Math.floor(p/36))kakStrike()}
 else if(n.talk){n.tt+=ts;applyClip(r,'talk',n.tt%104,1)}else{applyClip(r,'talk',0,0.92);r.torso.rotateX(Math.sin(n.t*0.03)*0.015)}}
function kakStrike(){const A=KAKD.smithy.pts.anvil;if(KK.view>=0)return;const d=Math.hypot(P.x-A[0],P.z-A[2]);if(d<40){sparks(A[0],A[1]+0.04,A[2],22,[1,0.72,0.32]);flashL(A[0],A[1]+0.3,A[2],0xffa040,5,9)}SFX.anvil&&SFX.anvil(Math.pow(clamp(1-d/26,0,1),1.4))}
function kakAnim(ts){if(!KK.npcs)return;
 if(KK.room<0){const t=kakGH(P.x,P.z);GY=Math.abs(t-GY)>1.2?t:lerp(GY,t,0.3)}else GY=0;
 for(const n of KK.npcs){if(n.room===KK.view)kakNpcAnim(n,ts)}
 if(KK.smith&&KK.view<0)kakNpcAnim(KK.smith,ts);
 if(KK.view<0&&G.frame%6===0){const F=KAKD.smithy.pts.forge;embers(F[0]+rnd(-.2,.2),F[1]-0.2,F[2]+rnd(-.2,.2),1)}
 if(KK.hilt){hero.arms.L.hand.getWorldPosition(tv1);hero.arms.R.hand.getWorldPosition(tv2);KK.hilt.position.copy(tv1).add(tv2).multiplyScalar(0.5);KK.hilt.position.y+=0.03;KK.hilt.rotation.set(0,P.yaw+Math.PI/2,Math.PI/2)}}
function updKak(ts){const push=(o,r)=>{const dx=P.x-o.x,dz=P.z-o.z,d=Math.hypot(dx,dz);if(d<r&&d>1e-3){P.x=o.x+dx/d*r;P.z=o.z+dz/d*r}};
 for(const n of KK.npcs)if(n.room===KK.room)push(n,0.55);if(KK.smith&&KK.room<0)push(KK.smith,0.55);
 for(const n of KK.npcs)if(!n.talk)n.yaw=turn(n.yaw,n.yaw0,0.03);if(KK.smith&&!KK.smith.talk)KK.smith.yaw=turn(KK.smith.yaw,KK.smith.yaw0,0.03);
 const K=G.kak;if(K&&!K.hint){K.hint=1;say('Юки','Акира… это твой дом. Гэнма сюда не дошли.');say('Юки','Ёи сломана. Может, здесь найдётся тот, кто её починит. Поговори с людьми (X у дверей).')}}
// ---------- интеракции (X)
function kakNear(){if(CS.on)return null;const K=G.kak||{};
 if(KK.room>=0){const R=KAKD.rooms[KK.room];if(Math.hypot(P.x-R.ox,P.z-(R.d/2-0.45))<1.25)return{k:'kak',label:'X — выйти на улицу',f:kakExit};
  for(const n of KK.npcs)if(n.room===KK.room&&Math.hypot(P.x-n.x,P.z-n.z)<1.8)return{k:'kak',label:'X — поговорить: '+n.n,f:()=>kakTalkTo(n)};return null}
 const S=KK.smith;if(S){const tp=KAKD.smithy.pts.talk;if(Math.hypot(P.x-tp[0],P.z-tp[2])<2.0||Math.hypot(P.x-S.x,P.z-S.z)<2.0)return{k:'kak',label:K.fixed?'X — кузница Рэн: улучшить клинки':'X — поговорить: '+S.n,f:()=>kakSmith()}}
 for(const d of KAKD.doors){const x=d.x+d.nx*0.75,z=d.z+d.nz*0.75;if(Math.hypot(P.x-x,P.z-z)<1.3&&Math.abs(GY-d.y)<1.3)return{k:'kak',label:'X — войти: '+KDOOR[d.id],f:()=>kakEnter(d)}}return null}
function kakFade(fn,after){const p0=camera.position.clone(),l0=new V3();camera.getWorldDirection(l0);l0.multiplyScalar(4).add(p0);
 csStart('kakDoor',t=>{if(t===1){CS.cam.p.copy(p0);CS.cam.l.copy(l0)}
  if(t<=16)CS.fade=t/16;if(t===16){fn();const b=2.4;CS.cam.p.set(P.x-Math.sin(P.yaw)*b,GY+2.0,P.z-Math.cos(P.yaw)*b);kakCamFix(CS.cam.p);CS.cam.l.set(P.x,GY+1.35,P.z)}
  if(t>16)CS.fade=Math.max(0,1-(t-16)/18);if(t>=34){csEnd();if(after)after()}},null)}
function kakEnter(d){SFX.door&&SFX.door();kakFade(()=>{const k=d.room,R=KAKD.rooms[k];KK.room=k;KK.door=d;LV.env.nav=kakRoomNav(k);P.x=R.ox;P.z=R.d/2-1.5;P.y=0;P.vy=0;P._nx=undefined;P.yaw=Math.PI;GY=0;G.camDist=3.1;kakView(k)},()=>{G.camYaw=Math.PI})}
function kakExit(){SFX.door&&SFX.door();const d=KK.door;kakFade(()=>{KK.room=-1;LV.env.nav=kakNavV();P.x=d.x+d.nx*1.1;P.z=d.z+d.nz*1.1;P.y=0;P.vy=0;P._nx=undefined;P.yaw=Math.atan2(d.nx,d.nz);GY=kakGH(P.x,P.z);G.camDist=4.6;kakView(-1)},()=>{G.camYaw=P.yaw})}
// ---------- диалоги: реплики по одной (X / Enter / Space / клик — дальше), камера «через плечо» говорящего
function kakSide(n){let best=1,bs=-1;for(const s of[1,-1]){const dx=n.x-P.x,dz=n.z-P.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d,sx=uz*s,sz=-ux*s;let sc=0;
  const mx=(P.x+n.x)/2,mz=(P.z+n.z)/2,R=1.45+d*0.45;for(const p of[[mx+sx*R,mz+sz*R],[mx+sx*R*0.6,mz+sz*R*0.6]]){if(KK.room>=0){const R=KAKD.rooms[KK.room];if(Math.abs(p[0]-R.ox)<R.w/2-0.3&&Math.abs(p[1])<R.d/2-0.3)sc++}else if(navFree(p[0],p[1]))sc++}
  if(sc>bs){bs=sc;best=s}}return best}
function kakDlgCam(n,hero,k,side){const dx=n.x-P.x,dz=n.z-P.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d,sx=uz*side,sz=-ux*side,hy=GY,ny=n.y,mx=(P.x+n.x)/2,mz=(P.z+n.z)/2,off=hero?0.5:-0.5,R=1.45+d*0.45;
 tv1.set(mx+sx*R+ux*off,(hy+ny)/2+1.55,mz+sz*R+uz*off);tv2.set(mx-ux*off*0.45,(hy+1.45+ny+n.eye)/2-0.05,mz-uz*off*0.45);
 kakCamFix(tv1);CS.cam.p.lerp(tv1,k);CS.cam.l.lerp(tv2,k)}
// L: [кто, текст, f?] — кто 'A' = Акира; или {act:(u)=>готово?, n,t} — сценарная вставка
function kakTalk(n,L,onEnd){let i=-1,t0=0,side=kakSide(n);const H0=CS;
 const next=t=>{i++;t0=t;n.talk=0;P.csClip=null;if(i>=L.length){csEnd();n.talk=0;if(onEnd)onEnd();return}const l=L[i];if(Array.isArray(l)){if(l[2])l[2]();CS.subs=[{n:l[0]==='A'?'Акира':l[0],t:l[1],a:t,b:1e9}]}else{CS.subs=l.t?[{n:l.n,t:l.t,a:t,b:1e9}]:[];if(l.f)l.f()}};
 csStart('kakTalk',t=>{const H=CS.H;CS.bars=Math.min(1,t/12);CS.hint='X / Enter — дальше';
  if(t===1){CS.cam.p.copy(camera.position);const l0=new V3();camera.getWorldDirection(l0);CS.cam.l.copy(l0.multiplyScalar(4).add(camera.position));const d=Math.hypot(n.x-P.x,n.z-P.z);if(d>1.6&&!n.forge){const k=(d-1.25)/d;H.to=[P.x+(n.x-P.x)*k,P.z+(n.z-P.z)*k];H.spd=0.03}next(t)}
  if(!H.to){H.yaw=Math.atan2(n.x-P.x,n.z-P.z);H.yawK=0.15}n.yaw=turn(n.yaw,Math.atan2(P.x-n.x,P.z-n.z),0.08);
  const l=L[i];if(!l)return;const u=t-t0;
  if(Array.isArray(l)){const hs=l[0]==='A';n.talk=hs?0:1;if(hs)P.csClip={n:'talk',t:u%104,w:0.85};else P.csClip=null;kakDlgCam(n,hs,t<20?0.12:0.06,side);
   if(u>14&&(hit('KeyX')||hit('Enter')||hit('Space')||MP[0]))next(t)}
  else{CS.hint=null;if(l.act(u,n,side))next(t)}},null)}
function kakTalkTo(n){const K=G.kak,c=K.n[n.id]=(K.n[n.id]||0)+1;
 if(n.id==='sarah'){if(c===1)return kakTalk(n,[['Сара','Акира?! Боги… Мы думали, тебя забрал тот разлом над холмами.'],['A','Я жив, Сара. А деревня… её не тронули?'],
   ['Сара','Пока нет. Гэнма обходят долину — старики говорят, её хранит колодец.'],['Сара','Только колодец давно высох. Теперь там просто дыра… да кузня рядом.'],
   ['A','А отцовский дом?'],['Сара','Стоит. Я подметаю крыльцо каждую весну — ждала, что вернёшься.'],['Сара','Загляни в таверну к Гурцу — он знает все дороги. И береги себя.']]);
  return kakTalk(n,[['Сара',['Заходи, когда захочешь. Чайник у меня всегда горячий.','Ночами над холмами опять зарево… Не к добру это.','Мика опять бегала к кузне. Глаз да глаз за ней.'][c%3]]])}
 if(n.id==='orc'){if(!K.map)return kakTalk(n,[['Гурц','Хо! Мечник с двумя ножнами и одним мечом. Видал я такое — к беде.'],['A','Я здесь родился. Просто давно не был дома.'],
   ['Гурц','Тогда заблудишься быстрее меня. Деревня разрослась, пока тебя носило.'],['Гурц','Держи — сам рисовал, пока ждал караван. Тут все дома и кузня.',()=>{K.map=true;G.hasKakMap=true;SFX.paper&&SFX.paper();pop('Получена карта деревни — M','#ffd27a')}],
   ['A','Спасибо, Гурц.'],['Гурц','Не за что. И загляни к малой Мике — она всё про всех знает.']]);
  return kakTalk(n,[['Гурц',['Карта при тебе? Жми M — и не теряйся.','Караван опаздывает третий день. Дороги нынче злые.','Эль кончился, остался только саке. Будешь?'][c%3]]])}
 if(n.id==='girl'){if(!K.girl)return kakTalk(n,[['Мика','Ой! Ты тот самурай? У тебя одни ножны пустые.'],['A','Глазастая. Да, мой клинок Ёи сломался в бою.'],
   ['Мика','А я знаю, кто починит! Неподалёку, у дыры, что раньше была колодцем…'],['Мика','…там кузница. Кузнец Рэн всё время что-то куёт — даже ночью стучит!'],
   ['Мика','Загляни к ней. Только не говори, что это я тебя послала. Ладно — говори!']],()=>{K.girl=true;kakShowSmith()});
  return kakTalk(n,[['Мика',K.fixed?'Починила, да?! Я же говорила — Рэн лучшая!':'Ну что, был у Рэн? Слышишь — опять стучит!']])}}
// ---------- катсцена: камера плавно летит от дома Мики к кузнецу у старого колодца
function kakShowSmith(){const D=KAKD.doors.find(d=>d.id==='F')||KAKD.doors[0],S=KAKD.smithy.pts,A=S.anvil,T=S.talk;const room=KK.room,R=room>=0?KAKD.rooms[room]:null;
 const p0=[D.x+D.nx*3.5,D.y+2.6,D.z+D.nz*3.5],l0=[D.x+D.nx*9,D.y+1.8,D.z+D.nz*9],p1=[T[0]+2.2,T[1]+1.9,T[2]-2.4],l1=[A[0],A[1]+0.2,A[2]];
 csStart('kakCam',t=>{CS.bars=1;
  if(t<=22){CS.fade=t/22;return}
  if(t===23)kakView(-1);
  const k=ek(t,60,330),lk=ek(t,30,170),hk=Math.sin(Math.PI*k);
  cam([lerp(p0[0],p1[0],k),lerp(p0[1],p1[1],k)+hk*5,lerp(p0[2],p1[2],k)],[lerp(l0[0],l1[0],lk),lerp(l0[1],l1[1],lk),lerp(l0[2],l1[2],lk)]);
  CS.fade=t<60?1-(t-23)/37:t>400?Math.min(1,(t-400)/22):0;
  if(t===70)csSay('Мика','Вон там, у старого колодца. Слышишь молот? Это Рэн!',70,390);
  if(t===300)pop('Кузница Рэн отмечена на карте','#ffd27a');
  if(t===423){kakView(room);if(R){CS.cam.p.set(P.x+Math.sin(P.yaw)*1.6+0.5,1.7,P.z+Math.cos(P.yaw)*1.6);CS.cam.l.set(P.x,1.4,P.z)}}
  if(t>423)CS.fade=Math.max(0,1-(t-423)/20);if(t>=445)csEnd([['Юки','Кузница у старого колодца. Пойдём к ней, Акира.']])},()=>{kakView(room);csEnd()})}
// ---------- кузнец: починка Ёи (первый раз) и улучшение клинков
function kakSmith(){const S=KK.smith,K=G.kak;if(!S)return;
 if(!K.girl)return kakTalk(S,[['Рэн','Не стой над душой — металл остывает.'],['A','…Зайду позже.']]);
 if(K.fixed)return kakForge();
 const T=KAKD.smithy.pts.talk;let hilt=null;
 kakTalk(S,[['A','Девочка, Мика, сказала, что ты можешь починить мою катану.'],['Рэн','Мика, значит… Болтушка. Ну, показывай. Насколько всё плохо?'],
  {n:'',t:'',act:(u,n,side)=>{if(u===1){hilt=itemModel('yoihilt');scene.add(hilt);KK.hilt=hilt;hilt.visible=false}if(u===26)hilt.visible=true;P.csClip={n:'offer',t:Math.min(u,79)};kakDlgCam(n,true,0.05,side);return u>=95}},
  {n:'Акира',t:'Вот. Ёи. Клинок разбился о Мукуро-муся.',act:(u,n,side)=>{P.csClip={n:'offer',t:79};kakDlgCam(n,true,0.05,side);return u>20&&(hit('KeyX')||hit('Enter')||hit('Space')||MP[0])}},
  {n:'Рэн',t:'Хм… Сталь старая, ковка отцовская. Такую не выбрасывают.',act:(u,n,side)=>{n.talk=1;P.csClip={n:'offer',t:79};kakDlgCam(n,false,0.06,side);return u>20&&(hit('KeyX')||hit('Enter')||hit('Space')||MP[0])}},
  ['Рэн','Починю. Но меч, что побывал в разломе, сам не успокоится.',()=>{if(KK.hilt){scene.remove(KK.hilt);KK.hilt=null}}],
  ['Рэн','Заглядывай ко мне почаще — с душами Гэнма я буду закалять и улучшать твои клинки.'],
  {n:'',t:'',act:(u,n,side)=>kakMontage(u,n,side)},
  ['Рэн','Готово. Держи — и не ломай её снова так скоро.',()=>{G.oneBlade=false;P.hideL=false;takeItem('yoihilt');K.fixed=true;SFX.draw&&SFX.draw(true);pop('Ёи восстановлена — снова путь двух мечей!','#ffd27a')}],
  ['A','…Снова две. Спасибо, Рэн.']],
 ()=>{say('Юки','Две катаны снова вместе. У Рэн можно улучшать клинки за красные души (X у кузницы).')})}
// монтаж: затемнение, кузнец куёт крупным планом (удары, искры), затемнение
function kakMontage(u,n,side){const A=KAKD.smithy.pts.anvil;n.talk=0;n.yaw=n.yaw0;n.spd=1.1;
 if(u<20){CS.fade=u/20;return false}
 if(u===20){n.ft=0;const a=0.6;CS.cam.p.set(A[0]+Math.sin(a)*1.6,A[1]+0.55,A[2]-Math.cos(a)*1.6);CS.cam.l.set(A[0],A[1]+0.1,A[2]+0.2)}
 const k=(u-20)/300;if(u<330){CS.cam.p.set(A[0]+Math.sin(0.6+k*0.9)*(1.7-k*0.3),A[1]+0.5+k*0.3,A[2]-Math.cos(0.6+k*0.9)*(1.7-k*0.3));CS.cam.l.set(A[0],A[1]+0.15,A[2]+0.15)}
 CS.fade=u<45?1-(u-20)/25:u>300?Math.min(1,(u-300)/20):0;if(u===60)csSay('','Рэн раздувает горн. Час за часом звенит наковальня…',CS.t,CS.t+230);
 if(u===330){n.spd=0.6;P.x=KAKD.smithy.pts.talk[0];P.z=KAKD.smithy.pts.talk[2]-0.15;P.yaw=0;GY=kakGH(P.x,P.z);kakDlgCam(n,false,1,side)}
 if(u>330)CS.fade=Math.max(0,1-(u-330)/20);return u>=350}
// улучшение: 1 — Акацуки (правая), 2 — Ёи (левая); цена растёт с уровнем, максимум 5
const FORGE_MAX=5,forgeCost=l=>30*(l+1);
function kakForge(){const S=KK.smith,T=KAKD.smithy.pts.talk;let msg=['Рэн','Ну, что сегодня закаляем?'],mt=0;
 csStart('forge',t=>{const H=CS.H;CS.bars=Math.min(1,t/12);S.talk=0;
  if(t===1){CS.cam.p.copy(camera.position);const l0=new V3();camera.getWorldDirection(l0);CS.cam.l.copy(l0.multiplyScalar(4).add(camera.position))}
  H.yaw=Math.atan2(S.x-P.x,S.z-P.z);H.yawK=0.15;tv1.set(P.x-1.3*Math.sin(H.yaw)+0.9*Math.cos(H.yaw),GY+1.8,P.z-1.3*Math.cos(H.yaw)-0.9*Math.sin(H.yaw));kakCamFix(tv1);tv2.set(S.x,S.y+1.1,S.z);CS.cam.p.lerp(tv1,0.08);CS.cam.l.lerp(tv2,0.08);
  CS.forge={msg,mt:t-mt};
  if(t<10)return;
  for(const [key,s] of[['Digit1','R'],['Digit2','L'],['Numpad1','R'],['Numpad2','L']])if(hit(key)){const l=G.forge[s],c=forgeCost(l),nm=s==='R'?'Акацуки':'Ёи';
   if(l>=FORGE_MAX)msg=['Рэн',nm+' уже на пределе. Лучше я не скую.'];else if(G.souls.r<c)msg=['Рэн','Не хватает душ. Нужно '+c+' красных — у тебя '+G.souls.r+'.'];
   else{G.souls.r-=c;G.forge[s]++;msg=['Рэн',nm+' закалена: урон +'+(G.forge[s]*10)+'%.'];kakStrike();sparks(P.x,GY+1.0,P.z,30,[1,0.8,0.4]);SFX.anvil&&SFX.anvil(1);pop(nm+' — уровень '+G.forge[s],'#ffd27a')}mt=t}
  if(hit('KeyX')||hit('Escape')||hit('Enter')){CS.forge=null;csEnd()}},null)}
function drawForge(){const F=CS.forge;if(!F)return;const w=560,h=270,x0=W/2-w/2,y0=H*0.5-h/2-30;X.fillStyle='rgba(18,12,8,0.86)';X.fillRect(x0,y0,w,h);X.strokeStyle='#8a6a3a';X.lineWidth=2;X.strokeRect(x0+6,y0+6,w-12,h-12);
 X.textAlign='center';X.fillStyle='#e6c26a';X.font='bold 24px Georgia,serif';X.fillText('Кузница Рэн',W/2,y0+42);X.font='15px Georgia,serif';X.fillStyle='#cdb98e';X.fillText('Красных душ: '+G.souls.r,W/2,y0+66);
 const row=(i,s,nm)=>{const l=G.forge[s],y=y0+104+i*54;X.textAlign='left';X.fillStyle='#f2ede4';X.font='bold 19px Georgia,serif';X.fillText((i+1)+' — '+nm,x0+34,y);
  for(let k=0;k<FORGE_MAX;k++){X.fillStyle=k<l?'#e6a040':'rgba(230,200,150,0.18)';X.fillRect(x0+300+k*22,y-14,16,16)}
  X.font='14px Georgia,serif';X.fillStyle='#bfb19a';X.fillText(l>=FORGE_MAX?'предел — урон +'+l*10+'%':'урон +'+l*10+'% → +'+(l+1)*10+'% · '+forgeCost(l)+' красных душ',x0+34,y+20)};
 row(0,'R','Акацуки (правая)');row(1,'L','Ёи (левая)');
 X.textAlign='center';X.font='italic 16px Georgia,serif';X.fillStyle=F.mt<180?'#f0e0c0':'rgba(240,224,192,0.6)';X.fillText(F.msg[0]+': '+F.msg[1],W/2,y0+h-30);
 X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.55)';X.fillText('1 / 2 — улучшить · X / Esc — уйти',W/2,y0+h+22);X.textAlign='left'}
// ---------- карта деревни (M): рисунок сверху (kak.py), повёрнут к виду камеры по умолчанию (+z вверх, +x влево)
const kakImg=new Image();kakImg.src=KAKMAP;
function drawKakMap(){X.fillStyle='rgba(0,0,0,0.78)';X.fillRect(0,0,W,H);const N=KAKD.nav,x0=N.x0,x1=N.x0+N.w*N.cs,z0=N.z0,z1=N.z0+N.h*N.cs,s=Math.min((W-180)/(x1-x0),(H-190)/(z1-z0)),cx=W/2,cy=H/2+8,xc=(x0+x1)/2,zc=(z0+z1)/2,pw=(x1-x0)*s,ph=(z1-z0)*s;
 const SX=x=>cx-(x-xc)*s,SY=z=>cy-(z-zc)*s;X.fillStyle='#d9c9a3';X.fillRect(cx-pw/2-24,cy-ph/2-24,pw+48,ph+48);X.fillStyle='#5a3a1a';X.fillRect(cx-pw/2-34,cy-ph/2-36,pw+68,12);X.fillRect(cx-pw/2-34,cy+ph/2+24,pw+68,12);
 if(kakImg.complete){X.save();X.translate(cx,cy);X.rotate(Math.PI);X.globalAlpha=0.92;X.drawImage(kakImg,-pw/2,-ph/2,pw,ph);X.restore();X.globalAlpha=1}
 X.textAlign='center';X.fillStyle='#e6d2a8';X.font='bold 22px Georgia,serif';X.fillText('Родная деревня',cx,cy-ph/2-46);
 const mark=(x,z,c,t,r=6)=>{X.fillStyle=c;X.beginPath();X.arc(SX(x),SY(z),r,0,7);X.fill();X.strokeStyle='#2a1c10';X.lineWidth=1.5;X.stroke();X.font='bold 13px Georgia,serif';X.fillStyle='#24180c';X.fillText(t,SX(x),SY(z)-r-5)};
 for(const d of KAKD.doors)mark(d.x,d.z,'#c98a3a',KDOOR[d.id]);const S=KAKD.smithy.pts;mark(S.anvil[0],S.anvil[2],G.kak&&G.kak.girl?'#e04020':'#8a6a4a','Кузница Рэн',7);mark(0,0,'#5a6a7a','Старый колодец',5);
 const sp=KAKD.spawn;mark(sp[0],sp[1],'#6a8a4a','Ворота',5);
 let px=P.x,pz=P.z,yw=P.yaw;if(KK.room>=0&&KK.door){px=KK.door.x;pz=KK.door.z;yw=Math.atan2(-KK.door.nx,-KK.door.nz)}
 const ax=SX(px),ay=SY(pz),fx=-Math.sin(yw),fy=-Math.cos(yw);X.fillStyle='#b01810';X.beginPath();X.moveTo(ax+fx*13,ay+fy*13);X.lineTo(ax-fx*7+fy*7,ay-fy*7-fx*7);X.lineTo(ax-fx*7-fy*7,ay-fy*7+fx*7);X.closePath();X.fill();
 X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.7)';X.fillText('M / Esc — закрыть',cx,cy+ph/2+62);X.textAlign='left'}
// ---------- катсцена после «Забытого дома»: воспоминание о деревне (сепия, облёт), мысль Акиры, перенос в деревню
function kakMemory(){const ci=CH.findIndex(c=>c&&c.kak);if(ci<0){G.winT=1;return}
 const sep=()=>{const U=GRADE.uniforms;U.uTint.value.set(1.16,0.98,0.74);U.uShadow.value.set(0.03,0.015,0);U.uSat.value=0.12;U.uCon.value=1.12};
 csStart('kakMem',t=>{CS.bars=1;
  if(t<=50){CS.fade=t/50;CS.fadeC='0,0,0';return}
  if(t===51){G.kak={map:false,girl:false,fixed:false,n:{}};G.hasKakMap=false;loadChapter(ci);G.card=null;G.subs=[];G.cp={chap:ci,wave:0,mi:0,oni:0};sep();P.csHide=true;P.drawn=false;P.state='idle'}
  const k=(t-51)/400,a=-0.9+k*1.5,cx=-16,cz=-6,R=46-k*10;cam([cx+Math.sin(a)*R,30-k*10,cz+Math.cos(a)*R],[cx+k*6,2,cz]);
  if(t===120)csSay('Акира (мысли)','Несмотря на эту неразбериху… хотя бы моя деревня ещё цела?',120,380);
  CS.fade=t<110?1-(t-51)/59:t>420?Math.min(1,(t-420)/28):0;CS.fadeC=t>400?'255,246,228':'0,0,0';
  if(t===450){setGrade('kak');P.csHide=false;const sp=KAKD.spawn;P.x=sp[0];P.z=sp[1];P.yaw=1.85;GY=kakGH(P.x,P.z);CS.cam.p.set(P.x-2.4,GY+2.1,P.z+1.0);CS.cam.l.set(P.x,GY+1.4,P.z);SFX.warp&&SFX.warp()}
  if(t>450)CS.fade=Math.max(0,1-(t-450)/40);
  if(t>=495){csEnd();G.card={t:0,title:CH[ci].title,name:CH[ci].name}}},null)}
