// v0.15: ГЛАВА 7 «Перевал Тишины» (данные — gP.js): горная локация с высотами, ветер-порывы,
// алтарь ветра, свободное исследование без волн; новые враги: Тэнгу-ямабуси (tg), Ива-ёкай (iwa), Они-яри (yari),
// страж перевала Тэнгу-старейшина (tgen); лестница в «Родной деревне» ведёт на перевал; карта мира (M) — свободное перемещение.
let PY=0;
const PK={hint:0,windT:240,gustT:0,windDir:0,groups:[],boss:null,cleared:0,mats:{}};
const PKCH=()=>CH.findIndex(c=>c&&c.peak);
const KAKCH=()=>CH.findIndex(c=>c&&c.kak);
function pkNavV(){const N=PEAKD.nav;if(!N.g){const b=atob(N.b),n=N.w*N.h,g=new Uint8Array(n);for(let k=0;k<n;k++)g[k]=(b.charCodeAt(k>>3)>>(7-(k&7)))&1;N.g=g;N.dist=new Int32Array(n).fill(-1);N.q=new Int32Array(n);N.pc=-1;N.ft=-99;
  const s=atob(N.gh),u=new Uint16Array(n);for(let k=0;k<n;k++)u[k]=s.charCodeAt(2*k)|(s.charCodeAt(2*k+1)<<8);N.G=u;navHB(N)}return N}
function pkGH(x,z){const N=pkNavV();let fx=(x-N.x0)/N.cs-0.5,fz=(z-N.z0)/N.cs-0.5;fx=clamp(fx,0,N.w-1.001);fz=clamp(fz,0,N.h-1.001);const i=fx|0,j=fz|0,a=fx-i,b=fz-j,W=N.w,U=N.G,k=j*W+i;
 return((U[k]*(1-a)+U[k+1]*a)*(1-b)+(U[k+W]*(1-a)+U[k+W+1]*a)*b)/100+N.ho}
// ---------- материалы и риги новых врагов
function pkMats(pre){const out={};for(const k in(ASSET.parts[pre]||{}))for(const it of ASSET.parts[pre][k]){const m=it.mat;if(m&&!out[m.name]){const c=m.clone();out[m.name]=c}}return out}
function pkBuild(pre,hipsY,off,mm){
 const add=(g,p)=>addPart(g,pre,p,{mat:m=>(m&&mm[m.name])||m});
 const root=new Group(),hips=new Group();hips.position.y=hipsY;root.add(hips);add(hips,'hips');
 const legs=[];
 for(const [sd,kn] of[[-1,'R'],[1,'L']]){const th=new Group();th.position.set(sd*off.thx,0,0);hips.add(th);add(th,'thigh'+kn);
  const sh=new Group();sh.position.set(...off.shin);th.add(sh);add(sh,'shin'+kn);legs.push(th)}
 const torso=new Group();torso.position.set(...off.torso);hips.add(torso);add(torso,'torso');
 const neck=new Group();neck.position.set(...off.neck);torso.add(neck);add(neck,'neck');
 const arms={};
 for(const [sd,kn] of[[-1,'R'],[1,'L']]){const sh=new Group();sh.rotation.order='YXZ';sh.position.set(sd*off.upx,off.upy,off.upz);torso.add(sh);add(sh,'upperArm'+kn);
  const el=new Group();el.position.set(sd*off.fox,off.foy,off.foz);sh.add(el);add(el,'foreArm'+kn);
  const hd=new Group();hd.position.set(sd*off.hax,off.hay,off.haz);el.add(hd);add(hd,'hand'+kn);arms[kn]={sh,el,hand:hd}}
 const gl=glintSprite();scene.add(gl);
 const tip=new THREE.Object3D();arms.R.hand.add(tip);tip.position.set(0,-0.12,0.22);
 const mat=Object.values(mm).find(m=>m.emissive)||Object.values(mm)[0]||null;
 return{root,hips,torso,neck,legs,arms,gl,tip,mat,mm,upper:torso,head:neck}
}
function rigTengu(){const r=pkBuild('TG',1.02,{thx:0.11,shin:[0,-0.4,0.03],torso:[0,0.24,0],neck:[0,0.62,0],upx:0.2,upy:0.5,upz:0,fox:0.3,foy:0,foz:0.05,hax:0.12,hay:-0.02,haz:0.1},pkMats('TG'));r.kind='tengu';return r}
function rigIwa(){const r=pkBuild('IW',1.1,{thx:0.22,shin:[0,-0.42,0],torso:[0,0.3,0],neck:[0,0.5,0],upx:0.5,upy:0.34,upz:0,fox:0.22,foy:-0.36,foz:0.04,hax:0.06,hay:-0.4,haz:0},pkMats('IW'));r.kind='iwa';return r}
function rigYari(){const r=pkBuild('YA',0.95,{thx:0.12,shin:[0,-0.4,0.03],torso:[0,0.3,0],neck:[0,0.6,0],upx:0.26,upy:0.5,upz:0,fox:0.08,foy:-0.36,foz:0.02,hax:0.04,hay:-0.36,haz:0.02},pkMats('YA'));r.kind='yari';
 if(ASSET.parts.YA&&ASSET.parts.YA.prop){const mm=r.mm;addPart(r.arms.R.hand,'YA','prop',{mat:m=>(m&&mm[m.name])||m});const s=r.arms.R.hand.children[r.arms.R.hand.children.length-1];
  if(s&&s.name&&/spear/.test(s.name)){r.tip.position.set(0,0,1.4)}}
 return r}
// ---------- анимация новых врагов
function syncNewEnemy(e,t){const r=e.rig,wind=e.state==='wind',k=wind?ease(e.st/e.atk.wind):0,act=e.state==='act',rec=e.state==='rec';
 const mv=(e.state==='move'||e.state==='enter')?1:0,ph=e.anim*0.11;
 if(r.kind==='tengu'){r.legs[0].rotation.x=Math.sin(ph)*0.35*mv;r.legs[1].rotation.x=-Math.sin(ph)*0.35*mv;
  r.torso.rotation.x=0.14+mv*0.08;r.root.position.y+=Math.abs(Math.cos(ph))*0.04*mv;
  const fl=Math.sin(t*2.1)*0.3+(e.y>0.4?Math.sin(t*1.3)*0.45:0);
  for(const s of['L','R']){const a=r.arms[s],sd=s==='L'?1:-1;a.sh.rotation.z=sd*(0.45+fl*0.5);a.sh.rotation.x=wind?-0.7*k:act?0.6:rec?0.25:0.1;a.el.rotation.x=-0.35}
  r.neck.rotation.x=wind?-0.25*k:0.05}
 else if(r.kind==='iwa'){r.legs[0].rotation.x=Math.sin(ph)*0.22*mv;r.legs[1].rotation.x=-Math.sin(ph)*0.22*mv;r.torso.rotation.x=0.06;
  const a=r.arms.R;a.sh.rotation.x=wind?-1.7*k:act?1.2:rec?lerp(1.2,0,Math.min(1,e.st/e.atk.rec)):0;a.el.rotation.x=-0.3;
  const b=r.arms.L;b.sh.rotation.x=wind?-0.6*k:act?-0.25:0;b.el.rotation.x=-0.45;
  r.hips.rotation.z=Math.sin(ph)*0.06*mv}
 else{r.legs[0].rotation.x=Math.sin(ph)*0.4*mv;r.legs[1].rotation.x=-Math.sin(ph)*0.4*mv;r.torso.rotation.x=0.1;
  const a=r.arms.R;a.sh.rotation.x=wind?lerp(0.25,-1.5,k):act?-0.25:rec?0.15:0.25;a.el.rotation.x=wind?lerp(-0.5,0.35,k):-0.5;
  const b=r.arms.L;b.sh.rotation.x=-0.4;b.sh.rotation.z=0.5;b.el.rotation.x=-1.15;r.neck.rotation.y=Math.sin(t*0.6)*0.05}}
// ---------- ИИ
function tenguBlade(e){e.rig.tip.getWorldPosition(tv1);const tx=P.x-tv1.x,ty=1.15+P.y-tv1.y,tz=P.z-tv1.z,L=Math.hypot(tx,ty,tz)||1,sp=0.36;
 const m=new Mesh(new THREE.TorusGeometry(0.34,0.04,4,16,Math.PI*1.15),new MB({color:0xcfe8ff,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));
 m.rotation.x=Math.PI/2;scene.add(m);
 proj.push({k:'wind',x:tv1.x,y:tv1.y,z:tv1.z,vx:tx/L*sp,vy:ty/L*sp,vz:tz/L*sp,life:110,dmg:e.atk.dmg,m,done:false});
 SFX.swingL&&SFX.swingL()}
function updTengu(e,ts,d,ty){const sp=e.d.spd/60;e.st+=ts;e.gy=pkGH(e.x,e.z);
 if(e.state==='intro'){e.y=lerp(e.y,e.d.hover||1.7,0.05);e.yaw=turn(e.yaw,ty,0.05);if(d<17){e.state='move';e.st=0;e.cd=40;if(e.d.boss){G.bossBar=e;SFX.bell();say('Тэнгу-старейшина','Тишину перевала не тревожат безнаказанно.')}}return}
 e.y=lerp(e.y,e.d.hover||1.7,0.05);
 switch(e.state){
 case'move':{e.yaw=turn(e.yaw,ty,0.09);const keep=e.d.keep||7;
  if(d>keep+2.5){e.x+=Math.sin(e.yaw)*sp*ts;e.z+=Math.cos(e.yaw)*sp*ts}
  else if(d<keep-2.5){e.x-=Math.sin(e.yaw)*sp*ts*0.8;e.z-=Math.cos(e.yaw)*sp*ts*0.8}
  else{const s=Math.sin(e.anim*0.02)*sp*0.8;e.x+=-Math.cos(e.yaw)*s*ts;e.z+=Math.sin(e.yaw)*s*ts}
  e.cd-=ts;if(e.cd<=0&&P.state!=='dead'){if(d<4.4){e.atk={k:'dive',wind:20,act:14,rec:30,dmg:20,reach:1.7};e.state='wind'}else{e.atk={k:'blade',wind:30,act:2,rec:26,dmg:e.d.boss?18:14,reach:0};e.state='wind'}e.st=0;e.hitDone=false}break}
 case'wind':{e.yaw=turn(e.yaw,ty,0.06);if(e.st>=e.atk.wind){e.state='act';e.st=0;e.hitDone=false;
   if(e.atk.k==='dive'){e.vx=Math.sin(e.yaw)*0.24;e.vz=Math.cos(e.yaw)*0.24;SFX.swingR()}else SFX.swingL()}break}
 case'act':{if(e.atk.k==='dive'){if(!e.hitDone&&d<e.atk.reach+0.5&&P.y<2.4){e.hitDone=true;hitPlayer(e,e.atk.dmg,{issen:true})}if(e.st>=e.atk.act){e.state='rec';e.st=0}}
  else{if(e.st>=1&&!e.hitDone){e.hitDone=true;tenguBlade(e)}if(e.st>=e.atk.act){e.state='rec';e.st=0}}break}
 case'rec':{if(e.st>=e.atk.rec){e.state='move';e.st=0;e.cd=rnd(50,110)}break}
 case'stag':{e.y=lerp(e.y,0.7,0.08);if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=rnd(30,70)}break}}}
function updIwa(e,ts,d,ty){const sp=e.d.spd/60;e.st+=ts;e.gy=pkGH(e.x,e.z);
 if(e.state==='stag'){e.armor=0;e.armorT=300}else if(e.armorT>0){e.armorT-=ts;if(e.armorT<=0)e.armor=1}
 switch(e.state){
 case'move':{e.yaw=turn(e.yaw,ty,0.045);
  if(d>e.d.range){e.x+=Math.sin(e.yaw)*sp*ts;e.z+=Math.cos(e.yaw)*sp*ts}
  e.cd-=ts;if(e.cd<=0&&d<e.d.range+0.7&&P.state!=='dead'){e.atk=e.d.atk[0];e.state='wind';e.st=0;e.hitDone=false}break}
 case'wind':{e.yaw=turn(e.yaw,ty,0.03);if(e.st>=e.atk.wind){e.state='act';e.st=0;SFX.swingR();G.shake=Math.max(G.shake,0.1)}break}
 case'act':{if(!e.hitDone&&e.st>=4){e.hitDone=true;const ax=e.x+Math.sin(e.yaw)*e.atk.reach*0.55,az=e.z+Math.cos(e.yaw)*e.atk.reach*0.55;
   if(Math.hypot(P.x-ax,P.z-az)<1.9&&P.y<1.5)hitPlayer(e,e.atk.dmg,{unblock:true});
   dust(ax,az,12);sparks(ax,0.25,az,16,[1,0.7,0.35]);flashL(ax,0.6,az,0xff9040,4,8);G.shake=Math.max(G.shake,0.2)}
  if(e.st>=e.atk.act){e.state='rec';e.st=0}break}
 case'rec':{if(e.st>=e.atk.rec){e.state='move';e.st=0;e.cd=rnd(60,120)}break}
 case'stag':{if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=rnd(20,50)}break}}}
function updYari(e,ts,d,ty){const sp=e.d.spd/60;e.st+=ts;e.gy=pkGH(e.x,e.z);
 switch(e.state){
 case'move':{e.yaw=turn(e.yaw,ty,0.07);
  if(d>e.d.range){e.x+=Math.sin(e.yaw)*sp*ts;e.z+=Math.cos(e.yaw)*sp*ts}
  e.cd-=ts;if(e.cd<=0&&d<e.d.range+1.6&&P.state!=='dead'){e.atk=e.d.atk[0];e.state='wind';e.st=0;e.hitDone=false}break}
 case'wind':{e.yaw=turn(e.yaw,ty,0.05);if(e.st>=e.atk.wind){e.state='act';e.st=0;e.vx+=Math.sin(e.yaw)*0.09;e.vz+=Math.cos(e.yaw)*0.09;SFX.swingR()}break}
 case'act':{if(!e.hitDone&&d<e.atk.reach&&((P.x-e.x)/d*Math.sin(e.yaw)+(P.z-e.z)/d*Math.cos(e.yaw))>0.35){e.hitDone=true;hitPlayer(e,e.atk.dmg,{issen:true})}
  if(e.st>=e.atk.act){e.state='rec';e.st=0}break}
 case'rec':{if(e.st>=e.atk.rec){e.state='move';e.st=0;e.cd=rnd(40,90)}break}
 case'stag':{if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=20}break}}}
// ---------- механики: броня ивы, щит они-яри
function iwaDmgMod(e,dmg,o){if(e.armor&&!o.gb&&!o.issen){sparks(e.x,1.2,e.z,10,[1,0.68,0.32]);if(Math.random()<0.25)SFX.clang();return Math.max(1,dmg*0.22)}return dmg}
function yariDmgPre(e,dx,dz,o){if(!e.d.guard||o.gb||o.issen||P.muso>0||e.state==='stag')return false;
 const L=Math.hypot(dx,dz)||1,dot=(dx/L)*Math.sin(e.yaw)+(dz/L)*Math.cos(e.yaw);
 if(dot>0.35){sparks(e.x+Math.sin(e.yaw)*0.45,1.2,e.z+Math.cos(e.yaw)*0.45,110,[0.75,0.82,1]);SFX.clang();G.hitstop=Math.max(G.hitstop,3);
  if(!e.guardMsg){e.guardMsg=1;pop('Щит! Зайди сбоку, сбей «крестом» или Иссэном','#bba')}
  e.cd=Math.min(e.cd,12);P.vx-=dx*0.05;P.vz-=dz*0.05;return true}
 return false}
// ---------- окружение перевала
function buildPeakEnv(g,env){locAdd(g,'peak');locAdd(g,'peakd');
 const L=(i,x,y,z,c,b,d)=>{const l=STATIC[i];l.position.set(x,y,z);l.color.set(c);l.userData.base=b;l.intensity=b;l.distance=d};
 const A=PEAKD.altar;L(0,A[0],A[1]+1.1,A[2],0x8ac8ff,5,13);L(1,A[0]+2.6,PEAKD.plat+1.4,A[2],0xffb060,2.4,9);
 L(2,PEAKD.shrine[0],PEAKD.plat+2.0,PEAKD.shrine[2]+1.6,0xffa040,2.6,10);L(3,0,1.6,-14,0xffb070,2.2,9);
 env.peak=true}
// ---------- глава
function pkGroups(){PK.groups=[];
 const SP=PEAKD.spawns,plan=[['tg',0],['iwa',1],['yari',2],['tg',3],['iwa',4],['yari',5],['tg',6],['iwa',7]];
 for(const [t,i] of plan){const s=SP[i%SP.length];const e=mkEnemy(t,s[0]+rnd(-1.4,1.4),s[1]+rnd(-1.4,1.4));e.state='move';e.st=0;e.cd=rnd(70,220);e.roam=true;e.gy=pkGH(e.x,e.z);e.y=0;enemies.push(e);PK.groups.push(e)}
 const b=mkEnemy('tgen',PEAKD.shrine[0],PEAKD.shrine[2]-4.0);b.gy=pkGH(b.x,b.z);b.y=0;b.boss=true;enemies.push(b);PK.boss=b}
function pkLoad(cp){LV.peak=true;PK.cleared=0;PK.boss=null;PK.groups=[];PK.windT=240;PK.gustT=0;
 LV.env.nav=pkNavV();if(LV.env.gate)LV.env.gate.t.visible=false;
 const sp=PEAKD.spawn;P.x=sp[0];P.z=sp[1];P.yaw=0;G.camYaw=0;P._nx=undefined;P.y=0;P.vy=0;PY=pkGH(P.x,P.z);GY=PY;G.camDist=4.6;
 // зеркала-чекпоинты: у подножия и алтарь на площадке
 const mg=new Group();mg.position.y=pkGH(PEAKD.spawn[0]+1.6,PEAKD.spawn[1]-1.2);ENV.add(mg);
 const m1=makeMirror(mg,PEAKD.spawn[0]+1.6,PEAKD.spawn[1]-1.2,0);
 const ag=new Group();ag.position.y=PEAKD.plat;ENV.add(ag);
 const m2=makeMirror(ag,PEAKD.altar[0]+2.8,PEAKD.altar[2]-0.4,0);
 LV.env.mirrors=[m1,m2];
 pkGroups();
 const mi=(cp&&cp.mi)||0;for(let k=0;k<=mi;k++)activateMirror(LV.env.mirrors[k],true);
 if(cp&&cp.mi){const m=LV.env.mirrors[cp.mi];P.x=m.x+1.4;P.z=m.z;P.oni=cp.oni||0}
 G.cp={chap:G.chap,wave:0,mi,oni:P.oni};
 if(!PK.hint){PK.hint=1;say('Юки','Перевал Тишины. Ветер здесь живой — он толкает в спину и в грудь.');say('Юки','Гэнма расселись по террасам. Можно пройти мимо, но к храму ведёт одна дорога.')}}
function pkWind(ts){const N=pkNavV();
 if(PK.gustT>0){PK.gustT-=ts;const k=Math.sin(Math.PI*clamp(1-PK.gustT/110,0,1)),f=0.85*k,dx=Math.sin(PK.windDir),dz=Math.cos(PK.windDir);
  P.vx+=dx*f*0.07;P.vz+=dz*f*0.07;
  for(const e of enemies)if(!e.dead&&!e.d.boss&&Math.hypot(e.x-P.x,e.z-P.z)<26){e.vx+=dx*f*0.05;e.vz+=dz*f*0.05}}
 else{PK.windT-=ts;if(PK.windT<=0){PK.windT=rnd(360,560);PK.gustT=110;PK.windDir=Math.atan2(P.x*0.001-Math.sin(G.camYaw)*0.3,-1)+rnd(-0.35,0.35);
  pop('Порыв ветра!','#bcd8ff');SFX.wind&&SFX.wind('forest',1.0)}}
 if(G.frame%3===0){const a=PK.windDir,st=PK.gustT>0?1.6:0.55;
  FX.norm.add({x:P.x+rnd(-13,13),y:rnd(0.4,4.2),z:P.z+rnd(-13,13),vx:Math.sin(a)*0.07*st,vy:rnd(-0.012,0.018),vz:Math.cos(a)*0.07*st,life:rnd(110,230),s:rnd(0.025,0.05),r:0.72,gg:0.75,b:0.7,a:0.45,sw:rnd(0,6),w:1.8})}}
function updPeak(ts){PK.tick=(PK.tick||0)+1;PY=pkGH(P.x,P.z);GY=PY;
 pkWind(ts);
 for(const [i,m] of LV.env.mirrors.entries())if(!m.act&&Math.hypot(P.x-m.x,P.z-m.z)<2.1){activateMirror(m);G.cp={chap:G.chap,wave:0,mi:i,oni:P.oni}}
 const b=PK.boss;PK.dbg={tick:PK.tick,dead:!!(b&&b.dead),cl:PK.cleared,mir:!!(LV.env&&LV.env.mirrors&&LV.env.mirrors.length),py:+P.y.toFixed(2)};
 if(b&&!b.dead&&!b.awake&&Math.hypot(P.x-b.x,P.z-b.z)<15){b.awake=1;b.state='move';b.st=0;b.cd=40;G.bossBar=b;SFX.bell();say('Юки','Акира — хозяин перевала проснулся!')}
 if(b&&b.dead&&!PK.cleared){PK.cleared=1;G.bossBar=null;pop('Перевал пройден — путь к храму открыт','#ffd27a');
  say('Юки','Старейшина пал. Тишина вернулась на перевал.')}
 if(PK.cleared&&G.frame%90===0&&!enemies.some(e=>!e.dead&&e.d.boss)){}
 if(P.y<-2)P.y=-2}
function pkNear(){if(CS.on)return null;
 const sp=PEAKD.spawn;
 if(Math.hypot(P.x-sp[0],P.z-sp[1]+2.2)<2.2)return{k:'kak',label:'X — спуститься в Родную деревню',f:()=>pkTravelTo(KAKCH(),'kak')};
 const A=PEAKD.altar;
 if(Math.hypot(P.x-A[0],P.z-A[2])<3.0)return{k:'kak',label:'X — алтарь ветра: отдохнуть',f:pkAltar};
 if(Math.hypot(P.x-PEAKD.shrine[0],P.z-PEAKD.shrine[2])<3.2)return{k:'kak',label:PK.cleared?'X — войти в храм Тишины':'Храм закрыт — тень старейшины не даёт войти',f:pkShrine};
 return null}
function pkAltar(){P.hp=P.max;P.food=3;SFX.bell();activateMirror(LV.env.mirrors[1]);G.cp={chap:G.chap,wave:0,mi:1,oni:P.oni};pop('Алтарь ветра: силы восстановлены','#8ac8ff')}
function pkShrine(){if(!PK.cleared)return;
 say('Акира','Храм Тишины… Здесь ветер молчит.');
 say('Юки','Ты дошёл, Акира. Дальше — Путь Души.');
 pop('Глава 7 пройдена','#ffd27a');G.card={t:0,title:'ГЛАВА 7',name:'Храм Тишины'};
 (G.visited=G.visited||new Set()).add(PKCH())}
function pkFade(fn){csStart('travel',t=>{CS.bars=0;CS.hint=null;if(t<20)CS.fade=t/20;if(t===20)fn();if(t>20)CS.fade=Math.max(0,1-(t-20)/20);if(t>=42)csEnd()},null)}
function pkTravelTo(i,from){if(i<0)return;pkFade(()=>{loadChapter(i);G.card={t:0,title:CH[i].title,name:CH[i].name}})}
// ---------- лестница в «Родной деревне»
const VS=()=>PEAKD.vstairs;
function vstairAdd(g){if(LVok('vstair'))locAdd(g,'vstair')}
function vstairGH(x,z){const V=VS();if(!V)return null;
 if(Math.abs(x-V.base[0])>V.w/2+0.2)return null;
 const z0=V.base[1],zt=z0+V.n*V.depth;
 if(z>=z0&&z<=zt){const k=Math.min(V.n,Math.max(0,Math.floor((z-z0)/V.depth)));return V.base[2]+(k+1)*V.rise}
 if(z>zt&&z<=V.plat.z1&&x>=V.plat.x0&&x<=V.plat.x1)return V.plat.y;
 return null}
function vstairNear(){const V=VS();if(!V)return null;
 if(Math.hypot(P.x-V.gate[0],P.z-V.gate[1])<2.3)return{k:'kak',label:'X — подняться на перевал Тишины',f:vstairTravel};
 return null}
function vstairTravel(){const i=PKCH();if(i<0)return;SFX.door&&SFX.door();pkFade(()=>{loadChapter(i);G.cp={chap:i,wave:0,mi:0,oni:P.oni};G.card={t:0,title:CH[i].title,name:CH[i].name}})}
// ---------- карта мира: свободное перемещение (v0.15)
const TRAVEL=[['Пепел Ивате',0],['Лес Шепчущих Бамбуков',1],['Двор с колоколом',2],['Забытый дом',3],['Родная деревня',4],['Перевал Тишины',5]];
function worldMapOpen(){G.worldMap=true;G.mapOpen=true;G.mapK=false;G.mapSel=Math.max(0,TRAVEL.findIndex(t=>t[1]===G.chap))}
function updWorldMap(){if(!G.worldMap)return false;
 if(hit('ArrowUp')||hit('KeyW'))G.mapSel=(G.mapSel+TRAVEL.length-1)%TRAVEL.length;
 if(hit('ArrowDown')||hit('KeyS'))G.mapSel=(G.mapSel+1)%TRAVEL.length;
 if(hit('KeyK')&&LV.kak&&G.hasKakMap){G.mapK=!G.mapK;return true}
 if(hit('Enter')||hit('Space')||MP[0]){const t=TRAVEL[G.mapSel];G.mapOpen=false;if(t&&t[1]!==G.chap)pkTravelTo(t[1],'map');return true}
 return false}
function drawWorldMap(){X.fillStyle='rgba(0,0,0,0.82)';X.fillRect(0,0,W,H);
 if(G.mapK&&LV.kak&&G.hasKakMap)return drawKakMap();
 const cx=W/2;X.textAlign='center';X.fillStyle='#e6d2a8';X.font='bold 26px Georgia,serif';X.fillText('Путь Акиры',cx,86);
 X.font='14px Georgia,serif';X.fillStyle='rgba(230,220,200,0.6)';X.fillText('↑ / ↓ — выбрать · Enter — идти · M / Esc — закрыть',cx,112);
 const visited=G.visited||new Set();
 TRAVEL.forEach((t,i)=>{const y=168+i*54,sel=i===G.mapSel,here=t[1]===G.chap,ok=visited.has(t[1])||here;
  if(sel){X.fillStyle='rgba(255,210,140,0.14)';X.fillRect(cx-260,y-30,520,44)}
  X.fillStyle=ok?(sel?'#ffe6b0':'#e2d8c4'):'rgba(200,190,170,0.35)';X.font=(sel?'bold ':'')+'20px Georgia,serif';
  X.fillText(t[0],cx-20,y);X.font='14px Georgia,serif';X.fillStyle=here?'#8ad8a0':ok?'rgba(210,200,180,0.7)':'rgba(200,190,170,0.3)';
  X.fillText(here?'здесь':ok?'доступно':'не открыто',cx+150,y)});
 X.textAlign='left';X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.5)';
 X.textAlign='center';X.fillText(LV.kak&&G.hasKakMap?'K — план деревни':'',cx,H-40);X.textAlign='left'}
