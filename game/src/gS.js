// ---------- КАТСЦЕНЫ: появление героя (пролог) и переходы через порталы между локациями
const CS={on:false,k:null,t:0,fn:null,skip:null,bars:0,fade:0,fadeC:'0,0,0',subs:[],cam:{p:new V3(),l:new V3()},fov:55,H:{},lights:[]};
const kf=(t,a,b)=>clamp((t-a)/(b-a),0,1),ek=(t,a,b)=>ease(kf(t,a,b));
const PCOL={rift:{sw:0xff2a60,core:0xffa0c8,ring:0xffd0e0,dark:0x12020a,l:0xff3070},ash:{sw:0xff5020,core:0xffa060,ring:0xffd8a0,dark:0x160402,l:0xff7030},
 forest:{sw:0x30ffa0,core:0xb0ffd0,ring:0xeaffd8,dark:0x020e06,l:0x50ffa0},duel:{sw:0x5a90ff,core:0xc8dcff,ring:0xffffff,dark:0x02040e,l:0x7aa8ff}};
const csTex=(()=>{const mk=fn=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');fn(x,c);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
 const rad=(x,st)=>{const g=x.createRadialGradient(128,128,0,128,128,128);for(const s of st)g.addColorStop(s[0],s[1]);x.fillStyle=g;x.fillRect(0,0,256,256)};
 return{core:mk(x=>rad(x,[[0,'rgba(255,255,255,1)'],[0.3,'rgba(255,255,255,0.55)'],[0.75,'rgba(255,255,255,0.18)'],[1,'rgba(255,255,255,0)']])),
  dark:mk(x=>rad(x,[[0,'rgba(255,255,255,1)'],[0.8,'rgba(255,255,255,0.95)'],[1,'rgba(255,255,255,0)']])),
  swirl:mk(x=>{x.translate(128,128);x.lineCap='round';for(let a=0;a<6;a++){x.save();x.rotate(a*Math.PI/3);let px=0,py=0;for(let i=1;i<=48;i++){const k=i/48,r=6+k*116,an=k*3.4,nx=Math.cos(an)*r,ny=Math.sin(an)*r;x.strokeStyle=`rgba(255,255,255,${0.95*Math.sin(k*Math.PI)})`;x.lineWidth=2+11*Math.sin(k*Math.PI);x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();px=nx;py=ny}x.restore()}}),
  beam:mk(x=>{const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(255,255,255,0.0)');g.addColorStop(0.15,'rgba(255,255,255,0.9)');g.addColorStop(1,'rgba(255,255,255,0.0)');x.fillStyle=g;x.fillRect(0,0,256,256);
   x.globalCompositeOperation='destination-in';const h=x.createLinearGradient(0,0,256,0);h.addColorStop(0,'rgba(0,0,0,0.25)');h.addColorStop(0.5,'rgba(0,0,0,1)');h.addColorStop(1,'rgba(0,0,0,0.25)');x.fillStyle=h;x.fillRect(0,0,256,256)})}})();
const csMat=(map,blend=THREE.AdditiveBlending)=>new MB({map,transparent:true,blending:blend,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:false});
function makePortal(){const g=new Group(),disc=new THREE.CircleGeometry(1,56);
 const part=(map,z,ro,bl)=>{const m=new Mesh(disc,csMat(map,bl));m.position.z=z;m.renderOrder=ro;g.add(m);return m};
 const u={dark:part(csTex.dark,-0.02,11,THREE.NormalBlending),core:part(csTex.core,0,12),sw:part(csTex.swirl,0.01,13),sw2:part(csTex.swirl,-0.01,13)};
 u.ring=new Mesh(new THREE.RingGeometry(0.95,1.05,72),csMat(null));u.ring.renderOrder=14;g.add(u.ring);
 u.rip=[0,1,2].map(()=>{const m=new Mesh(new THREE.RingGeometry(0.86,1,56),csMat(null));m.renderOrder=14;m.visible=false;g.add(m);return{m,t:99}});
 g.userData=Object.assign(u,{w:1,h:1,open:0,int:1,spin:1,l:0xffffff});g.visible=false;scene.add(g);return g}
function portalCol(p,c){const u=p.userData;u.dark.material.color.set(c.dark);u.core.material.color.set(c.core);u.sw.material.color.set(c.sw);u.sw2.material.color.set(c.sw);u.ring.material.color.set(c.ring);for(const r of u.rip)r.m.material.color.set(c.ring);u.l=c.l}
function ripple(p){const r=p.userData.rip.find(r=>r.t>=30)||p.userData.rip[0];r.t=0}
function updPortal(p,ts=1){const u=p.userData,o=u.open;p.visible=o>0.004;if(!p.visible)return;const t=G.frame/60,wob=1+Math.sin(t*7)*0.025*o;
 p.scale.set(u.w*o*wob,u.h*o*(2-wob),1);u.sw.rotation.z-=0.035*u.spin*ts;u.sw2.rotation.z+=0.022*u.spin*ts;u.sw2.scale.setScalar(0.72);u.core.scale.setScalar(0.9+Math.sin(t*5)*0.06);
 const I=Math.min(u.int,1.9);u.dark.material.opacity=Math.min(1,o*1.4)*0.92;u.core.material.opacity=0.32*I;u.sw.material.opacity=0.55*I;u.sw2.material.opacity=0.4*I;u.ring.material.opacity=0.65*I;
 for(const r of u.rip){r.t+=ts;r.m.visible=r.t<30;if(r.m.visible){const k=r.t/30;r.m.scale.setScalar(0.15+k*1.1);r.m.position.z=0.02;r.m.material.opacity=(1-k)*0.9}}}
const gateP=makePortal(),csP=makePortal();
const beam=new Mesh(new THREE.CylinderGeometry(0.55,1.1,9,24,1,true),csMat(csTex.beam));beam.renderOrder=12;beam.visible=false;scene.add(beam);
function csLights(){const s=[];for(const p of[gateP,csP])if(p.visible){p.getWorldPosition(tv1);s.push([tv1.x,tv1.y,tv1.z,p.userData.l,(p===csP?7:3.5)*p.userData.open*p.userData.int,10])}return s}
function csPrecompile(on){for(const p of[gateP,csP]){p.visible=on;p.position.set(0,1.5,-2);p.scale.setScalar(1)}beam.visible=on}
// ---------- движок
function csSay(n,t,a,b){CS.subs.push({n,t,a,b})}
function csStart(k,fn,skip){CS.card=null;CS.img=null;CS.imgT=0;CS.onImgClose=null;CS.on=true;CS.k=k;CS.t=0;CS.fn=fn;CS.skip=skip;CS.subs=[];CS.H={};CS.fov=55;G.lock=null;G.trans=0;G.csBlend=null;
 P.atk=null;P.buf=null;P.pendR=P.pendL=false;P.idleClip=null;P.csPose=null;P.csLook=null;P.csScale=null;P.csHide=false;P.vx=P.vz=0;P.mvS=0;
 for(const k in K)K[k]=0;mdx=mdy=0}
function csEnd(subs){CS.card=null;CS.img=null;CS.onImgClose=null;CS.on=false;CS.fn=CS.skip=null;CS.bars=0;CS.fade=0;CS.subs=[];P.csPose=null;P.csLook=null;P.csScale=null;P.csHide=false;
 csP.userData.open=0;csP.visible=false;beam.visible=false;if(P.state!=='draw'&&P.state!=='sheathe'){P.state='idle';P.t=0}
 G.csBlend={p:camera.position.clone(),l:CS.cam.l.clone(),t:0};G.camYaw=P.yaw;G.camPitch=0.28;G.fov=G.fovT=55;
 G.subs=[];if(subs)for(const s of subs)say(s[0],s[1]);for(const k in K)K[k]=0}
function csHero(ts){const H=CS.H;P.t+=ts;P.idleT=0;let mv=0;
 if(P.state==='draw'||P.state==='sheathe'){const dr=P.state==='draw',n=(ANIMS.clips[P.state]||{n:40}).n,T=P.t*P.drawSpd;if(dr&&T>=n*0.6)P.drawn=true;if(!dr&&T>=n*0.75)P.drawn=false;if(T>=n){P.state='idle';P.t=0;P.drawn=dr}}
 if(H.to){const dx=H.to[0]-P.x,dz=H.to[1]-P.z,d=Math.hypot(dx,dz);if(d>0.06){P.yaw=turn(P.yaw,Math.atan2(dx,dz),0.18);mv=Math.min(d,H.spd||0.032)}else{H.to=null}}
 if(H.yaw!=null&&!mv)P.yaw=turn(P.yaw,H.yaw,H.yawK||0.08);
 if(H.fly){P.x+=H.fly[0]*ts;P.z+=H.fly[1]*ts;H.fly[0]*=0.93;H.fly[1]*=0.93}
 if(H.grav){P.vy-=0.0075*ts;P.y+=P.vy*ts;if(P.y<=0){P.y=0;const v=P.vy;P.vy=0;H.grav=false;if(H.onLand)H.onLand(v)}}
 P.gait=H.gait??0;P.mvS=lerp(P.mvS||0,mv,0.25);mv=P.mvS<0.0005?0:P.mvS;P.x+=fwdX(P.yaw)*mv*ts;P.z+=fwdZ(P.yaw)*mv*ts;
 if(P.state==='idle'||P.state==='run')P.state=mv>0.002?'run':'idle';
 P.walk=lerp(P.walk,mv>0.002?1:0,0.2);P.walkPh+=mv*ts*(4.4-1.8*P.gait)}
function csTick(){mdx=mdy=0;CS.t++;
 if(CS.skip&&CS.t>15&&(hit('Enter')||hit('Space'))){const f=CS.skip;CS.skip=null;f();if(!CS.on)return}
 if(CS.img){CS.imgT++;if(CS.onImgClose&&CS.imgT>40&&(hit('Enter')||hit('Space')||MP[0]||hit('KeyX')||hit('Escape'))){CS.onImgClose();return}}
 CS.fn(CS.t);if(!CS.on)return;
 csHero(1);updWorld(1);updPortal(csP);
 const sh=G.shake;camera.position.set(CS.cam.p.x+rnd(-sh,sh)*0.3,CS.cam.p.y+rnd(-sh,sh)*0.3,CS.cam.p.z);camera.lookAt(CS.cam.l);
 G.fov=lerp(G.fov,CS.fov,0.1);camera.fov=G.fov;camera.updateProjectionMatrix()}
function cam(p,l,k=1,p2,l2){if(p2){CS.cam.p.set(lerp(p[0],p2[0],k),lerp(p[1],p2[1],k),lerp(p[2],p2[2],k));CS.cam.l.set(lerp(l[0],l2[0],k),lerp(l[1],l2[1],k),lerp(l[2],l2[2],k))}else{CS.cam.p.set(...p);CS.cam.l.set(...l)}}
function drawCS(){X.clearRect(0,0,W,H);X.drawImage(vig,0,0);const b=CS.bars*H*0.115;X.fillStyle='#000';X.fillRect(0,0,W,b);X.fillRect(0,H-b,W,b);X.textAlign='center';X.textBaseline='alphabetic';
 if(G.card){const c=G.card,a=c.t<40?c.t/40:c.t>150?1-(c.t-150)/40:1;X.globalAlpha=clamp(a,0,1);X.fillStyle='rgba(0,0,0,0.45)';X.fillRect(0,H*0.24-62,W,112);X.fillStyle='#b9a27a';X.font='18px Georgia';X.fillText(c.title,W*0.5,H*0.24-22);X.fillStyle='#f0e8da';X.font='44px Georgia,serif';X.fillText(c.name,W/2,H*0.24+28);X.globalAlpha=1}
 for(const s of CS.subs){if(CS.t<s.a||CS.t>s.b)continue;const a=Math.min(1,(CS.t-s.a)/14,(s.b-CS.t)/14);X.globalAlpha=a;X.font='bold 18px Georgia,serif';const nw=X.measureText(s.n).width;X.font='21px Georgia,serif';const tw=X.measureText(s.t).width,x0=W/2-(nw+tw+22)/2,y=H-Math.max(b*0.42,60);
  X.textAlign='left';X.font='bold 18px Georgia,serif';X.fillStyle='#e6c26a';X.fillText(s.n,x0,y);X.font='21px Georgia,serif';X.fillStyle='#f2ede4';X.fillText(s.t,x0+nw+22,y);X.textAlign='center';X.globalAlpha=1;break}
 if(CS.card)itemCard(CS.card,850,130,370,450,1);
 if(CS.fade>0.001){X.fillStyle=`rgba(${CS.fadeC},${Math.min(1,CS.fade)})`;X.fillRect(0,0,W,H)}
 if(CS.img&&CS.img.complete){X.drawImage(CS.img,0,0,W,H);if(CS.imgT>40){X.textAlign='right';X.font='14px Georgia,serif';X.fillStyle='rgba(240,230,210,0.7)';X.fillText('Enter / клик — закрыть',W-26,H-18)}X.textAlign='left';return}
 if(CS.skip&&CS.t>15){X.textAlign='right';X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.45)';X.fillText('Enter — пропустить',W-26,H-16)}X.textAlign='left'}
// ---------- 1) пролог: Мусаси выбрасывает из разлома в незнакомую горящую деревню, на него сразу нападают Гэнма
function startIntro(){const c=LV.c;G.subs=[];G.card=null;resetPlayer(0,-12);P.drawn=false;P.y=8.6;P.csHide=true;
 portalCol(csP,PCOL.rift);Object.assign(csP.userData,{w:1.9,h:1.9,open:0,int:1,spin:1.6});csP.position.set(0,9.2,-12);csP.rotation.set(Math.PI/2,0,0);
 beam.material.color.set(PCOL.rift.core);beam.position.set(0,4.6,-12);beam.material.opacity=0;
 const EN=[[-2.7,-7.3],[2.9,-7.0],[0.4,-6.2]].slice(0,c.waves[0].en.length);let foes=null;
 const spawn=()=>{if(foes)return;foes=c.waves[0].en.map((t,i)=>{const e=mkEnemy(t,EN[i%EN.length][0],EN[i%EN.length][1]);e.state='csIdle';e.y=-1.8;e.yaw=Math.atan2(P.x-e.x,P.z-e.z);enemies.push(e);return e})};
 const finish=()=>{spawn();for(const e of foes){e.y=0;e.state='move';e.st=0;e.cd=rnd(75,125);e.yaw=Math.atan2(P.x-e.x,P.z-e.z)}
  P.y=0;P.vy=0;P.csHide=false;if(!P.drawn&&P.state!=='draw'){P.drawn=true;P.state='idle'}P.yaw=0;
  LV.started=true;LV.wave=0;LV.waveT=0;LV.active=true;csEnd([...c.start,...c.waves[0].say]);SFX.taiko(1)};
 csStart('intro',t=>{const H=CS.H,c0=PCOL.rift;
  CS.bars=1;CS.fade=t<70?1-ek(t,0,70):0;
  if(t===6)G.card={t:30,title:c.title,name:c.name};
  // общий план горящей деревни
  if(t<150)cam([11,7.5,-25],[0,1.5,-10],ek(t,0,150),[8.5,6,-21.5],[0,3,-11]);
  // разлом в небе
  if(t===110){SFX.rift&&SFX.rift();G.shake=0.06}
  if(t>=110){const u=csP.userData;u.open=t<236?ek(t,110,190)*(1+Math.sin(t*0.3)*0.04):Math.max(0,1-ek(t,236,262)*1.0);u.int=1+Math.max(0,Math.sin(t*0.21))*0.4;if(t%9===0&&u.open>0.1)flashL(0,8.4,-12,c0.l,5*u.open,12);if(t%3===0&&u.open>0.2)embers(rnd(-1.2,1.2),8.9,-12+rnd(-1.2,1.2),1,[1,0.2,0.5])}
  if(t===262)sparks(0,9,-12,70,[1,0.3,0.6]);
  if(t>=150&&t<280){const k=ek(t,150,205);cam([3.6,0.9,-17.8],[0,6.8,-12],k,[3.1,1.2,-17.4],[0,Math.max(1.3,P.y+1.1),-12])}
  // столп света и падение героя
  beam.visible=t>=180&&t<250;if(beam.visible)beam.material.opacity=Math.min(ek(t,180,198),1-ek(t,236,250))*0.42*(0.85+Math.random()*0.15);
  if(t===200){P.csHide=false;P.y=8.6;P.vy=-0.02;H.grav=true;P.csPose={p:POSE.fall,w:1};SFX.warp&&SFX.warp();
   H.onLand=v=>{G.shake=0.4;dust(P.x,P.z,46);sparks(P.x,0.2,P.z,50,[1,0.5,0.7]);flashL(P.x,0.6,P.z,c0.l,9,30);(SFX.impact||SFX.taiko)(1.6);P.ldv=(P.ldv||0)-0.11;P.csPose={p:POSE.kneel,w:1};H.landT=CS.t}}
  if(t>200&&t<250&&P.y>0.3&&t%2===0)FX.add.add({x:P.x+rnd(-.3,.3),y:P.y+rnd(0.2,1.6),z:P.z+rnd(-.3,.3),vx:0,vy:0.03,vz:0,life:22,s:0.12,r:1.6,gg:0.4,b:0.9,a:0.6});
  // крупный план: герой на колене, поднимается
  if(t>=280&&t<400)cam([1.35,0.72,-9.5],[0,0.8,-12],ek(t,280,400),[1.05,1.0,-9.85],[0,1.22,-12]);
  if(t>=320&&P.csPose&&P.csPose.p===POSE.kneel)P.csPose.w=1-ek(t,320,372);
  if(t===300)csSay('Акира','…Где я?',300,392);
  // осматривается — облёт вокруг героя
  if(t>=400&&t<560){const a=lerp(0.5,2.5,ek(t,400,560)),r=3.7;cam([Math.sin(a)*r,1.75,-12+Math.cos(a)*r],[0,1.3,-12]);P.csLook=Math.sin((t-400)*0.045)*1.1}
  if(t===410)csSay('Акира','Огонь… пепел… Я не знаю этих земель.',410,548);
  // из смолы поднимаются Гэнма
  if(t===520){spawn();SFX.grab&&SFX.grab()}
  if(foes&&t<690){const k=ek(t,525,640);for(const e of foes){e.y=-1.8*(1-k);if(k<1&&t%2===0){tar(e.x,0.05,e.z,3,0.7);if(t%6===0)dust(e.x,e.z,1)}e.yaw=Math.atan2(P.x-e.x,P.z-e.z)}}
  if(t>=560&&t<650){P.csLook=lerp(P.csLook||0,0,0.08);H.yaw=0;cam([-0.95,1.8,-15.2],[0.2,1.0,-7.2],ek(t,560,650),[-0.75,1.7,-14.6],[0.2,1.1,-7.2])}
  if(t===600&&SFX.roar)SFX.roar();if(t===570)csSay('Юки','Акира! Генма — обнажи мечи!',570,690);
  // обнажает Акацуки и Ёи
  if(t===650){P.csLook=null;P.state='draw';P.t=0;P.drawSpd=1;SFX.draw(true)}
  if(t>=650&&t<705)cam([0.75,1.45,-10.4],[0,1.35,-12],ek(t,650,705),[0.5,1.5,-10.95],[0,1.45,-12]);
  // Гэнма бросаются в атаку — камера уходит за спину, начинается бой
  if(t>=690&&foes)for(const e of foes){e.state='move';e.anim+=1;const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz);if(d>2.3){e.x+=dx/d*0.036;e.z+=dz/d*0.036}e.yaw=Math.atan2(dx,dz)}
  if(t===690)SFX.taiko(1.3);
  if(t>=705){const k=ek(t,705,770);cam([-0.6,2.1,-14.5],[-0.3,1.4,-10],k,[-0.45,1.7+4.6*Math.sin(0.28),-12-4.6*Math.cos(0.28)],[-0.45,1.35,-12]);CS.bars=1-ek(t,725,770)}
  if(t>=770)finish()},()=>{CS.fade=0;csP.userData.open=0;beam.visible=false;finish()})}
// ---------- 2) переход: герой касается портала во вратах и его затягивает в новую локацию
function startPortalExit(){const gt=LV.env.gate,side=Math.sign(P.z-gt.z)||-1,S=[gt.x,gt.z+side*1.05],fz=-side,next=G.chap+1;
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.2;SFX.draw(false)}else{P.state='idle';P.t=0}
 const go=()=>{const oni=P.oni,mana=P.mana;G.subs=[];loadChapter(next);P.oni=oni;P.mana=mana;startArrival()};
 csStart('exit',t=>{const H=CS.H,u=gateP.userData,sx=gt.x+4.6;
  CS.bars=ek(t,0,22);
  if(t===1){H.to=S;H.spd=0.034;H.gait=0}
  if(t<105)cam([gt.x-3.9,1.65,gt.z+side*4.8],[gt.x,1.5,gt.z+side*0.8],ek(t,0,105),[gt.x-3.2,1.55,gt.z+side*3.9],[gt.x,1.6,gt.z+side*0.5]);
  if(t===95){H.to=null;H.yaw=Math.atan2(gt.x-P.x,gt.z-P.z);H.yawK=0.2}
  if(t>=95&&t<210&&!P.csPose){P.csPose={p:POSE.reach,w:0}}
  if(P.csPose&&t<200)P.csPose.w=ek(t,100,130);
  // касание: рябь, свет, звук
  if(t>=105&&t<215)cam([gt.x-0.9,1.62,gt.z+side*3.1],[gt.x+0.1,1.55,gt.z],ek(t,105,215),[gt.x-0.58,1.56,gt.z+side*2.3],[gt.x,1.6,gt.z]);
  if(t===128){SFX.portal&&SFX.portal();G.shake=0.08}
  if(t>=128&&t<200&&t%8===0){ripple(gateP);hero.arms.L.orb.getWorldPosition(tv1);sparks(tv1.x,tv1.y,tv1.z,8,[0.8,0.9,1]);flashL(tv1.x,tv1.y,tv1.z,u.l,5,10)}
  if(t>=128){u.int=1+ek(t,128,200)*0.9;u.spin=1+ek(t,128,215)*5}
  if(t>=128&&t<220&&t%1===0){const a=rnd(0,Math.PI*2),r=rnd(1.2,2.6);FX.add.add({x:P.x+Math.cos(a)*r,y:rnd(0.2,2.4),z:P.z+Math.sin(a)*r*0.6,vx:(gt.x-P.x-Math.cos(a)*r)*0.03,vy:(1.6-1.2)*0.01,vz:(gt.z-P.z)*0.03,life:30,s:rnd(0.04,0.09),r:1.4,gg:1.6,b:2,a:0.8})}
  // затягивает в портал
  if(t===168){SFX.warp&&SFX.warp();P.csPose={p:POSE.fall,w:0.6}}
  if(t>=168){const k=ek(t,168,212);P.z=lerp(S[1],gt.z,k*0.85);P.x=lerp(S[0],gt.x,k);P.y=k*0.25;P.csScale=[1-k*0.55,1-k*0.25,1+k*2.4];CS.fov=55+k*38;G.shake=Math.max(G.shake,k*0.08)}
  CS.fadeC='255,250,240';CS.fade=ek(t,180,214);if(t>=214)P.csHide=true;
  if(t>=226)go()},go)}
// ---------- 3) прибытие: портал выплёвывает героя в новую локацию
function startArrival(){const c=LV.c,th=c.theme,pc=PCOL[th]||PCOL.ash,PZ=-13.7;G.subs=[];G.card=null;resetPlayer(0,PZ);P.csHide=true;P.y=0.3;
 portalCol(csP,pc);Object.assign(csP.userData,{w:1.15,h:1.55,open:1,int:1.4,spin:4});csP.position.set(0,1.62,PZ-0.15);csP.rotation.set(0,0,0);
 const line={forest:['Акира','Тишина… Бамбук шепчет, будто знает моё имя.'],duel:['Акира','Колокол… Сота где-то рядом.']}[th]||['Акира','Снова чужая земля.'];
 const finish=()=>{P.csHide=false;P.y=0;P.vy=0;P.x=0;if(P.z<-12.6)P.z=-12.2;P.yaw=0;csEnd(c.start)};
 csStart('arrive',t=>{const H=CS.H,u=csP.userData;
  CS.bars=t<300?1:1-ek(t,300,345);CS.fadeC='255,250,240';CS.fade=1-ek(t,0,42);
  if(t<140)cam([2.7,1.15,-9.0],[0,1.3,PZ+0.6],ek(t,0,140),[2.3,1.0,-9.6],[0,1.15,PZ+1.3]);
  if(t<100){u.int=1.4-ek(t,30,100)*0.4;u.spin=4-ek(t,0,100)*2.5}
  if(t===28){SFX.warp&&SFX.warp();ripple(csP);sparks(0,1.6,PZ,60,[0.9,1,1]);flashL(0,1.6,PZ+0.5,pc.l,9,26);P.csHide=false;P.csPose={p:POSE.fall,w:1};P.vy=0.07;H.grav=true;H.fly=[0,0.13];G.shake=0.15;
   H.onLand=()=>{G.shake=0.3;dust(P.x,P.z,36);(SFX.impact||SFX.taiko)(1.2);P.ldv=(P.ldv||0)-0.1;P.csPose={p:POSE.kneel,w:1};H.fly=null}}
  if(t>=28&&t<70&&t%2===0)FX.add.add({x:P.x+rnd(-.3,.3),y:P.y+rnd(0.3,1.7),z:P.z+rnd(-.3,.3),vx:0,vy:0.01,vz:-0.02,life:26,s:0.11,r:1.4,gg:1.6,b:2,a:0.6});
  if(P.csPose&&P.csPose.p===POSE.kneel)P.csPose.w=1-ek(t,110,158);
  // портал схлопывается за спиной
  if(t>=96&&t<146)u.open=1-ek(t,96,140)*(1+Math.sin(t*0.5)*0.05);if(t===140){u.open=0;sparks(0,1.6,PZ,80,[0.9,1,1]);flashL(0,1.6,PZ,pc.l,10,20);(SFX.impact||SFX.taiko)(0.7)}
  if(t>=118&&t<140&&t%6===0)ripple(csP);
  // кран-подъём камеры: открывается новая локация
  if(t>=140){const k=ek(t,140,300);cam([1.0,1.65,-15.6],[0,1.45,-10.5],k,[2.4,4.3,-18.4],[0,1.2,1]);P.csLook=t<290?Math.sin((t-140)*0.04)*0.9:lerp(P.csLook||0,0,0.1)}
  if(t===150)G.card={t:0,title:c.title,name:c.name};
  if(t===165)csSay(line[0],line[1],165,290);
  if(t>=300){const k=ek(t,300,345);cam([2.4,4.3,-18.4],[0,1.2,1],k,[-0.45,1.7+4.6*Math.sin(0.28),P.z-4.6*Math.cos(0.28)],[-0.45,1.35,P.z])}
  if(t>=345)finish()},()=>{CS.fade=0;csP.userData.open=0;finish()})}
