// ---------- input
const K={},KP={},MP=[0,0,0];let mdx=0,mdy=0;
addEventListener('keydown',e=>{const k=e.code;if(!K[k])KP[k]=1;K[k]=1;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))e.preventDefault();audioInit()});
addEventListener('keyup',e=>{K[e.code]=0});
addEventListener('mousedown',e=>{MP[e.button]=1;audioInit();if(G.mode==='play'&&document.pointerLockElement!==renderer.domElement){try{renderer.domElement.requestPointerLock()}catch(_){}if(G.paused){G.paused=false;MP[0]=MP[2]=0}}});
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){mdx+=e.movementX;mdy+=e.movementY}});
addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&G.mode==='play'&&!G.noPauseOnUnlock)G.paused=true});
const down=c=>!!K[c],hit=c=>!!KP[c];
const inR=()=>hit('KeyJ')||MP[0],inL=()=>hit('KeyK')||MP[2],dodgeHit=()=>hit('ShiftLeft')||hit('ShiftRight');
// ---------- data
const DIFF=[{n:'Ронин',win:15,hp:0.7,decay:900},{n:'Самурай',win:11,hp:1,decay:900},{n:'Демон',win:7,hp:1.2,decay:480}];
const ET={
 ash:{name:'Куро-асигару',hp:60,spd:2.2,range:2.2,rad:0.4,h:1.6,atk:[{k:'thrust',wind:36,act:6,rec:30,dmg:12,reach:2.8}],souls:[['r',3],['b',1]],poise:0},
 kama:{name:'Кама-итати',hp:30,spd:5.5,range:1.9,rad:0.35,h:0.6,atk:[{k:'leap',wind:26,act:18,rec:34,dmg:8,reach:1.2}],souls:[['r',2],['b',1]],poise:0},
 yumi:{name:'Юми-они',hp:40,spd:1.5,range:17,keep:10,rad:0.45,h:1.2,atk:[{k:'shoot',wind:56,act:1,rec:70,dmg:10}],souls:[['r',2],['b',2]],poise:0},
 gasa:{name:'Хитоцумэ Гаса',hp:180,spd:1.7,range:2.4,rad:0.55,h:2.1,atk:[{k:'slash',wind:40,act:8,rec:36,dmg:20,reach:3.0},{k:'grab',wind:44,act:8,rec:50,dmg:35,reach:1.9}],souls:[['r',5],['b',2],['y',2]],poise:45},
 sota:{name:'Сота, Падший Брат',hp:600,spd:3.8,range:2.2,rad:0.45,h:1.9,boss:true,souls:[['r',12],['p',5],['y',3]],poise:60}
};
const ATK={R:{s:18,a:6,r:22,dmg:[24,32],reach:2.4,arc:-0.1,st:15,knock:3,type:'R'},R3:{s:16,a:10,r:26,dmg:[50,50],reach:2.7,arc:-2,st:15,knock:10,type:'R',spin:true,gb:true},
 L:{s:10,a:4,r:12,dmg:[12,16],reach:2.7,arc:0.45,st:7,knock:1,type:'L'},N:{s:14,a:6,r:20,dmg:[45,45],reach:2.6,arc:0.15,st:25,knock:9,type:'N',gb:true},X:{s:8,a:6,r:18,dmg:[45,45],reach:2.6,arc:0.15,st:10,knock:4,type:'N',gb:true,launch:true}};
const CH=[
 {title:'ПРОЛОГ',name:'Пепел Ивате',theme:'ash',mirrors:[[-4.5,-9,Math.PI/2],[-10,2,Math.PI/2]],
  start:[['Юки','Акира… они идут. Правая катана — ЛКМ, левая — ПКМ. Мышь — камера, WASD — шаг.']],
  waves:[{en:['ash','ash'],say:[['Юки','Скрести мечи! ЛКМ и ПКМ вместе — удар креста. Shift — уворот.']]},
   {en:['ash','ash','ash'],say:[['Юки','Когда клинок блеснёт красным — Q в последний миг. Это Иссэн.'],['Юки','Души не ушли! Зажми E, пока они не почернели.']]},
   {en:['gasa','ash'],say:[['Хитоцумэ Гаса','Умри!'],['Юки','Если схватит — бей обоими мечами!']]}]},
 {title:'ГЛАВА 1',name:'Лес Шепчущих Бамбуков',theme:'forest',mirrors:[[-4.5,-9,Math.PI/2],[-10,2,Math.PI/2]],
  start:[['Юки','Тихо. Бамбук шепчет… F — огненный серп, G — лунные цепи. Tab — захват цели.']],
  waves:[{en:['kama','kama','kama'],say:[['Юки','Кама-итати! Смеются, как дети… Стойка Воды (3) — против стаи.']]},
   {en:['yumi','ash','ash','yumi'],say:[['Юки','Лучники! Держи блок (Q) — клинки отобьют стрелы.']]},
   {en:['gasa','kama','yumi','ash'],say:[['Акира','…Сколько же вас.'],['Юки','Шкала Они полна? R — Мусо Нитэн.']]}]},
 {title:'ГЛАВА 4',name:'Двор с колоколом',theme:'duel',mirrors:[[-3.5,-12,Math.PI/2]],start:[],
  waves:[{en:['sota'],boss:true,say:[['Сота','Ты пришёл, брат. С отцовским мечом… и с моим.'],['Акира','Я пришёл забрать тебя домой.'],['Сота','Дом сгорел. Умри!']]}]}
];
const G={mode:'title',diff:1,frame:0,chap:0,slow:0,slowTs:1,freeze:0,hitstop:0,shake:0,fov:55,fovT:55,camYaw:0,camPitch:0.28,camDist:4.6,card:null,subs:[],pops:[],
 souls:{r:0,b:0,p:0},stats:{kills:0,issen:0,time:0,deaths:0},issenFx:null,flashRed:0,tarScreen:0,rainFreeze:0,rainUp:false,winT:0,deadT:0,cp:null,bossBar:null,paused:false,menuSel:1,reviveHint:false,lock:null,wave:0,waveT:0,trans:0,exposureT:1};
let LV=null,enemies=[],souls=[],proj=[],lines=[];
const P={};
// ---------- hero
const heroMats={skin:(ASSET.ok&&ASSET.mats.AK_skin?ASSET.mats.AK_skin:M.skin).clone(),vest:M.vest.clone()};heroMats.skinBase=heroMats.skin.color.clone();
const hero=makeHuman({set:'AK',matMap:{AK_skin:heroMats.skin},scale:1.02,pants:M.pants,pants2:M.pants2,kimono:M.kimono,vest:heroMats.vest,skin:heroMats.skin,cape:M.cape,tsR:M.tsubaR,tsL:M.tsubaL,lapis:true,glove:true,len:{R:0.74,L:0.69}});
scene.add(hero.root);hero.root.traverse(o=>{if(o.isMesh)o.castShadow=true});
const ghostMat=new MB({color:0xffa060,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
const ghosts=[0,1].map(()=>{const s=makeSword(0.85,M.tsubaR,false);s.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=false}});s.visible=false;scene.add(s);return s});
function makeTrail(col){const n=12,g=new THREE.BufferGeometry(),pos=new Float32Array(n*2*3),c=new Float32Array(n*2*3),idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 g.setIndex(idx);g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
 const m=new Mesh(g,new MB({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));m.frustumCulled=false;scene.add(m);return{m,g,pos,c,hist:[],col,n}}
const trails={R:makeTrail([1.6,0.55,0.15]),L:makeTrail([0.4,0.9,1.8])};
const tv1=new V3(),tv2=new V3();
function updTrail(t,sw,on){const H=t.hist;if(on){sw.userData.base.getWorldPosition(tv1);sw.userData.tip.getWorldPosition(tv2);H.unshift([tv1.x,tv1.y,tv1.z,tv2.x,tv2.y,tv2.z]);if(H.length>t.n)H.pop()}else if(H.length)H.pop();
 for(let i=0;i<t.n;i++){const h=H[Math.min(i,H.length-1)];const a=H.length>1?Math.max(0,1-i/(H.length-1)):0;if(h){t.pos.set(h.slice(0,3),i*6);t.pos.set(h.slice(3,6),i*6+3)}
  for(let k=0;k<2;k++){t.c[i*6+k*3]=t.col[0]*a*(k?1:0.2);t.c[i*6+k*3+1]=t.col[1]*a*(k?1:0.2);t.c[i*6+k*3+2]=t.col[2]*a*(k?1:0.2)}}
 t.g.attributes.position.needsUpdate=true;t.g.attributes.color.needsUpdate=true;t.m.visible=H.length>1}
const bolts=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x9ad8ff,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false}));bolts.frustumCulled=false;scene.add(bolts);
const crescent=new Mesh(new THREE.RingGeometry(2.4,2.9,48,1,0,0.1),new MB({color:0xffffff,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,toneMapped:false}));crescent.renderOrder=20;crescent.visible=false;scene.add(crescent);
function resetPlayer(x,z){Object.assign(P,{x,z,y:0,vy:0,yaw:0,vx:0,vz:0,hp:120,max:120,st:100,stMax:100,oni:0,mana:40,state:'idle',t:0,atk:null,hitList:null,combo:'',comboT:0,buf:null,stance:1,stanceFx:0,muso:0,exhaust:0,iss:0,blockTap:-999,pdWin:0,air:false,food:3,tar:0,rT:-99,lT:-99,pendR:false,pendL:false,clinch:null,clT:0,hurtT:0,invT:0,dodgeLen:24,swung:false,absorbing:false,atkSpd:1,eatDone:false,walkPh:0,walk:0,gait:1,idleT:0,pose:POSE.crane})}
const fwdX=y=>Math.sin(y),fwdZ=y=>Math.cos(y);
function say(n,t){G.subs.push({n,t,d:Math.max(170,t.length*4.2),a:0})}
function pop(t,col='#e8dcc0'){G.pops.push({t,col,life:110})}
function arenaClamp(o,r=0){const R=LV.env.R-r,d=Math.hypot(o.x,o.z);if(d>R){o.x*=R/d;o.z*=R/d}}
function setStance(k){if(P.stance===k)return;P.stance=k;P.stanceFx=14;SFX.stance(k)}
function nearest(r,dirYaw=null,cone=-1){let b=null,bd=r;for(const e of enemies){if(e.dead||e.inv)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d>=bd)continue;if(dirYaw!=null&&(dx*fwdX(dirYaw)+dz*fwdZ(dirYaw))/(d||1)<cone)continue;bd=d;b=e}return b}
function aimAt(e){P.yaw=Math.atan2(e.x-P.x,e.z-P.z)}
function inputDir(){const f=(down('KeyW')||down('ArrowUp')?1:0)-(down('KeyS')||down('ArrowDown')?1:0),s=(down('KeyD')?1:0)-(down('KeyA')?1:0);if(!f&&!s)return null;const cy=G.camYaw;
 const x=Math.sin(cy)*f-Math.cos(cy)*s,z=Math.cos(cy)*f+Math.sin(cy)*s;return Math.atan2(x,z)}
function startAttack(k,dirY){
 if(P.pdWin>0&&k==='R'){const e=nearest(9);if(e){P.pdWin=0;const d=Math.hypot(e.x-P.x,e.z-P.z)||1;P.x=e.x-(e.x-P.x)/d*1.2;P.z=e.z-(e.z-P.z)/d*1.2;doIssen(e);return}}
 let a;if(k==='R'){if(P.combo.endsWith('LLL')){a=ATK.X;P.combo=''}else if(P.combo.endsWith('RR')){a=ATK.R3;P.combo=''}else{a=ATK.R;P.combo+='R'}}else if(k==='L'){a=ATK.L;P.combo+='L'}else{a=ATK.N;P.combo=''}
 const tgt=G.lock&&!G.lock.dead?G.lock:nearest(5.5,dirY!=null?dirY:P.yaw,-0.2);if(tgt){aimAt(tgt);P.lunge=clamp(Math.hypot(tgt.x-P.x,tgt.z-P.z)-a.reach*0.75,0,1.6)}else{if(dirY!=null)P.yaw=dirY;P.lunge=0.5}
 P.st=Math.max(-10,P.st-a.st);P.state='atk';P.atk=a;P.t=0;P.swung=false;P.hitList=new Set();P.buf=null;
 P.atkSpd=(P.stance===0&&a.type==='R')?1.2:(P.stance===2&&a.type==='L')?1.4:1;if(P.st<0)P.atkSpd*=0.75}
function startDodge(dirY){if(P.st<20){pop('Нет выносливости','#c9a0a0');return}P.st-=20;P.state='dodge';P.t=0;const y=dirY!=null?dirY:P.yaw+Math.PI;P.dodgeYaw=y;if(dirY!=null)P.yaw=dirY;
 P.dodgeLen=P.stance===0?19:P.stance===2?28:24;P.dodgeSpd=(P.stance===2?7.5:9)/60}
function doHits(a){const mul=(P.stance===0?1.3:P.stance===2?0.8:1)*(P.muso>0?1.5:1)*(P.exhaust>0?0.7:1),fx=fwdX(P.yaw),fz=fwdZ(P.yaw);
 for(const e of enemies){if(e.dead||P.hitList.has(e))continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz)||0.01;
  const both=a.both||(P.stance===2&&a.type==='L');if(!both&&(dx*fx+dz*fz)/d<a.arc)continue;if(d>a.reach+e.d.rad||Math.abs(e.y-P.y)>1.5)continue;
  P.hitList.add(e);dmgEnemy(e,Math.round(rnd(a.dmg[0],a.dmg[1])*mul),dx/d,dz/d,{knock:a.knock,stop:a.type==='N'?7:4,gb:a.gb,launch:a.launch});
  if(P.muso>0){e.burn=Math.max(e.burn,120);if(Math.random()<0.25)e.frozen=Math.max(e.frozen,40)}if(!e.dead)P.oni=Math.min(100,P.oni+1)}}
function castFire(){if(P.mana<20){pop('Мало синих душ','#8fb8ff');return}P.mana-=20;SFX.fire();const m=new Mesh(new THREE.TorusGeometry(1.1,0.06,6,24,Math.PI*0.9),new MB({color:0xff7a30,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false,depthWrite:false}));
 m.rotation.order='YXZ';m.rotation.set(Math.PI/2,P.yaw+Math.PI*0.05,0);scene.add(m);proj.push({k:'fire',x:P.x+fwdX(P.yaw),z:P.z+fwdZ(P.yaw),y:0.9,vx:fwdX(P.yaw)*0.22,vz:fwdZ(P.yaw)*0.22,life:55,hit:new Set(),m});
 P.state='atk';P.atk={s:6,a:1,r:18,dmg:[0,0],reach:0,arc:2,st:0,type:'R'};P.t=0;P.hitList=new Set();P.atkSpd=1;P.swung=true}
function castIce(){if(P.mana<15){pop('Мало синих душ','#8fb8ff');return}P.mana-=15;SFX.ice();let n=0;
 for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.z-P.z)<6){e.frozen=e.d.boss?90:240;n++;for(let i=0;i<20;i++)FX.add.add({x:e.x+rnd(-.4,.4),y:rnd(0.1,e.d.h),z:e.z+rnd(-.4,.4),vx:0,vy:rnd(0,1)/60,vz:0,life:rnd(40,90),s:rnd(0.03,0.06),r:0.6,gg:1.2,b:2})}
 flashL(P.x,1.2,P.z,0x80c0ff,8,20);if(!n)pop('Никого рядом','#8fb8ff')}
function startMuso(){if(P.muso>0)return;if(P.oni<100){pop('Шкала Они не полна','#c9a0a0');return}P.oni=0;P.muso=1200;SFX.bell();SFX.guitar();pop('МУСО НИТЭН','#ffd27a');G.shake=0.25;flashL(P.x,1.5,P.z,0xffb070,12,30)}
function eat(){if(P.food<=0){pop('Онигири кончились','#c9a0a0');return}if(P.hp>=P.max)return;P.state='eat';P.t=0;P.eatDone=false}
function perfectDodge(){G.slow=72;G.slowTs=0.3;P.oni=Math.min(100,P.oni+10);P.pdWin=50;SFX.heart();pop('Идеальный уворот — ЛКМ: Иссэн-рывок','#bfe3ff')}
function toward(src){const dx=src.x-P.x,dz=src.z-P.z,d=Math.hypot(dx,dz)||1;return(dx*fwdX(P.yaw)+dz*fwdZ(P.yaw))/d>0.35}
function hitPlayer(src,dmg,o={}){
 if(P.state==='dead'||P.invT>0||P.state==='issen')return'none';
 if(P.state==='dodge'&&P.t<P.dodgeLen-4){if(P.t<=8&&!o.proj)perfectDodge();return'dodge'}
 if(o.issen&&src.d&&P.stance!==0&&G.frame-P.blockTap<=DIFF[G.diff].win&&P.iss<=0){doIssen(src);return'issen'}
 if(P.state==='block'&&toward(src)&&!o.unblock){P.st-=Math.max(8,dmg*1.3);const hx=P.x+fwdX(P.yaw)*0.5,hz=P.z+fwdZ(P.yaw)*0.5;sparks(hx,1.35,hz,o.proj?60:220);SFX.clang();P.vx-=fwdX(P.yaw)*0.05;P.vz-=fwdZ(P.yaw)*0.05;
  P.hp-=Math.round(dmg*0.2);if(P.st<=0){P.st=0;P.state='hurt';P.t=0;P.hurtT=45;pop('Блок сломан','#ff9a8a')}checkDeath();return'block'}
 if(P.state==='absorb'){let lost=0;for(const s of souls)if(s.pulled&&Math.random()<0.5){s.gone=true;lost++;if(s.owner)s.owner.pending--}if(lost)pop('Поглощение прервано','#ff9a8a')}
 P.hp-=dmg;P.oni=Math.max(0,P.oni-20);const dx=P.x-src.x,dz=P.z-src.z,d=Math.hypot(dx,dz)||1;
 if(P.muso<=0){P.state='hurt';P.t=0;P.hurtT=18;P.vx=dx/d*0.08;P.vz=dz/d*0.08;P.clinch=null}
 P.invT=20;G.shake=Math.max(G.shake,0.18);G.flashRed=12;SFX.hurt();petals(P.x,1.3,P.z,14);checkDeath();return'hit'}
function checkDeath(){if(P.hp<=0&&P.state!=='dead'){P.hp=0;P.state='dead';P.t=0;G.deadT=0;G.stats.deaths++;G.slow=90;G.slowTs=0.3}}
function doIssen(e){G.stats.issen++;P.iss=30;P.state='issen';P.t=0;aimAt(e);
 G.issenFx={t:0,x:(P.x+e.x)/2,z:(P.z+e.z)/2,yaw:P.yaw};G.freeze=9;G.slow=40;G.slowTs=0.35;G.fovT=38;G.fovHold=45;
 const d=Math.hypot(e.x-P.x,e.z-P.z)||1;P.x=e.x+(e.x-P.x)/d*1.3;P.z=e.z+(e.z-P.z)/d*1.3;arenaClamp(P,0.5);P.vx=P.vz=0;
 SFX.issen();P.oni=Math.min(100,P.oni+15);
 if(e.d.boss)dmgEnemy(e,150,0,0,{stop:0,noBlock:true,stagT:55,force:true});else killEnemy(e,fwdX(P.yaw),fwdZ(P.yaw),{issen:true});
 for(const o of enemies)if(o!==e&&!o.dead&&!o.d.boss&&o.state==='wind'&&Math.hypot(o.x-e.x,o.z-e.z)<4.5){killEnemy(o,fwdX(P.yaw),fwdZ(P.yaw),{issen:true});G.stats.issen++}}
function land(){if(P.state==='dive'){P.state='idle';P.t=0;G.shake=0.3;SFX.taiko(1.4);SFX.cross();dust(P.x,P.z,30);
 for(let i=0;i<40;i++){const a=i/40*Math.PI*2;FX.add.add({x:P.x+Math.cos(a)*0.3,y:0.1,z:P.z+Math.sin(a)*0.3,vx:Math.cos(a)*0.08,vy:0,vz:Math.sin(a)*0.08,life:24,s:0.08,r:1.5,gg:1.3,b:1.1})}
 for(const e of enemies){const d=Math.hypot(e.x-P.x,e.z-P.z);if(!e.dead&&d<3.2)dmgEnemy(e,35,(e.x-P.x)/(d||1),(e.z-P.z)/(d||1),{knock:8,stagT:40,gb:true})}}}
function updPlayer(ts){
 const m=P.muso>0?1.5:1,pts=ts*m;
 if(P.muso>0){P.muso-=ts;if(G.frame%60===0)SFX.guitar();if(P.muso<=0){P.muso=0;P.exhaust=300;pop('Истощение','#c9a0a0')}}
 if(P.exhaust>0)P.exhaust-=ts;if(P.pdWin>0)P.pdWin--;if(P.iss>0)P.iss-=ts;if(P.invT>0)P.invT-=ts;if(P.stanceFx>0)P.stanceFx-=ts;P.t+=pts;
 const dirY=inputDir();
 if(inR()){P.pendR=true;P.rT=G.frame}if(inL()){P.pendL=true;P.lT=G.frame}
 let act=null;if(hit('KeyL')){act='N';P.pendR=P.pendL=false}else if(P.pendR&&P.pendL){act='N';P.pendR=P.pendL=false}else if(P.pendR&&G.frame-P.rT>=4){act='R';P.pendR=false}else if(P.pendL&&G.frame-P.lT>=4){act='L';P.pendL=false}
 if(P.state!=='dead'){if(hit('Digit1'))setStance(0);if(hit('Digit2'))setStance(1);if(hit('Digit3'))setStance(2);if(hit('KeyQ')&&P.iss<=0)P.blockTap=G.frame}
 if(P.state!=='issen')P.vy-=0.0075*ts;P.y+=P.vy*ts;if(P.y<=0){P.y=0;P.vy=0;if(P.air){P.air=false;land()}}else P.air=true;
 let mv=0;
 switch(P.state){
 case'idle':case'run':
  if(act){if(P.air&&act==='N'){P.state='dive';P.vy=-0.2;P.t=0;P.st-=15}else startAttack(act,dirY);break}
  if(dodgeHit()&&!P.air){startDodge(dirY);break}
  if(hit('Space')&&!P.air)P.vy=0.14;
  if(down('KeyQ')&&!P.air){P.state='block';P.t=0;break}
  if(down('KeyE')&&!P.air){P.state='absorb';P.t=0;break}
  if(hit('KeyF')){castFire();break}if(hit('KeyG'))castIce();if(hit('KeyR'))startMuso();if(hit('KeyH'))eat();
  if(dirY!=null){P.yaw=turn(P.yaw,dirY,0.25);const wk=down('KeyC')||down('CapsLock');P.gait=lerp(P.gait??1,wk?0:1,0.12);mv=(1.9+3.3*P.gait)/60*m;P.state='run';P.st=Math.min(P.stMax,P.st+12/60*ts)}else{P.state='idle';P.st=Math.min(P.stMax,P.st+25/60*ts)}
  P.comboT-=ts;if(P.comboT<=0)P.combo='';break;
 case'atk':{const a=P.atk,T=P.t*P.atkSpd;
  if(T<a.s){if(T>a.s-6)mv=P.lunge/6*P.atkSpd;if(act)P.buf=act;if(G.lock&&!G.lock.dead)aimAt(G.lock)}
  else if(T<a.s+a.a){if(!P.swung){P.swung=true;(a.type==='L'?SFX.swingL:SFX.swingR)();if(a.type==='N')SFX.cross()}doHits(a);if(act)P.buf=act}
  else{if(act)P.buf=act;if(dodgeHit()){startDodge(dirY);break}if(P.buf&&T>=a.s+a.a+a.r*0.45){const b=P.buf;P.buf=null;startAttack(b,dirY);break}if(T>=a.s+a.a+a.r){P.state='idle';P.t=0;P.comboT=28}}
  break;}
 case'dive':break;
 case'dodge':P.x+=fwdX(P.dodgeYaw)*P.dodgeSpd*ts*(1-P.t/P.dodgeLen*0.6);P.z+=fwdZ(P.dodgeYaw)*P.dodgeSpd*ts*(1-P.t/P.dodgeLen*0.6);if(G.frame%3===0)FX.add.add({x:P.x,y:1,z:P.z,vx:0,vy:0,vz:0,life:14,s:0.9,r:0.1,gg:0.25,b:0.6,a:0.5});if(P.t>=P.dodgeLen){P.state='idle';P.t=0}break;
 case'block':if(G.lock&&!G.lock.dead)aimAt(G.lock);else if(dirY!=null)P.yaw=turn(P.yaw,dirY,0.1);if(!down('KeyQ')){P.state='idle';P.t=0}if(act==='N')startAttack('N',dirY);break;
 case'absorb':if(!down('KeyE')){P.state='idle';P.t=0}if(dirY!=null){P.yaw=turn(P.yaw,dirY,0.15);mv=5.2/60*0.3}break;
 case'hurt':if(P.t>=P.hurtT){P.state='idle';P.t=0}break;
 case'issen':if(P.t>=24){P.state='idle';P.t=0}break;
 case'eat':if(!P.eatDone&&P.t>=22){P.eatDone=true;P.food--;P.hp=Math.min(P.max,P.hp+40);pop('+40','#ffd98a')}if(P.t>=40){P.state='idle';P.t=0}break;
 case'clinch':{P.clT-=ts;const e=P.clinch;if(!e||e.dead){P.state='idle';P.clinch=null;break}aimAt(e);
  if(act==='N'){P.clinch=null;P.state='idle';P.t=0;e.state='stag';e.st=0;e.stagT=90;sparks((P.x+e.x)/2,1.5,(P.z+e.z)/2,260);SFX.clang();SFX.cross();G.shake=0.25;dmgEnemy(e,45,fwdX(P.yaw),fwdZ(P.yaw),{force:true,stagT:90,knock:8});pop('Вырвался!','#ffd27a')}
  else if(P.clT<=0){P.clinch=null;e.state='rec';e.st=0;P.hp-=35;P.tar=1;G.tarScreen=120;G.flashRed=14;G.shake=0.3;SFX.hurt();P.oni=Math.max(0,P.oni-20);P.state='hurt';P.t=0;P.hurtT=24;checkDeath()}
  break;}
 }
 P.x+=fwdX(P.yaw)*mv*ts+P.vx*ts;P.z+=fwdZ(P.yaw)*mv*ts+P.vz*ts;P.vx*=0.85;P.vz*=0.85;arenaClamp(P,0.5);
 for(const e of enemies){if(e.dead)continue;const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz),min=e.d.rad+0.35;if(d<min&&d>0.001&&P.state!=='dodge'){P.x=e.x+dx/d*min;P.z=e.z+dz/d*min}}
 P.walk=lerp(P.walk,mv>0?1:0,0.2);P.walkPh+=mv*ts*(4.4-1.8*(P.gait??1));P.idleT=P.state==='idle'?(P.idleT||0)+ts:0;P.absorbing=P.state==='absorb';
 if(LV.env.theme==='duel')P.tar=Math.max(0,P.tar-0.0008*ts);
}
