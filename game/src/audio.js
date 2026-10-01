let AC=null,master,NB;
export function audioInit(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=AC.createGain();g.gain.value=0.05;s.connect(f);f.connect(g);g.connect(master);s.start();}catch(e){AC=null}}
function tone(f,dur,type='sine',vol=0.3,f2=null,delay=0){if(!AC)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.05);}
function noise(dur,freq,q=1,vol=0.3,type='bandpass',delay=0){if(!AC)return;const t=AC.currentTime+delay,s=AC.createBufferSource();s.buffer=NB;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+0.05);}
export const SFX={
 swingR(){noise(0.25,600,0.8,0.35);noise(0.3,300,1,0.12,'lowpass')},
 swingL(){noise(0.15,3500,2,0.25)},
 hit(){noise(0.12,220,1,0.5,'lowpass');tone(90,0.15,'sine',0.25,40)},
 clang(){tone(230,0.8,'triangle',0.18);tone(1250,0.6,'sine',0.1);noise(0.15,5000,1,0.2,'highpass')},
 cross(){tone(190,1.3,'sine',0.22);tone(1210,1.1,'sine',0.12,null,0.05)},
 issen(){noise(0.05,4000,1,0.3,'highpass');tone(98,2.6,'sine',0.4);tone(196,2,'sine',0.15);tone(294,1.5,'sine',0.07)},
 taiko(a=1){tone(110,0.35,'sine',0.45*a,45);noise(0.08,400,1,0.18*a,'lowpass')},
 soul(){tone(880+Math.random()*200,0.25,'sine',0.05,1400)},
 heart(){tone(60,0.2,'sine',0.5,40);tone(60,0.2,'sine',0.4,40,0.25)},
 hurt(){noise(0.2,500,1,0.4,'lowpass');tone(150,0.2,'sawtooth',0.07,60)},
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
 portal(){tone(110,2.0,'sine',0.25,440);tone(220,1.8,'triangle',0.07,880,0.1);noise(1.8,1400,1.2,0.16);tone(1320,1.2,'sine',0.04,2640,0.4)},
 warp(){noise(0.9,2600,0.7,0.35);tone(900,0.9,'sine',0.12,90);noise(0.6,300,0.8,0.3,'lowpass',0.2)},
 impact(a=1){tone(70,0.5,'sine',0.55*a,32);noise(0.5,140,0.8,0.5*a,'lowpass');noise(0.12,2000,1,0.12*a,'bandpass')},
 roar(){tone(85,1.3,'sawtooth',0.12,42);tone(128,1.1,'sawtooth',0.06,60,0.1);noise(1.2,520,0.7,0.22)},
 guitar(){tone(82,0.45,'sawtooth',0.05);tone(123,0.45,'sawtooth',0.04)}
};
