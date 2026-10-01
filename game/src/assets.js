// Загрузка моделей, созданных в Blender (blender/build.py -> niten_assets.glb, meshopt).
// Модели сегментированы по суставам: PREFIX__part__detail. Геометрия «запекается» в локальные координаты сустава.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export const ASSET={ok:false,parts:{},mats:{},tips:{},stats:{meshes:0,tris:0}};
const SPECIAL=/^(cape|orb|horn\d)$/;
function floatAttr(a){const n=a.count,s=a.itemSize,f=new Float32Array(n*s);for(let i=0;i<n;i++){f[i*s]=a.getX(i);if(s>1)f[i*s+1]=a.getY(i);if(s>2)f[i*s+2]=a.getZ(i);if(s>3)f[i*s+3]=a.getW(i)}return new THREE.BufferAttribute(f,s)}
function bake(mesh){const g=new THREE.BufferGeometry();for(const k of['position','normal','uv'])if(mesh.geometry.attributes[k])g.setAttribute(k,floatAttr(mesh.geometry.attributes[k]));
 if(mesh.geometry.index)g.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.geometry.index.array),1));mesh.updateMatrix();g.applyMatrix4(mesh.matrix);
 if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.normal)g.computeVertexNormals();return g}
function b64ToBuf(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}
export async function loadAssets(){
 const src=(window.__NITEN_ASSETS_PARTS||[]).join('')||window.__NITEN_ASSETS;if(!src)return false;
 try{const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf=await new Promise((res,rej)=>loader.parse(b64ToBuf(src),'',res,rej));
  const groups={};gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{
   const t=o.name.split('__');if(t.length<2)return;const pre=t[0];
   if(t[t.length-1]==='TIP'){o.updateMatrix();ASSET.tips[t.length>2?pre+'__'+t[1]:pre]=o.position.clone();return}
   if(!o.isMesh)return;const part=t[1],det=t.slice(2).join('__')||part;
   const m=o.material;if(m&&m.name)ASSET.mats[m.name]=m;
   const sk=/^sk_/.test(det);const key=pre+'|'+(t.length>2?part:'_')+'|'+(SPECIAL.test(det)?det:(m?m.name:''))+(sk?'|sk':'');
   (groups[key]=groups[key]||{pre,part:t.length>2?part:det,det,mat:m,sk,list:[]}).list.push(o)});
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
