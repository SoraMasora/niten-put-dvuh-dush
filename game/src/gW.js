// ---------- v0.20: ГЛАВА 10 «Пустые глаза» (blender/ext/v20.py -> niten_v20.glb + gWd.js)
// Дверь из PS1-локации -> белый свет -> старая школа Варёнам (фотограмметрия) -> грязный двор -> Мудзин, слепой кэнсэй.
// Босс: процедурная анимация (IK рук и ног, оружие — отдельные меши с ориентацией в пространстве тела), слух вместо зрения, 3 фазы.
const W0={on:false,t:0,met:false,fight:false,cs:0,boss:null,nav0:null,req:null,nv:0,loudT:0,silence:0,scar:null,fx:[],marks:[],ph:0,dark:0,hint:0,door:null,light:null};
const _zw1=new THREE.Vector3(),_zw2=new THREE.Vector3(),_zw3=new THREE.Vector3(),_zw4=new THREE.Vector3(),_zq=new THREE.Quaternion(),_zq2=new THREE.Quaternion(),_zq3=new THREE.Quaternion(),_zm=new THREE.Matrix4(),_zm2=new THREE.Matrix4();
const MZB=()=>W0D.mz.B;
// ---------- скелет и оружие
function mzRig(){const D=W0D.mz,B=D.B,Pt=ASSET.parts.V8Z||{},body=Pt.body||[],pad=Pt.pad||[];const root=new Group(),bodyG=new Group();root.add(bodyG);
 const upper=new Group();root.add(upper);const gl=glintSprite();scene.add(gl);gl.visible=false;const tip=new THREE.Object3D();
 if(!body.length){const m=new MS({color:0x2a2622,roughness:0.8});const b=new Mesh(new THREE.CapsuleGeometry(0.3,1.2,4,8),m);b.position.y=0.95;bodyG.add(b);bodyG.add(tip);return{root,upper,gl,tip,mat:m,kind:'mudzin',bodyG,S:null}}
 const S=v8Skin([...body,...pad],B,{mat:m=>{m.envMapIntensity=0.45;m.alphaTest=Math.max(m.alphaTest||0,0.4);m.transparent=false}});bodyG.add(S.root);
 const padM=S.meshes.slice(body.length);const mat=S.meshes[0].material;
 const wm=n=>{const it=(Pt[n]||[])[0];if(!it)return null;const g=it.geo.clone();if(g.attributes.color)g.deleteAttribute('color');const m=it.mat?it.mat.clone():new MS({color:0x701010});m.vertexColors=false;m.envMapIntensity=0.8;const o=new Mesh(g,m);o.castShadow=true;return o};
 const kat=wm('kat'),sA=wm('sayaA'),sB=wm('sayaB'),kP=new Group(),sP=new Group();
 if(kat){kat.position.y=-D.kat.grip;kP.add(kat)}if(sA){sA.position.y=-D.saya.grip;sP.add(sA)}if(sB){sB.position.y=-D.saya.grip;sP.add(sB)}
 const off=n=>{const b=B.find(q=>q[0]===n);return new V3((b[5]-b[2])*0.55,(b[6]-b[3])*0.55,(b[7]-b[4])*0.55)};
 const gR=new Group(),gL=new Group();gR.position.copy(off('handR'));gL.position.copy(off('handL'));S.bones.handR.add(gR);S.bones.handL.add(gL);gR.add(kP);gL.add(sP);
 kP.add(tip);tip.position.set(0,-D.kat.grip+D.kat.len*0.96,0);
 // длины и направления покоя для IK
 const bd={};for(const b of B)bd[b[0]]={h:new V3(b[2],b[3],b[4]),t:new V3(b[5],b[6],b[7])};
 const lim=(a,b)=>{const u=bd[a].t.clone().sub(bd[a].h),f=bd[b].t.clone().sub(bd[b].h);return{l1:u.length(),l2:f.length(),u0:u.normalize(),f0:f.normalize(),n0:new V3().crossVectors(u,f).normalize()}};
 const ik={R:lim('armR','foreR'),L:lim('armL','foreL'),FR:lim('thighR','shinR'),FL:lim('thighL','shinL')};
 for(const k of['FR','FL'])if(ik[k].n0.lengthSq()<0.5)ik[k].n0.set(1,0,0);
 return{root,upper,gl,tip,mat,kind:'mudzin',bodyG,S,padM,kat,sA,sB,kP,sP,gR,gL,ik,bd,pose:null,trail:[],wpos:{}}}
// базис (a — направление сегмента, n — нормаль плоскости сгиба) -> кватернион
function wBasis(a,n,out){const z=_zw4.crossVectors(a,n).normalize();const n2=_zw3.crossVectors(z,a).normalize();_zm.makeBasis(a,n2,z);return out.setFromRotationMatrix(_zm)}
const _zqb0=new THREE.Quaternion(),_zqb1=new THREE.Quaternion();
// двухзвенный IK в пространстве корня скелета: b1/b2 — кости (плечо/предплечье или бедро/голень), T — цель (запястье/лодыжка), pole — куда смотрит локоть/колено
function wIK(r,k,b1,b2,T,pole){const L=r.ik[k],B=r.S.bones,c1=B[b1],c2=B[b2];if(!c1)return;
 const rq=r.rq,ri=r.ri;c1.parent.updateWorldMatrix(true,false);c1.getWorldPosition(_zw1).applyMatrix4(ri);
 const d=_zw2.copy(T).sub(_zw1);let dist=d.length();const mx=L.l1+L.l2-0.002,mn=Math.abs(L.l1-L.l2)+0.01;dist=clamp(dist,mn,mx);d.normalize();
 const a=(L.l1*L.l1-L.l2*L.l2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,L.l1*L.l1-a*a));
 const p=_zw3.copy(pole).addScaledVector(d,-pole.dot(d));if(p.lengthSq()<1e-6)p.set(0,0,1);p.normalize();
 const E=new V3().copy(_zw1).addScaledVector(d,a).addScaledVector(p,h),W=new V3().copy(_zw1).addScaledVector(d,dist);
 const up=new V3().subVectors(E,_zw1).normalize(),fo=new V3().subVectors(W,E).normalize();let n=new V3().crossVectors(up,fo);if(n.lengthSq()<1e-6)n.crossVectors(up,p);n.normalize();
 // поворот плеча: базис покоя (u0,n0) -> текущий (up,n); предплечья: (f0,n0) -> (fo,n)
 wBasis(L.u0,L.n0,_zqb0);const R1=wBasis(up,n,new THREE.Quaternion()).multiply(_zqb0.invert());
 wBasis(L.f0,L.n0,_zqb0);const R2=wBasis(fo,n,new THREE.Quaternion()).multiply(_zqb0.invert());
 c1.parent.getWorldQuaternion(_zq);const Qp=_zq2.copy(rq).invert().multiply(_zq);// родитель в пространстве корня
 c1.quaternion.copy(Qp.invert().multiply(R1));c2.quaternion.copy(R1.clone().invert().multiply(R2));c1.updateMatrixWorld(true)}
// ---------- позы: поля в пространстве тела (x — влево, y — вверх, z — вперёд), м/рад
// h: таз, hr: поворот таза, sp: изгиб корпуса, nk: голова, R/L: запястья, Re/Le: локти, FR/FL: лодыжки, kd/ke: катана (лезвие/обух), sd/se: ножны, ka/sa: где оружие
const MZP={
 idle:{h:[0,0.9,0],hr:[0.04,0.6,0],sp:[0.05,0.5,0],nk:[0.15,-0.55,0.3],R:[-0.3,0.95,0.24],Re:[-1,-0.2,-0.4],L:[0.04,1.2,0.34],Le:[1,-0.6,-0.3],FR:[-0.13,0.1,0.22],FL:[0.2,0.1,-0.24],kd:[-0.12,-0.85,0.5],ke:[0,0,1],sd:[-1,0.02,0.12],se:[0,1,0],ka:'R',sa:'B',Lk:1},
 // иай-готовность: катана в ножнах у левого бедра, правая рука на рукояти, левая нога назад
 sheath:{h:[0,0.86,0],hr:[0.08,0.45,0],sp:[0.15,0.3,0],nk:[0.2,-0.4,0.25],L:[0.2,0.98,0.22],Le:[1,-0.3,-0.4],R:[0,1.0,0.3],Re:[-1,-0.4,-0.2],FR:[-0.14,0.1,0.26],FL:[0.22,0.1,-0.3],sd:[-0.25,-0.35,-1],se:[1,0,0],ka:'S',sa:'B',Lk:1},
 // конец горизонтального среза слева направо на уровне шеи
 clickEnd:{h:[0,0.84,0.05],hr:[0.1,-0.5,0],sp:[0.12,-0.6,0],nk:[0.1,0.3,0.2],R:[-0.62,1.42,0.38],Re:[-0.3,-1,-0.5],L:[0.24,1.0,0.12],Le:[1,-0.3,-0.4],FR:[-0.16,0.1,0.34],FL:[0.24,0.1,-0.32],kd:[-0.95,0.08,0.3],ke:[0,1,0],sd:[-0.25,-0.35,-1],se:[1,0,0],ka:'R',sa:'B',Lk:1},
 // фури — стряхивает кровь вниз-вправо
 chiburi:{h:[0,0.88,0],hr:[0.05,0.2,0],sp:[0.06,0.1,0],nk:[0.15,-0.2,0.3],R:[-0.48,0.92,0.42],Re:[-1,0,-0.3],L:[0.22,0.98,0.14],Le:[1,-0.3,-0.4],FR:[-0.14,0.1,0.26],FL:[0.22,0.1,-0.26],kd:[-0.55,-0.75,0.35],ke:[0,0,1],sd:[-0.25,-0.35,-1],se:[1,0,0],ka:'R',sa:'B',Lk:1},
 // Крест: оба предмета буквой X над головой
 crossUp:{h:[0,0.92,-0.02],hr:[-0.1,0.05,0],sp:[-0.25,0.45,0],nk:[-0.3,-0.4,0],R:[-0.2,1.95,0.18],Re:[-1,0.2,-0.2],L:[0.2,1.95,0.18],Le:[1,0.2,-0.2],FR:[-0.18,0.1,0.18],FL:[0.2,0.1,-0.2],kd:[0.6,0.75,-0.1],ke:[0,0,1],sd:[-0.6,0.75,-0.1],se:[0,0,1],ka:'R',sa:'L'},
 crossDown:{h:[0,0.72,0.25],hr:[0.35,0.05,0],sp:[0.45,0.45,0],nk:[0.3,-0.4,0],R:[0.15,0.75,0.75],Re:[-1,0.2,-0.2],L:[-0.15,0.72,0.75],Le:[1,0.2,-0.2],FR:[-0.16,0.1,0.55],FL:[0.2,0.1,-0.35],kd:[0.45,-0.75,0.5],ke:[0,0,1],sd:[-0.45,-0.75,0.5],se:[0,0,1],ka:'R',sa:'L'},
 // Укол Пустоты: спиной к цели, низкий присед, ножны назад-вверх как прицел (цель — позади, -z)
 thrustTell:{h:[0,0.64,0.05],hr:[0.35,0,0],sp:[0.35,0.2,0],nk:[0.1,0.9,0.2],L:[0.28,1.2,-0.05],Le:[1,0,0],R:[0.05,0.95,0.3],Re:[-1,-0.4,0],FR:[-0.24,0.1,0.25],FL:[0.24,0.1,-0.25],sd:[0.25,0.45,-1],se:[1,0,0],ka:'S',sa:'B',Lk:1,Kpole:[0,0,1]},
 // рывок: выпад вперёд, клинок вперёд
 thrustDash:{h:[0,0.7,0.2],hr:[0.4,-0.3,0],sp:[0.3,-0.3,0],nk:[-0.2,0.3,0],R:[-0.15,1.25,0.85],Re:[-1,-0.6,0],L:[0.3,1.05,-0.3],Le:[1,0,0],FR:[-0.14,0.1,0.65],FL:[0.18,0.12,-0.55],kd:[0,0.05,1],ke:[0,1,0],sd:[-0.2,-0.4,-1],se:[1,0,0],ka:'R',sa:'B'},
 // торможение на коленях после промаха
 skid:{h:[0,0.45,0],hr:[0.4,0,0],sp:[0.3,0,0],nk:[0.3,0,0],R:[-0.3,0.55,0.55],Re:[-1,0,0],L:[0.32,0.5,0.25],Le:[1,0,0],FR:[-0.18,0.08,0.15],FL:[0.18,0.08,-0.25],kd:[-0.2,-0.6,0.8],ke:[0,1,0],sd:[0.1,-0.5,-1],se:[1,0,0],ka:'R',sa:'B',Kpole:[0,-0.6,1]},
 // Трость: ножны двумя руками как посох (катана в ножнах)
 cane:{h:[0,0.88,0],hr:[0.05,0.25,0],sp:[0.1,0.2,0],nk:[0.15,-0.2,0.25],L:[0.16,1.15,0.36],Le:[1,-0.5,-0.3],R:[-0.2,1.1,0.32],Re:[-1,-0.5,-0.3],FR:[-0.15,0.1,0.22],FL:[0.2,0.1,-0.22],sd:[-0.9,0.3,0.35],se:[0,1,0],ka:'S',sa:'L',twoS:1},
 canePoke:{h:[0,0.84,0.12],hr:[0.12,0.1,0],sp:[0.15,0.1,0],nk:[0.1,0,0.2],L:[0.1,1.35,0.55],Le:[1,-0.5,0],R:[-0.08,1.25,0.25],Re:[-1,-0.5,0],FR:[-0.15,0.1,0.42],FL:[0.2,0.1,-0.3],sd:[0.1,0.25,1],se:[0,1,0],ka:'S',sa:'L',twoS:1},
 caneSweep:{h:[0,0.62,0.05],hr:[0.25,-0.7,0],sp:[0.35,-0.5,0],nk:[0.3,0.3,0],L:[0.15,0.62,0.45],Le:[1,0.3,0],R:[-0.2,0.66,0.35],Re:[-1,0.3,0],FR:[-0.25,0.1,0.25],FL:[0.25,0.1,-0.25],sd:[-0.95,-0.25,0.3],se:[0,1,0],ka:'S',sa:'L',twoS:1},
 caneHilt:{h:[0,0.88,0.08],hr:[0.05,0.8,0],sp:[0.05,0.6,0],nk:[0,-0.5,0.2],L:[0.28,1.35,0.22],Le:[1,-0.4,-0.3],R:[0.0,1.3,0.3],Re:[-1,-0.4,0],FR:[-0.15,0.1,0.3],FL:[0.2,0.1,-0.25],sd:[-0.5,-0.3,-1],se:[1,0,0],ka:'S',sa:'L',twoS:1},
 // Мельница: ножны воткнуты в землю, катана двумя руками сбоку, широкая стойка
 millTell:{h:[0,0.72,0],hr:[0.15,1.2,0],sp:[0.2,0.6,0],nk:[0.2,-0.8,0],R:[-0.42,1.0,-0.1],Re:[-1,-0.3,0.3],L:[-0.25,1.0,0.0],Le:[1,-0.3,0],FR:[-0.36,0.1,0.05],FL:[0.36,0.1,-0.05],kd:[-0.6,0.5,-0.6],ke:[0,1,0],ka:'R',sa:'G',two:1},
 millLow:{h:[0,0.62,0],hr:[0.2,0.2,0],sp:[0.35,0.1,0],nk:[0.2,0,0],R:[-0.1,0.72,0.55],Re:[-1,0.2,0],L:[0.05,0.75,0.42],Le:[1,0.2,0],FR:[-0.38,0.1,0.05],FL:[0.38,0.1,-0.05],kd:[-0.9,-0.2,0.35],ke:[0,1,0],ka:'R',sa:'G',two:1},
 millHigh:{h:[0,0.86,0],hr:[0.0,0.2,0],sp:[-0.05,0.1,0],nk:[0,0,0],R:[-0.12,1.42,0.48],Re:[-1,-0.2,0],L:[0.05,1.42,0.38],Le:[1,-0.2,0],FR:[-0.36,0.1,0.05],FL:[0.36,0.1,-0.05],kd:[-0.95,0.12,0.25],ke:[0,1,0],ka:'R',sa:'G',two:1},
 dizzy:{h:[0.06,0.84,0],hr:[0.1,0.3,0.12],sp:[0.3,0.2,0.15],nk:[0.4,-0.2,0.45],R:[-0.3,0.8,0.25],Re:[-1,0,-0.3],L:[0.3,0.95,0.12],Le:[1,0,0],FR:[-0.2,0.1,0.2],FL:[0.25,0.1,-0.2],kd:[-0.2,-0.95,0.2],ke:[0,0,1],ka:'R',sa:'G'},
 // Стойка Слуха: катана в ножнах, ножны вперёд как антенна, низкий сед, голова набок
 listen:{h:[0,0.7,0],hr:[0.12,0.5,0],sp:[0.15,0.3,0],nk:[0.2,-0.5,0.45],L:[0.12,1.15,0.5],Le:[1,-0.5,-0.2],R:[0,1.05,0.28],Re:[-1,-0.4,-0.2],FR:[-0.25,0.1,0.32],FL:[0.25,0.1,-0.3],sd:[-0.2,0.05,1],se:[0,1,0],ka:'S',sa:'L'},
 // Гроза: клинок высоко над головой двумя руками
 stormUp:{h:[0,0.92,-0.03],hr:[-0.12,0.2,0],sp:[-0.3,0.2,0],nk:[-0.3,-0.2,0],R:[-0.08,1.98,0.12],Re:[-1,0.3,-0.2],L:[0.05,1.92,0.1],Le:[1,0.3,-0.2],FR:[-0.2,0.1,0.25],FL:[0.2,0.1,-0.25],kd:[0,1,-0.15],ke:[0,0,1],ka:'R',sa:'B',two:1},
 stormDown:{h:[0,0.58,0.3],hr:[0.5,0.1,0],sp:[0.5,0.1,0],nk:[0.4,0,0],R:[-0.05,0.75,0.85],Re:[-1,0.3,0],L:[0.08,0.95,0.75],Le:[1,0.3,0],FR:[-0.18,0.1,0.7],FL:[0.2,0.1,-0.4],kd:[0,-0.92,0.38],ke:[0,0,1],ka:'R',sa:'B',two:1,Kpole:[0,-0.3,1]},
 // одышка: опирается на ножны, клинок опущен
 breath:{h:[0,0.8,0],hr:[0.35,0.3,0],sp:[0.55,0.2,0],nk:[0.3,-0.2,0.2],R:[-0.3,0.8,0.32],Re:[-1,0,-0.3],L:[0.22,0.75,0.42],Le:[1,0.2,0],FR:[-0.18,0.1,0.18],FL:[0.2,0.1,-0.22],kd:[-0.25,-0.92,0.3],ke:[0,0,1],sd:[0.05,-1,0.25],se:[1,0,0],ka:'R',sa:'B'},
 // на одно колено, меч воткнут для опоры
 kneel:{h:[0,0.5,-0.05],hr:[0.25,0.3,0],sp:[0.35,0.2,0],nk:[0.4,-0.2,0.15],R:[-0.25,0.85,0.45],Re:[-1,0.2,-0.2],L:[0.25,0.6,0.25],Le:[1,0,0],FR:[-0.16,0.1,0.3],FL:[0.18,0.08,-0.45],kd:[0,-1,0.05],ke:[0,0,1],sd:[-0.2,-0.4,-1],se:[1,0,0],ka:'R',sa:'B',Lk:1,Kpole:[0,-0.4,1]},
 // Поиск: ножны вперёд, медленно, голова крутится
 search:{h:[0,0.86,0],hr:[0.08,0.2,0],sp:[0.15,0.2,0],nk:[0.1,0,0.3],L:[0.15,1.25,0.6],Le:[1,-0.4,0],R:[-0.3,0.95,0.2],Re:[-1,-0.2,-0.3],FR:[-0.15,0.1,0.2],FL:[0.18,0.1,-0.2],kd:[-0.1,-0.9,0.4],ke:[0,0,1],sd:[0,-0.1,1],se:[0,1,0],ka:'R',sa:'B'},
 // захват: левая — за ворот, правая — к лицу (меч воткнут)
 grab:{h:[0,0.88,0.06],hr:[0.08,0,0],sp:[0.15,0.3,0],nk:[0.35,-0.3,0],L:[0.1,1.38,0.55],Le:[1,-0.4,0],R:[-0.1,1.55,0.5],Re:[-1,-0.3,0],FR:[-0.15,0.1,0.28],FL:[0.2,0.1,-0.2],sd:[-0.2,-0.4,-1],se:[1,0,0],ka:'G',sa:'B'},
 headbutt:{h:[0,0.86,0.15],hr:[0.25,0,0],sp:[0.45,0.3,0],nk:[0.6,-0.3,0],L:[0.1,1.25,0.6],Le:[1,-0.4,0],R:[-0.1,1.35,0.58],Re:[-1,-0.3,0],FR:[-0.15,0.1,0.35],FL:[0.2,0.1,-0.25],sd:[-0.2,-0.4,-1],se:[1,0,0],ka:'G',sa:'B'},
 // боль слева: хватается за бок
 hurtL:{h:[0.03,0.86,-0.05],hr:[-0.05,0.4,0.1],sp:[0.25,0.3,0.25],nk:[0.2,-0.3,0.4],R:[-0.3,0.9,0.2],Re:[-1,-0.2,-0.4],L:[0.16,1.05,0.12],Le:[1,0,-0.3],FR:[-0.13,0.1,0.22],FL:[0.2,0.1,-0.24],kd:[-0.12,-0.85,0.5],ke:[0,0,1],sd:[0,-1,0.1],se:[1,0,0],ka:'R',sa:'B',Lk:1},
 // снимает наплечник: левая рука на правом плече
 unpad:{h:[0,0.52,-0.05],hr:[0.2,0.1,0],sp:[0.3,0.2,0],nk:[0.3,0.4,0],R:[-0.25,0.8,0.4],Re:[-1,0.2,-0.2],L:[-0.2,1.42,0.05],Le:[1,0,0.3],FR:[-0.16,0.1,0.3],FL:[0.18,0.08,-0.45],kd:[0,-1,0.05],ke:[0,0,1],sd:[-0.2,-0.4,-1],se:[1,0,0],ka:'R',sa:'B',Kpole:[0,-0.4,1]},
 // ломает ножны об колено
 breakUp:{h:[0,0.9,0],hr:[0,0,0],sp:[-0.1,0.4,0],nk:[-0.1,-0.4,0],L:[0.25,1.3,0.35],Le:[1,0,0],R:[-0.25,1.3,0.35],Re:[-1,0,0],FR:[-0.15,0.1,0.15],FL:[0.18,0.45,0.32],sd:[-1,0,0],se:[0,1,0],ka:'G',sa:'L',twoS:1},
 breakDown:{h:[0,0.86,0.02],hr:[0.2,0,0],sp:[0.4,0.4,0],nk:[0.3,-0.4,0],L:[0.25,0.92,0.4],Le:[1,0,0],R:[-0.25,0.92,0.4],Re:[-1,0,0],FR:[-0.15,0.1,0.15],FL:[0.18,0.62,0.38],sd:[-1,-0.15,0],se:[0,1,0],ka:'G',sa:'L',twoS:1},
 // срывает повязку
 unmask:{h:[0,0.9,0],hr:[0,0.2,0],sp:[-0.1,0.3,0],nk:[-0.2,-0.3,0],R:[-0.12,1.82,0.18],Re:[-1,0.4,0],L:[0.25,1.0,0.25],Le:[1,0,-0.3],FR:[-0.15,0.1,0.2],FL:[0.2,0.1,-0.2],kd:[0,-1,0],ke:[0,0,1],ka:'G',sa:'F'},
 // смерть: поклон и сэйдза
 bow:{h:[0,0.86,-0.08],hr:[0.3,0,0],sp:[0.55,0.45,0],nk:[0.3,-0.4,0],R:[-0.22,0.86,0.22],Re:[-1,0,0],L:[0.22,0.86,0.22],Le:[1,0,0],FR:[-0.13,0.1,0.05],FL:[0.13,0.1,0.05],sd:[0,-0.5,-1],se:[1,0,0],ka:'S',sa:'B'},
 seiza:{h:[0,0.42,-0.12],hr:[0.05,0,0],sp:[0.05,0.5,0],nk:[0.35,-0.5,0],R:[-0.18,0.62,0.18],Re:[-1,0,0],L:[0.18,0.62,0.18],Le:[1,0,0],FR:[-0.12,0.08,-0.3],FL:[0.12,0.08,-0.3],sd:[0,0,1],se:[1,0,0],ka:'S',sa:'X',Kpole:[0,-0.5,1],fp:-1.2},
};
MZP.seizaB=mzOver(MZP.seiza,{sa:'B'});
const MZK=['h','hr','sp','nk','R','Re','L','Le','FR','FL','kd','ke','sd','se'];
function mzMix(a,b,k){const o={};for(const n of MZK){const x=a[n],y=b[n];o[n]=x&&y?[lerp(x[0],y[0],k),lerp(x[1],y[1],k),lerp(x[2],y[2],k)]:(y||x)}o.ka=k<0.5?a.ka:b.ka;o.sa=k<0.5?a.sa:b.sa;o.two=k<0.5?a.two:b.two;o.Lk=k<0.5?a.Lk:b.Lk;o.twoS=k<0.5?a.twoS:b.twoS;return o}
function mzOver(base,p){const o={...base};for(const n in p)o[n]=p[n];return o}
// ключевые кадры: [[кадр, поза(частичная)]] -> поза в момент t (ease между ключами)
function mzTrack(base,K,t){let a=mzOver(base,K[0][1]);if(t<=K[0][0])return a;for(let i=1;i<K.length;i++){const b=mzOver(a,K[i][1]);if(t<=K[i][0]){const k=(t-K[i-1][0])/Math.max(1e-6,K[i][0]-K[i-1][0]);return mzMix(a,b,K[i][2]==='lin'?clamp(k,0,1):ease(k))}a=b}return a}
const _zv=a=>_zw1.set(a[0],a[1],a[2]);
// применение позы к скелету + оружие
function mzApply(e,p,t){const r=e.rig,S=r.S;if(!S)return;const B=S.bones;r.root.updateWorldMatrix(true,false);r.rq=r.root.getWorldQuaternion(r.rq||new THREE.Quaternion());r.ri=(r.ri||new THREE.Matrix4()).copy(r.root.matrixWorld).invert();
 for(const b of S.list)b.quaternion.copy(b.userData.q0);
 const H=B.hips,h0=r.bd.hips.h;H.position.set(p.h[0]-0+h0.x*0,p.h[1],p.h[2]);bR(H,p.hr[0],p.hr[1],p.hr[2]);
 const s=p.sp;bR(B.spine,s[0]*0.35,s[1]*0.3,s[2]*0.3);bR(B.chest,s[0]*0.35,s[1]*0.35,s[2]*0.35);bR(B.chest2,s[0]*0.3,s[1]*0.35,s[2]*0.35);
 const n=p.nk;bR(B.neck,n[0]*0.4,n[1]*0.45,n[2]*0.4);bR(B.head,n[0]*0.6,n[1]*0.55,n[2]*0.6);
 // вторичная анимация: волосы и полы кимоно (пружины)
 const sw=r.sw||(r.sw={hx:0,hz:0,vx:0,vz:0,fx:0,fv:0,lx:e.x,lz:e.z,ly:e.yaw});const vx=(e.x-sw.lx),vz=(e.z-sw.lz),vy=angDiff(sw.ly,e.yaw);sw.lx=e.x;sw.lz=e.z;sw.ly=e.yaw;
 const cy=Math.cos(e.yaw),sy=Math.sin(e.yaw),fw=vx*sy+vz*cy,sd=vx*cy-vz*sy;
 sw.vx+=(-0.06*sw.hx-0.14*sw.vx+fw*0.9+Math.sin(t*1.3)*0.002);sw.vz+=(-0.06*sw.hz-0.14*sw.vz-sd*0.9+vy*0.25);sw.hx=clamp(sw.hx+sw.vx,-0.9,0.9);sw.hz=clamp(sw.hz+sw.vz,-0.9,0.9);
 sw.fv+=(-0.08*sw.fx-0.16*sw.fv+fw*1.2+Math.abs(vy)*0.5);sw.fx=clamp(sw.fx+sw.fv,-0.2,1.1);
 bR(B.hair,sw.hx*0.8+Math.sin(t*1.7)*0.04,0,sw.hz*0.6+Math.sin(t*1.1)*0.05);
 const lg=(p.FL[2]-p.FR[2]);bR(B.skirtF,-sw.fx*0.9-Math.max(0,lg,-lg)*0.6+Math.sin(t*2.1)*0.02,0,0);bR(B.skirtB,sw.fx*0.7+Math.max(0,-lg,lg)*0.4,0,0);
 S.root.updateMatrixWorld(true);
 const K=p.Kpole||[0,0,1];
 wIK(r,'FR','thighR','shinR',_zv(p.FR).clone(),new V3(-0.25+K[0],0,K[2]).normalize());wIK(r,'FL','thighL','shinL',_zv(p.FL).clone(),new V3(0.25+K[0],0,K[2]).normalize());
 // стопы — ровно (поворот относительно корня = только по Y как у таза)
 for(const f of['footR','footL']){const b=B[f];b.parent.getWorldQuaternion(_zq);const Qp=_zq2.copy(r.rq).invert().multiply(_zq);_zq3.setFromEuler(_qE.set(p.fp||0,p.hr[1]*0.6,0));b.quaternion.copy(Qp.invert().multiply(_zq3))}
 // руки: сначала левая (ножны), потом правая (рукоять — может зависеть от ножен)
 if(p.sa==='B'&&p.Lk){mzWeap(e,p,'s');r.sP.updateMatrixWorld(true);_zw2.set(0.012,W0D.mz.saya.len*0.06,0.03).applyMatrix4(r.sP.matrixWorld).applyMatrix4(r.ri);wIK(r,'L','armL','foreL',_zw2.clone(),_zv(p.Le).clone())}
 else{wIK(r,'L','armL','foreL',_zv(p.L).clone(),_zv(p.Le).clone());mzWeap(e,p,'s')}
 let RT=_zv(p.R).clone();
 if(p.twoS&&r.sP.parent===r.gL){r.sP.updateMatrixWorld(true);_zw2.set(0,-W0D.mz.saya.grip+W0D.mz.saya.len*0.6,0).applyMatrix4(r.sP.matrixWorld).applyMatrix4(r.ri);RT.copy(_zw2)}
 else if(p.ka==='S'&&r.kP.parent===r.sP){r.kP.updateMatrixWorld(true);r.kP.getWorldPosition(_zw2).applyMatrix4(r.ri);RT.copy(_zw2).add(new V3(-0.02,-0.04,0))}
 wIK(r,'R','armR','foreR',RT,_zv(p.Re).clone());
 if(p.two&&p.ka==='R'){mzWeap(e,p,'k');r.kP.updateMatrixWorld(true);_zw2.set(0,-0.2,0).applyMatrix4(r.kP.matrixWorld).applyMatrix4(r.ri);wIK(r,'L','armL','foreL',_zw2.clone(),new V3(1,-0.6,-0.3))}
 mzWeap(e,p,'k')}
// ориентация оружия: локальная ось +Y = лезвие (kd), +Z = обух/плоскость (ke)
function wOrient(d,eh,out){const y=_zw3.set(d[0],d[1],d[2]).normalize(),z=_zw4.set(eh[0],eh[1],eh[2]);z.addScaledVector(y,-z.dot(y));if(z.lengthSq()<1e-6)z.set(0,0,1).addScaledVector(y,-y.z);z.normalize();const x=new V3().crossVectors(y,z);_zm2.makeBasis(x,y,z);return out.setFromRotationMatrix(_zm2)}
function mzWeap(e,p,w){const r=e.rig,D=W0D.mz;
 if(w==='s'){const at=p.sa||'L',P0=r.sP;
  if(at==='G'||at==='X'){if(P0.parent!==ENV&&P0.parent!==scene){scene.attach(P0)}return}
  if(at==='F'){if(P0.parent!==r.S.bones.foreL)r.S.bones.foreL.add(P0);P0.position.set(0.02,-0.06,0.06);wOrient([0.95,0.05,0.25],[0,1,0],P0.quaternion);r.root.updateMatrixWorld(true);return}
  if(at==='B'){const hp=r.S.bones.hips;if(P0.parent!==hp)hp.add(P0);const d=_zw2.set(0.06,-0.32,-1).normalize();P0.position.set(0.17,0.0,0.11).addScaledVector(d,D.saya.grip);hp.updateWorldMatrix(true,false);hp.getWorldQuaternion(_zq);wOrient([d.x,d.y,d.z],[1,0,0],_zq3);_zq2.copy(r.rq).multiply(_zq3);
   // ориентация в пространстве таза (таз уже повёрнут позой) — без учёта поворота таза достаточно точная
   P0.quaternion.copy(_zq.invert().multiply(_zq2));P0.updateMatrixWorld(true);return}
  if(P0.parent!==r.gL){r.gL.add(P0);P0.position.set(0,0,0)}
  r.gL.updateWorldMatrix(true,false);r.gL.getWorldQuaternion(_zq);wOrient(p.sd,p.se,_zq3);_zq2.copy(r.rq).multiply(_zq3);P0.quaternion.copy(_zq.invert().multiply(_zq2));P0.updateMatrixWorld(true);return}
 const at=p.ka||'R',K=r.kP;
 if(at==='S'){if(K.parent!==r.sP){r.sP.add(K)}K.position.set(0,-D.saya.grip+D.kat.grip,0);K.quaternion.identity();K.visible=true;return}
 if(at==='G'){if(K.parent!==scene)scene.attach(K);return}
 if(K.parent!==r.gR){r.gR.add(K);K.position.set(0,0,0)}
 r.gR.updateWorldMatrix(true,false);r.gR.getWorldQuaternion(_zq);wOrient(p.kd,p.ke,_zq3);_zq2.copy(r.rq).multiply(_zq3);K.quaternion.copy(_zq.invert().multiply(_zq2));K.updateMatrixWorld(true)}
// воткнуть оружие в землю (мировые координаты)
function mzStick(e,w,x,z,yaw,tilt=0.12){const r=e.rig,o=w==='k'?r.kP:r.sP,D=W0D.mz;scene.attach(o);const gy=e.gy||0;
 const L=w==='k'?D.kat.len:D.saya.len;o.quaternion.setFromEuler(_qE.set(Math.PI+tilt,yaw,0,'YXZ'));
 // острие на 0.25 м в земле: точка pivot = острие + вверх по оси
 const dir=new V3(0,1,0).applyQuaternion(o.quaternion);const tipOff=w==='k'?(-D.kat.grip+L):(-D.saya.grip+L);o.position.set(x,gy-0.25,z).addScaledVector(dir,-tipOff)}
// ---------- синхронизация (вызывается из syncEnemy)
function mzSync(e,t){const r=e.rig;if(!r.S)return;r.gl.visible=false;if(e.frozen>20)e.frozen=20;
 r.root.visible=!e.hide;for(const o of[r.kP,r.sP])if(o.parent===scene)o.visible=!e.hide||o===r.sP&&e.pose&&e.pose.sa==='G'||o===r.kP&&e.pose&&e.pose.ka==='G';
 let p=e.pose||MZP.idle;if(e.walk>0.02){const w=e.walk,s=Math.sin(e.wph),c=Math.cos(e.wph);p={...p,FR:[p.FR[0],p.FR[1]+Math.max(0,c)*0.035*w,p.FR[2]+s*0.17*w],FL:[p.FL[0],p.FL[1]+Math.max(0,-c)*0.035*w,p.FL[2]-s*0.17*w],h:[p.h[0]+s*0.015*w,p.h[1]-0.025*w,p.h[2]]}}
 mzApply(e,p,t);
 if(r.eyes)for(const s of r.eyes){s.visible=!!e.eyes&&!e.hide;if(s.visible)s.scale.setScalar(0.06+0.015*Math.sin(t*9+s.position.x*40))}
 if(e.glint>0&&!e.hide&&r.sP){r.sP.getWorldPosition(r.gl.position);r.gl.position.y+=0.05;const k=Math.sin(Math.PI*clamp(e.glint/30,0,1));r.gl.scale.set(0.5*k+0.05,0.5*k+0.05,1);r.gl.visible=true}
 if(r.padM)for(const m of r.padM)m.visible=!e.noPad;
 if(r.sB)r.sB.visible=!e.sayaBroken;
 mzTrailUpd(e)}
// красный шлейф клинка
const MZTR=(()=>{const n=24,g=new THREE.BufferGeometry(),pos=new Float32Array(n*2*3),col=new Float32Array(n*2*3),idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}g.setIndex(idx);g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new Mesh(g,new MB({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));m.frustumCulled=false;m.visible=false;m.renderOrder=15;scene.add(m);return{m,n,pts:[]}})();
function mzTrailUpd(e){const r=e.rig,T=MZTR,on=e.trail>0&&r.kP&&r.kP.parent!==r.sP;if(e.trail>0)e.trail--;
 if(on&&!T.on)T.pts.length=0;T.on=on;if(on){r.kP.updateMatrixWorld(true);const D=W0D.mz;const a=new V3(0,D.kat.len,0).applyMatrix4(r.kat.matrixWorld),b=new V3(0,D.kat.len*0.25,0).applyMatrix4(r.kat.matrixWorld);T.pts.unshift([a,b]);}else if(T.pts.length){T.pts.pop();if(T.pts.length)T.pts.pop()}
 if(T.pts.length>T.n)T.pts.length=T.n;T.m.visible=T.pts.length>1;if(!T.m.visible)return;const P0=T.m.geometry.attributes.position,C=T.m.geometry.attributes.color;
 for(let i=0;i<T.n;i++){const q=T.pts[Math.min(i,T.pts.length-1)],k=1-i/(T.pts.length||1),c=Math.max(0,k)*(e.trailW||1);P0.setXYZ(i*2,q[0].x,q[0].y,q[0].z);P0.setXYZ(i*2+1,q[1].x,q[1].y,q[1].z);C.setXYZ(i*2,1.5*c,0.12*c,0.1*c);C.setXYZ(i*2+1,0.6*c,0.02*c,0.02*c)}
 P0.needsUpdate=true;C.needsUpdate=true}
// ---------- определение босса
function w0Def(){return{mudzin:{name:'Мудзин «Пустые глаза»',hp:1500,spd:2.0,range:3.0,rad:0.45,h:1.85,boss:true,human:true,ai:updMudzin,souls:[['r',16],['p',6],['y',4]],poise:1e9}}}
let W0OK=false;function w0Init(){if(W0OK)return;W0OK=true;Object.assign(ET,w0Def());DG_NO.add('mudzin');FL_NO.add('mudzin')}
function w0Hook(){window.__dmgT=dmgEnemy;return{gy:()=>GY,W0,W0D,MZP,mzTrack,mzMix,mzOver,mzStick,mzStart,mzGo,mzPhase,mzDmg,door:w0DoorCS,arrive:w0ArriveCS,meet:w0MeetCS,fight:w0Fight,noise:w0Noise,death:mzDeathCS,memo:w0MemoCS,truth:w0TruthCS,accept:w0AcceptCS,reject:w0RejectCS,wake:w0WakeCS}}
// ---------- локация: фотограмметрия (запечённый свет -> самосвечение текстуры), небо, листья/пепел, туман фаз
function buildW0Env(g,env){W0.fx=[];
 W0.mats=[];const cache=new Map();locAdd(g,'w0',false).traverse(o=>{if(!o.isMesh||!o.material)return;const m0=o.material;let m=cache.get(m0);if(!m){const mp=m0.map||null;m=new MS({map:mp,emissiveMap:mp,emissive:new THREE.Color(mp?0xffffff:0),emissiveIntensity:0.5,color:new THREE.Color(0.62,0.6,0.58),metalness:0,roughness:1,envMapIntensity:0.08,side:THREE.DoubleSide});m.userData.w0=1;cache.set(m0,m);W0.mats.push(m)}o.material=m;o.castShadow=false;o.receiveShadow=true});
 // купол неба (градиент) — закрывает края скана
 const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#5d6878');gr.addColorStop(0.45,'#9aa3ae');gr.addColorStop(0.62,'#b7b0a4');gr.addColorStop(1,'#6b665e');x.fillStyle=gr;x.fillRect(0,0,4,256);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const sky=new Mesh(new THREE.SphereGeometry(140,32,16),new MB({map:tx,side:THREE.BackSide,fog:false,depthWrite:false}));sky.position.set(0,-10,0);sky.renderOrder=-5;g.add(sky);W0.sky=sky;
 // листья и пыль во дворе
 const n=380,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=rnd(-30,40);pos[i*3+1]=rnd(-4,8);pos[i*3+2]=rnd(-20,30)}
 const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));W0.motes=new THREE.Points(dg,new THREE.PointsMaterial({map:TX.dot,color:0xd8c8a8,size:0.07,transparent:true,opacity:0.5,depthWrite:false}));g.add(W0.motes);
 // красный пепел (фаза 2+)
 const m2=600,p2=new Float32Array(m2*3);for(let i=0;i<m2;i++){p2[i*3]=rnd(-14,14);p2[i*3+1]=rnd(0,12);p2[i*3+2]=rnd(-14,14)}
 const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(p2,3));W0.ash=new THREE.Points(ag,new THREE.PointsMaterial({map:TX.dot,color:0xff4a2a,size:0.09,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));W0.ash.visible=false;g.add(W0.ash);
 for(const l of STATIC){l.intensity=0;l.userData.base=0}
 env.w0=true}
// ---------- загрузка главы 10
function w0Load(cp){LV.ps1=true;LV.w0=true;if(!W0.nav0)W0.nav0=V8D.nav;V8D.nav=W0D.nav;psNav();PS.on=false;PS.done=false;PS.active=false;PS.fight=false;PS.started=true;Q_TO.length=0;LV.env.nav=null;LV.env.R=999;
 Object.assign(W0,{on:true,t:0,fight:false,met:!!(cp&&cp.met),post:false,choice:null,cut:null,dlgHint:0,cs:0,ph:0,dark:0,boss:null,door:null,end:0,hint:0});
 const D=W0D.door;P.x=D[0];P.z=D[1];P._pk=null;P.yaw=Math.PI/2;G.camYaw=P.yaw;P.y=0;P.vy=0;
 if(W0.req==null){const N=V8D.nav,cnt=req=>{const s=psFind(D[0],0,D[1],req);if(s<0)return 0;const seen=new Uint8Array(N.N),Q=[s];seen[s]=1;let n=0;while(Q.length){const k=Q.pop();n++;for(let d=0;d<4;d++){const m=N.nb[k*4+d];if(m>=0&&!seen[m]&&N.cl[m]>=req){seen[m]=1;Q.push(m)}}}return n};
  const c1=cnt(1),c2=cnt(2);W0.req=1;console.log('W0 nav reach',c1,c2,'req',W0.req)}PS.req=W0.req;
 psClamp(P);GY=psGround(P);G.camDist=4.4;nbEquip();
 const B=W0D.boss,e=mkEnemy('mudzin',B[0],B[1]);psClamp(e);e.gy=psGround(e);e.yaw=Math.atan2(D[0]-e.x,D[1]-e.z);e.state='mzwait';e.ms='wait';e.inv=1;e.pose=MZP.idle;enemies.push(e);W0.boss=e;mzInitBoss(e);
 if(cp&&cp.post){W0.post=true;W0.met=true;Object.assign(e,{noPad:true,sayaBroken:true,eyes:false,ms:'post'});e.pose=e.pz=MZP.seizaB;e.pk=0.2;const a=Math.atan2(D[0]-e.x,D[1]-e.z);e.yaw=a;
  P.x=e.x+Math.sin(a)*2.5;P.z=e.z+Math.cos(a)*2.5;P._pk=null;psClamp(P);GY=psGround(P);P.yaw=a+Math.PI;G.camYaw=P.yaw;P.oni=cp.oni||0;G.card=null;G.bossBar=null}
 else if(W0.met){const a=Math.atan2(P.x-e.x,P.z-e.z);P.x=e.x+Math.sin(a)*7.5;P.z=e.z+Math.cos(a)*7.5;P._pk=null;psClamp(P);GY=psGround(P);P.yaw=a+Math.PI;G.camYaw=P.yaw;e.yaw=a;P.oni=cp.oni||0;G.card=null;w0Fight(true)}
 G.cp={chap:G.chap,wave:0,mi:0,oni:P.oni,met:W0.met}}
function w0Unload(){if(W0.nav0)V8D.nav=W0.nav0;W0.on=false;W0.fight=false;W0.silence=0;W0.loudT=0;W0.scar=null;w0DarkSet(0);W0.dark=0;if(W0.door){scene.remove(W0.door.g);W0.door=null}MZTR.m.visible=false;MZTR.pts.length=0;
 for(const f of W0.fx){if(f.m)scene.remove(f.m)}W0.fx=[];for(const f of W0.marks)scene.remove(f.m);W0.marks=[];
 const b=W0.boss;if(b&&b.rig){for(const o of[b.rig.kP,b.rig.sP])if(o&&o.parent===scene)scene.remove(o)}W0.boss=null;
 const L=STATIC[0];if(L&&L.userData.w0){L.intensity=0;L.userData.w0=false}}
// кадр локации (из psAnim)
function w0Anim(ts){W0.t+=ts;
 if(W0.motes){const a=W0.motes.geometry.attributes.position;for(let i=0;i<a.count;i+=5){a.setX(i,a.getX(i)+0.004*ts);a.setY(i,a.getY(i)+Math.sin(W0.t*0.02+i)*0.002);if(a.getX(i)>40)a.setX(i,-30)}a.needsUpdate=true}
 if(W0.ash&&W0.ph>=2){W0.ash.visible=true;W0.ash.material.opacity=Math.min(0.85,W0.ash.material.opacity+0.004*ts);const a=W0.ash.geometry.attributes.position,b=W0.boss;W0.ash.position.set(b?b.x:0,(b&&b.gy)||0,b?b.z:0);
  for(let i=0;i<a.count;i++){let y=a.getY(i)-0.012*ts;a.setX(i,a.getX(i)+Math.sin(W0.t*0.013+i)*0.006);if(y<0){y=12}a.setY(i,y)}a.needsUpdate=true}
 w0DarkUpd(ts);w0WaterUpd(ts);updW0Fx(ts);if(W0.door)w0DoorUpd(W0.door,ts)}
// темнота фазы 3: туман, круг света вокруг героя
function w0DarkSet(k){W0.dark=k;W0.darkT=k}
function w0DarkUpd(ts){if(!LV||!LV.w0)return;const T=THEMES.w0,k=W0.dark=lerp(W0.dark||0,W0.darkT||0,0.02*ts),f=scene.fog;
 if(f&&f.color){f.color.setRGB(lerp(0.56,0.05,k),lerp(0.57,0.04,k),lerp(0.6,0.05,k));f.density=lerp(T.dens,0.11,k)}
 if(scene.background&&scene.background.setRGB)scene.background.setRGB(lerp(0.55,0.02,k),lerp(0.56,0.02,k),lerp(0.6,0.03,k));
 hemi.intensity=lerp(T.hemi[2],0.12,k);moon.intensity=lerp(T.moon[1],0.05,k);for(const m of W0.mats||[])m.emissiveIntensity=lerp(0.5,0.06,k);if(W0.sky)W0.sky.visible=k<0.6;
 const L=STATIC[0];if(k>0.05){L.position.set(P.x,GY+3.2,P.z);L.color.set(0xffe8c8);L.distance=7;L.decay=1.8;L.intensity=3.4*k;L.userData.base=0}else if(L.userData.w0){L.intensity=0}L.userData.w0=k>0.05}
// ======================================================================
// ---------- Мудзин: ИИ (слух вместо зрения), атаки, фазы
// e.ms — подсостояние, e.mt — кадры в нём; позы задаются в e.pz (сглаживание к e.pose в mzSync)
const MZ_OPEN=new Set(['breath','kneel','dizzy','stun','ultOpen']);
function mzInitBoss(e){Object.assign(e,{ph:1,post:0,postMax:220,hx:e.x,hz:e.z,hT:999,cd:70,chain:0,ultCD:0,leftH:0,pk:0.3,walk:0,wph:0,mv:0,rdy:0,ms:'wait',mt:0,thrCD:0,grabT:0,quiet:0,flinch:0,glint:0,trail:0,trailW:1,noPad:false,sayaBroken:false,eyes:false,hide:false,vul:1,tauntT:300});
 e.max=e.hp;const r=e.rig;if(r.S&&!r.eyes){const hb=r.S.bones.head,m=new THREE.SpriteMaterial({map:TX.dot,color:0xff2a10,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,transparent:true});r.eyes=[];
  for(const sx of[-1,1]){const s=new THREE.Sprite(m);s.scale.setScalar(0.07);s.position.set(sx*0.034,0.065,0.1);s.visible=false;hb.add(s);r.eyes.push(s)}}}
function mzGo(e,ms,K){e.ms=ms;e.mt=0;e.hA=e.hB=e.hC=e.hD=0;e.pk=0.3;if(K)Object.assign(e,K)}
function mzFace(e,x,z,k){e.yaw=turn(e.yaw,Math.atan2(x-e.x,z-e.z),k)}
const mzFwd=(e,dx,dz)=>{const d=Math.hypot(dx,dz)||1;return(dx*fwdX(e.yaw)+dz*fwdZ(e.yaw))/d};
const mzDY=e=>Math.abs((P.y+GY)-(e.y+(e.gy||0)));
function mzSay(t,force){const e=W0.boss;if(!e)return;if(!force&&e.tauntT>0)return;e.tauntT=600;say('Мудзин',t)}
// шум, который издаёт игрок (0 — тишина): бег, прыжок, уворот, удары, еда; медленный шаг (C / CapsLock) и стояние — тихо
function w0Noise(){if(P.state==='dead')return 0;const s=P.state;let n=0;
 if(s==='run')n=(P.gait>0.5||W0.loudT>0)?1:0;if(P.air||P.y>0.06)n=Math.max(n,1.3);
 if(s==='dodge')n=1.5;else if(s==='atk'||s==='charge'||s==='dive')n=1.3;else if(s==='eat')n=2;else if(s==='absorb')n=0.6;else if(s==='hurt')n=1;else if(s==='draw'||s==='sheathe')n=0.7;else if(s==='issen')n=2;
 return n}
// перемещение «суриаси» к точке (по навигации)
function mzMove(e,x,z,sp,ts,face=0.07){const dx=x-e.x,dz=z-e.z,L=Math.hypot(dx,dz);if(L<0.05)return 0;let ux=dx/L,uz=dz/L;
 if(L>1.2&&!psLine(e._pk,e.x,e.z,x,z)&&Math.hypot(x-P.x,z-P.z)<1.5){const s=psSteer(e);if(s){ux=s[0];uz=s[1]}}
 e.yaw=turn(e.yaw,Math.atan2(ux,uz),face*ts);const v=Math.min(L,sp*ts);e.x+=ux*v;e.z+=uz*v;e.mv=Math.max(e.mv,sp);return v}
function mzHit(e,dmg,o={}){if(P.state==='dead')return'none';const r=hitPlayer(e,dmg,o);if(r==='hit'){if(e.ph===1&&Math.random()<0.4)mzSay(Math.random()<0.5?'Медленно.':'Громко дышишь.');if(o.stun){P.hurtT=Math.max(P.hurtT||0,o.stun)}}return r}
// точка на линии удара
function mzSegD(x0,z0,x1,z1,px,pz){const sx=x1-x0,sz=z1-z0,l=sx*sx+sz*sz||1,t=clamp(((px-x0)*sx+(pz-z0)*sz)/l,0,1);return Math.hypot(px-(x0+sx*t),pz-(z0+sz*t))}
function mzPick(e,d){const ph=e.ph,sb=e.sayaBroken,r=Math.random();
 if(P.state==='eat'){if(d<4.2&&!sb)return'cross';if(d>=4.2&&ph>=2)return'storm';return d<3.4?'click':'thrust'}
 if(d<=3.3){if(ph===1)return r<0.55?'click':r<0.78&&!sb?'cane':'listen';
  if(ph===2)return r<0.32?'click':r<0.5&&!sb?'cross':r<0.64&&!sb?'cane':r<0.84?'mill':'listen';
  return r<0.45?'click':r<0.72?'mill':r<0.84&&!sb?'cross':'listen'}
 if(d<=16){if(ph===1)return d>4.5&&e.thrCD<=0?'thrust':null;if(d>6&&r<0.4)return'storm';return d>4.2?'thrust':null}
 return null}
function mzStart(e,k){e.chain++;e.cdK=k;
 if(k==='click')mzGo(e,'click',{crit:0});else if(k==='thrust'){mzGo(e,'thrust',{n2:e.ph>=2?1:0,tlT:54,ln:null});e.thrCD=e.ph===1?720:240}
 else if(k==='cane')mzGo(e,'cane');else if(k==='cross')mzGo(e,'cross');else if(k==='mill')mzGo(e,'mill');else if(k==='listen')mzGo(e,'listen',{lT:e.ph===1?120:180});else if(k==='storm')mzGo(e,'storm')}
function mzEnd(e){if(e.chain>=3||e.dashL>=10){e.chain=0;e.dashL=0;mzGo(e,'breath');return}mzGo(e,'idle');e.cd=e.ph===1?rnd(45,85):e.ph===2?rnd(28,55):rnd(22,45)}
const MZ_SP=e=>e.d.spd/60*(e.ph>=2?1.4:1);
function updMudzin(e,ts,d,ty){const r=e.rig;e.st+=ts;
 {const gy=psGround(e);e.gy=e.gy==null?gy:lerp(e.gy,gy,0.3)}
 e.mv=0;if(e.tauntT>0)e.tauntT-=ts;if(e.glint>0)e.glint-=ts;if(e.thrCD>0)e.thrCD-=ts;if(e.flinch>0)e.flinch-=ts;
 if(e.state!=='mz'){e.inv=1;e.vx=e.vz=0;mzLoco(e,ts);return}
 e.inv=0;e.mt+=ts;const ph=e.ph,dx=P.x-e.x,dz=P.z-e.z,dd=Math.hypot(dx,dz)||1;
 // слух
 const n=W0.loudT>0&&P.state==='run'?1:w0Noise();W0.nv=lerp(W0.nv,n>0?1:0,0.15);
 if((n>0&&dd<32)||dd<1.8){e.hx=P.x;e.hz=P.z;e.hT=0}else e.hT+=ts;
 const knows=e.hT<25;
 if(P.state==='dead'&&e.ms!=='idle'&&!/ph|ult/.test(e.ms)){mzGo(e,'idle')}
 const M=e.ms,t=e.mt;
 switch(M){
 case'idle':{e.pk=0.12;if(e.cd>0)e.cd-=ts;if(e.chain&&t>70)e.chain=0;
  e.rdy=lerp(e.rdy,knows&&dd<7?1:0,0.05);
  if(ph===3&&e.ultCD<=0&&knows&&dd<14){mzGo(e,'ult');break}if(e.ultCD>0)e.ultCD-=ts;
  // захват: игрок вплотную и бездействует 1.5 с
  if(dd<1.7&&mzFwd(e,dx,dz)>0.3&&P.state!=='atk'&&P.state!=='dodge'&&P.state!=='issen'){e.grabT+=ts;if(e.grabT>90){e.grabT=0;e.chain++;mzGo(e,'grab');break}}else e.grabT=Math.max(0,e.grabT-ts*2);
  if(!knows){if(e.hT>240){mzGo(e,'search');break}
   const L=Math.hypot(e.hx-e.x,e.hz-e.z);if(L>1.5)mzMove(e,e.hx,e.hz,MZ_SP(e)*0.5,ts)}
  else{const a=angDiff(e.yaw,Math.atan2(dx,dz));if(Math.abs(a)>1.25){mzGo(e,'turn');break}
   if(e.cd<=0&&P.state!=='dead'){const k=mzPick(e,dd);if(k){mzStart(e,k);break}}
   if(P.state==='eat'&&e.cd>10)e.cd=10;
   if(dd>2.4)mzMove(e,P.x,P.z,MZ_SP(e)*(dd>8?0.85:0.6),ts);else{mzFace(e,P.x,P.z,0.08);if(dd<1.2){const v=MZ_SP(e)*0.4*ts;e.x-=dx/dd*v;e.z-=dz/dd*v;e.mv=MZ_SP(e)*0.4}}
   if(ph===1&&P.state==='run'&&P.gait>0.5&&dd<9)mzSay('Громко дышишь.')}
  const base=mzMix(MZP.idle,MZP.sheath,e.rdy);if(e.rdy>0.5!==!!e.rdyS){e.rdyS=e.rdy>0.5;SFX.draw&&SFX.draw(!e.rdyS)}
  base.sp=[base.sp[0]+Math.sin(e.st*0.05)*0.02,base.sp[1],base.sp[2]];e.pz=e.flinch>0?mzMix(base,MZP.hurtL,Math.min(1,e.flinch/8)):base;break}
 case'turn':{e.pk=0.25;e.yaw=turn(e.yaw,Math.atan2(e.hx-e.x,e.hz-e.z),0.11*ts);e.mv=0.02;e.pz=MZP.idle;if(t>=24)mzGo(e,'idle');break}
 case'search':{e.pk=0.15;const L=Math.hypot(e.hx-e.x,e.hz-e.z);if(L>0.8)mzMove(e,e.hx,e.hz,MZ_SP(e)*0.35,ts,0.04);
  e.pz=mzOver(MZP.search,{nk:[0.1,Math.sin(t*0.045)*0.9,0.3]});if(knows){mzGo(e,'turn');break}if(t>=180){mzGo(e,'listen',{lT:150})}break}
 case'click':mzClick(e,ts,t,dd,dx,dz);break;
 case'cross':mzCross(e,ts,t,dd,dx,dz);break;
 case'thrust':mzThrust(e,ts,t,dd,dx,dz);break;
 case'cane':mzCane(e,ts,t,dd,dx,dz);break;
 case'mill':mzMill(e,ts,t,dd,dx,dz);break;
 case'listen':mzListen(e,ts,t,dd,dx,dz,n);break;
 case'storm':mzStorm(e,ts,t,dd,dx,dz);break;
 case'grab':mzGrab(e,ts,t,dd,dx,dz);break;
 case'breath':{e.pk=0.12;e.pz=mzOver(MZP.breath,{sp:[0.55+Math.sin(t*0.25)*0.06,0.2,0]});if(t===ts||t<=ts)mzSay('…Хх.',1);if(t>=90)mzGo(e,'idle',{cd:20});break}
 case'kneel':{e.pk=0.2;e.pz=t<20?MZP.skid:MZP.kneel;if(t>=120){mzGo(e,'idle');e.cd=25}break}
 case'dizzy':{e.pk=0.1;e.pz=mzOver(MZP.dizzy,{h:[Math.sin(t*0.09)*0.07,0.84,0],hr:[0.1,0.3+Math.sin(t*0.07)*0.25,0.12]});e.yaw+=Math.sin(t*0.06)*0.006*ts;if(t>=120){mzWeapBack(e);mzGo(e,'idle');e.cd=20}break}
 case'stun':{e.pk=0.2;e.pz=MZP[e.stunP||'hurtL'];if(t>=(e.stunT||60)){mzWeapBack(e);mzGo(e,'idle');e.cd=15}break}
 case'ph2':case'ph3':mzPhaseTick(e,ts,t);break;
 case'ult':mzUlt(e,ts,t,dd);break;
 case'die':{e.inv=1;e.pk=0.1;e.pz=MZP.kneel;break}
 case'ultOpen':{e.pk=0.12;e.pz=mzOver(MZP.breath,{sp:[0.6+Math.sin(t*0.3)*0.08,0.2,0]});if(t>=240){mzGo(e,'idle');e.cd=30;e.ultCD=1200}break}
 }
 mzLoco(e,ts)}
function mzLoco(e,ts){e.walk=lerp(e.walk||0,e.mv>0.004?1:0,0.15);e.wph=(e.wph||0)+Math.min(0.09,e.mv)*ts*7.5;
 const tgt=e.pz||MZP.idle;let p=e.pose?mzMix(e.pose,tgt,Math.min(1,e.pk*ts)):tgt;p.ka=tgt.ka;p.sa=tgt.sa;p.Lk=tgt.Lk;p.two=tgt.two;p.twoS=tgt.twoS;p.Kpole=tgt.Kpole;p.fp=tgt.fp;e.pose=p}
function mzWeapBack(e){}
// ---------- 1. Щелчок: теллс 0.5 с (рука на рукояти, блик), удар 0.15 с — веер 120° на 3 м, восстановление 0.8 с
function mzClick(e,ts,t,dd,dx,dz){const T0=e.crit?6:30;
 if(t<T0){e.pk=0.35;mzFace(e,P.x,P.z,0.12*ts);e.pz=MZP.sheath;if(t<=ts)e.glint=T0;return}
 if(t<T0+9){e.pk=1;e.pz=mzMix(MZP.sheath,MZP.clickEnd,clamp((t-T0)/9,0,1));e.trail=12;e.trailW=e.crit?1.6:1;
  if(!e.hA){e.hA=1;SFX.iai&&SFX.iai();if(dd<3.3&&mzFwd(e,dx,dz)>0.48&&mzDY(e)<1.3){mzHit(e,e.crit?40:22,{issen:!e.crit})}}return}
 if(t<T0+30){e.pk=0.25;e.pz=MZP.chiburi;return}
 if(t<T0+58){e.pk=0.2;e.pz=MZP.sheath;if(!e.hB){e.hB=1;SFX.draw&&SFX.draw(false)}return}
 if(e.ph===1&&!e.crit&&Math.random()<0.3){mzGo(e,'listen',{lT:110});return}mzEnd(e)}
// ---------- 2. Крест: X над головой 0.7 с, удар ножнами (стан) и катаной через 0.2 с, X-царапина 2 с
function mzCross(e,ts,t,dd,dx,dz){
 if(t<42){e.pk=0.2;mzFace(e,P.x,P.z,0.1*ts);e.pz=MZP.crossUp;if(t<=ts){SFX.charge&&SFX.charge();e.glint=40}return}
 if(t<54){e.pk=0.9;e.pz=mzMix(MZP.crossUp,MZP.crossDown,clamp((t-42)/8,0,1));e.trail=10;
  if(!e.hA&&t>=46){e.hA=1;SFX.swingL&&SFX.swingL();if(dd<2.9&&mzFwd(e,dx,dz)>0.3&&mzDY(e)<1.3)mzHit(e,12,{issen:true,stun:60})}
  if(!e.hB&&t>=52){e.hB=1;SFX.swingR&&SFX.swingR();if(dd<3.1&&mzFwd(e,dx,dz)>0.3&&mzDY(e)<1.3)mzHit(e,22,{issen:true});const x=e.x+fwdX(e.yaw)*1.7,z=e.z+fwdZ(e.yaw)*1.7;w0Scar(e,x,z,e.yaw)}return}
 if(t<100){e.pk=0.15;e.pz=t<75?MZP.crossDown:MZP.idle;return}mzEnd(e)}
// ---------- 3. Укол Пустоты: 0.9 с спиной к игроку (красная леска), рывок 8–15 м (неуязвим), промах вбок -> 2 с на коленях
function mzThrust(e,ts,t,dd,dx,dz){const tl=e.tlT||54;
 if(t<tl){e.pk=0.18;const a=Math.atan2(dx,dz);e.yaw=turn(e.yaw,a+Math.PI,0.12*ts);e.pz=MZP.thrustTell;
  if(t<=ts){SFX.charge&&SFX.charge();e.dashD=null}
  if(t<tl-10){const L=clamp(dd+3,8,15);e.dashA=a;e.dashL0=L}
  if(!e.ln){e.ln=w0Line(0,0,0,0,0,0,tl+10,0xff1a10,0.018)}const y=(e.gy||0)+1.25,L=e.dashL0;w0LineSet(e.ln,e.x,y,e.z,e.x+Math.sin(e.dashA)*L,(GY+P.y)+0.9,e.z+Math.cos(e.dashA)*L);e.ln.k=0.35+0.65*(t/tl);return}
 if(t<tl+12){e.inv=1;e.pk=1;e.pz=MZP.thrustDash;e.trail=14;e.trailW=1.3;const a=e.dashA;e.yaw=a;
  if(!e.dashD){e.dashD={x0:e.x,z0:e.z,hit:0};SFX.zan&&SFX.zan();G.shake=Math.max(G.shake,0.12);if(e.ln)e.ln.life=e.ln.t+14}
  const sp=e.dashL0/12,x0=e.x,z0=e.z;e.x+=Math.sin(a)*sp*ts;e.z+=Math.cos(a)*sp*ts;psClamp(e);
  if(!e.dashD.hit&&mzSegD(x0,z0,e.x,e.z,P.x,P.z)<0.95&&mzDY(e)<1.4){e.dashD.hit=1;const r=mzHit(e,32,{issen:true});e.dashD.res=r}
  if(G.frame%2===0)dustQ(e.x,(e.gy||0),e.z,2);return}
 if(t<tl+12+ts*1.01){e.ln=null;const d0=e.dashD;e.dashL=(e.dashL||0)+Math.hypot(e.x-d0.x0,e.z-d0.z0);
  if(e.n2>0){e.n2--;mzGo(e,'thrust',{tlT:20,n2:e.n2,ln:null,dashL:e.dashL});e.chain++;return}
  if(d0.res!=='hit'&&d0.res!=='issen'&&d0.res!=='block'){mzGo(e,'kneel');pop('Укол мимо — он на коленях!','#ffd27a');return}}
 if(t<tl+40){e.pk=0.15;e.pz=MZP.chiburi;return}mzEnd(e)}
// ---------- 4. Трость: тычок (стан 1 с) -> подсечка (прыгай) -> рукоять в висок -> всегда Укол
function mzCane(e,ts,t,dd,dx,dz){mzFace(e,P.x,P.z,(t<20||t>34&&t<46||t>64&&t<74?0.12:0.03)*ts);
 if(t<20){e.pk=0.25;e.pz=MZP.cane;return}
 if(t<34){e.pk=0.6;e.pz=MZP.canePoke;if(!e.hA&&t>=26){e.hA=1;SFX.swingL&&SFX.swingL();if(dd<2.8&&mzFwd(e,dx,dz)>0.5&&mzDY(e)<1.3)mzHit(e,8,{issen:true,stun:60})}return}
 if(t<46){e.pk=0.3;e.pz=MZP.cane;return}
 if(t<64){e.pk=0.5;e.pz=MZP.caneSweep;if(!e.hB&&t>=56){e.hB=1;SFX.swingR&&SFX.swingR();dustQ(e.x+fwdX(e.yaw),(e.gy||0),e.z+fwdZ(e.yaw),3);if(dd<2.7&&mzFwd(e,dx,dz)>0.2&&P.y<0.3)mzHit(e,12,{stun:45})}return}
 if(t<74){e.pk=0.3;e.pz=MZP.cane;return}
 if(t<92){e.pk=0.5;e.pz=MZP.caneHilt;if(!e.hC&&t>=84){e.hC=1;SFX.impact&&SFX.impact(0.6);if(dd<1.9&&mzFwd(e,dx,dz)>0.3&&mzDY(e)<1.3)mzHit(e,15,{issen:true})}return}
 e.chain++;mzGo(e,'thrust',{n2:e.ph>=2?1:0,tlT:40,ln:null})}
// ---------- 5. Мельница: ножны в землю (теллс 1.1 с), 2 оборота — колени (прыгай) и шея (уворот), без блока; затем 2 с шатается
function mzMill(e,ts,t,dd,dx,dz){
 if(t<66){e.pk=0.2;mzFace(e,P.x,P.z,0.08*ts);e.pz=e.hA?MZP.millTell:mzOver(MZP.millTell,{sa:'L'});if(!e.hA&&t>=18){e.hA=1;const lx=Math.cos(e.yaw),lz=-Math.sin(e.yaw);mzStick(e,'s',e.x+lx*0.55-fwdX(e.yaw)*0.2,e.z+lz*0.55-fwdZ(e.yaw)*0.2,e.yaw,0.15);SFX.slam&&SFX.slam();dustQ(e.x,(e.gy||0),e.z,4)}if(t>40)e.glint=4;return}
 if(t<126){const low=t<96,k=((t-66)%30)/30;e.pk=1;e.pz=low?MZP.millLow:MZP.millHigh;e.yaw+=Math.PI*2/30*ts;e.trail=8;e.trailW=1.2;
  const right=e.yaw-Math.PI/2,ap=Math.atan2(dx,dz),flag=low?'hB':'hC';if(t>=66+ts&&(t-66)%30<ts*1.01)SFX.bigSwing?SFX.bigSwing():SFX.swingR&&SFX.swingR();
  if(!e[flag]&&Math.abs(angDiff(right,ap))<0.45&&dd<3.4){e[flag]=1;if(low){if(P.y<0.35&&mzDY(e)<1.2)mzHit(e,22,{unblock:true})}else if(mzDY(e)<1.5)mzHit(e,24,{unblock:true})}return}
 if(t<130){mzGo(e,'dizzy');pop('Он шатается — бей!','#ffd27a')}}
// ---------- 6. Стойка Слуха: до 3 с, кольца звука; удар спереди -> парирование -> крит-Щелчок; шум рядом -> мгновенный Щелчок
function mzListen(e,ts,t,dd,dx,dz,n){e.pk=0.12;e.pz=mzOver(MZP.listen,{nk:[0.2,-0.5+Math.sin(t*0.03)*0.2,0.45]});
 if(Math.floor(t/36)!==Math.floor((t-ts)/36))ringQ(e.x,(e.gy||0)+0.06,e.z,0.4,6.5,0xff6a40,46);
 if(t>12&&n>0&&dd<3.4){mzFace(e,P.x,P.z,1);mzGo(e,'click',{crit:0});e.mt=18;return}
 if(t>12&&n>0&&dd>=3.4&&dd<14&&e.ph>=2&&Math.random()<0.02){mzGo(e,'thrust',{n2:0,tlT:30,ln:null});return}
 if(t>=(e.lT||150))mzEnd(e)}
// ---------- 7. Гроза: меч в землю, трещина ползёт к игроку — перепрыгни
function mzStorm(e,ts,t,dd,dx,dz){
 if(t<48){e.pk=0.2;mzFace(e,P.x,P.z,0.1*ts);e.pz=MZP.stormUp;if(t<=ts){SFX.charge&&SFX.charge();e.glint=48}return}
 if(t<58){e.pk=0.8;e.pz=MZP.stormDown;e.trail=8;
  if(!e.hA&&t>=54){e.hA=1;const fx=fwdX(e.yaw),fz=fwdZ(e.yaw),x=e.x+fx*1.25,z=e.z+fz*1.25;mzStick(e,'k',x,z,e.yaw,0.25);SFX.slam&&SFX.slam();SFX.thunder&&SFX.thunder(0.6);G.shake=Math.max(G.shake,0.3);dustQ(x,(e.gy||0),z,10);
   sparkA(x,(e.gy||0)+0.1,z,24,[2.6,0.5,0.3],5);w0Crack(e,x,z,Math.atan2(P.x-x,P.z-z))}if(e.hA)e.pz=mzOver(MZP.stormDown,{ka:'G'});return}
 if(t<100){e.pk=0.2;e.pz=mzOver(MZP.stormDown,{ka:'G'});return}
 if(t<124){e.pk=0.18;e.pz=MZP.idle;return}mzEnd(e)}
// ---------- захват «Прощальные Объятия»: шёпот, удар лбом в нос, шаги громкие 10 с
function mzGrab(e,ts,t,dd,dx,dz){
 if(t<16){e.pk=0.5;mzFace(e,P.x,P.z,0.2*ts);e.pz=mzOver(MZP.grab,{ka:'R',sa:'L'});return}
 if(!e.hA){e.hA=1;if(dd<2.0&&P.state!=='dodge'&&P.state!=='issen'&&P.invT<=0&&P.state!=='dead'){e.caught=1;P.state='hurt';P.t=0;P.hurtT=200;P.atk=null;say('Мудзин','Я слышу, как боится твоё сердце.');SFX.grab&&SFX.grab()}else e.caught=0}
 if(!e.caught){if(t<46){e.pk=0.2;e.pz=MZP.idle;return}mzEnd(e);return}
 if(t<92){e.pk=0.3;e.pz=t<70?mzOver(MZP.grab,{ka:'R',sa:'L'}):mzOver(MZP.headbutt,{ka:'R',sa:'L'});const fx=fwdX(e.yaw),fz=fwdZ(e.yaw);P.x=lerp(P.x,e.x+fx*0.72,0.3);P.z=lerp(P.z,e.z+fz*0.72,0.3);P.yaw=e.yaw+Math.PI;P.state='hurt';P.hurtT=Math.max(P.hurtT||0,30);return}
 if(!e.hB){e.hB=1;P.invT=0;P.hurtT=0;const r=hitPlayer(e,20,{unblock:true});SFX.impact&&SFX.impact(1);G.shake=Math.max(G.shake,0.35);G.flashRed=18;P.vx=fwdX(e.yaw)*0.16;P.vz=fwdZ(e.yaw)*0.16;P.hurtT=40;W0.loudT=600;pop('Шаги звучат громко — 10 с','#ff9a8a')}
 if(t<120){e.pk=0.2;e.pz=MZP.idle;return}mzEnd(e)}
// ---------- переходы фаз
function mzPhase(e,k){if(e.ph>=k||/^ph/.test(e.ms))return;if(e.ln){e.ln.life=0;e.ln=null}if(P.state==='hurt'&&e.caught){P.hurtT=0}e.caught=0;mzGo(e,'ph'+k);e.chain=0;G.slow=Math.max(G.slow,30);G.slowTs=0.35;SFX.bell&&SFX.bell()}
function mzPhaseTick(e,ts,t){e.inv=1;const ev=(f,fn)=>{if(t>=f&&t-ts<f)fn()};
 if(e.ms==='ph2'){
  e.pk=0.15;e.pz=t<30?MZP.idle:t<100?MZP.unpad:MZP.idle;
  ev(2,()=>say('Мудзин','Хорошо… Наконец-то ты звучишь как воин.'));
  ev(62,()=>{e.noPad=true;SFX.clang&&SFX.clang();const b=e.rig.S&&e.rig.S.bones.armR;const m=new Mesh(new THREE.BoxGeometry(0.26,0.07,0.3),e.rig.padM&&e.rig.padM[0]?e.rig.padM[0].material.clone():new MS({color:0x2a2420}));if(b)b.getWorldPosition(m.position);else m.position.set(e.x,(e.gy||0)+1.5,e.z);
   w0Debris(m,-Math.cos(e.yaw)*0.03,0.04,Math.sin(e.yaw)*0.03,e.gy||0);W0.ph=2;sparkA(m.position.x,m.position.y,m.position.z,14,[2.4,0.6,0.3],4)});
  ev(110,()=>say('Мудзин','Броня — для тех, кто боится. Я больше не боюсь.'));
  if(t>=130){e.ph=2;W0.ph=2;mzGo(e,'idle');e.cd=25}return}
 // фаза 3: ломает ножны об колено, обломок — на предплечье как щит, срывает повязку, приходит темнота
 const fx=fwdX(e.yaw),fz=fwdZ(e.yaw);
 ev(2,()=>{mzStick(e,'k',e.x+fx*0.8-Math.cos(e.yaw)*0.3,e.z+fz*0.8+Math.sin(e.yaw)*0.3,e.yaw+0.4,0.1);say('Мудзин','Ножны держали меня тридцать лет. Хватит.')});
 e.pk=0.18;e.pz=t<44?MZP.breakUp:t<70?MZP.breakDown:t<150?mzOver(MZP.unmask,{ka:'G'}):MZP.idle;
 ev(56,()=>{if(!e.sayaBroken)mzSayaBreak(e,true)});
 ev(108,()=>{e.eyes=true;w0Ribbon(e);w0DarkSet(1);SFX.wind&&SFX.wind('duel',1);G.shake=Math.max(G.shake,0.15)});
 ev(126,()=>say('Мудзин','Темнота — мой дом. Добро пожаловать, Акира.'));
 ev(140,()=>say('Юки','Он погасил свет… Держись круга, слушай его шаги!'));
 if(t>=170){e.ph=3;W0.ph=3;mzGo(e,'idle');e.cd=40;e.ultCD=90}}
function mzSayaBreak(e,cs){const r=e.rig;e.sayaBroken=true;if(r.sB){r.sB.updateMatrixWorld(true);const m=r.sB.clone();m.material=r.sB.material.clone();r.sB.getWorldPosition(m.position);r.sB.getWorldQuaternion(m.quaternion);w0Debris(m,rnd(-0.02,0.02),0.05,rnd(-0.02,0.02),e.gy||0)}
 SFX.zan&&SFX.zan();SFX.clang&&SFX.clang();G.shake=Math.max(G.shake,0.2);r.sP.getWorldPosition(_zw1);sparkA(_zw1.x,_zw1.y,_zw1.z,20,[2.2,1.4,0.6],5);
 if(!cs){pop('Ножны сломаны!','#ffd27a');say('Мудзин','…Ты сломал их. Мои старые ножны.');mzGo(e,'stun',{stunT:100,stunP:'hurtL'})}}
// ---------- ульта «Пять Мгновений Смерти»
function mzUlt(e,ts,t,dd){e.inv=t>=24?1:0;const ev=(f,fn)=>{if(t>=f&&t-ts<f)fn()};
 if(t<24){e.pk=0.3;e.pz=MZP.sheath;return}
 ev(24,()=>{e.hide=true;smokeQ(e.x,(e.gy||0),e.z,18);SFX.warp&&SFX.warp();W0.silence=150;say('Юки','Он исчез… Тише. Слушай!')});
 const S0=150,ST=42;
 for(let i=0;i<5;i++){const s=S0+i*ST;
  ev(s,()=>{const two=i===4;e.ud=[];let a0=rnd(0,Math.PI*2);for(let q=0;q<(two?2:1);q++){let best=null;for(let k=0;k<10;k++){const a=a0+k*0.63+(q?Math.PI/2:0),ax=P.x+Math.sin(a)*5.5,az=P.z+Math.cos(a)*5.5,n=psFind(ax,GY,az,1);if(n<0)continue;const c=psCen(n);if(Math.hypot(c[0]-ax,c[1]-az)<0.7&&Math.abs(psH(n)-GY)<1.2){best=a;break}}if(best==null)best=a0+q*Math.PI/2;
    const ax=P.x+Math.sin(best)*5.5,az=P.z+Math.cos(best)*5.5,bx=P.x-Math.sin(best)*5.5,bz=P.z-Math.cos(best)*5.5,y=GY+1.1;e.ud.push({ax,az,bx,bz,hit:0,ln:w0Line(ax,y,az,bx,y,bz,30,0xff1a10,0.016)})}
   SFX.lockIn?SFX.lockIn():SFX.heart&&SFX.heart()});
  ev(s+22,()=>{const u=e.ud[0];e.hide=false;e._pk=null;e.x=u.ax;e.z=u.az;psClamp(e);e.gy=psGround(e);e.yaw=Math.atan2(u.bx-u.ax,u.bz-u.az);SFX.iai&&SFX.iai();for(const v of e.ud)v.ln.k=1.6})}
 const k=Math.floor((t-S0)/ST),u0=t-S0-k*ST;
 if(k>=0&&k<5&&u0>=22&&u0<30&&e.ud){e.pk=1;e.pz=MZP.thrustDash;e.trail=10;e.trailW=1.5;const w=(u0-22)/8;
  for(let q=0;q<e.ud.length;q++){const u=e.ud[q],x=lerp(u.ax,u.bx,w),z=lerp(u.az,u.bz,w);if(q===0){const x0=e.x,z0=e.z;e.x=x;e.z=z;e.yaw=Math.atan2(u.bx-u.ax,u.bz-u.az);psClamp(e);if(!u.hit&&mzSegD(x0,z0,e.x,e.z,P.x,P.z)<0.95){u.hit=1;mzHit(e,18,{issen:true})}}
   else{sparkA(x,GY+1.0,z,3,[2.5,0.3,0.2],2);if(!u.hit&&Math.hypot(P.x-x,P.z-z)<0.95){u.hit=1;mzHit(e,18,{issen:true})}}}
  if(u0+ts>=30&&k<4){e.hide=true;smokeQ(e.x,(e.gy||0),e.z,8)}}
 if(t>=S0+4*ST+34){e.hide=false;mzGo(e,'ultOpen');pop('Он открыт — 4 секунды!','#ffd27a');say('Мудзин','…Пять. Ты всё ещё дышишь?')}}
// ---------- урон по боссу: стороны, броня, парирование, стойка
function mzDmg(e,dmg,dx,dz,o={}){
 if(e.dead||e.ms==='die')return;if(e.state!=='mz')return;if(e.inv&&!o.force)return;
 const px=P.x-e.x,pz=P.z-e.z,dd=Math.hypot(px,pz)||1,f=(px*fwdX(e.yaw)+pz*fwdZ(e.yaw))/dd,lx=(px*Math.cos(e.yaw)-pz*Math.sin(e.yaw))/dd;
 const side=(!dx&&!dz&&!o.force)?'n':f>0.55?'F':f<-0.45?'B':lx>0?'L':'R';
 const a=P.atk,heavy=!!(o.force||(a&&(a.type==='N'||(a.knock||0)>=6))||dmg>=45);
 // иссэн во время ульты — прерывает её
 if(o.force){if(e.ms==='ult'){e.hide=false;for(const u of e.ud||[])if(u.ln)u.ln.life=0;e.ultCD=1200}e.hp-=dmg;dmgFxOnly(e,dx,dz);if(e.hp<=0)return killEnemy(e,dx,dz,o);mzPhaseCk(e);if(!/^ph/.test(e.ms)){mzGo(e,'stun',{stunT:80,stunP:'kneel'});pop('Иссэн! Мудзин на колене','#ffd27a')}return}
 if(e.ms==='listen'&&side==='F'){sparks((e.x+P.x)/2,1.35,(e.z+P.z)/2,160);SFX.clang&&SFX.clang();G.hitstop=6;G.slow=Math.max(G.slow,18);G.slowTs=0.3;
  P.state='hurt';P.t=0;P.hurtT=24;P.vx=-px/dd*0.07;P.vz=-pz/dd*0.07;P.atk=null;pop('Парирование! Не бей спереди в Стойке','#ff9a8a');mzFace(e,P.x,P.z,1);mzGo(e,'click',{crit:1});return}
 let m=1,post=1;
 if(side==='R'&&e.ph===1&&!e.noPad){m=0.2;post=0;sparks(e.x-Math.cos(e.yaw)*0.3,1.45,e.z+Math.sin(e.yaw)*0.3,60,[0.7,0.7,0.8]);SFX.clang&&SFX.clang();if(G.frame-(W0.armT||-999)>90){W0.armT=G.frame;pop('Броня справа — бей слева','#b8b8c8')}}
 if(side==='L'){post=2;if(heavy&&!e.sayaBroken&&e.ph<3){e.leftH++;if(e.leftH>=5){mzSayaBreak(e,false)}}}
 if(side==='B'){if(e.ms==='search'){m=2.5;pop('Удар в спину ×2.5','#ffd27a');post=3}else m=1.3}
 if(MZ_OPEN.has(e.ms)||(e.ms==='click'&&e.mt>(e.crit?6:30)+9))m*=1.3;
 dmg=Math.max(1,Math.round(dmg*m));e.hT=0;e.hx=P.x;e.hz=P.z;
 const r=dmgEnemy0(e,dmg,dx,dz,{...o,stagT:0,noBlock:true,stop:post?o.stop:1});if(e.ms==='die'||e.hp<=0)return r;e.state='mz';
 if(post&&!/^ph|ult|grab|die/.test(e.ms)){e.post+=dmg*post;if(e.post>=e.postMax){e.post=0;mzGo(e,'stun',{stunT:80,stunP:'hurtL'});pop('Стойка Мудзина сломлена!','#ffd27a')}
  else if(e.ms==='search'&&side==='B'){mzGo(e,'stun',{stunT:60,stunP:'hurtL'})}
  else if(e.ms==='idle'||e.ms==='turn'||e.ms==='search')e.flinch=10}
 mzPhaseCk(e);return r}
function dmgFxOnly(e,dx,dz){e.flash=6;G.hitstop=Math.max(G.hitstop,6);SFX.hit&&SFX.hit(true);G.shake=Math.max(G.shake,0.15);tar(e.x,e.d.h*0.6,e.z,14)}
function mzPhaseCk(e){const k=e.hp/e.max;if(e.ph===1&&k<0.7)mzPhase(e,2);else if(e.ph===2&&k<0.3)mzPhase(e,3)}
function mzDie(e,dx,dz,o){if(e.ms==='die')return;e.hp=0;e.ms='die';e.mt=0;e.inv=1;e.hide=false;G.bossBar=null;W0.fight=false;W0.silence=0;if(e.ln){e.ln.life=0;e.ln=null}
 for(const u of e.ud||[])if(u.ln)u.ln.life=0;G.slow=Math.max(G.slow,60);G.slowTs=0.25;G.shake=0.25;SFX.bell&&SFX.bell();setTimeout0(()=>mzDeathCS(e),50)}
// ---------- эффекты главы: леска, X-царапина, трещина Грозы, волна, обломки, повязка
const W0G={box:new THREE.BoxGeometry(1,1,1),pl:new THREE.PlaneGeometry(1,1)};
function w0Fx(f){f.t=0;W0.fx.push(f);if(f.m&&!f.m.parent)scene.add(f.m);return f}
function updW0Fx(ts){for(const f of W0.fx){f.t+=ts;if(f.upd&&f.upd(f,ts)===false)f.life=0;if(f.t>=f.life)f.dead=true}
 for(let i=W0.fx.length-1;i>=0;i--){const f=W0.fx[i];if(!f.dead)continue;if(f.m){scene.remove(f.m);if(f.own)f.m.traverse(o=>{if(o.material)o.material.dispose()})}W0.fx.splice(i,1)}}
function w0Line(x1,y1,z1,x2,y2,z2,life,col,w){const m=new Mesh(W0G.box,new MB({color:col,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));m.renderOrder=14;m.frustumCulled=false;
 const f=w0Fx({m,life,own:1,w,k:1,upd:(f)=>{const fl=0.75+0.25*Math.sin(f.t*0.9);f.m.material.opacity=Math.min(1,f.k*fl*Math.min(1,(f.life-f.t)/8));f.m.scale.x=f.m.scale.y=f.w*(0.8+0.6*f.k)}});w0LineSet(f,x1,y1,z1,x2,y2,z2);return f}
function w0LineSet(f,x1,y1,z1,x2,y2,z2){const m=f.m,L=Math.hypot(x2-x1,y2-y1,z2-z1)||0.01;m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.lookAt(x2,y2,z2);m.scale.set(f.w,f.w,L)}
function w0Scar(e,x,z,yaw){const g=new Group(),mat=new MB({color:0xff3018,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
 const gy=psGroundAt(x,z,e.gy||0);for(const s of[-1,1]){const p=new Mesh(W0G.pl,mat);p.scale.set(2.6,0.09,1);p.rotation.set(-Math.PI/2,0,yaw+s*Math.PI/4+Math.PI/2);g.add(p)}g.position.set(x,gy+0.04,z);
 W0.scar={x,z,gy,t:0,waved:0};sparkA(x,gy+0.1,z,16,[2.6,0.4,0.2],4);
 w0Fx({m:g,life:120,own:1,upd:f=>{mat.opacity=0.9*Math.min(1,(f.life-f.t)/30);if(W0.scar){W0.scar.t=f.t;if(f.t+1>=f.life)W0.scar=null}}})}
function psGroundAt(x,z,y){const k=psFind(x,y,z,1);return k<0?y:psH(k)}
// трещина: голова ползёт по навигации к точке игрока (на момент удара), сегменты — тёмные с красной сердцевиной
function w0Crack(e,x,z,a){const g=new Group(),dk=new MB({color:0x140804,transparent:true,opacity:0.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),rd=new MB({color:0xff2a10,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const h={x,z,_pk:null,gy:e.gy||0};psClamp(h);let L=0,last=0,hit=0;const ux=Math.sin(a),uz=Math.cos(a),MAX=18;
 w0Fx({m:g,life:260,own:1,upd:(f,ts)=>{if(L<MAX&&f.t<90){const sp=0.24*ts,ox=h.x,oz=h.z;h.x+=ux*sp+rnd(-0.03,0.03);h.z+=uz*sp+rnd(-0.03,0.03);psClamp(h);const mv=Math.hypot(h.x-ox,h.z-oz);if(mv<sp*0.3)L=MAX;L+=sp;h.gy=psGround(h);
   if(L-last>0.32){last=L;for(const [mt,w] of[[dk,0.22],[rd,0.05]]){const p=new Mesh(W0G.pl,mt);p.scale.set(w*(0.7+Math.random()*0.6),0.4,1);p.rotation.set(-Math.PI/2,0,-a+rnd(-0.4,0.4));p.position.set(h.x,h.gy+0.03+(w<0.1?0.005:0),h.z);g.add(p)}
    fxA(FX.norm,{x:h.x+rnd(-.3,.3),y:h.gy+0.1,z:h.z+rnd(-.3,.3),vx:rnd(-1,1)/60,vy:rnd(0.5,1.5)/60,vz:rnd(-1,1)/60,drag:0.96,life:rnd(30,50),s:rnd(0.3,0.5),grow:1.4,r:0.3,gg:0.27,b:0.24,a:0.35},0);if(Math.random()<0.5)fxA(FX.add,{x:h.x,y:h.gy+0.05,z:h.z,vx:rnd(-0.5,0.5)/60,vy:rnd(1,3)/60,vz:rnd(-0.5,0.5)/60,life:rnd(20,40),s:0.04,r:2.4,gg:0.4,b:0.2},0)}
   if(!hit&&Math.hypot(P.x-h.x,P.z-h.z)<0.85&&Math.abs(GY-h.gy)<1){if(P.y<0.3){hit=1;mzHit(e,26,{unblock:true,stun:30});G.shake=Math.max(G.shake,0.2)}}}
  const k=Math.min(1,(f.life-f.t)/60);dk.opacity=0.9*k;rd.opacity=k*(0.7+0.3*Math.sin(f.t*0.5))}})}
// волна по X-царапине, если игрок ест рядом
function w0Wave(e,x,z,gy){const h={x,z,_pk:null,gy};psClamp(h);let hit=0;SFX.thunder&&SFX.thunder(0.4);pop('Он слышит, как ты ешь!','#ff9a8a');
 w0Fx({life:120,upd:(f,ts)=>{const dx=P.x-h.x,dz=P.z-h.z,d=Math.hypot(dx,dz)||1;h.x+=dx/d*0.2*ts;h.z+=dz/d*0.2*ts;psClamp(h);h.gy=psGround(h);if(Math.floor(f.t/4)!==Math.floor((f.t-ts)/4))ringQ(h.x,h.gy+0.08,h.z,0.2,1.4,0xff4020,22);
  if(!hit&&d<0.9){hit=1;mzHit(e,24,{unblock:true,stun:40});return false}}})}
function w0Debris(m,vx,vy,vz,gy){m.castShadow=true;const s={vx,vy,vz,rx:rnd(-0.1,0.1),rz:rnd(-0.1,0.1),rest:0};w0Fx({m,life:900,own:1,upd:(f,ts)=>{if(s.rest)return;s.vy-=0.006*ts;m.position.x+=s.vx*ts;m.position.y+=s.vy*ts;m.position.z+=s.vz*ts;m.rotation.x+=s.rx*ts;m.rotation.z+=s.rz*ts;
 if(m.position.y<gy+0.05){m.position.y=gy+0.05;s.vy=Math.abs(s.vy)>0.03?-s.vy*0.3:0;s.vx*=0.6;s.vz*=0.6;s.rx*=0.5;s.rz*=0.5;if(!s.vy&&Math.hypot(s.vx,s.vz)<0.003)s.rest=1;dustQ(m.position.x,gy,m.position.z,1)}}})}
// повязка: тёмная лента, ветер уносит её
function w0Ribbon(e){W0.ribbon=true;const r=e.rig,g=new THREE.PlaneGeometry(0.7,0.06,10,1),m=new Mesh(g,new MS({color:0x1a1512,roughness:0.9,side:THREE.DoubleSide}));
 if(r.S)r.S.bones.head.getWorldPosition(m.position);else m.position.set(e.x,(e.gy||0)+1.75,e.z);m.position.y+=0.05;const P0=g.attributes.position,b=P0.array.slice();
 w0Fx({m,life:420,own:1,upd:(f,ts)=>{m.position.x+=0.03*ts;m.position.y+=(0.012-f.t*0.00003)*ts;m.position.z+=Math.sin(f.t*0.03)*0.012*ts;m.rotation.y+=0.03*ts;m.rotation.x=Math.sin(f.t*0.07)*0.6;
  for(let i=0;i<P0.count;i++){const x=b[i*3];P0.setZ(i,Math.sin(x*9+f.t*0.35)*0.08*(x+0.35))}P0.needsUpdate=true}})}
// ---------- дверь (процедурная): рама, створка на петле справа, кольцо-ручка слева, белый свет за ней
function w0MkDoor(x,y,z,yaw){const g=new Group();g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);
 const mk=(c,r,mt)=>new MS({color:c,roughness:r,metalness:mt||0,transparent:true,opacity:0}),wood=mk(0x4a3424,0.82),dark=mk(0x221810,0.9),iron=mk(0x34343a,0.38,0.85);
 const box=(w,h,d,m,px,py,pz,par)=>{const o=new Mesh(W0G.box,m);o.scale.set(w,h,d);o.position.set(px,py,pz);(par||g).add(o);o.castShadow=true;return o};
 box(0.14,2.42,0.18,dark,-0.62,1.21,0);box(0.14,2.42,0.18,dark,0.62,1.21,0);box(1.52,0.16,0.22,dark,0,2.44,0);box(1.38,0.05,0.24,dark,0,0.025,0);
 const white=new Mesh(W0G.pl,new MB({color:0xffffff,transparent:true,opacity:0,toneMapped:false,side:THREE.DoubleSide,depthWrite:false}));white.scale.set(1.1,2.32,1);white.position.set(0,1.18,-0.035);g.add(white);
 const pv=new Group();pv.position.set(0.55,0,0.02);g.add(pv);
 box(1.08,2.3,0.06,wood,-0.55,1.18,0,pv);for(const yy of[0.42,1.18,1.94])box(1.0,0.08,0.03,dark,-0.55,yy,0.045,pv);for(const yy of[0.3,2.05])box(0.22,0.05,0.035,iron,-0.12,yy,0.05,pv);
 const ring=new Mesh(new THREE.TorusGeometry(0.07,0.013,8,18),iron);ring.position.set(-0.97,1.0,0.085);pv.add(ring);box(0.06,0.06,0.03,iron,-0.97,1.08,0.05,pv);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.dot,color:0xfff2dc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.scale.set(3.4,4.2,1);glow.position.set(0,1.2,0.25);g.add(glow);
 return{g,pv,ring,white,glow,mats:[wood,dark,iron],open:0,openT:0,fade:0,fadeT:1,crumble:0,shake:0}}
function w0DoorUpd(d,ts){d.open=lerp(d.open,d.openT,Math.min(1,0.05*ts));d.pv.rotation.y=d.open+(d.shake>0?Math.sin(d.shake*1.9)*0.035:0);if(d.shake>0)d.shake-=ts;
 if(d.crumble>0){d.crumble+=ts;d.fade=Math.max(0,1-d.crumble/70);if(Math.random()<0.9*ts){d.g.localToWorld(_zw1.set(rnd(-0.6,0.6),rnd(0,2.4),rnd(-0.1,0.3)));fxA(FX.norm,{x:_zw1.x,y:_zw1.y,z:_zw1.z,vx:rnd(-0.4,0.4)/60,vy:rnd(-0.5,0.3)/60,vz:rnd(-0.4,0.4)/60,g:0.02/60,drag:0.97,life:rnd(40,80),s:rnd(0.05,0.14),r:0.22,gg:0.16,b:0.11,a:0.8},0)}
  if(d.crumble>85){scene.remove(d.g);if(W0.door===d)W0.door=null;return}}
 else d.fade=lerp(d.fade,d.fadeT,Math.min(1,0.035*ts));
 for(const m of d.mats){m.opacity=d.fade;m.depthWrite=d.fade>0.5}
 if(d.fade<0.97&&d.fadeT>0.5&&!d.crumble&&Math.random()<0.8*ts){const a=rnd(0,Math.PI*2);d.g.localToWorld(_zw1.set(Math.cos(a)*0.9,rnd(0,2.5),Math.sin(a)*0.5));fxA(FX.add,{x:_zw1.x,y:_zw1.y,z:_zw1.z,vx:rnd(-0.2,0.2)/60,vy:rnd(0.2,0.8)/60,vz:rnd(-0.2,0.2)/60,life:rnd(30,60),s:rnd(0.02,0.05),r:1.6,gg:1.5,b:1.9},0)}
 const L=clamp(d.open/1.1,0,1)*d.fade;d.white.material.opacity=L;d.glow.material.opacity=L*0.85;
 if(L>0.05){d.g.localToWorld(_zw1.set(0,1.3,0.6));flashA(_zw1.x,_zw1.y,_zw1.z,0xfff0d8,L*7,2)}}
// ---------- глава 9 -> 10: после зачистки герой идёт к лестнице галереи, появляется дверь
function w0DoorCS(){PS.req=1;const N=psFlow(),D=N.dist;TP.lid=1;TP.nar=[];TP.ov=null;
 const tk=psFind(8.1,4.96,-3.1,1),path=[];
 if(tk>=0&&D[tk]>=0){let cur=tk,g=0;path.push(cur);while(D[cur]>0&&g++<6000){let nx=-1;for(let d=0;d<4;d++){const m=N.nb[cur*4+d];if(m>=0&&D[m]===D[cur]-1){nx=m;break}}if(nx<0)break;cur=nx;path.push(cur)}path.reverse()}
 const ks=path.filter((p,i)=>i%2===0||i===path.length-1),pts=ks.map(psCen);
 let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
 const S={i:0,pts,ks,ph:pts.length?0:1,t0:1,jump:null,tj:null,cp:null,done:0};
 if(len>15){let rem=0,j=pts.length-1;while(j>0&&rem<7){rem+=Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]);j--}S.jump=j}
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1}
 const go=()=>{if(S.done)return;S.done=1;P.csPose=null;TP.ov={c:'255,255,255',a:1};csEnd();const ci=CH.findIndex(c=>c&&c.w0);loadChapter(ci);G.card=null;G.subs=[];w0ArriveCS()};
 csStart('tpW0door',t=>{CS.bars=1;if(W0.door)w0DoorUpd(W0.door,1);psClamp(P);
  const fx=fwdX(P.yaw),fz=fwdZ(P.yaw);
  if(S.ph===0){
   if(S.jump!=null){if(t<30){TP.ov={c:'0,0,0',a:ek(t,0,28)};return}const p=pts[S.jump];P.x=P._px=p[0];P.z=P._pz=p[1];P._pk=ks[S.jump];GY=psGround(P);S.i=S.jump+1;S.jump=null;S.tj=t;S.cp=null}
   if(S.tj!=null)TP.ov={c:'0,0,0',a:1-ek(t,S.tj,S.tj+30)};
   if(!CS.H.to&&S.i<pts.length){CS.H.to=pts[S.i++];CS.H.spd=0.036;CS.H.gait=0;S.st=0}
   if(CS.H.to){S.st=(S.st||0)+1;if(S.st>45){const k=S.ks[S.i-1];P.x=P._px=CS.H.to[0];P.z=P._pz=CS.H.to[1];P._pk=k;GY=psGround(P);CS.H.to=null}}
   if((!CS.H.to&&S.i>=pts.length)||t>1500){S.ph=1;S.t0=t+1;CS.H.to=null}
   const T={x:P.x,y:GY+1.3,z:P.z},C={x:P.x-fx*3.4,y:GY+2.1,z:P.z-fz*3.4};psCam(T,C);if(!S.cp)S.cp=new V3(C.x,C.y,C.z);else S.cp.lerp(_zw1.set(C.x,C.y,C.z),0.06);cam([S.cp.x,S.cp.y,S.cp.z],[T.x,T.y,T.z]);
   if(t===40&&len>2)csSay('Юки','Акира… наверху, у галереи. Чувствуешь? Воздух дрожит.',40,170);return}
  const u=t-S.t0;
  if(u===0){let a=P.yaw,ok=false,gy=GY;for(const off of[0,0.5,-0.5,1,-1,1.6,-1.6,2.3,-2.3,Math.PI]){const b=P.yaw+off,cx=P.x+Math.sin(b)*1.75,cz=P.z+Math.cos(b)*1.75,n=psFind(cx,GY+0.2,cz,1);if(n<0)continue;const c=psCen(n);
    if(Math.hypot(c[0]-cx,c[1]-cz)<0.5&&Math.abs(psH(n)-GY)<0.5&&!psSolid(cx,GY+1.2,cz)&&!psSolid(cx,GY+2.0,cz)&&psLine(P._pk,P.x,P.z,cx,cz)){a=b;ok=true;gy=psH(n);break}}
   S.a=a;S.dx=Math.sin(a);S.dz=Math.cos(a);S.D=[P.x+S.dx*1.75,P.z+S.dz*1.75];if(W0.door)scene.remove(W0.door.g);W0.door=w0MkDoor(S.D[0],gy,S.D[1],a+Math.PI);CS.H.yaw=a;CS.H.yawK=0.1;SFX.warp&&SFX.warp();console.log('W0 door',ok,S.D)}
  const d=W0.door,dx=S.dx,dz=S.dz,mx=P.x+dx*0.9,mz=P.z+dz*0.9,lx=dz,lz=-dx;
  if(u===0){const T={x:mx,y:GY+1.3,z:mz};let best=-1;
   const cand=[[lx*2.6-dx*1.2,lz*2.6-dz*1.2,1.65],[-lx*2.6-dx*1.2,-lz*2.6-dz*1.2,1.65],[lx*1.2-dx*3,lz*1.2-dz*3,1.9],[-lx*1.2-dx*3,-lz*1.2-dz*3,1.9],[lx*2.2+dx*0.6,lz*2.2+dz*0.6,1.5],[-lx*2.2+dx*0.6,-lz*2.2+dz*0.6,1.5]];
   for(const c of cand){const f=psRay(T,c[0],c[2]-1.3,c[1]);if(f>best+0.05){best=f;S.co=c}}}
  {const c=S.co,T={x:mx,y:GY+1.2,z:mz},C={x:mx+c[0],y:GY+c[2],z:mz+c[1]};if(u>=380){C.x=P.x-dx*2.4+lx*0.4;C.z=P.z-dz*2.4+lz*0.4;C.y=GY+1.75;T.x=S.D[0];T.z=S.D[1]}psCam(T,C);if(!S.cp2)S.cp2=new V3(C.x,C.y,C.z);else S.cp2.lerp(_zw1.set(C.x,C.y,C.z),0.05);cam([S.cp2.x,S.cp2.y,S.cp2.z],[T.x,T.y,T.z])}
  if(u===20)csSay('Юки','Акира… смотри. Этой двери здесь не было.',20,140);
  if(u===150){csSay('Акира','Дверь… посреди галереи? За ней — свет.',150,270);CS.H.to=[S.D[0]-dx*0.62,S.D[1]-dz*0.62];CS.H.spd=0.02;CS.H.gait=0}
  if(u>=250&&u<400)P.csPose={p:POSE.reach,w:ek(u,250,290)*(1-ek(u,380,400))};
  if(u===296){d.shake=26;SFX.lockTurn&&SFX.lockTurn();csSay('Акира','Заперто?..',296,350)}
  if(u===356){d.openT=1.85;SFX.door&&SFX.door();SFX.lidCreak&&SFX.lidCreak();CS.H.fly=[-dx*0.025,-dz*0.025];G.shake=0.05}
  if(u===380)csSay('Юки','Свет… Иди, Акира. Я рядом.',380,470);
  if(u===405){CS.H.to=[S.D[0]+dx*0.6,S.D[1]+dz*0.6];CS.H.spd=0.026}
  if(u>=400)TP.ov={c:'255,255,255',a:ek(u,400,470)};
  if(u>=480)go()},go)}
// ---------- прибытие: та же дверь в восточной стене дома Варёнам
// ---------- v0.21: диалоги — длительность от длины реплики, ЛКМ — следующая реплика
const dlgDur=t=>Math.round(120+t.length*4.8);
function dlgMake(L,k0=0){let k=k0;return L.map(l=>{const d=l.d||(l.t?dlgDur(l.t):60),o=Object.assign({},l,{a:k,b:k+d});k+=d+(l.gap??18);return o})}
function dlgTick(S,D,k){let i=-1;for(let q=0;q<D.length;q++)if(k>=D[q].a)i=q;W0.dlgHint=i>=0&&k<D[D.length-1].b?2:0;
 if(i!==S.li){S.li=i;S.sub=null;if(i>=0){const l=D[i];if(l.t){csSay(l.n,l.t,CS.t,CS.t+(l.b-l.a));S.sub=CS.subs[CS.subs.length-1]}if(l.on)l.on()}}
 if(i>=0&&MP[0]&&k-D[i].a>22&&k<D[i].b){const j=D[i+1],add=(j?j.a:D[i].b)-k;S.add=(S.add||0)+add;if(S.sub)S.sub.b=CS.t}
 return i}
const dlgEnd=D=>D[D.length-1].b;
// кадры диалога: mz — лицо Мудзина, ak — лицо Акиры, ot — через плечо Акиры, om — через плечо Мудзина, wide — общий
const _zh1=new V3(),_zh2=new V3();
function w0Shot(m,e,k){const gy=e.gy||0;if(e.rig&&e.rig.S){e.rig.S.bones.head.getWorldPosition(_zh1)}else _zh1.set(e.x,gy+1.7,e.z);const B=_zh1,A=_zh2.set(P.x,GY+(P.csRx?0.35:1.6),P.z);
 let ux=P.x-e.x,uz=P.z-e.z;const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const lx=uz,lz=-ux;k=clamp(k,0,1);
 if(m==='mz')cam([B.x+ux*1.75+lx*0.6,B.y-0.04,B.z+uz*1.75+lz*0.6],[B.x,B.y-0.06,B.z],k,[B.x+ux*1.4+lx*0.42,B.y-0.02,B.z+uz*1.4+lz*0.42],[B.x,B.y-0.04,B.z]);
 else if(m==='ak')cam([A.x-ux*1.55-lx*0.55,A.y,A.z-uz*1.55-lz*0.55],[A.x,A.y-0.04,A.z],k,[A.x-ux*1.3-lx*0.4,A.y+0.02,A.z-uz*1.3-lz*0.4],[A.x,A.y-0.02,A.z]);
 else if(m==='ot')cam([A.x+ux*1.25+lx*0.62,A.y+0.18,A.z+uz*1.25+lz*0.62],[B.x,B.y-0.12,B.z],k,[A.x+ux*1.0+lx*0.55,A.y+0.12,A.z+uz*1.0+lz*0.55],[B.x,B.y-0.08,B.z]);
 else if(m==='om')cam([B.x-ux*1.2-lx*0.6,B.y+0.15,B.z-uz*1.2-lz*0.6],[A.x,A.y-0.1,A.z],k,[B.x-ux*1.0-lx*0.5,B.y+0.1,B.z-uz*1.0-lz*0.5],[A.x,A.y-0.06,A.z]);
 else{const mx=(A.x+B.x)/2,mz=(A.z+B.z)/2;cam([mx+lx*5.2,gy+1.9,mz+lz*5.2],[mx,gy+1.0,mz],k,[mx+lx*4.4+ux*1.2,gy+1.6,mz+lz*4.4+uz*1.2],[mx,gy+1.0,mz])}}
function w0ShotT(D,i,k,e){if(i<0)return false;const l=D[i];if(!l.cam)return false;w0Shot(l.cam,e,ek(k,l.a,l.a+Math.max(240,l.b-l.a)));return true}
// ---------- прибытие: дверь в стене дома, Акира выходит, дверь закрывается и рассыпается; камера — на реку
function w0ArriveCS(){const D=W0D.door;TP.lid=1;TP.nar=[];TP.ov={c:'255,255,255',a:1};
 P.x=D[0];P.z=D[1];P._pk=null;psClamp(P);GY=psGround(P);const gy=GY;
 let ux=6.5-D[0],uz=11.5-D[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;let wx=D[0]+ux*0.8,wz=D[1]+uz*0.8;
 for(let s=2;s<60;s++){const x=D[0]+ux*s*0.1,z=D[1]+uz*s*0.1;if(psSolid(x,gy+1.2,z)){wx=x;wz=z;break}}
 let nx=D[0]-wx,nz=D[1]-wz;const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;const lx=nz,lz=-nx;
 if(W0.door)scene.remove(W0.door.g);const d=W0.door=w0MkDoor(wx+nx*0.06,gy,wz+nz*0.06,Math.atan2(nx,nz));d.open=d.openT=1.85;d.fade=d.fadeT=1;
 P.x=wx+nx*0.3;P.z=wz+nz*0.3;P.yaw=Math.atan2(nx,nz);G.camYaw=P.yaw;P.drawn=false;P.state='idle';
 const e=W0.boss,S={},fin=()=>{W0.dlgHint=0;if(W0.door){scene.remove(W0.door.g);W0.door=null}P.x=D[0]+nx*1.8;P.z=D[1]+nz*1.8;P._pk=null;psClamp(P);GY=psGround(P);TP.ov=null;csEnd();W0.hint=1100;if(!G.card)G.card={t:0,title:'ГЛАВА 10',name:'Пустые глаза'}};
 const DL=dlgMake([{n:'Акира',t:'…Где я? Это не сон. Пахнет дождём и сталью.'},{n:'Юки',t:'Старая школа Варёнам. Здесь учили меч — пока не пришла тьма.'},
  {n:'Юки',t:'Внизу, у реки… кто-то стоит прямо на воде. И не двигается.',on:()=>{S.bt=S.k}},{n:'Акира',t:'Он ждёт меня. Я это чувствую.',on:()=>{if(!G.card)G.card={t:0,title:'ГЛАВА 10',name:'Пустые глаза'}}}],150);
 csStart('tpW0arr',t=>{CS.bars=1;if(Math.hypot(P.x-D[0],P.z-D[1])<0.6||t>60)psClamp(P);
  TP.ov={c:'255,255,255',a:1-ek(t,0,60)};const k=S.k=t+(S.add||0);
  if(t===12){CS.H.to=[D[0]+nx*1.8,D[1]+nz*1.8];CS.H.spd=0.024;CS.H.gait=0}
  if(t===135){d.openT=0;SFX.door&&SFX.door()}if(t===180){d.crumble=1;SFX.warp&&SFX.warp()}
  dlgTick(S,DL,k);
  const C0=[D[0]+nx*4.2+lx*1.5,gy+1.75,D[1]+nz*4.2+lz*1.5],L0=[wx,gy+1.25,wz];
  if(S.bt==null||!e)cam(C0,L0);else{const bx=e.x-P.x,bz=e.z-P.z,bl=Math.hypot(bx,bz)||1;cam(C0,L0,ek(k,S.bt,S.bt+150),[P.x-bx/bl*2.6+lz*0.8,GY+2.4,P.z-bz/bl*2.6-lx*0.8],[e.x,(e.gy||0)+1.1,e.z])}
  if(k>=dlgEnd(DL)+20)fin()},fin)}
// ---------- встреча: самурай бросается на Мудзина и падает разрубленным; разговор; бой
function w0MeetCS(){const e=W0.boss;if(!e||W0.cs)return;W0.cs=1;TP.lid=1;TP.nar=[];TP.ov=null;
 const bx=e.x,bz=e.z,a=Math.atan2(P.x-bx,P.z-bz);let sp=null;
 for(const off of[Math.PI/2,-Math.PI/2,Math.PI*0.7,-Math.PI*0.7,Math.PI*0.35,-Math.PI*0.35,Math.PI]){const sx=bx+Math.sin(a+off)*9,sz=bz+Math.cos(a+off)*9,k=psFind(sx,e.gy||0,sz,1);if(k<0)continue;const c=psCen(k);
  if(Math.hypot(c[0]-sx,c[1]-sz)<1.2&&Math.abs(psH(k)-(e.gy||0))<1.5&&psLine(k,c[0],c[1],bx,bz)){sp=c;break}}
 if(!sp)sp=[bx+Math.sin(a+Math.PI/2)*6,bz+Math.cos(a+Math.PI/2)*6];
 const s=mkEnemy('ash',sp[0],sp[1]);s.state='enter';s.inv=1;s.revived=true;s._pk=null;psClamp(s);s.gy=psGround(s);s.yaw=Math.atan2(bx-s.x,bz-s.z);enemies.push(s);
 const S={k:-1};P.atk=null;if(P.state!=='idle'&&P.state!=='run'){P.state='idle';P.t=0}
 const fin=()=>{if(S.done)return;S.done=1;W0.dlgHint=0;if(!s.dead){s.revived=true;killEnemy(s,0,1,{knock:4})}csEnd();P.csPose=null;if(!P.drawn){startDraw(true)}w0Fight(false)};
 const DL=dlgMake([{n:'Мудзин',t:'Шумный. Как и все, кто приходит за моей головой.',cam:'mz'},{n:'Мудзин',t:'…А вот этот шаг я знаю. Ты ведь Акира?',cam:'mz'},
  {n:'Акира',t:'Откуда ты знаешь моё имя?',cam:'ak'},{n:'Мудзин',t:'Я слышу его в твоих шагах. Твой учитель ходил так же: пятка — и сомнение.',cam:'ot'},
  {n:'Мудзин',t:'Я — Мудзин. Когда-то у меня были глаза. Теперь у меня есть тишина.',cam:'om'},{n:'Мудзин',t:'Мне скучно, Акира. Все звучат одинаково.',cam:'mz'},
  {n:'Мудзин',t:'Покажи свой стиль — я проверю твои умения.',cam:'ot',on:()=>{if(!P.drawn)startDraw(true)}},
  {n:'Юки',t:'Он слепой! Ходи тихо — зажми C. И бей слева: справа у него броня.',cam:'wide'}],95);
 csStart('tpW0meet',t=>{CS.bars=1;CS.H.to=null;const gy=e.gy||0;{const g2=psGround(e);e.gy=lerp(gy,g2,0.3)}
  CS.H.yaw=Math.atan2(e.x-P.x,e.z-P.z);CS.H.yawK=0.08;
  if(S.k<0){s.anim+=1;const dx=e.x-s.x,dz=e.z-s.z,d=Math.hypot(dx,dz)||1;s.yaw=Math.atan2(dx,dz);if(t>25){s.x+=dx/d*0.085;s.z+=dz/d*0.085;psClamp(s);s.gy=lerp(s.gy||0,psGround(s),0.3)}
   if(t===28)csSay('Самурай','Мудзин! За моего брата — умри!',28,200);
   if(d<7)e.yaw=turn(e.yaw,Math.atan2(s.x-e.x,s.z-e.z),0.12);e.pz=d<6?MZP.sheath:MZP.idle;e.pk=0.2;if(d<2.7||t>300){S.k=t;SFX.iai&&SFX.iai()}
   const mx=(e.x+s.x)/2,mz=(e.z+s.z)/2,qx=P.x-e.x,qz=P.z-e.z,ql=Math.hypot(qx,qz)||1;cam([e.x+qx/ql*6.5-qz/ql*2.5,gy+2.6,e.z+qz/ql*6.5+qx/ql*2.5],[mx,gy+1.1,mz])}
  else{const k0=t-S.k,k=k0+(S.add||0);
   if(k0<9){e.pk=1;e.pz=mzMix(MZP.sheath,MZP.clickEnd,k0/8);e.trail=12;if(k0===3){const dx=s.x-e.x,dz=s.z-e.z,d=Math.hypot(dx,dz)||1;killEnemy(s,dx/d,dz/d,{knock:9});tar(s.x,1.2,s.z,30,1.6);G.shake=0.25;SFX.zan&&SFX.zan();e.rig.tip.getWorldPosition(_zw1);flashA(_zw1.x,_zw1.y,_zw1.z,0xff5040,5,20)}}
   else if(k0<34){e.pk=0.25;e.pz=MZP.chiburi}else if(k0<70){e.pk=0.2;e.pz=MZP.sheath;if(k0===40)SFX.draw&&SFX.draw(false)}else{e.pk=0.08;e.pz=MZP.idle;e.yaw=turn(e.yaw,Math.atan2(P.x-e.x,P.z-e.z),0.05)}
   if(s.dead)updEnemy(s,1);
   const i=dlgTick(S,DL,k);
   if(i<0){const hx=P.x-e.x,hz=P.z-e.z,hl=Math.hypot(hx,hz)||1,ux=hx/hl,uz=hz/hl,mx=(e.x+s.x)/2,mz=(e.z+s.z)/2;cam([e.x+ux*6.5-uz*2.5,gy+2.6,e.z+uz*6.5+ux*2.5],[mx,gy+1.1,mz],ek(k0,0,90),[e.x+ux*5-uz*3.2,gy+2.0,e.z+uz*5+ux*3.2],[e.x,gy+1.2,e.z])}
   else w0ShotT(DL,i,k,e);
   if(k>=dlgEnd(DL)+10)fin()}
  mzLoco(e,1)},fin)}
function w0Fight(resume){const e=W0.boss;if(!e)return;W0.fight=true;W0.met=true;W0.cs=0;if(G.cp)G.cp.met=true;G.bossBar=e;e.state='mz';e.inv=0;mzGo(e,'idle');e.cd=resume?70:40;e.hT=0;e.hx=P.x;e.hz=P.z;LV.active=true;
 if(!resume)G.card={t:0,title:'ФИНАЛЬНЫЙ БОСС',name:'Мудзин — Пустые глаза'};else say('Мудзин','Снова ты. Сердце бьётся громче, чем в прошлый раз.')}
// ---------- после победы: Мудзин убирает меч и садится в сэйдза; разговор -> воспоминания -> истина -> выбор
function mzDeathCS(e){if(CS.on)csEnd();TP.lid=1;TP.nar=[];TP.ov=null;const sx=e.x,sz=e.z;P.atk=null;if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1}W0.fight=false;w0DarkSet(0);
 {const a=Math.atan2(P.x-sx,P.z-sz),dd=Math.hypot(P.x-sx,P.z-sz);if(dd>3.4||dd<1.8){P.x=sx+Math.sin(a)*2.6;P.z=sz+Math.cos(a)*2.6;P._pk=null;psClamp(P);GY=psGround(P)}}
 const S={},go=()=>{W0.dlgHint=0;TP.ov={c:'255,255,255',a:1};w0MemoCS()};
 const DL=dlgMake([{n:'Акира',t:'Подожди. Что здесь происходит?',cam:'ak'},{n:'Акира',t:'Демоны, брат, двери посреди пустоты… Я ничего не понимаю.',cam:'ot'},
  {n:'Мудзин',t:'Ты спрашиваешь слепого, что он видит?',cam:'mz'},{n:'Акира',t:'Ты знал моё имя. Знал моего учителя. Ответь мне!',cam:'ak'},
  {n:'Мудзин',t:'Я не могу рассказать тебе того, чего ты сам не знаешь.',cam:'mz'},{n:'Мудзин',t:'Вспомни, Акира. Вспомни, как ты сюда пришёл.',cam:'om',on:()=>{S.wt=S.k}}],360);
 csStart('tpW0die',t=>{CS.bars=1;e.hide=false;e.inv=1;const gy=e.gy||0;const k=S.k=t+(S.add||0);
  e.pk=0.06;e.pz=t<70?MZP.kneel:t<150?MZP.idle:t<205?MZP.sheath:t<330?MZP.bow:MZP.seizaB;mzLoco(e,1);
  if(t===150)SFX.draw&&SFX.draw(false);
  CS.H.yaw=Math.atan2(e.x-P.x,e.z-P.z);CS.H.yawK=0.06;
  const fx=fwdX(e.yaw),fz=fwdZ(e.yaw),lx=Math.cos(e.yaw),lz=-Math.sin(e.yaw);
  const i=dlgTick(S,DL,k);
  if(t===20)csSay('Мудзин','…Вот он. Звук, которого я ждал всю жизнь.',20,200);
  if(t===205)csSay('Мудзин','Хороший удар. Сядь. Поговорим, пока тихо.',205,350);
  if(i<0)cam([sx+fx*2.6+lx*1.6,gy+1.5,sz+fz*2.6+lz*1.6],[sx,gy+1.2,sz],ek(t,0,340),[sx+fx*2.0+lx*2.3,gy+1.3,sz+fz*2.0+lz*2.3],[sx,gy+1.0,sz]);else w0ShotT(DL,i,k,e);
  if(S.wt!=null){TP.ov={c:'255,255,255',a:ek(k,S.wt+DL[DL.length-1].b-DL[DL.length-1].a-60,S.wt+DL[DL.length-1].b-DL[DL.length-1].a+10)}}
  if(k>=dlgEnd(DL)+14)go()},go)}
// ---------- воспоминания: быстрые пробежки по всем локациям (без врагов), сепия
const MEMO=[[0,'Пепел Ивате. Здесь всё началось… или это я так решил?'],[1,'Бамбук шептал моё имя. Но откуда лес знал его?'],[2,'Сота. Брат… Почему я не помню его лица до того дня?'],
 [3,'Забытый дом. Ни одна дорога не вела к нему.'],[4,'Родная деревня. Меня знали все — а я никого.'],[5,'Колодец — и пустошь под ним. Разве так бывает?'],
 [6,'Храм, где клинок выбрал меня, а не я его.'],[7,'Дом с деревом посреди зала. Я проснулся там… или уснул?']];
function memoGY(){if(LV.ps1)return psGround(P);if(LV.green&&typeof grGH==='function')return grGH(P.x,P.z);if(LV.temple&&typeof tpGH==='function')return tpGH(P.x,P.z);if(LV.kak&&typeof kakGH==='function')return kakGH(P.x,P.z);return 0}
function memoDir(){let best=null;for(let q=0;q<16;q++){const a=q/16*Math.PI*2+0.2,dx=Math.sin(a),dz=Math.cos(a),o={x:P.x,z:P.z,_pk:P._pk,_px:P.x,_pz:P.z,_nx:P.x,_nz:P.z};let L=0;
  for(let s=0;s<34;s++){const tx=o.x+dx*0.3,tz=o.z+dz*0.3;o.x=tx;o.z=tz;arenaClamp(o,0.5);if(Math.hypot(o.x-tx,o.z-tz)>0.12)break;L+=0.3}
  if(!best||L>best[0])best=[L,a]}return best||[6,0]}
function w0MemoCS(){W0.memo={i:-1};W0.post=false;memoNext()}
function memoNext(){const M=W0.memo;M.i++;if(M.i>=MEMO.length){memoBack();return}
 const[ci,line]=MEMO[M.i];const oni=P.oni;loadChapter(ci);P.oni=oni;G.card=null;G.subs=[];G.bossBar=null;try{renderer.domElement.style.filter='sepia(0.6) saturate(0.75) contrast(1.06) brightness(1.04)'}catch(_){}
 P.drawn=false;P.state='idle';P.t=0;P.hp=P.max;GY=memoGY();const[L,a]=memoDir();const run=Math.min(8.5,Math.max(2.5,L-0.6));const tx=P.x+Math.sin(a)*run,tz=P.z+Math.cos(a)*run;P.yaw=a;
 M.name=CH[ci].name;M.t=0;const S={},nxt=()=>{if(S.gone)return;S.gone=1;memoNext()},T=300;
 csStart('tpW0memo',t=>{CS.bars=1;M.t=t;for(const e of enemies)if(e.rig&&e.rig.root)e.rig.root.visible=false;
  if(t===6){CS.H.to=[tx,tz];CS.H.spd=0.062;CS.H.gait=1}
  arenaClamp(P,0.5);GY=lerp(GY,memoGY(),0.35);
  if(t===14)csSay('Акира',line,14,T-16);
  if(MP[0]&&t>40&&t<T-30){S.cut=t}
  const end=S.cut!=null?S.cut+24:T;
  TP.ov={c:'255,255,255',a:Math.max(1-ek(t,0,22),ek(t,end-24,end))};
  const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw),lx=fz,lz=-fx,k=t/T;
  cam([P.x-fx*3.4+lx*(1.2-k*0.8),GY+1.35+k*0.25,P.z-fz*3.4+lz*(1.2-k*0.8)],[P.x+fx*2.5,GY+1.05,P.z+fz*2.5]);
  if(t>=end)nxt()},()=>{S.gone=1;memoBack()})}
function memoBack(){const M=W0.memo;W0.memo=null;try{renderer.domElement.style.filter=''}catch(_){}const oni=P.oni;loadChapter(8,{met:true,post:true,oni});P.oni=oni;G.card=null;G.subs=[];w0TruthCS()}
// ---------- истина и выбор
function w0TruthCS(){const e=W0.boss;if(!e)return;TP.lid=1;TP.nar=[];TP.ov={c:'255,255,255',a:1};const S={};W0.choice=null;P.drawn=false;P.state='idle';
 const DL=dlgMake([{n:'Акира',t:'…Ничего из этого не связано. Ни одна дорога не вела в другую.',cam:'ak'},
  {n:'Акира',t:'Пепел, бамбук, дом, храм… Я просто просыпался в новом месте.',cam:'ot'},{n:'Акира',t:'Это сон? Всё это — сон?',cam:'ak'},
  {n:'Мудзин',t:'Ты сам узрел истину, Акира. Я лишь слушал, как она звучит.',cam:'mz'},
  {n:'Мудзин',t:'Сон — не ложь. Ложь — то, что ждёт тебя по ту сторону.',cam:'om'},
  {n:'Мудзин',t:'Выбирай. Примешь свой сон — или отринешь его?',cam:'mz'}],40);
 const pick=k=>{if(S.done)return;S.done=1;W0.choice=null;W0.dlgHint=0;SFX.bell&&SFX.bell();if(k===0)w0AcceptCS();else w0RejectCS()};
 csStart('tpW0truth',t=>{CS.bars=1;e.pz=MZP.seizaB;e.pk=0.2;mzLoco(e,1);CS.H.yaw=Math.atan2(e.x-P.x,e.z-P.z);CS.H.yawK=0.1;
  TP.ov={c:'255,255,255',a:1-ek(t,0,50)};const k=S.k=t+(S.add||0);
  if(!W0.choice){const i=dlgTick(S,DL,k);if(i<0)w0Shot('wide',e,t/60);else w0ShotT(DL,i,k,e);if(k>=dlgEnd(DL)){W0.choice={sel:0,t:0};CS.skip=null;W0.dlgHint=0}}
  else{const c=W0.choice;c.t++;w0Shot('wide',e,0.5+0.5*Math.sin(t*0.004));
   if(hit('ArrowLeft')||hit('KeyA')||hit('Digit1')||hit('Numpad1')){if(c.sel!==0)SFX.ui&&SFX.ui();c.sel=0}
   if(hit('ArrowRight')||hit('KeyD')||hit('Digit2')||hit('Numpad2')){if(c.sel!==1)SFX.ui&&SFX.ui();c.sel=1}
   if(c.t>40&&(hit('Enter')||hit('Space')||hit('KeyX')||MP[0]))pick(c.sel)}},()=>pick(0))}
// 1) принять сон
function w0AcceptCS(){const e=W0.boss,S={},end=()=>{W0.dlgHint=0;TP.ov=null;tpEnd('accept')};
 const DL=dlgMake([{n:'Акира',t:'Я принимаю его. Этот сон — мой.',cam:'ak'},{n:'Мудзин',t:'Хорошо. Сон — тоже Путь. Учись в нём, пока не найдёшь дверь сам.',cam:'mz',on:()=>{S.up=S.k}},
  {n:'Мудзин',t:'Каждый клинок здесь — учитель. Каждый враг — урок. Каждая тишина — ответ.',cam:'wide'},
  {n:'Акира',t:'Тогда я буду учиться. Пока не услышу, где выход.',cam:'ot',on:()=>{S.w=S.k}}],20);
 csStart('tpW0accept',t=>{CS.bars=1;const k=S.k=t+(S.add||0);const i=dlgTick(S,DL,k);w0ShotT(DL,i,k,e);
  const u=S.up==null?-1:k-S.up;e.pk=0.06;e.pz=u<0?MZP.seizaB:u<90?MZP.idle:MZP.bow;mzLoco(e,1);if(u>=0&&u<120)e.yaw=turn(e.yaw,Math.atan2(P.x-e.x,P.z-e.z),0.05);
  if(S.w!=null)TP.ov={c:'255,255,255',a:ek(k,S.w+DL[DL.length-1].b-DL[DL.length-1].a-80,S.w+DL[DL.length-1].b-DL[DL.length-1].a+20)};
  if(k>=dlgEnd(DL)+30)end()},end)}
// 2) отринуть сон: Мудзин разочарован и разрубает Акиру пополам; пробуждение дома без памяти
function w0RejectCS(){const e=W0.boss,S={};W0.cut=null;
 const go=()=>{if(S.gone)return;S.gone=1;W0.dlgHint=0;W0.cut=null;TP.ov={c:'0,0,0',a:1};w0WakeCS()};
 const DL=dlgMake([{n:'Акира',t:'Нет. Это не моя жизнь. Я отрину этот сон — и проснусь.',cam:'ak',on:()=>{S.up=S.k}},
  {n:'Мудзин',t:'…Ты мог столькому научиться.',cam:'mz'},{n:'Мудзин',t:'Но отринул всё это. Что за глупость.',cam:'mz',on:()=>{S.cutA=S.k}}],20);
 csStart('tpW0reject',t=>{CS.bars=1;const k=S.k=t+(S.add||0);
  const u=S.up==null?-1:k-S.up;
  if(S.c==null){const i=dlgTick(S,DL,k);w0ShotT(DL,i,k,e);e.pk=0.07;e.pz=u<0?MZP.seizaB:u<80?MZP.idle:MZP.sheath;if(u>=0)e.yaw=turn(e.yaw,Math.atan2(P.x-e.x,P.z-e.z),0.06);
   if(u>=60){const a=Math.atan2(P.x-e.x,P.z-e.z),dd=Math.hypot(P.x-e.x,P.z-e.z);if(dd>2.2){e.x+=Math.sin(a)*0.012;e.z+=Math.cos(a)*0.012;e.mv=0.012;psClamp(e)}}
   if(k>=dlgEnd(DL)){S.c=0;W0.dlgHint=0;CS.skip=null}}
  else{const c=++S.c;
   if(c<26){e.pk=0.3;e.pz=MZP.sheath;w0Shot('om',e,0.6+c/60)}
   else if(c<34){e.pk=1;e.pz=mzMix(MZP.sheath,MZP.clickEnd,(c-26)/7);e.trail=10;w0Shot('om',e,1)}
   else{e.pk=0.2;e.pz=MZP.clickEnd;w0Shot('om',e,1)}
   if(c===27){SFX.iai&&SFX.iai();SFX.zan&&SFX.zan();G.shake=0.35;W0.cut={t:0,img:null,a:-0.38+rnd(-0.06,0.06)};tar(P.x,GY+1.2,P.z,40,1.8);flashA(P.x,GY+1.3,P.z,0xff3020,6,26);W0.silence=600}
   if(W0.cut)W0.cut.t++;
   if(c>=150)go()}
  mzLoco(e,1)},go)}
function w0WakeCS(){const oni=P.oni;try{renderer.domElement.style.filter=''}catch(_){}loadChapter(3);P.oni=oni;G.card=null;G.subs=[];G.bossBar=null;W0.cut=null;
 const R=HR.find(q=>q.id==='bed')||{x0:-1,x1:1,z0:-14,z1:-12};P.x=(R.x0+R.x1)/2;P.z=(R.z0+R.z1)/2+0.5;P.yaw=Math.PI/2;G.camYaw=P.yaw;GY=0;P.drawn=false;P.state='idle';P.hideL=false;
 const S={},end=()=>{W0.dlgHint=0;P.csRx=0;P.y=0;P.csPose=null;TP.ov=null;tpEnd('wake')};const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw);
 const DL=dlgMake([{n:'Акира',t:'…Утро?'},{n:'Акира',t:'Мне снилось что-то… важное. Голос. Вода. Чьи-то пустые глаза…'},{n:'Акира',t:'…Не помню.',on:()=>{S.up=S.k}},
  {n:'Акира',t:'Просто сон. Обычный дом. Обычный день.',on:()=>{S.w=S.k}}],250);
 csStart('tpW0wake',t=>{CS.bars=1;P.csHide=false;for(const e of enemies)if(e.rig&&e.rig.root)e.rig.root.visible=false;const k=S.k=t+(S.add||0);
  const u=S.up==null?-1:k-S.up;
  if(u<0){P.csRx=-1.52;P.y=0.13;P.csPose={p:POSE.rest,w:1};P.csLook=0}else{const q=ek(u,0,60);P.csRx=-1.52*(1-q);P.y=0.13*(1-q);P.csPose={p:POSE.kneel,w:u<70?1:1-ek(u,70,110)};if(u>110){P.csPose=null;P.csLook=Math.sin(u*0.03)*0.5}}
  TP.ov={c:'0,0,0',a:t<30?1:t<70?1-ek(t,30,70):0};
  TP.lid=t<60?0:t<90?0.35*ek(t,60,90):t<108?0.35*(1-ek(t,94,108)):t<150?0.75*ek(t,112,150):t<162?0.75-0.45*ek(t,152,162):Math.min(1,0.3+0.7*ek(t,166,200));
  if(t===50||t===96)SFX.heart&&SFX.heart();
  dlgTick(S,DL,k);
  const hx=P.x-fx*1.72,hz=P.z-fz*1.72;
  if(u<0)cam([hx,GY+0.46,hz],[hx+0.8,GY+5.5,hz+1.6]);
  else cam([P.x+lerp(2.6,1.8,ek(u,0,200)),GY+lerp(0.85,1.5,ek(u,0,200)),P.z-0.6],[P.x,GY+lerp(0.5,1.2,ek(u,0,200)),P.z]);
  if(S.w!=null)TP.ov={c:'0,0,0',a:ek(k,S.w+80,S.w+DL[DL.length-1].b-DL[DL.length-1].a+10)};
  if(k>=dlgEnd(DL)+20)end()},end)}
// ---------- рябь на воде под ногами
const W0WATER=-4.72;
function w0Ripple(x,y,z,s,life=70){const m=new Mesh(W0G.ring||(W0G.ring=new THREE.RingGeometry(0.42,0.5,40)),new MB({color:0xdfe8ee,transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,y+0.03,z);m.scale.setScalar(s*0.3);
 w0Fx({m,life,upd:(f,ts)=>{const k=f.t/f.life;m.scale.setScalar(s*(0.3+k*1.6));m.material.opacity=0.5*(1-k)}})}
function w0WaterUpd(ts){const e=W0.boss;W0.rT=(W0.rT||0)+ts;
 if(e&&!e.hide&&(e.gy||0)<W0WATER){if(W0.rT%46<ts)w0Ripple(e.x,e.gy||0,e.z,1.2,90);if(e.mv>0.01&&W0.rT%9<ts)w0Ripple(e.x+rnd(-0.2,0.2),e.gy||0,e.z+rnd(-0.2,0.2),0.6,40)}
 if(GY<W0WATER&&P.state!=='dead'){const mv=P.state==='run'||P.walk>0.3;if(mv&&W0.rT%(P.gait>0.5?7:13)<ts){w0Ripple(P.x+rnd(-0.15,0.15),GY,P.z+rnd(-0.15,0.15),0.55,45);if(P.gait>0.5)fxA(FX.norm,{x:P.x,y:GY+0.05,z:P.z,vx:rnd(-1,1)/60,vy:rnd(1.2,2.2)/60,vz:rnd(-1,1)/60,life:rnd(20,32),s:rnd(0.03,0.06),r:0.8,gg:0.85,b:0.9,a:0.7},0)}
  if(P.y>0.3)W0.air=1;else if(W0.air){W0.air=0;w0Ripple(P.x,GY,P.z,1.4,60)}}}
// ---------- кадр главы (из updChapter) и HUD
function updW0(ts){if(P.y<0)P.y=0;if(W0.loudT>0)W0.loudT-=ts;if(W0.silence>0)W0.silence-=ts;if(W0.hint>0)W0.hint-=ts;
 const e=W0.boss;if(!e)return;
 if(!W0.met&&!W0.cs&&!CS.on&&P.state!=='dead'&&Math.hypot(P.x-e.x,P.z-e.z)<7.5)w0MeetCS();
 if(W0.fight&&W0.scar&&!W0.scar.waved&&P.state==='eat'&&Math.hypot(P.x-W0.scar.x,P.z-W0.scar.z)<14){W0.scar.waved=1;w0Wave(e,W0.scar.x,W0.scar.z,W0.scar.gy)}}
function drawW0HUD(){if(CS.on)return;X.textAlign='center';
 if(!W0.met){if(W0.hint>0){X.globalAlpha=Math.min(1,W0.hint/60);X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.8)';X.fillText('Спустись к реке. Кто-то ждёт на воде…',W/2,30);X.globalAlpha=1}}
 else if(W0.fight){const n=W0.nv||0,y=H-86;X.font='bold 12px Georgia,serif';X.fillStyle=n>0.5?'rgba(255,120,100,0.9)':'rgba(200,215,230,0.75)';X.fillText(n>0.5?'ОН СЛЫШИТ ТЕБЯ':'ТИШИНА',W/2,y-8);
  X.fillStyle='rgba(0,0,0,0.45)';X.fillRect(W/2-70,y,140,6);X.fillStyle=n>0.5?'#ff6a50':'#8ab0d0';X.fillRect(W/2-70,y,140*Math.max(0.04,n),6);
  if(W0.loudT>0){X.font='12px Georgia,serif';X.fillStyle='#ff9a8a';X.fillText('Шаги громкие: '+Math.ceil(W0.loudT/60)+' с',W/2,y+22)}
  const b=W0.boss;if(b&&b.ms==='search'){X.font='12px Georgia,serif';X.fillStyle='#ffd27a';X.fillText('Он ищет тебя — зайди со спины',W/2,y+38)}}
 X.textAlign='left';X.font='12px Georgia,serif';X.fillStyle='rgba(220,210,235,0.62)';X.fillText('C / CapsLock — тихий шаг · бей слева · Пробел — прыжок',W-420,H-19)}
// ---------- v0.21: поверх катсцен главы — подсказка ЛКМ, название воспоминания, выбор, разрез
function w0DrawCS(){X.save();
 if(W0.memo&&CS.k==='tpW0memo'){const t=W0.memo.t,a=clamp(Math.min((t-16)/30,(286-t)/30),0,1);X.globalAlpha=a;X.textAlign='left';X.font='13px Georgia,serif';X.fillStyle='rgba(120,90,60,0.95)';X.fillText('ВОСПОМИНАНИЕ '+(W0.memo.i+1)+' / '+MEMO.length,40,H*0.115+36);
  X.font='italic 30px Georgia,serif';X.fillStyle='rgba(60,40,24,0.95)';X.fillText(W0.memo.name,40,H*0.115+72);X.globalAlpha=1;
  X.font='13px Georgia,serif';X.fillStyle='rgba(70,50,30,0.6)';X.fillText('ЛКМ — дальше',40,H-16)}
 if(W0.dlgHint){X.textAlign='left';X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.5)';X.fillText('ЛКМ — следующая реплика',26,H-16)}
 const c=W0.choice;if(c){const a=clamp(c.t/40,0,1);X.globalAlpha=a;X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(0,0,W,H);X.textAlign='center';
  X.font='italic 26px Georgia,serif';X.fillStyle='#e8dcc8';X.fillText('Мудзин ждёт ответа',W/2,H*0.25);
  const O=[['Принять свой сон','принять себя','Остаться во сне и учиться, пока не найдёшь выход.'],['Отринуть свой сон','проснуться во лжи','Отказаться от всего, чему мог научиться.']];
  for(let i=0;i<2;i++){const w=Math.min(470,W*0.34),h=Math.min(250,H*0.32),x=W/2+(i?1:-1)*(w/2+24),y=H*0.5,sel=c.sel===i,pul=sel?0.5+0.5*Math.sin(c.t*0.12):0;
   X.fillStyle=sel?'rgba(70,28,22,0.88)':'rgba(18,16,14,0.78)';X.fillRect(x-w/2,y-h/2,w,h);X.strokeStyle=sel?`rgba(255,${110+60*pul},90,1)`:'rgba(200,180,150,0.35)';X.lineWidth=sel?3:1;X.strokeRect(x-w/2,y-h/2,w,h);
   X.font='15px Georgia,serif';X.fillStyle='#b9a27a';X.fillText(String(i+1),x,y-h/2+32);
   X.font='bold 30px Georgia,serif';X.fillStyle=sel?'#ffe0d0':'#d8ccb8';X.fillText(O[i][0],x,y-10);
   X.font='italic 19px Georgia,serif';X.fillStyle=sel?'#ff9a80':'#a8946c';X.fillText('('+O[i][1]+')',x,y+24);
   X.font='15px Georgia,serif';X.fillStyle='rgba(230,220,200,0.78)';X.fillText(O[i][2],x,y+h/2-28)}
  X.font='14px Georgia,serif';X.fillStyle='rgba(230,220,200,0.62)';X.fillText('A / D или ← / → (1 / 2) — выбор   ·   Enter / ЛКМ — подтвердить',W/2,H*0.5+Math.min(250,H*0.32)/2+50);X.globalAlpha=1}
 const q=W0.cut;if(q){if(!q.img){const im=document.createElement('canvas');im.width=W;im.height=H;try{im.getContext('2d').drawImage(renderer.domElement,0,0,W,H)}catch(_){}q.img=im}
  const k=ek(q.t,3,75),a=q.a,cx=W/2,cy=H*0.47,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,L=W*2;X.fillStyle='#000';X.fillRect(0,0,W,H);
  for(const s of[-1,1]){X.save();X.beginPath();X.moveTo(cx-dx*L,cy-dy*L);X.lineTo(cx+dx*L,cy+dy*L);X.lineTo(cx+dx*L+nx*L*s,cy+dy*L+ny*L*s);X.lineTo(cx-dx*L+nx*L*s,cy-dy*L+ny*L*s);X.closePath();X.clip();
   const off=k*H*0.07,sl=k*W*0.06*s;X.translate(nx*off*s+dx*sl,ny*off*s+dy*sl);X.translate(cx,cy);X.rotate(s*k*0.035);X.translate(-cx,-cy);X.globalAlpha=1-ek(q.t,70,125);X.drawImage(q.img,0,0,W,H);X.restore()}
  if(q.t<46){X.globalAlpha=1-q.t/46;X.strokeStyle='#ff3a2a';X.lineWidth=2+9*(1-q.t/46);X.shadowColor='#ff2010';X.shadowBlur=30;X.beginPath();X.moveTo(cx-dx*W,cy-dy*W);X.lineTo(cx+dx*W,cy+dy*W);X.stroke();X.shadowBlur=0}
  if(q.t<10){X.globalAlpha=0.7*(1-q.t/10);X.fillStyle='#fff';X.fillRect(0,0,W,H)}X.globalAlpha=1}
 X.restore();X.textAlign='left'}
