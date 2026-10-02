// v0.12: локации из внешних моделей (blender/ext/locs.py -> niten_loc.glb, меши LV__<лок>__i) и навигация по nav-сеткам (gN.js).
// Земля арен выровнена в Blender до y=0; проходимость — запечённая сетка (клетка 0.4 м, отступ 0.42 м от препятствий, одна связная область).
const LOCN={ash:'village',forest:'sagano',duel:'scifi'};
const LAYOUT={
 ash:{gate:[-5,6],fires:[[-3,3.37,14.5],[-7.5,3.39,-11],[5,3.5,-16]],embers:[[-6,-4],[12,-6],[-9,2],[2,6],[-12,-2],[14,-12]]},
 forest:{gate:[0,16],lamps:[[-5.4,-10],[5.4,6],[-5.4,12],[5.4,-4]],shrine:[-7.4,-3.5]},
 duel:{gate:[0,16]}};
function LVok(n){return !!(ASSET.ok&&ASSET.parts.LV&&ASSET.parts.LV[n])}
const LOCLIT={sagano:1.9,village:1.05,scifi:1.0,manor:1.15,portal:1.2};
function locAdd(g,n,cast=true){const grp=new Group();g.add(grp);const r=addPart(grp,'LV',n);for(const m of r.all){m.castShadow=cast;m.receiveShadow=true;const mt=m.material;
  if(mt&&!mt.userData.lv){mt.userData.lv=1;if(!mt.metalnessMap)mt.metalness=0;mt.roughness=Math.max(mt.roughness??1,0.55);mt.envMapIntensity=0.6;if(mt.color)mt.color.multiplyScalar(LOCLIT[n]||1)}}return grp}
function navOf(n){const D=NAVD[n];if(!D)return null;if(!D.g){const b=atob(D.b),N=D.w*D.h,g=new Uint8Array(N);for(let k=0;k<N;k++)g[k]=(b.charCodeAt(k>>3)>>(7-(k&7)))&1;D.g=g;D.dist=new Int32Array(N).fill(-1);D.q=new Int32Array(N);D.pc=-1;D.ft=-99}return D}
function navFree(x,z){const N=LV&&LV.env&&LV.env.nav;if(!N)return true;const i=Math.floor((x-N.x0)/N.cs),j=Math.floor((z-N.z0)/N.cs);return i>=0&&j>=0&&i<N.w&&j<N.h&&N.g[j*N.w+i]===1}
function navClear(x,z,r){return navFree(x,z)&&navFree(x+r,z)&&navFree(x-r,z)&&navFree(x,z+r)&&navFree(x,z-r)}
function navNearest(x,z){const N=LV.env.nav,i0=Math.floor((x-N.x0)/N.cs),j0=Math.floor((z-N.z0)/N.cs);let best=null,bd=1e9;
 for(let r=0;r<80&&!best;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=i0+di,j=j0+dj;
  if(i>=0&&j>=0&&i<N.w&&j<N.h&&N.g[j*N.w+i]){const d=di*di+dj*dj;if(d<bd){bd=d;best=[N.x0+(i+.5)*N.cs,N.z0+(j+.5)*N.cs]}}}
 return best||[0,-12]}
// столкновение с непроходимыми клетками: скольжение по осям, при телепорте/застревании — ближайшая свободная клетка
function navClamp(o){if(navFree(o.x,o.z)){o._nx=o.x;o._nz=o.z;return}
 const px=o._nx,pz=o._nz;
 if(px===undefined||Math.abs(o.x-px)+Math.abs(o.z-pz)>2.5||!navFree(px,pz)){const q=navNearest(o.x,o.z);o.x=q[0];o.z=q[1]}
 else if(navFree(o.x,pz))o.z=pz;else if(navFree(px,o.z))o.x=px;else{o.x=px;o.z=pz}
 o._nx=o.x;o._nz=o.z;if(o.vx!==undefined){o.vx*=0.5;o.vz*=0.5}}
function navLOS(x0,z0,x1,z1){const N=LV.env.nav;if(!N)return true;const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/(N.cs*0.5));for(let k=1;k<n;k++){const t=k/n;if(!navFree(x0+(x1-x0)*t,z0+(z1-z0)*t))return false}return true}
// поле расстояний (BFS) от клетки игрока: враги без прямой видимости идут по нему в обход домов/заборов
function navFlow(N){const i=Math.floor((P.x-N.x0)/N.cs),j=Math.floor((P.z-N.z0)/N.cs);if(i<0||j<0||i>=N.w||j>=N.h)return;const c=j*N.w+i;if(c===N.pc&&G.frame-N.ft<30)return;N.pc=c;N.ft=G.frame;
 const D=N.dist,Q=N.q,W=N.w;D.fill(-1);let h=0,t=0;Q[t++]=c;D[c]=0;
 while(h<t){const k=Q[h++],ki=k%W,dv=D[k]+1;
  if(ki>0&&N.g[k-1]&&D[k-1]<0){D[k-1]=dv;Q[t++]=k-1}
  if(ki<W-1&&N.g[k+1]&&D[k+1]<0){D[k+1]=dv;Q[t++]=k+1}
  if(k>=W&&N.g[k-W]&&D[k-W]<0){D[k-W]=dv;Q[t++]=k-W}
  if(k+W<D.length&&N.g[k+W]&&D[k+W]<0){D[k+W]=dv;Q[t++]=k+W}}}
const NB8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function navSteer(e){const N=LV&&LV.env&&LV.env.nav;if(!N||navLOS(e.x,e.z,P.x,P.z))return null;navFlow(N);const W=N.w;
 const i=Math.floor((e.x-N.x0)/N.cs),j=Math.floor((e.z-N.z0)/N.cs);if(i<0||j<0||i>=W||j>=N.h)return null;let k=j*W+i;if(N.dist[k]<0)return null;
 const cx=k=>N.x0+(k%W+.5)*N.cs,cz=k=>N.z0+(((k/W)|0)+.5)*N.cs;let tgt=-1;
 for(let s=0;s<10;s++){let best=k,bd=N.dist[k];const ki=k%W,kj=(k/W)|0;
  for(const[di,dj]of NB8){const a=ki+di,b=kj+dj;if(a<0||b<0||a>=W||b>=N.h)continue;const kk=b*W+a;if(N.dist[kk]<0||N.dist[kk]>=bd)continue;if(di&&dj&&(!N.g[kj*W+a]||!N.g[b*W+ki]))continue;best=kk;bd=N.dist[kk]}
  if(best===k)break;k=best;if(tgt<0||navLOS(e.x,e.z,cx(k),cz(k)))tgt=k;else break}
 if(tgt<0)return null;const dx=cx(tgt)-e.x,dz=cz(tgt)-e.z,l=Math.hypot(dx,dz);return l>1e-3?[dx/l,dz/l]:null}
// точка появления врага: свободная клетка с запасом, в секторе обзора камеры, с прямой видимостью до игрока, не вплотную к другим
function navSpawn(t,i,used){const rr=t==='yumi'?[11,14]:t==='sota'?[7,7.5]:[8,11];
 for(let pass=0;pass<4;pass++)for(let k=0;k<50;k++){const sp=[0.9,1.3,2.0,Math.PI][pass],a=G.camYaw+rnd(-sp,sp)+(pass<2?(i%2?0.3:-0.3):0),r=rnd(rr[0]*(pass>1?0.55:1),rr[1]);
  const x=P.x+Math.sin(a)*r,z=P.z+Math.cos(a)*r;if(!navClear(x,z,0.6))continue;if(pass<3&&!navLOS(P.x,P.z,x,z))continue;if(used.some(u=>Math.hypot(u[0]-x,u[1]-z)<1.6))continue;used.push([x,z]);return[x,z]}
 const q=navNearest(P.x+Math.sin(G.camYaw)*8,P.z+Math.cos(G.camYaw)*8);used.push(q);return q}
// кольцо портала (magic_portal.glb): центр проёма на высоте 1.75, внутренний радиус ~1.43
const PORTAL_R=1.36;
function portalRing(g,x,z,ry=0){const r=new Group();r.position.set(x,0,z);r.rotation.y=ry;g.add(r);addPart(r,'LV','portal');r.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});return r}
// «Забытый дом» снаружи: усадьба (дверной проём 2.2×2.52 м, пол 0.62, дверь z=HX.door) + ступени под stepY + раздвижные створки
const MSTEP=[[-26.75,-27.47,0.21],[-27.47,-28.19,0.42]];
function manorExt(g,env){if(ASSET.mats.ho_shoji_lit)ASSET.mats.ho_shoji_lit.emissiveIntensity=0.5;locAdd(g,'manor');const D=HX.door;
 const sm=ASSET.mats.ho_wood||ASSET.mats.ev_wood||M.wood;for(const[z0,z1,h]of MSTEP){const s=new Mesh(new THREE.BoxGeometry(3.0,h,z0-z1),sm);s.position.set(0,h/2,(z0+z1)/2);s.castShadow=s.receiveShadow=true;g.add(s)}
 const dL=hp(g,'extdoorL',-0.55,0.62,D-0.04,0,[0.917,1.005,1]),dR=hp(g,'extdoorR',0.55,0.62,D-0.04,0,[0.917,1.005,1]);
 const glow=new Mesh(new THREE.PlaneGeometry(2.4,2.8),new MB({map:TX.dot,color:0xffb060,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.position.set(0,2.0,D+0.3);g.add(glow);
 const inner=new Mesh(new THREE.PlaneGeometry(2.2,2.52),new MB({color:0x7a5236}));inner.position.set(0,1.88,D-0.2);inner.visible=false;g.add(inner);
 env.hdoor={L:dL,R:dR,glow,inner,open:0,hw:0.55};env.hlamps=[[-1.9,3.2,D+1.2],[1.9,3.2,D+1.2]]}
// камера не уходит в дома/стены: марш от цели к камере по высотам (ht — верх геометрии, hl — низ навеса над проходимой клеткой)
function navHB(N){if(!N.Ht&&N.ht){const f=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);return u};N.Ht=f(N.ht);N.Hl=f(N.hl)}return N.Ht}
let navTm=1;
function navCam(T,C){const N=LV.env.nav;if(!N||!navHB(N))return;const dx=C.x-T.x,dy=C.y-T.y,dz=C.z-T.z,L=Math.hypot(dx,dz);if(L<0.3)return;const n=Math.ceil(L/(N.cs*0.5));let tm=1;
 for(let k=2;k<=n;k++){const t=k/n,x=T.x+dx*t,z=T.z+dz*t,y=T.y+dy*t,i=Math.floor((x-N.x0)/N.cs),j=Math.floor((z-N.z0)/N.cs);if(i<0||j<0||i>=N.w||j>=N.h)break;const c=j*N.w+i,ht=N.Ht[c]*0.1;
  const bl=N.g[c]?(N.Hl[c]<255&&y>N.Hl[c]*0.1-0.35&&y<ht+0.3):ht>y-0.3;if(bl){tm=Math.max(0.1,t-0.6/L);break}}
 navTm=tm<navTm?lerp(navTm,tm,0.5):lerp(navTm,tm,0.06);C.x=T.x+dx*navTm;C.y=T.y+dy*navTm;C.z=T.z+dz*navTm}
