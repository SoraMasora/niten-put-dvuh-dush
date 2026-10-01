// ---------- visual sync
function heroPose(){const st=P.stance,base=[POSE.tiger,POSE.crane,POSE.water][st];let p=base;const s=P.state;
 if(s==='atk'){const a=P.atk,T=P.t*P.atkSpd,k1=ease(T/a.s),k2=ease((T-a.s)/a.a),k3=ease((T-a.s-a.a)/a.r);
  if(a.spin){p=T<a.s?mixPose(base,POSE.spinA,k1):T<a.s+a.a?mixPose(POSE.spinA,POSE.spinB,k2):mixPose(POSE.spinB,base,k3)}
  else if(a.type==='R'){p=T<a.s?mixPose(base,POSE.rUp,k1):T<a.s+a.a?mixPose(POSE.rUp,POSE.rDown,k2):mixPose(POSE.rDown,base,k3)}
  else if(a.type==='L'){p=T<a.s?mixPose(base,POSE.lBack,k1):T<a.s+a.a?mixPose(POSE.lBack,POSE.lThrust,k2):mixPose(POSE.lThrust,base,k3)}
  else{p=T<a.s?mixPose(base,POSE.nUp,k1):T<a.s+a.a?mixPose(POSE.nUp,POSE.nDown,k2):mixPose(POSE.nDown,base,k3)}}
 else if(s==='block'||s==='clinch')p=POSE.block;else if(s==='dodge')p=POSE.dodge;else if(s==='absorb')p=POSE.absorb;else if(s==='issen')p=POSE.issen;else if(s==='hurt')p=POSE.hurt;else if(s==='dead')p=POSE.dead;else if(s==='eat')p=POSE.eat;else if(s==='dive')p=POSE.nDown;
 else if(s==='idle'&&P.st<30)p=mixPose(base,POSE.hurt,0.3);
 P.pose=mixPose(P.pose,p,s==='atk'||s==='issen'?0.7:0.25);return P.pose}
const glV=new V3();
function syncHero(t){const p=heroPose();applyPose(hero,p,P.walk,P.walkPh,t);hero.root.position.set(P.x,P.y,P.z);hero.root.rotation.y=P.yaw;
 hero.root.rotation.x=P.state==='dead'?lerp(hero.root.rotation.x,0,0.1):0;
 heroMats.skin.color.setRGB(0.69*(1-P.tar*0.7),0.5*(1-P.tar*0.7),0.41*(1-P.tar*0.7));
 const glow=P.muso>0||P.stance===0;M.blade.emissive=M.blade.emissive||new THREE.Color();M.blade.emissive.set(P.muso>0?0x802000:0x000000);
 hero.arms.L.orb.scale.setScalar(1+Math.sin(t*6)*0.15+(P.absorbing?0.8:0));
 const attacking=P.state==='atk'||P.state==='issen';updTrail(trails.R,hero.arms.R.sw,attacking&&P.atk&&P.atk.type!=='L'||P.state==='issen');updTrail(trails.L,hero.arms.L.sw,attacking&&P.atk&&P.atk.type!=='R');
 for(const [i,g] of ghosts.entries()){g.visible=P.muso>0;if(g.visible){const a=t*3+i*Math.PI;g.position.set(P.x-fwdX(P.yaw)*0.4+Math.cos(a)*0.5,1.5+Math.sin(a*1.3)*0.3,P.z-fwdZ(P.yaw)*0.4+Math.sin(a)*0.5);g.rotation.set(-0.8+Math.sin(a)*0.5,P.yaw+Math.cos(a),0)}}
 // absorb bolts
 const pos=[];if(P.absorbing){hero.arms.L.orb.getWorldPosition(glV);for(let i=0;i<7;i++){let x=glV.x,y=glV.y,z=glV.z;const tgt=souls[i%Math.max(1,souls.length)];for(let k=0;k<5;k++){const nx=tgt&&!tgt.black?lerp(x,tgt.x,0.35)+rnd(-.15,.15):x+fwdX(P.yaw)*0.4+rnd(-.2,.2),ny=tgt?lerp(y,tgt.y,0.35)+rnd(-.15,.15):y+rnd(-.2,.2),nz=tgt&&!tgt.black?lerp(z,tgt.z,0.35)+rnd(-.15,.15):z+fwdZ(P.yaw)*0.4+rnd(-.2,.2);pos.push(x,y,z,nx,ny,nz);x=nx;y=ny;z=nz}}}
 bolts.geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bolts.visible=pos.length>0}
function syncEnemy(e,t){const r=e.rig,wind=e.state==='wind',k=wind?ease(e.st/e.atk.wind):0,act=e.state==='act',rec=e.state==='rec';
 if(!e.dead){r.root.position.set(e.x,e.y,e.z);r.root.rotation.y=e.yaw}
 if(r.mat){r.mat.emissive.set(e.flash>0?0x606060:e.frozen>0?0x103060:e.burn>0?0x401000:0x000000)}
 const mv=(e.state==='move'||e.state==='enter')?1:0,ph=e.anim*0.18;
 if(e.dead){r.gl.visible=false;return}
 if(r.kind==='ash'||r.kind==='gasa'){r.legs[0].rotation.x=Math.sin(ph)*0.5*mv;r.legs[1].rotation.x=-Math.sin(ph)*0.5*mv;r.torso.rotation.x=0.4+Math.sin(t*2+e.anim)*0.04;
  if(r.kind==='ash'){r.weap.position.z=wind?-0.5*k:act?0.7:rec?0.7*(1-e.st/e.atk.rec):0;r.arm.rotation.x=e.state==='stag'?0.6:0}
  else{const grab=e.atk&&e.atk.k==='grab'&&(wind||e.state==='hold');const a2=r.root.userData.arm2;
   if(grab){r.arm.rotation.x=-1.4;a2.rotation.x=-1.4;r.weap.rotation.x=1.2}else{r.arm.rotation.x=wind?lerp(-0.6,-3.0,k):act?-0.2:rec?lerp(-0.2,-0.6,e.st/e.atk.rec):-0.6;a2.rotation.x=-0.3;r.weap.rotation.x=0.8}}}
 else if(r.kind==='kama'){r.legs.forEach((l,i)=>l.rotation.x=Math.sin(ph*1.6+i*1.6)*0.8*mv);r.hips.rotation.x=e.y>0.05?-0.4:0;r.arm.rotation.x=wind?-0.9*k:act?0.9:0}
 else if(r.kind==='yumi'){const ext=wind?k*1.2:rec?1.2*(1-Math.min(1,e.st/40)):act?1.2:0;r.neck.forEach((n,i)=>{n.position.set(Math.sin(t*2+i)*0.05*ext,0.35+i*(0.08+ext*0.17),0.05+Math.sin(i*0.8)*0.1*ext)});
  const top=r.neck[6].position;r.head.position.set(top.x,top.y+0.12,top.z);r.head.lookAt(tv1.set(P.x,1.5,P.z));}
 else if(r.kind==='sota'){let p=POSE.crane;const a=e.atk;
  if(wind&&a){p=a.k==='iai'?mixPose(POSE.crane,POSE.iai,k):mixPose(POSE.crane,POSE.nUp,k)}else if(act||rec){p=a&&a.k==='iai'?POSE.issen:POSE.nDown}else if(e.state==='stag'||e.state==='trans')p=POSE.hurt;
  e.pose=mixPose(e.pose||POSE.crane,p,0.35);applyPose(r.human,e.pose,mv,ph*0.9,t)}
 const tele=wind&&e.atk.wind-e.st<=30;r.gl.visible=tele;if(tele){r.tip.getWorldPosition(tv1);r.gl.position.copy(tv1);const kk=1-(e.atk.wind-e.st)/30,sc=0.25+kk*0.7;r.gl.scale.set(sc,sc,1);
  r.gl.material.color.set(e.atk.k==='grab'?glintCols.purple:e.atk.k==='iai'?glintCols.blue:glintCols.red);r.gl.material.rotation=t*2}}
const iaiLine=new Mesh(new THREE.BoxGeometry(0.06,0.06,1),new MB({color:0x80c8ff,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false,depthWrite:false}));iaiLine.visible=false;scene.add(iaiLine);
function syncWorld(t){
 for(const f of flames){const k=0.85+Math.sin(t*9+f.ph)*0.1+Math.sin(t*23+f.ph)*0.05;f.s.scale.set(0.6*f.b*k,1.1*f.b*(2-k),1);if(Math.random()<0.05*f.b)embers(f.x,f.y+0.5*f.b,f.z)}
 for(const l of STATIC)if(l.userData.base)l.intensity=l.userData.base*(0.85+Math.sin(t*11+l.position.x)*0.08+Math.random()*0.07);
 // dynamic lights
 const src=[];src.push([P.x-fwdX(G.camYaw)*1.5,2.2,P.z-fwdZ(G.camYaw)*1.5,0xc0c8d8,2.5,8]);
 if(P.absorbing){hero.arms.L.orb.getWorldPosition(tv1);src.push([tv1.x,tv1.y,tv1.z,0x50a8ff,6,7])}
 for(const f of flashes)src.push([f.x,f.y,f.z,f.col,f.int*f.life/f.max,9]);
 for(const p of proj)if(p.k==='fire')src.push([p.x,p.y,p.z,0xff7030,6,9]);
 const ss=souls.filter(s=>!s.black).slice(0,3);for(const s of ss)src.push([s.x,s.y,s.z,s.c==='r'?0xff3020:s.c==='b'?0x2a8aff:s.c==='y'?0xffc030:0xb050ff,1.5,4]);
 if(P.muso>0)src.push([P.x,1.5,P.z,0xff8040,3,6]);
 src.sort((a,b)=>b[4]-a[4]);
 DYN.forEach((l,i)=>{const s=src[i];if(!s){l.intensity=0;return}l.position.set(s[0],s[1],s[2]);l.color.set(s[3]);l.intensity=s[4];l.distance=s[5]});
 moon.position.set(P.x-10,20,P.z-8);moon.target.position.set(P.x,0,P.z);
 // iai line
 const L=lines[0];iaiLine.visible=!!L;if(L){iaiLine.position.set((L.x1+L.x2)/2,1.2,(L.z1+L.z2)/2);iaiLine.lookAt(L.x2,1.2,L.z2);iaiLine.scale.set(1,1,Math.hypot(L.x2-L.x1,L.z2-L.z1)||0.1);iaiLine.material.opacity=L.life/24}
 // rain
 if(rain.obj){const a=rain.arr;const fz=G.rainFreeze>0,up=G.rainUp;rain.obj.position.set(P.x,0,P.z);for(let i=0;i<rain.N;i++){const o=i*6;if(!fz){const dy=up?0.1:-0.3;a[o+1]+=dy;a[o+4]+=dy;if(a[o+1]<0){a[o+1]+=12;a[o+4]+=12}if(a[o+1]>12){a[o+1]-=12;a[o+4]-=12}}}rain.obj.geometry.attributes.position.needsUpdate=true}
 // issen
 const fx=G.issenFx;crescent.visible=false;if(fx){const tt=fx.t;if(tt<24){crescent.visible=true;const k=Math.min(1,tt/5);crescent.geometry.dispose();crescent.geometry=new THREE.RingGeometry(2.3,2.75,48,1,Math.PI*0.95,-Math.PI*1.1*k);
   crescent.position.set(fx.x,1.3,fx.z);crescent.lookAt(camera.position);crescent.rotateZ(-0.5);crescent.material.opacity=tt<9?1:Math.max(0,1-(tt-9)/15)}}
 renderer.toneMappingExposure=lerp(renderer.toneMappingExposure,fx&&fx.t<10?0.06:(THEMES[LV.env.theme].exp),fx&&fx.t<10?0.6:0.15);
 if(LV.env.bell)LV.env.bell.rotation.z=Math.sin(t*0.8)*0.03}
function updCamera(){
 const sens=0.0026;G.camYaw-=mdx*sens;G.camPitch=clamp(G.camPitch+mdy*sens*0.8,-0.05,0.9);mdx=mdy=0;
 if(down('ArrowLeft'))G.camYaw+=0.035;if(down('ArrowRight'))G.camYaw-=0.035;
 if(hit('Tab')){if(G.lock)G.lock=null;else G.lock=nearest(16)}if(G.lock&&(G.lock.dead||Math.hypot(G.lock.x-P.x,G.lock.z-P.z)>20))G.lock=null;
 if(G.lock){const ty=Math.atan2(G.lock.x-P.x,G.lock.z-P.z);G.camYaw=turn(G.camYaw,ty,0.06)}
 else if(G.bossBar&&G.bossBar.state==='intro'){const b=G.bossBar;G.camYaw=turn(G.camYaw,Math.atan2(b.x-P.x,b.z-P.z),0.03)}
 if(G.fovHold>0)G.fovHold--;else G.fovT=55;G.fov=lerp(G.fov,G.fovT,0.15);camera.fov=G.fov;camera.updateProjectionMatrix();
 const dist=G.camDist*(G.fov<50?0.8:1),cp=Math.cos(G.camPitch),sp=Math.sin(G.camPitch);
 let tx=P.x,tz=P.z;if(G.lock){tx=lerp(P.x,G.lock.x,0.25);tz=lerp(P.z,G.lock.z,0.25)}
 const sh=G.shake;camera.position.set(tx-Math.sin(G.camYaw)*dist*cp+rnd(-sh,sh)*0.3,1.7+P.y*0.6+dist*sp+rnd(-sh,sh)*0.3,tz-Math.cos(G.camYaw)*dist*cp);
 const rx=-Math.cos(G.camYaw)*0.45,rz=Math.sin(G.camYaw)*0.45;camera.position.x+=rx;camera.position.z+=rz;
 camera.lookAt(tx+rx,1.35+P.y*0.6,tz+rz)}
