// ---------- v0.18: ГЛАВА 9 «Пробуждение» (blender/ext/v18.py -> niten_v18.glb + gQd.js)
// Красная катана -> сон-космос со Старцем (отдаёт старые катаны, получает «Акэбоно» и «Ёиями») -> пробуждение в PS1-локации ->
// волны хоррор-мобов (Тряпичник, Улыбака, Пёс). Многоуровневая nav: узел = (ячейка, слой), рёбра — перепад <= ступени и свободный проход.
const PS={t:0,on:false,wave:0,waveT:0,active:false,started:false,done:false,fight:false,glass:[],water:null,lamps:[],portals:[],rings:[],beams:[],req:1,hint:0,clearT:0};
const _q1=new THREE.Vector3(),_q2=new THREE.Vector3(),_q3=new THREE.Vector3(),_qQ=new THREE.Quaternion(),_qM=new THREE.Matrix4(),_qE=new THREE.Euler();
function b64u8(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
// ---------- nav: декодирование, клиренс (0 — край, 1 — все 4 соседа, 2 — и соседи тоже не край)
function psNav(){const N=V8D.nav;if(N.HH)return N;const W0=N.w,H0=N.h,n=N.nl*W0*H0;N.N=n;N.HH=new Uint16Array(b64u8(N.H).buffer);N.CC=b64u8(N.C);
 N.nb=new Int32Array(n*4).fill(-1);for(let k=0;k<n;k++){if(!N.HH[k])continue;const i=k%W0,j=((k/W0)|0)%H0,c=N.CC[k];
  for(let d=0;d<4;d++){const q=(c>>(2*d))&3;if(!q)continue;const i2=i+(d===0?1:d===1?-1:0),j2=j+(d===2?1:d===3?-1:0);N.nb[k*4+d]=((q-1)*H0+j2)*W0+i2}}
 N.cl=new Uint8Array(n);for(let k=0;k<n;k++){if(!N.HH[k])continue;let ok=1;for(let d=0;d<4;d++)if(N.nb[k*4+d]<0)ok=0;N.cl[k]=ok}
 for(let k=0;k<n;k++){if(N.cl[k]!==1)continue;let ok=1;for(let d=0;d<4;d++)if(!N.cl[N.nb[k*4+d]])ok=0;if(ok)N.cl[k]=2}
 N.dist=new Int32Array(n).fill(-1);N.q=new Int32Array(n);N.src=-1;N.ft=-99;
 const V=N.vox;V.bits=b64u8(V.b);return N}
const psH=k=>V8D.nav.HH[k]/100+V8D.nav.ho;
function psCell(x,z){const N=V8D.nav;return[Math.floor((x-N.x0)/N.cs),Math.floor((z-N.z0)/N.cs)]}
function psOk(k,req=PS.req){return k>=0&&V8D.nav.cl[k]>=req}
// узел в ячейке, ближайший по высоте y (предпочтение — с клиренсом)
function psFind(x,y,z,req=PS.req){const N=psNav(),[i0,j0]=psCell(x,z);let best=-1,bd=1e9;
 for(let r=0;r<40&&best<0;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=i0+di,j=j0+dj;if(i<0||j<0||i>=N.w||j>=N.h)continue;
  for(let l=0;l<N.nl;l++){const k=(l*N.h+j)*N.w+i;if(!N.HH[k]||N.cl[k]<req)continue;const s=Math.abs(psH(k)-y)+r*N.cs*0.6;if(s<bd){bd=s;best=k}}}
 return best}
function psCen(k){const N=V8D.nav,i=k%N.w,j=((k/N.w)|0)%N.h;return[N.x0+(i+0.5)*N.cs,N.z0+(j+0.5)*N.cs]}
function psStep(k,d){return k<0?-1:V8D.nav.nb[k*4+d]}
// переход из узла k в точку (x,z): соседняя ячейка — по ребру, диагональ — через одну из осей
function psTry(k,x,z,req){const N=V8D.nav,W0=N.w,ci=k%W0,cj=((k/W0)|0)%N.h,[i,j]=psCell(x,z),di=i-ci,dj=j-cj;
 if(!di&&!dj)return k;if(Math.abs(di)>1||Math.abs(dj)>1)return -1;
 const dx=di>0?0:1,dz=dj>0?2:3;
 if(di&&dj){let a=psStep(k,dx);if(psOk(a,req)){const b=psStep(a,dz);if(psOk(b,req))return b}a=psStep(k,dz);if(psOk(a,req)){const b=psStep(a,dx);if(psOk(b,req))return b}return -1}
 const m=psStep(k,di?dx:dz);return psOk(m,req)?m:-1}
// коллизия: объект o движется от последней валидной точки к (o.x,o.z) шагами по 0.1 м со скольжением вдоль стен
function psClamp(o){const N=psNav(),req=o===P?PS.req:1;let k=o._pk;
 if(k==null||k<0||!N.HH[k]){k=psFind(o.x,(o===P?GY:(o.gy||0))+0.2,o.z,req);if(k<0)return;if(!psOk(psTry(k,o.x,o.z,req),req)){const c=psCen(k);o.x=c[0];o.z=c[1]}o._pk=k;o._px=o.x;o._pz=o.z;return}
 const x0=o._px,z0=o._pz,dx=o.x-x0,dz=o.z-z0,L=Math.hypot(dx,dz);if(L<1e-6){o.x=x0;o.z=z0;return}
 const n=Math.min(80,Math.ceil(L/0.1)),sx=dx/n,sz=dz/n;let cx=x0,cz=z0;
 for(let s=0;s<n;s++){let r=psTry(k,cx+sx,cz+sz,req);if(r>=0){k=r;cx+=sx;cz+=sz;continue}
  r=psTry(k,cx+sx,cz,req);if(r>=0){k=r;cx+=sx;continue}r=psTry(k,cx,cz+sz,req);if(r>=0){k=r;cz+=sz;continue}break}
 o.x=cx;o.z=cz;o._pk=k;o._px=cx;o._pz=cz}
// высота пола под точкой: узел + плавный переход к соседям (лестницы, пандусы)
function psGround(o){const k=o._pk;if(k==null||k<0)return o===P?GY:(o.gy||0);const N=V8D.nav,h=psH(k),c=psCen(k),fx=(o.x-c[0])/N.cs,fz=(o.z-c[1])/N.cs;let y=h;
 const ax=psStep(k,fx>0?0:1);if(ax>=0)y+=(psH(ax)-h)*Math.min(0.5,Math.abs(fx));
 const az=psStep(k,fz>0?2:3);if(az>=0)y+=(psH(az)-h)*Math.min(0.5,Math.abs(fz));return y}
// поле расстояний (BFS по узлам) от игрока — для преследования через лестницы и этажи
function psFlow(){const N=psNav(),s=P._pk;if(s==null||s<0)return N;if(s===N.src&&G.frame-N.ft<30)return N;N.src=s;N.ft=G.frame;
 const D=N.dist,Q=N.q;D.fill(-1);let h=0,t=0;D[s]=0;Q[t++]=s;while(h<t){const k=Q[h++],dk=D[k]+1;for(let d=0;d<4;d++){const m=N.nb[k*4+d];if(m<0||D[m]>=0||!N.cl[m])continue;D[m]=dk;Q[t++]=m}}return N}
// шаг к игроку по полю: направление на соседа с меньшим расстоянием (с подглядыванием на 3 узла вперёд)
function psSteer(e){const N=psFlow(),k=e._pk;if(k==null||k<0)return null;const D=N.dist;if(D[k]<0)return null;let cur=k;
 for(let s=0;s<3;s++){let best=-1,bd=D[cur];for(let d=0;d<4;d++){const m=N.nb[cur*4+d];if(m>=0&&D[m]>=0&&D[m]<bd){bd=D[m];best=m}}if(best<0)break;cur=best}
 if(cur===k)return null;const c=psCen(cur),dx=c[0]-e.x,dz=c[1]-e.z,L=Math.hypot(dx,dz)||1;return[dx/L,dz/L]}
// прямая проходимость (для ближнего боя без обхода)
function psLine(k,x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/0.15);let cx=x0,cz=z0;for(let s=1;s<=n;s++){const x=x0+(x1-x0)*s/n,z=z0+(z1-z0)*s/n,r=psTry(k,x,z,1);if(r<0)return false;k=r}return true}
// ---------- камера: луч по воксельной сетке (0.4 м) от головы героя к камере
function psSolid(x,y,z){const V=V8D.nav.vox,N=V8D.nav,i=Math.floor((x-N.x0)/V.s),j=Math.floor((z-N.z0)/V.s),k=Math.floor((y-V.y0)/V.s);if(i<0||j<0||k<0||i>=V.w||j>=V.h||k>=V.n)return false;const b=(k*V.h+j)*V.w+i;return(V.bits[b>>3]>>(7-(b&7)))&1}
function psRay(T,dx,dy,dz){const L=Math.hypot(dx,dy,dz);if(L<0.2)return 1;const n=Math.ceil(L/0.1);let s=1;
 if(psSolid(T.x,T.y,T.z)){for(;s<=n;s++){const u=s/n;if(!psSolid(T.x+dx*u,T.y+dy*u,T.z+dz*u))break}if(s*L/n>0.3)return 0.08}
 for(;s<=n;s++){const u=s/n;if(psSolid(T.x+dx*u,T.y+dy*u,T.z+dz*u))return Math.max(0.08,(s-2.5)/n)}return 1}
// камера: клип по вокселям (сглаженный: приближение — сразу, отдаление — плавно), сглаженная высота на лестницах;
// если за спиной стена и герой идёт — мягко доворачиваем камеру в свободную сторону
function psCam(T,C){psNav();const free=G.mode==='play'&&!CS.on;
 if(PS.cgy==null||!free||Math.abs(PS.cgy-GY)>2.5)PS.cgy=GY;else PS.cgy=lerp(PS.cgy,GY,0.14);const oy=PS.cgy-GY;T.y+=oy;C.y+=oy;
 const dx=C.x-T.x,dy=C.y-T.y,dz=C.z-T.z;let tm=psRay(T,dx,dy,dz);
 const mv=PS.lx!=null&&Math.hypot(P.x-PS.lx,P.z-PS.lz)>0.012;PS.lx=P.x;PS.lz=P.z;
 if(tm<0.45&&mv&&free&&!G.lock){for(const d of[0.35,-0.35,0.7,-0.7,1.1,-1.1,1.6,-1.6]){const c=Math.cos(d),s=Math.sin(d);if(psRay(T,dx*c+dz*s,dy,-dx*s+dz*c)>0.85){G.camYaw+=Math.sign(d)*Math.min(Math.abs(d),0.018);break}}}
 if(PS.ck==null||!free)PS.ck=tm;else PS.ck=tm<PS.ck?tm:Math.min(tm,PS.ck+0.035);const k=PS.ck;
 if(k<1){C.x=T.x+dx*k;C.y=T.y+dy*k;C.z=T.z+dz*k}}
// ---------- окружение: PS1-стиль (текстуры без фильтрации, самосвечение, аддитивные световые столбы, вода)
function buildPs1Env(g,env){PS.glass=[];PS.lamps=[];PS.water=null;
 const fix=(o,f)=>{if(!o.isMesh||!o.material)return;let m=o.material;if(!m.userData.ps1){m=m.clone();m.userData.ps1=1;f(m,o);o.material=m}};
 const nearest=m=>{for(const k of['map','emissiveMap'])if(m[k]){m[k].magFilter=THREE.NearestFilter;m[k].minFilter=THREE.NearestMipmapLinearFilter;m[k].needsUpdate=true}};
 locAdd(g,'ps1',true).traverse(o=>fix(o,m=>{m.metalness=0;m.roughness=0.92;m.envMapIntensity=0.12;if(m.map){m.emissiveMap=m.map;m.emissive=new THREE.Color(0xffffff);m.emissiveIntensity=0.42}nearest(m);m.vertexColors=false}));
 locAdd(g,'ps1lamp',false).traverse(o=>fix(o,m=>{m.emissive=new THREE.Color(0xffe2b0);m.emissiveMap=m.map||null;m.emissiveIntensity=2.2;m.toneMapped=false;nearest(m);PS.lamps.push(m)}));
 locAdd(g,'ps1glass',false).traverse(o=>fix(o,(m,o)=>{const b=new MB({map:m.map,color:0x9fc8ff,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});b.userData.ps1=1;o.material=b;o.castShadow=false;o.renderOrder=3;PS.glass.push(b);nearest(b)}));
 locAdd(g,'ps1shadow',false).traverse(o=>fix(o,(m,o)=>{const b=new MB({map:m.map,color:0x000000,transparent:true,opacity:0.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false});b.userData.ps1=1;o.material=b;o.castShadow=false;o.renderOrder=2}));
 locAdd(g,'ps1fol',true).traverse(o=>fix(o,m=>{m.alphaTest=0.45;m.transparent=false;m.side=THREE.DoubleSide;if(m.map){m.emissiveMap=m.map;m.emissive=new THREE.Color(0xffffff);m.emissiveIntensity=0.35}nearest(m)}));
 locAdd(g,'ps1water',false).traverse(o=>fix(o,(m,o)=>{if(m.map){m.map=m.map.clone();m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.map.needsUpdate=true}m.transparent=true;m.opacity=0.78;m.depthWrite=false;m.color=new THREE.Color(0x6aa0b8);m.emissive=new THREE.Color(0x0c3448);m.emissiveIntensity=0.6;m.roughness=0.08;m.metalness=0.1;m.envMapIntensity=1.2;o.castShadow=false;o.renderOrder=1;PS.water=m;nearest(m)}));
 // точечные источники у ламп (кластеры вершин эмиссивной части)
 const pts=[];g.traverse(o=>{if(!o.isMesh||!PS.lamps.includes(o.material))return;const p=o.geometry.attributes.position;o.updateMatrixWorld(true);for(let i=0;i<p.count;i+=7){_q1.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pts.push([_q1.x,_q1.y,_q1.z])}});
 const cl={};for(const p of pts){const k=Math.round(p[0]/3)+','+Math.round(p[1]/3)+','+Math.round(p[2]/3);(cl[k]=cl[k]||[0,0,0,0]);cl[k][0]+=p[0];cl[k][1]+=p[1];cl[k][2]+=p[2];cl[k][3]++}
 const L=Object.values(cl).sort((a,b)=>b[3]-a[3]).map(c=>[c[0]/c[3],c[1]/c[3],c[2]/c[3]]);PS.lampPos=L;
 const S=V8D.spawn;const ls=[[S[0],2.4,S[1]+0.5,0xffc890,2.0,10]];for(const p of L)if(ls.length<STATIC.length&&ls.every(q=>Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2])>6))ls.push([p[0],p[1]-0.3,p[2],0xffd8a0,2.6,11]);
 while(ls.length<STATIC.length)ls.push([0,4.5,0,0x7aa0ff,1.6,14]);
 ls.forEach((q,i)=>{const l=STATIC[i];l.position.set(q[0],q[1],q[2]);l.color.set(q[3]);l.userData.base=q[4];l.intensity=q[4];l.distance=q[5]});
 // пыль в световых столбах
 const n=500,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-14,10);pos[i*3+1]=rnd(-3,9);pos[i*3+2]=rnd(-17,12)}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));PS.motes=new THREE.Points(dg,new THREE.PointsMaterial({map:TX.dot,color:0xbfd4ff,size:0.06,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));g.add(PS.motes);
 env.ps1=true}
// ---------- скиннинг мешей из Blender по костям V8D: id кости в вершинном цвете (R*32, 0 = по близости к сегментам)
function v8Skin(items,B,o={}){const root=new Group(),bones=[],by={};
 for(const b of B){const n=new THREE.Bone();n.name=b[0];const p=b[1];if(p>=0){n.position.set(b[2]-B[p][2],b[3]-B[p][3],b[4]-B[p][4]);bones[p].add(n)}else{n.position.set(b[2],b[3],b[4]);root.add(n)}bones.push(n);by[b[0]]=n}
 root.updateMatrixWorld(true);const sk=new THREE.Skeleton(bones),meshes=[],seg=B.map(b=>[b[2],b[3],b[4],b[5],b[6],b[7]]);
 for(const it of items){const g=it.geo.clone(),P0=g.attributes.position,C=g.attributes.color,n=P0.count,si=new Uint16Array(n*4),sw=new Float32Array(n*4),dd=new Float32Array(B.length);
  for(let i=0;i<n;i++){const id=C?Math.round(C.getX(i)*32):0;if(id>0&&id<=B.length){const id2=Math.round(C.getY(i)*32);si[i*4]=id-1;if(id2>0&&id2<=B.length){const w=clamp(C.getZ(i),0,1);si[i*4+1]=id2-1;sw[i*4]=w;sw[i*4+1]=1-w}else sw[i*4]=1;continue}
   const x=P0.getX(i),y=P0.getY(i),z=P0.getZ(i);for(let q=0;q<B.length;q++){const s=seg[q],ax=s[3]-s[0],ay=s[4]-s[1],az=s[5]-s[2],L=ax*ax+ay*ay+az*az||1e-6;let t=((x-s[0])*ax+(y-s[1])*ay+(z-s[2])*az)/L;t=clamp(t,0,1);dd[q]=Math.hypot(x-s[0]-ax*t,y-s[1]-ay*t,z-s[2]-az*t)}
   const ord=[...dd.keys()].sort((a,b)=>dd[a]-dd[b]).slice(0,3);let tw=0;const w=ord.map(q=>{const v=1/Math.pow(dd[q]+0.03,4);tw+=v;return v});ord.forEach((q,c)=>{si[i*4+c]=q;sw[i*4+c]=w[c]/tw})}
  g.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));g.deleteAttribute('color');
  let m=it.mat;if(m){m=m.clone();m.vertexColors=false;if(o.mat)o.mat(m)}const me=new THREE.SkinnedMesh(g,m);me.frustumCulled=false;me.castShadow=true;root.add(me);me.bind(sk);meshes.push(me)}
 for(const b of bones)b.userData.q0=b.quaternion.clone();return{root,bones:by,list:bones,meshes,sk}}
function v8Items(pre,pfx){const P0=ASSET.parts[pre];if(!P0)return[];const out=[];for(const k in P0)if(!pfx||k.startsWith(pfx))for(const it of P0[k])out.push(it);return out}
// поворот кости (локальные углы, от позы покоя)
function bR(b,x=0,y=0,z=0){if(!b)return;_qE.set(x,y,z,'XYZ');b.quaternion.copy(b.userData.q0);_qQ.setFromEuler(_qE);b.quaternion.multiply(_qQ)}
// ---------- мобы
const V8T={wraith:{pre:'V8W',sc:1.0,col:0x9a2a2a},smile:{pre:'V8S',sc:1.0,col:0xff5030},dog:{pre:'V8D',sc:1.0,col:0xff3a1a}};
function v8Rig(t){const T=V8T[t],B=V8D.mob[t],items=v8Items(T.pre);const root=new Group(),body=new Group();root.add(body);let S=null,mat=null;
 if(items.length&&B){S=v8Skin(items,B,{mat:m=>{m.envMapIntensity=0.3;if(/glow|eye/.test(m.name||'')){m.emissive=new THREE.Color(T.col);m.emissiveIntensity=2.4;m.toneMapped=false}}});body.add(S.root);
  mat=S.meshes.map(m=>m.material).find(m=>m&&m.emissive&&!/glow|eye/.test(m.name||''))||null}
 else{const m=new MS({color:0x2a2228,roughness:0.8});const b=new Mesh(new THREE.CapsuleGeometry(0.35,1.2,4,8),m);b.position.y=1.0;body.add(b);mat=m}
 const gl=glintSprite();scene.add(gl);const tip=new THREE.Object3D();(S&&(S.bones.clawR||S.bones.handR||S.bones.jaw)||body).add(tip);if(S&&S.bones.clawR)tip.position.set(-0.2,-0.5,0.05);
 const upper=new Group();root.add(upper);
 // свечение глаз / пасти
 const eye=new THREE.Object3D();eye.intensity=0;// без PointLight: число источников света не меняется при спавне (нет перекомпиляции шейдеров)
 eye.position.set(0,t==='dog'?1.15:t==='smile'?1.15:1.9,t==='smile'?0.75:0.35);root.add(eye);
 return{root,upper,gl,tip,mat,kind:'v8',v8:t,S,body,eye}}
function v8Sync(e,t,wind,act,rec,k,mv){const r=e.rig,S=r.S;if(!S)return;const B=S.bones,a=e.atk,st=e.state,ph=e.anim*0.11,ak=a&&a.k;
 const sc=(e.elite?1.15:1)*(e.spawnK!=null?ease(e.spawnK):1);r.root.scale.setScalar(sc);r.eye.intensity=(e.elite?2.2:1.1)*(0.8+0.2*Math.sin(t*7+e.anim));
 if(e.blinkK!=null){r.root.visible=e.blinkK>0.02;r.root.scale.set(sc*e.blinkK,sc*(2-e.blinkK),sc*e.blinkK)}else r.root.visible=true;
 const u=wind?k:act?1:rec?Math.max(0,1-e.st/(a?a.rec:20)):0,hit=e.state==='stag'?Math.max(0,1-e.st/20):0;
 if(r.v8==='wraith'){r.body.position.y=0.12+Math.sin(t*1.7+e.anim)*0.08;bR(B.body,0.15*mv+0.25*hit,0,Math.sin(t*0.9)*0.05);bR(B.chest,0.1+Math.sin(t*1.3+e.anim)*0.05-0.3*hit,Math.sin(t*0.7)*0.1,0);bR(B.head,Math.sin(t*0.5+e.anim)*0.2+(ak==='scream'&&(wind||act)?-0.6*u:0),Math.sin(t*0.37)*0.4,Math.sin(t*2.3)*0.12);
  bR(B.skirt,Math.sin(t*2+e.anim)*0.12-mv*0.35,0,Math.sin(t*1.6)*0.1);
  let lx=Math.sin(t*1.9+e.anim)*0.15,rx=Math.sin(t*1.9+e.anim+1.6)*0.15,lz=0.1,rz=-0.1;
  if(ak==='claw'||ak==='blink'){const side=(e.comboN||1)%2;const up=wind?-2.6*k:act?lerp(-2.6,0.6,clamp(e.st/a.act,0,1)):rec?0.6*u:0;if(side)rx+=up;else lx+=up;if(act){if(side)rz-=0.5;else lz+=0.5}}
  if(ak==='scream'){lx-=1.6*u;rx-=1.6*u;lz+=0.9*u;rz-=0.9*u}
  bR(B.clawL,lx,0,lz);bR(B.clawR,rx,0,rz)}
 else if(r.v8==='smile'){const g=Math.min(1.5,e.d.spd/2.2),p=ph*1.6*g,c1=Math.sin(p),c2=Math.sin(p+Math.PI);
  // ползун на четвереньках: диагональная походка (левая рука + правая нога), рывки корпуса, голова «ищет» добычу
  const rear=ak==='swipe'?(wind?ek(e.st,0,a.wind*0.6):act?1:rec?u:0):ak==='grab'?(wind?0.5*k:act?0.6:rec?0.6*u:0):0;
  const crouch=ak==='leap'&&wind?k:0,fly=ak==='leap'&&act?1:0;
  r.body.position.y=Math.abs(Math.sin(p))*0.04*mv+(e.leapY||0)-crouch*0.12+rear*0.08;
  bR(B.hips,-rear*0.25+crouch*0.12,c1*0.07*mv,c1*0.05*mv);bR(B.spine,-rear*0.45+0.04*Math.sin(t*1.7)-crouch*0.1+0.25*hit,-c1*0.06*mv,0);bR(B.chest,-rear*0.35-fly*0.2-0.2*hit,c1*0.08*mv,Math.sin(t*0.9)*0.05);
  bR(B.neck,rear*0.5+crouch*0.25+Math.sin(t*0.7+e.anim)*0.12,Math.sin(t*0.45+e.anim)*0.35*(1-mv*0.5),0);
  bR(B.head,rear*0.25+Math.sin(t*0.6)*0.1-0.2*hit,Math.sin(t*0.33)*0.25,Math.sin(t*2.7+e.anim)*0.22*(1+hit*2)+(Math.sin(t*0.5)>0.8?0.5:0));
  const jaw=(ak==='grab'||ak==='leap')&&(wind||act)?0.55*u:ak==='swipe'&&act?0.4:0.12+0.1*Math.sin(t*3.3+e.anim);bR(B.jaw,jaw);
  // руки: x>0 — назад, <0 — вперёд
  const arm=(sd,ph1)=>{const s=Math.sin(p+ph1),lift=Math.max(0,Math.cos(p+ph1));let ax=s*0.45*mv+rear*0.9,fx=-lift*0.55*mv,hx=lift*0.4*mv,az=0;
   if(ak==='swipe'&&((e.comboN||1)%2?sd<0:sd>0)){const v=wind?-1.9*ek(e.st,0,a.wind):act?lerp(-1.9,0.9,clamp(e.st/a.act,0,1)):rec?0.9*u:0;ax+=v;az=sd*(act?-0.5:-0.2*u);fx-=act?0.2:0.5*k}
   if(ak==='grab'){ax-=1.3*u;az=-sd*0.35*u;fx=-0.3*u}
   if(fly||crouch){ax+=crouch*0.5-fly*1.7;fx-=fly*0.2}
   bR(B['arm'+(sd>0?'L':'R')],ax,0,az);bR(B['fore'+(sd>0?'L':'R')],fx);bR(B['hand'+(sd>0?'L':'R')],hx+Math.sin(t*4+e.anim+sd)*0.1)};
  arm(1,0);arm(-1,Math.PI);
  const leg=(sd,ph1)=>{const s=Math.sin(p+ph1),lift=Math.max(0,Math.cos(p+ph1));const n=sd>0?'L':'R';
   bR(B['thigh'+n],-s*0.4*mv+rear*0.35-crouch*0.35+fly*0.6,0,0);bR(B['shin'+n],lift*0.5*mv+crouch*0.5-fly*0.3);bR(B['foot'+n],-lift*0.3*mv)};
  leg(1,Math.PI);leg(-1,0)}
 else if(r.v8==='dog'){const g=Math.min(1.6,e.d.spd/3),p=ph*1.9*g,cy=Math.sin(p);r.body.position.y=Math.abs(Math.sin(p))*0.06*mv+(e.leapY||0);
  const crouch=(ak==='pounce'||ak==='bite')&&wind?k:0;bR(B.hips,-0.05+crouch*0.15,0,0);bR(B.spine,cy*0.05*mv,Math.sin(t*0.7)*0.06,0);bR(B.chest,crouch*0.2-(act&&ak==='pounce'?0.3:0),0,0);
  bR(B.neck,0.1+crouch*0.2+(ak==='howl'?-0.8*u:0)-0.2*hit,Math.sin(t*0.5+e.anim)*0.25*(1-mv),0);
  bR(B.head,Math.sin(t*1.4)*0.08+(ak==='howl'?-0.5*u:0),0,Math.sin(t*2.1)*0.06);
  const jaw=ak==='bite'?(wind?0.6*k:act?0.9-0.9*clamp(e.st/a.act,0,1):0):ak==='howl'?0.7*u:0.08+0.06*Math.sin(t*5);bR(B.jaw,jaw);
  bR(B.tail,0.3+Math.sin(t*6+e.anim)*0.3*(1-mv),Math.sin(t*3)*0.5,0);
  const L=(b1,b2,phs)=>{const s=Math.sin(p+phs);bR(B[b1],s*0.7*mv-crouch*0.5+(act&&ak==='pounce'?-0.8:0));bR(B[b2],Math.max(0,-s)*0.9*mv+crouch*0.6)};
  L('flL','flL2',0);L('hlR','hlR2',0.2);L('flR','flR2',Math.PI);L('hlL','hlL2',Math.PI+0.2)}}
function v8Def(){return{
 wraith:{name:'Тряпичник',hp:140,spd:2.7,range:2.0,rad:0.45,h:2.1,poise:45,souls:[['r',4],['b',3]],atk:[{k:'claw',wind:30,act:9,rec:24,dmg:13,reach:2.4},{k:'blink',wind:28,act:10,rec:30,dmg:18,reach:2.4},{k:'scream',wind:44,act:30,rec:40,dmg:6,reach:6.5}],ai:v8AI},
 smile:{name:'Улыбака',hp:260,spd:2.2,range:2.4,rad:0.7,h:1.5,poise:90,souls:[['r',6],['b',4],['y',1]],atk:[{k:'swipe',wind:34,act:10,rec:28,dmg:20,reach:3.1},{k:'leap',wind:40,act:44,rec:46,dmg:26,reach:2.4},{k:'grab',wind:36,act:8,rec:40,dmg:0,reach:2.2}],ai:v8AI},
 dog:{name:'Пёс',hp:120,spd:4.6,range:1.7,rad:0.5,h:1.3,poise:28,souls:[['r',3],['b',2]],atk:[{k:'bite',wind:20,act:12,rec:22,dmg:12,reach:1.9},{k:'pounce',wind:30,act:34,rec:30,dmg:16,reach:1.8},{k:'howl',wind:30,act:40,rec:30,dmg:0,reach:0}],ai:v8AI}}}
// высоты: e.gy — пол под мобом, разница с игроком (абсолютная)
const v8dy=e=>(P.y+GY)-(e.y+(e.gy||0));
function v8Pick(e,d){const A=e.d.atk,t=e.t,r=Math.random();
 if(t==='wraith'){if(d>4&&d<9&&r<0.45)return A[1];if(d<6&&r<0.2&&!(e.scT>0))return A[2];return A[0]}
 if(t==='smile'){if(d>3.5&&d<9&&r<0.5)return A[1];if(d<2.4&&r<0.3)return A[2];return A[0]}
 if(t==='dog'){if(!e.howled&&r<0.25&&enemies.filter(o=>!o.dead&&o.t==='dog').length<5)return A[2];if(d>2.6&&d<7&&r<0.55)return A[1];return A[0]}}
// застрявший моб (нет пути к игроку дольше 2.5 с) — уходит порталом и появляется на достижимом узле
function psRescue(e){const N=psFlow(),D=N.dist,c=[];for(let k=0;k<N.N;k++){const v=D[k];if(v<0||N.cl[k]<2)continue;const dd=v*N.cs;if(dd>=5&&dd<=12)c.push(k)}if(!c.length)return;const k=c[(Math.random()*c.length)|0],p=psCen(k);
 portalQ(e.x,e.gy||0,e.z,0.8);e.x=e._px=p[0];e.z=e._pz=p[1];e._pk=k;e.gy=psH(k);e.lost=0;portalQ(e.x,e.gy,e.z,e.t==='smile'?1.4:1)}
function v8Move(e,ts,sp,d){let dx=P.x-e.x,dz=P.z-e.z;const L=Math.hypot(dx,dz)||1,dy=Math.abs(v8dy(e));
 {const N=psFlow(),k=e._pk;if(k!=null&&k>=0&&N.dist[k]<0&&P._pk>=0){e.lost=(e.lost||0)+ts;if(e.lost>150){psRescue(e);return}}else e.lost=0}
 if(!(dy<0.8&&L<7&&psLine(e._pk,e.x,e.z,P.x,P.z))){const s=psSteer(e);if(s){dx=s[0];dz=s[1]}else{dx/=L;dz/=L}}else{dx/=L;dz/=L}
 e.yaw=turn(e.yaw,Math.atan2(dx,dz),0.12);e.x+=dx*sp*ts;e.z+=dz*sp*ts}
function v8AI(e,ts,d,ty){e.st+=ts;const sp=e.d.spd/60*(e.elite?1.15:1),dyP=v8dy(e);if(e.scT>0)e.scT-=ts;
 const reachOK=a=>d<=a.reach+0.3&&Math.abs(dyP)<1.4;
 switch(e.state){
 case'enter':e.spawnK=Math.min(1,e.st/50);e.yaw=turn(e.yaw,ty,0.1);if(e.st%4<1)FX.norm.add({x:e.x+rnd(-.4,.4),y:rnd(0,1.5),z:e.z+rnd(-.4,.4),vx:0,vy:rnd(0.01,0.02),vz:0,life:rnd(40,70),s:rnd(0.3,0.6),grow:1,r:0.02,gg:0.0,b:0.03,a:0.5});if(e.st>=50){e.spawnK=null;e.state='move';e.st=0;e.cd=rnd(20,50)}break;
 case'move':{const keep=e.d.range*0.9;if(d>keep||Math.abs(dyP)>1.2)v8Move(e,ts,sp,d);else{e.yaw=turn(e.yaw,ty,0.1);const s=Math.sin(e.anim*0.02)*sp*0.45;e.x+=-(P.z-e.z)/d*s*ts;e.z+=(P.x-e.x)/d*s*ts}
  e.cd-=ts;if(e.cd<=0&&P.state!=='dead'&&Math.abs(dyP)<1.4&&d<9){const a=v8Pick(e,d);if(a&&(a.k==='howl'||a.k==='scream'||a.k==='blink'||a.k==='leap'||a.k==='pounce'||d<a.reach+0.8)){e.atk=a;e.state='wind';e.st=0;e.hitDone=false;e.hits=0;e.comboN=a.k==='claw'?2:a.k==='swipe'?(Math.random()<0.5?2:1):1;
   if(a.k==='grab')SFX.grab();if(a.k==='scream'||a.k==='howl')SFX.roar&&SFX.roar();if(a.k==='leap'||a.k==='pounce'){e.lp={x:P.x,z:P.z}}}}
  break}
 case'wind':{const a=e.atk;e.yaw=turn(e.yaw,ty,a.k==='leap'||a.k==='pounce'?0.03:0.06);if(a.k==='blink'&&e.st>a.wind-14)e.blinkK=Math.max(0,1-(e.st-(a.wind-14))/14);
  if(e.st>=a.wind){e.state='act';e.st=0;v8Act(e,true)}break}
 case'act':v8Act(e,false);if(e.st>=e.atk.act){e.state='rec';e.st=0;e.leapY=0;e.blinkK=null}break;
 case'rec':if(e.st>=e.atk.rec){if(e.comboN>1){e.comboN--;e.atk={...e.atk,wind:Math.round(e.atk.wind*0.55)};e.state='wind';e.st=0;e.hitDone=false}else{e.state='move';e.st=0;e.cd=rnd(40,100)*(G.diff===2?0.7:1)*(e.elite?0.75:1)}}break;
 case'stag':e.leapY=0;e.blinkK=null;if(e.st>=e.stagT){e.state='move';e.st=0;e.cd=rnd(20,50)}break;
 case'hold':e.yaw=ty;if(P.clinch!==e){e.state='rec';e.st=0;e.atk=e.d.atk[0]}break}
 psClamp(e);const gy=psGround(e);e.gy=e.gy==null?gy:lerp(e.gy,gy,0.35)}
function v8Act(e,first){const a=e.atk,dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz)||1,dyP=v8dy(e),face=(dx*fwdX(e.yaw)+dz*fwdZ(e.yaw))/d>0.35,dm=Math.round(a.dmg*(e.elite?1.3:1));
 const near=(r)=>d<=r&&Math.abs(dyP)<1.3;
 if(a.k==='claw'||a.k==='swipe'||a.k==='bite'){if(a.k==='bite'&&e.st<8){e.x+=fwdX(e.yaw)*0.09;e.z+=fwdZ(e.yaw)*0.09}
  if(!e.hitDone&&e.st>=2&&near(a.reach)&&face){e.hitDone=true;hitPlayer(e,dm,{issen:true});if(a.k==='bite'&&Math.random()<0.4){P.tar=Math.min(1,P.tar+0.2)}}return}
 if(a.k==='blink'){if(first){const k=psFind(P.x-fwdX(P.yaw)*2.2,GY,P.z-fwdZ(P.yaw)*2.2,1);smokeQ(e.x,e.gy,e.z,22);if(k>=0){const c=psCen(k);e.x=c[0];e.z=c[1];e._pk=k;e._px=e.x;e._pz=e.z;e.gy=psH(k)}e.yaw=Math.atan2(P.x-e.x,P.z-e.z);smokeQ(e.x,e.gy,e.z,22);SFX.warp&&SFX.warp();e.blinkK=0.2}
  e.blinkK=Math.min(1,(e.blinkK||0)+0.2);if(!e.hitDone&&e.st>=5&&near(a.reach+0.3)){e.hitDone=true;hitPlayer(e,dm,{unblock:true})}return}
 if(a.k==='scream'){if(first){SFX.bossRoar&&SFX.bossRoar();G.shake=Math.max(G.shake,0.2);e.scT=400}if(e.st%5<1)ringQ(e.x,(e.gy||0)+1.7,e.z,0.6,4.5,0xa04050,24,true);
  if(!e.hitDone&&near(a.reach)){e.hitDone=true;hitPlayer(e,dm,{unblock:true});P.st=Math.max(0,P.st-35);G.tarScreen=Math.max(G.tarScreen||0,90);pop('Крик Тряпичника: выносливость -35','#c890a0')}return}
 if(a.k==='leap'||a.k==='pounce'){const T=a.act,u=clamp(e.st/(T*0.75),0,1);if(first){const L=Math.hypot(e.lp.x-e.x,e.lp.z-e.z)||1,m=Math.max(0,L-0.8);e.lv={x:(e.lp.x-e.x)/L*m/(T*0.75),z:(e.lp.z-e.z)/L*m/(T*0.75)};SFX.bigSwing&&SFX.bigSwing()}
  if(u<1){e.x+=e.lv.x;e.z+=e.lv.z;e.leapY=Math.sin(u*Math.PI)*(a.k==='leap'?2.2:1.0)}else e.leapY=0;
  if(u>=1&&!e.hitDone){e.hitDone=true;if(a.k==='leap'){G.shake=Math.max(G.shake,0.35);SFX.slam&&SFX.slam();ringQ(e.x,(e.gy||0)+0.06,e.z,0.3,3.2,0xff6a3a,26);dustQ(e.x,e.gy,e.z,24);if(near(a.reach))hitPlayer(e,dm,{unblock:true})}
   else if(near(a.reach)&&face)hitPlayer(e,dm,{issen:true})}return}
 if(a.k==='grab'){if(!e.hitDone){e.hitDone=true;if(near(a.reach)&&face&&P.y<1.2){if(P.state==='dodge'&&P.t<P.dodgeLen-4){if(P.t<=8)perfectDodge();return}if(P.state==='dead'||P.state==='issen')return;
  P.state='clinch';P.t=0;P.clinch=e;P.clT=40*(G.diff===0?1.6:1);e.state='hold';e.st=0;SFX.grab();pop('ЛКМ+ПКМ — вырваться!','#ffd27a')}}return}
 if(a.k==='howl'){if(first){e.howled=true;SFX.roar&&SFX.roar();ringQ(e.x,(e.gy||0)+1.1,e.z,0.4,3,0xff5020,30,true);
  const n=Math.random()<0.5?1:2;for(let i=0;i<n;i++){const k=psFind(e.x+rnd(-3,3),e.gy||0,e.z+rnd(-3,3),1);if(k<0)continue;const c=psCen(k);const o=v8Spawn('dog',c[0],c[1],k);o.cd=60}
  for(const o of enemies)if(!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.z-e.z)<8)o.cd=Math.min(o.cd,10)}return}}
// ---------- эффекты в абсолютных координатах (oy — база частицы, пол частицы = oy)
function fxA(sys,p,oy){p.oy=oy;sys.add(p)}
function smokeQ(x,y,z,n){for(let i=0;i<n;i++)fxA(FX.norm,{x:x+rnd(-.5,.5),y:rnd(0.1,1.9),z:z+rnd(-.5,.5),vx:rnd(-.6,.6)/60,vy:rnd(0.2,1)/60,vz:rnd(-.6,.6)/60,drag:0.97,life:rnd(40,80),s:rnd(0.3,0.7),grow:1.2,r:0.03,gg:0.02,b:0.04,a:0.55},y||0)}
function dustQ(x,y,z,n){for(let i=0;i<n;i++)fxA(FX.norm,{x:x+rnd(-1,1),y:0.1,z:z+rnd(-1,1),vx:rnd(-2,2)/60,vy:rnd(0,1)/60,vz:rnd(-2,2)/60,drag:0.96,life:rnd(30,60),s:rnd(0.3,0.6),grow:1.5,r:0.3,gg:0.28,b:0.27,a:0.25},y||0)}
function sparkA(x,y,z,n,c,v=6){for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),el=rnd(-0.3,1.2),s=rnd(1.5,v);fxA(FX.add,{x,y,z,vx:Math.cos(a)*Math.cos(el)*s/60,vy:Math.sin(el)*s/60,vz:Math.sin(a)*Math.cos(el)*s/60,g:0.002,life:rnd(25,60),s:rnd(0.02,0.06),r:c[0],gg:c[1],b:c[2],drag:0.975},0)}}
function flashA(x,y,z,col,int,life){flashes.push({x,y,z,col,int,life,max:life})}
// кольцо-волна (горизонтальное или вертикальное), абсолютная высота
const QRING=[...Array(10)].map(()=>{const m=new Mesh(new THREE.RingGeometry(0.85,1,56),new MB({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));m.visible=false;m.renderOrder=14;scene.add(m);return{m,life:0}});let qrI=0;
function ringQ(x,y,z,r0,r1,col,life,vert){const q=QRING[qrI++%QRING.length];q.life=q.max=life;q.r0=r0;q.r1=r1;q.m.position.set(x,y,z);q.m.rotation.set(vert?0:-Math.PI/2,0,0);q.vert=vert;q.m.material.color.set(col);q.m.visible=true}
function updRingsQ(ts){for(const q of QRING){if(q.life<=0){q.m.visible=false;continue}q.life-=ts;const k=1-q.life/q.max;q.m.scale.setScalar(lerp(q.r0,q.r1,Math.pow(k,0.6)));q.m.material.opacity=(1-k)*0.85;if(q.vert)q.m.lookAt(camera.position)}}
// тёмный портал появления
const QPORT=[...Array(8)].map(()=>{const g=new Group(),m=new Mesh(new THREE.CircleGeometry(1,40),new MB({map:TX.dot,color:0x300008,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));m.rotation.x=-Math.PI/2;g.add(m);
 const r=new Mesh(new THREE.RingGeometry(0.8,1,40),new MB({color:0xff2a3a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.y=0.02;g.add(r);g.visible=false;scene.add(g);return{g,m,r,life:0}});let qpI=0;
function portalQ(x,y,z,sc=1){const q=QPORT[qpI++%QPORT.length];q.life=q.max=110;q.g.position.set(x,y+0.04,z);q.g.scale.setScalar(sc);q.g.visible=true;return q}
function updPortalsQ(ts){for(const q of QPORT){if(q.life<=0){q.g.visible=false;continue}q.life-=ts;const k=1-q.life/q.max,a=Math.min(1,k*5,(1-k)*3);q.m.material.opacity=0.85*a;q.r.material.opacity=0.9*a;q.r.rotation.z+=0.05;q.r.scale.setScalar(1+0.08*Math.sin(k*40));
 if(Math.random()<0.6*a)fxA(FX.add,{x:q.g.position.x+rnd(-0.8,0.8),y:0.05,z:q.g.position.z+rnd(-0.8,0.8),vx:0,vy:rnd(0.01,0.03),vz:0,life:rnd(30,50),s:rnd(0.03,0.06),r:1.6,gg:0.2,b:0.25},q.g.position.y)}}
function v8Spawn(t,x,z,k){const e=mkEnemy(t,x,z);if(k!=null&&k>=0){e._pk=k;e._px=x;e._pz=z;e.gy=psH(k)}else{psClamp(e);e.gy=psGround(e)}e.state='enter';e.st=0;e.spawnK=0;enemies.push(e);portalQ(e.x,e.gy,e.z,t==='smile'?1.4:1);SFX.spawn&&SFX.spawn(true);return e}
// ---------- волны
const PS_W=[{en:['dog','dog','dog'],say:[['Юки','Псы! Быстрые — бей на опережение. ЛКМ — цепь из четырёх ударов, четвёртый — прыжок с волной.']]},
 {en:['wraith','wraith','dog','dog'],say:[['Юки','Тряпичники… Синий блеск — он исчезнет и ударит в спину. Уворот!']]},
 {en:['smile','wraith','dog'],say:[['Акира','…Он улыбается.'],['Юки','Улыбака! Прыгает издалека — смотри на тень. Схватит — ЛКМ+ПКМ.']]},
 {en:['smile','smile','dog','dog','wraith'],say:[['Юки','F — Полумесяц, G — Вихрь, V — Шаг тени. Клинки отвечают тебе, Акира!']]},
 {en:['smile*','wraith*','wraith','dog','dog','dog'],say:[['Юки','Это их вожаки! Шкала Они полна — R: «Два Неба»!']]}];
function psSpawnWave(){const w=PS_W[PS.wave],N=psFlow(),D=N.dist,cand=[];for(const s of w.say)say(s[0],s[1]);
 for(let k=0;k<N.N;k++){const v=D[k];if(v<0||N.cl[k]<2)continue;const dd=v*N.cs;if(dd>=8&&dd<=17)cand.push(k)}
 const used=[];w.en.forEach((t0,i)=>{const el=t0.endsWith('*'),t=t0.replace('*','');let k=-1;for(let tr=0;tr<40;tr++){const c=cand[(Math.random()*cand.length)|0];if(c==null)break;const p=psCen(c);if(used.every(u=>Math.hypot(u[0]-p[0],u[1]-p[1])>2.5)){k=c;used.push(p);break}}
  let x,z;if(k<0){x=P.x+rnd(-6,6);z=P.z+rnd(-6,6)}else[x,z]=psCen(k);
  setTimeout0(()=>{if(!LV.ps1)return;const e=v8Spawn(t,x,z,k);if(el){e.elite=true;e.max=e.hp=Math.round(e.hp*1.7);e.d={...e.d,name:e.d.name+'-вожак',poise:e.d.poise*1.6};if(e.rig.mat)e.rig.mat.emissive&&e.rig.mat.emissive.set(0x200000)}if(el&&t==='smile'){G.bossBar=e;SFX.bell()}},i*24)});
 PS.active=true;PS.fight=true;LV.active=true}
const Q_TO=[];function setTimeout0(f,n){Q_TO.push({f,n})}
function updTimersQ(ts){for(const q of Q_TO)q.n-=ts;for(let i=Q_TO.length-1;i>=0;i--)if(Q_TO[i].n<=0){const f=Q_TO[i].f;Q_TO.splice(i,1);f()}}
// ---------- загрузка главы, кадр
function psLoad(cp){LV.ps1=true;psNav();PS.on=true;PS.cs=0;PS.t=0;PS.done=false;PS.active=false;PS.fight=false;PS.waveT=0;PS.clearT=0;Q_TO.length=0;PS.wave=cp&&cp.wave||0;PS.started=!!cp;LV.env.nav=null;LV.env.R=999;
 const S=V8D.spawn;P.x=S[0];P.z=S[1];P._pk=null;P.yaw=Math.PI;G.camYaw=P.yaw;P.y=0;P.vy=0;
 // клиренс игрока: 2 (0.5 м от стен), если связность почти не страдает
 if(PS.reqC==null){const N=V8D.nav,cnt=req=>{const s=psFind(S[0],0.2,S[1],req);if(s<0)return 0;const seen=new Uint8Array(N.N),Q=[s];seen[s]=1;let n=0;while(Q.length){const k=Q.pop();n++;for(let d=0;d<4;d++){const m=N.nb[k*4+d];if(m>=0&&!seen[m]&&N.cl[m]>=req){seen[m]=1;Q.push(m)}}}return n};
  const c1=cnt(1),c2=cnt(2);PS.reqC=c2>=c1*0.72?2:1;console.log('PS1 nav reach',c1,c2,'req',PS.reqC)}PS.req=PS.reqC;
 psClamp(P);GY=psGround(P);G.camDist=4.4;nbEquip();
 G.cp={chap:G.chap,wave:PS.wave,mi:0,oni:P.oni};if(cp){P.oni=cp.oni||0;G.card=null;say('Юки','Ещё раз, Акира. Они не уйдут сами.')}}
function psAnim(ts){if(!LV.ps1)return;PS.t+=ts;FXY=GY;updRingsQ(ts);updPortalsQ(ts);updTimersQ(ts);updNbFx(ts);
 if(P._pk!=null&&P._pk>=0){const g=psGround(P);GY=Math.abs(g-GY)>1.2?g:lerp(GY,g,0.4)}
 if(LV.w0){w0Anim(ts);return}
 for(const m of PS.glass)m.opacity=0.42+0.1*Math.sin(PS.t*0.03);if(PS.water&&PS.water.map){PS.water.map.offset.x=PS.t*0.0004;PS.water.map.offset.y=Math.sin(PS.t*0.004)*0.01}
 for(const m of PS.lamps)m.emissiveIntensity=2.0+0.25*Math.sin(PS.t*0.11+Math.sin(PS.t*0.031)*3);
 if(PS.motes){const a=PS.motes.geometry.attributes.position;for(let i=0;i<a.count;i+=9){a.setY(i,a.getY(i)+0.003);if(a.getY(i)>9)a.setY(i,-3)}a.needsUpdate=true}
 for(let i=1;i<STATIC.length;i++){const l=STATIC[i];if(l.userData.base)l.intensity=l.userData.base*(0.92+0.08*Math.sin(PS.t*0.07+i*1.7))}}
function updPs(ts){if(P.y<0)P.y=0;
 if(PS.done){PS.clearT+=ts;if(PS.clearT>150&&!CS.on)psClearCS();return}
 if(!PS.started){PS.waveT+=ts;if(PS.waveT>200||Math.hypot(P.x-V8D.spawn[0],P.z-V8D.spawn[1])>5){PS.started=true;PS.waveT=120}return}
 if(!PS.active){PS.waveT+=ts;if(PS.wave<PS_W.length&&(PS.waveT>200&&!G.subs.length||PS.waveT>420)){psSpawnWave();PS.waveT=0}return}
 if(!Q_TO.length&&!enemies.some(e=>!e.dead||e.pending>0)){PS.active=false;LV.active=false;PS.wave++;PS.waveT=0;PS.fight=false;G.bossBar=null;P.hp=Math.min(P.max,P.hp+25);
  if(PS.wave>=PS_W.length){PS.done=true;PS.clearT=0;SFX.victory&&SFX.victory();pop('Локация зачищена','#ffd27a')}else{pop('Волна '+PS.wave+' / '+PS_W.length+' отбита','#cfc6b0');SFX.clear&&SFX.clear();G.cp={chap:G.chap,wave:PS.wave,mi:0,oni:P.oni}}}
 if(PS.fight&&G.frame%30===0&&!musicOn())SFX.taiko(G.frame%120===0?1:0.55)}
function drawPsHUD(){if(CS.on)return;X.textAlign='center';const a=PS.done?0:1;if(!a)return;const n=enemies.filter(e=>!e.dead).length;
 X.font='13px Georgia,serif';X.fillStyle='rgba(230,215,200,0.75)';X.fillText(PS.active?('ВОЛНА '+(PS.wave+1)+' / '+PS_W.length+' · врагов: '+n):PS.started?('Следующая волна… '+(PS.wave+1)+' / '+PS_W.length):'Осмотрись. Тени уже шевелятся…',W/2,30);
 X.textAlign='left';X.font='12px Georgia,serif';X.fillStyle='rgba(220,210,235,0.62)';X.fillText('F Полумесяц (15) · G Вихрь (25) · V Шаг тени · R Два Неба (Они)',W-420,H-19)}
// ---------- новые катаны: «Акэбоно» (правая, рассвет) и «Ёиями» (левая, ночь между мирами)
const NB_C={R:[2.6,1.15,0.45],L:[1.0,0.55,2.7]},NB_S={R:[1,0.72,0.4],L:[0.62,0.5,1.4]};
function nbEquip(force){G.nb=true;G.oneBlade=false;if(!ASSET.parts.SW_N1)return;
 for(const [s,pre] of[['R','SW_N1'],['L','SW_N2']]){const A=hero.arms[s];if(A.sw.userData.nb&&!force)continue;const o=A.sw,n=makeSword(0.78,null,false,pre);n.userData.nb=1;n.traverse(m=>{if(m.isMesh){m.castShadow=true;if(m.material&&!m.material.userData.nbf){m.material.userData.nbf=1;m.material.envMapIntensity=0.9}}});(o.parent||hero.hips).add(n);if(o.parent)o.parent.remove(o);A.sw=n}
 if(hero.saya&&ASSET.parts.SN1)hero.saya.forEach((g,k)=>{if(g.userData.nb)return;g.userData.nb=1;g.userData.old=[...g.children];while(g.children.length)g.remove(g.children[0]);const inn=new Group();g.add(inn);addPart(inn,k?'SN2':'SN1','saya')});
 trails.L.col=NB_C.L}
// вернуть старые клинки (новая игра / после прогрева шейдеров)
function nbUnequip(){G.nb=false;
 for(const [s,len,ts,lp] of[['R',0.74,M.tsubaR,false],['L',0.69,M.tsubaL,true]]){const A=hero.arms[s];if(!A.sw.userData.nb)continue;const o=A.sw,n=makeSword(len,ts,lp,HXS?'KN':undefined);n.traverse(m=>{if(m.isMesh)m.castShadow=true});(o.parent||A.hand).add(n);if(o.parent)o.parent.remove(o);A.sw=n}
 if(hero.saya)hero.saya.forEach(g=>{if(!g.userData.nb)return;g.userData.nb=0;while(g.children.length)g.remove(g.children[0]);for(const c of g.userData.old||[])g.add(c);g.visible=true});
 trails.L.col=[0.5,1.2,2.4]}
function nbDefs(){const R='R',L='L',N='N';return{
 A1:{s:12,a:6,r:22,dmg:[24,30],reach:2.6,arc:-0.1,st:10,knock:3,type:R,clip:'A1',nb:1},
 A2:{s:10,a:6,r:22,dmg:[22,28],reach:2.6,arc:-0.1,st:10,knock:3,type:L,clip:'A2',nb:1},
 A3:{s:13,a:8,r:25,dmg:[30,36],reach:2.9,arc:-0.6,st:14,knock:6,type:N,clip:'A3',nb:1,wide:1},
 A4:{s:22,a:6,r:34,dmg:[46,54],reach:2.8,arc:0,st:18,knock:10,type:N,clip:'A4',nb:1,gb:true,jump:1},
 B1:{s:8,a:5,r:16,dmg:[16,20],reach:3.0,line:0.55,st:6,knock:2,type:L,clip:'B1',nb:1,lungeX:2.0},
 B2:{s:10,a:8,r:24,dmg:[26,32],reach:2.5,arc:0.15,st:10,knock:3,type:N,clip:'B2',nb:1,launch:true},
 AX:{s:12,a:7,r:28,dmg:[44,52],reach:2.8,arc:0.1,st:18,knock:8,type:N,clip:'AX',nb:1,gb:true,cross:1},
 AC:{s:16,a:4,r:24,dmg:[0,0],reach:0,arc:2,st:0,knock:0,type:N,clip:'AC',nb:1,cres:1},
 AV:{s:12,a:44,r:20,dmg:[12,15],reach:3.3,arc:-2,st:0,knock:2,type:N,clip:'AV',nb:1,whirl:1,multi:9},
 AD:{s:6,a:12,r:24,dmg:[34,40],reach:0,arc:2,st:0,knock:6,type:N,clip:'AD',nb:1,dash:1},
 AU:{s:42,a:10,r:48,dmg:[70,80],reach:6.5,arc:-2,st:0,knock:12,type:N,clip:'AU',nb:1,ult:1,gb:true}}}
function nbStart(a,dirY){const tgt=G.lock&&!G.lock.dead?G.lock:nearest(a.dash?9:a.cres||a.cross?12:5.5,dirY!=null?dirY:P.yaw,a.dash||a.cres?0.3:-0.2);
 if(tgt){aimAt(tgt);const d=Math.hypot(tgt.x-P.x,tgt.z-P.z);P.lunge=a.dash||a.cres||a.ult||a.whirl?0:clamp(d-a.reach*0.75,0,a.lungeX||1.6)}else{if(dirY!=null)P.yaw=dirY;P.lunge=a.dash?0:0.5}
 P.clipName=a.clip;P.drawn=true;P.st=Math.max(-10,P.st-a.st);P.state='atk';P.atk=a;P.t=0;P.swung=false;P.hitList=new Set();P.buf=null;P.nbJ=0;P.nbM=-1;P.nbD=null;
 P.atkSpd=(P.stance===0&&a.type==='R')?1.12:(P.stance===2&&a.type==='L')?1.25:1;if(P.st<0)P.atkSpd*=0.75;if(a.ult||a.whirl||a.dash)P.atkSpd=1}
function nbAttack(k,dirY){const pc=P.combo;let a;
 if(k==='R'){const n=pc.match(/A*$/)[0].length%4;a=[ATK.A1,ATK.A2,ATK.A3,ATK.A4][n];P.combo=n===3?'':pc+'A'}
 else if(k==='L'){const n=pc.match(/B*$/)[0].length%2;a=n?ATK.B2:ATK.B1;P.combo=n?'':pc+'B'}else{a=ATK.AX;P.combo=''}
 nbStart(a,dirY)}
function nbKeys(dirY){
 if(hit('KeyF')){if(P.mana<15){pop('Мало синих душ (Полумесяц — 15)','#8fb8ff');return true}P.mana-=15;nbStart(ATK.AC,dirY);return true}
 if(hit('KeyG')){if(P.mana<25){pop('Мало синих душ (Вихрь — 25)','#8fb8ff');return true}P.mana-=25;nbStart(ATK.AV,dirY);SFX.charge&&SFX.charge();return true}
 if(hit('KeyV')){if(P.st<30){pop('Нет выносливости','#c9a0a0');return true}P.st-=30;nbStart(ATK.AD,dirY);return true}
 if(hit('KeyR')){if(P.oni<100){pop('Шкала Они не полна','#c9a0a0');return true}P.oni=0;nbStart(ATK.AU,dirY);SFX.bell&&SFX.bell();pop('ДВА НЕБА','#ffd27a');return true}
 return false}
function nbTip(s,v){hero.arms[s].sw.userData.tip.getWorldPosition(v);return v}
function nbTick(a,T){const fx=fwdX(P.yaw),fz=fwdZ(P.yaw),act=T>=a.s&&T<a.s+a.a;
 if(a.jump&&!P.nbJ&&T>=2){P.nbJ=1;P.vy=0.085}
 if(a.ult){if(!P.nbJ&&T>=16){P.nbJ=1;P.vy=0.15;SFX.bigSwing&&SFX.bigSwing()}if(T<a.s&&G.frame%2===0)for(const s of['R','L']){nbTip(s,_q1);fxA(FX.add,{x:_q1.x+rnd(-1.2,1.2),y:_q1.y+rnd(-0.6,1.2),z:_q1.z+rnd(-1.2,1.2),vx:0,vy:0,vz:0,life:18,s:rnd(0.04,0.08),r:NB_C[s][0],gg:NB_C[s][1],b:NB_C[s][2],att:_q1.clone()},0)}}
 if(a.dash&&act){if(!P.nbD){P.nbD={x:P.x,z:P.z,hit:new Set()};SFX.zan&&SFX.zan()}const sp=0.5;P.x+=fx*sp;P.z+=fz*sp;P.invT=Math.max(P.invT||0,5);
  for(let h=0.3;h<1.8;h+=0.35)fxA(FX.add,{x:P.x+rnd(-.1,.1),y:h,z:P.z+rnd(-.1,.1),vx:0,vy:0,vz:0,life:26,s:0.42,r:0.35,gg:0.25,b:1.0,a:0.35},GY);smokeQ(P.x,GY,P.z,2);
  for(const e of enemies){if(e.dead||P.nbD.hit.has(e))continue;if(Math.hypot(e.x-P.x,e.z-P.z)<1.3+e.d.rad&&Math.abs(v8dy(e))<1.6){P.nbD.hit.add(e);const d=Math.hypot(e.x-P.x,e.z-P.z)||1;nbHit(a,e,(e.x-P.x)/d,(e.z-P.z)/d);dmgEnemy(e,Math.round(rnd(a.dmg[0],a.dmg[1])),(e.x-P.x)/d,(e.z-P.z)/d,{knock:a.knock,stop:3})}}}
 if(a.dash&&T>=a.s+a.a&&P.nbD&&!P.nbD.end){P.nbD.end=1;lines.push({x1:P.nbD.x,z1:P.nbD.z,x2:P.x,z2:P.z,life:30,max:30,col:0x9a80ff});G.shake=Math.max(G.shake,0.12)}
 if(a.whirl&&act){const m=((T-a.s)/a.multi)|0;if(m!==P.nbM){P.nbM=m;P.hitList=new Set();(m%2?SFX.swingL:SFX.swingR)();ringQ(P.x,GY+1.0,P.z,0.6,3.4,m%2?0x8a70ff:0xffb070,16)}
  for(const e of enemies){if(e.dead)continue;const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz);if(d<5.5&&d>1.2&&Math.abs(v8dy(e))<1.6){e.vx+=dx/d*0.006;e.vz+=dz/d*0.006}}
  for(let i=0;i<3;i++){const an=rnd(0,Math.PI*2),r=rnd(0.8,3.2);fxA(FX.add,{x:P.x+Math.cos(an)*r,y:rnd(0.3,1.6),z:P.z+Math.sin(an)*r,vx:-Math.sin(an)*0.06,vy:0.004,vz:Math.cos(an)*0.06,life:20,s:rnd(0.03,0.06),r:i%2?NB_C.L[0]:NB_C.R[0],gg:i%2?NB_C.L[1]:NB_C.R[1],b:i%2?NB_C.L[2]:NB_C.R[2],drag:0.95},GY)}}
 if(act&&G.frame%1===0)for(const s of['R','L']){if(a.type!=='N'&&a.type!==s)continue;nbTip(s,_q1);fxA(FX.add,{x:_q1.x,y:_q1.y,z:_q1.z,vx:rnd(-.01,.01),vy:rnd(-.005,.01),vz:rnd(-.01,.01),life:rnd(14,26),s:rnd(0.03,0.06),r:NB_C[s][0],gg:NB_C[s][1],b:NB_C[s][2],drag:0.95},0)}
 return false}
function nbSwing(a){const fx=fwdX(P.yaw),fz=fwdZ(P.yaw),y0=GY+P.y;
 if(a.type==='L')SFX.swingL();else SFX.swingR(a.type==='N'?'O':undefined);if(a.type==='N'&&!a.whirl)SFX.cross();
 if(a.jump){SFX.slam&&SFX.slam();SFX.taiko(1.3);G.shake=Math.max(G.shake,0.35);ringQ(P.x+fx*1.2,GY+0.06,P.z+fz*1.2,0.3,3.0,0xffc890,24);dustQ(P.x+fx,GY,P.z+fz,26);nbProj('wave',P.x+fx*1.0,GY+0.02,P.z+fz*1.0,fx*0.26,fz*0.26,26,30)}
 if(a.cross){nbProj('cross',P.x+fx*0.8,y0+1.15,P.z+fz*0.8,fx*0.34,fz*0.34,26,30);flashA(P.x+fx,y0+1.2,P.z+fz,0xffe0c0,7,10)}
 if(a.cres){SFX.zan&&SFX.zan();for(const sd of[-1,1])nbProj(sd>0?'cresR':'cresL',P.x+fx*0.8,y0+1.15,P.z+fz*0.8,fx*0.3,fz*0.3,50,30,sd);flashA(P.x,y0+1.2,P.z,0xc8a0ff,8,14)}
 if(a.ult){nbUlt()}
 if(a.launch)for(const s of['R','L']){nbTip(s,_q1);sparkA(_q1.x,_q1.y,_q1.z,12,NB_S[s],5)}}
function nbHit(a,e,dx,dz){const y=(e.gy||0)+e.y+Math.min(1.4,e.d.h*0.6),c=a.type==='L'?NB_S.L:a.type==='R'?NB_S.R:(Math.random()<0.5?NB_S.L:NB_S.R);sparkA(e.x-dx*0.3,y,e.z-dz*0.3,a.gb?28:14,c.map(v=>v*2),a.gb?8:6);
 if(a.ult){e.frozen=Math.max(e.frozen||0,e.d.boss?40:90)}if(a.cross||a.jump)G.hitstop=Math.max(G.hitstop,5)}
// снаряды новых клинков
const NBGEO={};function nbGeo(k){if(NBGEO[k])return NBGEO[k];let g;if(k==='wave'){g=new THREE.CircleGeometry(0.9,24,0,Math.PI);g.scale(1.7,1,1)}else{g=new THREE.TorusGeometry(1.15,0.07,6,28,Math.PI*0.9);g.rotateZ(Math.PI*0.05);g.translate(0,-0.8,0)}return NBGEO[k]=g}
// снаряд: дуга (плоскость дуги ⟂ направлению полёта), крест — две дуги накрест, волна — полукруг по земле
function nbProj(k,x,y,z,vx,vz,life,dmg,sd=0){const col=k==='cresL'?0x9a70ff:k==='cresR'?0xffa860:k==='wave'?0xffd8a0:0xfff0e0,mk=()=>new Mesh(nbGeo(k==='wave'?'wave':'arc'),new MB({color:col,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,toneMapped:false,depthWrite:false,side:THREE.DoubleSide}));
 const g=new Group(),m=mk();g.add(m);if(k==='cross'){const m2=mk();m.rotation.z=Math.PI/4;m2.rotation.z=-Math.PI/4;g.add(m2)}else if(k!=='wave')m.rotation.z=sd*0.45;
 g.rotation.set(0,Math.atan2(vx,vz),0);g.position.set(x,y,z);scene.add(g);proj.push({k:'nb',kind:k,x,y,z,vx,vy:0,vz,life,max:life,dmg,hit:new Set(),m:g,upd:nbProjUpd})}
function nbProjUpd(p,ts){const g=p.m;g.position.set(p.x,p.y,p.z);const k=1-p.life/p.max;
 if(p.kind==='wave'){g.scale.set(1+k*0.6,1-k*0.4,1);dustQ(p.x,p.y,p.z,1);if(Math.random()<0.8)sparkA(p.x+rnd(-0.6,0.6),p.y+0.1,p.z+rnd(-0.6,0.6),1,[2,1.4,0.6],3)}
 else{g.scale.setScalar(1+k*0.35);for(const c of g.children)c.material.opacity=0.95*(1-k*0.6);if(G.frame%2===0){const c=p.kind==='cresL'?NB_C.L:p.kind==='cresR'?NB_C.R:[2,1.8,1.6];fxA(FX.add,{x:p.x+rnd(-.8,.8),y:p.y+rnd(-.6,.6),z:p.z+rnd(-.8,.8),vx:0,vy:0,vz:0,life:18,s:0.05,r:c[0],gg:c[1],b:c[2]},0)}}
 if(psSolid(p.x,p.y+(p.kind==='wave'?0.5:0),p.z)&&k>0.08){p.life=0;sparkA(p.x,p.y+0.3,p.z,16,[1.6,1.2,0.9],5);return}
 for(const e of enemies){if(e.dead||p.hit.has(e))continue;const dy=(e.gy||0)+e.y+1-p.y-(p.kind==='wave'?0.6:0);if(Math.hypot(e.x-p.x,e.z-p.z)<1.3+e.d.rad&&Math.abs(dy)<1.7){p.hit.add(e);const L=Math.hypot(p.vx,p.vz)||1;
  sparkA(e.x,(e.gy||0)+1.1,e.z,18,p.kind==='cresL'?NB_S.L:NB_S.R,6);dmgEnemy(e,Math.round(p.dmg*(1+((G.forge&&G.forge.R)||0)*0.05)),p.vx/L,p.vz/L,{knock:p.kind==='wave'?7:5,stop:3,gb:p.kind==='wave'})}}}
// «Два Неба»: удар о землю + 8 столбов света с неба
const NBEAM=[...Array(8)].map(()=>{const m=new Mesh(new THREE.CylinderGeometry(0.32,0.5,16,14,1,true),new MB({map:TX.dot,color:0xffe6c0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));m.visible=false;scene.add(m);return{m,life:0}});
function nbUlt(){G.shake=0.6;G.slow=60;G.slowTs=0.35;G.fovT=46;G.fovHold=40;SFX.oniBlast&&SFX.oniBlast();SFX.thunder&&SFX.thunder(1);ringQ(P.x,GY+0.06,P.z,0.4,7.5,0xffd8a0,40);ringQ(P.x,GY+0.08,P.z,0.3,5.0,0x9a70ff,34);flashA(P.x,GY+1.5,P.z,0xfff0d0,16,30);dustQ(P.x,GY,P.z,40);
 const tg=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.z-P.z)<12).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));
 NBEAM.forEach((b,i)=>{const e=tg[i];let x,z,y;if(e){x=e.x;z=e.z;y=e.gy||0}else{const an=i/8*Math.PI*2,r=rnd(2,5.5);x=P.x+Math.cos(an)*r;z=P.z+Math.sin(an)*r;y=GY}
  b.life=b.max=50+i*4;b.x=x;b.z=z;b.y=y;b.del=i*4;b.done=false;b.m.position.set(x,y+8,z);b.m.visible=false;b.m.material.color.set(i%2?0xc0a8ff:0xffe0b0)})}
function updNbFx(ts){for(const b of NBEAM){if(b.life<=0){b.m.visible=false;continue}b.life-=ts;b.del-=ts;if(b.del>0)continue;b.m.visible=true;const k=1-b.life/(b.max-0),a=Math.min(1,(b.max-b.life)/6)*Math.max(0,b.life/b.max);b.m.material.opacity=0.9*a;b.m.scale.set(1+k*0.8,1,1+k*0.8);
  if(!b.done){b.done=true;SFX.thunder&&SFX.thunder(0.5);ringQ(b.x,b.y+0.06,b.z,0.2,2.2,0xffe0b0,26);sparkA(b.x,b.y+0.3,b.z,30,[2,1.6,1.1],7);flashA(b.x,b.y+2,b.z,0xffe8c8,10,16);
   for(const e of enemies)if(!e.dead&&Math.hypot(e.x-b.x,e.z-b.z)<1.6+e.d.rad&&Math.abs((e.gy||0)-b.y)<2){const d=Math.hypot(e.x-P.x,e.z-P.z)||1;dmgEnemy(e,Math.round(rnd(30,38)),(e.x-P.x)/d,(e.z-P.z)/d,{knock:6,stop:2,gb:true,force:true});e.frozen=Math.max(e.frozen||0,60)}}
  if(G.frame%2===0)fxA(FX.add,{x:b.x+rnd(-.4,.4),y:rnd(0,6),z:b.z+rnd(-.4,.4),vx:0,vy:-0.05,vz:0,life:20,s:0.06,r:2,gg:1.8,b:1.4},b.y)}
 if(!CS.on&&P.drawn&&G.nb&&G.frame%7===0&&P.state!=='atk')for(const s of['R','L']){nbTip(s,_q1);fxA(FX.add,{x:_q1.x,y:_q1.y,z:_q1.z,vx:0,vy:0.004,vz:0,life:30,s:0.025,r:NB_C[s][0]*0.6,gg:NB_C[s][1]*0.6,b:NB_C[s][2]*0.6},0)}}
// ---------- Старец (CC-BY-NC Felnev) и сон-космос
const QS={g:null,old:null,gal:null,orb:null,vis:{R:true,L:true},disp:null,ln:null};
function qOld(){if(QS.old)return QS.old;const it=v8Items('V8','old');let o;
 if(it.length){o=v8Skin(it,V8D.old,{mat:m=>{m.envMapIntensity=0.35;m.transparent=true;m.opacity=0;m.userData.op=1}});o.root.scale.setScalar(1.12)}
 else{const r=new Group(),m=new MS({color:0x8a8478,transparent:true,opacity:0});const b=new Mesh(new THREE.CapsuleGeometry(0.28,1.0,4,8),m);b.position.y=0.85;r.add(b);o={root:r,bones:{},meshes:[b],list:[]}}
 const orb=new Mesh(new THREE.SphereGeometry(0.07,16,12),new MB({color:0xdfeaff,toneMapped:false,transparent:true,opacity:0}));const hR=o.bones.handR;if(hR){hR.add(orb);orb.position.set(0.02,0,0.08)}else{o.root.add(orb);orb.position.set(-0.1,1.02,0.33)}
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:0x9fc0ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.scale.setScalar(0.7);orb.add(halo);
 o.orb=orb;o.halo=halo;QS.old=o;return o}
function qOldFade(a){const o=qOld();for(const m of o.meshes){const mt=m.material;mt.opacity=a;mt.transparent=a<0.999;mt.depthWrite=a>0.5}o.orb.material.opacity=a;o.halo.material.opacity=0.55*a;o.root.visible=a>0.01}
function qOldAnim(t,talk,o2={}){const o=qOld(),B=o.bones;if(!B.chest)return;const br=Math.sin(t*0.035)*0.03,nod=talk?Math.sin(t*0.09)*0.06:0;
 bR(B.hips,0,0,0);bR(B.chest,0.05+br,Math.sin(t*0.013)*0.04,0);bR(B.head,-0.05+nod+(o2.nod||0),Math.sin(t*0.011)*0.12+(o2.look||0),Math.sin(t*0.02)*0.03);
 const g=talk?(0.5+0.5*Math.sin(t*0.05)):0;bR(B.armL,-0.35*g-(o2.armL||0),0,0.15*g);bR(B.foreL,-0.5*g-(o2.armL||0)*0.6);bR(B.handL,0.2*g);
 bR(B.armR,-(o2.raise||0)*0.9,0,0);bR(B.foreR,-(o2.raise||0)*0.4);bR(B.handR,0);bR(B.legL,0);bR(B.legR,0);
 o.halo.scale.setScalar(0.6+0.12*Math.sin(t*0.08)+(o2.glow||0)*0.8)}
// галактика: плоскость диска — по главным осям облака (наименьшая дисперсия -> нормаль)
function qGalaxy(){const S=V8D.space,n=S.n,q=new Int16Array(b64u8(S.p).buffer),c=b64u8(S.c),pos=new Float32Array(n*3),col=new Float32Array(n*3);
 const C=[0,0,0,0,0,0];for(let i=0;i<n;i++){const x=q[i*3],y=q[i*3+1],z=q[i*3+2];C[0]+=x*x;C[1]+=y*y;C[2]+=z*z;C[3]+=x*y;C[4]+=x*z;C[5]+=y*z}
 const M3=[[C[0],C[3],C[4]],[C[3],C[1],C[5]],[C[4],C[5],C[2]]],mul=v=>[0,1,2].map(r=>M3[r][0]*v[0]+M3[r][1]*v[1]+M3[r][2]*v[2]),nrm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
 let a=[1,0.3,0.2];for(let k=0;k<60;k++)a=nrm(mul(a));let b=[0.2,1,0.3];for(let k=0;k<60;k++){b=mul(b);const d=b[0]*a[0]+b[1]*a[1]+b[2]*a[2];b=nrm([b[0]-d*a[0],b[1]-d*a[1],b[2]-d*a[2]])}
 const nv=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const R=150/32767;
 for(let i=0;i<n;i++){const x=q[i*3],y=q[i*3+1],z=q[i*3+2];pos[i*3]=(x*a[0]+y*a[1]+z*a[2])*R;pos[i*3+1]=(x*nv[0]+y*nv[1]+z*nv[2])*R;pos[i*3+2]=(x*b[0]+y*b[1]+z*b[2])*R;const k=1.6;col[i*3]=c[i*3]/255*k;col[i*3+1]=c[i*3+1]/255*k;col[i*3+2]=c[i*3+2]/255*k}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 const p=new THREE.Points(g,new THREE.PointsMaterial({map:TX.dot,size:1.5,sizeAttenuation:true,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));p.frustumCulled=false;return p}
function qSpaceBuild(){if(QS.g)return QS.g;const g=new Group();g.visible=false;scene.add(g);QS.g=g;
 const gw=new Group();gw.position.set(0,-46,-30);gw.rotation.set(0.32,0,0.12);g.add(gw);QS.gal=qGalaxy();gw.add(QS.gal);QS.galW=gw;
 const n=2600,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=420,s=Math.sqrt(1-u*u);pos[i*3]=Math.cos(a)*s*r;pos[i*3+1]=u*r;pos[i*3+2]=Math.sin(a)*s*r}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));const st=new THREE.Points(sg,new THREE.PointsMaterial({color:0xdfe6ff,size:1.4,sizeAttenuation:false,fog:false,toneMapped:false,transparent:true,opacity:0.9,depthWrite:false}));st.frustumCulled=false;g.add(st);QS.stars=st;
 for(let i=0;i<7;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:[0x5a3aa0,0x2a4aa0,0x8a3a80][i%3],transparent:true,opacity:0.22,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));const a=i/7*Math.PI*2;s.position.set(Math.cos(a)*160,rnd(-60,40),Math.sin(a)*160);s.scale.setScalar(rnd(90,160));g.add(s)}
 // платформа: тёмный круг с кольцами света
 const pl=new Group();g.add(pl);QS.pl=pl;const d=new Mesh(new THREE.CircleGeometry(3.4,64),new MS({color:0x141a30,roughness:0.35,metalness:0.6,transparent:true,opacity:0.92}));d.rotation.x=-Math.PI/2;d.receiveShadow=true;pl.add(d);
 for(const [r0,r1,c,o] of[[3.3,3.4,0x9ab8ff,0.9],[2.2,2.24,0xc8a0ff,0.6],[1.0,1.03,0xffd8a0,0.5]]){const m=new Mesh(new THREE.RingGeometry(r0,r1,96),new MB({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.y=0.012;pl.add(m)}
 const ug=new Mesh(new THREE.CircleGeometry(5,48),new MB({map:TX.dot,color:0x3a4aa0,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));ug.rotation.x=Math.PI/2;ug.position.y=-0.3;pl.add(ug);
 const o=qOld();g.add(o.root);return g}
function qSpaceOn(x,y,z,yaw){const g=qSpaceBuild();g.visible=true;QS.pl.position.set(x,y,z);QS.galW.position.set(x,y-46,z-30);QS.stars.position.set(x,y,z);
 if(ENV)ENV.visible=false;if(TP.white)TP.white.visible=false;if(TP.stars)TP.stars.visible=false;scene.background=new THREE.Color(0x02030a);scene.fog=new THREE.FogExp2(0x02030a,0.0015);
 hemi.color.set(0x8a90d0);hemi.groundColor.set(0x30204a);hemi.intensity=0.55;moon.color.set(0xc8d0ff);moon.intensity=0.5;for(const l of STATIC){l.intensity=0;l.userData.base=0}
 const o=qOld();o.root.position.set(x+Math.sin(yaw)*2.5,y,z+Math.cos(yaw)*2.5);o.root.rotation.set(0,yaw+Math.PI,0);qOldFade(0)}
function qSpaceOff(){if(QS.g)QS.g.visible=false;if(QS.disp)for(const s of QS.disp)s.visible=false}
// ---------- катсцена: сон-космос (после выбора красной катаны)
const Q_SCRIPT=[['Старец','Ты долго шёл, Акира. Скажи — помнишь ли ты, где начался твой путь?'],['Акира','В Ивате… в пепле. Потом лес, зеркала, храм… Кто ты, старик?'],
 ['Старец','Рыба не знает, что плывёт в воде, пока её не вынут на берег.'],['Акира','Рыба?.. При чём здесь рыба?'],['Старец','Луна в пруду кажется настоящей. Брось камень — и где она?'],
 ['Старец','Спящий бежит всю ночь… а утром ноги его не устали.'],['Акира','Ты говоришь загадками. Я не понимаю ни слова.'],['Старец','Поймёшь. Не сейчас.'],['Старец','Дай мне свои клинки.'],
 ['Акира','Мои катаны? Они прошли со мной весь путь!'],['Старец','Они иссякли. Духовной силы в них не осталось — теперь они будут бить не больнее, чем палка.'],
 ['Старец','Возьми эти. Два клинка — две души.'],['Старец','Акэбоно — правая, рассвет. Ёиями — левая, ночь между мирами.'],['Акира','Они… тёплые. И холодные — одновременно.'],['Старец','А теперь… проснись.']];
function qSpaceCS(){tpVoiceOff();if(CS.on)csEnd();const s=TP.sw.red;if(s)s.visible=false;P.csGrip=0;P.csRx=0;P.csPost=null;P.csHide=false;TP.nar=[];TP.lid=1;TP.ov={c:'0,0,0',a:1};G.subs=[];G.card=null;
 if(P.drawn){P.drawn=false}P.state='idle';P.t=0;P.y=0;const yaw=P.yaw,hx=P.x,hz=P.z,gy=GY,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-fz,rz=fx,L=(r,y,f)=>[hx+rx*r+fx*f,gy+y,hz+rz*r+fz*f];
 qSpaceOn(hx,gy,hz,yaw);QS.vis={R:true,L:true};const o=qOld();
 // расписание реплик
 let tt=300;const LN=Q_SCRIPT.map(([n,t])=>{const d=Math.max(150,Math.round(t.length*3.6)),a=tt;tt+=d+16;return{n,t,a,b:a+d}});const at=i=>LN[i].a,END=LN[14].b+20;QS.ln=LN;
 const fly={};let disp=null;
 const go=()=>{tpVoiceOff();qSpaceOff();QS.vis={R:true,L:true};hero.arms.R.sw.visible=true;P.hideL=false;P.csPost=null;P.csClip=null;nbEquip(true);for(const s of['R','L'])hero.arms[s].sw.visible=true;if(hero.saya)hero.saya.forEach(g=>g.visible=true);TP.ov={c:'255,255,255',a:1};loadChapter(CH.findIndex(c=>c.ps1));G.card=null;G.subs=[];psWakeCS()};
 csStart('tpSpace',t=>{const H=CS.H;CS.bars=1;P.csHide=false;H.yaw=yaw;
  TP.ov={c:'0,0,0',a:1-ek(t,10,90)};if(t>=END-60)TP.ov={c:'255,255,255',a:ek(t,END-60,END)};
  QS.gal.rotation.y=t*0.00035;QS.stars.rotation.y=t*0.00008;
  // старец проявляется
  if(t>=150&&t<=240){qOldFade(ek(t,150,235));if(t%3===0){o.root.getWorldPosition(_q1);sparkA(_q1.x+rnd(-.4,.4),_q1.y+rnd(0.2,1.7),_q1.z+rnd(-.4,.4),2,[1.2,1.5,2.4],2)}}
  if(t===150){SFX.bell&&SFX.bell();SFX.soul&&SFX.soul()}
  const cur=LN.findIndex(l=>t>=l.a&&t<=l.b),spk=cur>=0&&LN[cur].n==='Старец';
  qOldAnim(t,spk,{raise:t>=at(10)&&t<at(12)+120?ek(t,at(10),at(10)+60)*(1-ek(t,at(12)+60,at(12)+120)):0,glow:t>=at(11)&&t<at(12)?1:0,nod:cur===7?0.1:0});
  for(const [i,l] of LN.entries())if(t===l.a){tpSay(l.n,l.t,l.a,l.b);if(l.n==='Старец')tpVoice(l.t)}
  if(t===30)tpSay('Акира','…Где я? Звёзды… подо мной?',30,140,{mid:1});
  // камера
  if(t<300){const k=ek(t,0,300),an=lerp(0.9,0.25,k),r=lerp(9,5.5,k);cam([hx+Math.sin(yaw+an)*r,gy+lerp(4.5,2.2,k),hz+Math.cos(yaw+an)*r],[hx+fx*1.2,gy+lerp(-1.5,1.0,k),hz+fz*1.2])}
  else if(cur>=0||t<END){const i=Math.max(0,cur>=0?cur:LN.findIndex(l=>t<l.a)-1),sh=i===10||i===11||i===12?'wide':LN[i].n==='Старец'?(i%2?'oldC':'old'):'hero';
   if(i>=8&&i<=9)cam(L(1.8,1.45,-1.1),L(-0.2,1.15,0.9));
   else if(i===10){const k=ek(t,at(10),LN[10].b);cam(L(3.4,1.5,1.25),L(0,1.25,1.25),k,L(2.6,1.7,2.0),L(0,1.4,2.1))}
   else if(i===11)cam(L(-0.9,1.7,0.6),L(0,1.55,2.6));
   else if(i===12){const k=ek(t,at(12),LN[12].b);cam(L(1.4,1.25,1.5),L(0,0.95,0.2),k,L(1.1,1.1,1.1),L(0,0.95,0))}
   else if(sh==='old')cam(L(-0.75,1.72,-1.4),L(0,1.5,2.5));else if(sh==='oldC')cam(L(-0.35,1.62,0.9),L(0,1.58,2.5));else cam(L(0.7,1.68,3.9),L(0,1.45,0))}
  P.csLook=cur===3||cur===6?Math.sin(t*0.05)*0.25:0;
  // 1) обнажить старые клинки
  if(t===at(8)+50){P.state='draw';P.t=0;P.drawSpd=1;SFX.draw&&SFX.draw(true)}
  // 2) клинки улетают к Старцу и рассыпаются пеплом
  if(t===at(10)+40){for(const s of['R','L']){const w=hero.arms[s].sw;w.updateMatrixWorld(true);fly[s]={p:new THREE.Vector3().setFromMatrixPosition(w.matrixWorld),q:new THREE.Quaternion().setFromRotationMatrix(w.matrixWorld)}}SFX.warp&&SFX.warp()}
  const T0=at(10)+40,T1=T0+110,T2=LN[10].b;
  if(t>=T0&&t<at(11)){P.csPost=()=>{o.orb.getWorldPosition(_q2);for(const [k,s] of[[0,'R'],[1,'L']]){const w=hero.arms[s].sw,F=fly[s];if(!F)continue;const u=ek(t,T0,T1);_q1.set(_q2.x+(k?-0.45:0.45)*Math.cos(yaw),_q2.y+0.5+Math.sin(t*0.05+k)*0.04,_q2.z-(k?-0.45:0.45)*Math.sin(yaw));
     w.position.lerpVectors(F.p,_q1,u);_qQ.setFromEuler(new THREE.Euler(-Math.PI/2,0,0));w.quaternion.copy(F.q).slerp(_qQ,u);const sh=t>T1?Math.min(1,(t-T1)/(T2-T1)):0;w.scale.setScalar(Math.max(0.001,1-ek(t,T2-40,T2)));
     if(sh>0){w.position.x+=rnd(-1,1)*0.01*sh;w.position.y+=rnd(-1,1)*0.01*sh;if(t%2===0)fxA(FX.norm,{x:w.position.x+rnd(-.05,.05),y:w.position.y+rnd(-0.4,0.4),z:w.position.z+rnd(-.05,.05),vx:rnd(-.3,.3)/60,vy:-rnd(0.1,0.5)/60,vz:rnd(-.3,.3)/60,life:rnd(60,110),s:rnd(0.02,0.05),r:0.25,gg:0.24,b:0.23,a:0.9},0)}
     w.visible=t<T2;w.updateMatrixWorld(true)}}}
  if(t===T2){SFX.soul&&SFX.soul();P.drawn=false;QS.vis={R:false,L:false}}
  // 3) новые клинки рождаются в шаре Старца и ложатся в ножны героя
  if(t===at(11)){SFX.bell&&SFX.bell();o.orb.getWorldPosition(_q1);flashA(_q1.x,_q1.y,_q1.z,0xe0e8ff,12,40);sparkA(_q1.x,_q1.y,_q1.z,50,[1.6,1.8,2.6],5);
   nbEquip(true);if(hero.saya)hero.saya.forEach(g=>g.visible=false);disp=['SW_N1','SW_N2'].map(p=>{const s=makeSword(0.78,null,false,p);QS.g.add(s);s.userData.tip0=1;return s});QS.disp=disp}
  if(disp&&t>=at(11)){o.orb.getWorldPosition(_q2);const F0=at(12),F1=at(12)+120;
   P.csPost=()=>{for(const [k,s] of[[0,'R'],[1,'L']]){const d=disp[k],w=hero.arms[s].sw;w.visible=t>=F1;d.visible=t<F1;if(t>=F1)continue;
    _q1.set(_q2.x+(k?-0.4:0.4)*Math.cos(yaw),_q2.y+0.35+Math.sin(t*0.04+k*2)*0.05,_q2.z-(k?-0.4:0.4)*Math.sin(yaw));_qQ.setFromEuler(new THREE.Euler(-Math.PI/2+0.2*Math.sin(t*0.02+k),t*0.01*(k?-1:1),0));
    if(t<F0){d.position.copy(_q1);d.quaternion.copy(_qQ)}else{w.updateMatrixWorld(true);_q3.setFromMatrixPosition(w.matrixWorld);const u=ek(t,F0,F1),q2=new THREE.Quaternion().setFromRotationMatrix(w.matrixWorld);d.position.lerpVectors(_q1,_q3,u);d.position.y+=Math.sin(u*Math.PI)*0.35;d.quaternion.copy(_qQ).slerp(q2,u)}
    if(t%3===k){const c=NB_C[s];fxA(FX.add,{x:d.position.x+rnd(-.05,.05),y:d.position.y+rnd(-.3,.3),z:d.position.z+rnd(-.05,.05),vx:0,vy:0.002,vz:0,life:30,s:0.04,r:c[0],gg:c[1],b:c[2]},0)}}}
   if(t===F1){if(hero.saya)hero.saya.forEach(g=>g.visible=true);SFX.draw&&SFX.draw(false);for(const s of['R','L']){hero.arms[s].sw.getWorldPosition(_q1);flashA(_q1.x,_q1.y,_q1.z,s==='R'?0xffb070:0x9a80ff,8,24);sparkA(_q1.x,_q1.y,_q1.z,24,NB_S[s].map(v=>v*2),4)}}}
  if(t===at(13))P.csPose={p:POSE.inspect||POSE.rest,w:0.6};if(t===at(14))P.csPose=null;
  if(t>=END)go()},()=>{go()})}
// ---------- катсцена: пробуждение в PS1-локации
function psWakeCS(){const S=V8D.spawn;TP.nar=[];TP.ov={c:'255,255,255',a:1};TP.lid=0;P.x=S[0];P.z=S[1];P.yaw=0;P._pk=null;psClamp(P);GY=psGround(P);P.drawn=false;P.state='idle';
 hero.arms.R.sw.visible=true;P.hideL=false;const fx=0,fz=1;
 const fin=()=>{P.csRx=0;P.y=0;TP.lid=1;TP.ov=null;TP.nar=[];P.csPose=null;P.csClip=null;P.drawn=true;P.state='idle';G.card={t:0,title:'ГЛАВА 9',name:'Пробуждение'};PS.started=false;PS.waveT=0;
  csEnd([['Юки','ЛКМ — цепь Акэбоно (4-й удар — прыжок с волной), ПКМ — Ёиями: укол и подброс, ЛКМ+ПКМ — Крест.'],['Юки','F — Полумесяц, G — Вихрь, V — Шаг тени, R при полной шкале Они — «Два Неба».']])};
 csStart('tpWake',t=>{const H=CS.H;CS.bars=1;P.csHide=false;const gy=GY;
  if(t<=3){P.csRx=-1.52;P.y=0.13;P.csPose={p:POSE.rest,w:1};P.csLook=0}
  TP.ov={c:t<30?'255,255,255':'0,0,0',a:t<30?1-ek(t,0,28):0};if(t<30)TP.ov={c:'255,255,255',a:1-ek(t,0,28)};
  TP.lid=t<40?0:t<70?0.35*ek(t,40,70):t<88?0.35*(1-ek(t,74,88)):t<128?0.75*ek(t,92,128):t<140?0.75-0.45*ek(t,130,140):Math.min(1,0.3+0.7*ek(t,144,176));
  if(t===8)tpSay('Старец','…Рыба не знает, что плывёт в воде…',8,100,{mid:1,dark:1});
  if(t===104)tpSay('Старец','…А теперь — проснись.',104,180,{mid:1,dark:1});
  if(t===34||t===80)SFX.heart&&SFX.heart();
  const hx=P.x-fx*1.72,hz=P.z-fz*1.72;
  if(t<190){const k=ek(t,110,175);cam([hx,gy+0.46,hz],[hx+lerp(0.4,1.2,k),gy+lerp(8,4,k),hz+lerp(0.8,2.6,k)])}
  if(t===190)TP.lid=1;
  if(t>=190&&t<310){cam([P.x+2.6,gy+0.85,P.z-0.6],[P.x+0.2,gy+0.5,P.z-0.8],ek(t,190,300),[P.x+2.4,gy+1.4,P.z+0.6],[P.x,gy+1.0,P.z]);
   const k=ek(t,205,262);P.csRx=-1.52*(1-k);P.y=0.13*(1-k);P.csPose={p:POSE.kneel,w:t<262?1:1-ek(t,262,305)};if(t<205)P.csPose={p:POSE.rest,w:1}}
  if(t===215)csSay('Акира','…Старик? Рыба… луна в пруду…',215,300);
  if(t===306){P.csPose=null;P.csRx=0;P.y=0;H.yaw=Math.PI;H.yawK=0.04}
  if(t>=306&&t<430){const k=ek(t,306,425);cam([P.x-1.6,gy+1.7,P.z+2.2],[P.x+0.4,gy+1.6,P.z-4],k,[P.x-2.2,gy+2.4,P.z+1.0],[P.x+1,gy+2.0,P.z-8]);P.csLook=Math.sin((t-306)*0.03)*0.5}
  if(t===316)csSay('Акира','Где я?.. Это не храм. Свет… вода… дерево посреди зала.',316,425);
  if(t>=430&&t<520){P.csLook=lerp(P.csLook||0,0,0.1);P.csPose={p:POSE.inspect||POSE.rest,w:0.5*ek(t,430,460)};cam([P.x+0.9,gy+1.25,P.z-1.1],[P.x,gy+0.92,P.z],ek(t,430,515),[P.x+0.7,gy+1.1,P.z-0.9],[P.x+0.05,gy+0.9,P.z])}
  if(t===436)csSay('Акира','На поясе… его катаны. Значит, это был не сон.',436,515);
  if(t===520){P.csPose=null;P.state='draw';P.t=0;P.drawSpd=1;SFX.draw&&SFX.draw(true)}
  if(t>=520&&t<565)cam([P.x-1.2,gy+1.5,P.z-2.4],[P.x,gy+1.2,P.z]);
  // осмотр (клип AK): правая перед лицом -> поворот -> левая поперёк -> накрест
  if(t>=565&&t<940){const u=t-565;P.drawn=true;P.state='idle';P.csClip={n:'AK',t:Math.min(u,369),w:u<340?1:1-ek(u,340,370)};
   const R=hero.arms.R.sw,Lw=hero.arms.L.sw;
   if(u<160){R.userData.tip.getWorldPosition(_q1);cam([P.x+0.25,gy+1.5,P.z-1.25],[_q1.x*0.5+P.x*0.5,gy+1.55,_q1.z*0.5+P.z*0.5],ek(u,0,150),[P.x-0.15,gy+1.55,P.z-1.1],[P.x,gy+1.6,P.z])}
   else if(u<280){cam([P.x-0.55,gy+1.35,P.z-1.05],[P.x+0.05,gy+1.32,P.z-0.2],ek(u,160,270),[P.x-0.25,gy+1.3,P.z-1.2],[P.x,gy+1.3,P.z-0.2])}
   else cam([P.x+0.2,gy+1.45,P.z-2.1],[P.x,gy+1.3,P.z],ek(u,280,370),[P.x+1.2,gy+1.6,P.z-2.6],[P.x,gy+1.2,P.z]);
   if(u%2===0)for(const [s,w] of[['R',R],['L',Lw]]){const a=w.userData.base,b=w.userData.tip;a.getWorldPosition(_q1);b.getWorldPosition(_q2);const k=Math.random();_q1.lerp(_q2,k);if((s==='R'&&u<180)||(s==='L'&&u>=150&&u<300)||u>=280)fxA(FX.add,{x:_q1.x,y:_q1.y,z:_q1.z,vx:0,vy:0.003,vz:0,life:30,s:0.03,r:NB_C[s][0],gg:NB_C[s][1],b:NB_C[s][2]},0)}
   if(u===40){SFX.bell&&SFX.bell();R.userData.tip.getWorldPosition(_q1);flashA(_q1.x,_q1.y,_q1.z,0xffb070,5,30)}if(u===190){Lw.userData.tip.getWorldPosition(_q1);flashA(_q1.x,_q1.y,_q1.z,0x9a80ff,5,30)}}
  if(t===585)csSay('Акира','Акэбоно… тёплая, как рассвет.',585,700);
  if(t===725)csSay('Акира','Ёиями… холодная, как ночь между мирами.',725,840);
  if(t===850)G.card={t:0,title:'НОВЫЕ КАТАНЫ',name:'Акэбоно и Ёиями'};
  if(t>=940){P.csClip=null;cam([P.x-1.8,gy+1.9,P.z+2.6],[P.x+0.5,gy+1.3,P.z-2],ek(t,940,1080),[P.x-2.4,gy+2.3,P.z+1.6],[P.x+0.6,gy+1.4,P.z-4])}
  if(t===950)csSay('Юки','Акира! Ты очнулся… Тише. Здесь что-то есть. Тени шевелятся.',950,1075);
  if(t>=1085)fin()},fin)}
// ---------- финал главы
function psClearCS(){if(PS.cs)return;PS.cs=1;if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1;SFX.draw&&SFX.draw(false)}
 const end=()=>{if(PS.cs!==1)return;PS.cs=2;csEnd();w0DoorCS()};
 csStart('tpClear',t=>{CS.bars=1;const gy=GY,an=0.6+t*0.0016;const T={x:P.x,y:gy+1.3,z:P.z},C={x:P.x+Math.sin(an)*4.2,y:gy+2.0,z:P.z+Math.cos(an)*4.2};psCam(T,C);cam([C.x,C.y,C.z],[P.x,gy+1.2,P.z]);
  if(t===20)csSay('Юки','Тихо… Тени ушли. Ты справился, Акира.',20,140);
  if(t===150)csSay('Акира','Старик говорил о рыбе и воде. Кажется, я начинаю понимать…',150,290);
  if(t===300)csSay('Юки','Тогда идём. Клинки зовут дальше.',300,400);
  if(t>=400)end()},end)}
// ---------- инициализация (после gB/gC: ET, ATK, M)
let Q18OK=false;function q18Init(){if(Q18OK)return;Q18OK=true;Object.assign(ET,v8Def());Object.assign(ATK,nbDefs())}
function qHook(){return{PS,QS,V8D,nav:psNav,find:psFind,clamp:psClamp,ground:psGround,cam:psCam,solid:psSolid,space:qSpaceCS,wake:psWakeCS,clear:psClearCS,equip:nbEquip,spawn:v8Spawn,wave:psSpawnWave,old:qOld}}
