# v0.15: ГЛАВА 7 «Перевал Тишины» — процедурная горная локация (террасы, лестницы, храм на вершине)
#          + новые враги: Тэнгу-ямабуси (TG), Ива-ёкай (IW), Они-яри (YA).
# python3 blender/ext/peak.py        -> blender/out/niten_peak.glb + game/src/gP.js (+ карта)
# python3 blender/ext/peak.py lv     -> только локация (быстрая проверка)
import bpy,bmesh,sys,os,json,math,base64,random
import numpy as np
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
sys.path.insert(0,os.path.join(HERE,'..'))
import tex as TX
from lib import *
OUT=os.path.join(HERE,'..','out','peak');os.makedirs(OUT,exist_ok=True)
ROOT=os.path.join(HERE,'..','..')
NAVB=(-24,24,-30,44);CS=0.4
SPAWN=(0,-18.0)
STEP=0.16
TERR=[(-30,0.0),(-16,0.0),(-11,0.0),(-5,1.6),(-1,1.6),(5,3.2),(9,3.2),(15,4.8),(19,4.8),(25,6.4),(44,6.4)]
PLAT=6.4
HALF=3.6
MATS={}
# лестница в «Родной деревне» (kak): поднимается от деревни к площадке у скалы, оттуда — переход на перевал
VST=dict(x=-40.5,z=-6.0,y=0.05,n=35,rise=0.16,depth=0.457,w=3.6,platY=5.65)
def clean():bpy.ops.wm.read_factory_settings(use_empty=True)
# ------------------------------------------------------------------ текстуры/материалы
def rocktex():
    n=512
    a=TX.fbm(n,2.1,61);b=TX.fbm(n,2.9,62);c=TX.fbm(n,1.3,63)
    cr=np.clip(1-np.abs(TX.fbm(n,3.6,64)-0.5)*22,0,1)*0.5
    h=a*0.55+b*0.3+c*0.15
    col=np.dstack([0.30+0.17*b-0.12*cr,0.295+0.16*b-0.12*cr,0.28+0.14*b-0.1*cr])*(0.84+0.32*a)[...,None]
    TX.save('rock_c',col);TX.save('rock_n',TX.norm_from_h(h,2.4))
def make_mats():
    MATS.update(dict(rock=mat('pk_rock',(1,1,1),0.92,0.0,tex='rock_c',ntex='rock_n',nstr=1.5,dens=0.6),
      stone=mat('pk_stone',(1,1,1),0.8,0.0,tex='paving_c',ntex='paving_n',nstr=1.2,dens=0.9),
      moss=mat('pk_moss',(1,1,1),0.95,0.0,tex='ground_moss_c',ntex='ground_moss_n',nstr=1.0,dens=1.6),
      wood=mat('pk_wood',(1,1,1),0.8,0.0,tex='wood_c',ntex='wood_n',dens=3),
      verm=mat('pk_vermilion',(0.44,0.06,0.04),0.55,0.0,ntex='wood_n',dens=2),
      rope=mat('pk_rope',(0.45,0.4,0.26),0.95,0.0,tex='straw_c',dens=8),
      flag=mat('pk_flag',(1,1,1),0.9,0.0,tex='cloth_c',ntex='cloth_n',dens=8,double=True),
      lamp=mat('pk_lampwin',(1,0.72,0.4),0.4,0.0,emis=(1.0,0.62,0.28),es=3.0,dens=4),
      dark=mat('pk_dark',(0.05,0.045,0.05),0.6,0.1,dens=4),
      glow=mat('pk_windglow',(0.55,0.8,1.0),0.3,0.0,emis=(0.45,0.8,1.0),es=6.0,dens=4),
      feather=mat('tg_feather',(0.03,0.028,0.036),0.42,0.05,tex='tar_c',ntex='tar_n',nstr=1.2,dens=8),
      tcloth=mat('tg_cloth',(0.16,0.13,0.18),0.95,0.0,tex='cloth_c',ntex='cloth_n',dens=8,double=True),
      beak=mat('tg_beak',(0.72,0.2,0.12),0.45,0.0,ntex='bone_n',dens=6),
      teye=mat('tg_eye',(1,0.85,0.3),0.2,0.0,emis=(1.0,0.75,0.2),es=10),
      tsteel=mat('tg_steel',(0.55,0.55,0.6),0.3,1.0,ntex='metal_n',orm='metal_orm',dens=8),
      stone2=mat('iw_stone',(1,1,1),0.95,0.0,tex='rock_c',ntex='rock_n',nstr=1.8,dens=0.7),
      crack=mat('iw_crack',(1,0.3,0.1),0.4,0.0,emis=(1.0,0.24,0.06),es=4.0),
      iweye=mat('iw_eye',(1,0.9,0.5),0.2,0.0,emis=(1.0,0.5,0.1),es=12),
      ya_plate=mat('ya_plate',(0.09,0.08,0.09),0.5,0.55,ntex='kozane_n',dens=4),
      ya_cord=mat('ya_cord',(0.5,0.05,0.04),0.85,0.0,tex='cloth_c',dens=20),
      ya_skin=mat('ya_skin',(0.55,0.32,0.26),0.55,0.0,tex='skin_c',ntex='skin_n',dens=8),
      ya_wood=mat('ya_wood',(1,1,1),0.8,0.0,tex='wood_c',ntex='wood_n',dens=4),
      ya_steel=mat('ya_steel',(0.62,0.63,0.68),0.25,1.0,ntex='metal_n',orm='metal_orm',dens=8),
      ya_eye=mat('ya_eye',(1,0.25,0.15),0.2,0.0,emis=(1.0,0.15,0.08),es=9)))
def bx(sx,sy,sz,seg=1):return box(sx,sy,sz,(0,0,0),seg)
def cyl(c,r,h,seg=12):
    return lathe([(0.0001,-h/2),(r,-h/2),(r,h/2),(0.0001,h/2)],seg,cap0=True,cap1=True,c=c)
# ------------------------------------------------------------------ рельеф
def path_x(z):return 1.6*math.sin(z*0.11)
def ramp(z):
    if z<=TERR[0][0]:return TERR[0][1]
    for (z0,y0),(z1,y1) in zip(TERR,TERR[1:]):
        if z<=z1:return y0+(y1-y0)*(z-z0)/(z1-z0)
    return TERR[-1][1]
def base_y(z):return round(ramp(z)/STEP)*STEP
def ground_y(x,z):
    y=base_y(z);d=abs(x-path_x(z))
    if d<=HALF:return y
    t=d-HALF
    return y+min(18.0,1.30*t*t)
def gmesh(x0,x1,z0,z1,cell,fn,mat_,name,dens=1.0):
    nx=int(round((x1-x0)/cell));nz=int(round((z1-z0)/cell))
    verts=[];faces=[];uvs=[]
    for j in range(nz+1):
        for i in range(nx+1):
            x=x0+i*cell;z=z0+j*cell
            verts.append((x,fn(x,z),z));uvs.append((x*dens,z*dens))
    for j in range(nz):
        for i in range(nx):
            a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
    fu=[[uvs[i] for i in f] for f in faces]
    return mk(name,(verts,faces,fu),mat_)
def terrain():
    obs=[gmesh(-24,24,-30,44,0.4,ground_y,MATS['stone'],'peak_road',0.55)]
    def band(sd):
        nx=20;nz=148
        verts=[];faces=[];uvs=[]
        for j in range(nz+1):
            z=-30+j*0.5
            for i in range(nx+1):
                d=HALF+i*0.6
                x=path_x(z)+sd*d
                verts.append((x,ground_y(x,z),z));uvs.append((x*0.25,z*0.25))
        for j in range(nz):
            for i in range(nx):
                a=j*(nx+1)+i
                faces.append((a,a+1,a+nx+2,a+nx+1) if sd>0 else (a+1,a,a+nx+1,a+nx+2))
        fu=[[uvs[i] for i in f] for f in faces]
        return mk('peak_slope%d'%sd,(verts,faces,fu),MATS['rock'])
    obs.append(band(1));obs.append(band(-1))
    return obs
def stairs():
    obs=[]
    for (z0,z1) in ((-11,-5),(-1,5),(9,15),(19,25)):
        n=10
        for k in range(n):
            zz=z0+(z1-z0)*(k+1)/n;yy=base_y(zz-0.01)
            obs.append(mk('peak_step_%d_%d'%(int(-z0*10),k),bx(2*HALF+0.5,0.2,0.62),MATS['stone'],loc=(path_x(zz),yy-0.1,zz)))
        for sd in(-1,1):
            for k in range(7):
                t=(k+0.5)/7;zz=z0+(z1-z0)*t;yy=base_y(zz)
                xc=path_x(zz)+sd*(HALF+0.5);h=1.0+0.4*math.sin(zz*0.7)
                obs.append(mk('peak_wall_%d_%d_%d'%(int(-z0*10),sd,k),bx(0.44,h,0.95),MATS['stone'],loc=(xc,yy+h/2-0.25,zz)))
    return obs
# ------------------------------------------------------------------ декор
def rock(name,x,y,z,s,seed):
    rnd=random.Random(seed)
    o=mk(name,bx(s,s*0.9,s,3),MATS['rock'],loc=(x,y+s*0.2,z),sub=1,disp=lambda p,n:0.11*s*fbm3(p,2.6/s,4,seed))
    o.rotation_euler=(rnd.uniform(-0.3,0.3),rnd.uniform(0,6.28),rnd.uniform(-0.3,0.3))
    return o
def lantern(name,x,y,z):
    P=[]
    def B(nm,c,s):
        P.append(mk(name+nm,bx(*s),MATS['stone'],loc=(c[0]+x,c[1]+y,c[2]+z)))
    B('_b',(0,0.10,0),(0.56,0.2,0.56));B('_s',(0,0.55,0),(0.2,0.7,0.2))
    B('_h',(0,1.05,0),(0.44,0.34,0.44));B('_w',(0,1.05,0),(0.3,0.24,0.3))
    B('_r',(0,1.36,0),(0.6,0.16,0.6));B('_c',(0,1.52,0),(0.16,0.14,0.16))
    P[3].data.materials.clear();P[3].data.materials.append(MATS['lamp'])
    return P
def torii(name,x,y,z,sc=1.0):
    P=[]
    for sd in(-1,1):
        P.append(mk(name+'_p%d'%sd,cyl((sd*1.75*sc,2.05*sc,0),0.19*sc,4.2*sc,12),MATS['verm'],loc=(x,y,z)))
    P.append(mk(name+'_b1',bx(4.7*sc,0.3*sc,0.42*sc),MATS['verm'],loc=(x,y+4.15*sc,z)))
    P.append(mk(name+'_b2',bx(3.9*sc,0.22*sc,0.34*sc),MATS['verm'],loc=(x,y+3.45*sc,z)))
    return P
def shrine(name,x,y,z):
    P=[mk(name+'_base',bx(4.2,0.5,3.4),MATS['stone'],loc=(x,y+0.25,z)),
       mk(name+'_body',bx(2.1,1.7,1.7),MATS['wood'],loc=(x,y+1.35,z)),
       mk(name+'_roof',bx(3.1,0.34,2.7),MATS['dark'],loc=(x,y+2.4,z)),
       mk(name+'_roof2',bx(2.5,0.28,2.2),MATS['dark'],loc=(x,y+2.75,z)),
       mk(name+'_door',bx(1.2,1.2,0.14),MATS['verm'],loc=(x,y+1.2,z+0.9))]
    return P
def altar(name,x,y,z):
    P=[mk(name+'_ring',lathe([(1.5,0.0),(1.62,0.22),(1.45,0.42),(1.2,0.48)],28,cap0=True),MATS['stone'],loc=(x,y,z))]
    for k in range(3):
        a=TAU*k/3
        P.append(mk(name+'_orb%d'%k,lathe([(0.0001,-0.16),(0.1,-0.11),(0.15,0),(0.1,0.11),(0.0001,0.16)],14,cap0=True,cap1=True),MATS['glow'],loc=(x+math.sin(a)*0.78,y+1.05,z+math.cos(a)*0.78)))
    return P
def rope_flags(name,z):
    P=[];y=base_y(z);xc=path_x(z)
    for sd in(-1,1):
        P.append(mk(name+'_p%d'%sd,cyl((xc+sd*(HALF+1.1),y+2.6,z),0.09,5.2,10),MATS['wood']))
    pts=[(xc+(t*2-1)*(HALF+1.1),y+4.9-0.55*(1-(t*2-1)**2),z+math.sin(t*3.1)*0.35) for t in np.linspace(0,1,13)]
    P.append(mk(name+'_rope',tube(pts,lambda t:0.028,6),MATS['rope']))
    for k in range(1,12):
        px,py,pz=pts[k]
        P.append(mk(name+'_f%d'%k,plate(0.42,0.62,0.01,c=(px,py-0.34,pz)),MATS['flag']))
    return P
def grass(name,x,y,z,rnd):
    gs=[]
    for k in range(5):
        a=rnd.uniform(0,TAU);r=rnd.uniform(0.02,0.14);h=rnd.uniform(0.24,0.5)
        b=(x+math.cos(a)*r,y,z+math.sin(a)*r)
        gs.append(tube([b,(b[0]+math.cos(a)*0.1,b[1]+h*0.6,b[2]+math.sin(a)*0.1),(b[0]+math.cos(a)*0.24,b[1]+h,b[2]+math.sin(a)*0.24)],lambda t:0.015*(1-0.85*t),4))
    return mk(name,merge_geo(*gs),MATS['moss'])
def decor():
    obs=[];rnd=random.Random(11)
    for z in (-13.5,2.0,12.0,20.5):
        obs+=torii('peak_torii%d'%int(z*10),path_x(z),base_y(z),z,1.0 if z<10 else 0.92)
    for z in np.arange(-15,26,3.4):
        for sd in(-1,1):
            if rnd.random()<0.42:continue
            obs+=lantern('peak_lan%d_%d'%(int(z*10),sd),path_x(z)+sd*(HALF+0.9),base_y(z),z)
    for z in (-9.5,6.0,17.5):
        obs+=rope_flags('peak_rf%d'%int(z*10),z)
    for i in range(26):
        z=rnd.uniform(-28,42);sd=rnd.choice((-1,1))
        x=path_x(z)+sd*rnd.uniform(HALF+0.4,HALF+3.2)
        obs.append(rock('peak_rock%d'%i,x,ground_y(x,z)-0.15,z,rnd.uniform(0.5,1.5),i+3))
    for i in range(14):
        z=rnd.uniform(-26,40);sd=rnd.choice((-1,1))
        x=path_x(z)+sd*rnd.uniform(HALF+0.5,HALF+2.6)
        obs.append(grass('peak_grass%d'%i,x,ground_y(x,z),z,rnd))
    obs+=shrine('peak_shrine',path_x(35.5),PLAT,35.5)
    obs+=altar('peak_altar',path_x(30.0),PLAT,30.0)
    for i in range(7):
        a=rnd.uniform(0,TAU);r=rnd.uniform(2.5,6)
        x=path_x(-18)+math.cos(a)*r;z=-18+math.sin(a)*r
        obs.append(rock('peak_deb%d'%i,x,ground_y(x,z)-0.1,z,rnd.uniform(0.3,0.8),i+40))
    return obs
# ------------------------------------------------------------------ лестница в деревне (kak)
def vstairs():
    obs=[];V=VST;x=V['x'];z0=V['z'];y0=V['y'];n=V['n'];dep=V['depth'];rise=V['rise']
    for k in range(n):
        zz=z0+k*dep;yy=y0+k*rise
        obs.append(mk('peak_vstep%d'%k,bx(V['w'],0.2,dep+0.02),MATS['stone'],loc=(x,yy-0.1,zz+dep/2)))
        if k%7==0 and k>0:
            for sd in(-1,1):
                obs.append(mk('peak_vpil%d_%d'%(k,sd),cyl((x+sd*(V['w']/2-0.2),yy/2,zz),0.15,yy+0.3,10),MATS['stone']))
    ztop=z0+n*dep;ytop=y0+n*rise
    obs.append(mk('peak_vplat',bx(5.2,0.32,4.0),MATS['stone'],loc=(x,ytop-0.16,ztop+1.9)))
    for sd in(-1,1):
        for sz in(0,1):
            obs.append(mk('peak_vpilP%d_%d'%(sd,sz),cyl((x+sd*2.1,ytop/2,ztop+0.6+sz*2.4),0.2,ytop,10),MATS['stone']))
    for sd in(-1,1):
        pts=[(x+sd*(V['w']/2-0.05),y0+k*rise+1.0,z0+k*dep) for k in range(0,n,4)]
        obs.append(mk('peak_vrail%d'%sd,tube(pts,lambda t:0.05,6),MATS['wood']))
    obs+=torii('peak_vtorii',x,ytop,ztop+2.6,0.85)
    return obs
# ------------------------------------------------------------------ враги
def limb(name,pts,rs,material,parent,sub=2,disp=None):
    verts=list(pts);edges=[(i,i+1) for i in range(len(pts)-1)]
    radii=[(r,r) if isinstance(r,(int,float)) else r for r in rs]
    return skin_body(name,verts,edges,radii,material,parent,sub=sub,disp=disp)
def cracks(name,pts,parent,n=6,seed=1,col=None):
    rnd=random.Random(seed);gs=[]
    for k in range(n):
        a=rnd.uniform(0,TAU);path=[]
        for i in range(6):
            t=i/5;p=V(pts[0]).lerp(V(pts[-1]),t)
            path.append(tuple(p+V((math.cos(a)*0.12,math.sin(a*1.7)*0.06,math.sin(a)*0.12))))
        gs.append(tube(path,lambda t:0.014*(1-0.5*t),4))
    mk(name,merge_geo(*gs),col or MATS['crack'],parent)
def build_tengu(loc=(0,0,0)):
    P='TG';M=MATS;root=empty(P,loc);hips=empty(P+'__J_hips',(0,1.02,0),root)
    mk(P+'__hips',lathe([(0.14,0),(0.17,0.1),(0.15,0.24),(0.11,0.32)],16,cap0=True,cap1=True),M['feather'],hips)
    for sd,kn in((-1,'R'),(1,'L')):
        th=empty(P+'__J_thigh'+kn,(sd*0.11,0,0),hips)
        limb(P+'__thigh'+kn,[(0,0.02,0),(0,-0.18,0.02),(0,-0.4,0.03)],(0.06,0.05,0.038),M['feather'],th,1)
        sh=empty(P+'__J_shin'+kn,(0,-0.4,0.03),th)
        limb(P+'__shin'+kn,[(0,0,0),(0,-0.2,-0.01),(0,-0.4,0.05),(0,-0.46,0.14)],(0.038,0.03,0.026,0.02),M['feather'],sh,1)
        mk(P+'__shin'+kn+'__claws',merge_geo(*[tube([(0,-0.46,0.14),(sd*0.02,-0.48,0.2),(sd*0.04,-0.47,0.26)],lambda t:0.012*(1-0.8*t),5) for _ in range(3)]),M['beak'],sh)
    torso=empty(P+'__J_torso',(0,0.24,0),hips)
    rings=[ellipse_ring((0,0.02,0),0.17,0.13,20),ellipse_ring((0,0.26,0.01),0.2,0.15,20),ellipse_ring((0,0.5,0.0),0.19,0.14,20),ellipse_ring((0,0.62,0.0),0.12,0.1,20)]
    mk(P+'__torso',loft(rings,True,True,True),M['feather'],torso)
    mk(P+'__torso__robe',loft([ellipse_ring((0,0.0,0),0.19,0.15,18),ellipse_ring((0,0.34,0),0.21,0.17,18),ellipse_ring((0,0.6,0),0.16,0.13,18)],False,False,False),M['tcloth'],torso,disp=lambda p,n:0.008*fbm3(p,12,3))
    neck=empty(P+'__J_neck',(0,0.62,0),torso)
    mk(P+'__neck',lathe([(0.05,0),(0.055,0.1),(0.045,0.16)],12,cap0=True,cap1=True),M['feather'],neck)
    # голова: клюв-маска и глаза
    mk(P+'__neck__head',loft([ellipse_ring((0,0.16,0),0.075,0.08,16),ellipse_ring((0,0.26,0.01),0.09,0.095,16),ellipse_ring((0,0.36,0.0),0.075,0.08,16),ellipse_ring((0,0.42,-0.01),0.03,0.035,16)],True,True,True),M['feather'],neck)
    mk(P+'__neck__beak',merge_geo(lathe([(0.0001,0.0),(0.05,0.02),(0.055,0.06),(0.02,0.09)],10,cap0=True,cap1=True),),M['beak'],neck,loc=(0,0.28,0.16))
    for sd in(-1,1):
        mk(P+'__neck__eye%d'%sd,lathe([(0.0001,-0.02),(0.02,-0.012),(0.028,0),(0.02,0.012),(0.0001,0.02)],10,cap0=True,cap1=True),M['teye'],neck,loc=(sd*0.055,0.33,0.075))
    for sd,kn in((-1,'R'),(1,'L')):
        sh=empty(P+'__J_upperArm'+kn,(sd*0.2,0.5,0),torso);sh.rotation_euler=(0,0,0)
        limb(P+'__upperArm'+kn,[(0,0,0),(sd*0.16,0.02,0.02),(sd*0.3,0.0,0.05)],(0.055,0.045,0.038),M['feather'],sh,1)
        el=empty(P+'__J_foreArm'+kn,(sd*0.3,0.0,0.05),sh)
        limb(P+'__foreArm'+kn,[(0,0,0),(sd*0.06,-0.02,0.04),(sd*0.12,-0.02,0.1)],(0.036,0.03,0.026),M['feather'],el,1)
        hd=empty(P+'__J_hand'+kn,(sd*0.12,-0.02,0.1),el)
        mk(P+'__hand'+kn,lathe([(0.03,-0.03),(0.038,0),(0.03,0.04)],10,cap0=True,cap1=True),M['feather'],hd)
        # крыло: веер длинных перьев от плеча
        gs=[]
        for k in range(9):
            t=k/8;ln=0.55+0.5*math.sin(t*2.2)
            a=-0.35+t*1.5
            base=(sd*0.05,0.04,-0.02)
            tip=(base[0]+sd*(0.2+ln*math.cos(a)),base[1]+ln*math.sin(a)-0.15,base[2]-0.25-ln*0.35)
            gs.append(tube([base,(base[0]+sd*0.3,base[1]+0.05,base[2]-0.15),tip],lambda u:0.055*(1-0.75*u),5,flat=0.28))
        mk(P+'__upperArm'+kn+'__wing',merge_geo(*gs),M['feather'],sh,sub=1)
    return root
def build_iwa(loc=(0,0,0)):
    P='IW';M=MATS;root=empty(P,loc);hips=empty(P+'__J_hips',(0,1.1,0),root)
    mk(P+'__hips',bx(0.72,0.5,0.6,2),M['stone2'],hips,sub=1,disp=lambda p,n:0.05*fbm3(p,3.2,4,2))
    for sd,kn in((-1,'R'),(1,'L')):
        th=empty(P+'__J_thigh'+kn,(sd*0.22,0,0),hips)
        limb(P+'__thigh'+kn,[(0,0.02,0),(0,-0.2,0.01),(0,-0.42,0)],(0.16,0.15,0.14),M['stone2'],th,1,disp=lambda p,n:0.03*fbm3(p,4,3,5))
        sh=empty(P+'__J_shin'+kn,(0,-0.42,0),th)
        limb(P+'__shin'+kn,[(0,0,0),(0,-0.22,0.01),(0,-0.44,0.02),(0,-0.5,0.06)],(0.14,0.13,0.13,0.11),M['stone2'],sh,1,disp=lambda p,n:0.03*fbm3(p,4,3,6))
        mk(P+'__shin'+kn+'__foot',bx(0.3,0.16,0.44,1),M['stone2'],sh,loc=(0,-0.5,0.1))
    torso=empty(P+'__J_torso',(0,0.3,0),hips)
    mk(P+'__torso',bx(0.95,0.95,0.72,3),M['stone2'],torso,sub=1,disp=lambda p,n:0.07*fbm3(p,2.4,4,8))
    mk(P+'__torso__moss',bx(0.5,0.16,0.4,2),M['moss'],torso,loc=(0.16,0.42,0.1))
    neck=empty(P+'__J_neck',(0,0.5,0),torso)
    mk(P+'__neck',bx(0.42,0.36,0.4,2),M['stone2'],neck,sub=1,disp=lambda p,n:0.04*fbm3(p,5,3,9))
    mk(P+'__neck__eye',bx(0.3,0.07,0.06),M['iweye'],neck,loc=(0,0.06,0.19))
    for sd,kn in((-1,'R'),(1,'L')):
        sh=empty(P+'__J_upperArm'+kn,(sd*0.5,0.34,0),torso)
        limb(P+'__upperArm'+kn,[(0,0,0),(sd*0.14,-0.16,0.02),(sd*0.22,-0.36,0.04)],(0.17,0.15,0.13),M['stone2'],sh,1,disp=lambda p,n:0.035*fbm3(p,3.6,3,10))
        el=empty(P+'__J_foreArm'+kn,(sd*0.22,-0.36,0.04),sh)
        limb(P+'__foreArm'+kn,[(0,0,0),(sd*0.04,-0.2,0.02),(sd*0.06,-0.4,0.0)],(0.14,0.13,0.12),M['stone2'],el,1,disp=lambda p,n:0.035*fbm3(p,3.6,3,11))
        hd=empty(P+'__J_hand'+kn,(sd*0.06,-0.4,0.0),el)
        mk(P+'__hand'+kn,bx(0.3,0.32,0.3,2),M['stone2'],hd,sub=1,disp=lambda p,n:0.04*fbm3(p,5,3,12))
    cracks(P+'__torso__cracks',[(0.4,0.5,0.3),(-0.3,0.1,0.3)],torso,5,seed=3)
    cracks(P+'__hips__cracks',[(0.3,0.15,0.25),(-0.25,0.05,0.25)],hips,3,seed=4)
    return root
def build_yari(loc=(0,0,0)):
    P='YA';M=MATS;root=empty(P,loc);hips=empty(P+'__J_hips',(0,0.95,0),root)
    mk(P+'__hips',lathe([(0.16,0),(0.19,0.12),(0.17,0.3),(0.13,0.38)],16,cap0=True,cap1=True),M['ya_plate'],hips)
    mk(P+'__hips__kusazuri',loft([ellipse_ring((0,0.05,0),0.2,0.16,18),ellipse_ring((0,-0.16,0),0.26,0.21,18),ellipse_ring((0,-0.3,0),0.3,0.24,18)],False,False,False),M['ya_cord'],hips,disp=lambda p,n:0.01*fbm3(p,10,3))
    for sd,kn in((-1,'R'),(1,'L')):
        th=empty(P+'__J_thigh'+kn,(sd*0.12,0,0),hips)
        limb(P+'__thigh'+kn,[(0,0.02,0),(0,-0.2,0.02),(0,-0.4,0.03)],(0.085,0.075,0.06),M['ya_plate'],th,1)
        sh=empty(P+'__J_shin'+kn,(0,-0.4,0.03),th)
        limb(P+'__shin'+kn,[(0,0,0),(0,-0.22,0.0),(0,-0.42,0.02),(0,-0.46,0.08)],(0.062,0.055,0.05,0.045),M['ya_plate'],sh,1)
    torso=empty(P+'__J_torso',(0,0.3,0),hips)
    mk(P+'__torso',lathe([(0.2,0),(0.25,0.2),(0.26,0.42),(0.2,0.6)],18,cap0=True,cap1=True),M['ya_plate'],torso)
    for k in range(4):
        y=0.1+k*0.13
        mk(P+'__torso__plate%d'%k,loft([ellipse_ring((0,y,0),0.26,0.2,16),ellipse_ring((0,y+0.1,0),0.27,0.21,16)],False,False,False),M['ya_plate'],torso)
    mk(P+'__torso__sode',bx(0.7,0.28,0.4,2),M['ya_cord'],torso,loc=(0,0.52,0))
    neck=empty(P+'__J_neck',(0,0.6,0),torso)
    mk(P+'__neck',lathe([(0.07,0),(0.08,0.1),(0.06,0.16)],12,cap0=True,cap1=True),M['ya_skin'],neck)
    mk(P+'__neck__head',loft([ellipse_ring((0,0.16,0),0.11,0.115,18),ellipse_ring((0,0.3,0.01),0.13,0.135,18),ellipse_ring((0,0.44,0.0),0.1,0.105,18),ellipse_ring((0,0.5,-0.02),0.04,0.045,18)],True,True,True),M['ya_skin'],neck)
    mk(P+'__neck__jaw',bx(0.16,0.09,0.14,1),M['ya_skin'],neck,loc=(0,0.2,0.1))
    for sd in(-1,1):
        mk(P+'__neck__eye%d'%sd,lathe([(0.0001,-0.02),(0.018,-0.012),(0.026,0),(0.018,0.012),(0.0001,0.02)],10,cap0=True,cap1=True),M['ya_eye'],neck,loc=(sd*0.07,0.35,0.1))
        hg=tube([(sd*0.08,0.42,0.0),(sd*0.13,0.56,0.04),(sd*0.2,0.68,0.02)],lambda t:0.028*(1-0.8*t),6)
        mk(P+'__neck__horn%d'%sd,hg,M['ya_plate'],neck)
    for sd,kn in((-1,'R'),(1,'L')):
        sh=empty(P+'__J_upperArm'+kn,(sd*0.26,0.5,0),torso)
        limb(P+'__upperArm'+kn,[(0,0,0),(sd*0.04,-0.18,0.0),(sd*0.08,-0.36,0.02)],(0.09,0.08,0.07),M['ya_plate'],sh,1)
        el=empty(P+'__J_foreArm'+kn,(sd*0.08,-0.36,0.02),sh)
        limb(P+'__foreArm'+kn,[(0,0,0),(sd*0.02,-0.18,0.0),(sd*0.04,-0.36,0.02)],(0.07,0.062,0.055),M['ya_plate'],el,1)
        hd=empty(P+'__J_hand'+kn,(sd*0.04,-0.36,0.02),el)
        mk(P+'__hand'+kn,lathe([(0.04,-0.03),(0.05,0),(0.04,0.05)],10,cap0=True,cap1=True),M['ya_skin'],hd)
    return root
def enemy_props():
    """копьё (правая рука Яри) и щит (левая) — отдельными объектами, чтобы их можно было привязать в игре"""
    P='YA';M=MATS
    sp=merge_geo(tube([(0,0,-0.9),(0,0,0.2),(0,0,1.5)],lambda t:0.022,6),lathe([(0.0001,0),(0.035,0.05),(0.05,0.16),(0.02,0.3),(0.0001,0.36)],10,cap0=True,cap1=True,c=(0,0,1.5)))
    o=mk(P+'__prop__spear',sp,M['ya_steel'])
    sh=merge_geo(bx(0.72,0.95,0.09,2),lathe([(0.1,0),(0.12,0.02),(0.1,0.05)],14,cap0=True,cap1=True,c=(0,0,-0.05)))
    o2=mk(P+'__prop__shield',sh,M['ya_wood'],loc=(0,0,0))
    return [o,o2]
# ------------------------------------------------------------------ nav
def bvh_all():
    V=[];F=[]
    for o in [x for x in bpy.data.objects if x.type=='MESH']:
        n=len(V);V+=[v.co.copy() for v in o.data.vertices];F+=[[n+i for i in p.vertices] for p in o.data.polygons]
    return BVHTree.FromPolygons(V,F,epsilon=0.0)
def navbake(T,spawn):
    gx0,gx1,gz0,gz1=NAVB;w=int(round((gx1-gx0)/CS));h=int(round((gz1-gz0)/CS))
    H=np.full((h,w),np.nan);NZ=np.zeros((h,w));dn=Vector((0,0,-1));up=Vector((0,0,1))
    for j in range(h):
        for i in range(w):
            bx=gx0+(i+.5)*CS;by=-(gz0+(j+.5)*CS);r=T.ray_cast(Vector((bx,by,90)),dn,300)
            if r[0] is not None:H[j,i]=r[0].z;NZ[j,i]=abs(r[1].z)
    dirs=[Vector((math.cos(a),math.sin(a),0)) for a in np.arange(8)*math.pi/4];pad=0.4
    W=np.zeros((h,w),np.uint8)
    for j in range(h):
        for i in range(w):
            if np.isnan(H[j,i]) or NZ[j,i]<0.75:continue
            bx=gx0+(i+.5)*CS;by=-(gz0+(j+.5)*CS);hz=H[j,i];ok=1
            for zz in (0.5,1.3):
                for d in dirs:
                    if T.ray_cast(Vector((bx,by,hz+zz)),d,pad)[0] is not None:ok=0;break
                if not ok:break
            if ok and T.ray_cast(Vector((bx,by,hz+0.15)),up,1.8)[0] is not None:ok=0
            W[j,i]=ok
    def comp(G,seed):
        R=np.zeros_like(G);st=[seed];R[seed]=1
        while st:
            j,i=st.pop()
            for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
                a,b=j+dj,i+di
                if 0<=a<h and 0<=b<w and G[a,b] and not R[a,b] and abs(H[a,b]-H[j,i])<=0.5:R[a,b]=1;st.append((a,b))
        return R
    si=int((spawn[0]-gx0)/CS);sj=int((spawn[1]-gz0)/CS)
    if not W[sj,si]:
        cand=np.argwhere(W==1);dd=np.hypot(cand[:,0]-sj,cand[:,1]-si);sj,si=cand[dd.argmin()]
    R=comp(W,(sj,si))
    E=R.copy();Hn=np.where(np.isnan(H),-99,H)
    for dj,di in((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
        sh=np.roll(np.roll(Hn,-dj,0),-di,1);E[(Hn-sh)>0.55]=0
    E[0,:]=E[-1,:]=E[:,0]=E[:,-1]=0
    R=comp(E,(sj,si))
    print('NAV cells',int(W.sum()),'reach',int(R.sum()),'of',w*h)
    G=np.where(R>0,H,np.nan)
    for it in range(8):
        m=np.isnan(G)
        if not m.any():break
        acc=np.zeros_like(G);cnt=np.zeros_like(G)
        for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
            sh=np.roll(np.roll(G,dj,0),di,1);ok=~np.isnan(sh);acc[ok]+=sh[ok];cnt[ok]+=1
        fill=m&(cnt>0);G[fill]=acc[fill]/cnt[fill]
    G=np.where(np.isnan(G),np.nan_to_num(H,nan=0),G)
    ho=float(np.floor(np.nanmin(np.where(R>0,H,np.nan))-2))
    gh=np.clip(np.round((G-ho)*100),0,65535).astype('<u2')
    Ht=np.zeros((h,w),np.uint8);Hl=np.full((h,w),255,np.uint8);hs=0.25
    for j in range(h):
        for i in range(w):
            if not np.isnan(H[j,i]):Ht[j,i]=int(np.clip(round((H[j,i]-ho)/hs),0,254))
            if R[j,i]:
                bx=gx0+(i+.5)*CS;by=-(gz0+(j+.5)*CS);r=T.ray_cast(Vector((bx,by,H[j,i]+0.3)),up,40)
                if r[0] is not None:Hl[j,i]=int(np.clip(round((r[0].z-ho)/hs),0,254))
    nav=dict(x0=gx0,z0=gz0,cs=CS,w=w,h=h,ho=ho,hs=hs,b=base64.b64encode(np.packbits(R.ravel()).tobytes()).decode(),
        ht=base64.b64encode(Ht.tobytes()).decode(),hl=base64.b64encode(Hl.tobytes()).decode(),gh=base64.b64encode(gh.tobytes()).decode())
    np.save(os.path.join(OUT,'nav.npy'),R);np.save(os.path.join(OUT,'navh.npy'),H)
    return nav,R,H
def mapimg(R):
    sc=bpy.context.scene;gx0,gx1,gz0,gz1=NAVB;Wd=gx1-gx0;Hd=gz1-gz0
    cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam
    cam.data.type='ORTHO';cam.data.ortho_scale=max(Wd,Hd);cam.data.clip_end=1e5;cam.location=((gx0+gx1)/2,-(gz0+gz1)/2,150)
    Ls=bpy.data.objects.new('Ls',bpy.data.lights.new('Ls','SUN'));sc.collection.objects.link(Ls);Ls.data.energy=3.2;Ls.rotation_euler=(0.35,0.25,0)
    sc.world=bpy.data.worlds.new('w');sc.world.color=(0.5,0.5,0.5);sc.render.engine='CYCLES';sc.cycles.samples=8
    sc.render.resolution_x=1024;sc.render.resolution_y=int(1024*Hd/Wd);fp=os.path.join(OUT,'map_raw.png');sc.render.filepath=fp;bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam);bpy.data.objects.remove(Ls)
    from PIL import Image,ImageFilter,ImageOps
    im=Image.open(fp).convert('RGB');g=ImageOps.grayscale(im);g=ImageOps.autocontrast(g,2)
    a=np.asarray(g,np.float32)/255;paper=np.array([0.84,0.8,0.7]);ink=np.array([0.24,0.19,0.14])
    rgb=ink+(paper-ink)*a[...,None]**0.8
    Rm=np.asarray(Image.fromarray((R*255).astype(np.uint8)).resize(im.size,Image.NEAREST),np.float32)/255
    rgb=rgb*(0.84+0.16*Rm[...,None]);ed=np.asarray(Image.fromarray((Rm*255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES),np.float32)/255
    rgb=rgb*(1-0.5*ed[...,None])
    out=Image.fromarray((np.clip(rgb,0,1)*255).astype(np.uint8)).resize((768,int(768*Hd/Wd)),Image.LANCZOS)
    fpw=os.path.join(OUT,'map.webp');out.save(fpw,'WEBP',quality=72);print('MAP',os.path.getsize(fpw))
    return base64.b64encode(open(fpw,'rb').read()).decode()
# ------------------------------------------------------------------ main
def main():
    if not os.path.exists(os.path.join(HERE,'..','tex','tar_n.png')):TX.build()
    rocktex()
    clean();make_mats()
    obs=terrain()+stairs()+decor()+vstairs()
    if sys.argv[-1]!='lv':
        build_tengu((0,0,-8));build_iwa((4,0,-8));build_yari((8,0,-8));enemy_props()
    T=bvh_all()
    nav,R,H=navbake(T,SPAWN)
    mp=mapimg(R)
    k=0
    for o in [x for x in bpy.data.objects if x.type=='MESH']:
        nm=o.name
        if nm.startswith(('TG__','IW__','YA__')):continue
        g='vstair' if nm.startswith('peak_v') else ('peakd' if nm.startswith(('peak_torii','peak_lan','peak_rf','peak_shrine','peak_altar','peak_grass')) else 'peak')
        o.name='LV__%s__%d'%(g,k);k+=1
    for im in bpy.data.images:
        if im.size[0] and im.packed_file is None and im.filepath:
            try:im.pack()
            except Exception:pass
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True)
    f=os.path.join(HERE,'..','out','niten_peak.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_image_format='WEBP',export_image_quality=80,export_apply=True,export_yup=True,export_tangents=False,export_morph=False,export_skins=False,export_animations=False,export_extras=False)
    print('PEAK GLB',os.path.getsize(f))
    stairs_meta=[dict(x=round(path_x(-13),2),z=-13.0,y=round(base_y(-13),2),label='X — подняться на перевал'),
                 dict(x=round(path_x(-20),2),z=-20.0,y=round(base_y(-20),2),label='X — спуститься в деревню')]
    sp=[[0,-18.0],[0,-8.0],[1.5,1.0],[-1.2,11.0],[0.8,21.0],[0.0,31.0],[3.0,36.0],[-3.0,34.0]]
    vs=dict(base=[VST['x'],VST['z'],VST['y']],n=VST['n'],rise=VST['rise'],depth=VST['depth'],w=VST['w'],
            top=[VST['x'],round(VST['z']+VST['n']*VST['depth'],2),round(VST['y']+VST['n']*VST['rise'],2)],
            plat=dict(x0=VST['x']-2.6,x1=VST['x']+2.6,z0=round(VST['z']+VST['n']*VST['depth'],2),z1=round(VST['z']+VST['n']*VST['depth']+3.9,2),y=round(VST['y']+VST['n']*VST['rise'],2)),
            gate=[VST['x'],round(VST['z']+VST['n']*VST['depth']+2.4,2)])
    D=dict(nav=nav,spawn=list(SPAWN),stairs=stairs_meta,vstairs=vs,top=[round(path_x(31),2),31.0],altar=[round(path_x(30),2),PLAT,30.0],
           shrine=[round(path_x(35.5),2),PLAT,35.5],spawns=sp,map=mp,terr=TERR,plat=PLAT)
    open(os.path.join(ROOT,'game','src','gP.js'),'w').write('// v0.15: Перевал Тишины (генерирует blender/ext/peak.py): nav с высотами, точки, карта.\nconst PEAKD='+json.dumps(D,separators=(',',':'))+';\n')
    json.dump(D,open(os.path.join(OUT,'peak.json'),'w'))
    print('gP.js ok')
if __name__=='__main__':main()
