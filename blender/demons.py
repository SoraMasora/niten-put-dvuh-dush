"""Гэнма: пеший копейщик (GE), Хитоцумэ Гаса (GA), Кама-итачи (KA), Лучница-рокурокуби (YU)."""
import math, random
from lib import *
from chars import head_point, smooth, gauss, build_hair
def M_demon():
    return dict(tar=mat('tar',(0.02,0.018,0.022),0.18,0.3,tex='tar_c',ntex='tar_n',nstr=1.4,coat=1.0,dens=6),
      vein=mat('vein',(0.5,0.03,0.05),0.4,emis=(1.0,0.06,0.1),es=2.2),eye=mat('eye_red',(1,0.1,0.08),0.2,emis=(1.0,0.08,0.05),es=12),
      rot=mat('rot_kozane',(1,1,1),0.6,0.1,tex='kozane_rot_c',ntex='kozane_n',nstr=1.5,dens=2.27),iron=mat('rust_iron',(0.16,0.12,0.1),0.7,0.6,ntex='metal_n',nstr=1.0,dens=8),
      bone=mat('bone',(1,1,1),0.55,tex='bone_c',ntex='bone_n',dens=8),straw=mat('straw',(1,1,1),0.95,tex='straw_c',ntex='straw_n',dens=8),
      wood=mat('wood',(1,1,1),0.75,tex='wood_c',ntex='wood_n',dens=6),steel=mat('spear_steel',(0.6,0.6,0.62),0.25,1.0,ntex='metal_n',orm='metal_orm',dens=10),
      rag=mat('rag',(0.22,0.18,0.14),1.0,tex='cloth_c',ntex='cloth_n',nstr=1.5,dens=14,double=True),paper=mat('paper',(1,1,1),0.85,tex='paper_c',ntex='paper_n',dens=3,double=True),
      pale=mat('pale_skin',(0.85,0.82,0.78),0.45,tex='skin_c',ntex='skin_n',dens=12),white=mat('ghost_white',(0.75,0.73,0.68),0.95,tex='cloth_c',ntex='cloth_n',dens=14,double=True),
      hair=mat('hair',(0.03,0.026,0.024),0.45,tex='hair_c',ntex='hair_n',dens=20,sheen=0.15),cord=mat('cord_red',(0.45,0.05,0.04),0.8,tex='cloth_c',ntex='cloth_n',dens=60),
      tooth=mat('tooth',(0.75,0.7,0.58),0.4,dens=10),skin=mat('pale_skin',(0.85,0.82,0.78),0.45,tex='skin_c',ntex='skin_n',dens=12))
def lumps(amp=0.012,s=9,o=0):
    return lambda p,n:amp*fbm3(p,s,4,o)+amp*0.4*(1-abs(fbm3(p,s*2.7,2,o+5)))**3
def veins_on(name,chainpts,radii,parent,M,n=5,seed=1):
    """Светящиеся извилистые прожилки по поверхности конечности."""
    rnd=random.Random(seed);gs=[];C=[V(p) for p in chainpts];R=[(r if isinstance(r,(int,float)) else r[0]) for r in radii]
    for k in range(n):
        a=rnd.uniform(0,TAU);path=[];t0=rnd.uniform(0,0.3);t1=rnd.uniform(0.6,1.0);M_=14
        for i in range(M_+1):
            t=t0+(t1-t0)*i/M_;f=t*(len(C)-1);j=min(int(f),len(C)-2);u=f-j
            p=C[j]*(1-u)+C[j+1]*u;r=R[j]*(1-u)+R[j+1]*u
            d=(C[j+1]-C[j]).normalized();up=V((0,0,1)) if abs(d.z)<0.9 else V((1,0,0));n1=d.cross(up).normalized();n2=d.cross(n1)
            a+=rnd.uniform(-0.5,0.5);path.append(tuple(p+(n1*math.cos(a)+n2*math.sin(a))*(r*1.0+0.003)))
        gs.append(tube(path,lambda t:0.0032*(1-0.6*t),4))
        if rnd.random()<0.6:
            b=rnd.randint(3,M_-3);bp=V(path[b]);br=[tuple(bp)]
            for q in range(4):bp=bp+V((rnd.uniform(-1,1),rnd.uniform(-1,1),rnd.uniform(-1,1)))*0.02;br.append(tuple(bp))
            gs.append(tube(br,lambda t:0.0022*(1-0.7*t),4))
    mk(name,merge_geo(*gs),M['vein'],parent)
def limb(name,pts,rs,parent,M,mt='tar',disp=None,branches=()):
    verts=list(pts);edges=[(i,i+1) for i in range(len(pts)-1)];radii=[(r,r) if isinstance(r,(int,float)) else r for r in rs]
    for (src,bp,br) in branches:
        prev=src
        for p,r in zip(bp,br):
            verts.append(p);radii.append((r,r));edges.append((prev,len(verts)-1));prev=len(verts)-1
    return skin_body(name,verts,edges,radii,M[mt],parent,sub=2,disp=disp or lumps())
def claws(name,base,dirs,parent,M,L=0.05,r=0.008):
    gs=[]
    for d in dirs:
        d=V(d).normalized();b=V(base);p1=b+d*L*0.6+V((0,-L*0.25,0));p2=b+d*L+V((0,-L*0.6,0))
        gs.append(tube([tuple(b),tuple(p1),tuple(p2)],lambda t:r*(1-0.95*t),6))
    mk(name,merge_geo(*gs),M['bone'],parent)
def demon_head(name,parent,M,c=(0,0,0),R=(0.085,0.1,0.11),one_eye=False):
    NU,NV=40,30;rings=[]
    for i in range(1,NV):
        phi=math.pi*i/NV;r=[]
        for j in range(NU):
            th=TAU*j/NU;s,cc=math.sin(phi),math.cos(phi);x=R[0]*s*math.sin(th);y=R[1]*cc;z=R[2]*s*math.cos(th)
            fr=max(0,math.cos(th))
            if cc<0:x*=1-0.25*(-cc);z+=0.05*fr*(-cc)**1.2   # выдвинутая челюсть
            d=0
            if one_eye:d-=0.03*gauss(x,0.03)*gauss(y-0.02,0.028)*fr
            else:d-=0.025*gauss(abs(x)-0.035,0.017)*gauss(y-0.015,0.017)*fr
            d+=0.012*gauss(y-0.045,0.012)*fr;d-=0.02*gauss(abs(x)-0.06,0.02)*gauss(y+0.03,0.03)*fr
            d-=0.02*gauss(x,0.04)*gauss(y+0.055,0.008)*fr  # пасть
            z+=d;r.append((x+c[0],y+c[1],z+c[2]))
        rings.append(r)
    mk(name+'skull',loft(rings,True,True,True),M['tar'],parent,sub=1,disp=lumps(0.006,22,3))
    # зубы
    gs=[]
    for k in range(14):
        a=-1.0+2.0*k/13;x=math.sin(a)*R[0]*0.75;z=math.cos(a)*R[2]*0.95+0.03;y=-0.05+c[1]
        for up in(1,-1):
            b=V((x+c[0],y+up*0.012,z+c[2]));gs.append(tube([tuple(b),tuple(b+V((0,-up*0.022*(1-abs(a)*0.4),0.004)))],lambda t:0.0055*(1-0.95*t),5))
    mk(name+'teeth',merge_geo(*gs),M['tooth'],parent)
    eyes=[]
    if one_eye:eyes.append(xform(lathe([(0.0001,-0.024),(0.018,-0.017),(0.025,0),(0.018,0.017),(0.0001,0.024)],16,cap0=True,cap1=True),tr(c[0],c[1]+0.02,c[2]+R[2]*0.82)))
    else:
        for sd in(-1,1):eyes.append(xform(lathe([(0.0001,-0.01),(0.008,-0.007),(0.011,0),(0.008,0.007),(0.0001,0.01)],12,cap0=True,cap1=True),tr(sd*0.035+c[0],c[1]+0.015,c[2]+R[2]*0.8)))
    mk(name+'eyes',merge_geo(*eyes),M['eye'],parent)
# ---------------------------------------------------------------- Гэнма-копейщик
def build_ge(M,loc=(0,0,0)):
    P='GE';root=empty(P,loc);hips=empty(P+'__J_hips',(0,0.88,0),root)
    for sd in(-1,1):
        s='L' if sd>0 else 'R';th=empty(P+'__J_thigh'+s,(sd*0.11,0,0),hips)
        pts=[(0,0.03,0),(0,-0.2,0.03),(0,-0.42,0.07),(0,-0.6,0.0),(0,-0.8,-0.035),(0,-0.86,0.04),(0,-0.875,0.12)]
        rs=[0.078,0.066,0.046,0.042,0.03,0.03,0.016]
        limb(P+'__thigh'+s+'__leg',pts,rs,th,M,branches=[(5,[(sd*0.035,-0.875,0.11)],[0.014]),(5,[(-sd*0.03,-0.875,0.105)],[0.013])])
        veins_on(P+'__thigh'+s+'__veins',pts[:5],rs[:5],th,M,3,seed=sd+3)
        claws(P+'__thigh'+s+'__claws',(0,-0.875,0.12),[(0,0,1),(sd*0.4,0,1),(-sd*0.4,0,1)],th,M,0.04,0.007)
        g=plate(0.12,0.2,0.005,curve=0.09,nu=6,nv=3);g=xform(g,chain(tr(0,-0.12,0.08),rotx(0.05)))
        mk(P+'__thigh'+s+'__haidate',g,M['rot'],th,bevel=0.001,sharp=50)
    # лохмотья на поясе
    rnd=random.Random(4);rings=[]
    for i in range(9):
        t=i/8;rings.append(ellipse_ring((0,0.04-0.34*t,0.01),0.17+0.06*t,0.13+0.05*t,40,lambda a,t=t:1+0.08*math.sin(a*6)*t,yfn=lambda a,t=t:(0.12*max(0,math.sin(a*11+2))**3+0.06*math.sin(a*3)) * t*t))
    mk(P+'__hips__rag',loft(rings,True),M['rag'],hips,disp=lambda p,n:0.008*fbm3(p,10,3))
    torso=empty(P+'__J_torso',(0,0,0),hips)
    pts=[(0,0.0,0),(0,0.2,0.01),(0,0.42,0),(0,0.56,-0.01),(0,0.7,0.04),(0,0.76,0.08)]
    rs=[(0.15,0.11),(0.13,0.1),(0.19,0.13),(0.2,0.12),(0.055,0.055),(0.045,0.045)]
    def ribs(p,n):
        b=lumps(0.01,8,1)(p,n)
        if n.z>0.2 and 0.28<p.y<0.52:b+=0.007*max(0,math.sin(p.y*85))**2*smooth(0.2,0.6,n.z)
        if n.z<-0.4:b+=0.012*max(0,math.sin(p.y*40))**6*gauss(p.x,0.02)
        return b
    limb(P+'__torso__body',pts,rs,torso,M,disp=ribs,branches=[(3,[(-0.2,0.56,0.0),(-0.245,0.55,0.05)],[0.075,0.065]),(3,[(0.2,0.56,0.0),(0.245,0.55,0.05)],[0.075,0.065])])
    veins_on(P+'__torso__veins',pts[:5],[r[0]*0.85 for r in rs[:5]],torso,M,6,seed=11)
    arm2=empty(P+'__J_arm2',(0.24,0.55,0.05),torso)
    pts=[(0,0,0),(0.02,-0.12,0.02),(0.025,-0.23,0.03),(0.035,-0.36,0.09),(0.04,-0.46,0.12)];rs=[0.064,0.05,0.042,0.036,0.034]
    limb(P+'__arm2__arm',pts,rs,arm2,M)
    veins_on(P+'__arm2__veins',pts,rs,arm2,M,3,seed=12)
    claws(P+'__arm2__claws',(0.04,-0.48,0.13),[(0,-0.5,1),(0.3,-0.5,1),(-0.3,-0.5,1),(0.5,-0.2,0.6)],arm2,M,0.06,0.008)
    # шипы позвоночника
    sp=[]
    for k in range(7):
        y=0.12+k*0.085;b=V((0,y,-0.1-0.03*math.sin(k)));sp.append(tube([tuple(b),tuple(b+V((0,0.03,-0.07+0.005*k)))],lambda t:0.016*(1-0.95*t),6))
    mk(P+'__torso__spikes',merge_geo(*sp),M['bone'],torso)
    # обломки доспеха
    for r in range(3):
        y1=0.46-r*0.06;arc=(-1.4+0.3*r,0.9-0.25*r);rings=[]
        for y,o in((y1,0.02),(y1-0.065,0.03)):
            rings.append([(math.sin(a)*(0.2+o),y,math.cos(a)*(0.135+o)) for a in [arc[0]+(arc[1]-arc[0])*j/14 for j in range(15)]])
        mk(P+'__torso__do%d'%r,loft(rings,False),M['rot'],torso,solid=0.006,bevel=0.0015,sharp=50,disp=lambda p,n:0.004*fbm3(p,12,2))
    g=plate(0.15,0.2,0.006,curve=0.12,nu=8,nv=4);g=xform(g,chain(tr(0,0,0.12),roty(-math.pi/2),rotz(-0.25),tr(-0.2,0.56,0.0)))
    mk(P+'__torso__sode',g,M['rot'],torso,bevel=0.0015,sharp=50)
    # голова + дзингаса
    head=empty(P+'__J_head',(0,0.74,0.08),torso)
    demon_head(P+'__head__',head,M,(0,0.0,0.0))
    for sd in(-1,1):mk(P+'__head__horn%d'%(sd+1),tube([(sd*0.05,0.06,0.0),(sd*0.08,0.1,-0.03),(sd*0.09,0.14,-0.08)],lambda t:0.015*(1-0.9*t),8),M['bone'],head,sub=1)
    prof=[(0.0001,0.2),(0.03,0.195),(0.06,0.17),(0.25,0.11),(0.45,0.045),(0.46,0.035),(0.44,0.04),(0.25,0.095),(0.06,0.15),(0.0001,0.155)]
    mk(P+'__head__jingasa',lathe(prof,48,cap0=False,cap1=False,f=lambda a:1+0.012*math.sin(a*13)),M['straw'],head,disp=lambda p,n:0.004*fbm3(p,8,2))
    mk(P+'__head__hatrim',tube([(math.sin(a)*0.452,0.04,math.cos(a)*0.452) for a in [i*TAU/48 for i in range(49)]],0.007,6),M['iron'],head)
    mk(P+'__head__chincord',tube([(-0.09,0.1,0.0),(-0.08,-0.04,0.02),(0,-0.11,0.05),(0.08,-0.04,0.02),(0.09,0.1,0.0)],0.004,5),M['cord'],head)
    # рука с копьём
    arm=empty(P+'__J_arm',(-0.24,0.55,0.05),torso)
    pts=[(0,0,0),(0,-0.14,-0.02),(0,-0.25,-0.02),(0,-0.25,0.14),(0,-0.25,0.27),(0,-0.25,0.31)];rs=[0.066,0.052,0.044,0.04,0.032,0.04]
    limb(P+'__arm__arm',pts,rs,arm,M)
    veins_on(P+'__arm__veins',pts,rs,arm,M,3,seed=9)
    claws(P+'__arm__claws',(0.0,-0.27,0.33),[(-1,-0.6,0.1),(-1,-0.6,-0.1),(-1,-0.6,0.3)],arm,M,0.04,0.008)
    weap=empty(P+'__J_weap',(0,-0.2,0),arm)
    mk(P+'__weap__shaft',xform(lathe([(0.0001,-0.7),(0.016,-0.69),(0.016,1.42),(0.0001,1.43)],10,cap0=True,cap1=True),rotx(math.pi/2)),M['wood'],weap)
    bl_=lathe([(0.0001,0.0),(0.018,0.03),(0.016,0.12),(0.0001,0.27)],4,cap0=True,cap1=True)
    bl_=xform(bl_,chain(lambda p:V((p.x*0.35,p.y,p.z)),rotx(math.pi/2),tr(0,0,1.43)))
    mk(P+'__weap__blade',bl_,M['steel'],weap,sharp=30)
    mk(P+'__weap__collar',xform(lathe([(0.02,0),(0.022,0.01),(0.02,0.06),(0.017,0.07)],10,cap0=True,cap1=True),chain(rotx(math.pi/2),tr(0,0,1.36))),M['iron'],weap)
    mk(P+'__weap__butt',xform(lathe([(0.0001,-0.03),(0.018,0.0),(0.018,0.05)],10,cap0=True),chain(rotx(math.pi/2),tr(0,0,-0.72))),M['iron'],weap)
    rb=[]
    for k in range(3):
        path=[(0,0.0,1.35),(0.01*k-0.01,-0.08,1.33-0.02*k),(0.02*k-0.02,-0.2,1.3-0.05*k),(0.03*k-0.02,-0.3-0.03*k,1.26-0.07*k)]
        rings=[[tuple(V(p)+V((w,0,0))) for w in(-0.012,0.012)] for p in path];rb.append(loft(rings,False))
    mk(P+'__weap__ribbon',merge_geo(*rb),M['rag'],weap,solid=0.002)
    empty(P+'__weap__TIP',(0,0,1.7),weap)
    return root
# ---------------------------------------------------------------- Хитоцумэ Гаса
def build_ga(M,loc=(0,0,0)):
    P='GA';root=empty(P,loc);torso=empty(P+'__J_torso',(0,0.88,0),root)
    head=empty(P+'__J_head',(0,0.74,0.08),torso)
    demon_head(P+'__head__',head,M,(0,-0.01,0.0),R=(0.1,0.11,0.12),one_eye=True)
    rnd=random.Random(8);NU=64;rings=[]
    for i in range(9):
        t=i/8;r=0.03+0.53*t;y=0.32-0.24*t**0.9
        rings.append([(math.sin(a)*r*(1-0.06*t*max(0,math.sin(a*24))**8),y-0.03*t*max(0,math.sin(a*12+1))**4,math.cos(a)*r*(1-0.06*t*max(0,math.sin(a*24))**8)) for a in [TAU*j/NU for j in range(NU)]])
    mk(P+'__head__kasa',loft(rings,True,True,False),M['paper'],head,disp=lambda p,n:0.006*fbm3(p,7,3))
    ribs=[]
    for k in range(24):
        a=TAU*k/24;ribs.append(tube([(math.sin(a)*0.03,0.3,math.cos(a)*0.03),(math.sin(a)*0.3,0.2,math.cos(a)*0.3),(math.sin(a)*0.56,0.075,math.cos(a)*0.56)],0.0045,5))
        ribs.append(tube([(math.sin(a)*0.06,0.12,math.cos(a)*0.06),(math.sin(a)*0.25,0.17,math.cos(a)*0.25)],0.003,4))
    mk(P+'__head__ribs',merge_geo(*ribs),M['wood'],head)
    mk(P+'__head__finial',lathe([(0.0001,0.42),(0.025,0.38),(0.03,0.33),(0.04,0.31),(0.0001,0.3)],12,cap0=True,cap1=True),M['iron'],head)
    fr=[]
    for k in range(22):
        a=TAU*k/22
        if math.cos(a)>0.55:continue
        L=rnd.uniform(0.22,0.42);b=V((math.sin(a)*0.5,0.09,math.cos(a)*0.5))
        fr.append(tube([tuple(b),tuple(b+V((0,-L*0.5,0.0))),tuple(b+V((math.sin(a)*0.02,-L,math.cos(a)*0.02)))],lambda t:0.018*(1-0.9*t),6))
    mk(P+'__head__fringe',merge_geo(*fr),M['bone'],head,disp=lambda p,n:0.002*fbm3(p,30,2))
    # тяжёлые руки
    for nm,sd in(('arm',-1),('arm2',1)):
        arm=empty(P+'__J_'+nm,(sd*0.24,0.55,0.05),torso)
        pts=[(0,0.02,0),(sd*0.02,-0.15,0.0),(sd*0.02,-0.28,0.02),(sd*0.01,-0.44,0.04),(0,-0.5,0.0)];rs=[0.085,0.075,0.06,0.052,0.05]
        limb(P+'__'+nm+'__arm',pts,rs,arm,M,branches=[(1,[(sd*0.06,0.0,-0.02)],[0.05])])
        veins_on(P+'__'+nm+'__veins',pts,rs,arm,M,4,seed=20+sd)
        claws(P+'__'+nm+'__claws',(0,-0.53,0.02),[(0,-1,0.6),(0.3,-1,0.5),(-0.3,-1,0.5),(sd*-0.6,-0.4,0.6)],arm,M,0.07 if sd>0 else 0.045,0.01)
        g=plate(0.2,0.24,0.008,curve=0.12,nu=8,nv=4);g=xform(g,chain(tr(0,0,0.12),roty(sd*math.pi/2),rotz(sd*0.2),tr(sd*0.02,-0.05,0)))
        mk(P+'__'+nm+'__sode',g,M['rot'],arm,bevel=0.002,sharp=50)
    return root
# ---------------------------------------------------------------- Кама-итачи
def build_ka(M,loc=(0,0,0)):
    P='KA';root=empty(P,loc);body=empty(P+'__J_body',(0,0.38,0),root)
    pts=[(0,0.0,-0.32),(0,0.02,-0.12),(0,0.03,0.1),(0,0.05,0.28),(0,0.1,0.38)];rs=[(0.13,0.12),(0.15,0.14),(0.14,0.13),(0.13,0.12),(0.07,0.07)]
    def fur(p,n):return lumps(0.008,10,2)(p,n)+0.006*abs(math.sin(p.z*120+fbm3(p,20,2)*3))*smooth(0,0.6,n.y)
    limb(P+'__body__body',pts,rs,body,M,disp=fur)
    veins_on(P+'__body__veins',pts,[r[0] for r in rs],body,M,4,seed=31)
    sp=[]
    for k in range(9):
        z=-0.3+k*0.075;b=V((0,0.13+0.02*math.sin(k*0.7),z));sp.append(tube([tuple(b),tuple(b+V((0,0.07,-0.04)))],lambda t:0.014*(1-0.95*t),6))
    mk(P+'__body__spikes',merge_geo(*sp),M['bone'],body)
    path=[(0,0.04,-0.38),(0,0.12,-0.6),(0,0.3,-0.78),(0,0.5,-0.82),(0,0.62,-0.72)]
    mk(P+'__body__tail',tube(path,lambda t:0.05*(1-0.8*t),10,cap1=True),M['tar'],body,sub=1,disp=lumps(0.006,14,7))
    bl_=plate(0.012,0.24,0.004,curve=0,nu=1,nv=6);bl_=xform(bl_,chain(lambda p:V((p.x*(1-abs(p.y)/0.13),p.y,p.z+0.04*(p.y/0.12)**2)),rotx(0.6),tr(0,0.72,-0.66)))
    mk(P+'__body__tailblade',bl_,M['steel'],body,sharp=30)
    head=empty(P+'__J_head',(0,0.12,0.42),body)
    limb(P+'__head__skull',[(0,0,-0.07),(0,0.0,0.04),(0,-0.015,0.13),(0,-0.025,0.18)],[(0.085,0.075),(0.075,0.065),(0.04,0.035),(0.022,0.02)],head,M,disp=lumps(0.004,25,9))
    for sd in(-1,1):
        mk(P+'__head__ear%d'%(sd+1),tube([(sd*0.05,0.05,-0.04),(sd*0.075,0.12,-0.07),(sd*0.08,0.17,-0.1)],lambda t:0.028*(1-0.9*t),8,flat=0.35),M['tar'],head,sub=1)
    eyes=[xform(lathe([(0.0001,-0.009),(0.009,0),(0.0001,0.009)],10,cap0=True,cap1=True),tr(sd*0.045,0.025,0.06)) for sd in(-1,1)]
    mk(P+'__head__eyes',merge_geo(*eyes),M['eye'],head)
    th=[]
    for k in range(10):
        a=-0.9+1.8*k/9;b=V((math.sin(a)*0.03,-0.035,0.12+math.cos(a)*0.04));th.append(tube([tuple(b),tuple(b+V((0,-0.018,0.003)))],lambda t:0.004*(1-0.95*t),4))
    mk(P+'__head__teeth',merge_geo(*th),M['tooth'],head)
    leg=empty(P+'__J_leg',(0,0,0),root);leg.location=bl((1.0,0,0))
    pts=[(0,0,0),(0,-0.14,0.03),(0,-0.28,-0.01),(0,-0.31,0.03)];rs=[0.05,0.032,0.022,0.02]
    limb(P+'__leg__leg',pts,rs,leg,M,disp=lumps(0.005,16,4))
    claws(P+'__leg__claws',(0,-0.31,0.04),[(0,-0.3,1),(0.5,-0.3,1),(-0.5,-0.3,1)],leg,M,0.035,0.006)
    arm=empty(P+'__J_arm',(0,-0.02,0.3),body)
    for sd in(-1,1):
        path=[]
        for i in range(17):
            a=math.radians(-170+150*i/16);path.append((sd*0.16,-0.03+math.sin(-a)*0.17,0.22+math.cos(a)*0.19))
        rings=[]
        for i,p in enumerate(path):
            p=V(p);c=V((sd*0.16,-0.03,0.22));o=(p-c).normalized();w=0.032*(1-0.9*(i/16)**1.5)+0.002
            rings.append([tuple(p+V((0.003,0,0))),tuple(p+o*w*0.4+V((0.0015,0,0))),tuple(p+o*w),tuple(p+o*w*0.4-V((0.0015,0,0))),tuple(p-V((0.003,0,0)))])
        mk(P+'__arm__kama%d'%(sd+1),loft(rings,True,True,True),M['steel'],arm,sharp=40)
        mk(P+'__arm__haft%d'%(sd+1),tube([(sd*0.16,-0.03,0.05),(sd*0.16,-0.04,-0.05),(sd*0.16,-0.05,-0.12)],0.013,8),M['bone'],arm)
    return root
# ---------------------------------------------------------------- Лучница-рокурокубикуби
def build_yu(M,loc=(0,0,0)):
    P='YU';root=empty(P,loc);body=empty(P+'__J_body',(0,0.5,0),root)
    pts=[(0,-0.3,0),(0,-0.05,0),(0,0.2,0.02),(0,0.36,0.05)];rs=[(0.2,0.18),(0.33,0.3),(0.24,0.22),(0.07,0.07)]
    limb(P+'__body__body',pts,rs,body,M,disp=lumps(0.02,6,12),branches=[(2,[(-0.2,0.18,0.12),(-0.12,0.12,0.3),(-0.03,0.15,0.36)],[0.04,0.03,0.025]),(2,[(0.2,0.2,0.1),(0.14,0.3,0.28),(0.04,0.3,0.32)],[0.04,0.03,0.025])])
    veins_on(P+'__body__veins',pts,[r[0] for r in rs],body,M,6,seed=41)
    rings=[]
    for i in range(10):
        t=i/9;rings.append(ellipse_ring((0,0.3-0.82*t,0),0.24+0.16*t,0.22+0.14*t,48,lambda a,t=t:1+0.1*math.sin(a*7)*t,yfn=lambda a,t=t:0.1*max(0,math.sin(a*9))**4*t*t))
    mk(P+'__body__kimono',loft(rings,True),M['white'],body,disp=lambda p,n:0.012*fbm3(p,7,3))
    seg=empty(P+'__J_neckseg',(0,0,0),root);seg.location=bl((1.2,0,0))
    limb(P+'__neckseg__seg',[(0,-0.04,0),(0,0.0,0),(0,0.04,0)],[0.05,0.065,0.05],seg,M,disp=lumps(0.01,18,13))
    mk(P+'__neckseg__spike',tube([(0,0,-0.05),(0,0.01,-0.09)],lambda t:0.014*(1-0.95*t),6),M['bone'],seg)
    head=empty(P+'__J_head',(0,0,0),root);head.location=bl((1.6,0,0))
    st=dict(head=(0.066,0.1,0.086),nose=0.008,brow=0.002,socket=0.012,hc=(0,0,0))
    from chars import build_head
    c=build_head(P,head,st,dict(skin=M['pale'],eye=M['eye'],hair=M['hair']))
    for o in list(bpy.data.objects):
        if o.name.startswith(P+'__neck__'):o.name=o.name.replace(P+'__neck__',P+'__head__')
    rnd=random.Random(5);gs=[]
    for k in range(120):
        th=rnd.uniform(-math.pi,math.pi)
        if math.cos(th)>0.6:continue
        el=rnd.uniform(0.0,1.0);d=V((math.sin(th)*(1-el*0.5),0.4+el*0.6,math.cos(th)*(1-el*0.5)))
        d.normalize();s0=V((d.x*0.075,d.y*0.105,d.z*0.09));L=rnd.uniform(0.35,0.62)
        path=[tuple(s0)]+[tuple(s0+V((s0.x*0.4*min(1,t*3),-L*t,s0.z*0.3*min(1,t*3)-0.02*t))) for t in [i/8 for i in range(1,9)]]
        gs.append(tube(path,lambda t:0.007*(1-0.6*t),5,flat=0.4))
    mk(P+'__head__hair',merge_geo(*gs),M['hair'],head)
    arm=empty(P+'__J_arm',(0,0.15,0.3),body)
    path=[(0,0.75*math.sin(a)-0.05,0.18*math.cos(a)-0.12) for a in [(-0.5+i/20)*math.pi*0.85 for i in range(21)]]
    mk(P+'__arm__bow',tube(path,lambda t:0.013*(1-0.4*abs(t-0.42)),8),M['wood'],arm)
    mk(P+'__arm__string',tube([path[0],(0,0.0,-0.2),path[-1]],0.0018,4),M['white'],arm)
    mk(P+'__arm__grip',tube([(0,-0.06,0.06),(0,0.04,0.06)],0.018,8),M['rag'],arm)
    return root
