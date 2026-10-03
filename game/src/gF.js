// ---------- HUD
function blade(x,y,len,col,edge){X.fillStyle=col;X.beginPath();X.moveTo(x,y-2.5);X.lineTo(x+len-14,y-3);X.quadraticCurveTo(x+len,y-2,x+len+6,y+2);X.lineTo(x,y+2.5);X.closePath();X.fill();X.fillStyle=edge;X.fillRect(x,y+1,Math.max(0,len-4),1.2);X.fillStyle='#2a1c10';X.fillRect(x-34,y-3,30,6);X.fillStyle='#b8902a';X.fillRect(x-5,y-7,4,14)}
const vig=(()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=g.createRadialGradient(W/2,H/2,H*0.4,W/2,H/2,H*0.95);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,0.6)');g.fillStyle=r;g.fillRect(0,0,W,H);return c})();
function drawHUD(){X.clearRect(0,0,W,H);X.drawImage(vig,0,0);X.textBaseline='alphabetic';X.textAlign='left';
 if(G.tarScreen>0){X.fillStyle=`rgba(3,2,6,${Math.min(0.75,G.tarScreen/120)})`;X.fillRect(0,0,W,H)}
 if(P.hp<P.max*0.3){X.strokeStyle=`rgba(160,10,20,${0.35+Math.sin(G.frame*0.12)*0.15})`;X.lineWidth=40;X.strokeRect(0,0,W,H)}
 if(G.flashRed>0){X.fillStyle=`rgba(140,0,10,${G.flashRed/40})`;X.fillRect(0,0,W,H)}
 const fx=G.issenFx;if(fx&&fx.t<80){X.save();X.globalAlpha=Math.max(0,1-fx.t/80)*(fx.t<6?fx.t/6:1);X.fillStyle='#f4efe6';X.font='bold 150px "Noto Serif CJK JP","Noto Sans JP",serif';X.textAlign='center';X.shadowColor='#000';X.shadowBlur=20;X.fillText('一閃',W/2,220);X.restore();X.textAlign='left'}
 const hr=P.hp/P.max,low=hr<0.3;blade(70,H-78,300*hr,low?'#d8c0c0':'#cfd5dd',low?'#c01020':'#fff');blade(70,H-62,300*hr,'#9aa3ad','#e0e6ee');
 X.fillStyle='rgba(255,255,255,0.12)';X.fillRect(70,H-46,300,2);X.fillStyle='#e8dcb0';X.fillRect(70,H-46,300*clamp(P.st/P.stMax,0,1),2);
 X.fillStyle='rgba(255,255,255,0.1)';X.fillRect(70,H-40,200,2);X.fillStyle='#4aa8ff';X.fillRect(70,H-40,200*P.mana/100,2);
 for(let i=0;i<3;i++){X.fillStyle=i<P.food?'#e9e2d0':'rgba(255,255,255,0.12)';X.beginPath();X.moveTo(70+i*20,H-18);X.lineTo(78+i*20,H-32);X.lineTo(86+i*20,H-18);X.fill();if(i<P.food){X.fillStyle='#111';X.fillRect(72+i*20,H-22,12,4)}}
 X.font='12px Georgia,serif';X.fillStyle='rgba(230,220,200,0.6)';X.fillText('H — онигири',140,H-19);if(LV&&LV.green&&GR.held){X.fillStyle='#cfe8b8';X.fillText('В руках: '+GR.held.n,240,H-19)}if(LV&&LV.temple)drawTpHUD();
 const cx=W-92,cy=H-92,full=P.oni>=100;const g=X.createRadialGradient(cx-10,cy-10,4,cx,cy,44);g.addColorStop(0,'#f4e08a');g.addColorStop(1,'#8a6a1a');X.fillStyle=g;X.beginPath();X.arc(cx,cy,40,0,7);X.fill();
 X.strokeStyle='#3a2a0a';X.lineWidth=4;X.beginPath();X.moveTo(cx-22,cy+22);X.quadraticCurveTo(cx,cy-4,cx+24,cy-24);X.moveTo(cx+22,cy+22);X.quadraticCurveTo(cx,cy-4,cx-24,cy-24);X.stroke();
 X.strokeStyle='rgba(0,0,0,0.5)';X.lineWidth=7;X.beginPath();X.arc(cx,cy,50,0,7);X.stroke();
 const fr=P.muso>0?P.muso/1200:P.oni/100;X.strokeStyle=P.muso>0?'#ff7a2a':'#3aa0ff';if(full||P.muso>0){X.shadowColor=X.strokeStyle;X.shadowBlur=16+Math.sin(G.frame*0.2)*8}X.beginPath();X.arc(cx,cy,50,-Math.PI/2,-Math.PI/2+Math.PI*2*fr);X.stroke();X.shadowBlur=0;
 if(full&&P.muso<=0){X.font='bold 14px Georgia';X.fillStyle='#ffd27a';X.textAlign='center';X.fillText('R — МУСО',cx,cy-62);X.textAlign='left'}
 X.textAlign='right';X.font='16px Georgia,serif';[['#ff2a1a',G.souls.r],['#2a9aff',Math.round(P.mana)],['#b050ff',G.souls.p]].forEach((v,i)=>{const y=40+i*26;X.fillStyle=v[0];X.shadowColor=v[0];X.shadowBlur=10;X.beginPath();X.arc(W-34,y-5,6,0,7);X.fill();X.shadowBlur=0;X.fillStyle='#e8e0cc';X.fillText(v[1],W-50,y)});X.textAlign='left';
 const kj=['虎','鶴','水'][P.stance],nm=['Тигр','Журавль','Вода'][P.stance],sc=1+P.stanceFx/14*0.4;X.save();X.translate(W/2,H-58);X.scale(sc,sc);X.fillStyle='rgba(0,0,0,0.45)';X.beginPath();X.arc(0,-10,30,0,7);X.fill();X.strokeStyle='rgba(200,40,40,0.7)';X.lineWidth=2;X.beginPath();X.arc(0,-10,30,0.3,5.9);X.stroke();
 X.font='36px "Noto Serif CJK JP","Noto Sans JP",serif';X.textAlign='center';X.fillStyle='#efe6d6';X.fillText(kj,0,3);X.restore();X.textAlign='center';X.font='12px Georgia,serif';X.fillStyle='rgba(230,220,200,0.7)';X.fillText(nm+'  ·  1 / 2 / 3',W/2,H-14);
 if(G.lock&&!G.lock.dead){tv1.set(G.lock.x,G.lock.d.h*0.6,G.lock.z).project(camera);if(tv1.z<1){const sx=(tv1.x+1)/2*W,sy=(1-tv1.y)/2*H;X.strokeStyle='rgba(255,220,150,0.8)';X.lineWidth=1.5;X.beginPath();X.arc(sx,sy,10,0,7);X.stroke();X.beginPath();X.moveTo(sx-16,sy);X.lineTo(sx-6,sy);X.moveTo(sx+6,sy);X.lineTo(sx+16,sy);X.stroke()}}
 const bb=G.bossBar;if(bb&&!bb.dead&&bb.state!=='intro'){X.font='18px Georgia,serif';X.fillStyle='#e6c98a';X.fillText(bb.d.name+(bb.phase===2?(bb.t==='sota'?' — Демон':' — Ярость'):''),W/2,44);X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(W/2-300,54,600,6);X.fillStyle=bb.phase===2?'#8a2aff':'#b31b25';X.fillRect(W/2-300,54,600*Math.max(0,bb.hp)/bb.max,6)}
 X.textAlign='left';const s=G.subs[0];if(s){X.font='20px Georgia,serif';const tw=X.measureText(s.t).width;X.font='bold 18px Georgia,serif';const nw=X.measureText(s.n).width;const tot=nw+tw+44,x0=W/2-tot/2,y=H-150;
  X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(x0-10,y-26,tot+20,38);X.fillStyle='#e6c26a';X.fillText(s.n,x0,y);X.font='20px Georgia,serif';X.fillStyle='#f2ede4';X.fillText(s.t,x0+nw+24,y)}
 X.textAlign='center';G.pops.forEach((p,i)=>{X.globalAlpha=clamp(p.life/30,0,1);X.font='18px Georgia,serif';X.fillStyle=p.col;X.fillText(p.t,W/2,H*0.3+i*26)});X.globalAlpha=1;
 if(P.state==='clinch'){X.font='bold 30px Georgia';X.fillStyle=`rgba(255,210,120,${0.6+Math.sin(G.frame*0.5)*0.4})`;X.fillText('ЛКМ + ПКМ',W/2,H*0.42)}
 if(G.card){const c=G.card,a=c.t<40?c.t/40:c.t>150?1-(c.t-150)/40:1;X.globalAlpha=clamp(a,0,1);X.fillStyle='rgba(0,0,0,0.55)';X.fillRect(0,H/2-80,W,150);X.fillStyle='#b9a27a';X.font='18px Georgia';X.fillText(c.title,W/2,H/2-30);X.fillStyle='#f0e8da';X.font='44px Georgia,serif';X.fillText(c.name,W/2,H/2+25);X.globalAlpha=1}
 drawItemHUD();
 if(LV&&LV.house&&G.hasMap&&!CS.on){X.textAlign='right';X.font='13px Georgia,serif';X.fillStyle='rgba(230,220,200,0.6)';X.fillText('M — карта',W-30,H-150);X.textAlign='left'}
 if(G.trans){X.fillStyle=`rgba(0,0,0,${G.trans/60})`;X.fillRect(0,0,W,H)}
 X.textAlign='left'}
function panel(title,lines,foot){X.fillStyle='rgba(0,0,0,0.72)';X.fillRect(0,0,W,H);X.fillStyle='#e7dcc4';X.fillRect(W/2-360,80,720,H-160);X.fillStyle='#5a3a1a';X.fillRect(W/2-372,70,744,14);X.fillRect(W/2-372,H-84,744,14);
 X.fillStyle='#1c1612';X.textAlign='center';X.font='34px Georgia,serif';X.fillText(title,W/2,138);X.font='17px Georgia,serif';X.textAlign='left';lines.forEach((l,i)=>{X.fillStyle=l[1]?'#7a1a14':'#2b231d';X.fillText(l[0],W/2-320,180+i*27)});
 if(foot){X.textAlign='center';X.fillStyle='#7a1a14';X.font='18px Georgia';X.fillText(foot,W/2,H-108)}X.textAlign='left'}
const CTRL=[['Мышь — камера (клик, чтобы захватить курсор), WASD — движение, C (держать) — шаг'],['ЛКМ / J — Акацуки (правая, тяжёлая рубка)'],['ПКМ / K — Ёи (левая, быстрый укол)'],['ЛКМ+ПКМ / L — Нитэн-крест (в прыжке — Крест Падающей Луны)'],['Shift — уворот (вовремя — идеальный), Пробел — прыжок'],['Q (держать) — блок скрещёнными клинками'],['Q в последний миг перед ударом — ИССЭН',1],['E (держать) — поглощение душ перчаткой'],['1 / 2 / 3 — стойки Тигр / Журавль / Вода, Tab — захват цели'],['F — огненный серп · G — лунные цепи · R — Мусо Нитэн'],['P — обнажить / вложить мечи в ножны (атака сама обнажает)'],['H — онигири · I — инвентарь · X — взять / открыть · M — карта (в доме) · Esc — пауза'],['Комбо: П-П-П — вихрь · Л-Л-Л-П — крест с подбросом']];
function drawTitle(){X.clearRect(0,0,W,H);X.drawImage(vig,0,0);const gr=X.createLinearGradient(0,0,W*0.7,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.55)');X.fillStyle=gr;X.fillRect(0,0,W,H);
 X.textAlign='center';X.fillStyle='#efe6d6';X.font='bold 92px Georgia,serif';X.shadowColor='#000';X.shadowBlur=24;X.fillText('NITEN',W*0.72,220);X.shadowBlur=0;X.font='26px Georgia,serif';X.fillStyle='#c9a66a';X.fillText('ПУТЬ ДВУХ ДУШ',W*0.72,265);
 X.font='20px Georgia,serif';DIFF.forEach((d,i)=>{X.fillStyle=i===G.menuSel?'#ffd27a':'rgba(230,220,200,0.55)';X.fillText((i===G.menuSel?'—  ':'')+d.n+(i===G.menuSel?'  —':''),W*0.72,340+i*34)});
 X.font='15px Georgia,serif';X.fillStyle='rgba(230,220,200,0.65)';X.fillText('↑ / ↓ — сложность  ·  Enter — начать',W*0.72,470);X.fillText('В игре: клик — захват мыши, Esc — пауза и управление',W*0.72,494);
 X.fillStyle=`rgba(255,210,140,${0.5+Math.sin(G.frame*0.08)*0.3})`;X.font='18px Georgia';X.fillText('Нажмите Enter',W*0.72,545);X.textAlign='left'}
// ---------- loop
// v0.13: музыка локаций: 1 — пепел (деревня), 2 — бамбуковый лес, 3 — двор колокола, 4 — дом (до босса / бой с Кагэмару)
const MUSK={ash:'ash',forest:'forest',duel:'duel',house:'house',kak:'forest',green:'forest',temple:'house'};
function updMusic(){if(G.frame%10)return;let k='ash';if(G.mode!=='title'&&LV){k=MUSK[LV.env.theme]||'ash';const b=G.bossBar;if(k==='house'&&b&&!b.dead&&b.t==='shogun')k='boss'}
 music(k);musicDuck(G.mode==='dead'?0.35:G.paused||INV.open?0.6:CS.on&&G.subs.length?0.7:1)}
function update(){G.frame++;admTick();updMusic();
 if(G.mode==='title'){if(hit('ArrowUp')||hit('KeyW'))G.menuSel=(G.menuSel+2)%3;if(hit('ArrowDown')||hit('KeyS'))G.menuSel=(G.menuSel+1)%3;
  if(hit('Enter')||hit('Space')){G.diff=G.menuSel;G.souls={r:0,b:0,p:0};G.forge={R:0,L:0};G.kak=null;G.hasKakMap=false;G.stats={kills:0,issen:0,time:0,deaths:0};invReset();G.lootPlan=null;G.mode='play';loadChapter(0);startIntro();try{renderer.domElement.requestPointerLock()}catch(_){}}
  P.yaw+=0.004;return}
 if(G.mode==='ending'){updTpEnding();return}
 if(G.mode==='victory'||G.mode==='dead'){if(hit('Enter')||MP[0]){if(G.mode==='dead'){G.mode='play';loadChapter(G.cp.chap,G.cp)}else{G.mode='title';loadChapter(1);resetPlayer(0,0)}}return}
 if(G.mapOpen){if(updWorldMap())return;if(hit('KeyM')||hit('Escape')||hit('Enter')||hit('KeyI'))G.mapOpen=false;return}
 if(INV.open){invUpdate();return}
 if(hit('KeyM')&&!CS.on&&P.state!=='dead'&&!G.paused){
  if(LV.house&&G.hasMap){G.mapOpen=true;G.worldMap=false;return}
  if((G.visited&&G.visited.size)||LV.kak){worldMapOpen();return}
  pop('Карта пуста — пройди хотя бы одну главу','#c9a0a0')}
 if(hit('KeyI')&&!CS.on&&P.state!=='dead'&&!G.paused){invToggle(true);return}
 if(hit('Escape')&&!document.pointerLockElement)G.paused=!G.paused;if(G.paused){if(hit('Enter')){G.paused=false;try{renderer.domElement.requestPointerLock()}catch(_){}}return}
 if(G.card){G.card.t++;if(G.card.t>190)G.card=null}
 const s=G.subs[0];if(s){s.a++;if(s.a>s.d)G.subs.shift()}
 for(const p of G.pops)p.life--;G.pops=G.pops.filter(p=>p.life>0);if(G.pops.length>4)G.pops.shift();
 if(G.flashRed>0)G.flashRed--;if(G.tarScreen>0)G.tarScreen--;G.shake*=0.86;if(G.shake<0.005)G.shake=0;
 if(G.issenFx){G.issenFx.t++;if(G.issenFx.t>90)G.issenFx=null}
 if(CS.on){csTick();return}
 updCamera();
 if(G.freeze>0){G.freeze--;return}if(G.hitstop>0){G.hitstop--;return}
 let ts=1;if(G.slow>0){G.slow--;ts=G.slowTs}G.stats.time++;
 updPlayer(ts);updWorld(ts);
 if(P.state==='dead'){G.deadT++;if(G.deadT>150){G.mode='dead';G.noPauseOnUnlock=true;document.exitPointerLock&&document.exitPointerLock();setTimeout(()=>G.noPauseOnUnlock=false,100)}}
 if(G.winT){G.winT++;if(G.winT===2)SFX.victory();if(G.winT>240){G.mode='victory';G.noPauseOnUnlock=true;document.exitPointerLock&&document.exitPointerLock();setTimeout(()=>G.noPauseOnUnlock=false,100)}}
 if(G.trans){G.trans++;if(G.trans>60){G.trans=0;const oni=P.oni,mana=P.mana,hp=P.hp;loadChapter(G.chap+1);P.oni=oni;P.mana=mana}}}
let lastT=0,acc=0;const clock={t:0};
function frame(now){requestAnimationFrame(frame);if(!lastT)lastT=now;acc+=Math.min(100,now-lastT)*ADM.ts;lastT=now;let n=0;
 while(acc>=1000/60&&n<4){if(!window.__frz)update();acc-=1000/60;n++;if(n===1){for(const k in KP)delete KP[k];MP[0]=MP[1]=MP[2]=0}}
 if(n===0)return;clock.t=now/1000;const t=clock.t;
 if(G.mode==='title'){camera.position.set(P.x+Math.sin(t*0.1)*4.5,1.6,P.z+Math.cos(t*0.1)*4.5);camera.lookAt(P.x,1.2,P.z);P.state='idle';P.walk=0}
 syncHero(t);for(const e of enemies)syncEnemy(e,t);syncWorld(t);
 composer.render();
 if(G.mode==='title')drawTitle();else if(G.mode==='ending')drawTpEnding();else if(CS.on&&G.mode==='play'){drawCS();if(G.paused)panel('Свиток. Пауза',CTRL,'Клик или Enter — продолжить')}else if(G.mapOpen){drawHUD();drawMap()}else if(INV.open){drawHUD();drawInv()}else{drawHUD();
  if(G.paused)panel('Свиток. Пауза',CTRL,'Клик или Enter — продолжить');
  if(G.mode==='dead')panel('Путь оборван',[['Акира пал. Но зеркало помнит его.'],[''],['Убито Генма: '+G.stats.kills],['Иссэн: '+G.stats.issen],[''],['Совет: красный блеск — жми Q в последний миг.',1],['Синяя вспышка Соты — только уворот (Shift).',1]],'Enter — вернуться к зеркалу');
  if(G.mode==='victory'){const m=Math.floor(G.stats.time/3600),sec=Math.floor(G.stats.time/60)%60;panel('Путь Меча',[['Сота пал от руки брата. Кагэмару, Страж Дома, повержен.'],['Ёи сломана, но Акацуки ведёт дальше — в глубину Забытого дома.'],['Тайников найдено: '+((G.hreveal&&G.hreveal.size)||0)+' / 3 · комнат очищено: '+((G.hcleared&&G.hcleared.size)||0)+' / 7'],['Сложность: '+DIFF[G.diff].n],['Время: '+m+':'+String(sec).padStart(2,'0')],['Убито Генма: '+G.stats.kills],['Иссэн: '+G.stats.issen,1],['Красных душ: '+G.souls.r+' · фиолетовых: '+G.souls.p],['Смертей: '+G.stats.deaths],[''],['Продолжение следует: Путь Души и Путь Пустоты.']],'Enter — в главное меню')}}}
addEventListener('resize',resize);resize();
{const ld=document.getElementById('ld'),ths=[...new Set(CH.map(c=>c&&c.theme).filter(Boolean))],ids=ths.map(th=>CH.findIndex(c=>c&&c.theme===th));let k=0;
 const cams=[[0,6,10,0,1,0],[8,3,-6,0,1.2,4],[-7,4,3,2,1,-3]];
 for(const i of ids){k++;if(ld)ld.textContent='КОМПИЛЯЦИЯ ШЕЙДЕРОВ… '+k+'/'+ids.length;await new Promise(r=>setTimeout(r,16));
  try{loadChapter(i);resetPlayer(0,0);let j=0;for(const t of Object.keys(ET)){const e=mkEnemy(t,Math.cos(j)*4,Math.sin(j)*4);enemies.push(e);j++}
   for(const e of enemies)syncEnemy(e,0);syncHero(0);syncWorld(0);
   csPrecompile(true);if(renderer.compileAsync)await renderer.compileAsync(scene,camera);
   for(const c of cams){camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);composer.render()}csPrecompile(false)}catch(err){console.warn('precompile',err)}}
 try{renderIcons()}catch(err){console.warn('icons',err)}
 if(ld)ld.remove()}
loadChapter(1);G.card=null;G.subs=[];resetPlayer(0,0);
window.__KK=KK;window.__kak={mem:kakMemory,enter:kakEnter,exit:kakExit,talk:kakTalkTo,smith:kakSmith,forge:kakForge,gh:kakGH,D:KAKD,view:kakView,show:kakShowSmith};window.__G=G;window.__tp=tpHook();window.__step=n=>{for(let i=0;i<n;i++){update();for(const k in KP)delete KP[k];syncHero(clock.t);for(const e of enemies)syncEnemy(e,clock.t)}};window.__P=P;window.__itemModel=itemModel;window.__atk=k=>startAttack(k,null);window.__MH=MH;window.__kage=k=>{const e=enemies.find(e=>e.t==='shogun'&&!e.dead);if(e)kageAtk(e,k)};window.__handXf=handXf;window.__holdM=holdM;window.__ASSET=ASSET;window.__addPart=addPart;window.__THREE=THREE;window.__hero=hero;window.__rain=rain;window.__scene=scene;window.__cam0=camera;window.__E=()=>enemies;window.__load=loadChapter;window.__K=K;window.__KP=KP;window.__mk=(t,x,z)=>{const e=mkEnemy(t,x,z);e.state='move';enemies.push(e);return e};window.__S=()=>souls;window.__LV=()=>LV;window.__CS=CS;window.__INV=INV;window.__WI=WI;window.__add=addItem;window.__chestCS=i=>startChestCS(LV.chests[i]);window.__unseal=unsealChests;window.__note=startNoteCS;window.__spawnWI=spawnWI;window.__upd=n=>{for(let i=0;i<n;i++){update();for(const k in KP)delete KP[k]}};window.__intro=()=>{G.mode='play';loadChapter(0);startIntro()};window.__top=(x,z,h)=>{csStart('top',()=>{cam([x,h,z+0.01],[x,0,z])},null);CS.bars=0};window.__kill=e=>killEnemy(e,0,0);window.__act=interact;window.__use=useSlot;window.__H=()=>LV.H;window.__map=()=>{G.hasMap=true;G.mapOpen=true};window.__amb=startAmbushCS;window.__hkey=()=>startHouseKeyCS(P.x,P.z-1);window.__door=startDoorCS;window.__room=id=>{const r=HR.find(q=>q.id===id);P.x=(r.x0+r.x1)/2;P.z=(r.z0+r.z1)/2};window.__exit=()=>{LV.env.gate.t.visible=true;startPortalExit()};window.__nav={free:navFree,los:navLOS,ok:LVok,steer:navSteer,spawn:()=>{LV.waveT=999;LV.started=true}};window.__gr=grHook();
requestAnimationFrame(frame);
