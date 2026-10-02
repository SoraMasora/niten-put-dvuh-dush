// Загрузка моделей, созданных в Blender (blender/build.py -> niten_assets.glb, meshopt).
// Модели сегментированы по суставам: PREFIX__part__detail. Геометрия «запекается» в локальные координаты сустава.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export const ASSET={ok:false,parts:{},mats:{},tips:{},stats:{meshes:0,tris:0},skins:{},km:null};
// v0.10: скины внешних моделей (blender/ext -> niten_ext.glb). XS__<имя> — SkinnedMesh на 13 суставов рига игры.
export const J13=['hips','torso','neck','thighR','shinR','thighL','shinL','upperArmR','foreArmR','handR','upperArmL','foreArmL','handL'];
const UPJ=[0,1,1,0,0,0,0,1,1,1,1,1,1];
function extractSkin(o,nm){const sk=o.skeleton;o.parent.updateMatrixWorld(true);o.updateMatrixWorld(true);
 const g=o.geometry,A=g.attributes,n=A.position.count,jm=sk.bones.map(b=>J13.indexOf(b.name.replace(/_\d+$/,'')));
 const BM=sk.bones.map((b,k)=>new THREE.Matrix4().multiplyMatrices(o.matrixWorld,o.bindMatrixInverse).multiply(b.matrixWorld).multiply(sk.boneInverses[k]).multiply(o.bindMatrix));
 const NM=BM.map(m=>new THREE.Matrix3().getNormalMatrix(m));
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),si=new Uint16Array(n*4),sw=new Float32Array(n*4),v=new THREE.Vector3();
 for(let i=0;i<n;i++){v.fromBufferAttribute(A.position,i);o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld);pos.set([v.x,v.y,v.z],i*3);
  let best=0,bw=-1;for(let c=0;c<4;c++){const w=A.skinWeight.getComponent(i,c),b=A.skinIndex.getComponent(i,c);si[i*4+c]=Math.max(0,jm[b]);sw[i*4+c]=w;if(w>bw){bw=w;best=b}}
  if(A.normal){v.fromBufferAttribute(A.normal,i).applyMatrix3(NM[best]).normalize();nor.set([v.x,v.y,v.z],i*3)}}
 const base={position:new THREE.BufferAttribute(pos,3),skinWeight:new THREE.BufferAttribute(sw,4)};if(A.normal)base.normal=new THREE.BufferAttribute(nor,3);if(A.uv)base.uv=floatAttr(A.uv);if(A.color)base.color=floatAttr(A.color);
 const siA=new THREE.BufferAttribute(si,4),cu=new Uint16Array(n*4),cl=new Uint16Array(n*4);
 for(let i=0;i<n*4;i++){const j=si[i];cu[i]=UPJ[j]?j:1;cl[i]=UPJ[j]?0:j}
 const idx=g.index?g.index.array:[...Array(n).keys()],up=[],lo=[];
 for(let t=0;t<idx.length;t+=3){let u=0;for(let c=0;c<3;c++){const i=idx[t+c];for(let q=0;q<4;q++)if(UPJ[si[i*4+q]])u+=sw[i*4+q]}(u>1.5?up:lo).push(idx[t],idx[t+1],idx[t+2])}
 const mk=(ix,sa)=>{const G=new THREE.BufferGeometry();for(const k in base)G.setAttribute(k,base[k]);G.setAttribute('skinIndex',sa);G.setIndex(new THREE.BufferAttribute(new Uint32Array(ix),1));G.computeBoundingSphere();return G};
 const S=ASSET.skins[nm]=ASSET.skins[nm]||{parts:[],J:null};
 if(!S.J){S.J=J13.map(()=>new THREE.Vector3());sk.bones.forEach((b,k)=>{if(jm[k]>=0)b.getWorldPosition(S.J[jm[k]])})}
 const m=o.material;if(m&&m.name)ASSET.mats[m.name]=m;
 S.parts.push({mat:m,up:{geo:mk(up,siA),cut:mk(up,new THREE.BufferAttribute(cu,4))},lo:{geo:mk(lo,siA),cut:mk(lo,new THREE.BufferAttribute(cl,4))}});
 ASSET.stats.meshes++;ASSET.stats.tris+=idx.length/3}
const SPECIAL=/^(cape|orb|horn\d)$/;
function floatAttr(a){const n=a.count,s=a.itemSize,f=new Float32Array(n*s);for(let i=0;i<n;i++){f[i*s]=a.getX(i);if(s>1)f[i*s+1]=a.getY(i);if(s>2)f[i*s+2]=a.getZ(i);if(s>3)f[i*s+3]=a.getW(i)}return new THREE.BufferAttribute(f,s)}
function bake(mesh){const g=new THREE.BufferGeometry();for(const k of(/^PK__/.test(mesh.name)?['position','normal','uv','color']:['position','normal','uv']))if(mesh.geometry.attributes[k])g.setAttribute(k,floatAttr(mesh.geometry.attributes[k]));
 if(mesh.geometry.index)g.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.geometry.index.array),1));mesh.updateMatrix();g.applyMatrix4(mesh.matrix);
 if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.normal)g.computeVertexNormals();return g}
function b64ToBuf(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}
export async function loadAssets(){
 const src=(window.__NITEN_ASSETS_PARTS||[]).join('')||window.__NITEN_ASSETS;if(!src)return false;
 const ok=await loadGLB(src);const ls=(window.__NITEN_LOOT_PARTS||[]).join('')||window.__NITEN_LOOT;if(ok&&ls)await loadGLB(ls);const hs=(window.__NITEN_HOUSE_PARTS||[]).join('')||window.__NITEN_HOUSE;if(ok&&hs)await loadGLB(hs);const xs=(window.__NITEN_EXT_PARTS||[]).join('')||window.__NITEN_EXT;if(ok&&xs)await loadGLB(xs);const cs=(window.__NITEN_LOC_PARTS||[]).join('')||window.__NITEN_LOC;if(ok&&cs)await loadGLB(cs);const ks=(window.__NITEN_KAK_PARTS||[]).join('')||window.__NITEN_KAK;if(ok&&ks)await loadGLB(ks);const ps=(window.__NITEN_PEAK_PARTS||[]).join('')||window.__NITEN_PEAK;if(ok&&ps)await loadGLB(ps);return ok}
async function loadGLB(src){
 try{const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf=await new Promise((res,rej)=>loader.parse(b64ToBuf(src),'',res,rej));
  const groups={},skinned=[];gltf.scene.updateMatrixWorld(true);
  const km=gltf.scene.getObjectByName('KM_rig');if(km){km.parent.remove(km);km.position.set(0,0,0);km.updateMatrixWorld(true);ASSET.km={src:km,clips:gltf.animations.filter(a=>/^KM_/.test(a.name))};km.traverse(o=>{if(o.isMesh&&o.material&&o.material.name)ASSET.mats[o.material.name]=o.material})}
  gltf.scene.traverse(o=>{
   if(o.isSkinnedMesh){skinned.push(o);return}
   const t=o.name.split('__');if(t.length<2)return;const pre=t[0];
   if(t[t.length-1]==='TIP'){o.updateMatrix();ASSET.tips[t.length>2?pre+'__'+t[1]:pre]=o.position.clone();return}
   if(!o.isMesh)return;const part=t[1],det=t.slice(2).join('__')||part;
   const m=o.material;if(m&&m.name)ASSET.mats[m.name]=m;
   const sk=/^sk_/.test(det);const key=pre+'|'+(t.length>2?part:pre==='KN'||pre==='PK'?det:'_')+'|'+(SPECIAL.test(det)?det:(m?m.name:''))+(sk?'|sk':'');
   (groups[key]=groups[key]||{pre,part:t.length>2?part:det,det,mat:m,sk,list:[]}).list.push(o)});
  for(const o of skinned){let a=o;while(a&&!/^XS__/.test(a.name))a=a.parent;if(a)extractSkin(o,a.name.slice(4))}
  for(const k in groups){const gr=groups[k];let geos=gr.list.map(bake);let geo=geos.length>1?mergeGeometries(geos,false):geos[0];if(!geo){geo=geos[0]}
   if(gr.mat&&gr.mat.name==='AK_stubble'){const u=geo.attributes.uv,n=u.count,c=new Float32Array(n*4);for(let i=0;i<n;i++){const h=Math.sin(i*12.9898)*43758.5453;c.set([1,1,1,Math.min(1,1.8*Math.pow(u.getX(i),0.9)*(0.75+0.25*(h-Math.floor(h))))],i*4)}geo.setAttribute('color',new THREE.BufferAttribute(c,4))}
   ASSET.stats.meshes++;ASSET.stats.tris+=(geo.index?geo.index.count:geo.attributes.position.count)/3;
   const P=ASSET.parts[gr.pre]=ASSET.parts[gr.pre]||{};(P[gr.part]=P[gr.part]||[]).push({geo,mat:gr.mat,det:SPECIAL.test(gr.det)?gr.det:'',sk:gr.sk,name:gr.list[0].name})}
  const st=ASSET.mats.AK_stubble;if(st){st.map=null;st.vertexColors=true;st.transparent=true;st.opacity=0.95;st.depthWrite=false;st.polygonOffset=true;st.polygonOffsetFactor=-2;st.side=THREE.DoubleSide;st.needsUpdate=true}
  for(const m of Object.values(ASSET.mats)){m.envMapIntensity=1.0;if(m.emissive&&m.emissiveIntensity>4){m.toneMapped=false}}
  ASSET.ok=true;console.log('NITEN assets:',ASSET.stats);return true}catch(e){console.warn('assets failed',e);return false}}
// Добавить все меши части `part` префикса `pre` в группу. opt.mat(m) — подмена материала; возвращает {all, special:{det:mesh}}
export function addPart(group,pre,part,opt={}){const L=(ASSET.parts[pre]||{})[part]||[];const out={all:[],special:{}};
 for(const it of L){let geo=it.geo,mesh;const mat=opt.mat?opt.mat(it.mat):it.mat;
  if(it.det){geo=geo.clone();geo.computeBoundingBox();const c=new THREE.Vector3();
   if(it.det==='cape')c.set(0,0.6,0.02);else geo.boundingBox.getCenter(c);geo.translate(-c.x,-c.y,-c.z);mesh=new THREE.Mesh(geo,mat);mesh.position.copy(c);out.special[it.det]=mesh}
  else if(it.sk){mesh=new THREE.SkinnedMesh(geo,mat);mesh.frustumCulled=false;(out.skin=out.skin||[]).push(mesh)}
  else mesh=new THREE.Mesh(geo,mat);
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);out.all.push(mesh)}
 return out}
export function hasPart(pre,part){return !!((ASSET.parts[pre]||{})[part])}
