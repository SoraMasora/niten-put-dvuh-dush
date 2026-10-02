// ---------- enemies
function buildRig(t){if(t==='musha'||t==='shogun')return rigMusha(t==='shogun');if(t==='chochin')return rigChochin();if(t==='moku')return rigMoku();return t==='ash'?rigAsh(false):t==='gasa'?rigAsh(true):t==='kama'?rigKama():t==='yumi'?rigYumi():rigSota()}
function mkEnemy(t,x,z){const d=ET[t],hp=Math.round(d.hp*DIFF[G.diff].hp),rig=buildRig(t);scene.add(rig.root);rig.root.traverse(o=>{if(o.isMesh)o.castShadow=true});
 return{t,d,x,z,y:0,vy:0,vx:0,vz:0,yaw:Math.atan2(P.x-x,P.z-z),hp,max:hp,state:d.boss?'intro':'enter',st:0,cd:rnd(40,100),atk:null,hitDone:false,frozen:0,burn:0,burnAcc:0,poiseDmg:0,
  revived:false,anim:rnd(0,99),dead:false,deathT:0,pending:0,blackIn:0,flash:0,inv:0,phase:1,comboN:0,hits:0,rig,upV:null}}
function removeRig(e){scene.remove(e.rig.root);if(e.rig.upper.parent)e.rig.upper.parent.remove(e.rig.upper);scene.remove(e.rig.gl)}
// ---------- физика: пружинный наклон от удара, падение тела «рэгдолл-лайт», расталкивание
function hitTilt(e,dx,dz,imp){const T=e.tl||(e.tl={x:0,z:0,vx:0,vz:0}),sy=Math.sin(e.yaw),cy=Math.cos(e.yaw),f=dx*sy+dz*cy,s=dx*cy-dz*sy;T.vx+=f*imp;T.vz-=s*imp}
function stepTilt(T,ts){if(!T)return;const k=0.028,c=0.16;T.vx+=(-k*T.x-c*T.vx)*ts;T.vz+=(-k*T.z-c*T.vz)*ts;T.x+=T.vx*ts;T.z+=T.vz*ts;T.x=clamp(T.x,-0.7,0.7);T.z=clamp(T.z,-0.7,0.7)}
function separate(){for(let i=0;i<enemies.length;i++){const a=enemies[i];if(a.dead)continue;for(let j=i+1;j<enemies.length;j++){const b=enemies[j];if(b.dead)continue;
 const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=a.d.rad+b.d.rad;if(d<m&&d>0.0001){const p=(m-d)*0.5,ux=dx/d,uz=dz/d,wa=b.d.boss?0.9:a.d.boss?0.1:0.5;a.x-=ux*p*wa*2*0.5;a.z-=uz*p*wa*2*0.5;b.x+=ux*p*(1-wa);b.z+=uz*p*(1-wa)}}}}
function dmgEnemy(e,dmg,dx,dz,o={}){
 if(e.dead||(e.inv&&!o.force))return;if(ADM.x10)dmg*=10;
 if((e.t==='sota'||e.d.block)&&e.state==='move'&&!o.noBlock&&!o.gb&&P.muso<=0&&Math.random()<(e.d.block||0.4)){sparks((e.x+P.x)/2,1.4,(e.z+P.z)/2,180);SFX.clang();e.cd=Math.min(e.cd,12);P.vx-=dx*0.06;P.vz-=dz*0.06;G.hitstop=3;pop(e.t==='sota'?'Сота блокирует':'Блок','#bba');return}
 e.hp-=dmg;G.hitstop=Math.max(G.hitstop,o.stop==null?4:o.stop);e.flash=6;tar(e.x,e.d.h*0.6,e.z,10);SFX.hit(dmg>=40||o.gb);P.tar=Math.min(1,P.tar+0.03);G.shake=Math.max(G.shake,0.06+(o.knock||0)*0.012);
 if(dx||dz)hitFx(e.x-dx*e.d.rad*0.6,Math.min(1.35,e.d.h*0.6),e.z-dz*e.d.rad*0.6,dx,dz,{big:(o.knock||0)>=8,roll:P.atk&&P.atk.type==='L'?rnd(-0.3,0.3):P.atk&&P.atk.type==='N'?rnd(0.9,1.2):rnd(-1.1,-0.5),col:P.atk&&P.atk.type==='L'?0xb8dcff:0xffe0c0});
 if(e.hp<=0)return killEnemy(e,dx,dz,o);
 const ms=e.d.boss?2.2:e.d.poise?1.7:1,kb=(o.knock||2)*0.014/ms;e.vx+=dx*kb;e.vz+=dz*kb;hitTilt(e,dx,dz,(0.012+(o.knock||2)*0.004)/ms);if(o.launch&&!e.d.boss)e.vy=0.12;
 e.poiseDmg+=dmg;if(e.state!=='hold'&&(e.poiseDmg>=(e.d.poise||0)||o.stagT)){e.poiseDmg=0;if(!(e.d.boss&&e.state==='act')){e.state='stag';e.st=0;e.stagT=o.stagT||(e.d.boss?22:20)}}}
function killEnemy(e,dx,dz,o={}){
 if(e.t==='sota'&&e.phase===1){e.phase=2;e.hp=e.max=Math.round(800*DIFF[G.diff].hp);e.state='trans';e.st=0;e.inv=1;G.rainFreeze=200;SFX.bell();G.shake=0.3;
  for(const h of e.rig.horns)h.visible=true;if(e.rig.mm){e.rig.root.traverse(o=>{if(o.isSkinnedMesh&&o.material.name==='sota_m2')o.visible=false});for(const m of Object.values(e.rig.mm))if(!m.userData.em)m.color.multiply(new THREE.Color(0.75,0.62,0.85))}if(!ASSET.ok)e.rig.human.torso.children[1].material=M.purple;M.sotaSkin.color.set(0x5b4a66);
  say('Сота','…Ты всегда был медленнее, брат.');say('Юки','Он снял маску… Синяя вспышка — только уворот!');tar(e.x,1.2,e.z,60,2);return}
 e.dead=true;e.hp=0;e.deathT=0;G.stats.kills++;lootOnKill(e);if(P.clinch===e){P.clinch=null;P.state='idle'}if(G.lock===e)G.lock=null;
 const up=e.rig.upper;if(e.rig.cut)e.rig.cut();scene.attach(up);const kn=(o.knock||3);e.upV={vx:dx*(0.04+kn*0.004)+rnd(-.02,.02),vy:rnd(0.06,0.1),vz:dz*(0.04+kn*0.004)+rnd(-.02,.02),rx:rnd(-.15,.15),rz:rnd(-.15,.15)};
 {const sy=Math.sin(e.yaw),cy=Math.cos(e.yaw);e.fall={a:0.05,v:0.02+kn*0.003,f:dx*sy+dz*cy,s:dx*cy-dz*sy,sx:dx*(0.02+kn*0.003),sz:dz*(0.02+kn*0.003),n:0};const L=Math.hypot(e.fall.f,e.fall.s)||1;e.fall.f/=L;e.fall.s/=L;if(!(dx||dz)){e.fall.f=-1;e.fall.s=0}}
 e.rig.gl.visible=false;tar(e.x,e.d.h*0.55,e.z,40,1.5);if(!o.issen)G.hitstop=Math.max(G.hitstop,6);
 killFx(e,dx,dz);if(!o.issen){const last=!enemies.some(x=>!x.dead&&x!==e);G.slow=Math.max(G.slow,last?50:14);G.slowTs=last?0.25:0.4;if(last){G.fovT=46;G.fovHold=30;G.shake=Math.max(G.shake,0.2)}}
 spawnSouls(e);if(e.d.boss){G.bossBar=null;SFX.bell();SFX.victory();bossDown(e)}}
const soulGeo=new THREE.SphereGeometry(0.07,10,8),soulMats={r:new MB({color:0xff3020,toneMapped:false}),b:new MB({color:0x2a9aff,toneMapped:false}),y:new MB({color:0xffd93a,toneMapped:false}),p:new MB({color:0xb050ff,toneMapped:false}),k:new MB({color:0x0a0510})};
const soulCol={r:[1,0.2,0.1],b:[0.2,0.6,1],y:[1,0.85,0.2],p:[0.7,0.3,1]};
function spawnSouls(e){let n=0;const list=[...e.d.souls];if(Math.random()<0.3)list.push(['y',1]);
 for(const[c,k]of list)for(let i=0;i<k;i++){const m=new Mesh(soulGeo,soulMats[c]);scene.add(m);souls.push({x:e.x+rnd(-.4,.4),y:e.d.h*0.5+rnd(0,.4),z:e.z+rnd(-.4,.4),vx:rnd(-.03,.03),vy:rnd(0.01,.03),vz:rnd(-.03,.03),c,v:c==='r'?Math.round(rnd(2,4)):c==='b'?Math.round(rnd(3,7)):c==='y'?10:1,age:0,owner:e.revived||e.d.boss?null:e,black:false,ph:rnd(0,6),pulled:false,gone:false,m});n++}
 e.pending=e.revived||e.d.boss?0:n}
function revive(e){removeRig(e);const r=buildRig(e.t);scene.add(r.root);e.rig=r;r.root.traverse(o=>{if(o.isMesh)o.castShadow=true});e.mat=r.mat;
 e.dead=false;e.revived=true;e.max=e.hp=Math.round(e.max*1.5);e.state='move';e.st=0;e.upV=null;e.cd=60;tar(e.x,0.8,e.z,40,2);SFX.grab();if(r.mat)r.mat.color.set(0x14020a);
 if(!G.reviveHint){G.reviveHint=true;say('Юки','Души почернели — Генма вернулся в тело! Поглощай их быстрее.')}}
function enemyActive(e){const a=e.atk,dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz)||1,face=(dx*fwdX(e.yaw)+dz*fwdZ(e.yaw))/d>0.5;
 if(a.k==='leap'){if(e.st<1){e.vy=0.1;e.vx=fwdX(e.yaw)*0.14;e.vz=fwdZ(e.yaw)*0.14}if(Math.floor(e.st)%6===0&&e.hits<3&&d<a.reach+0.4&&P.y<1){e.hits++;hitPlayer(e,a.dmg,{issen:true})}return}
 if(e.hitDone)return;e.hitDone=true;
 if(a.k==='shoot'){e.rig.head.getWorldPosition(tv1);const tx=P.x-tv1.x,ty=1.3+P.y-tv1.y,tz=P.z-tv1.z,L=Math.hypot(tx,ty,tz)||1,sp=0.42;const m=new Mesh(new THREE.CylinderGeometry(0.008,0.008,0.7,4),M.bone);m.rotation.order='YXZ';scene.add(m);
  proj.push({k:'arrow',x:tv1.x,y:tv1.y,z:tv1.z,vx:tx/L*sp,vy:ty/L*sp+0.004,vz:tz/L*sp,life:120,dmg:a.dmg,m});SFX.arrow();return}
 if(d<=a.reach&&face&&P.y<1.2){
  if(a.k==='grab'){if(P.state==='dodge'&&P.t<P.dodgeLen-4){if(P.t<=8)perfectDodge();return}if(P.state==='dead'||P.state==='issen')return;
   P.state='clinch';P.t=0;P.clinch=e;P.clT=40*(G.diff===0?1.6:1);e.state='hold';e.st=0;SFX.grab();pop('ЛКМ+ПКМ — вырваться!','#ffd27a');return}
  hitPlayer(e,a.dmg,{issen:true})}}
function updEnemy(e,ts){
 e.anim+=ts;if(e.flash>0)e.flash-=ts;
 if(e.dead){e.deathT+=ts;if(e.deathT>140&&!e.d.boss){const k=Math.min(1,(e.deathT-140)/90),lo=e.rig.root,up=e.rig.upper;if(k<1){if(Math.random()<0.7){const o=Math.random()<0.5?lo:up;embers(o.position.x+rnd(-.3,.3),o.position.y+rnd(0,.5),o.position.z+rnd(-.3,.3),1,[1,0.4,0.1]);FX.norm.add({x:o.position.x+rnd(-.3,.3),y:o.position.y+rnd(0,.4),z:o.position.z+rnd(-.3,.3),vx:rnd(-.3,.3)/60,vy:rnd(0.4,1.2)/60,vz:rnd(-.3,.3)/60,life:rnd(60,120),s:rnd(0.03,0.07),r:0.12,gg:0.11,b:0.1,a:0.7,drag:0.99})}}
  const sc=Math.max(0.001,1-k*k),s0=lo.userData.s0??(lo.userData.s0=lo.scale.x),s1=up.userData.s0??(up.userData.s0=up.scale.x);lo.scale.setScalar(sc*s0);up.scale.setScalar(sc*s1);if(k>=1){lo.visible=false;up.visible=false}}const u=e.upV,up=e.rig.upper;if(u){up.position.x+=u.vx*ts;up.position.z+=u.vz*ts;up.position.y+=u.vy*ts;u.vy-=0.006*ts;up.rotation.x+=u.rx*ts;up.rotation.z+=u.rz*ts;if(up.position.y<0.15){up.position.y=0.15;const fr=0.72;u.vx*=fr;u.vz*=fr;u.vy=Math.abs(u.vy)>0.02?-u.vy*0.32:0;u.rx*=0.55;u.rz*=0.55;if(Math.abs(u.vy)>0.01)dust(up.position.x,up.position.z,4)}}
  const lo=e.rig.root,F=e.fall;if(F){F.v+=0.0042*Math.sin(F.a+0.25)*ts;F.a+=F.v*ts;if(F.a>1.5){F.a=1.5;F.v=Math.abs(F.v)>0.006?-F.v*0.28:0;if(!F.n++){dust(lo.position.x+F.sx*20,lo.position.z+F.sz*20,10);G.shake=Math.max(G.shake,0.04)}}
   lo.position.x+=F.sx*ts;lo.position.z+=F.sz*ts;const fr=Math.pow(F.a>1.3?0.82:0.95,ts);F.sx*=fr;F.sz*=fr;lo.rotation.order='YXZ';lo.rotation.set(F.a*F.f,e.yaw,-F.a*F.s)}else lo.rotation.x=lerp(lo.rotation.x,-1.2,0.04);if(e.deathT>420){lo.position.y-=0.004*ts;up.position.y-=0.004*ts}return}
 if(e.burn>0){e.burn-=ts;e.burnAcc+=ts;if(Math.random()<0.4)embers(e.x,rnd(0.2,e.d.h),e.z);if(e.burnAcc>=60){e.burnAcc-=60;dmgEnemy(e,5,0,0,{stop:0,knock:0});if(e.dead)return}}
 if(e.inv&&e.state!=='trans'&&e.state!=='intro')e.inv=0;
 if(e.frozen>0){e.frozen-=ts;return}
 e.vy-=0.0075*ts;e.y+=e.vy*ts;if(e.y<0){e.y=0;e.vy=0}
 e.x+=e.vx*ts;e.z+=e.vz*ts;const fr=Math.pow(0.86,ts);e.vx*=fr;e.vz*=fr;arenaClamp(e,0.5);solidPush(e,e.d.rad);
 let dx=P.x-e.x,dz=P.z-e.z;const d=Math.hypot(dx,dz)||1;if(LV.env.nav&&d>1.2){const s=navSteer(e);if(s){dx=s[0]*d;dz=s[1]*d}}const ty=Math.atan2(dx,dz);
 if(e.t==='sota')return updSota(e,ts,d,ty);if(e.d.ai)return e.d.ai(e,ts,d,ty);
 e.st+=ts;const sp=e.d.spd/60;
 switch(e.state){
 case'enter':e.yaw=turn(e.yaw,ty,0.1);e.x+=fwdX(e.yaw)*sp*ts;e.z+=fwdZ(e.yaw)*sp*ts;if(e.st>40){e.state='move';e.st=0}break;
 case'move':e.yaw=turn(e.yaw,ty,0.08);
  if(e.d.keep){if(d<e.d.keep-2){e.x-=dx/d*sp*ts;e.z-=dz/d*sp*ts}else if(d>e.d.range){e.x+=dx/d*sp*ts;e.z+=dz/d*sp*ts}}
  else if(d>e.d.range){e.x+=dx/d*sp*ts;e.z+=dz/d*sp*ts}else{const s=Math.sin(e.anim*0.02)*sp*0.4;e.x+=-dz/d*s*ts;e.z+=dx/d*s*ts}
  e.cd-=ts;if(e.cd<=0&&d<e.d.range+(e.d.keep?4:0.6)&&P.state!=='dead'){const as=e.d.atk;e.atk=as.length>1&&Math.random()<0.35?as[1]:as[0];e.state='wind';e.st=0;e.hitDone=false;e.hits=0;if(e.atk.k==='grab')SFX.grab()}break;
 case'wind':e.yaw=turn(e.yaw,ty,0.05);if(e.st>=e.atk.wind){e.state='act';e.st=0;enemyActive(e)}break;
 case'act':enemyActive(e);if(e.st>=e.atk.act){e.state='rec';e.st=0}break;
 case'rec':if(e.st>=e.atk.rec){e.state='move';e.st=0;e.cd=rnd(40,110)*(G.diff===2?0.7:1)}break;
 case'stag':if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=rnd(20,60)}break;
 case'hold':e.yaw=ty;if(P.clinch!==e){e.state='rec';e.st=0;e.atk=e.d.atk[0]}break;}}
function sotaAtk(e,k){const sp=e.phase===2?1.3:1;e.state='wind';e.st=0;e.hitDone=false;e.comboN=1;
 if(k==='combo'){e.atk={k:'slash',wind:Math.round(24/sp),act:5,rec:12,dmg:14,reach:2.9};e.comboN=3}else if(k==='dash')e.atk={k:'dash',wind:30,act:14,rec:30,dmg:22};
 else if(k==='iai'){e.atk={k:'iai',wind:56,act:6,rec:44,dmg:40};SFX.iai()}else e.atk={k:'tar',wind:30,act:4,rec:30,dmg:15}}
function updSota(e,ts,d,ty){e.st+=ts;const sp=e.phase===2?1.3:1;
 if(e.state==='intro'){e.yaw=ty;e.inv=1;if(!G.subs.length){e.state='move';e.st=0;e.cd=50;e.inv=0}return}
 if(e.state==='trans'){if(e.st>220){e.state='move';e.st=0;e.inv=0;e.cd=30}return}
 const dx=P.x-e.x,dz=P.z-e.z,v=e.d.spd/60*sp;
 switch(e.state){
 case'move':e.yaw=turn(e.yaw,ty,0.12);if(d>2.6){e.x+=dx/d*v*ts;e.z+=dz/d*v*ts}else if(d<1.6){e.x-=dx/d*v*0.5*ts;e.z-=dz/d*v*0.5*ts}else{e.x+=-dz/d*v*0.4*ts;e.z+=dx/d*v*0.4*ts}
  e.cd-=ts*sp;if(e.cd<=0&&P.state!=='dead'){const r=Math.random();if(d>6)sotaAtk(e,'dash');else if(r<0.22)sotaAtk(e,'iai');else if(e.phase===2&&r<0.42)sotaAtk(e,'tar');else sotaAtk(e,'combo')}break;
 case'wind':if(e.atk.k!=='dash'||e.st<e.atk.wind-6)e.yaw=turn(e.yaw,ty,0.15);if(e.st>=e.atk.wind){e.state='act';e.st=0;const a=e.atk;
   if(a.k==='slash'){e.vx+=fwdX(e.yaw)*0.07;e.vz+=fwdZ(e.yaw)*0.07;SFX.swingR();if(d<=a.reach&&(dx*fwdX(e.yaw)+dz*fwdZ(e.yaw))/d>0.4)hitPlayer(e,a.dmg,{issen:true})}
   else if(a.k==='dash'){e.vx=fwdX(e.yaw)*0.4;e.vz=fwdZ(e.yaw)*0.4;SFX.swingR()}
   else if(a.k==='iai'){const fx=e.x,fz=e.z,dd=Math.max(d,0.1);e.x=P.x+dx/dd*2.6;e.z=P.z+dz/dd*2.6;arenaClamp(e,0.6);lines.push({x1:fx,z1:fz,x2:e.x,z2:e.z,life:24});SFX.swingL();G.shake=0.2;
    const sx=e.x-fx,sz=e.z-fz,sl=sx*sx+sz*sz||1,t=clamp(((P.x-fx)*sx+(P.z-fz)*sz)/sl,0,1),px=fx+sx*t,pz=fz+sz*t;if(Math.hypot(P.x-px,P.z-pz)<1.0&&d<9)hitPlayer(e,a.dmg,{unblock:true});e.yaw+=Math.PI}
   else{const m=new Mesh(new THREE.ConeGeometry(0.5,1,8),M.genma);scene.add(m);proj.push({k:'tarw',x:e.x+fwdX(e.yaw),y:0,z:e.z+fwdZ(e.yaw),vx:dx/d*0.14,vy:0,vz:dz/d*0.14,life:140,dmg:15,m});SFX.grab()}}break;
 case'act':if(e.atk.k==='dash'&&!e.hitDone&&d<1.3){e.hitDone=true;hitPlayer(e,e.atk.dmg,{issen:true})}if(e.st>=e.atk.act){e.state='rec';e.st=0}break;
 case'rec':if(e.st>=e.atk.rec){if(e.comboN>1){e.comboN--;e.atk={...e.atk,wind:Math.round(14/sp)};e.state='wind';e.st=0}else{e.state='move';e.st=0;e.cd=rnd(40,90)/sp}}break;
 case'stag':if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=20}break;}}
// ---------- chapters
function clearWorld(){for(const e of enemies)removeRig(e);for(const s of souls)scene.remove(s.m);for(const p of proj)scene.remove(p.m);enemies=[];souls=[];proj=[];lines=[];FX.add.list.length=0;FX.norm.list.length=0}
function loadChapter(i,cp){clearWorld();clearWI();G.chap=i;const c=CH[i];const env=buildEnv(c.theme);
 env.mirrors=c.mirrors.map(([x,z,y])=>makeMirror(ENV,x,z,y));const gp=(LAYOUT[c.theme]&&LOCN[c.theme]&&LVok(LOCN[c.theme])&&LAYOUT[c.theme].gate)||[0,16];env.gate=makeGate(ENV,gp[0],c.house?-90:gp[1]);
 LV={c,env,wave:0,waveT:0,started:false,done:false,walls:env.walls||null,house:!!c.house,H:env.H||null};G.subs=[];G.bossBar=null;G.rainFreeze=0;G.rainUp=false;G.issenFx=null;G.lock=null;M.sotaSkin.color.set(0x9c7b66);
 resetPlayer(0,c.house?-14.6:-12);G.camYaw=0;G.camK=1;
 if(cp){LV.wave=cp.wave;const m=env.mirrors[cp.mi]||env.mirrors[0];P.x=m.x+Math.sin(m.face.parent.rotation.y)*1.5;P.z=m.z+Math.cos(m.face.parent.rotation.y)*1.5;P.oni=cp.oni||0;for(let k=0;k<=cp.mi;k++)activateMirror(env.mirrors[k],true);LV.started=true}
 else{G.cp={chap:i,wave:0,mi:0,oni:0};for(const s of c.start)say(s[0],s[1])}
 activateMirror(env.mirrors[0],true);setupChests(cp);if(c.house)houseLoad(cp);
 G.card={t:0,title:c.title,name:c.name}}
function activateMirror(m,silent){if(m.act)return;m.act=true;m.face.material=M.mirrorOn;m.lant.material=M.lampOn;if(!silent){P.food=3;P.hp=P.max;pop('Зеркало-сакр: путь сохранён','#e6c98a');SFX.bell()}}
function spawnWave(){const w=LV.c.waves[LV.wave];for(const s of w.say)say(s[0],s[1]);
 SFX.spawn(true);const used=[];w.en.forEach((t,i)=>{let x,z,tries=0;if(LV.env.nav){[x,z]=navSpawn(t,i,used);const e=mkEnemy(t,x,z);e.yaw=Math.atan2(P.x-x,P.z-z);enemies.push(e);if(t==='sota'){G.bossBar=e;SFX.bell()}return}do{const a=G.camYaw+rnd(-1.3,1.3)+(i%2?0.4:-0.4),r=t==='yumi'?rnd(11,14):t==='sota'?7:rnd(8,11);x=P.x+Math.sin(a)*r;z=P.z+Math.cos(a)*r;tries++}while(Math.hypot(x,z)>LV.env.R-1.5&&tries<30);
  if(Math.hypot(x,z)>LV.env.R-1.5){const k=(LV.env.R-1.5)/Math.hypot(x,z);x*=k;z*=k}
  const e=mkEnemy(t,x,z);enemies.push(e);if(t==='sota'){G.bossBar=e;SFX.bell()}});LV.active=true}
function updGate(){const gt=LV.env.gate,u=gateP.userData;if(!gt||!gt.t.visible){u.open=0;gateP.visible=false;return}
 if(!u.open){const nx=CH[G.chap+1];portalCol(gateP,PCOL[nx?nx.theme:'ash']||PCOL.ash);u.w=LVok('portal')?PORTAL_R:1.15;u.h=LVok('portal')?PORTAL_R:1.55;u.int=1;u.spin=1;ripple(gateP)}
 gateP.position.set(gt.x,1.75,gt.z);gateP.rotation.set(0,0,0);u.open=Math.min(1,u.open+0.02);if(!CS.on){u.int=lerp(u.int,1,0.05);u.spin=lerp(u.spin,1,0.05)}updPortal(gateP)}
function updChapter(ts){if(LV.env.hdoor)updDuelDoor();
 if(LV.house){updHouse(ts);if(G.rainFreeze>0)G.rainFreeze-=ts;return}
 if(!LV.started){LV.waveT+=ts;if(LV.waveT>300||Math.hypot(P.x,P.z+12)>4){LV.started=true;LV.waveT=150}}
 else if(!LV.active&&LV.wave<LV.c.waves.length){LV.waveT+=ts;if(LV.waveT>180&&!G.subs.length||LV.waveT>420){spawnWave();LV.waveT=0}}
 else if(LV.active&&!enemies.some(e=>!e.dead)){LV.active=false;LV.wave++;LV.waveT=0;if(LV.wave>=LV.c.waves.length){unsealChests();SFX.victory();if(G.chap<CH.length-1&&!LV.c.noGate){LV.env.gate.t.visible=true;say('Юки','Путь открыт. Иди к вратам.');SFX.bell()}}else{pop('Волна отбита','#cfc6b0');SFX.clear()}}
 if(LV.active&&G.frame%30===0&&!musicOn())SFX.taiko(G.frame%120===0?1:0.55);
 for(const [i,m] of LV.env.mirrors.entries())if(!m.act&&Math.hypot(P.x-m.x,P.z-m.z)<1.8){activateMirror(m);G.cp={chap:G.chap,wave:LV.wave+(LV.active?0:0),mi:i,oni:P.oni}}
 const gt=LV.env.gate;if(gt.t.visible){gt.glow.material.opacity=0.25+Math.sin(G.frame*0.05)*0.1;if(Math.hypot(P.x-gt.x,P.z-gt.z)<2.6&&!G.trans&&!CS.on&&P.state!=='dead')startPortalExit()}
 if(G.rainFreeze>0){G.rainFreeze-=ts;if(G.rainFreeze<=0)G.rainUp=true}}
function updWorld(ts){
 for(const e of enemies){if(!CS.on)updEnemy(e,ts);stepTilt(e.tl,ts)}separate();if(LV.env.nav)for(const e of enemies)if(!e.dead)navClamp(e);
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],b=enemies[j];if(a.dead||b.dead)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=a.d.rad+b.d.rad+0.2;if(d<m&&d>0.001){const p=(m-d)*0.1;a.x-=dx/d*p;a.z-=dz/d*p;b.x+=dx/d*p;b.z+=dz/d*p}}
 enemies=enemies.filter(e=>{if(e.dead&&e.pending<=0&&e.deathT>700){removeRig(e);return false}return true});
 const orb=hero.arms.L.orb;orb.getWorldPosition(tv1);const gx=tv1.x,gy=tv1.y,gz=tv1.z;
 for(const s of souls){s.age+=ts;const dx=gx-s.x,dy=gy-s.y,dz=gz-s.z,d=Math.hypot(dx,dy,dz)||1;
  if(!s.black&&s.owner&&s.age>DIFF[G.diff].decay){s.black=true;s.m.material=soulMats.k}
  if(s.black){const o=s.owner,tx=o.x-s.x,ty=0.3-s.y,tz=o.z-s.z,td=Math.hypot(tx,ty,tz)||1;s.x+=tx/td*0.05*ts;s.y+=ty/td*0.05*ts;s.z+=tz/td*0.05*ts;if(td<0.2){s.gone=true;o.pending--;o.blackIn++;if(o.pending<=0&&o.dead)revive(o)}}
  else{s.pulled=(P.absorbing&&d<5)||(s.c==='y'&&P.hp<P.max*0.5&&d<6)||d<0.6||(P.muso>0&&d<3);
   if(s.pulled){s.vx+=dx/d*0.012*ts;s.vy+=dy/d*0.012*ts;s.vz+=dz/d*0.012*ts;const v=Math.hypot(s.vx,s.vy,s.vz);if(v>0.22){s.vx*=0.22/v;s.vy*=0.22/v;s.vz*=0.22/v}}
   else{s.vx*=0.94;s.vz*=0.94;s.vy+=((1.1+Math.sin(G.frame*0.05+s.ph)*0.12)-s.y)*0.003*ts;s.vy*=0.94}
   s.x+=s.vx*ts;s.y+=s.vy*ts;s.z+=s.vz*ts;if(G.frame%4===0)FX.add.add({x:s.x,y:s.y,z:s.z,vx:0,vy:0.002,vz:0,life:20,s:0.12,r:soulCol[s.c][0],gg:soulCol[s.c][1],b:soulCol[s.c][2],a:0.6});
   if(d<0.35){s.gone=true;if(s.owner)s.owner.pending--;SFX.soul();if(s.c==='r')G.souls.r+=s.v;else if(s.c==='b'){P.mana=Math.min(100,P.mana+s.v);G.souls.b+=s.v}else if(s.c==='y')P.hp=Math.min(P.max,P.hp+10);else{G.souls.p++;P.oni=Math.min(100,P.oni+20)}if(s.c==='r')P.oni=Math.min(100,P.oni+2)}}
  s.m.position.set(s.x,s.y,s.z);if(s.gone)scene.remove(s.m)}
 souls=souls.filter(s=>!s.gone);
 for(const p of proj){p.x+=p.vx*ts;p.y+=p.vy*ts;p.z+=p.vz*ts;p.life-=ts;
  if(p.k==='arrow'){p.vy-=0.0012*ts;p.m.position.set(p.x,p.y,p.z);p.m.rotation.set(Math.PI/2-Math.atan2(p.vy,Math.hypot(p.vx,p.vz)),Math.atan2(p.vx,p.vz),0);
   if(!p.defl&&Math.hypot(p.x-P.x,p.z-P.z)<0.5&&p.y>P.y&&p.y<P.y+1.9){const r=hitPlayer(p,p.dmg,{proj:true});if(r==='block'){p.defl=true;p.vx*=-0.3;p.vz*=-0.3;p.vy=0.06}else if(r!=='dodge')p.life=0}if(p.y<0)p.life=0}
  else if(p.k==='fire'){p.m.position.set(p.x,p.y,p.z);embers(p.x,p.y,p.z,2);for(const e of enemies)if(!e.dead&&!p.hit.has(e)&&Math.hypot(e.x-p.x,e.z-p.z)<1.4){p.hit.add(e);e.burn=180;dmgEnemy(e,40,p.vx*5,p.vz*5,{knock:5})}}
  else if(p.k==='orb')updOrb(p,ts);
  else if(p.k==='tarw'){p.m.position.set(p.x,0.3+Math.sin(p.life*0.3)*0.1,p.z);if(Math.random()<0.8)tar(p.x,0.2,p.z,1);if(!p.done&&Math.hypot(p.x-P.x,p.z-P.z)<0.8&&P.y<0.4){p.done=true;hitPlayer(p,p.dmg,{})}}
  if(p.life<=0)scene.remove(p.m)}
 proj=proj.filter(p=>p.life>0);
 FX.add.update(ts);FX.norm.update(ts);
 for(const f of flashes)f.life-=ts;for(let i=flashes.length-1;i>=0;i--)if(flashes[i].life<=0)flashes.splice(i,1);
 updKWave(ts);for(const l of lines)l.life-=ts;lines=lines.filter(l=>l.life>0);
 if(!CS.on)updChapter(ts);updGate();updItems(ts);
 if(LV.env.theme==='ash'&&G.frame%2===0)FX.norm.add({x:P.x+rnd(-12,12),y:0,z:P.z+rnd(-12,12),vx:rnd(-.3,.3)/60,vy:rnd(0.3,0.9)/60,vz:rnd(-.3,.3)/60,life:rnd(200,400),s:rnd(0.03,0.06),r:0.55,gg:0.52,b:0.5,a:0.7});
 if(LV.env.theme==='ash'&&G.frame%3===0)embers(P.x+rnd(-10,10),rnd(0,1),P.z+rnd(-10,10));
 if(LV.env.theme==='forest'&&G.frame%5===0)FX.add.add({x:P.x+rnd(-10,10),y:rnd(0.3,2.5),z:P.z+rnd(-10,10),vx:rnd(-.2,.2)/60,vy:rnd(-.1,.1)/60,vz:rnd(-.2,.2)/60,life:rnd(160,300),s:0.04,r:0.9,gg:1.6,b:0.5,pulse:rnd(0,6),fade:false,sw:rnd(0,6)});
 // падающие листья (лес) и пепел сверху (деревня) — их сносит ветер
 if(LV.env.theme==='forest'&&G.frame%4===0){const y=Math.random()<0.5;FX.norm.add({x:P.x+rnd(-12,12),y:rnd(4,8),z:P.z+rnd(-12,12),vx:0,vy:-rnd(0.35,0.6)/60,vz:0,life:rnd(500,800),s:rnd(0.05,0.08),r:y?0.32:0.12,gg:y?0.26:0.2,b:y?0.08:0.06,a:0.9,sw:rnd(0,6),w:1,g:0.00001,stick:true})}
 if(LV.env.theme==='ash'&&G.frame%2===0)FX.norm.add({x:P.x+rnd(-14,10),y:rnd(5,9),z:P.z+rnd(-12,12),vx:0,vy:-rnd(0.25,0.5)/60,vz:0,life:rnd(500,800),s:rnd(0.025,0.05),r:0.42,gg:0.4,b:0.38,a:0.75,sw:rnd(0,6),w:1.4,g:0.00001,stick:true})}
