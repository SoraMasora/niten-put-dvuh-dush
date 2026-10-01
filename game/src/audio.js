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
 guitar(){tone(82,0.45,'sawtooth',0.05);tone(123,0.45,'sawtooth',0.04)}
};
