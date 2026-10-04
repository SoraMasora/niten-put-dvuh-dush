// ---------- v0.17: ГЛАВА 8 «Путь» — храм двух катан (blender/ext/temple.py -> niten_temple.glb + gTd.js)
// Портал «Зелёной пустоши» -> потеря сознания -> пробуждение в храме. Выбор: Кьору (синяя, истинная концовка) или Шиори (красная).
const TP={t:0,sw:{},aura:{},bm:{},freeze:0,ask:null,hint:0,hold:null,white:null,nar:[],lid:1,ov:null,stars:null,water:null,deco:[],done:0,end:null,rel:null};
const TP_INFO={blue:{n:'Кьору',f:'Кьору — горькая истина',d:'синяя катана · холодный свет правды',c:'#8cc0ff',hex:0x3a8cff},
 red:{n:'Шиори',f:'Шиори — дремлющая птица',d:'красная катана · в клинке спит пламя',c:'#ff8a70',hex:0xff3020}};
const _tpM=new THREE.Matrix4(),_tpM2=new THREE.Matrix4(),_tpP=new THREE.Vector3(),_tpQ=new THREE.Quaternion(),_tpS=new THREE.Vector3(),_tpZ=new THREE.Vector3(0,0,1),_tpV=new THREE.Vector3();
function tpNavV(){const N=TEMPLED.nav;if(!N.g){const b=atob(N.b),n=N.w*N.h,g=new Uint8Array(n);for(let k=0;k<n;k++)g[k]=(b.charCodeAt(k>>3)>>(7-(k&7)))&1;N.g=g;N.dist=new Int32Array(n).fill(-1);N.q=new Int32Array(n);N.pc=-1;N.ft=-99;
  const s=atob(N.gh),u=new Uint16Array(n);for(let k=0;k<n;k++)u[k]=s.charCodeAt(2*k)|(s.charCodeAt(2*k+1)<<8);N.G=u}return N}
function tpGH(x,z){const N=tpNavV();let fx=(x-N.x0)/N.cs-0.5,fz=(z-N.z0)/N.cs-0.5;fx=clamp(fx,0,N.w-1.001);fz=clamp(fz,0,N.h-1.001);const i=fx|0,j=fz|0,a=fx-i,b=fz-j,W=N.w,U=N.G,k=j*W+i;
 return((U[k]*(1-a)+U[k+1]*a)*(1-b)+(U[k+W]*(1-a)+U[k+W+1]*a)*b)/100+N.ho}
// камера: внутри стен храма, не в столпах и не под полом
function tpCamFix(C){const B=TEMPLED.bounds;C.x=clamp(C.x,B[0]+0.25,B[1]-0.25);C.z=clamp(C.z,B[2]+0.25,B[3]-0.25);
 for(const p of TEMPLED.pil){const dx=C.x-p[0],dz=C.z-p[1],d=Math.hypot(dx,dz);if(d<1.15&&d>1e-4){C.x=p[0]+dx/d*1.15;C.z=p[1]+dz/d*1.15}}
 const g=tpGH(C.x,C.z)+0.4;if(C.y<g)C.y=g;if(C.y>11)C.y=11}
// ---------- окружение
function buildTempleEnv(g,env){TP.deco=[];
 const tl=locAdd(g,'tpl',true);tl.traverse(o=>{if(!o.isMesh||!o.material)return;const m=o.material;if(/tp_deco/.test(m.name||'')&&!m.userData.tpG){m.userData.tpG=1;m.emissive=new THREE.Color(0xffc870);m.emissiveIntensity=1.3;TP.deco.push(m)}if(!m.userData.tpE){m.userData.tpE=1;m.envMapIntensity=0.22}});
 for(const p of['tpbridge','tpaltar'])locAdd(g,p,true).traverse(o=>{if(o.isMesh&&o.material&&!/tp_(gold|silk)/.test(o.material.name||''))o.material.envMapIntensity=0.25});
 const gl=locAdd(g,'tpglow',false);gl.traverse(o=>{if(o.isMesh){o.material.toneMapped=false;o.castShadow=false}});
 const wa=locAdd(g,'tpwater',false);TP.water=null;wa.traverse(o=>{if(!o.isMesh)return;const m=o.material.clone();m.color=new THREE.Color(0x1e6f7c);m.transparent=true;m.opacity=0.82;m.roughness=0.06;m.metalness=0.2;m.envMapIntensity=1.4;m.depthWrite=false;
  m.emissive=new THREE.Color(0x0a3a48);m.emissiveIntensity=0.5;o.material=m;o.castShadow=false;o.receiveShadow=true;o.renderOrder=2;TP.water=m});
 // звёздное небо (храм без крыши)
 const n=900,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,e=0.12+Math.random()*1.4,r=150;pos[i*3]=Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r;pos[i*3+2]=Math.sin(a)*Math.cos(e)*r}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));TP.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xdfe6ff,size:1.6,sizeAttenuation:false,fog:false,toneMapped:false,transparent:true,opacity:0.85,depthWrite:false}));TP.stars.renderOrder=-5;TP.stars.frustumCulled=false;g.add(TP.stars);
 const Lt=(i,x,y,z,c,b,d)=>{const l=STATIC[i];if(!l)return;l.position.set(x,y,z);l.color.set(c);l.userData.base=b;l.intensity=b;l.distance=d};
 const A=TEMPLED.alt,S=TEMPLED.spawn;Lt(0,S[0]+1.5,2.4,S[1],0xffb070,2.2,9);Lt(1,A.blue[0],A.blue[1]+0.7,A.blue[2],0x4a90ff,2.4,7);Lt(2,A.red[0],A.red[1]+0.7,A.red[2],0xff4a2a,2.4,7);Lt(3,10.5,3.2,0,0xffc080,2.0,12);Lt(4,19,3.2,0,0xffb070,1.6,10);
 // катаны на подставках
 TP.sw={};TP.aura={};TP.bm={};
 for(const k of['blue','red']){const b=k==='blue',s=makeSword(b?0.86:0.9,b?M.tsubaL:M.tsubaR,b,b?'SW_Y':'SW_A'),em=new THREE.Color(TP_INFO[k].hex),mats=[];
  s.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;if(o.material===M.blade){const m=M.blade.clone();m.emissive=em.clone();m.emissiveIntensity=0.9;o.material=m;mats.push(m)}});
  const a=A[k];s.position.set(a[0]-0.31,a[1]+0.015,a[2]);s.rotation.set(0,Math.PI/2,0);s.userData.rest={p:s.position.clone(),q:s.quaternion.clone()};g.add(s);TP.sw[k]=s;TP.bm[k]=mats;
  const au=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:em,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));au.position.set(a[0]+0.05,a[1]+0.05,a[2]);au.scale.set(1.9,0.55,1);g.add(au);TP.aura[k]=au}
 env.temple=true}
function tpSwordReset(){for(const k in TP.sw){const s=TP.sw[k],r=s.userData.rest;s.position.copy(r.p);s.quaternion.copy(r.q);s.visible=true;for(const m of TP.bm[k])m.emissiveIntensity=0.9}}
// меч в правом кулаке — как собственный клинок героя (центр кулака, ориентация от полной кисти)
function tpGrip(s,k=1,FP=null,FQ=null){const A=hero.arms.R;_tpM.copy(hero.hips.matrixWorld).invert().multiply(A.hand.matrixWorld).multiply(_gripM.R).decompose(_tpP,_tpQ,_tpS);
 _tpM2.compose(_tpP,_hqF.R,_tpS.set(1,1,1));_tpM.multiplyMatrices(hero.hips.matrixWorld,_tpM2).decompose(s.position,s.quaternion,s.scale);
 if(k<1&&FP){s.position.lerpVectors(FP,s.position,k);if(FQ){_tpQ.copy(s.quaternion);s.quaternion.copy(FQ).slerp(_tpQ,k)}}s.updateMatrixWorld(true)}
// ---------- загрузка, кадр
function tpLoad(cp){LV.temple=true;try{window.speechSynthesis&&speechSynthesis.getVoices()}catch(_){}LV.env.nav=tpNavV();TP.freeze=0;TP.ask=null;TP.hint=0;TP.hold=null;TP.done=0;TP.nar=[];TP.lid=1;TP.ov=null;TP.rel=null;P.csGrip=0;P.csRx=0;tpWhite(false);
 const S=TEMPLED.spawn;P.x=S[0];P.z=S[1];P.yaw=Math.PI/2;G.camYaw=P.yaw;P._nx=undefined;P.y=0;P.vy=0;GY=tpGH(P.x,P.z);G.camDist=4.2;
 G.cp={chap:G.chap,wave:0,mi:0,oni:P.oni}}
function tpAnim(ts){if(!LV.temple)return;TP.t+=ts;if(!TP.freeze)GY=tpGH(P.x,P.z);
 if(TP.stars)TP.stars.position.copy(camera.position);
 for(const m of TP.deco)m.emissiveIntensity=1.2+0.25*Math.sin(TP.t*0.02);
 for(const k in TP.aura){const au=TP.aura[k],s=TP.sw[k];if(!s)continue;const ph=TP.t*0.045+(k==='red'?1.7:0);au.visible=s.visible&&!TP.hold;au.material.opacity=0.32+0.12*Math.sin(ph);
  if(!CS.on&&s.visible&&G.frame%9===(k==='red'?4:0)){const r=s.userData.rest.p,c=k==='blue'?[0.5,0.8,1.6]:[1.7,0.55,0.3];FX.add.add({x:r.x+0.31+rnd(-0.45,0.45),y:r.y+rnd(0,0.05),z:r.z+rnd(-0.04,0.04),vx:0,vy:rnd(0.004,0.01),vz:0,life:rnd(40,70),s:rnd(0.025,0.05),r:c[0],gg:c[1],b:c[2],a:0.8})}}
 const l1=STATIC[1],l2=STATIC[2];if(l1&&!CS.on)l1.intensity=l1.userData.base*(0.9+0.1*Math.sin(TP.t*0.05));if(l2&&!CS.on)l2.intensity=l2.userData.base*(0.9+0.1*Math.sin(TP.t*0.06+1))}
function updTemple(ts){if(P.y<0)P.y=0;
 if(!TP.hint&&G.frame%60===0&&!G.subs.length){TP.hint=1;say('Юки','Две катаны на островах: синяя — слева, красная — справа. Подойди к ним по мостам.')}}
function tpNear(){if(CS.on||TP.done)return null;const A=TEMPLED.alt;
 for(const k of['blue','red']){const a=A[k],d=Math.hypot(P.x-a[0],P.z-a[2]);if(d>2.75)continue;const I=TP_INFO[k];
  if(TP.ask===k)return{k:'kak',label:'X — подтвердить выбор: взять «'+I.f+'»',f:()=>tpChoose(k)};
  return{k:'kak',label:'X — взять катану «'+I.n+'»',f:()=>{TP.ask=k;SFX.bell&&SFX.bell();say('Юки',(k==='blue'?'Кьору… горькая истина.':'Шиори… дремлющая птица.')+' Возьмёшь её — и другой путь закроется навсегда. Нажми X ещё раз, если уверен.')}}}
 TP.ask=null;return null}
function tpChoose(k){if(TP.done)return;TP.done=1;TP.ask=null;G.subs=[];G.card=null;if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.2;SFX.draw(false)}if(k==='blue')tpBlueCS();else tpRedCS()}
// ---------- HUD: таблички имён у алтарей
function drawTpHUD(){if(CS.on||TP.done)return;const A=TEMPLED.alt;let best=null,bd=6;for(const k of['blue','red']){const a=A[k],d=Math.hypot(P.x-a[0],P.z-a[2]);if(d<bd){bd=d;best=k}}
 X.textAlign='left';X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.6)';X.fillText('Выбери одну катану: Кьору (слева) или Шиори (справа)',30,34);
 if(!best)return;const I=TP_INFO[best],al=clamp((6-bd)/2,0,1);X.save();X.globalAlpha=al;X.textAlign='center';
 const y=96;X.fillStyle='rgba(0,0,0,0.45)';X.fillRect(W/2-300,y-46,600,86);X.strokeStyle=I.c;X.lineWidth=1;X.beginPath();X.moveTo(W/2-240,y+30);X.lineTo(W/2+240,y+30);X.stroke();
 X.shadowColor=I.c;X.shadowBlur=18;X.fillStyle=I.c;X.font='bold 34px Georgia,serif';X.fillText(I.f,W/2,y);X.shadowBlur=0;X.fillStyle='rgba(235,228,214,0.8)';X.font='italic 15px Georgia,serif';X.fillText(I.d,W/2,y+22);
 if(TP.ask===best){X.fillStyle=`rgba(255,200,150,${0.7+0.3*Math.sin(G.frame*0.15)})`;X.font='bold 15px Georgia,serif';X.fillText('Выбор необратим — X ещё раз, чтобы взять',W/2,y+56)}X.restore();X.textAlign='left'}
// ---------- поверх катсцены: веки, засветка, голос за кадром
function tpSay(n,t,a,b,o={}){TP.nar.push(Object.assign({n,t,a,b},o))}
function tpVoice(t){try{const S=window.speechSynthesis;if(!S||!window.SpeechSynthesisUtterance)return;const u=new SpeechSynthesisUtterance(t);u.lang='ru-RU';u.rate=0.88;u.pitch=0.75;u.volume=0.95;
 const v=(S.getVoices()||[]).filter(v=>/^ru/i.test(v.lang));if(v.length)u.voice=v.find(v=>/male|муж|dmitri|pavel|yuri/i.test(v.name))||v[0];S.speak(u)}catch(_){}}
function tpVoiceOff(){try{window.speechSynthesis&&speechSynthesis.cancel()}catch(_){}}
function drawTpCS(){const t=CS.t;
 if(TP.lid<0.999){const h=(1-TP.lid)*H*0.56,c=H*0.12*(1-TP.lid*0.5);X.fillStyle='#000';X.beginPath();X.moveTo(0,0);X.lineTo(W,0);X.lineTo(W,h);X.quadraticCurveTo(W/2,h+c,0,h);X.fill();
  X.beginPath();X.moveTo(0,H);X.lineTo(W,H);X.lineTo(W,H-h);X.quadraticCurveTo(W/2,H-h-c,0,H-h);X.fill();if(TP.lid>0.02){X.fillStyle=`rgba(0,0,0,${0.5*(1-TP.lid)})`;X.fillRect(0,0,W,H)}}
 if(TP.ov&&TP.ov.a>0.001){X.fillStyle=`rgba(${TP.ov.c},${Math.min(1,TP.ov.a)})`;X.fillRect(0,0,W,H)}
 X.textAlign='center';for(const s of TP.nar){if(t<s.a||t>s.b)continue;const a=Math.min(1,(t-s.a)/16,(s.b-t)/16);X.globalAlpha=clamp(a,0,1);
  if(s.mid){X.fillStyle=s.dark?'rgba(40,42,56,1)':'rgba(236,230,220,1)';X.font='italic 28px Georgia,serif';const dy=s.low?H*0.3:0;X.fillText(s.t,W/2,H*0.5+dy);if(s.n){X.font='14px Georgia,serif';X.fillStyle=s.dark?'rgba(90,92,110,1)':'rgba(230,194,106,1)';X.fillText(s.n,W/2,H*0.5-38+dy)}}
  else{X.font='bold 18px Georgia,serif';const nw=X.measureText(s.n).width;X.font='21px Georgia,serif';const tw=X.measureText(s.t).width,x0=W/2-(nw+tw+22)/2,y=H-62;X.textAlign='left';
   X.shadowColor='#000';X.shadowBlur=8;X.font='bold 18px Georgia,serif';X.fillStyle='#e6c26a';X.fillText(s.n,x0,y);X.font='21px Georgia,serif';X.fillStyle='#f2ede4';X.fillText(s.t,x0+nw+22,y);X.shadowBlur=0;X.textAlign='center'}
  X.globalAlpha=1}X.textAlign='left'}
// ---------- белое пространство
function tpWhite(on){if(!on){if(TP.white)TP.white.visible=false;return}
 if(!TP.white){const g=new Group(),d=new Mesh(new THREE.CircleGeometry(60,72),new MB({color:0xdcdee6}));d.rotation.x=-Math.PI/2;g.add(d);
  const sh=new Mesh(new THREE.CircleGeometry(0.9,32),new MB({map:TX.dot,color:0x8a90a8,transparent:true,opacity:0.55,depthWrite:false,toneMapped:false}));sh.rotation.x=-Math.PI/2;sh.position.y=0.01;g.add(sh);
  const rm=new MB({map:TX.dot,color:0xc8d6ff,transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});g.userData.motes=[];for(let i=0;i<60;i++){const s=new THREE.Sprite(rm);s.position.set(rnd(-9,9),rnd(0.2,5),rnd(-9,9));s.scale.setScalar(rnd(0.05,0.14));g.add(s);g.userData.motes.push(s)}g.userData.rm=rm;TP.white=g;scene.add(g)}
 TP.white.visible=true;TP.white.position.set(P.x,GY,P.z);if(ENV)ENV.visible=false;scene.background=new THREE.Color(0xe6e8ee);scene.fog=new THREE.FogExp2(0xe6e8ee,0.022);
 hemi.color.set(0xffffff);hemi.groundColor.set(0xb8bccc);hemi.intensity=1.15;moon.color.set(0xfff8f0);moon.intensity=0.9;for(const l of STATIC){l.intensity=0;l.userData.base=0}}
// ---------- 1) портал пустоши -> обморок
function tpPortalCS(nx){const Pp=GREEND.portal;if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.2;SFX.draw(false)}TP.nar=[];TP.ov=null;TP.lid=1;
 const go=()=>{tpVoiceOff();loadChapter(nx);G.card=null;G.subs=[];tpArrival()};
 csStart('tpPortal',t=>{const H=CS.H;CS.bars=ek(t,0,20);
  if(t===1){H.to=[Pp[0],Pp[2]-0.4];H.spd=0.028;SFX.portal&&SFX.portal()}
  if(t<80)cam([P.x+1.5,GY+1.65,P.z+2.5],[P.x,GY+1.3,P.z-1.2]);
  if(t%2===0&&t<80)FX.add.add({x:Pp[0]+rnd(-1.2,1.2),y:Pp[1]+rnd(-1.2,1.2),z:Pp[2]+rnd(-0.1,0.1),vx:0,vy:0.012,vz:0,life:40,s:rnd(0.05,0.1),r:0.6,gg:1.5,b:0.8,a:0.7});
  if(t===40){SFX.warp&&SFX.warp();flashL(P.x,GY+1.4,P.z,0x9fffb0,10,50);G.shake=0.15}
  if(t>=40&&t<=72){const k=ek(t,40,72);TP.ov={c:'225,255,232',a:k}}
  if(t===72){P.csHide=true;H.to=null}
  if(t>72&&t<=110){const k=ek(t,72,110),r=Math.round(lerp(225,0,k)),g=Math.round(lerp(255,0,k)),b=Math.round(lerp(232,0,k));TP.ov={c:r+','+g+','+b,a:1}}
  if(t===112||t===150||t===196||t===250)SFX.heart&&SFX.heart();
  if(t===120)tpSay('Акира','…Голова… кружится…',120,205,{mid:1});
  if(t===212)tpSay('Акира','Земля… уходит из-под ног…',212,280,{mid:1});
  if(t===288)tpSay('','(тишина)',288,330,{mid:1});
  if(t>=336)go()},go)}
// ---------- 2) пробуждение в храме
function tpArrival(){const S=TEMPLED.spawn,A=TEMPLED.alt;TP.nar=[];TP.ov={c:'0,0,0',a:1};TP.lid=0;TP.freeze=0;P.x=S[0]+1.0;P.z=S[1];P.yaw=Math.PI/2;P.csHide=false;GY=tpGH(P.x,P.z);
 const fin=()=>{P.csRx=0;P.y=0;TP.lid=1;TP.ov=null;TP.nar=[];P.csPose=null;G.card={t:0,title:'ГЛАВА 8',name:'Путь'};TP.hint=1;csEnd([['Юки','Синяя катана — слева, красная — справа. Подойди к островам по мостам и выбери одну.']])};
 csStart('tpArr',t=>{const H=CS.H;CS.bars=1;P.csHide=false;
  if(t<=3){P.csRx=-1.52;P.y=0.13;P.csPose={p:POSE.rest,w:1};P.csLook=0}
  const hx=P.x-1.72,hy=GY+0.46;
  if(t<190){const k=ek(t,110,175);cam([hx,hy,P.z],[lerp(P.x+2.5,P.x+6,k),GY+lerp(8,4.2,k),P.z+lerp(0.6,3.2,k)])}
  TP.ov={c:'0,0,0',a:1-ek(t,10,40)};
  // веки: приоткрыть — моргнуть — открыть
  TP.lid=t<40?0:t<70?0.35*ek(t,40,70):t<88?0.35*(1-ek(t,74,88)):t<128?0.75*ek(t,92,128):t<140?0.75-0.45*ek(t,130,140):Math.min(1,0.3+0.7*ek(t,144,176));
  if(t===30)tpSay('Юки','Акира… Акира!',30,96);
  if(t===100)tpSay('Юки','Очнись! Ты меня слышишь?',100,170);
  if(t===34||t===80)SFX.heart&&SFX.heart();
  if(t===190){TP.lid=1}
  if(t>=190&&t<310){cam([P.x-0.2,GY+0.9,P.z+2.9],[P.x-0.9,GY+0.55,P.z],ek(t,190,300),[P.x+0.6,GY+1.4,P.z+2.6],[P.x-0.1,GY+1.0,P.z]);
   const k=ek(t,205,262);P.csRx=-1.52*(1-k);P.y=0.13*(1-k);P.csPose={p:POSE.kneel,w:t<262?1:1-ek(t,262,305)};if(t<205)P.csPose={p:POSE.rest,w:1}}
  if(t===215)csSay('Акира','Где… я? Это уже не пустошь…',215,300);
  if(t===306){P.csPose=null;P.csRx=0;P.y=0}
  if(t>=306&&t<520){const k=ek(t,306,515);cam([S[0]-0.6,GY+2.0,S[1]+2.8],[S[0]+4,GY+1.3,0],k,[6.2,7.2,0.4],[16,0.4,0]);P.csLook=Math.sin((t-306)*0.03)*0.6}
  if(t===322)G.card={t:0,title:'ГЛАВА 8',name:'Путь'};
  if(t===340)csSay('Юки','Храм… Я слышала о нём лишь в легендах. Здесь Путь Души расходится надвое.',340,512);
  if(t>=520&&t<615){const k=ek(t,520,612);cam([6.6,4.4,-2.4],[A.blue[0],A.blue[1]+0.1,A.blue[2]],k,[7.6,3.4,-4.6],[A.blue[0],A.blue[1],A.blue[2]])}
  if(t===524)csSay('Юки','Слева — синяя катана. Кьору. От неё веет холодом правды.',524,612);
  if(t>=615&&t<705){const k=ek(t,615,702);cam([7.6,4.4,2.4],[A.red[0],A.red[1]+0.1,A.red[2]],k,[8.6,3.4,4.6],[A.red[0],A.red[1],A.red[2]])}
  if(t===618)csSay('Юки','Справа — красная. Шиори. В ней спит огонь.',618,702);
  if(t>=705){P.csLook=lerp(P.csLook||0,0,0.1);cam([P.x-1.9,GY+1.8,P.z+2.4],[P.x+1.0,GY+1.25,P.z],ek(t,705,800),[P.x-2.6,GY+2.0,P.z+1.2],[P.x+1.5,GY+1.2,P.z])}
  if(t===708)csSay('Юки','Выбери одну, Акира. Только одну — пути назад не будет.',708,800);
  if(t>=805)fin()},fin)}
// ---------- общая часть: катана поднимается с подставки и ложится в правую руку
function tpLift(k,t,t0,sx,sz,yaw){const s=TP.sw[k],r=s.userData.rest,a=TEMPLED.alt[k];
 if(t>=t0&&t<t0+60){const u=ek(t,t0,t0+60);s.position.set(lerp(r.p.x,a[0]-0.31,u),lerp(r.p.y,a[1]+0.55,u)+Math.sin(t*0.08)*0.02*u,r.p.z);s.quaternion.copy(r.q);if(t%3===0){const c=k==="blue"?[0.7,1.1,2.2]:[2.3,0.8,0.4];tpSparks(a[0],a[1]+0.3,a[2],3,c)}}
 if(t===t0+60){TP.lift={p:s.position.clone(),q:s.quaternion.clone()}}
 if(t>=t0+60&&t<t0+100){const u=ek(t,t0+60,t0+100);const p=TP.lift.p;_tpV.set(sx+Math.sin(yaw)*0.55,GY+1.15,sz+Math.cos(yaw)*0.55);s.position.lerpVectors(p,_tpV,u);_tpQ.setFromEuler(new THREE.Euler(0,yaw+Math.PI/2,0));s.quaternion.copy(TP.lift.q).slerp(_tpQ,u)}
 if(t===t0+100){const L={p:s.position.clone(),q:s.quaternion.clone()};SFX.draw&&SFX.draw(true);P.csGrip=1;P.csPost=()=>tpGrip(s,ek(CS.t,t0+100,t0+118),L.p,L.q)}}
function tpSparks(x,y,z,n,c){for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),e=rnd(-0.2,1.2),v=rnd(1.5,6);FX.add.add({x,y,z,vx:Math.cos(a)*Math.cos(e)*v/60,vy:Math.sin(e)*v/60,vz:Math.sin(a)*Math.cos(e)*v/60,g:0.002,life:rnd(25,60),s:rnd(0.02,0.05),r:c[0],gg:c[1],b:c[2],drag:0.97})}}
function tpEnd(k){tpVoiceOff();CS.on&&csEnd();P.csGrip=0;P.csRx=0;P.csPost=null;P.csHide=false;TP.nar=[];TP.lid=1;TP.ov=null;G.subs=[];G.card=null;
 G.mode='ending';G.endT=0;TP.end=k;G.noPauseOnUnlock=true;document.exitPointerLock&&document.exitPointerLock();setTimeout(()=>G.noPauseOnUnlock=false,100);
 if(k==='true'){tpWhite(true);TP.white.position.set(P.x,GY,P.z);if(TP.sw.blue)TP.sw.blue.visible=false;camera.position.set(P.x+2.6,GY+1.5,P.z+2.6);camera.lookAt(P.x,GY+1.1,P.z)}
 SFX.victory&&SFX.victory()}
// ---------- 3) Кьору — горькая истина: клинок вырывается и пронзает Акиру -> белое пространство -> пробуждение (истинная концовка)
function tpStand(a){const an=Math.atan2(P.x-a[0],P.z-a[2]),sx=a[0]+Math.sin(an)*1.95,sz=a[2]+Math.cos(an)*1.95,yaw=an+Math.PI,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-fz,rz=fx;
 return{sx,sz,yaw,L:(r,y,f)=>[sx+rx*r+fx*f,GY+y,sz+rz*r+fz*f]}}
function tpBlueCS(){const a=TEMPLED.alt.blue,s=TP.sw.blue,{sx,sz,yaw,L}=tpStand(a);let chest=new THREE.Vector3(),dir=new THREE.Vector3(),Fp=null,Fq=null;
 const skip=()=>tpEnd('true');
 const NAR=['Тише, Акира. Открой глаза.','Пепел Ивате, Гэнма, зеркала, Сота… всё это было лишь сном.','Сном, который ты видел, лёжа на пороге собственной жизни.','Кьору — горькая истина. Она не убивает. Она будит.','Тот, кто принимает правду, просыпается.','Твоё настоящее приключение… только начинается.'];
 csStart('tpBlue',t=>{const H=CS.H;CS.bars=1;
  if(t===1){H.to=[sx,sz];H.spd=0.03;TP.freeze=0}
  if(t>1&&!H.to&&t<380)H.yaw=yaw;
  if(t<60)cam(L(1.4,1.9,-2.8),[a[0],a[1]+0.3,a[2]]);
  if(t>=60&&t<170){const k=ek(t,60,165);cam(L(2.2,1.5,-0.6),L(-0.1,1.2,1),k,L(1.5,1.45,1.2),L(-0.1,1.2,-0))}
  if(t>=40&&!Fp){P.yaw=turn(P.yaw,yaw,0.12)}
  tpLift('blue',t,40,sx,sz,yaw);
  if(t===52)csSay('Юки','Она откликается на тебя…',52,130);
  if(t>=100&&t<270)P.csPose={p:POSE.one,w:ek(t,100,130)};
  if(t>=150&&t<270){const k=ek(t,150,260);for(const m of TP.bm.blue)m.emissiveIntensity=0.9+k*4;if(t%2===0){s.getWorldPosition(_tpV);tpSparks(_tpV.x,_tpV.y,_tpV.z,2,[0.7,1.12,2.52])}
   const j=0.006+k*0.03;P.csPost=()=>{tpGrip(s,1);s.rotateX(rnd(-j,j));s.rotateY(rnd(-j,j));s.position.x+=rnd(-j,j)*0.3;s.position.y+=rnd(-j,j)*0.3}
   G.shake=Math.max(G.shake,k*0.05)}
  if(t>=170&&t<270)cam(L(1.2,1.55,1.1),L(0,1.25,0.2),ek(t,170,265),L(0.9,1.6,1.35),L(0,1.3,0.3));
  if(t===172)csSay('Акира','Холодная… будто держу в руке лёд.',172,250);
  if(t===200)SFX.ice&&SFX.ice();
  if(t===252)csSay('Юки','Акира, она дрожит!',252,320);
  if(t===270){P.csPost=null;P.csGrip=0;Fp=s.position.clone();Fq=s.quaternion.clone();SFX.iai&&SFX.iai();G.shake=0.3;flashL(Fp.x,Fp.y,Fp.z,0x6aa8ff,8,30);tpSparks(Fp.x,Fp.y,Fp.z,40,[0.7,1.12,2.52]);P.csPose={p:POSE.hurt,w:1}}
  if(t>=270&&t<330){const u=ek(t,270,325);_tpV.set(...L(0,2.4,2.5));s.position.lerpVectors(Fp,_tpV,u);s.rotateX(0.22*(1-u))}
  if(t>=275&&t<300)P.csPose={p:POSE.hurt,w:1-ek(t,285,300)*0.6};
  if(t>=270&&t<372)cam(L(3.2,0.9,-1.4),L(0,2.0,0.6));
  if(t>=326&&t<372){hero.root.updateMatrixWorld(true);hero.neck.getWorldPosition(chest);chest.y-=0.24;dir.subVectors(chest,s.position).normalize();_tpQ.setFromUnitVectors(_tpZ,dir);s.quaternion.slerp(_tpQ,0.14);
   if(t===340)csSay('Акира','Что?!..',340,372)}
  if(t===372){hero.root.updateMatrixWorld(true);hero.neck.getWorldPosition(chest);chest.y-=0.24;Fp=s.position.clone();dir.subVectors(chest,Fp).normalize();Fq=new THREE.Quaternion().setFromUnitVectors(_tpZ,dir);SFX.swingR&&SFX.swingR()}
  if(t>=372&&t<=382){const u=(t-372)/10;_tpV.copy(chest).addScaledVector(dir,-0.32);s.position.lerpVectors(Fp,_tpV,u*u);s.quaternion.copy(Fq)}
  if(t===382){SFX.hurt&&SFX.hurt();(SFX.impact||SFX.hit)(1.6);G.shake=0.55;flashL(chest.x,chest.y,chest.z,0x7ab0ff,12,40);tpSparks(chest.x,chest.y,chest.z,50,[0.7,1.12,2.52]);P.csPose={p:POSE.hurt,w:1};
   hero.root.updateMatrixWorld(true);s.updateMatrixWorld(true);TP.rel=new THREE.Matrix4().copy(hero.torso.matrixWorld).invert().multiply(s.matrixWorld)}
  if(t>382&&TP.rel){const R=TP.rel;P.csPost=()=>{_tpM.multiplyMatrices(hero.torso.matrixWorld,R).decompose(s.position,s.quaternion,s.scale)}}
  if(t>=382&&t<470){cam(L(2.5,1.35,0.25),L(0,1.15,0.1),ek(t,382,465),L(2.1,0.95,0.9),L(0,0.85,0));if(t>=395)P.csPose={p:mixPose(POSE.hurt,POSE.kneel,ek(t,395,440)),w:1};P.csLook=-0.3*ek(t,395,440);if(t%3===0)tpSparks(chest.x,GY+P.y+1.1,chest.z,2,[0.7,1.12,2.52])}
  if(t===404)csSay('Акира','Кьору… горькая… истина…',404,470);
  if(t>=440&&t<=520){const k=ek(t,440,515);for(const m of TP.bm.blue)m.emissiveIntensity=5+k*10;TP.ov={c:'255,255,255',a:ek(t,455,515)}}
  if(t===470){SFX.soul&&SFX.soul();SFX.bell&&SFX.bell()}
  if(t===520){P.csPost=null;TP.rel=null;s.visible=false;tpWhite(true);P.csPose={p:POSE.kneel,w:1};P.csLook=-0.3}
  if(t>=520){const u=t-520,k=ek(u,0,1700);TP.ov={c:'255,255,255',a:1-ek(u,0,70)};const an=0.5+k*0.9,r=lerp(3.4,2.6,k);cam([P.x+Math.sin(an)*r,GY+lerp(1.0,1.6,k),P.z+Math.cos(an)*r],[P.x,GY+lerp(0.8,1.25,k),P.z]);
   const W0=TP.white&&TP.white.userData;if(W0){W0.rm.opacity=0.6*ek(u,40,200);for(const m of W0.motes)m.position.y+=0.004}
   NAR.forEach((l,i)=>{const a0=40+i*265;if(u===a0){tpSay('Голос',l,t,t+250,{mid:1,dark:1,low:1});tpVoice(l)}});
   if(u>=560&&u<760){P.csPose={p:POSE.kneel,w:1-ek(u,560,740)};P.csLook=lerp(-0.3,0.15,ek(u,560,740))}if(u===760)P.csPose=null;
   if(u>=1660)TP.ov={c:'255,255,255',a:ek(u,1660,1720)};
   if(u>=1725)tpEnd('true')}},skip)}
// ---------- 4) Шиори — дремлющая птица: клинок пробуждается красным пламенем
function tpRedCS(){const a=TEMPLED.alt.red,s=TP.sw.red,{sx,sz,yaw,L}=tpStand(a);
 const skip=()=>{qSpaceCS()};
 csStart('tpRed',t=>{const H=CS.H;CS.bars=1;
  if(t===1){H.to=[sx,sz];H.spd=0.03}
  if(t>1&&!H.to)H.yaw=yaw;
  if(t<60)cam(L(1.4,1.9,-2.8),[a[0],a[1]+0.3,a[2]]);
  if(t>=40)P.yaw=turn(P.yaw,yaw,0.12);
  tpLift('red',t,40,sx,sz,yaw);
  if(t>=60&&t<170){const k=ek(t,60,165);cam(L(2.2,1.5,-0.6),L(-0.1,1.2,1),k,L(1.5,1.45,1.2),L(-0.1,1.2,0))}
  if(t===52)csSay('Юки','Она откликается на тебя…',52,130);
  if(t>=100&&t<200)P.csPose={p:POSE.one,w:ek(t,100,130)};
  if(t>=150){const k=ek(t,150,300);for(const m of TP.bm.red)m.emissiveIntensity=0.9+k*5.5;const l=STATIC[2];if(l){s.getWorldPosition(_tpV);l.position.copy(_tpV);l.intensity=2.4+k*7;l.distance=9}
   if(t%3===0){s.getWorldPosition(_tpV);FX.add.add({x:_tpV.x+rnd(-0.3,0.3),y:_tpV.y+rnd(-0.2,0.5),z:_tpV.z+rnd(-0.3,0.3),vx:rnd(-0.004,0.004),vy:rnd(0.01,0.03),vz:rnd(-0.004,0.004),life:rnd(40,80),s:rnd(0.03,0.07),r:1.8,gg:0.5+k*0.3,b:0.15,a:0.9})}}
  if(t===160)SFX.fire&&SFX.fire();
  if(t>=170&&t<260)cam(L(1.3,1.3,1.4),L(-0,1.35,0),ek(t,170,255),L(1.8,1.1,1.9),L(-0,1.7,0));
  if(t===172)csSay('Акира','Тёплая… будто живое сердце бьётся в рукояти.',172,250);
  if(t>=200&&t<330)P.csPose={p:mixPose(POSE.one,POSE.rUp,ek(t,200,245)),w:1};
  if(t===245){SFX.fire&&SFX.fire();G.shake=0.25;s.getWorldPosition(_tpV);flashL(_tpV.x,_tpV.y,_tpV.z,0xff5020,12,50);tpSparks(_tpV.x,_tpV.y,_tpV.z,36,[2.52,0.84,0.28])}
  if(t>=260&&t<420)cam(L(2.4,0.9,2.6),L(-0,1.9,0),ek(t,260,415),L(3,1.1,1.4),L(-0,2.0,0));
  if(t===262)G.card={t:0,title:'КАТАНА ПРОБУДИЛАСЬ',name:'Шиори — дремлющая птица'};
  if(t===300)csSay('Юки','Птица проснулась, Акира. Теперь её пламя — твоё.',300,400);
  if(t>=410){TP.ov={c:'0,0,0',a:ek(t,410,470)}}
  if(t>=472)qSpaceCS()},skip)}
// ---------- экраны концовок
function updTpEnding(){G.endT=(G.endT||0)+1;if(G.endT>90&&(hit('Enter')||hit('Space')||MP[0])){tpVoiceOff();tpWhite(false);TP.end=null;G.mode='title';loadChapter(1);G.card=null;G.subs=[];resetPlayer(0,0)}}
function drawTpEnding(){X.clearRect(0,0,W,H);const t=G.endT||0,a=clamp(t/60,0,1),tr=TP.end==='true',q9=TP.end==='ps1',cx=W/2;X.textAlign='center';
 X.fillStyle=tr?`rgba(255,255,255,${0.4+0.57*a})`:`rgba(0,0,0,${0.55+0.42*a})`;X.fillRect(0,0,W,H);X.globalAlpha=a;
 const L=tr?[['ИСТИННАЯ КОНЦОВКА','15px','#8a8ea0'],['Пробуждение','bold 54px','#2a2c3a'],['',''],['Акира открыл глаза.','italic 20px','#3a3c4c'],['Кьору — горькая истина — не убила его. Она разбудила.','italic 20px','#3a3c4c'],['Всё, что было, — лишь сон на пороге собственной жизни.','italic 20px','#3a3c4c'],['',''],['Настоящее приключение только начинается.','bold 22px','#2a4a8a']]
  :TP.end==='accept'?[['КОНЦОВКА','15px','#b9a27a'],['Принять свой сон','bold 48px','#ffd0a0'],['',''],['Акира остался во сне — и принял его как свой Путь.','italic 20px','#e8dcc8'],['Каждый день — новый клинок, новый учитель, новая тишина.','italic 20px','#e8dcc8'],['Где-то впереди есть выход. Он найдёт его, когда будет готов.','italic 20px','#e8dcc8'],['',''],['Путь продолжается…','bold 22px','#f0c890']]
  :TP.end==='wake'?[['КОНЦОВКА','15px','#8a8a90'],['Проснуться во лжи','bold 48px','#c8c8d0'],['',''],['Акира проснулся в своём доме.','italic 20px','#d8d8dc'],['Он не помнит ни пепла, ни бамбука, ни пустых глаз.','italic 20px','#d8d8dc'],['Только иногда, в тишине, ему кажется, что кто-то слушает его шаги.','italic 20px','#d8d8dc'],['',''],['Конец?','bold 22px','#e0e0e8']]
  :TP.end==='w0'?[['ГЛАВА 10 ПРОЙДЕНА','15px','#b9a27a'],['Пустые глаза','bold 48px','#ff7060'],['',''],['Мудзин ушёл в тишину, которую искал всю жизнь.','italic 20px','#e8dcc8'],['Ветер унёс его повязку — к горам, где ждёт Старик.','italic 20px','#e8dcc8'],['Впервые Акира услышал собственные шаги.','italic 20px','#e8dcc8'],['',''],['Путь продолжится…','bold 22px','#f0c890']]
  :q9?[['ГЛАВА 9 ПРОЙДЕНА','15px','#b9a27a'],['Пробуждение','bold 48px','#c8b0ff'],['',''],['Тени рассеялись, но Старец так и не появился.','italic 20px','#e8dcc8'],['Акэбоно и Ёиями тихо звенят в ножнах — будто зовут дальше.','italic 20px','#e8dcc8'],['Сон это или явь — Акира решит сам.','italic 20px','#e8dcc8'],['',''],['Путь продолжится…','bold 22px','#f0c890']]
  :[['ГЛАВА 8 ПРОЙДЕНА','15px','#b9a27a'],['Шиори — дремлющая птица','bold 48px','#ff8a70'],['',''],['Пламя пробудилось в руке Акиры.','italic 20px','#e8dcc8'],['Сон продолжается — и с ним Путь Двух Душ.','italic 20px','#e8dcc8'],['',''],['Путь продолжится…','bold 22px','#f0c890']];
 let y=H*0.3;for(const l of L){if(l[0]){X.font=l[1]+' Georgia,serif';X.fillStyle=l[2];if(!tr&&/48px/.test(l[1])){X.shadowColor=TP.end==='accept'?'#ff9a30':TP.end==='wake'?'#404050':TP.end==='w0'?'#ff2010':q9?'#7a50ff':'#ff4020';X.shadowBlur=24}X.fillText(l[0],cx,y);X.shadowBlur=0}y+=l[1]&&/54|48/.test(l[1])?64:34}
 X.font='15px Georgia,serif';X.fillStyle=tr?'rgba(40,42,56,0.75)':'rgba(230,220,200,0.7)';X.fillText('Спасибо за игру',cx,H-96);if(t>90){X.globalAlpha=a*(0.6+0.4*Math.sin(t*0.08));X.fillText('Enter — в главное меню',cx,H-64)}
 X.globalAlpha=1;X.textAlign='left'}
function tpHook(){return{D:TEMPLED,gh:tpGH,load:tpLoad,arrive:tpArrival,portal:tpPortalCS,near:tpNear,choose:tpChoose,blue:tpBlueCS,red:tpRedCS,end:tpEnd,grip:tpGrip,white:tpWhite,TP,reset:tpSwordReset}}
