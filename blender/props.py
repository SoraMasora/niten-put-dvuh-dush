"""Окружение: каменный фонарь касуга-доро, ворота тории, храмовый колокол бонсё."""
import math
from lib import *
def M_props():
    return dict(stone=mat('stone',(0.62,0.63,0.6),0.92,tex='stone_c',ntex='stone_n',nstr=1.6,dens=1.6),lamp=mat('lamp',(1.0,0.75,0.4),0.6,emis=(1.0,0.6,0.25),es=3.0),
      red=mat('torii_red',(0.55,0.08,0.035),0.55,tex='wood_c',ntex='wood_n',nstr=0.6,coat=0.3,dens=1.2),black=mat('torii_black',(0.03,0.03,0.03),0.5,ntex='wood_n',dens=1.2),
      bronze=mat('bell_bronze',(0.28,0.3,0.22),0.45,0.9,tex='stone_c',ntex='stone_n',nstr=0.8,dens=1.5),gold=mat('gilt',(0.8,0.58,0.25),0.3,1.0,ntex='metal_n',nstr=0.4,dens=12),
      rope=mat('rope',(0.5,0.42,0.3),0.95,tex='straw_c',ntex='straw_n',dens=40),paper=mat('paper',(1,1,1),0.85,tex='paper_c',ntex='paper_n',dens=3,double=True))
def octa(r):return lambda a:1/math.cos(((a+math.pi/8)%(math.pi/4))-math.pi/8)
def build_lantern(M,loc=(0,0,0)):
    P='PR';root=empty(P+'__J_lantern',loc);n=8;f6=lambda a:1/math.cos(((a)%(math.pi/3))-math.pi/6)
    mk(P+'__lantern__base',lathe([(0.0001,0),(0.27,0),(0.27,0.07),(0.23,0.1),(0.16,0.14),(0.0001,0.14)],6,cap0=True,cap1=True,f=f6),M['stone'],root,bevel=0.006,sharp=40,disp=lambda p,n:0.004*fbm3(p,9,3))
    mk(P+'__lantern__pillar',lathe([(0.075,0.13),(0.085,0.16),(0.07,0.2),(0.065,0.42),(0.075,0.45),(0.065,0.48),(0.065,0.66),(0.08,0.7)],16,cap0=True,cap1=True),M['stone'],root,disp=lambda p,n:0.003*fbm3(p,12,3))
    mk(P+'__lantern__chudai',lathe([(0.0001,0.69),(0.12,0.69),(0.2,0.75),(0.22,0.8),(0.0001,0.8)],6,cap0=True,cap1=True,f=f6),M['stone'],root,bevel=0.005,sharp=40,disp=lambda p,n:0.003*fbm3(p,9,3))
    # огневая камера с окнами
    posts=[]
    for k in range(6):
        a=k*math.pi/3+math.pi/6;posts.append(xform(box(0.03,0.13,0.03,(0,0.93,0)),tr(math.sin(a)*0.15,0,math.cos(a)*0.15)))
    mk(P+'__lantern__posts',merge_geo(*posts),M['stone'],root,bevel=0.004,sharp=40)
    win=[]
    for k in range(6):
        a=k*math.pi/3;g=plate(0.13,0.2,0.01,nu=1,nv=1);g=xform(g,chain(roty(a),tr(math.sin(a)*0.13,0.93,math.cos(a)*0.13)));win.append(g)
    mk(P+'__lanternwin__win',merge_geo(*win),M['lamp'],root)
    mk(P+'__lantern__cap0',lathe([(0.0001,1.06),(0.2,1.06),(0.2,1.09),(0.0001,1.09)],6,cap0=True,cap1=True,f=f6),M['stone'],root,bevel=0.004,sharp=40)
    rp=[];NU=48
    for i in range(7):
        t=i/6;y=1.09+0.22*t**1.2;r=0.44*(1-t)+0.03
        rp.append([(math.sin(a)*r*f6(a),y+0.05*(1-t)*max(0,math.cos(3*a))**8*(t<0.3),math.cos(a)*r*f6(a)) for a in [TAU*j/NU for j in range(NU)]])
    v,fc,u=loft(rp,True,True,True);mk(P+'__lantern__roof',(v,fc,u),M['stone'],root,disp=lambda p,n:0.004*fbm3(p,7,3))
    for k in range(6):
        a=k*math.pi/3;b=V((math.sin(a)*0.46*f6(a),1.12,math.cos(a)*0.46*f6(a)))
        mk(P+'__lantern__warabi%d'%k,tube([tuple(b),tuple(b+V((math.sin(a)*0.04,0.05,math.cos(a)*0.04))),tuple(b+V((0,0.09,0)))],lambda t:0.035*(1-0.5*t),8),M['stone'],root,sub=1)
    mk(P+'__lantern__hoju',lathe([(0.0001,1.31),(0.07,1.33),(0.05,1.36),(0.075,1.4),(0.06,1.45),(0.02,1.49),(0.0001,1.5)],16,cap0=True,cap1=True),M['stone'],root,sub=1)
    return root
def build_torii(M,loc=(0,0,0)):
    P='PR';root=empty(P+'__J_torii',loc)
    for sd in(-1,1):
        mk(P+'__torii__hashira%d'%(sd+1),lathe([(0.2,0.25),(0.19,1.0),(0.17,3.85),(0.17,3.9)],20,c=(sd*1.6,0,0),cap1=True),M['red'],root)
        mk(P+'__toriib__kamebara%d'%(sd+1),lathe([(0.0001,0),(0.27,0),(0.3,0.12),(0.24,0.28),(0.0001,0.28)],20,c=(sd*1.6,0,0),cap0=True,cap1=True),M['black'],root,sub=1)
        mk(P+'__toriib__daiwa%d'%(sd+1),lathe([(0.2,3.86),(0.23,3.88),(0.23,4.0),(0.2,4.02)],20,c=(sd*1.6,0,0),cap1=True),M['black'],root)
    rings=[]
    for i in range(41):
        t=i/40;x=-2.55+5.1*t;up=0.28*abs(2*t-1)**3
        rings.append([(x,4.06+up+dy,dz) for dy,dz in((-0.12,0.22),(0.1,0.25),(0.1,-0.25),(-0.12,-0.22))])
    mk(P+'__toriib__kasagi',loft([[ (p[0],p[1],p[2]) for p in r] for r in rings],True,True,True),M['black'],root,bevel=0.02,sharp=35)
    rings=[]
    for i in range(41):
        t=i/40;x=-2.4+4.8*t;up=0.2*abs(2*t-1)**3
        rings.append([(x,3.88+up+dy,dz) for dy,dz in((-0.1,0.2),(0.09,0.2),(0.09,-0.2),(-0.1,-0.2))])
    mk(P+'__torii__shimaki',loft(rings,True,True,True),M['red'],root,bevel=0.015,sharp=35)
    mk(P+'__torii__nuki',box(2.2,0.1,0.11,(0,3.3,0)),M['red'],root,bevel=0.012,sharp=35)
    mk(P+'__torii__gakuzuka',box(0.09,0.24,0.09,(0,3.6,0)),M['red'],root,bevel=0.01,sharp=35)
    mk(P+'__torii__gaku',box(0.24,0.32,0.03,(0,3.6,0.12)),M['black'],root,bevel=0.012,sharp=35)
    # симэнава
    path=[(-1.45+2.9*t,2.95-0.25*math.sin(math.pi*t),0.0) for t in [i/30 for i in range(31)]]
    mk(P+'__torii__shimenawa',tube(path,lambda t:0.06*(1-0.4*abs(2*t-1)),10,twist=0.5,rfn=lambda a,t:1+0.25*math.sin(a*2)),M['rope'],root)
    sh=[]
    for k in range(5):
        x=-1.0+0.5*k;y=2.95-0.25*math.sin(math.pi*(x+1.45)/2.9)-0.05
        for q in range(4):
            g=plate(0.07,0.09,0.004,nu=1,nv=1);g=xform(g,tr(x+(0.03 if q%2 else -0.03),y-0.06-q*0.085,0.03*(q%2)));sh.append(g)
    mk(P+'__torii__shide',merge_geo(*sh),M['paper'],root)
    return root
def build_bell(M,loc=(0,0,0)):
    P='PR';root=empty(P+'__J_bell',loc)
    prof=[(0.0001,0.0),(0.28,0.0),(0.36,-0.04)]+[(0.36+t*0.5+t**4*0.28,-0.04-t*1.76) for t in [i/16 for i in range(1,17)]]+[(1.08,-1.82),(1.02,-1.84),(0.96,-1.78)]
    mk(P+'__bell__body',lathe(prof,48,cap0=True),M['bronze'],root,disp=lambda p,n:0.004*fbm3(p,5,3))
    bands=[]
    for y,r in((-0.35,None),(-0.9,None),(-1.35,None)):
        t=(-y-0.04)/1.76;rr=0.36+t*0.5+t**4*0.28+0.012
        bands.append(lathe([(rr-0.012,y-0.025),(rr,y-0.02),(rr,y+0.02),(rr-0.012,y+0.025)],48))
    mk(P+'__bell__bands',merge_geo(*bands),M['bronze'],root)
    nip=[]
    for k in range(4):
        base=k*math.pi/2+math.pi/4
        for i in range(5):
            for j in range(3):
                a=base-0.22+0.11*j;y=-0.42-i*0.09;t=(-y-0.04)/1.76;rr=0.36+t*0.5+t**4*0.28
                c=V((math.sin(a)*rr,y,math.cos(a)*rr));nip.append(xform(lathe([(0.0001,0.0),(0.028,0.002),(0.022,0.03),(0.0001,0.045)],8,cap0=True,cap1=True),chain(rotx(math.pi/2),roty(a),tr(c.x,c.y,c.z))))
    mk(P+'__bell__chi',merge_geo(*nip),M['bronze'],root)
    for sd in(-1,1):
        a=sd*math.pi/2;t=0.82;y=-0.04-t*1.76;rr=0.36+t*0.5+t**4*0.28
        mk(P+'__bell__tsukiza%d'%(sd+1),xform(lathe([(0.0001,0),(0.11,0.0),(0.11,0.02),(0.07,0.03),(0.0001,0.035)],16,cap0=True,cap1=True),chain(rotx(math.pi/2),roty(a),tr(math.sin(a)*rr,y,math.cos(a)*rr))),M['bronze'],root)
    mk(P+'__bell__ryuzu',tube([(-0.12,0.0,0),(-0.1,0.2,0),(0,0.28,0),(0.1,0.2,0),(0.12,0.0,0)],lambda t:0.055,12),M['bronze'],root,sub=1)
    return root
