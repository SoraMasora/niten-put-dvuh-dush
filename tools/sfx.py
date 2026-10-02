"""v0.13: звуковой банк NITEN. Слои: CC0-сэмплы Kenney (RPG Audio, Impact Sounds; $NITEN_SRC/sfx) + синтез
(кото Карплус-Стронг, тайко, колокола, свисты ветра, реверберация). Результат: blender/out/sfx/*.mp3 и
blender/out/niten_sfx.json (имя -> base64 mp3), который build.sh кладёт в dist/assets/sfx*.js.
PYTHONPATH=... python3 tools/sfx.py"""
import numpy as np,os,subprocess,json,base64,glob
from scipy.signal import butter,sosfilt,fftconvolve
SR=44100;R=np.random.default_rng(7)
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(HERE)
SRC=os.environ.get('NITEN_SRC','/data/src');KEN=os.path.join(SRC,'sfx');OUT=os.path.join(ROOT,'blender','out','sfx');os.makedirs(OUT,exist_ok=True)
def ken(name):
    f=glob.glob(os.path.join(KEN,'**',name+'.ogg'),recursive=True)[0]
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).astype(np.float64)
def T(d):return np.arange(int(SR*d))/SR
def env(n,a,d,sus=0.0):
    t=np.arange(n)/SR;e=np.minimum(1,t/max(a,1e-4))*np.exp(-np.maximum(0,t-a)/max(d,1e-4));return e*(1-sus)+sus
def filt(x,kind,f,order=2):
    if kind=='band':sos=butter(order,[f[0]/(SR/2),f[1]/(SR/2)],'bandpass',output='sos')
    else:sos=butter(order,f/(SR/2),kind,output='sos')
    return sosfilt(sos,x)
def mix(*parts,dur=None):
    n=max(len(p)+int(o*SR) for p,o,g in parts) if dur is None else int(dur*SR);y=np.zeros(n)
    for p,o,g in parts:
        s=int(o*SR);m=min(len(p),n-s)
        if m>0:y[s:s+m]+=p[:m]*g
    return y
def pitch(x,k):  # ресемплинг (k>1 — выше)
    idx=np.arange(0,len(x)-1,k);return np.interp(idx,np.arange(len(x)),x)
def noise(d):return R.standard_normal(int(SR*d))
def sweep_bp(d,f0,f1,q=1.5,shape=None):
    """полосовой шум со сдвигом частоты (свист клинка / ветра) — блоками по 256 сэмплов"""
    x=noise(d);n=len(x);y=np.zeros(n);B=256;zi=None
    for i in range(0,n,B):
        k=i/n;f=f0*(f1/f0)**k;bw=f/q;lo=max(30,f-bw/2);hi=min(SR/2-100,f+bw/2)
        sos=butter(2,[lo/(SR/2),hi/(SR/2)],'bandpass',output='sos')
        if zi is None:zi=np.zeros((sos.shape[0],2))
        y[i:i+B],zi=sosfilt(sos,x[i:i+B],zi=zi)
    return y*(shape(np.arange(n)/n) if shape else 1)
def ks(f,d,bright=0.5,decay=0.996):
    """кото / сямисэн: Карплус-Стронг"""
    n=int(SR*d);N=int(SR/f);buf=filt(R.uniform(-1,1,N*4),'low',2000+6000*bright)[-N:]
    y=np.zeros(n);b=buf.copy();j=0
    for i in range(n):
        y[i]=b[j];nx=(j+1)%N;b[j]=decay*0.5*(b[j]+b[nx]);j=nx
    return filt(y,'high',80)*env(n,0.002,d*0.5)
def taiko(f=95,d=0.9,g=1):
    t=T(d);ph=2*np.pi*np.cumsum(f*(1+1.6*np.exp(-t*30)))/SR;body=np.sin(ph)*np.exp(-t*5.5)
    skin=filt(noise(d),'band',(120,900))*np.exp(-t*28)*0.6;slap=filt(noise(0.03),'high',2500)*0.25
    return mix((body+skin,0,g),(slap,0,g))
def bell(f,d=3.0,parts=((1,1,1),(2.76,0.45,1.6),(5.4,0.25,2.4),(8.93,0.12,3.5),(0.5,0.3,0.7))):
    t=T(d);y=np.zeros(len(t))
    for r,a,k in parts:y+=a*np.sin(2*np.pi*f*r*t+R.uniform(0,6))*np.exp(-t*k*(3.0/d))
    return y*env(len(t),0.003,d)
def shimmer(f,d,trem=11):
    t=T(d);return (np.sin(2*np.pi*f*t)+0.5*np.sin(2*np.pi*f*1.5*t*1.003))*(0.6+0.4*np.sin(2*np.pi*trem*t))
def ir(d=1.6,damp=3.2,lp=5000):
    t=T(d);x=noise(d)*np.exp(-t*damp);x=filt(x,'low',lp);x[:int(0.012*SR)]*=np.linspace(0,1,int(0.012*SR));return x/np.sqrt((x**2).sum())
IR_S=ir(0.9,5.5,6000);IR_L=ir(2.4,2.2,4200);IR_H=ir(1.4,3.4,3500)
def verb(x,wet=0.25,I=IR_S):
    w=fftconvolve(x,I)[:len(x)+len(I)];d=np.zeros(len(w));d[:len(x)]=x;return d*(1-wet*0.4)+w*wet
def sat(x,k=2.0):return np.tanh(x*k)/np.tanh(k)
def norm(x,peak=0.89):
    x=x-np.mean(x);m=np.max(np.abs(x))+1e-9;x=x/m*peak
    # хвост: мягкий спад и обрезка тишины
    a=np.abs(x);idx=np.where(a>0.002)[0];end=min(len(x),(idx[-1]+int(0.03*SR)) if len(idx) else len(x));x=x[:end]
    f=min(len(x),int(0.02*SR));x[-f:]*=np.linspace(1,0,f);return x
BANK={}
def put(name,x,peak=0.89):BANK[name]=norm(x,peak)
NOTE=lambda m:440*2**((m-69)/12)
# ---------------------------------------------------------------- удары
sl=[ken('knifeSlice'),ken('knifeSlice2')];pu=[ken('impactPunch_heavy_00%d'%i) for i in range(5)];pm=[ken('impactPunch_medium_00%d'%i) for i in range(5)]
for i in range(4):
    body=pitch(pu[i],0.82+0.05*i);cut=filt(sl[i%2],'high',900);crack=filt(noise(0.05),'band',(2500,7000))*np.exp(-T(0.05)*70)
    thump=np.sin(2*np.pi*62*T(0.25)*(1+0.5*np.exp(-T(0.25)*20)))*np.exp(-T(0.25)*14)
    put('hit%d'%i,verb(sat(mix((body,0,0.9),(cut,0.004,0.75),(crack,0,0.5),(thump,0,0.8)),1.6),0.18))
for i in range(2):
    body=pitch(pu[i+2],0.7);plate=pitch(ken('impactPlate_heavy_00%d'%i),0.75);cut=filt(sl[i],'high',700)
    put('hitH%d'%i,verb(sat(mix((body,0,1),(plate,0.0,0.45),(cut,0.003,0.8),(taiko(70,0.6),0,0.8)),1.8),0.3,IR_H))
# свист клинка (правая — тяжелее, левая — быстрее/выше), по 3 варианта
for i in range(3):
    put('swR%d'%i,mix((sweep_bp(0.32,520+60*i,1900,1.2,lambda k:np.sin(np.pi*k)**1.6),0,1),(sweep_bp(0.3,240,700,0.8,lambda k:np.sin(np.pi*k)**2),0,0.5)),0.75)
    put('swL%d'%i,sweep_bp(0.2,1300+150*i,4200,1.6,lambda k:np.sin(np.pi*k)**1.4),0.6)
    put('swO%d'%i,mix((sweep_bp(0.36,380+40*i,2600,1.1,lambda k:np.sin(np.pi*k**0.7)**1.3),0,1),(sweep_bp(0.36,2600,5200,2.5,lambda k:np.sin(np.pi*k)**3),0.02,0.35)),0.8)
# лязг блока
for i in range(3):
    m=ken('impactMetal_heavy_00%d'%i);ring=bell(1180+90*i,1.2,((1,1,1),(2.41,0.5,1.8),(3.9,0.3,2.6)))
    put('clang%d'%i,verb(mix((m,0,1),(ring,0.002,0.22),(filt(noise(0.04),'high',4000)*np.exp(-T(0.04)*90),0,0.4)),0.3))
# получение урона
for i in range(3):
    a=pitch(pu[i+1],0.72);b=pitch(ken('impactSoft_heavy_00%d'%i),0.8);t=T(0.5);boom=np.sin(2*np.pi*48*t*(1+np.exp(-t*12)))*np.exp(-t*7)
    ring=np.sin(2*np.pi*3150*T(0.9))*env(int(0.9*SR),0.05,0.35)*0.06
    put('hurt%d'%i,verb(sat(mix((a,0,1),(b,0.01,0.7),(boom,0,0.9),(ring,0.03,1)),2.2),0.22,IR_H))
# ---------------------------------------------------------------- предметы
cl=[ken('cloth1'),ken('cloth2'),ken('handleSmallLeather'),ken('handleSmallLeather2')]
for i in range(3):
    n1,n2=[(76,83),(74,81),(79,86)][i];pl=mix((ks(NOTE(n1),0.9,0.7),0.03,0.5),(ks(NOTE(n2),1.1,0.8),0.11,0.42))
    put('pickup%d'%i,verb(mix((cl[i],0,0.8),(pl,0,1),(bell(NOTE(n2+12),0.8)*0.12,0.12,1)),0.3))
for i in range(4):
    f=NOTE(88+[0,3,5,7][i]);put('soul%d'%i,verb(bell(f,0.5,((1,1,1.3),(2.0,0.3,2.2),(3.01,0.15,3)))*env(int(0.5*SR),0.004,0.12),0.35),0.35)
# лечение: восходящие колокольчики + воздух
t=T(1.6);air=filt(noise(1.6),'band',(1500,6000))*np.sin(np.pi*np.minimum(1,t/1.6))**2*0.1
ar=mix(*[(bell(NOTE(m),1.2,((1,1,1.4),(2.0,0.35,2),(3.0,0.15,3)))*0.5,0.08*i,1) for i,m in enumerate([74,77,79,81,84,86])])
put('heal',verb(mix((air,0,1),(ar,0,1),(shimmer(NOTE(98),1.2)*env(int(1.2*SR),0.3,0.4)*0.05,0.25,1)),0.45,IR_L))
# ---------------------------------------------------------------- появление врагов: тёмный обратный «вдох» + удар
t=T(1.1);rise=filt(noise(1.1),'band',(90,900))*(t/1.1)**2.5;rv=fftconvolve(filt(noise(0.2),'band',(200,1800)),IR_L)[:int(1.1*SR)][::-1]*0.5
gh=(np.sin(2*np.pi*110*t)+np.sin(2*np.pi*116.5*t)+0.5*np.sin(2*np.pi*164*t))*(t/1.1)**2*0.25
hit=mix((taiko(52,1.2),0,1),(filt(noise(0.4),'low',300)*np.exp(-T(0.4)*8),0,0.7))
put('spawn',verb(mix((rise,0,0.9),(rv,0,1),(gh,0,1),(hit,1.05,1.1)),0.35,IR_L))
put('spawnS',verb(mix((rise[int(0.5*SR):]*1.0,0,0.8),(taiko(66,0.6),0.6,0.6)),0.3,IR_H),0.6)
# ---------------------------------------------------------------- победа: кото (D-минорная пентатоника) + тайко + колокол
k=[62,65,67,69,72,74,77,81];parts=[]
for i,m in enumerate(k):parts.append((ks(NOTE(m),1.6,0.6,0.997)*0.55,0.12*i,1))
parts+= [(taiko(90,1.0),0.0,0.9),(taiko(70,1.2),0.48,1.0),(taiko(60,1.6),1.02,1.2)]
ch=sum(ks(NOTE(m),2.6,0.5,0.998) for m in (62,69,74,77))*0.4;parts.append((ch,1.04,1));parts.append((bell(NOTE(50),3.4)*0.5,1.04,1))
put('victory',verb(mix(*parts),0.35,IR_L))
put('clear',verb(mix((taiko(85,0.8),0,0.9),(taiko(68,1.0),0.22,1),(ks(NOTE(69),1.2,0.6)*0.6,0.22,1),(ks(NOTE(74),1.4,0.6)*0.6,0.34,1),(ks(NOTE(81),1.6,0.7)*0.5,0.46,1),(bell(NOTE(62),2.2)*0.35,0.46,1)),0.35,IR_L),0.8)
# ---------------------------------------------------------------- телепортация
t=T(2.2);up=sweep_bp(2.2,180,5200,1.4,lambda k:np.sin(np.pi*np.minimum(1,k*1.15))**1.5)
sh=sum(shimmer(f,2.2,9+3*j)*(t/2.2)**1.5 for j,f in enumerate([NOTE(81),NOTE(88),NOTE(93)]))*0.06
boom=mix((taiko(46,1.6),0,1.2),(filt(noise(0.8),'low',500)*np.exp(-T(0.8)*5),0,0.6))
put('teleport',verb(mix((up,0,0.8),(sh,0,1),(boom,1.85,1)),0.4,IR_L))
t=T(1.0);put('arrive',verb(mix((boom,0,1),(sweep_bp(1.0,4000,300,1.2,lambda k:np.exp(-k*4)),0,0.7),(sum(shimmer(f,1.0,13)*np.exp(-t*3) for f in (NOTE(86),NOTE(93)))*0.08,0,1)),0.4,IR_L))
# ---------------------------------------------------------------- одна катана: перчатка Они, заряд, «Дзан»
for i in range(2):
    fire=filt(noise(0.45),'band',(300,2400))*env(int(0.45*SR),0.01,0.12);put('oniPunch%d'%i,verb(sat(mix((pitch(pu[i],0.62),0,1),(fire,0.01,0.6),(taiko(58,0.7),0,0.9)),2.4),0.3,IR_H))
t=T(1.4);put('oniBlast',verb(sat(mix((taiko(40,1.4),0,1.3),(filt(noise(1.4),'low',700)*np.exp(-t*3),0,0.8),(sweep_bp(1.0,2400,200,1.0,lambda k:np.exp(-k*3)),0,0.6),(pitch(ken('impactWood_heavy_001'),0.6),0,0.6)),1.8),0.4,IR_L))
t=T(0.9);put('charge',(sweep_bp(0.9,300,2600,3.0,lambda k:k**1.5)+np.sin(2*np.pi*np.cumsum(220+600*(t/0.9)**2)/SR)*0.25*(t/0.9))*0.8,0.5)
t=T(1.6);zan=mix((sweep_bp(0.25,6000,1400,1.8,lambda k:np.sin(np.pi*k)**0.8),0,1),(bell(2350,1.6,((1,1,1),(1.5,0.4,1.4),(2.7,0.3,2)))*0.35,0.05,1),(pitch(sl[0],0.8),0.02,0.9),(taiko(80,0.6),0.04,0.7))
put('zan',verb(zan,0.45,IR_L))
put('zanReady',verb(bell(1760,0.8,((1,1,1.2),(2.0,0.4,2)))*0.6,0.3),0.4)
# ---------------------------------------------------------------- Кагэмару (босс дома): тяжёлый удар о пол, широкий взмах
for i in range(2):
    put('slam%d'%i,verb(sat(mix((taiko(42,1.6),0,1.3),(pitch(ken('impactWood_heavy_00%d'%(i+2)),0.55),0,1),(pitch(ken('impactPlate_heavy_00%d'%(i+2)),0.5),0,0.6),(filt(noise(1.2),'low',400)*np.exp(-T(1.2)*3.5),0.02,0.8)),2),0.35,IR_L))
put('bigSwing',mix((sweep_bp(0.6,160,900,0.9,lambda k:np.sin(np.pi*k)**1.8),0,1),(sweep_bp(0.55,700,2400,1.4,lambda k:np.sin(np.pi*k)**2.5),0.03,0.4)),0.85)
put('bossRoar',verb(sat(mix((filt(noise(1.4),'band',(90,700))*env(int(1.4*SR),0.15,0.6),0,1),(np.sin(2*np.pi*np.cumsum(70+20*np.sin(2*np.pi*7*T(1.4)))/SR)*env(int(1.4*SR),0.1,0.7),0,0.8)),2.5),0.4,IR_L),0.8)
# ---------------------------------------------------------------- замок сундука, крышка, бумага
put('lockIn',verb(mix((ken('metalClick'),0,1),(filt(noise(0.03),'high',3000)*np.exp(-T(0.03)*120),0,0.3)),0.15),0.6)
put('lockTurn',verb(mix((ken('metalLatch'),0,1),(pitch(ken('impactMetal_light_001'),0.8),0.02,0.5)),0.2),0.75)
put('lidCreak',verb(pitch(ken('creak1'),1.1),0.25),0.55)
put('paper',verb(mix((ken('bookFlip1'),0,1),(ken('cloth2'),0.05,0.4)),0.15),0.6)
# ---------------------------------------------------------------- запись
J={}
for k,x in BANK.items():
    w=os.path.join(OUT,k+'.wav');m=os.path.join(OUT,k+'.mp3');pcm=(np.clip(x,-1,1)*32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(SR),'-ac','1','-i','-','-b:a','80k',m],input=pcm,check=True)
    J[k]=base64.b64encode(open(m,'rb').read()).decode()
open(os.path.join(ROOT,'blender','out','niten_sfx.json'),'w').write(json.dumps(J,separators=(',',':')))
print('sfx',len(J),'KB',sum(len(v) for v in J.values())//1024)
