let AC=null,master,NB,sfxBus,rvBus,musBus;const BUF={};

export function audioInit(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);sfxBus=AC.createGain();sfxBus.gain.value=0.9;sfxBus.connect(master);rvBus=AC.createConvolver();rvBus.buffer=mkIR();const rg=AC.createGain();rg.gain.value=0.35;rvBus.connect(rg);rg.connect(master);musBus=AC.createGain();musBus.gain.value=1;musBus.connect(master);loadBank();
NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=AC.createGain();g.gain.value=0.05;s.connect(f);f.connect(g);g.connect(master);s.start();}catch(e){AC=null}}
// v0.13: банк сэмплов (tools/sfx.py: Kenney CC0 + синтез в Python) — mp3 в base64, декодируются один раз
function mkIR(){const n=AC.sampleRate*1.8|0,b=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;for(let i=0;i<n;i++){lp+=(Math.random()*2-1-lp)*0.35;d[i]=lp*Math.pow(1-i/n,3.2)*(i<400?i/400:1)}}return b}
function loadBank(){let J=window.__NITEN_SFX;if(!J&&window.__NITEN_SFX_PARTS)J=window.__NITEN_SFX_PARTS.join('');if(!J)return;let o;try{o=JSON.parse(J)}catch(e){return}
 for(const k in o){const bin=atob(o[k]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);AC.decodeAudioData(u.buffer).then(b=>{BUF[k]=b}).catch(()=>{})}}
const _last={};
// сэмпл: name — точное имя или префикс с вариантами (hit -> hit0..hit3); o.vol, o.rate, o.rv (посыл в реверб), o.delay
function smp(name,o={}){if(!AC)return false;let b=BUF[name];if(!b){const v=[];for(let i=0;i<6;i++)if(BUF[name+i])v.push(name+i);if(!v.length)return false;let k=v[Math.random()*v.length|0];if(v.length>1&&k===_last[name])k=v[(v.indexOf(k)+1)%v.length];_last[name]=k;b=BUF[k]}
 const t=AC.currentTime+(o.delay||0),s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=(o.rate||1)*(o.jit===0?1:1+(Math.random()-0.5)*(o.jit||0.08));const g=AC.createGain();g.gain.value=o.vol??0.8;s.connect(g);g.connect(sfxBus);
 if(o.rv){const r=AC.createGain();r.gain.value=o.rv;g.connect(r);r.connect(rvBus)}s.start(t);return true}
// ---------- v0.13: музыка локаций (приглушённая: НЧ-фильтр + низкая громкость), плавная смена треков
const MUS={cur:null,el:{},want:null,vol:0.36};
function musEl(k){if(MUS.el[k])return MUS.el[k];const M=window.__NITEN_MUS;const parts=M&&M[k];if(!parts||!AC)return null;const src=Array.isArray(parts)?parts.join(''):parts;
 const bin=atob(src),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const a=new Audio(URL.createObjectURL(new Blob([u],{type:'audio/mpeg'})));a.loop=true;a.preload='auto';
 const n=AC.createMediaElementSource(a),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=3800;f.Q.value=0.4;const g=AC.createGain();g.gain.value=0;n.connect(f);f.connect(g);g.connect(musBus);return MUS.el[k]={a,g,f}}
export function music(k){if(!AC||k===MUS.cur)return;const t=AC.currentTime,old=MUS.cur&&MUS.el[MUS.cur];MUS.cur=k;
 if(old){old.g.gain.cancelScheduledValues(t);old.g.gain.setTargetAtTime(0,t,0.8);const oa=old.a;setTimeout(()=>{if(MUS.el[MUS.cur]!==old)oa.pause()},4000)}
 const e=k&&musEl(k);if(!e)return;if(e.a.paused){if(!old||k==='boss')e.a.currentTime=0;e.a.play().catch(()=>{})}e.g.gain.cancelScheduledValues(t);e.g.gain.setTargetAtTime(MUS.vol,t+(old?0.6:0),1.1)}
// приглушить музыку (катсцены с речью, меню)
export function musicDuck(k){if(!AC||!musBus)return;musBus.gain.setTargetAtTime(k,AC.currentTime,0.5)}
export function musicOn(){return !!(AC&&MUS.cur&&MUS.el[MUS.cur])}
function tone(f,dur,type='sine',vol=0.3,f2=null,delay=0){if(!AC)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.05);}
function noise(dur,freq,q=1,vol=0.3,type='bandpass',delay=0){if(!AC)return;const t=AC.currentTime+delay,s=AC.createBufferSource();s.buffer=NB;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+0.05);}
export const SFX={
 swingR(o){if(smp(o==='O'?'swO':'swR',{vol:0.55,rv:0.05}))return;noise(0.25,600,0.8,0.35);noise(0.3,300,1,0.12,'lowpass')},
 swingL(){if(smp('swL',{vol:0.5,rv:0.05}))return;noise(0.15,3500,2,0.25)},
 hit(big){if(smp(big?'hitH':'hit',{vol:big?0.95:0.8,rv:0.12}))return;noise(0.12,220,1,0.5,'lowpass');tone(90,0.15,'sine',0.25,40)},
 clang(){if(smp('clang',{vol:0.75,rv:0.2}))return;tone(230,0.8,'triangle',0.18);tone(1250,0.6,'sine',0.1);noise(0.15,5000,1,0.2,'highpass')},
 cross(){tone(190,1.3,'sine',0.22);tone(1210,1.1,'sine',0.12,null,0.05)},
 issen(){noise(0.05,4000,1,0.3,'highpass');tone(98,2.6,'sine',0.4);tone(196,2,'sine',0.15);tone(294,1.5,'sine',0.07)},
 taiko(a=1){tone(110,0.35,'sine',0.45*a,45);noise(0.08,400,1,0.18*a,'lowpass')},
 soul(){if(smp('soul',{vol:0.32,rv:0.25,jit:0.04}))return;tone(880+Math.random()*200,0.25,'sine',0.05,1400)},
 heart(){tone(60,0.2,'sine',0.5,40);tone(60,0.2,'sine',0.4,40,0.25)},
 hurt(){if(smp('hurt',{vol:0.85,rv:0.12}))return;noise(0.2,500,1,0.4,'lowpass');tone(150,0.2,'sawtooth',0.07,60)},
 stance(k){if(k==0)tone(80,0.4,'sawtooth',0.12,50);else if(k==1)tone(1800,0.25,'sine',0.08,2400);else noise(0.35,900,0.5,0.25)},
 fire(){noise(0.6,800,0.5,0.35);tone(120,0.5,'sawtooth',0.08,60)},
 ice(){tone(2400,0.5,'sine',0.08,1200);noise(0.4,6000,1,0.15,'highpass')},
 arrow(){noise(0.2,2500,3,0.15)},
 grab(){tone(70,0.6,'sawtooth',0.2,40)},
 bell(){tone(146,4,'sine',0.35);tone(293,3,'sine',0.12);tone(440,2,'sine',0.05)},
 iai(){tone(1600,0.7,'sine',0.12,2600)},
 thunder(d=1){noise(0.25,900,0.7,0.25,'lowpass',d*0.3);noise(2.8,140,0.6,0.55,'lowpass',d*0.3+0.1);tone(45,2.2,'sine',0.25,28,d*0.3+0.1)},
 rain(on){if(!AC)return false;if(!SFX._r){const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2600;f.Q.value=0.4;const g=AC.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(master);s.start();SFX._r=g}SFX._r.gain.setTargetAtTime(on?0.07:0,AC.currentTime,0.6)},
 draw(d){if(d){noise(0.06,1800,2,0.12,'bandpass',0.12);noise(0.45,5200,4,0.12,'highpass',0.2);tone(2900,0.6,'sine',0.04,3400,0.22)}else{noise(0.35,3800,3,0.1,'highpass',0.45);tone(620,0.12,'triangle',0.12,300,0.85);noise(0.05,600,1,0.25,'lowpass',0.85)}},
 // ветер: шум -> полосовой фильтр (+ узкий «свист»), громкость и тон следуют порывам из игры
 wind(theme,k){if(!AC)return;if(!SFX._w){const mk=(q,ty)=>{const s=AC.createBufferSource();s.buffer=NB;s.loop=true;s.playbackRate.value=0.5+Math.random()*0.2;const f=AC.createBiquadFilter();f.type=ty;f.Q.value=q;const g=AC.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(master);s.start();return{f,g}};SFX._w=[mk(0.7,'bandpass'),mk(9,'bandpass'),mk(0.5,'lowpass')]}
  const P={ash:[380,0.07,820,0.012,160,0.05],forest:[950,0.045,1500,0.006,220,0.03],duel:[520,0.03,1100,0.006,140,0.03]}[theme]||[500,0.04,1000,0.005,150,0.03],t=AC.currentTime,[a,b,c]=SFX._w;
  a.f.frequency.setTargetAtTime(P[0]*(0.7+0.6*k),t,0.3);a.g.gain.setTargetAtTime(P[1]*(0.25+k),t,0.4);b.f.frequency.setTargetAtTime(P[2]*(0.8+0.5*k),t,0.5);b.g.gain.setTargetAtTime(P[3]*k*k,t,0.5);c.f.frequency.setTargetAtTime(P[4],t,0.5);c.g.gain.setTargetAtTime(P[5]*(0.3+k),t,0.5)},
 windOff(){if(SFX._w)for(const n of SFX._w)n.g.gain.setTargetAtTime(0,AC.currentTime,0.3)},
 rift(){tone(46,3.2,'sine',0.4,30);noise(2.8,170,0.6,0.45,'lowpass');tone(620,1.8,'sine',0.05,180,0.2);noise(1.6,900,3,0.08,'bandpass',0.4)},
 portal(){if(smp('teleport',{vol:0.85,rv:0.3}))return;tone(110,2.0,'sine',0.25,440);tone(220,1.8,'triangle',0.07,880,0.1);noise(1.8,1400,1.2,0.16);tone(1320,1.2,'sine',0.04,2640,0.4)},
 warp(){if(smp('arrive',{vol:0.85,rv:0.3}))return;noise(0.9,2600,0.7,0.35);tone(900,0.9,'sine',0.12,90);noise(0.6,300,0.8,0.3,'lowpass',0.2)},
 impact(a=1){tone(70,0.5,'sine',0.55*a,32);noise(0.5,140,0.8,0.5*a,'lowpass');noise(0.12,2000,1,0.12*a,'bandpass')},
 roar(){tone(85,1.3,'sawtooth',0.12,42);tone(128,1.1,'sawtooth',0.06,60,0.1);noise(1.2,520,0.7,0.22)},
 pickup(){if(!smp('pickup',{vol:0.75,rv:0.2,jit:0.03}))tone(1320,0.25,'sine',0.08,1760)},
 heal(){if(!smp('heal',{vol:0.7,rv:0.35,jit:0}))tone(880,0.6,'sine',0.08,1320)},
 spawn(big){if(!smp(big?'spawn':'spawnS',{vol:big?0.7:0.45,rv:0.3}))tone(60,0.8,'sine',0.2,40)},
 victory(){if(!smp('victory',{vol:0.9,rv:0.3,jit:0})){tone(294,1.5,'triangle',0.1);tone(440,1.5,'triangle',0.08,null,0.2)}},
 clear(){if(!smp('clear',{vol:0.8,rv:0.3,jit:0}))tone(440,0.8,'triangle',0.08)},
 oniPunch(){if(!smp('oniPunch',{vol:0.9,rv:0.2}))noise(0.2,300,1,0.4,'lowpass')},
 oniBlast(){if(!smp('oniBlast',{vol:0.95,rv:0.35}))tone(45,1,'sine',0.4,30)},
 charge(){smp('charge',{vol:0.45,jit:0})},zanReady(){smp('zanReady',{vol:0.5,rv:0.3,jit:0})},
 zan(){if(!smp('zan',{vol:0.95,rv:0.35,jit:0.03}))noise(0.3,4000,1,0.3,'highpass')},
 lockIn(){if(!smp('lockIn',{vol:0.8,rv:0.15}))SFX.clang()},lockTurn(){if(!smp('lockTurn',{vol:0.85,rv:0.2}))SFX.clang()},lidCreak(){smp('lidCreak',{vol:0.7,rv:0.25})},paper(){smp('paper',{vol:0.75,rv:0.1,jit:0.05})},
 slam(){if(!smp('slam',{vol:1,rv:0.35}))tone(40,1,'sine',0.5,25)},bigSwing(){if(!smp('bigSwing',{vol:0.7,rv:0.1}))noise(0.5,300,0.8,0.3)},bossRoar(){if(!smp('bossRoar',{vol:0.8,rv:0.35}))SFX.roar()},
 guitar(){tone(82,0.45,'sawtooth',0.05);tone(123,0.45,'sawtooth',0.04)}
};
