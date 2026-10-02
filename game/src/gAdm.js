// ---------- v0.11: админ-панель (F2 или ` — открыть/закрыть). Читы, главы, спавн врагов, предметы, телепорт, скорость игры.
const ADM={open:false,god:false,inf:false,x10:false,freeze:false,ts:1,el:null,info:null,last:0};
const ADM_EN=['ash','gasa','kama','yumi','sota','musha','chochin','moku','shogun'];
function admEl(){if(ADM.el)return ADM.el;const d=document.createElement('div');d.id='adm';
 d.style.cssText='position:fixed;top:10px;right:10px;width:300px;max-height:calc(100% - 20px);overflow:auto;z-index:50;background:rgba(12,10,9,.92);border:1px solid #6a5a3a;border-radius:6px;color:#e8dcc0;font:13px Georgia,serif;padding:10px 12px;display:none;box-shadow:0 4px 24px #000a;user-select:none';
 const css=document.createElement('style');css.textContent='#adm h3{margin:10px 0 5px;font-size:12px;letter-spacing:2px;color:#c9a050;font-weight:normal;text-transform:uppercase;border-bottom:1px solid #3a3020;padding-bottom:2px}#adm button{background:#2a221a;color:#e8dcc0;border:1px solid #6a5a3a;border-radius:3px;padding:3px 7px;margin:2px 2px 2px 0;font:12px Georgia,serif;cursor:pointer}#adm button:hover{background:#4a3a24}#adm button.on{background:#7a3a18;border-color:#d08040}#adm select{background:#1a1612;color:#e8dcc0;border:1px solid #6a5a3a;font:12px Georgia,serif;padding:2px;max-width:170px}#adm .row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:2px 0}#adm input[type=range]{width:130px}#adm .inf{font:11px monospace;color:#a89c80;white-space:pre}';
 document.head.appendChild(css);
 const opt=(a)=>a.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
 d.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><b style="letter-spacing:3px;color:#c9a050">АДМИН-ПАНЕЛЬ</b><button data-a="close">×</button></div>
 <div class="inf" id="admInfo"></div>
 <h3>Читы</h3><div class="row"><button data-t="god">Бессмертие</button><button data-t="inf">Бесконечные силы</button><button data-t="x10">Урон ×10</button><button data-t="freeze">Заморозить врагов</button></div>
 <div class="row"><button data-a="heal">Вылечить</button><button data-a="oni">Шкала Они 100</button><button data-a="souls">Души +100</button><button data-a="unseal">Снять печати</button></div>
 <h3>Время</h3><div class="row">Скорость <input type="range" id="admTs" min="0" max="3" step="0.05" value="1"><span id="admTsV">1.00×</span><button data-a="ts1">1×</button></div>
 <h3>Главы</h3><div class="row"><select id="admCh">${opt(CH.map((c,i)=>[i,c.title+' — '+c.name]))}</select><button data-a="ch">Перейти</button></div>
 <div class="row"><button data-a="win">Зачистить волну</button><button data-a="next">Следующая волна</button></div>
 <h3>Враги</h3><div class="row"><select id="admEn">${opt(ADM_EN.filter(t=>ET[t]).map(t=>[t,ET[t].name+' ('+t+')']))}</select><select id="admEnN">${opt([[1,'×1'],[3,'×3'],[5,'×5']])}</select><button data-a="spawn">Создать</button></div>
 <div class="row"><button data-a="killall">Убить всех</button><button data-a="clear">Убрать всех</button></div>
 <h3>Предметы</h3><div class="row"><select id="admIt">${opt(Object.keys(ITEMS).map(k=>[k,ITEMS[k].n]))}</select><button data-a="item">Выдать</button><button data-a="itemmax">Макс.</button></div>
 <div class="row"><button data-a="allitems">Всё по одному</button><button data-a="map">Карта дома</button></div>
 <h3>Телепорт</h3><div class="row" id="admRoomRow"><select id="admRoom"></select><button data-a="room">В комнату</button></div><div class="row"><button data-a="tpfwd">Вперёд на 5 м</button><button data-a="tp0">В начало</button></div>
 <div style="margin-top:8px;color:#8a7c60;font-size:11px">F2 или \` — открыть/закрыть</div>`;
 document.body.appendChild(d);ADM.el=d;ADM.info=d.querySelector('#admInfo');
 const ts=d.querySelector('#admTs');ts.oninput=()=>{ADM.ts=+ts.value;d.querySelector('#admTsV').textContent=ADM.ts.toFixed(2)+'×'};
 d.addEventListener('mousedown',e=>e.stopPropagation());d.addEventListener('keydown',e=>e.stopPropagation());
 d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t){ADM[b.dataset.t]=!ADM[b.dataset.t];b.classList.toggle('on',ADM[b.dataset.t]);admMsg(b.textContent+(ADM[b.dataset.t]?': вкл':': выкл'));return}admAct(b.dataset.a)});
 return d}
function admMsg(t){try{pop(t,'#ffcf70')}catch(_){}}
function admRooms(){const s=ADM.el.querySelector('#admRoom'),row=ADM.el.querySelector('#admRoomRow');const on=!!(LV&&LV.house&&typeof HR!=='undefined');row.style.display=on?'flex':'none';if(on&&!s.options.length)s.innerHTML=HR.map(r=>`<option value="${r.id}">${r.n}</option>`).join('')}
function admToggle(v){const d=admEl();ADM.open=v??!ADM.open;d.style.display=ADM.open?'block':'none';
 if(ADM.open){admRooms();d.querySelector('#admCh').value=G.chap;if(document.pointerLockElement){G.noPauseOnUnlock=true;document.exitPointerLock();setTimeout(()=>G.noPauseOnUnlock=false,150)}G.paused=false}}
function admSpawn(t,n){if(G.mode!=='play'){admMsg('Сначала начните игру');return}for(let i=0;i<n;i++){const a=P.yaw+(i-(n-1)/2)*0.45,r=t==='yumi'?9:4.5;const e=mkEnemy(t,P.x+Math.sin(a)*r,P.z+Math.cos(a)*r);e.state='move';e.st=0;enemies.push(e)}admMsg('Создано: '+ET[t].name+' ×'+n)}
function admAct(a){const $=s=>ADM.el.querySelector(s);
 switch(a){
  case'close':admToggle(false);break;
  case'heal':P.hp=P.max;P.tar=0;P.food=3;P.st=P.stMax;P.mana=100;if(P.state==='dead'){P.state='idle';P.t=0}admMsg('Здоровье восстановлено');break;
  case'oni':P.oni=100;admMsg('Шкала Они заполнена');break;
  case'souls':G.souls.r+=100;G.souls.b+=100;G.souls.p+=100;admMsg('Души +100');break;
  case'unseal':try{unsealChests();admMsg('Печати сундуков сняты')}catch(_){}break;
  case'ts1':ADM.ts=1;$('#admTs').value=1;$('#admTsV').textContent='1.00×';break;
  case'ch':{const i=+$('#admCh').value;if(G.mode!=='play'){G.mode='play';G.souls=G.souls||{r:0,b:0,p:0}}CS.on=false;G.paused=false;loadChapter(i);ADM.el.querySelector('#admRoom').innerHTML='';admRooms();admMsg(CH[i].title+' — '+CH[i].name);break}
  case'win':case'killall':for(const e of enemies.slice())if(!e.dead)killEnemy(e,0,0);admMsg('Враги повержены');break;
  case'clear':for(const e of enemies)removeRig(e);enemies.length=0;admMsg('Враги убраны');break;
  case'next':if(LV){for(const e of enemies.slice())if(!e.dead)killEnemy(e,0,0);LV.waveT=0;admMsg('Волна пропущена')}break;
  case'spawn':admSpawn($('#admEn').value,+$('#admEnN').value);break;
  case'item':{const id=$('#admIt').value,r=addItem(id,1);admMsg(r?'Инвентарь полон':'Выдано: '+ITEMS[id].n);break}
  case'itemmax':{const id=$('#admIt').value;addItem(id,ITEMS[id].max||1);admMsg('Выдано: '+ITEMS[id].n+' (макс.)');break}
  case'allitems':for(const k of Object.keys(ITEMS))if(!invCount(k))addItem(k,1);admMsg('Выданы все предметы');break;
  case'map':G.hasMap=true;admMsg('План дома получен');break;
  case'room':{const r=HR.find(q=>q.id===$('#admRoom').value);if(r){P.x=(r.x0+r.x1)/2;P.z=(r.z0+r.z1)/2;P.vx=P.vz=0;admMsg(r.n)}break}
  case'tpfwd':P.x+=Math.sin(P.yaw)*5;P.z+=Math.cos(P.yaw)*5;break;
  case'tp0':{const c=CH[G.chap];resetPlayer(0,0);if(c&&c.house&&LV&&LV.H&&LV.H.start){P.x=LV.H.start[0];P.z=LV.H.start[1]}break}
 }}
function admTick(){if(KP.F2||KP.Backquote)admToggle();
 if(G.mode!=='play')return;
 if(ADM.god){P.hp=Math.max(P.hp,1);if(P.tar>0)P.tar=0}
 if(ADM.inf){P.st=P.stMax;P.mana=100;P.exhaust=0}
 if(ADM.freeze)for(const e of enemies)if(!e.dead){e.frozen=Math.max(e.frozen||0,2);e.cd=Math.max(e.cd,30)}
 if(ADM.open&&ADM.info&&G.frame-ADM.last>15){ADM.last=G.frame;const al=enemies.filter(e=>!e.dead);
  ADM.info.textContent=`${(CH[G.chap]||{}).name||''}  волна ${LV?LV.wave:'-'}\nx ${P.x.toFixed(1)}  z ${P.z.toFixed(1)}  HP ${Math.round(P.hp)}/${P.max}\nврагов ${al.length}${al.length?': '+al.slice(0,4).map(e=>e.t+' '+Math.round(e.hp)).join(', '):''}`}}
addEventListener('keydown',e=>{if(e.code==='F2'||e.code==='Backquote')e.preventDefault()});
window.__adm=admToggle;
