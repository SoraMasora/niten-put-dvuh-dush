// v0.16: ГЛАВА 7 «Зелёная пустошь» (данные — gGd.js, модель — blender/ext/green.py из landscape_forest__mountains.glb).
// Старый колодец в «Родной деревне» (X) -> катсцена: прыжок, падение по шахте, приземление на пустоши.
// Врагов нет. Загадка «Три чаши у врат корней» на реквизите оранжереи отшельника (greenhouse_props.glb):
// записка на доске -> найти три верных предмета среди пяти -> разложить по чашам слева направо -> врата открываются, портал дальше.
// Деревья физичны (коллайдеры стволов + nav), земля — сетка высот (герой не проваливается).
const GR={t:0,held:null,items:[],pots:[null,null,null],checkT:0,fails:0,hint:0,grid:null,sky:null,vine:null,seal:null,sealM:[],portd:null,portM:[],sprouts:[],freeze:0,wellCS:0,landed:0};
const GRCH=()=>CH.findIndex(c=>c&&c.green);
const KAKCH=()=>CH.findIndex(c=>c&&c.kak);
const GR_SOL=['shovel','can','book'];
function grNavV(){const N=GREEND.nav;if(!N.g){const b=atob(N.b),n=N.w*N.h,g=new Uint8Array(n);for(let k=0;k<n;k++)g[k]=(b.charCodeAt(k>>3)>>(7-(k&7)))&1;N.g=g;N.dist=new Int32Array(n).fill(-1);N.q=new Int32Array(n);N.pc=-1;N.ft=-99;
  const s=atob(N.gh),u=new Uint16Array(n);for(let k=0;k<n;k++)u[k]=s.charCodeAt(2*k)|(s.charCodeAt(2*k+1)<<8);N.G=u}return N}
function grGH(x,z){const N=grNavV();let fx=(x-N.x0)/N.cs-0.5,fz=(z-N.z0)/N.cs-0.5;fx=clamp(fx,0,N.w-1.001);fz=clamp(fz,0,N.h-1.001);const i=fx|0,j=fz|0,a=fx-i,b=fz-j,W=N.w,U=N.G,k=j*W+i;
 return((U[k]*(1-a)+U[k+1]*a)*(1-b)+(U[k+W]*(1-a)+U[k+W+1]*a)*b)/100+N.ho}
// ---------- коллайдеры: стволы деревьев и реквизит (сетка 4 м)
function grGrid(){if(GR.grid)return GR.grid;const m=new Map();for(const c of GREEND.cols){const k=Math.floor(c[0]/4)*1000+Math.floor(c[1]/4);if(!m.has(k))m.set(k,[]);m.get(k).push(c)}GR.grid=m;return m}
function grPushO(o,pr){const m=grGrid(),ix=Math.floor(o.x/4),iz=Math.floor(o.z/4);
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const L=m.get((ix+a)*1000+iz+b);if(!L)continue;
  for(const c of L){const dx=o.x-c[0],dz=o.z-c[1],d=Math.hypot(dx,dz),r=c[2]+pr;if(d<r){if(d<1e-4){o.x+=r;continue}o.x=c[0]+dx/d*r;o.z=c[1]+dz/d*r}}}
 if(!G.grSolved){const g=GREEND.gate;if(Math.abs(o.x-g[0])<(g[3]||2.3)&&Math.abs(o.z-g[2])<0.5)o.z=g[2]+(o.z>=g[2]?0.5:-0.5)}}
function grCamFix(C){const g=grGH(C.x,C.z)+0.5;if(C.y<g)C.y=g}
// ---------- окружение
function grMatFix(g){g.traverse(o=>{if(!o.isMesh||!o.material)return;const m=o.material;if(/gr_(tree|grass)/.test(m.name||'')){const gs=/grass/.test(m.name);if(gs&&m.map&&!m.map.userData.nm){m.map.userData.nm=1;m.map.minFilter=THREE.LinearFilter;m.map.needsUpdate=true}m.transparent=false;m.alphaTest=gs?0.42:0.5;m.depthWrite=true;m.side=THREE.DoubleSide;m.envMapIntensity=0.3}
  if(/gr_(glow|bud)/.test(m.name||'')){m.toneMapped=false;o.castShadow=false}})}
function buildGreenEnv(g,env){for(const p of['green','grbg','grtree','grgrass','grcamp','grgate','grport','grlamp'])grMatFix(locAdd(g,p,!['grbg','grgrass','grlamp'].includes(p)));
 const sk=locAdd(g,'grsky',false);sk.traverse(o=>{if(o.isMesh){const m=o.material;o.material=new THREE.MeshBasicMaterial({map:m.map||m.emissiveMap,fog:false,depthWrite:false});o.renderOrder=-10;o.receiveShadow=false;o.castShadow=false;o.frustumCulled=false}});GR.sky=sk;
 GR.vine=locAdd(g,'grvine');grMatFix(GR.vine);GR.seal=locAdd(g,'grseal',false);grMatFix(GR.seal);GR.sealM=[];GR.seal.traverse(o=>{if(o.isMesh)GR.sealM.push(o.material)});
 GR.portd=locAdd(g,'grportd',false);grMatFix(GR.portd);GR.portM=[];GR.portd.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.depthWrite=false;o.material.side=THREE.DoubleSide;o.material.emissiveIntensity=0.9;o.material.toneMapped=true;GR.portM.push(o.material)}});GR.portd.visible=false;
 const Lt=(i,x,y,z,c,b,d)=>{const l=STATIC[i];if(!l)return;l.position.set(x,y,z);l.color.set(c);l.userData.base=b;l.intensity=b;l.distance=d};
 const G0=GREEND.gate;Lt(0,G0[0]-5.2,G0[1]+1.5,G0[2]+3.2,0xffc070,1.6,7);Lt(1,G0[0]+5.2,G0[1]+1.5,G0[2]+3.2,0xffc070,1.6,7);
 const Pp=GREEND.portal;Lt(2,Pp[0],Pp[1],Pp[2]+0.6,0x80ffa0,0,12);
 env.green=true}
// ---------- предметы загадки
function grItemMesh(k){const g=new Group();addPart(g,'LV','gri_'+k);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});ENV.add(g);return g}
function grItems(){GR.items=[];GR.sprouts=[];
 for(const k in GREEND.items){const D=GREEND.items[k],g=grItemMesh(k),it={k,n:D.n,g,state:'ground',x:D.p[0],y:D.p[1],z:D.p[2],yaw:rnd(0,6.28),pot:-1};
  if(k==='book'){it.yaw=Math.PI/2}GR.items.push(it);grItemPose(it)}
 GR.pots=[null,null,null];GR.held=null;
 if(G.grSolved)GR_SOL.forEach((k,i)=>{const it=GR.items.find(q=>q.k===k);grToPot(it,i,true)})}
function grItemPose(it){const g=it.g;if(it.state==='held')return;g.visible=true;g.position.set(it.x,it.y,it.z);g.rotation.set(0,it.yaw,0);g.scale.setScalar(1)}
function grToPot(it,i,quiet){const p=GREEND.pots[i];it.state='pot';it.pot=i;it.x=p[0];it.y=p[1]-0.34;it.z=p[2];it.yaw=0.3+i*0.6;GR.pots[i]=it;if(GR.held===it)GR.held=null;grItemPose(it);
 if(!quiet){SFX.pickup&&SFX.pickup();sparks(p[0],p[1],p[2],10,[0.8,1,0.7])}}
function grTake(it){if(it.state==='pot'){GR.pots[it.pot]=null;it.pot=-1}
 const old=GR.held;if(old){old.state='ground';old.x=P.x+Math.sin(P.yaw)*0.7;old.z=P.z+Math.cos(P.yaw)*0.7;old.y=grGH(old.x,old.z);old.yaw=rnd(0,6.28);grItemPose(old)}
 it.state='held';GR.held=it;SFX.pickup&&SFX.pickup();pop('В руках: '+it.n,'#d8f0c0');
 if(!it.seen){it.seen=1;const L={shovel:'Садовая лопатка. Земля на ней ещё свежая.',can:'Лейка. Из носика всё ещё капает вода — будто плачет.',book:'Травник отшельника. Сотни страниц — и ни звука.',flask:'Склянка с мутным осадком. Пахнет горькой травой.',bottle:'Пустая бутыль. Её давно осушили.'}[it.k];if(L)say('Акира',L)}}
function grPut(i){const it=GR.held;if(!it||GR.pots[i])return;grToPot(it,i);if(GR.pots.every(Boolean))GR.checkT=50}
function grCheck(){if(G.grSolved||!GR.pots.every(Boolean))return;
 if(GR.pots.every((it,i)=>it.k===GR_SOL[i])){grSolveCS();return}
 GR.fails++;SFX.taiko&&SFX.taiko(0.8);G.shake=0.12;
 GR.pots.forEach((it,i)=>{const p=GREEND.pots[i];sparks(p[0],p[1],p[2],14,[1,0.55,0.4]);it.state='ground';it.pot=-1;it.x=p[0]+rnd(-0.5,0.5);it.z=p[2]+1.25+rnd(0,0.4);it.y=grGH(it.x,it.z);it.yaw=rnd(0,6.28);grItemPose(it)});GR.pots=[null,null,null];
 pop('Чаши отвергли дары','#ffb090');
 if(GR.fails===1)say('Юки','Чаши отвергли дары. Перечитай записку — каждая строка говорит об одной вещи.');
 else if(GR.fails===2){say('Юки','Кто роет землю, но не ест? Кто плачет над цветами, но не грустит? Кто говорит без голоса?');say('Юки','И помни: встань к вратам лицом — левая чаша слева от тебя.')}
 else say('Юки','Слева — лопатка, в середине — лейка, справа — травник. Попробуй так, Акира.')}
// ---------- открытие врат
function grOpenGate(instant){G.grSolved=1;if(GR.vine)GR.vine.visible=false;if(GR.seal)GR.seal.visible=false;if(GR.portd){GR.portd.visible=true;GR.portd.scale.setScalar(1)}
 const l=STATIC[2];if(l){l.userData.base=3.2;l.intensity=3.2}
 if(instant)GR.pots.forEach((it,i)=>{if(it)grSprout(i,1)})}
function grSprout(i,s){let sp=GR.sprouts[i];if(!sp){sp=new Group();addPart(sp,'LV','grsprout');grMatFix(sp);const p=GREEND.pots[i];sp.position.set(p[0],p[1]-0.1,p[2]);sp.rotation.y=i*1.3;ENV.add(sp);GR.sprouts[i]=sp}sp.scale.setScalar(Math.max(0.001,s))}
function grSolveCS(){const G0=GREEND.gate,gx=G0[0],gy=G0[1],gz=G0[2],PT=GREEND.pots;
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.2;SFX.draw(false)}
 const fin=()=>{grOpenGate(true);csEnd([['Юки','За вратами — портал. Он ведёт дальше по Пути Души.']])};
 csStart('grSolve',t=>{CS.bars=ek(t,0,20);
  cam([gx+3.6,gy+2.5,gz+12],[gx,gy+1.7,gz],ek(t,0,330),[gx+2.0,gy+2.0,gz+8.6],[gx,gy+1.9,gz-1]);
  for(let i=0;i<3;i++){const t0=25+i*32,p=PT[i];if(t===t0){SFX.soul&&SFX.soul();flashL(p[0],p[1]+0.3,p[2],0x9fffb0,6,30);sparks(p[0],p[1],p[2],24,[0.6,1,0.6])}
   if(t>=t0&&t<=t0+60)grSprout(i,ek(t,t0,t0+60))}
  if(t>=120&&t<170){for(const m of GR.sealM)if(m.emissiveIntensity!=null)m.emissiveIntensity=3+ek(t,120,170)*9}
  if(t===125){SFX.portal&&SFX.portal();G.shake=0.1}
  if(t===170){SFX.clear&&SFX.clear();G.shake=0.2;sparks(gx,G0[4]||gy+2.05,gz+0.1,90,[0.6,1,0.6]);flashL(gx,(G0[4]||gy+2.05)-0.05,gz+0.5,0xa0ffb0,10,40);GR.seal.visible=false}
  if(t>=170&&t<240){const k=ek(t,170,240);GR.vine.scale.set(1,Math.max(0.001,1-k),1);GR.vine.position.y=gy*k*0.9;if(t%3===0)grDust(gx+rnd(-2,2),gz+rnd(-0.3,0.3),gy,2)}
  if(t===240){GR.vine.visible=false}
  if(t===215){GR.portd.visible=true;SFX.warp&&SFX.warp()}
  if(t>=215){const k=ek(t,215,290);GR.portd.scale.setScalar(Math.max(0.001,k));const l=STATIC[2];if(l){l.userData.base=3.2*k;l.intensity=3.2*k}}
  if(t===250)csSay('Юки','Сад вспомнил себя… Корни отступили, Акира.',250,370);
  if(t>=380)fin()},fin)}
function grPortal(){const nx=GRCH()+1;
 if(CH[nx]){if(CH[nx].temple)tpPortalCS(nx);else travelTo(nx,'portal');return}
 SFX.warp&&SFX.warp();flashL(P.x,GY+1.4,P.z,0x9fffb0,8,40);G.grDone=1;
 G.card={t:0,title:'ГЛАВА 7 ПРОЙДЕНА',name:'Путь продолжится…'};
 say('Юки','Портал дрожит, но дальше пока не пускает. Следующий путь ещё не проложен.');say('Юки','Можно вернуться в деревню через карту (M).')}
// ---------- записка отшельника
const GR_NOTE=['Я ухожу, и сад засыпает вместе со мной.','Врата корней откроются лишь тому, кто вернёт саду память.','','Три чаши ждут у врат. Встань к вратам лицом:','левой — отдай того, кто роет землю, но не ест;','средней — того, кто плачет над цветами, но не грустит;','правой — того, кто говорит, не имея голоса.','','Лишнего сад не примет.'];
function grNote(){G.mapOpen=true;G.grNote=true;G.worldMap=false;SFX.paper&&SFX.paper();GR.read=1}
function drawGrNote(){X.fillStyle='rgba(0,0,0,0.72)';X.fillRect(0,0,W,H);const w=640,h=430,x0=W/2-w/2,y0=H/2-h/2;
 const g=X.createLinearGradient(x0,y0,x0,y0+h);g.addColorStop(0,'#e9dcbc');g.addColorStop(1,'#d2c19a');X.fillStyle=g;X.fillRect(x0,y0,w,h);
 X.strokeStyle='rgba(90,60,30,0.6)';X.lineWidth=3;X.strokeRect(x0+10,y0+10,w-20,h-20);
 X.textAlign='center';X.fillStyle='#4a3218';X.font='bold 24px Georgia,serif';X.fillText('Записка отшельника',W/2,y0+56);
 X.font='19px Georgia,serif';GR_NOTE.forEach((l,i)=>X.fillText(l,W/2,y0+104+i*29));
 X.font='italic 17px Georgia,serif';X.fillStyle='#5a4228';X.fillText('— Сэйдзи, травник',W/2+170,y0+h-34);
 X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.7)';X.fillText('X / Esc — закрыть',W/2,y0+h+28);X.textAlign='left'}
// ---------- интеракции
function grNear(){if(CS.on)return null;const it0=GR.held,PT=GREEND.pots;
 let pi=-1,pd=1.45;PT.forEach((p,i)=>{const d=Math.hypot(P.x-p[0],P.z-p[2]);if(d<pd){pd=d;pi=i}});
 if(pi>=0&&!G.grSolved){const inP=GR.pots[pi],nm=['левая','средняя','правая'][pi],nA=['левую','среднюю','правую'][pi];
  if(it0&&!inP)return{k:'kak',label:'X — положить в '+nA+' чашу: '+it0.n,f:()=>grPut(pi)};
  if(inP)return{k:'kak',label:'X — забрать из чаши: '+inP.n+(it0?' (в руках: '+it0.n+')':''),f:()=>grTake(inP)};
  return{k:'kak',label:'Пустая '+nm+' чаша. Здесь чего-то не хватает…',f:()=>{}}}
 let bi=null,bd=1.5;for(const it of GR.items){if(it.state!=='ground')continue;const d=Math.hypot(P.x-it.x,P.z-it.z);if(d<bd){bd=d;bi=it}}
 if(bi)return{k:'kak',label:'X — взять: '+bi.n+(it0?' (оставить: '+it0.n+')':''),f:()=>grTake(bi)};
 const B=GREEND.board;if(Math.hypot(P.x-B[0],P.z-B[1])<1.9)return{k:'kak',label:'X — прочитать записку отшельника',f:grNote};
 const Gt=GREEND.gate;if(!G.grSolved&&Math.abs(P.x-Gt[0])<(Gt[3]||2.3)+0.3&&Math.abs(P.z-Gt[2])<2.2)return{k:'kak',label:'Врата оплетены корнями. На печати — три знака',f:()=>say('Юки','Три знака на печати… и три чаши перед вратами. Отшельник что-то оставил в своём лагере.')};
 const Pp=GREEND.portal;if(G.grSolved&&Math.hypot(P.x-Pp[0],P.z-Pp[2])<2.6)return{k:'kak',label:'X — шагнуть в портал',f:grPortal};
 return null}
// ---------- кадр
function grDust(x,z,y,n){for(let i=0;i<n;i++)FX.norm.add({x:x+rnd(-1,1),y:y+0.1,z:z+rnd(-1,1),vx:rnd(-2,2)/60,vy:rnd(0,1)/60,vz:rnd(-2,2)/60,drag:0.96,life:rnd(40,80),s:rnd(0.1,0.25),r:0.62,gg:0.58,b:0.46,a:0.5})}
function grAnim(ts){if(!LV.green)return;GR.t+=ts;
 if(!GR.freeze)GY=grGH(P.x,P.z);
 if(GR.sky)GR.sky.position.set(camera.position.x,0,camera.position.z);
 const h=GR.held;if(h){const g=h.g;g.visible=!P.drawn&&!P.csHide;hero.arms.L.hand.getWorldPosition(tv1);g.position.copy(tv1);g.position.y-=0.12;g.rotation.set(0,P.yaw,0);g.scale.setScalar(0.85)}
 const pul=Math.sin(GR.t*0.05);for(const m of GR.sealM)if(m.emissiveIntensity!=null&&!CS.on)m.emissiveIntensity=2.6+pul*0.9;
 if(GR.portd&&GR.portd.visible){GR.portd.rotation.y=0;for(const m of GR.portM){m.opacity=0.55+0.2*Math.sin(GR.t*0.07)}if(G.frame%3===0){const p=GREEND.portal;FX.add.add({x:p[0]+rnd(-1.2,1.2),y:p[1]+rnd(-1.2,1.2),z:p[2]+rnd(-0.1,0.1),vx:0,vy:0.012,vz:0,life:40,s:rnd(0.04,0.09),r:0.6,gg:1.5,b:0.8,a:0.7})}}
 for(const sp of GR.sprouts)if(sp)sp.rotation.z=Math.sin(GR.t*0.03+sp.position.x)*0.04;
 if(G.frame%40===0&&!G.grSolved)for(const it of GR.items)if(it.state==='ground'&&Math.hypot(P.x-it.x,P.z-it.z)<32)sparks(it.x,it.y+0.35,it.z,3,[0.9,1,0.7])}
function updGreen(ts){grPushO(P,0.3);if(GR.checkT>0){GR.checkT-=ts;if(GR.checkT<=0){GR.checkT=0;grCheck()}}
 if(!GR.hint&&G.frame%60===0&&!G.subs.length){GR.hint=1;if(!GR.read)say('Юки','Записка на доске в лагере отшельника — начни с неё (X).')}
 if(P.y<0)P.y=0}
function grLoad(cp){LV.green=true;LV.env.nav=grNavV();GR.checkT=0;GR.freeze=0;GR.wellCS=0;GR.hint=0;GR.read=GR.read||0;GR.grid=null;
 const L=GREEND.land;P.x=L[0];P.z=L[1];P.yaw=Math.PI;G.camYaw=Math.PI;P._nx=undefined;P.y=0;P.vy=0;GY=grGH(P.x,P.z);G.camDist=4.6;
 grGrid();grItems();if(G.grSolved)grOpenGate(true);
 G.cp={chap:G.chap,wave:0,mi:0,oni:P.oni}}
// ---------- колодец в «Родной деревне» -> падение -> пустошь
function wellNear(){if(KK.room>=0||GRCH()<0)return null;const d=Math.hypot(P.x,P.z);if(d<3.9)return{k:'kak',label:'X — прыгнуть в старый колодец',f:wellJump};return null}
function wellJump(){const i=GRCH();if(i<0)return;const d0=Math.hypot(P.x,P.z)||1,dx=P.x/d0,dz=P.z/d0,px=-dz,pz=dx,g0=GY,R0=[dx*2.8,dz*2.8];
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.2;SFX.draw(false)}
 GR.wellCS=1;let sh=null,lt=null,vy=0;
 const go=()=>{GR.wellCS=0;const oni=P.oni,mana=P.mana;G.subs=[];P.csPose=null;loadChapter(i);P.oni=oni;P.mana=mana;G.cp={chap:i,wave:0,mi:0,oni:P.oni};grArrival()};
 csStart('well',t=>{const H=CS.H;CS.bars=ek(t,0,20);GY=g0;
  if(t===1){H.to=R0;H.spd=0.036;H.gait=0;sh=locAdd(ENV,'grshaft',false);sh.position.set(0,g0-3.0,0);grMatFix(sh);lt=new THREE.PointLight(0xa8ffc0,0,16,1.4);ENV.add(lt)}
  if(t<96)cam([dx*6.4+px*4.4,g0+2.7,dz*6.4+pz*4.4],[dx*1.4,g0+1.0,dz*1.4]);
  if(t===62){H.to=null;H.yaw=Math.atan2(-dx,-dz);H.yawK=0.2}
  if(t===78)P.csPose={p:POSE.kneel,w:0};if(t>78&&t<96&&P.csPose)P.csPose.w=0.45*ek(t,78,96);
  if(t===96){P.csPose={p:POSE.fall,w:1};vy=0.12;H.fly=[-dx*0.19,-dz*0.19];SFX.swingL&&SFX.swingL();grDust(P.x,P.z,g0,8)}
  if(t>96&&t<170){P.y+=vy;vy-=0.0085;cam([dx*2.6+px*1.0,g0+4.8,dz*2.6+pz*1.0],[P.x*0.5,g0+Math.max(P.y,-2.5)+0.6,P.z*0.5])}
  if(t===110)csSay('Акира','Если Сара права и колодец хранит долину… посмотрим, что он хранит внизу.',100,200);
  if(t>=150&&t<=170)CS.fade=ek(t,150,170);
  if(t===170){P.x=0;P.z=0;P.y=-8;vy=-0.11;H.fly=null;if(lt)lt.intensity=6}
  if(t>=170){if(t<=190)CS.fade=1-ek(t,170,190);vy=Math.max(vy-0.0016,-0.17);P.y+=vy;P.yaw+=0.016;
   const yy=g0+P.y;cam([0.6,yy-3.3,0.38],[0,yy+1.0,0]);if(lt)lt.position.set(0.25,yy+0.4,0.25);
   if(t%2===0)FX.norm.add({x:rnd(-1.2,1.2),y:yy-rnd(2,9),z:rnd(-1.2,1.2),vx:0,vy:0,vz:0,life:70,s:rnd(0.03,0.07),r:0.75,gg:0.8,b:0.72,a:0.55});
   if(t%5===0)FX.add.add({x:rnd(-0.8,0.8),y:yy-rnd(4,10),z:rnd(-0.8,0.8),vx:0,vy:0.01,vz:0,life:50,s:rnd(0.04,0.08),r:0.5,gg:1.4,b:0.7,a:0.6})}
  if(t===215)csSay('Акира','…Как глубоко…',215,300);
  if(t>=320)CS.fade=ek(t,320,350);
  if(t===350)go()},()=>{CS.fade=1;go()})}
function grArrival(){const L=GREEND.land;P.x=L[0];P.z=L[1];P.yaw=Math.PI;const g0=grGH(P.x,P.z);GR.freeze=1;GR.landed=0;GY=g0;P.y=24;P.vy=0;
 const ring=locAdd(ENV,'grring',false);grMatFix(ring);ring.position.set(P.x,g0+26.2,P.z);let lT=0;const Gt=GREEND.gate;
 const fin=()=>{P.y=0;GR.landed=1;P.csPose=null;ring.visible=false;GR.freeze=0;G.card={t:0,title:'ГЛАВА 7',name:'Зелёная пустошь'};csEnd([['Юки','Осмотри лагерь отшельника — на доске записка (X). А врата из корней — там, у кромки леса.']])};
 csStart('grArr',t=>{const H=CS.H;CS.bars=1;GY=g0;
  if(t<=26)CS.fade=1-ek(t,0,26);
  if(t===1){P.csPose={p:POSE.fall,w:1};SFX.warp&&SFX.warp();G.card=null}
  ring.rotation.y+=0.015;
  if(!GR.landed){P.vy=Math.max(P.vy-0.0042,-0.34);P.y+=P.vy;P.yaw+=0.008;
   if(t%2===0)FX.add.add({x:P.x+rnd(-.3,.3),y:g0+P.y+rnd(0.2,1.6),z:P.z+rnd(-.3,.3),vx:0,vy:0.03,vz:0,life:22,s:0.1,r:0.7,gg:1.6,b:0.8,a:0.6});
   cam([P.x+5.8,g0+1.3,P.z+6.6],[P.x,g0+Math.max(P.y,0)+0.9+(t<40?(1-t/40)*3:0),P.z]);
   if(P.y<=0){P.y=0;GR.landed=1;lT=t;G.shake=0.38;grDust(P.x,P.z,g0,46);sparks(P.x,g0+0.2,P.z,40,[0.7,1,0.6]);flashL(P.x,g0+0.6,P.z,0x9fffb0,8,30);(SFX.impact||SFX.taiko)(1.4);P.ldv=(P.ldv||0)-0.11;P.csPose={p:POSE.kneel,w:1};P.yaw=Math.PI}
   return}
  const u=t-lT;
  if(u<30){const s=Math.max(0.001,1-u/30);ring.scale.setScalar(s)}else ring.visible=false;
  if(u<95)cam([P.x+1.5,g0+0.75,P.z-2.3],[P.x,g0+0.9,P.z],ek(u,0,95),[P.x+1.7,g0+1.15,P.z-2.7],[P.x,g0+1.15,P.z]);
  if(u>=55&&u<=110&&P.csPose&&P.csPose.p===POSE.kneel)P.csPose.w=1-ek(u,55,110);if(u===111)P.csPose=null;
  if(u===20)csSay('Акира','…Колодец вывел меня… сюда?',20,110);
  if(u>=95&&u<260){const a=lerp(-2.4,-0.4,ek(u,95,260)),r=4.6;cam([P.x+Math.sin(a)*r,g0+1.9,P.z+Math.cos(a)*r],[P.x,g0+1.3,P.z]);P.csLook=Math.sin((u-95)*0.04)*0.9}
  if(u===110)G.card={t:0,title:'ГЛАВА 7',name:'Зелёная пустошь'};
  if(u===130)csSay('Юки','Зелёная пустошь… Здесь нет Гэнма. Но что-то держит этот край запертым.',130,258);
  if(u>=260&&u<380){P.csLook=lerp(P.csLook||0,0,0.08);cam([P.x+1.8,g0+3.0,P.z+5.2],[Gt[0],Gt[1]+2.0,Gt[2]],ek(u,260,380),[P.x+1.2,g0+2.6,P.z+4.2],[Gt[0],Gt[1]+2.2,Gt[2]])}
  if(u===268)csSay('Юки','Видишь врата из корней у кромки леса? А слева — чей-то брошенный лагерь.',268,378);
  if(u>=385){P.y=0;ring.visible=false;GR.freeze=0;csEnd([['Юки','Осмотри лагерь отшельника — на доске записка (X).']])}},fin)}
// ---------- переходы и карта мира (свободное перемещение)
function grFade(fn){csStart('travel',t=>{CS.bars=0;CS.hint=null;if(t<20)CS.fade=t/20;if(t===20)fn();if(t>20)CS.fade=Math.max(0,1-(t-20)/20);if(t>=42)csEnd()},null)}
function travelTo(i,from){if(i<0||!CH[i])return;grFade(()=>{loadChapter(i);G.card={t:0,title:CH[i].title,name:CH[i].name}})}
const TRAVEL=[['Пепел Ивате',0],['Лес Шепчущих Бамбуков',1],['Двор с колоколом',2],['Забытый дом',3],['Родная деревня',4],['Зелёная пустошь',5],['Путь',6]];
function worldMapOpen(){G.worldMap=true;G.grNote=false;G.mapOpen=true;G.mapK=false;G.mapSel=Math.max(0,TRAVEL.findIndex(t=>t[1]===G.chap))}
function updWorldMap(){if(G.grNote){if(hit('KeyX')||hit('KeyM')||hit('Escape')||hit('Enter')||hit('Space')||MP[0]){G.mapOpen=false;G.grNote=false}return true}
 if(!G.worldMap)return false;
 if(hit('ArrowUp')||hit('KeyW'))G.mapSel=(G.mapSel+TRAVEL.length-1)%TRAVEL.length;
 if(hit('ArrowDown')||hit('KeyS'))G.mapSel=(G.mapSel+1)%TRAVEL.length;
 if(hit('KeyK')&&LV.kak&&G.hasKakMap){G.mapK=!G.mapK;return true}
 if(hit('Enter')||hit('Space')||MP[0]){const t=TRAVEL[G.mapSel];const ok=t&&((G.visited&&G.visited.has(t[1]))||t[1]===G.chap);G.mapOpen=false;if(ok&&t[1]!==G.chap)travelTo(t[1],'map');else if(!ok)pop('Это место ещё не открыто','#c9a0a0');return true}
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
 X.textAlign='center';X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.5)';X.fillText(LV.kak&&G.hasKakMap?'K — план деревни':'',cx,H-40);X.textAlign='left'}
function grHook(){return{D:GREEND,gh:grGH,load:grLoad,well:wellJump,wellNear,arrive:grArrival,near:grNear,GR,take:grTake,put:grPut,check:grCheck,solve:grSolveCS,note:grNote,portal:grPortal,travel:travelTo,worldMap:worldMapOpen,push:grPushO,gy:()=>GY}}
