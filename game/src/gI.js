// ---------- ПРЕДМЕТЫ, ИНВЕНТАРЬ (I), СУНДУКИ С ЛУТОМ, КЛЮЧИ, ЗАПИСКА БРАТА
import {NOTE_IMG} from './noteimg.js';
const _tv2=new V3();
const RAR={c:['Обычный','#d8cfb8'],r:['Редкий','#62b0ff'],e:['Легендарный','#ff9a3a'],q:['Сюжетный','#e6c26a']};
const sec=f=>Math.round(f/60)+' с';
const ITEMS={
 gourd:{n:'Тыква «Пламя Феникса»',r:'r',type:'Зелье',max:5,w:0.6,cost:45,desc:'Восстанавливает 60 здоровья и очищает тело от смолы Гэнма.',lore:'Лакированная горлянка. Внутри — саке, настоянное на пепле птицы, что сгорает и возрождается.',stats:[['Здоровье','+60'],['Очищение','смола']],
  use(){if(P.hp>=P.max&&P.tar<=0)return'Здоровье и так полное';P.hp=Math.min(P.max,P.hp+60);P.tar=0;G.tarScreen=0;fxUse(0xff6030);return true}},
 flask:{n:'Флакон «Лунная роса»',r:'c',type:'Зелье',max:5,w:0.4,cost:30,desc:'Восполняет 50 маны для магии перчатки Они.',lore:'Роса, собранная в ночь полнолуния с листьев бамбука. Пахнет холодом.',stats:[['Мана','+50']],
  use(){if(P.mana>=100)return'Мана и так полная';P.mana=Math.min(100,P.mana+50);fxUse(0x4aa8ff);return true}},
 omamori:{n:'Омамори «Хранитель пути»',r:'r',type:'Амулет',max:3,w:0.05,cost:60,desc:'На 40 секунд снижает получаемый урон на 35%.',lore:'Шёлковый мешочек с молитвой храма Ивате. Не открывай — иначе защита уйдёт.',stats:[['Защита','+35%'],['Действует',sec(2400)]],
  use(){G.buf.def=2400;fxUse(0xffd27a);return true}},
 whetstone:{n:'Точильный камень Масамунэ',r:'e',type:'Усиление',max:3,w:0.9,cost:120,desc:'На 45 секунд урон Акацуки и Ёи выше на 30%. Клинки светятся.',lore:'Камень из мастерской великого кузнеца. Говорят, о него точили клинок, рассёкший тень.',stats:[['Урон катан','+30%'],['Действует',sec(2700)]],
  use(){G.buf.dmg=2700;fxUse(0xffa040);SFX.iai();return true}},
 censer:{n:'Курильница предков',r:'r',type:'Ритуал',max:3,w:1.2,cost:80,desc:'Мгновенно заполняет шкалу Они на 50. Дым зовёт души павших.',lore:'Бронзовый коро с тремя ножками. Угли внутри не гаснут уже сто лет.',stats:[['Шкала Они','+50']],
  use(){if(P.oni>=100)return'Шкала Они полна';P.oni=Math.min(100,P.oni+50);fxUse(0xb050ff);return true}},
 scroll:{n:'Свиток «Тень ветра»',r:'e',type:'Техника',max:2,w:0.3,cost:150,desc:'На 30 секунд скорость +25%, уворот не тратит выносливость.',lore:'Техника школы, о которой не осталось записей. Только этот свиток.',stats:[['Скорость','+25%'],['Уворот','без выносливости'],['Действует',sec(1800)]],
  use(){G.buf.spd=1800;fxUse(0x9ae0ff);return true}},
 mask:{n:'Маска Хання',r:'e',type:'Реликвия',max:1,w:0.8,cost:300,desc:'Навсегда +20 к максимуму здоровья. Отдав силу, маска рассыпается пеплом.',lore:'Лик женщины, ставшей демоном от ревности и горя. Внутри выжжено имя: Сота.',stats:[['Макс. здоровье','+20 навсегда']],
  use(){G.maxB=(G.maxB||0)+20;P.max+=20;P.hp+=20;fxUse(0xff4030);return true}},
 bento:{n:'Дзюбако с онигири',r:'c',type:'Еда',max:5,w:0.7,cost:20,desc:'Пополняет запас онигири на 2 (не больше 3).',lore:'Лаковая коробка в два яруса, перевязанная шнуром. Рис ещё тёплый.',stats:[['Онигири','+2']],
  use(){if(P.food>=3)return'Запас онигири полон';P.food=Math.min(3,P.food+2);fxUse(0xfff0d0);return true}},
 key:{n:'Бронзовый ключ',r:'c',type:'Ключ',max:9,w:0.1,cost:5,desc:'Открывает сундук, запечатанный о-фуда. Тратится при открытии.',lore:'Гэнма носили его в смоле вместо сердца. Бронза ещё тёплая.',stats:[['Открывает','1 сундук']],use(){return'Подойди к сундуку и нажми X'}},
 note:{n:'Записка брата',r:'q',type:'Записка',max:1,w:0.01,cost:0,desc:'Последние слова Соты и старая фотография. Можно перечитать.',lore:'Бумага промокла от дождя у колокола.',stats:[['Можно','прочитать']],use(){readNote(false);return 'keep'}},
 map:{n:'План Забытого дома',r:'q',type:'Карта',max:1,w:0.1,cost:0,desc:'План усадьбы с пометками «?» — там спрятано ценное. M — открыть карту.',lore:'Тушь выцвела, но пометки свежие. Кто-то хотел, чтобы их нашли.',stats:[['Клавиша','M']],use(){if(LV&&LV.house){INV.open=false;G.mapOpen=true;return'keep'}return'Карта нужна только в доме'}},
 housekey:{n:'Ключ от Забытого дома',r:'q',type:'Ключ',max:1,w:0.3,cost:0,desc:'Кованый ключ с родовым моном. Открывает дверь дома за двором колокола.',lore:'Сота носил его на шнуре у сердца.',stats:[['Открывает','дверь дома']],use(){return'Подойди к двери дома и нажми X'}},
 yoihilt:{n:'Рукоять Ёи',r:'q',type:'Реликвия',max:1,w:0.4,cost:0,desc:'Всё, что осталось от левой катаны. Лазурит в навершии ещё тёплый.',lore:'Ёи сломалась, пронзив Мукуро-муся. Отец говорил: клинок отдаёт себя один раз.',stats:[['Клинок','сломан']],use(){return'Ёи не вернуть… пока'}},
 tea:{n:'Чаша маття «Тихий сад»',r:'c',type:'Зелье',max:5,w:0.3,cost:25,desc:'20 секунд восстанавливает по 3 здоровья в секунду.',lore:'Горький, густой, ещё тёплый — будто заварили минуту назад.',stats:[['Реген','3 / с'],['Действует',sec(1200)]],use(){if(P.hp>=P.max)return'Здоровье и так полное';G.buf.tea=1200;fxUse(0x80d060);return true}},
 smoke:{n:'Дымовая бомба «Ночной туман»',r:'r',type:'Бомба',max:5,w:0.3,cost:40,desc:'Оглушает всех врагов в радиусе 6 м на 3 секунды (босса — на 1,5).',lore:'Порох, перец и пепел в глиняной скорлупе. Ниндзя звали это «ладонью ночи».',stats:[['Оглушение',sec(180)],['Радиус','6 м']],use(){if(!enemies.some(e=>!e.dead&&Math.hypot(e.x-P.x,e.z-P.z)<6))return'Рядом никого нет';for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.z-P.z)<6&&e.state!=='intro'&&e.state!=='trans'&&e.state!=='cs'){e.state='stag';e.st=0;e.stagT=e.d.boss?90:180;e.atk=e.atk||{k:'none',wind:1,act:1,rec:1}}smokeFx();return true}},
 ofuda:{n:'О-фуда Райдзина',r:'r',type:'Талисман',max:3,w:0.05,cost:70,desc:'Следующие 6 ударов на 40% сильнее и бьют молнией.',lore:'Печать громовержца. Бумага трещит, если поднести её к стали.',stats:[['Урон','+40%'],['Ударов','6']],use(){G.buf.ofuda=6;fxUse(0x9ad0ff);SFX.thunder&&SFX.thunder(0.6);return true}},
 sake:{n:'Токкури «Кровь Они»',r:'e',type:'Усиление',max:2,w:0.6,cost:110,desc:'40 секунд: урон +40%, но получаемый урон +20%.',lore:'Саке, настоянное на рогах. Его пьют перед последним боем.',stats:[['Урон','+40%'],['Защита','−20%'],['Действует',sec(2400)]],use(){G.buf.sake=2400;fxUse(0xff3020);return true}}};
const HOUSE_POOL=[['tea',3],['smoke',2.2],['ofuda',2],['sake',1.2]];
const LOOT_POOL=[['gourd',3],['flask',3],['omamori',2],['whetstone',1.4],['censer',2],['scroll',1.4],['mask',0.8],['bento',3]];
const CHESTS={ash:[[8.5,3.5],[-7.5,10.5]],forest:[[9.5,-3.5],[-9,7],[6,12]],duel:[[5.8,-8.5]]};
G.inv=Array(24).fill(null);G.buf={def:0,dmg:0,spd:0,tea:0,sake:0,ofuda:0};G.opened={};G.maxB=0;
function invReset(){G.inv=Array(24).fill(null);G.buf={def:0,dmg:0,spd:0,tea:0,sake:0,ofuda:0};G.opened={};G.maxB=0;G.noteRead=false;G.hcleared=new Set();G.hreveal=new Set();G.hseen=new Set();G.hasMap=false;G.oneBlade=false;G.ambushDone=false;G.mapOpen=false}
function invCount(id){return G.inv.reduce((a,s)=>a+(s&&s.id===id?s.n:0),0)}
function addItem(id,n=1){const D=ITEMS[id];for(const s of G.inv)if(s&&s.id===id&&s.n<D.max){const k=Math.min(n,D.max-s.n);s.n+=k;n-=k;if(!n)return 0}
 while(n>0){const i=G.inv.indexOf(null);if(i<0)break;const k=Math.min(n,D.max);G.inv[i]={id,n:k};n-=k}return n}
function takeItem(id,n=1){for(let i=G.inv.length-1;i>=0&&n>0;i--){const s=G.inv[i];if(s&&s.id===id){const k=Math.min(n,s.n);s.n-=k;n-=k;if(!s.n)G.inv[i]=null}}return n===0}
function fxUse(c){flashL(P.x,1.3,P.z,c,6,30);const col=new THREE.Color(c);for(let i=0;i<30;i++){const a=rnd(0,6.28);FX.add.add({x:P.x+Math.cos(a)*0.5,y:rnd(0.2,1.8),z:P.z+Math.sin(a)*0.5,vx:-Math.cos(a)*0.006,vy:rnd(0.005,0.02),vz:-Math.sin(a)*0.006,life:rnd(30,60),s:rnd(0.04,0.08),r:col.r*2,gg:col.g*2,b:col.b*2,a:0.8})}SFX.soul();SFX.soul()}
function useSlot(i){const s=G.inv[i];if(!s)return;const D=ITEMS[s.id],r=D.use();if(r===true){s.n--;if(!s.n)G.inv[i]=null;pop(D.n+' — использовано',RAR[D.r][1])}else if(r!=='keep')INV.msg=[r,90]}
// ---------- модели предметов (Blender LT__*), иконки рендерятся из них же
function itemModel(id){const g=new Group();const part=id==='key'?'key':id==='note'?'note':id;if(ASSET.ok&&ASSET.parts.LT&&ASSET.parts.LT[part])addPart(g,'LT',part);else mesh(new THREE.BoxGeometry(0.12,0.12,0.12),M.tsubaR,0,0.06,0,g);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});const b=new THREE.Box3().setFromObject(g);g.userData.box=b;g.userData.r=Math.max(0.05,Math.max(b.max.x-b.min.x,b.max.z-b.min.z)*0.5);g.userData.h=b.max.y-b.min.y;return g}
const ICON={};
function renderIcons(){const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xfff0e0,0x302018,1.6));const d=new THREE.DirectionalLight(0xfff2e0,3.2);d.position.set(1.5,2.5,2.2);sc.add(d);const d2=new THREE.DirectionalLight(0x90b0ff,1.6);d2.position.set(-2,1,-1.5);sc.add(d2);
 const cam=new THREE.PerspectiveCamera(30,1,0.01,10);const S=256,pr=renderer.getPixelRatio(),hc=renderer.domElement.height;const old=renderer.toneMappingExposure;renderer.toneMappingExposure=1.15;
 for(const id of Object.keys(ITEMS)){const g=itemModel(id);if(id==='note')g.rotation.x=0.9;g.rotation.y=id==='scroll'?0.5:id==='mask'?0.25:-0.55;sc.add(g);const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new V3()),r=b.getSize(new V3()).length()*0.5;
  cam.position.set(c.x+r*0.35,c.y+r*0.9,c.z+r*3.3);cam.lookAt(c);renderer.setScissorTest(true);renderer.setViewport(0,0,S/pr,S/pr);renderer.setScissor(0,0,S/pr,S/pr);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(sc,cam);
  const cv=document.createElement('canvas');cv.width=cv.height=S;cv.getContext('2d').drawImage(renderer.domElement,0,hc-S,S,S,0,0,S,S);ICON[id]=cv;sc.remove(g)}
 renderer.setScissorTest(false);renderer.setViewport(0,0,renderer.domElement.width/pr,renderer.domElement.height/pr);renderer.toneMappingExposure=old;renderer.setClearColor(0x000000,1)}
// ---------- предметы в мире: физика и коллизии
const WI=[];const glintTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,230,160,0.6)');g.addColorStop(1,'rgba(255,200,100,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function spawnWI(id,x,y,z,vx=0,vy=0,vz=0){const g=itemModel(id);scene.add(g);const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glintTex,color:id==='key'?0xffd27a:id==='note'?0xfff4e0:0xffc080,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));gl.scale.setScalar(0.5);scene.add(gl);
 const o={id,x,y,z,vx,vy,vz,yaw:rnd(0,6.28),av:rnd(-0.2,0.2),tilt:rnd(-1,1),obj:g,gl,r:g.userData.r,h:g.userData.h,t:0};WI.push(o);return o}
function removeWI(o){scene.remove(o.obj);scene.remove(o.gl);WI.splice(WI.indexOf(o),1)}
function clearWI(){while(WI.length)removeWI(WI[0])}
// столкновение точки-круга с прямоугольником сундука (OBB); возвращает нормаль или null
function obbPush(o,r,c){const s=Math.sin(c.yaw),co=Math.cos(c.yaw),dx=o.x-c.x,dz=o.z-c.z,lx=dx*co-dz*s,lz=dx*s+dz*co,hx=0.5+r,hz=0.36+r;
 if(Math.abs(lx)>=hx||Math.abs(lz)>=hz)return null;const px=hx-Math.abs(lx),pz=hz-Math.abs(lz);let nx=0,nz=0;if(px<pz){nx=Math.sign(lx)||1;o.x+=(nx*px)*co;o.z+=-(nx*px)*s}else{nz=Math.sign(lz)||1;o.x+=(nz*pz)*s;o.z+=(nz*pz)*co}
 return[nx*co+nz*s,-nx*s+nz*co]}
function solidPush(o,r){if(!LV||!LV.chests)return;for(const c of LV.chests)if(c.state!=='hidden')obbPush(o,r,c)}
function updWI(ts){for(const o of WI){o.t+=ts;o.vy-=0.006*ts;o.x+=o.vx*ts;o.y+=o.vy*ts;o.z+=o.vz*ts;
  if(o.y<=0){o.y=0;if(o.vy<-0.02){o.vy=-o.vy*0.38;o.av*=0.7;if(o.vy>0.012)dust(o.x,o.z,1)}else o.vy=0;o.vx*=Math.pow(0.82,ts);o.vz*=Math.pow(0.82,ts);o.av*=Math.pow(0.85,ts)}else{o.vx*=0.995;o.vz*=0.995}
  o.yaw+=o.av*ts;o.tilt=o.y>0.02?o.tilt+o.av*0.6*ts:lerp(o.tilt,0,0.2);
  // коллизии: герой, враги, сундуки, другие предметы, край арены
  const bodies=[[P,0.35,P.vx+fwdX(P.yaw)*(P.mvS||0),P.vz+fwdZ(P.yaw)*(P.mvS||0)]];for(const e of enemies)if(!e.dead)bodies.push([e,e.d.rad,e.vx,e.vz]);
  for(const [b,br,bvx,bvz] of bodies){const dx=o.x-b.x,dz=o.z-b.z,d=Math.hypot(dx,dz),m=br+o.r;if(d<m&&o.y<1.6){const nx=d>1e-4?dx/d:1,nz=d>1e-4?dz/d:0;o.x=b.x+nx*m;o.z=b.z+nz*m;const vn=o.vx*nx+o.vz*nz;const k=Math.max(0.012,(bvx*nx+bvz*nz)*1.3);if(vn<k){o.vx+=nx*(k-vn);o.vz+=nz*(k-vn);o.av+=rnd(-0.08,0.08)}}}
  if(LV.chests)for(const c of LV.chests){if(c.state==='hidden')continue;const n=obbPush(o,o.r,c);if(n){const vn=o.vx*n[0]+o.vz*n[1];if(vn<0){o.vx-=1.5*vn*n[0];o.vz-=1.5*vn*n[1]}}}
  for(const q of WI){if(q===o)continue;const dx=o.x-q.x,dz=o.z-q.z,d=Math.hypot(dx,dz),m=o.r+q.r;if(d<m&&d>1e-4&&Math.abs(o.y-q.y)<0.2){const p=(m-d)*0.5;o.x+=dx/d*p;o.z+=dz/d*p;q.x-=dx/d*p;q.z-=dz/d*p}}
  arenaClamp(o,o.r+0.3);
  o.obj.position.set(o.x,o.y,o.z);o.obj.rotation.set(o.tilt*0.6,o.yaw,o.tilt*0.3);const pulse=0.5+0.5*Math.sin(G.frame*0.08+o.yaw);o.gl.position.set(o.x,o.y+o.h+0.18+pulse*0.05,o.z);o.gl.material.opacity=0.35+pulse*0.45;o.gl.scale.setScalar(0.35+pulse*0.15)}}
// ---------- сундуки
function lootPick(n){const pool=LOOT_POOL.concat(CH[G.chap]&&CH[G.chap].house?HOUSE_POOL:[]),out=[];for(let i=0;i<n;i++){let s=pool.reduce((a,p)=>a+p[1]*(ITEMS[p[0]].r==='e'?1+G.chap*0.6:1),0)*Math.random();let k=0;for(;k<pool.length-1;k++){s-=pool[k][1]*(ITEMS[pool[k][0]].r==='e'?1+G.chap*0.6:1);if(s<=0)break}out.push(pool[k][0]);pool.splice(k,1)}return out}
function makeChest(x,z,i,item,opened,yw){const yaw=yw??Math.atan2(-x,-z),g=new Group();g.position.set(x,0,z);g.rotation.y=yaw;ENV.add(g);
 const lid=new Group();lid.position.set(0,0.52,-0.3);g.add(lid);const seal=new Group();g.add(seal);
 if(ASSET.ok&&ASSET.parts.LT){addPart(g,'LT','chest');addPart(lid,'LT','lid');addPart(seal,'LT','seal')}else{mesh(new THREE.BoxGeometry(0.9,0.5,0.6),M.tsubaR,0,0.27,0,g);mesh(new THREE.BoxGeometry(0.9,0.18,0.6),M.tsubaR,0,0.09,0.3,lid)}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 const glow=new Mesh(new THREE.PlaneGeometry(0.8,0.5),new MB({map:glintTex,color:0xffc070,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.y=0.42;g.add(glow);
 const c={i,x,z,yaw,g,lid,seal,glow,item,state:opened?'open':'sealed',open:opened?1:0,keyObj:null};if(opened){lid.rotation.x=-1.95;seal.visible=false}return c}
function setupChests(cp){const th=LV.c.theme,pos=CHESTS[th]||[];const op=G.opened[G.chap]=G.opened[G.chap]||{};if(!G.lootPlan||G.lootPlan.chap!==G.chap)G.lootPlan={chap:G.chap,items:lootPick(pos.length)};
 if(!LV.house)for(const o of ENV.children.slice()){for(const [x,z] of pos)if(Math.hypot(o.position.x-x,o.position.z-z)<2.1&&!o.isLight){const b=new THREE.Box3().setFromObject(o);if(b.isEmpty()||Math.max(b.max.x-b.min.x,b.max.z-b.min.z)<4.5){ENV.remove(o);break}}}
 LV.chests=pos.map(([x,z,yw],i)=>makeChest(x,z,i,G.lootPlan.items[i],!!op[i],yw));
 const waves=LV.c.waves.slice(cp?cp.wave:0),total=waves.reduce((a,w)=>a+w.en.length,0),need=Math.max(0,LV.chests.filter(c=>c.state!=='open').length-invCount('key'));
 const idx=[...Array(total).keys()].sort(()=>Math.random()-0.5).slice(0,need);LV.keyAt=new Set(idx);LV.killN=0;LV.unsealed=false}
function lootOnKill(e){if(!LV||!LV.keyAt)return;const k=LV.killN++;if(LV.keyAt.has(k)){spawnWI('key',e.x,1.1,e.z,rnd(-0.03,0.03),0.09,rnd(-0.03,0.03));pop('Из Гэнма выпал ключ!','#ffd27a');SFX.iai()}}
function unsealChests(){if(LV.unsealed||!LV.chests||!LV.chests.length)return;LV.unsealed=true;let any=false;
 for(const c of LV.chests)if(c.state==='sealed'){c.state='locked';c.burn=1;any=true}
 if(any){pop('Печати о-фуда сгорели — сундуки можно открыть','#ffd27a');SFX.fire()}
 const lack=LV.chests.filter(c=>c.state!=='open').length-invCount('key')-WI.filter(o=>o.id==='key').length;for(let i=0;i<lack;i++)spawnWI('key',P.x+rnd(-1,1),1.5,P.z+rnd(-1,1),rnd(-0.02,0.02),0.06,rnd(-0.02,0.02))}
function updChests(ts){if(!LV.chests)return;for(const c of LV.chests){
 if(c.burn>0){c.burn-=ts/70;const k=1-c.burn;c.seal.scale.setScalar(1-k*0.15);c.seal.position.y=k*0.05;if(G.frame%2===0)embers(c.x+rnd(-0.5,0.5),rnd(0.2,0.6),c.z+rnd(-0.4,0.4),2,[1,0.4,0.1]);if(c.burn<=0){c.seal.visible=false;sparks(c.x,0.4,c.z,40,[1,0.6,0.25])}}
 if(c.state==='sealed'&&G.frame%20===0)embers(c.x+rnd(-0.3,0.3),rnd(0.25,0.45),c.z+rnd(-0.3,0.3),1,[1,0.15,0.05]);
 c.lid.rotation.x=-1.95*c.open;c.glow.material.opacity=c.state==='open'?(CS.on&&CS.k==='chest'?Math.min(1,c.open*1.3):0.12*c.open):0}}
// ---------- взаимодействие (X)
const INV={open:false,sel:-1,hover:-1,drag:null,mx:0,my:0,msg:null,lastClick:0};
function nearInteract(){if(!LV)return null;let best=null,bd=1.45;for(const o of WI){const d=Math.hypot(o.x-P.x,o.z-P.z);if(d<bd&&o.y<0.6){bd=d;best={k:'item',o}}}
 if(LV.H)for(const s of LV.H.spots){if(s.done)continue;const d=Math.hypot(s.x-P.x,s.z-P.z);if(d<Math.min(bd,s.r||1.4)){bd=d;best={k:'spot',s}}}
 if(LV.duelOpen&&Math.hypot(P.x,P.z+26.6)<1.9)best={k:'door'};
 if(LV.chests)for(const c of LV.chests){if(c.state==='open'||c.state==='hidden')continue;const fx=c.x+Math.sin(c.yaw)*0.9,fz=c.z+Math.cos(c.yaw)*0.9,d=Math.hypot(fx-P.x,fz-P.z);if(d<Math.min(bd,1.4)){bd=d;best={k:'chest',c}}}return best}
function promptText(n){if(!n)return null;if(n.k==='spot')return n.s.label;if(n.k==='door')return invCount('housekey')?'X — отпереть дверь дома':'Дверь заперта';if(n.k==='item')return'X — подобрать: '+ITEMS[n.o.id].n;const c=n.c;if(c.state==='sealed')return'Сундук запечатан — сначала зачисти локацию';return invCount('key')?'X — открыть сундук ключом':'Сундук заперт — нужен ключ'}
function interact(){const n=nearInteract();if(!n)return;if(n.k==='spot'){houseSpot(n.s);return}if(n.k==='door'){if(invCount('housekey'))startDoorCS();else pop('Нужен ключ','#c9a0a0');return}
 if(n.k==='item'&&n.o.id==='housekey'){const o=n.o;removeWI(o);startHouseKeyCS(o.x,o.z);return}if(n.k==='item'){const o=n.o;if(o.id==='note'){removeWI(o);addItem('note');startNoteCS();return}const left=addItem(o.id);if(left){INV.msg=['Инвентарь полон',90];pop('Инвентарь полон','#c9a0a0');return}removeWI(o);pop('Подобрано: '+ITEMS[o.id].n,RAR[ITEMS[o.id].r][1]);SFX.soul()}
 else{const c=n.c;if(c.state==='sealed'){pop('Печать держит, пока рядом Гэнма','#c9a0a0');return}if(!invCount('key')){pop('Нужен ключ — его носят Гэнма','#c9a0a0');return}startChestCS(c)}}
function updItems(ts){updWI(ts);updChests(ts);for(const k of['def','dmg','spd','tea','sake'])if(G.buf[k]>0)G.buf[k]-=ts;if(G.buf.tea>0&&P.state!=='dead'){P.hp=Math.min(P.max,P.hp+0.05*ts);if(G.frame%20===0)FX.add.add({x:P.x+rnd(-.3,.3),y:rnd(0.3,1.6),z:P.z+rnd(-.3,.3),vx:0,vy:0.01,vz:0,life:40,s:0.05,r:0.8,gg:1.8,b:0.6,a:0.6})}
 if(!CS.on&&P.state!=='dead'){G.prompt=promptText(nearInteract());if(hit('KeyX'))interact()}else G.prompt=null;
 if(G.buf.dmg>0){M.blade.emissive.set(0x803010)}}
// ---------- катсцена: открыть сундук ключом, достать предмет и осмотреть его
function startChestCS(c){const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw),S=[c.x+fx*0.92,c.z+fz*0.92],rx=fz,rz=-fx;const key=itemModel('key');key.visible=false;scene.add(key);const item=itemModel(c.item);item.visible=false;scene.add(item);
 const lock=new V3(c.x+fx*0.34,0.5,c.z+fz*0.34),hand=new V3(),kq=new THREE.Quaternion(),D=ITEMS[c.item];
 if(P.drawn){P.state='sheathe';P.t=0;P.drawSpd=1.4;SFX.draw(false)}
 const done=()=>{takeItem('key');c.state='open';c.open=1;G.opened[G.chap][c.i]=true;scene.remove(item);c.keyObj=key;key.visible=true;key.position.copy(lock).addScaledVector(new V3(fx,0,fz),0.02);key.quaternion.copy(kq);c.g.attach(key);
  const left=addItem(c.item);if(left)spawnWI(c.item,c.x+fx*1.2,0.5,c.z+fz*1.2);pop('Добавлено в инвентарь: '+D.n,RAR[D.r][1]);csEnd()};
 const handPos=()=>{hero.arms.R.hand.getWorldPosition(hand);return hand};
 csStart('chest',t=>{const H=CS.H;CS.bars=Math.min(ek(t,0,18),1-ek(t,392,410));
  if(t===1){H.to=S;H.spd=0.032;H.gait=0}
  if(t>=1&&t<70){const m=new V3((P.x+c.x)/2,0.7,(P.z+c.z)/2);cam([m.x+rx*2.7+fx*1.4,1.7,m.z+rz*2.7+fz*1.4],[m.x,0.75,m.z],ek(t,0,70),[m.x+rx*2.3+fx*1.1,1.5,m.z+rz*2.3+fz*1.1],[m.x,0.7,m.z])}
  if(t===62){H.to=null;H.yaw=c.yaw+Math.PI;H.yawK=0.25}
  if(t>=66&&t<150){if(!P.csPose)P.csPose={p:POSE.unlock,w:0};P.csPose.p=POSE.unlock;P.csPose.w=ek(t,66,92)}
  if(t===80){key.visible=true;SFX.draw(true)}
  if(t>=80&&t<150){const hp=handPos(),k=ek(t,100,124),p=hp.clone().lerp(lock.clone().addScaledVector(new V3(fx,0,fz),0.02),k);key.position.copy(p);
   const dir=new V3(-fx,0,-fz);kq.setFromUnitVectors(new V3(0,-1,0),dir);const tw=new THREE.Quaternion().setFromAxisAngle(dir,(t>=126?ek(t,126,142):0)*Math.PI/2);key.quaternion.copy(tw.multiply(kq.clone()));
   if(t===142){kq.copy(key.quaternion);SFX.clang();sparks(lock.x,lock.y,lock.z,14,[1,0.8,0.4]);G.shake=0.05}}
  if(t>=96&&t<150)cam([lock.x+fx*0.85+rx*0.55,0.95,lock.z+fz*0.85+rz*0.55],[lock.x,0.52,lock.z],ek(t,96,150),[lock.x+fx*0.6+rx*0.4,0.82,lock.z+fz*0.6+rz*0.4],[lock.x,0.5,lock.z]);
  if(t>=142&&t<300){key.position.copy(lock).addScaledVector(new V3(fx,0,fz),0.02);key.quaternion.copy(kq)}
  // крышка распахивается, изнутри золотой свет
  if(t>=150){c.open=t<196?(1-Math.pow(1-ek(t,150,190),3))*1.04:lerp(c.open,1,0.2);if(t===152){SFX.bell();flashL(c.x,0.9,c.z,0xffc070,8,40)}if(t<260&&t%2===0)FX.add.add({x:c.x+rnd(-0.3,0.3),y:0.45,z:c.z+rnd(-0.2,0.2),vx:0,vy:rnd(0.006,0.014),vz:0,life:rnd(40,70),s:rnd(0.03,0.06),r:2,gg:1.5,b:0.6,a:0.8})}
  if(t>=150&&t<235)cam([S[0]+rx*1.7+fx*1.3,1.75,S[1]+rz*1.7+fz*1.3],[c.x,0.45,c.z],ek(t,150,235),[S[0]+rx*1.25+fx*1.0,1.55,S[1]+rz*1.25+fz*1.0],[c.x,0.5,c.z]);
  if(t>=150&&t<205)P.csPose.w=1-ek(t,150,170)*0.4;
  if(t>=195&&t<245){P.csPose.p=POSE.take;P.csPose.w=ek(t,195,215)}
  if(t===210){item.visible=true;item.position.set(c.x,0.12,c.z);SFX.soul()}
  if(t>=210&&t<250){const hp=handPos();item.position.lerpVectors(new V3(c.x,0.12,c.z),hp.clone().add(new V3(0,0.02,0)),ek(t,214,240));item.rotation.y+=0.02}
  // осмотр предмета
  if(t>=245){P.csPose.p=POSE.inspect;P.csPose.w=ek(t,245,275);const hp=handPos();item.position.lerp(hp.clone().add(new V3(0,0.03,0)),0.35);item.rotation.y+=0.018;item.rotation.x=Math.sin(t*0.03)*0.25;P.csLook=Math.sin(t*0.02)*0.2}
  if(t>=250&&t<392){const hf=new V3(fwdX(P.yaw),0,fwdZ(P.yaw)),hr=new V3(hf.z,0,-hf.x);cam([P.x+hf.x*1.15+hr.x*0.55,1.62,P.z+hf.z*1.15+hr.z*0.55],[P.x+hf.x*0.3,1.38,P.z+hf.z*0.3],ek(t,250,392),[P.x+hf.x*0.85+hr.x*0.4,1.55,P.z+hf.z*0.85+hr.z*0.4],[P.x+hf.x*0.3,1.4,P.z+hf.z*0.3]);CS.card=t>=270?c.item:null}
  if(t===372){flashL(item.position.x,item.position.y,item.position.z,0xffe0a0,6,20);SFX.soul()}
  if(t>=372)item.scale.setScalar(Math.max(0.001,1-ek(t,372,388)));
  if(t>=410){CS.card=null;done()}},()=>{c.open=1;CS.card=null;done()})}
// ---------- босс пал: записка у колокола
function bossDown(e){if(e.t==='shogun')return houseBossDown(e);spawnWI('note',e.x,1.3,e.z,rnd(-0.01,0.01),0.05,rnd(-0.01,0.01));spawnWI('housekey',e.x+0.5,1.1,e.z+0.3,0.015,0.06,0.01);say('Юки','Он что-то обронил… Бумага и ключ. Подбери их (X).')}
const noteImg=new Image();noteImg.src=NOTE_IMG;
function readNote(){if(CS.on)return;INV.open=false;const p=camera.position.clone();csStart('read',()=>{},null);CS.cam.p.copy(p);CS.cam.l.set(P.x,1.3,P.z);CS.bars=0;CS.img=noteImg;CS.imgT=0;CS.onImgClose=()=>{CS.img=null;csEnd();try{renderer.domElement.requestPointerLock()}catch(_){}}}
function startNoteCS(){P.csPose={p:POSE.kneel,w:1};const nt=itemModel('note');scene.add(nt);
 const close=()=>{scene.remove(nt);CS.img=null;csEnd();if(LV.winPending){LV.winPending=false;G.winT=1}};
 csStart('note',t=>{const H=CS.H;CS.bars=1;if(!P.csPose)P.csPose={p:POSE.kneel,w:1};const hf=new V3(fwdX(P.yaw),0,fwdZ(P.yaw)),hr=new V3(hf.z,0,-hf.x);
  if(t<40)P.csPose.w=1;if(t>=20&&P.csPose.p===POSE.kneel)P.csPose.w=1-ek(t,20,60);
  if(t===60)P.csPose={p:POSE.read,w:0};if(P.csPose.p===POSE.read)P.csPose.w=ek(t,60,90);
  hero.arms.R.hand.getWorldPosition(tv1);hero.arms.L.hand.getWorldPosition(_tv2);nt.position.lerpVectors(tv1,_tv2,0.5);nt.position.y+=0.02;nt.rotation.set(-1.0,P.yaw+Math.PI,0);
  // медленный наезд камеры на героя
  if(t<300){const k=ease(t/300)*0.85+Math.pow(t/300,4)*0.15;cam([P.x+hf.x*3.6+hr.x*1.3,1.9,P.z+hf.z*3.6+hr.z*1.3],[P.x,1.45,P.z],k,[P.x+hf.x*0.7+hr.x*0.18,1.6,P.z+hf.z*0.7+hr.z*0.18],[P.x,1.55,P.z]);CS.fov=55-k*10}
  if(t%70===35&&t<300)SFX.heart();
  if(t===300){CS.img=noteImg;CS.imgT=0;CS.onImgClose=close;SFX.bell()}
  },()=>{if(CS.t<300){CS.t=299}else close()})
}
// ---------- инвентарь: отрисовка и управление мышью
const SL={x:120,y:150,s:84,g:10,cols:6};
function slotAt(mx,my){for(let i=0;i<G.inv.length;i++){const x=SL.x+(i%SL.cols)*(SL.s+SL.g),y=SL.y+Math.floor(i/SL.cols)*(SL.s+SL.g);if(mx>=x&&mx<x+SL.s&&my>=y&&my<y+SL.s)return i}return -1}
const BTN={use:[790,598,150,40],drop:[956,598,150,40]};const inB=(b,x,y)=>x>=b[0]&&x<b[0]+b[2]&&y>=b[1]&&y<b[1]+b[3];
function invToggle(on){INV.open=on;INV.drag=null;if(on){G.noPauseOnUnlock=true;document.exitPointerLock&&document.exitPointerLock();setTimeout(()=>G.noPauseOnUnlock=false,150);SFX.draw(false)}else{try{renderer.domElement.requestPointerLock()}catch(_){}}}
function hudXY(e){const r=hud.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]}
addEventListener('mousemove',e=>{if(!INV.open)return;[INV.mx,INV.my]=hudXY(e);INV.hover=slotAt(INV.mx,INV.my)});
addEventListener('mousedown',e=>{if(!INV.open)return;const [x,y]=hudXY(e);INV.mx=x;INV.my=y;const i=slotAt(x,y);
 if(e.button===2){if(i>=0&&G.inv[i])useSlot(i);return}
 if(inB(BTN.use,x,y)&&INV.sel>=0){useSlot(INV.sel);return}if(inB(BTN.drop,x,y)&&INV.sel>=0){dropSlot(INV.sel);return}
 if(i>=0){if(G.inv[i]&&INV.sel===i&&performance.now()-INV.lastClick<350){useSlot(i);return}INV.sel=i;INV.lastClick=performance.now();if(G.inv[i])INV.drag={from:i}}});
addEventListener('mouseup',e=>{if(!INV.open||!INV.drag)return;const [x,y]=hudXY(e),i=slotAt(x,y),f=INV.drag.from;INV.drag=null;
 if(i>=0&&i!==f){const a=G.inv[f],b=G.inv[i];if(b&&a&&b.id===a.id&&b.n<ITEMS[b.id].max){const k=Math.min(a.n,ITEMS[b.id].max-b.n);b.n+=k;a.n-=k;if(!a.n)G.inv[f]=null}else{G.inv[i]=a;G.inv[f]=b}INV.sel=i;SFX.soul()}
 else if(i<0&&!(x>760&&x<1160&&y>110&&y<660)&&(x<100||x>1180||y<100||y>670))dropSlot(f)});
function dropSlot(i){const s=G.inv[i];if(!s)return;if(s.id==='note'){INV.msg=['Записку брата не выбросить',90];return}s.n--;const id=s.id;if(!s.n)G.inv[i]=null;
 spawnWI(id,P.x+fwdX(P.yaw)*0.6,1.1,P.z+fwdZ(P.yaw)*0.6,fwdX(P.yaw)*0.03,0.05,fwdZ(P.yaw)*0.03);INV.msg=['Выброшено: '+ITEMS[id].n,70]}
function wrap(t,w){const out=[];let cur='';for(const wd of t.split(' ')){const s=(cur+' '+wd).trim();if(X.measureText(s).width>w&&cur){out.push(cur);cur=wd}else cur=s}if(cur)out.push(cur);return out}
function itemCard(id,x,y,w,h,n){const D=ITEMS[id],rc=RAR[D.r][1];X.save();const g=X.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(58,40,30,0.96)');g.addColorStop(0.8,'rgba(34,24,22,0.96)');g.addColorStop(1,'rgba(52,32,62,0.96)');X.fillStyle=g;X.fillRect(x,y,w,h);X.strokeStyle='rgba(214,170,110,0.55)';X.lineWidth=2;X.strokeRect(x+1,y+1,w-2,h-2);
 if(ICON[id])X.drawImage(ICON[id],x+w-150,y+10,140,140);X.textAlign='left';X.fillStyle=rc;X.font='bold 25px Georgia,serif';const nl=wrap.call(null,D.n,w-170);X.font='bold 25px Georgia,serif';let yy=y+42;for(const l of wrap(D.n,w-165)){X.fillText(l,x+20,yy);yy+=30}
 X.font='15px Georgia,serif';X.fillStyle='rgba(230,215,190,0.75)';X.fillText(RAR[D.r][0]+' · '+D.type+(n>1?'  ×'+n:''),x+20,yy);yy+=30;
 X.font='17px Georgia,serif';X.fillStyle='#efe4d0';for(const l of wrap(D.desc,w-40)){X.fillText(l,x+20,Math.max(yy,y+150));yy=Math.max(yy,y+150)+23}yy+=6;
 for(const [k,v] of D.stats){X.fillStyle='rgba(230,210,170,0.7)';X.font='15px Georgia,serif';X.fillText('◆ '+k,x+24,yy);X.textAlign='right';X.fillStyle=rc;X.font='bold 15px Georgia,serif';X.fillText(v,x+w-24,yy);X.textAlign='left';yy+=22}yy+=8;
 X.font='italic 15px Georgia,serif';X.fillStyle='rgba(220,205,185,0.65)';for(const l of wrap(D.lore,w-50)){X.fillText(l,x+30,yy);yy+=20}
 X.fillStyle='rgba(120,80,150,0.35)';X.fillRect(x+2,y+h-36,w-4,34);X.font='15px Georgia,serif';X.fillStyle='#e8dcc4';X.textAlign='right';X.fillText('вес '+D.w+'   ·   '+D.cost+' мон',x+w-18,y+h-13);X.textAlign='left';X.restore()}
function drawInv(){X.fillStyle='rgba(8,6,5,0.78)';X.fillRect(0,0,W,H);
 X.fillStyle='rgba(30,24,20,0.92)';X.fillRect(90,70,1100,600);X.strokeStyle='rgba(200,160,100,0.4)';X.lineWidth=1.5;X.strokeRect(90,70,1100,600);
 X.textAlign='left';X.font='30px Georgia,serif';X.fillStyle='#ecdfc6';X.fillText('Инвентарь',120,118);X.font='15px Georgia,serif';X.fillStyle='rgba(230,215,190,0.6)';const used=G.inv.filter(Boolean).length;X.fillText('ячеек: '+used+' / '+G.inv.length+'   ·   вес: '+G.inv.reduce((a,s)=>a+(s?ITEMS[s.id].w*s.n:0),0).toFixed(1),300,116);
 for(let i=0;i<G.inv.length;i++){const x=SL.x+(i%SL.cols)*(SL.s+SL.g),y=SL.y+Math.floor(i/SL.cols)*(SL.s+SL.g),s=G.inv[i];X.fillStyle=i===INV.hover?'rgba(70,56,44,0.9)':'rgba(16,13,12,0.9)';X.fillRect(x,y,SL.s,SL.s);
  X.strokeStyle=i===INV.sel?'#ff9a5a':s?'rgba('+(ITEMS[s.id].r==='e'?'255,150,60':ITEMS[s.id].r==='r'?'90,170,255':ITEMS[s.id].r==='q'?'230,190,100':'160,150,130')+',0.6)':'rgba(120,110,100,0.35)';X.lineWidth=i===INV.sel?2.5:1.2;X.strokeRect(x+0.5,y+0.5,SL.s-1,SL.s-1);
  if(s&&!(INV.drag&&INV.drag.from===i)){if(ICON[s.id])X.drawImage(ICON[s.id],x+4,y+4,SL.s-8,SL.s-8);if(s.n>1){X.font='bold 20px Georgia,serif';X.fillStyle='#fff';X.textAlign='right';X.shadowColor='#000';X.shadowBlur=4;X.fillText(s.n,x+SL.s-6,y+SL.s-7);X.shadowBlur=0;X.textAlign='left'}}}
 const show=INV.hover>=0&&G.inv[INV.hover]?INV.hover:INV.sel;const s=show>=0?G.inv[show]:null;
 if(s){itemCard(s.id,770,110,390,470,s.n);const can=INV.sel>=0&&G.inv[INV.sel];for(const [b,l] of[[BTN.use,'Использовать'],[BTN.drop,'Выбросить']]){X.fillStyle=can?'rgba(90,60,40,0.95)':'rgba(50,40,35,0.6)';X.fillRect(...b);X.strokeStyle='rgba(220,170,110,0.6)';X.strokeRect(b[0]+0.5,b[1]+0.5,b[2]-1,b[3]-1);X.fillStyle=can?'#f0e4cc':'#8a7f70';X.font='16px Georgia,serif';X.textAlign='center';X.fillText(l,b[0]+b[2]/2,b[1]+26)}X.textAlign='left'}
 else{X.font='italic 18px Georgia,serif';X.fillStyle='rgba(220,205,185,0.5)';X.fillText('Выбери предмет',880,330)}
 // активные эффекты
 let by=560;X.font='14px Georgia,serif';for(const [k,n,c] of[['def','Омамори: защита','#ffd27a'],['dmg','Масамунэ: урон','#ffa040'],['spd','Тень ветра: скорость','#9ae0ff']])if(G.buf[k]>0){X.fillStyle=c;X.fillText('● '+n+' — '+Math.ceil(G.buf[k]/60)+' с',120,by);by+=20}
 X.font='13px Georgia,serif';X.fillStyle='rgba(230,215,190,0.55)';X.fillText('ЛКМ — выбрать · перетащи — переложить (за окно — выбросить) · ПКМ / двойной клик — использовать · I или Esc — закрыть',120,652);
 if(INV.drag){const d=G.inv[INV.drag.from];if(d&&ICON[d.id])X.drawImage(ICON[d.id],INV.mx-38,INV.my-38,76,76)}
 if(INV.msg){X.globalAlpha=Math.min(1,INV.msg[1]/20);X.font='18px Georgia,serif';X.fillStyle='#ffcf9a';X.textAlign='center';X.fillText(INV.msg[0],640,100);X.textAlign='left';X.globalAlpha=1;if(--INV.msg[1]<=0)INV.msg=null}}
function invUpdate(){if(hit('KeyI')||hit('Escape')){invToggle(false);return}if(INV.sel>=0&&(hit('Enter')||hit('KeyE')))useSlot(INV.sel);if(hit('Delete')&&INV.sel>=0)dropSlot(INV.sel)}
function drawItemHUD(){if(G.prompt){X.textAlign='center';X.font='18px Georgia,serif';const w=X.measureText(G.prompt).width+36;X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(W/2-w/2,H*0.62-24,w,36);X.fillStyle='#f2e6cc';X.fillText(G.prompt,W/2,H*0.62);X.textAlign='left'}
 X.font='12px Georgia,serif';X.fillStyle='rgba(230,220,200,0.55)';X.textAlign='left';X.fillText('I — инвентарь'+(invCount('key')?'   ·   ключей: '+invCount('key'):''),140,H-6);
 let x=400;for(const [k,c,t] of[['def','#ffd27a','護'],['dmg','#ffa040','刃'],['spd','#9ae0ff','風']])if(G.buf[k]>0){X.fillStyle='rgba(0,0,0,0.5)';X.beginPath();X.arc(x,H-30,15,0,7);X.fill();X.strokeStyle=c;X.lineWidth=2;X.beginPath();X.arc(x,H-30,15,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,G.buf[k]/2700));X.stroke();X.fillStyle=c;X.font='15px "Noto Serif CJK JP",serif';X.textAlign='center';X.fillText(t,x,H-25);X.textAlign='left';x+=38}}
