import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {initMats,M,mesh,makeHuman,makeSword,POSE,mixPose,applyPose,ASSET} from './models.js';
import {loadAssets,addPart} from './assets.js';
await loadAssets();
import {audioInit,SFX} from './audio.js';
const {Group,Mesh,MeshStandardMaterial:MS,MeshBasicMaterial:MB,Vector3:V3}=THREE;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};
const turn=(a,b,s)=>a+clamp(angDiff(a,b),-s,s);
const W=1280,H=720;
// ---------- renderer
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
document.body.appendChild(renderer.domElement);
const hud=document.createElement('canvas');hud.width=W;hud.height=H;hud.id='hud';document.body.appendChild(hud);const X=hud.getContext('2d');
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(55,16/9,0.1,300);
initMats();if(ASSET.ok&&ASSET.mats.blade_steel){M.blade=ASSET.mats.blade_steel}
{const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;scene.environmentIntensity=0.35}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(W/2,H/2),0.9,0.5,0.82);composer.addPass(bloom);composer.addPass(new OutputPass());
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
 const s=Math.min(w/W,h/H);hud.style.width=W*s+'px';hud.style.height=H*s+'px';PU.scale.value=h/(2*Math.tan(camera.fov*Math.PI/360))}
// ---------- lights
const hemi=new THREE.HemisphereLight(0x8090a0,0x201810,0.6);scene.add(hemi);
const moon=new THREE.DirectionalLight(0xaabbdd,1.2);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:80});moon.shadow.bias=-0.0005;scene.add(moon);scene.add(moon.target);
const PL=[];for(let i=0;i<9;i++){const l=new THREE.PointLight(0xff8840,0,14,1.6);scene.add(l);PL.push(l)}
const STATIC=PL.slice(0,5),DYN=PL.slice(5);
// ---------- textures
function canvasTex(w,h,fn,rep=1){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.colorSpace=THREE.SRGBColorSpace;return t}
const TX={
 dirt:canvasTex(512,512,(g,w,h)=>{g.fillStyle='#3a332c';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=40+Math.random()*50|0;g.fillStyle=`rgba(${v},${v*0.9|0},${v*0.8|0},0.35)`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*4,1+Math.random()*3)}for(let i=0;i<60;i++){g.fillStyle='rgba(10,8,6,0.25)';g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*40,5+Math.random()*15,Math.random()*3,0,7);g.fill()}},14),
 moss:canvasTex(512,512,(g,w,h)=>{g.fillStyle='#1e2a20';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=Math.random();g.fillStyle=v<0.5?`rgba(40,70,40,0.4)`:`rgba(60,50,35,0.35)`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*4,1+Math.random()*4)}},14),
 stone:canvasTex(512,512,(g,w,h)=>{g.fillStyle='#24262c';g.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=30+Math.random()*16|0;g.fillStyle=`rgb(${v},${v+2},${v+6})`;g.fillRect(x*64+2+(y%2)*32,y*64+2,60,60)}g.fillStyle='rgba(0,0,0,0.4)';for(let i=0;i<3000;i++)g.fillRect(Math.random()*w,Math.random()*h,1,1)},10),
 dot:canvasTex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.35,'rgba(255,255,255,0.7)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)}),
 star:canvasTex(128,128,(g)=>{g.translate(64,64);const r=g.createRadialGradient(0,0,0,0,0,20);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(-64,-64,128,128);g.fillStyle='#fff';for(let i=0;i<4;i++){g.rotate(Math.PI/2);g.beginPath();g.moveTo(-3,0);g.lineTo(0,-62);g.lineTo(3,0);g.fill()}}),
 flame:canvasTex(64,128,(g)=>{const r=g.createRadialGradient(32,96,2,32,80,60);r.addColorStop(0,'rgba(255,240,200,1)');r.addColorStop(0.3,'rgba(255,150,40,0.9)');r.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=r;g.beginPath();g.moveTo(32,0);g.quadraticCurveTo(64,70,52,110);g.quadraticCurveTo(32,128,12,110);g.quadraticCurveTo(0,70,32,0);g.fill()})
};
TX.dot.repeat.set(1,1);TX.star.repeat.set(1,1);TX.flame.repeat.set(1,1);
// ---------- particles
const PU={map:{value:TX.dot},scale:{value:600}};
const PVS=`attribute float size;attribute vec4 col;varying vec4 vC;uniform float scale;void main(){vC=col;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/-mv.z;gl_Position=projectionMatrix*mv;}`;
const PFS=`uniform sampler2D map;varying vec4 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);float a=vC.a*t.a;if(a<0.01)discard;gl_FragColor=vec4(vC.rgb*(1.0+t.r*0.0),a);}`;
class PSys{constructor(n,additive){this.n=n;this.list=[];const g=new THREE.BufferGeometry();this.pos=new Float32Array(n*3);this.col=new Float32Array(n*4);this.size=new Float32Array(n);
 g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));g.setAttribute('col',new THREE.BufferAttribute(this.col,4));g.setAttribute('size',new THREE.BufferAttribute(this.size,1));
 this.mat=new THREE.ShaderMaterial({uniforms:PU,vertexShader:PVS,fragmentShader:PFS,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
 this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;scene.add(this.pts);this.g=g}
 add(p){if(this.list.length>=this.n)this.list.shift();p.max=p.max||p.life;this.list.push(p)}
 update(ts){const L=this.list;let j=0;for(let i=0;i<L.length;i++){const p=L[i];p.life-=ts;if(p.life<=0)continue;
  p.vy-=(p.g||0)*ts;p.vx*=p.drag||1;p.vz*=p.drag||1;p.vy*=p.drag||1;p.x+=p.vx*ts;p.y+=p.vy*ts;p.z+=p.vz*ts;
  if(p.y<0.02&&p.g){p.y=0.02;if(p.stick){p.vx=p.vz=p.vy=0;p.g=0}else{p.vy*=-0.35;p.vx*=0.6;p.vz*=0.6}}
  L[j++]=p}L.length=j;
  for(let i=0;i<this.n;i++){if(i<L.length){const p=L[i],a=clamp(p.life/p.max,0,1);this.pos[i*3]=p.x;this.pos[i*3+1]=p.y;this.pos[i*3+2]=p.z;
   const f=p.fade===false?1:a;this.col[i*4]=p.r;this.col[i*4+1]=p.gg;this.col[i*4+2]=p.b;this.col[i*4+3]=(p.a==null?1:p.a)*f;this.size[i]=p.s*(p.grow?1+(1-a)*p.grow:1)}else{this.size[i]=0;this.col[i*4+3]=0}}
  this.g.attributes.position.needsUpdate=true;this.g.attributes.col.needsUpdate=true;this.g.attributes.size.needsUpdate=true}}
const FX={add:new PSys(2500,true),norm:new PSys(2000,false)};
function sparks(x,y,z,n,col=[1,0.6,0.25]){for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),e=rnd(-0.2,1.2),v=rnd(2,9);FX.add.add({x,y,z,vx:Math.cos(a)*Math.cos(e)*v/60,vy:Math.sin(e)*v/60,vz:Math.sin(a)*Math.cos(e)*v/60,g:0.003,life:rnd(30,70),s:rnd(0.03,0.07),r:col[0]*2,gg:col[1]*2,b:col[2]*2,drag:0.985})}flashL(x,y,z,0xff9a50,6,10)}
function tar(x,y,z,n,sp=1){for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),v=rnd(0.5,4)*sp;FX.norm.add({x:x+rnd(-.1,.1),y:y+rnd(-.15,.15),z:z+rnd(-.1,.1),vx:Math.cos(a)*v/60,vy:rnd(1,4)/60,vz:Math.sin(a)*v/60,g:0.2/60,stick:true,life:rnd(100,220),s:rnd(0.04,0.11),r:0.01,gg:0.01,b:0.03,a:0.95})}}
function petals(x,y,z,n){for(let i=0;i<n;i++)FX.norm.add({x,y,z,vx:rnd(-2,2)/60,vy:rnd(0.5,3)/60,vz:rnd(-2,2)/60,g:0.03/60,drag:0.98,life:rnd(60,110),s:rnd(0.04,0.07),r:0.6,gg:0.03,b:0.08})}
function embers(x,y,z,n=1,col=[1,0.45,0.1]){for(let i=0;i<n;i++)FX.add.add({x:x+rnd(-.1,.1),y,z:z+rnd(-.1,.1),vx:rnd(-.3,.3)/60,vy:rnd(0.5,1.8)/60,vz:rnd(-.3,.3)/60,life:rnd(30,70),s:rnd(0.02,0.05),r:col[0]*1.6,gg:col[1]*1.6,b:col[2]*1.6})}
function dust(x,z,n){for(let i=0;i<n;i++)FX.norm.add({x:x+rnd(-1,1),y:0.1,z:z+rnd(-1,1),vx:rnd(-2,2)/60,vy:rnd(0,1)/60,vz:rnd(-2,2)/60,drag:0.96,life:rnd(30,60),s:rnd(0.3,0.6),grow:1.5,r:0.35,gg:0.32,b:0.3,a:0.25})}
// ---------- flash lights
const flashes=[];function flashL(x,y,z,col,int,life){flashes.push({x,y,z,col,int,life,max:life})}
// ---------- sprites
function glintSprite(){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.star,color:0xff3030,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,toneMapped:false}));s.scale.set(0.01,0.01,1);s.renderOrder=10;return s}
function flameSprite(){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.flame,color:0xffffff,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));return s}
