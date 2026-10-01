"""Человеческие персонажи: Акира (герой) и Сота (босс).
Сегментированный риг (как в игре): hips / thighL,R / shinL,R / torso / neck / upperArmL,R / foreArmL,R / handL,R.
Каждая часть — набор мешей с именами PREFIX__part__detail, геометрия в локальных координатах сустава."""
import math, random
from lib import *
G=lambda: None
def smooth(e0,e1,x):
    t=min(1,max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t)
def gauss(x,s):return math.exp(-(x/s)**2)
# ------------------------------------------------------------------ голова
def head_point(phi,th,st):
    rx,ry,rz=st.get('head',(0.073,0.112,0.094))
    s,c=math.sin(phi),math.cos(phi);x=rx*s*math.sin(th);y=ry*c;z=rz*s*math.cos(th);yn=c;fr=max(0,math.cos(th))*s
    if yn<0:
        x*=1-0.36*(-yn)**1.3
        if math.cos(th)<0:z*=1-0.45*(-yn)**1.2
        else:z+= -0.012*(-yn)**2*(1-fr)
    if math.cos(th)<0 and yn>-0.25:z-=0.012*(-math.cos(th))*gauss(yn-0.3,0.45)
    X,Y=x,y
    if math.cos(th)>0.2:
        k=smooth(0.2,0.6,math.cos(th))
        d=0
        d+=st.get('nose',0.013)*gauss(X,0.011)*gauss(Y+0.032,0.014)
        d+=0.006*gauss(X,0.008)*gauss(Y+0.004,0.022)
        d+=0.006*gauss(abs(X)-0.013,0.006)*gauss(Y+0.04,0.008)
        d-=st.get('socket',0.01)*gauss(abs(X)-0.031,0.015)*gauss(Y-0.012,0.012)
        d+=st.get('brow',0.006)*gauss(abs(X)-0.029,0.022)*gauss(Y-0.032,0.009)
        d+=0.005*gauss(abs(X)-0.047,0.014)*gauss(Y+0.005,0.014)
        d+=0.0045*gauss(X,0.018)*gauss(Y+0.064,0.006)+0.005*gauss(X,0.016)*gauss(Y+0.079,0.007)
        d-=0.003*gauss(X,0.02)*gauss(Y+0.071,0.003)
        d+=0.006*gauss(X,0.02)*gauss(Y+0.1,0.012)
        d-=0.004*gauss(abs(X)-0.045,0.012)*gauss(Y+0.045,0.02)
        z+=d*k
    return (x,y,z)
def build_head(pre,parent,st,mats):
    c=st.get('hc',(0,0.105,0.008));NU,NV=44,32
    rings=[]
    for i in range(1,NV):
        phi=math.pi*i/NV;r=[]
        for j in range(NU):
            th=TAU*j/NU;p=head_point(phi,th,st);r.append((p[0]+c[0],p[1]+c[1],p[2]+c[2]))
        rings.append(r)
    g=loft(rings,True,True,True)
    mk(pre+'__neck__head',g,mats['skin'],parent,sub=1)
    # шея
    mk(pre+'__neck__neckcyl',lathe([(0.05,-0.03),(0.047,0.02),(0.043,0.06),(0.04,0.09)],16,c=(0,0,-0.005)),mats['skin'],parent,sub=1)
    # уши
    for sd in(-1,1):
        rx=st.get('head',(0.073,))[0];e=lathe([(0.0001,-0.004),(0.017,-0.003),(0.019,0.0),(0.016,0.003),(0.0001,0.0025)],14,cap0=True,cap1=True,f=lambda a:1+0.5*math.cos(a)**2)
        e=xform(e,chain(lambda p:V((p.x*0.65,p.z*1.35,p.y)),roty(sd*0.35),tr(sd*(rx*0.94+0.004)+c[0],c[1]-0.005,c[2]-0.012)))
        mk(pre+'__neck__ear%d'%(sd+1),e,mats['skin'],parent,sub=1)
    # глаза
    for sd in(-1,1):
        ex,ey=sd*0.031,0.012;p=head_point(math.acos(ey/0.112),math.asin(max(-1,min(1,ex/0.073))),st)
        eg=lathe([(0.0001,-0.011),(0.008,-0.008),(0.0115,0),(0.008,0.008),(0.0001,0.011)],12,cap0=True,cap1=True)
        eg=xform(eg,tr(ex+c[0],ey+c[1],p[2]+c[2]-0.0055))
        mk(pre+'__neck__eye%d'%(sd+1),eg,mats['eye'],parent)
        # брови
        path=[(sd*(0.012+0.04*t),c[1]+0.031+0.006*math.sin(t*math.pi)-0.004*t*(st.get('angry',1)),0) for t in [k/6 for k in range(7)]]
        path=[(x,y,head_point(math.acos(max(-1,min(1,(y-c[1])/0.112))),math.asin(max(-1,min(1,x/0.073))),st)[2]+c[2]+0.002) for x,y,_ in path]
        mk(pre+'__neck__brow%d'%(sd+1),tube(path,lambda t:0.0035*(1-0.6*t),5,flat=0.4),mats['hair'],parent)
    return c
def head_surface(dirv,st,c,off=0.0):
    """Точка на поверхности головы в направлении dirv (из центра)."""
    d=V(dirv).normalized();phi=math.acos(max(-1,min(1,d.y)));th=math.atan2(d.x,d.z)
    p=V(head_point(phi,th,st));n=(p).normalized()
    return V(c)+p+n*off
def build_hair(pre,parent,st,mats,c,style='topknot'):
    rnd=random.Random(3);hm=mats['hair']
    # скальп
    NU,NV=40,24;rings=[]
    for i in range(0,NV):
        phi=math.pi*0.8*i/(NV-1)+0.001;r=[]
        for j in range(NU):
            th=TAU*j/NU;p=V(head_point(phi,th,st));hl=0.012+0.04*max(math.cos(th),0)+0.085*min(math.cos(th),0)
            if style=='long':hl=0.03+0.03*max(math.cos(th),0)-0.03*(1-max(math.cos(th),0))
            off=-0.006+0.0125*smooth(hl-0.014,hl+0.004,p.y)
            r.append(tuple(V(c)+p+p.normalized()*off))
        rings.append(r)
    g=loft(rings,True,True,False)
    mk(pre+'__neck__scalp',g,hm,parent,sub=1,disp=lambda p,n:0.0018*abs(math.sin(p.x*900+fbm3(p,60,2)*6)))
    K=V(c)+V((0,0.118,-0.035))
    strands=[]
    if style=='topknot':
        for k in range(150):
            th=rnd.uniform(-math.pi,math.pi);hl=0.012+0.04*max(math.cos(th),0)+0.085*min(math.cos(th),0)
            # точка на линии роста
            best=None
            for i in range(60):
                phi=math.pi*i/60;p=V(head_point(phi,th,st))
                if p.y<hl:best=(phi,p);break
            if not best:continue
            phi0=best[0]-0.05;d0=V(head_point(phi0,th,st)).normalized();dk=(K-V(c)).normalized();path=[]
            for t in [i/14 for i in range(15)]:
                d=(d0*(1-t)+dk*t).normalized();p=head_surface(d,st,c,0.009+0.006*math.sin(t*math.pi)+rnd.uniform(0,0.002))
                path.append(tuple(p))
            path=path[:-1]
            strands.append(tube(path,lambda t:0.0065*(1-0.5*t),5,flat=0.35,cap0=False,cap1=True))
        # пучок (тёммагэ) и хвост
        strands.append(tube([tuple(K+V((0,-0.004,0.004))),tuple(K+V((0,0.012,-0.002))),tuple(K+V((0,0.028,-0.01)))],0.0125,12))
        for k in range(16):
            a=TAU*k/16;base=K+V((math.cos(a)*0.008,0.03,-0.01+math.sin(a)*0.008))
            path=[tuple(base),tuple(base+V((math.cos(a)*0.01,0.03,-0.03))),tuple(base+V((math.cos(a)*0.022+rnd.uniform(-0.01,0.01),0.035,-0.075))),tuple(base+V((math.cos(a)*0.03+rnd.uniform(-0.02,0.02),0.005,-0.12+rnd.uniform(-0.02,0.01))))]
            strands.append(tube(path,lambda t:0.007*(1-0.85*t),5,flat=0.5))
        mk(pre+'__neck__knotcord',tube([tuple(K+V((math.cos(a)*0.0145,0.018,-0.006+math.sin(a)*0.0145))) for a in [i*TAU/18 for i in range(19)]],0.0035,6),mats['cord'],parent)
        # пряди у висков
        for sd in(-1,1):
            for q in range(3):
                th=sd*(0.95+q*0.12);s0=head_surface(V((math.sin(th),0.55,math.cos(th))),st,c,0.006)
                path=[tuple(s0),tuple(s0+V((sd*0.012,-0.03,0.012))),tuple(s0+V((sd*0.01,-0.07,0.022+q*0.004))),tuple(s0+V((sd*0.004,-0.1-q*0.01,0.018)))]
                strands.append(tube(path,lambda t:0.004*(1-0.8*t),5,flat=0.5))
    else: # длинные дикие волосы (Сота)
        for k in range(190):
            th=rnd.uniform(-math.pi,math.pi);el=rnd.uniform(0.1,0.95)
            d0=V((math.sin(th)*math.cos(el*0.9),math.sin(el*1.3)*0.9+0.3,math.cos(th)*math.cos(el*0.9)))
            if math.cos(th)>0.55 and d0.y<0.75:continue
            s0=head_surface(d0,st,c,0.006);out=V((s0.x-c[0],0,s0.z-c[2])).normalized()
            L=rnd.uniform(0.18,0.34)*(1 if math.cos(th)<0.3 else 0.5)
            path=[tuple(s0)]
            for i in range(1,9):
                t=i/8;p=s0+out*(0.03*math.sin(t*2.2)+0.02*t)+V((0,-L*t,0))+V((rnd.uniform(-1,1)*0.01*t,0,-0.03*t))
                path.append(tuple(p))
            strands.append(tube(path,lambda t:0.008*(1-0.8*t),5,flat=0.4))
    mk(pre+'__neck__hair',merge_geo(*strands),hm,parent)
def build_hachimaki(pre,parent,st,c,mt):
    ring=[];n=40
    for j in range(n):
        th=TAU*j/n;yy=0.048*max(math.cos(th),0)+0.03*min(math.cos(th),0)+0.03
        phi=math.acos(max(-1,min(1,yy/0.112)));p=V(head_point(phi,th,st));nn=p.normalized()
        ring.append((V(c)+p+nn*0.009,nn))
    rr=[]
    for h in(-0.013,-0.012,0.012,0.013):
        rr.append([tuple(p+V((0,h,0))+nn*(0.0 if abs(h)>0.0125 else 0.003)) for p,nn in ring])
    g=loft(rr,True,False,False)
    mk(pre+'__neck__hachimaki',g,mt,parent,solid=0.002)
    back=V(c)+V((0,0.06,-0.1))
    mk(pre+'__neck__hknot',tube([tuple(back+V((-0.012,0,0))),tuple(back+V((0,0.004,-0.01))),tuple(back+V((0.012,0,0)))],0.01,8),mt,parent,sub=1)
    tails=[]
    for sd,L in((-1,0.2),(1,0.26)):
        path=[tuple(back+V((sd*0.008*t+0.02*math.sin(t*5)*t,-L*t,-0.02*t-0.03*math.sin(t*3)*t))) for t in [i/10 for i in range(11)]]
        rings=[]
        for i,p in enumerate(path):
            w=0.016*(1-0.3*i/10);rings.append([tuple(V(p)+V((x,0,0))) for x in(-w,w)])
        tails.append(loft(rings,False))
    mk(pre+'__neck__htails',merge_geo(*tails),mt,parent,solid=0.002)
# ------------------------------------------------------------------ ткань и броня
def ribbon(pts,nrm,w,th):
    P,T,N,B=frames(pts);rings=[]
    for i,p in enumerate(P):
        n=V(nrm[i]).normalized();s=T[i].cross(n).normalized()
        rings.append([tuple(p+s*w/2+n*th/2),tuple(p-s*w/2+n*th/2),tuple(p-s*w/2-n*th/2),tuple(p+s*w/2-n*th/2)])
    return loft(rings,True,True,True)
TORSO=[(0.02,0.155,0.112,0.108,0),(0.12,0.15,0.108,0.105,0),(0.25,0.165,0.118,0.11,0.004),(0.36,0.185,0.13,0.116,0.008),(0.44,0.195,0.126,0.116,0.0),(0.5,0.2,0.108,0.112,-0.006),(0.555,0.15,0.082,0.09,-0.01),(0.6,0.068,0.06,0.06,-0.005)]
def torso_r(y,st):
    k=st.get('bulk',1.0)
    for a,b in zip(TORSO,TORSO[1:]):
        if a[0]<=y<=b[0]:
            t=(y-a[0])/(b[0]-a[0]);return [a[i]+(b[i]-a[i])*t for i in range(5)]
    return list(TORSO[0] if y<TORSO[0][0] else TORSO[-1])
def torso_pt(y,th,st,off=0.0):
    _,rx,rf,rb,zo=torso_r(y,st);k=st.get('bulk',1.0)
    rz=rf if math.cos(th)>0 else rb
    return V(((rx*k+off)*math.sin(th),y,(rz*k+off)*math.cos(th)+zo))
def build_torso(pre,parent,st,M):
    rnd=random.Random(5)
    rings=[]
    for i in range(29):
        y=0.0+0.6*i/28;rings.append([tuple(torso_pt(y,TAU*j/40,st)) for j in range(40)])
    g=loft(rings,True,True,True)
    mk(pre+'__torso__body',g,M['kimono'],parent,sub=1,disp=lambda p,n:0.003*fbm3(p,18,3)+0.0025*math.sin(math.atan2(p.x,p.z)*16)*smooth(0.25,0.05,p.y))
    # воротник кимоно (левая пола поверх правой) и нижнее кимоно
    for layer,(mt,w,off) in enumerate([(M['juban'],0.028,0.004),(M['kimono2'],0.045,0.01)]):
        for sd in(-1,1):
            ctrl=[(math.pi,0.598),(sd*2.3,0.596),(sd*1.5,0.588),(sd*0.85,0.56),(sd*0.4,0.51),(-sd*0.12,0.43)]
            pts=[];nr=[]
            for i in range(26):
                t=i/25*(len(ctrl)-1);k_=min(int(t),len(ctrl)-2);f=t-k_;a=ctrl[k_][0]+(ctrl[k_+1][0]-ctrl[k_][0])*f
                if k_==0:a=(math.pi if sd>0 else -math.pi)*(1-f)+ctrl[1][0]*f
                y=ctrl[k_][1]+(ctrl[k_+1][1]-ctrl[k_][1])*f
                p=torso_pt(min(y,0.585),a,st,off+(0.004 if sd>0 else 0));p.y=y;n=V((p.x,0,p.z)).normalized()+V((0,1.2*smooth(0.55,0.6,y),0))
                pts.append(tuple(p));nr.append(tuple(n))
            mk(pre+'__torso__collar%d%d'%(layer,sd+1),ribbon(pts,nr,w,0.006),mt,parent,sub=1)
    # пояс оби
    rings=[]
    for y in(0.04,0.045,0.125,0.13):
        o=0.012 if 0.044<y<0.126 else 0.006;rings.append([tuple(torso_pt(y,TAU*j/40,st,o)) for j in range(40)])
    mk(pre+'__torso__obi',loft(rings,True,False,False),M['obi'],parent,disp=lambda p,n:0.0015*fbm3(p,40,2))
    kb=torso_pt(0.085,math.pi,st,0.02)
    mk(pre+'__torso__obiknot',xform(box(0.05,0.03,0.012,(0,0,0)),tr(kb.x,kb.y,kb.z)),M['obi'],parent,sub=2)
    cordp=[tuple(torso_pt(0.11,TAU*j/40,st,0.016)) for j in range(41)]
    mk(pre+'__torso__obicord',tube(cordp,0.0035,6),M['cord'],parent)
    # до (нагрудный доспех из пластин кодзанэ)
    a0,a1=st.get('do_arc',(-2.1,2.1));rows=st.get('do_rows',5)
    for r in range(rows):
        y1=0.42-r*0.055;y0=y1-0.062;rings=[]
        for y,o in((y1,0.017),(y0,0.024)):
            rings.append([tuple(torso_pt(y,a0+(a1-a0)*j/30,st,o+0.003*r*0)) for j in range(31)])
        mk(pre+'__torso__do%d'%r,loft(rings,False),M['lacquer'],parent,solid=0.006,bevel=0.0015,sharp=50)
    # мунэ-ита (верхняя пластина) с окантовкой
    rings=[]
    for y,o in((0.47,0.012),(0.465,0.016),(0.42,0.02)):
        rings.append([tuple(torso_pt(y,-0.95+1.9*j/20,st,o)) for j in range(21)])
    mk(pre+'__torso__muneita',loft(rings,False),M['plate'],parent,solid=0.006,bevel=0.002,sharp=45)
    rim=[tuple(torso_pt(0.47,-0.95+1.9*j/20,st,0.012)) for j in range(21)]
    mk(pre+'__torso__rim',tube(rim,0.004,6),M['gilt'],parent)
    # ватагами (плечевые ремни)
    for sd in(-1,1):
        pts=[tuple(torso_pt(0.47,sd*0.85,st,0.014)),tuple(V((sd*0.13,0.575,0.03))),tuple(V((sd*0.14,0.585,-0.03))),tuple(torso_pt(0.48,math.pi-sd*0.8,st,0.012))]
        nr=[(sd*0.3,0.3,1),(sd*0.3,1,0.3),(sd*0.3,1,-0.3),(sd*0.3,0.3,-1)]
        mk(pre+'__torso__watagami%d'%(sd+1),ribbon(pts,nr,0.035,0.006),M['leather'],parent,sub=1)
    # шнуры доспеха
    for sd in(-1,1):
        p0=torso_pt(0.44,sd*0.6,st,0.03);p1=torso_pt(0.36,sd*0.75,st,0.03)
        mk(pre+'__torso__agemaki%d'%(sd+1),tube([tuple(p0),tuple((p0+p1)/2+V((0,0,0.01))),tuple(p1)],0.0035,6),M['cord'],parent)
def build_hood(pre,parent,st,M):
    path=[];nr=[]
    for t in [i/20 for i in range(21)]:
        a=math.pi*(0.55+0.9*t)  # вокруг спины
        p=torso_pt(0.565,a,st,0.03)
        path.append(tuple(p+V((0,0.01*math.sin(t*math.pi),0))))
    mk(pre+'__torso__hood',tube(path,lambda t:0.022+0.035*math.sin(t*math.pi),12,flat=0.7,cap0=True,cap1=True),M['cape'],parent,sub=1,disp=lambda p,n:0.008*fbm3(p,22,3))
def build_cape(pre,parent,st,M):
    rnd=random.Random(9);NU,NV=34,26;rings=[]
    a0,a1=math.pi*0.6,math.pi*1.4
    for i in range(NV+1):
        t=i/NV;y=-0.98*t;r=[]
        for j in range(NU+1):
            s=j/NU;a=a0+(a1-a0)*s
            rx=0.2+0.12*t;rz=0.135+0.14*t
            fold=1+0.07*t*math.sin(a*9+1.3)+0.04*t*fbm3(V((a,t*2,0)),2,2)
            hem=0.07*fbm3(V((s*7,0,0)),1,3)+0.05*max(0,math.sin(s*31))**8
            yy=y+(hem*t*t if i==NV else hem*t**6)
            r.append((math.sin(a)*rx*fold,yy,math.cos(a)*rz*fold-0.03*t))
        rings.append(r)
    v,f,u=loft(rings,False)
    mk(pre+'__cape',(v,f,u),M['cape'],parent,loc=(0,0.6,0.02),sub=1,disp=lambda p,n:0.004*fbm3(p,14,3))
def plate_row(w,h,th,R,nu=10):
    return plate(w,h,th,curve=R,nu=nu,nv=2)
def build_kusazuri(pre,parent,st,M):
    k=st.get('bulk',1.0);n=st.get('kz_n',5);rows=4
    for pi_ in range(n):
        a=(-1.75+3.5*pi_/(n-1)) if n>1 else 0
        geos=[]
        for r in range(rows):
            R=0.215+0.018*r;g=plate(0.15,0.068,0.006,curve=R,nu=10,nv=2)
            g=xform(g,chain(tr(0,0,R),rotx(-0.1-0.03*r),tr(0,0.05-r*0.058,-0.05+0.008*r),lambda p:V((p.x*k,p.y,p.z*k))))
            geos.append(g)
        g=merge_geo(*geos);g=xform(g,roty(a))
        mk(pre+'__hips__kusazuri%d'%pi_,g,M['lacquer'],parent,bevel=0.0012,sharp=50)
        cords=[]
        for x in(-0.05,0.0,0.05):
            p0=V((x,0.11,0.205*k));p1=V((x,0.08,0.215*k))
            cords.append(tube([tuple(roty(a)(p0)),tuple(roty(a)(p1))],0.003,5))
        mk(pre+'__hips__kzcord%d'%pi_,merge_geo(*cords),M['cord'],parent)
def build_hakama(pre,parent,st,M):
    rings=[];k=st.get('bulk',1.0)
    for i in range(17):
        t=i/16;y=0.1-0.44*t;rx=(0.165+0.13*t)*k;rz=(0.12+0.11*t)*k
        f=lambda a,t=t:1+0.045*(abs(math.sin(a*7))-0.5)*(0.3+t)*(1 if math.cos(a)>-0.3 else 0.4)
        rings.append(ellipse_ring((0,y,0),rx,rz,64,f))
    mk(pre+'__hips__hakama',loft(rings,True),M['hakama'],parent,solid=0.006,disp=lambda p,n:0.004*fbm3(p,10,3))
def build_leg(pre,side,thigh,knee,st,M):
    sd='L' if side>0 else 'R';rnd=random.Random(11+side);k=st.get('bulk',1.0)
    rings=[]
    for i in range(17):
        t=i/16;y=0.05-0.52*t;r=(0.098+0.022*t)*k
        rings.append(ellipse_ring((0,y,0.0),r,r*0.95,28,lambda a,t=t:1+0.06*math.sin(a*5+t*3)*t))
    mk(pre+'__thigh'+sd+'__hakama',loft(rings,True),M['hakama'],thigh,solid=0.005,disp=lambda p,n:0.007*fbm3(p,9,3,side))
    rings=[]
    for i in range(13):
        t=i/12;y=0.02-0.25*t;r=(0.12-0.06*smooth(0.3,1,t))*k
        rings.append(ellipse_ring((0,y,0.005),r,r*0.95,28,lambda a,t=t:1+0.08*math.sin(a*6+t*4)*(1-t)))
    mk(pre+'__shin'+sd+'__hakama',loft(rings,True,False,True),M['hakama'],knee,solid=0.004,disp=lambda p,n:0.006*fbm3(p,10,3,side+5))
    # кяхан (обмотки)
    mk(pre+'__shin'+sd+'__kyahan',lathe([(0.062,-0.16),(0.058,-0.22),(0.05,-0.3),(0.046,-0.37),(0.044,-0.4)],22,c=(0,0,0)),M['wrap'],knee,disp=lambda p,n:0.0025*abs(math.sin((p.y*55+math.atan2(p.x,p.z)*1.0)))*1.0)
    # сунэатэ (шинни)
    for q,x in enumerate((-0.022,0.0,0.022)):
        g=plate(0.019,0.26,0.004,curve=0.06,nu=3,nv=6);g=xform(g,chain(tr(x,0,0),roty(0),tr(0,-0.24,0.058)))
        mk(pre+'__shin'+sd+'__suneate%d'%q,g,M['plate'],knee,bevel=0.0012,sharp=45)
    for y in(-0.15,-0.33):
        rr=0.06-0.016*(-y-0.16)/0.24+0.003
        mk(pre+'__shin'+sd+'__sncord%d'%int(-y*100),tube([tuple(V((math.sin(a)*rr,y,math.cos(a)*rr))) for a in [i*TAU/20 for i in range(21)]],0.003,5),M['cord'],knee)
    # таби и вараджи
    foot=[]
    for i in range(11):
        t=i/10;z=-0.05+0.25*t;w=0.034+0.01*math.sin(t*math.pi*0.9);h=0.05*(1-0.7*t**1.3)+0.01
        yc=-0.462+h/2;foot.append([(w*math.sin(a)*(1.0 if math.cos(a)>-0.5 else 0.95),yc+h/2*math.cos(a),z) for a in [TAU*j/16 for j in range(16)]])
    foot=[[(x,y,z) for x,y,z in r] for r in foot]
    g=loft([[ (p[0],p[1],p[2]) for p in r] for r in foot],True,True,True)
    # переориентируем кольца: loft строит кольца в плоскости XY вдоль Z
    mk(pre+'__shin'+sd+'__tabi',g,M['tabi'],knee,sub=1)
    mk(pre+'__shin'+sd+'__ankle',lathe([(0.045,-0.43),(0.046,-0.4),(0.045,-0.37)],16),M['tabi'],knee)
    sole=plate(0.1,0.28,0.014,nu=4,nv=6);sole=xform(sole,chain(rotx(-math.pi/2),tr(0,-0.468,0.075)))
    mk(pre+'__shin'+sd+'__waraji',sole,M['straw'],knee,bevel=0.004)
    straps=[]
    for path in([(-0.042,-0.462,0.06),(-0.03,-0.43,0.03),(0,-0.415,0.0),(0.03,-0.43,0.03),(0.042,-0.462,0.06)],[(0,-0.46,0.17),(0.0,-0.435,0.12),(-0.03,-0.43,0.06),(-0.04,-0.41,-0.02),(0,-0.4,-0.06),(0.04,-0.41,-0.02),(0.03,-0.43,0.06),(0,-0.435,0.12)]):
        straps.append(tube(path,0.004,6))
    mk(pre+'__shin'+sd+'__straps',merge_geo(*straps),M['rope'],knee)
def build_arm(pre,side,sh,el,hand,st,M,glove=False):
    sd='L' if side>0 else 'R';k=st.get('bulk',1.0)
    rings=[]
    for i in range(15):
        t=i/14;y=0.03-0.33*t;r=(0.068-0.012*t)*k*(1+0.12*math.sin(t*math.pi))
        rings.append(ellipse_ring((0,y,0),r,r*0.95,24,lambda a,t=t:1+0.05*math.sin(a*4+t*6)))
    mk(pre+'__upperArm'+sd+'__sleeve',loft(rings,True,True,True),M['kimono'],sh,sub=1,disp=lambda p,n:0.004*fbm3(p,14,3,side))
    # содэ
    geos=[]
    for r in range(st.get('sode_rows',3)):
        R=0.11+0.01*r;g=plate(0.135*k,0.06,0.006,curve=R,nu=10,nv=2);g=xform(g,chain(tr(0,0,R),rotx(-0.12),tr(0,0.06-r*0.053,-R+0.075*k),roty(side*math.pi/2)))
        geos.append(g)
    mk(pre+'__upperArm'+sd+'__sode',merge_geo(*geos),M['lacquer'],sh,bevel=0.0012,sharp=50)
    g=plate(0.14*k,0.03,0.008,curve=0.11,nu=10,nv=1);g=xform(g,chain(tr(0,0,0.11),tr(0,0.095,-0.11+0.073*k),roty(side*math.pi/2)))
    mk(pre+'__upperArm'+sd+'__kanmuri',g,M['plate'],sh,bevel=0.002,sharp=45)
    if not glove:
        rings=[]
        for i in range(11):
            t=i/10;y=0.02-0.24*t;r=(0.05-0.012*t)*k
            rings.append(ellipse_ring((0,y,0),r,r*0.92,20))
        mk(pre+'__foreArm'+sd+'__sleeve',loft(rings,True,True,False),M['kote'],el,sub=1,disp=lambda p,n:0.002*fbm3(p,30,2))
        for q,a in enumerate((-0.5,0.0,0.5)):
            g=plate(0.022,0.17,0.004,curve=0.05,nu=3,nv=4);g=xform(g,chain(tr(0,0,0.05*k),roty(side*math.pi/2+a),tr(0,-0.11,0)))
            mk(pre+'__foreArm'+sd+'__ikada%d'%q,g,M['plate'],el,bevel=0.001,sharp=45)
        mk(pre+'__foreArm'+sd+'__cuff',lathe([(0.041,-0.205),(0.044,-0.215),(0.042,-0.225)],18),M['plate'],el)
        build_fist(pre,side,hand,M,M['skin'])
        g=plate(0.05,0.07,0.004,curve=0.05,nu=4,nv=4);g=xform(g,chain(roty(side*math.pi/2),tr(side*0.033,0.03,0.0)))
        mk(pre+'__hand'+sd+'__tekko',g,M['plate'],hand,bevel=0.001,sharp=45)
    else:
        lames=[]
        for q in range(7):
            y0=0.03-q*0.036;y1=y0-0.044;r0=(0.06-0.0022*q)*k;r1=r0+0.004
            lames.append(lathe([(r0-0.004,y0+0.002),(r0,y0),(r1,y1+0.004),(r1-0.002,y1)],28,f=lambda a:1+0.12*max(0,math.cos(a-side*math.pi/2))**4))
        mk(pre+'__foreArm'+sd+'__lames',merge_geo(*lames),M['gauntlet'],el,sharp=40)
        mk(pre+'__foreArm'+sd+'__couter',xform(lathe([(0.0001,0.04),(0.05,0.025),(0.065,-0.0),(0.05,-0.03),(0.0001,-0.045)],18,cap0=True,cap1=True,f=lambda a:1+0.4*max(0,math.cos(a))**3),chain(lambda p:V((p.x*0.6,p.y,p.z)),rotx(-math.pi/2),tr(0,0.0,-0.035))),M['gauntlet'],el,sub=1,sharp=40)
        # шипы-гребень
        sp=[]
        for q in range(5):
            y=-0.02-q*0.04;b=V((side*0.0,y,-0.058*k));sp.append(tube([tuple(b),tuple(b+V((0,-0.012,-0.022+q*0.002)))],lambda t:0.008*(1-t),6,cap1=True))
        mk(pre+'__foreArm'+sd+'__spikes',merge_geo(*sp),M['gauntlet'],el)
        # светящиеся жилы-молнии
        rnd=random.Random(21);bolts=[]
        for q in range(6):
            a=rnd.uniform(-2.5,2.5);y=0.02;path=[]
            for i in range(9):
                r=(0.064-0.0022*i*0.8)*k+0.002;path.append((math.sin(a)*r,y,math.cos(a)*r));y-=0.028;a+=rnd.uniform(-0.45,0.45)
            bolts.append(tube(path,0.0024,4))
        mk(pre+'__foreArm'+sd+'__veins',merge_geo(*bolts),M['glow'],el)
        build_fist(pre,side,hand,M,M['gauntlet'],claws=True)
        orbset=lathe([(0.0001,0.003),(0.02,0.002),(0.022,-0.004),(0.0001,-0.006)],20,cap0=True,cap1=True);orbset=xform(orbset,chain(rotz(-side*math.pi/2),tr(side*0.04,0.025,0.0)))
        mk(pre+'__hand'+sd+'__orbset',orbset,M['gilt'],hand,sharp=40)
        orb=lathe([(0.0001,-0.014),(0.01,-0.01),(0.014,0),(0.01,0.01),(0.0001,0.014)],16,cap0=True,cap1=True);orb=xform(orb,tr(side*0.044,0.025,0.0))
        mk(pre+'__hand'+sd+'__orb',orb,M['orb'],hand,sub=1)
def build_fist(pre,side,hand,M,mt,claws=False):
    sd='L' if side>0 else 'R';s=side
    palm=box(0.014,0.034,0.04,(0,0,0));palm=xform(palm,chain(tr(s*0.022,0.03,0.0),lambda p:V((p.x,p.y,p.z*(1-0.15*(p.y-0.03)/0.034)))))
    mk(pre+'__hand'+sd+'__palm',palm,mt,hand,sub=2)
    fingers=[]
    for q,(z,r,L) in enumerate(((0.028,0.0088,3.7),(0.009,0.0092,3.75),(-0.01,0.0088,3.65),(-0.028,0.0078,3.5))):
        path=[]
        for i in range(10):
            b=-0.35+(L)*i/9;R=0.0255
            path.append((s*math.cos(b)*R,-math.sin(b)*R-0.002,z))
        fingers.append(tube(path,lambda t:r*(1-0.15*t),7))
    mk(pre+'__hand'+sd+'__fingers',merge_geo(*fingers),mt,hand,sub=1)
    th=[(-s*0.005,0.04,0.02),(-s*0.024,0.022,0.035),(-s*0.026,0.006,0.045),(-s*0.012,-0.006,0.05)]
    mk(pre+'__hand'+sd+'__thumb',tube(th,lambda t:0.0105*(1-0.2*t),7),mt,hand,sub=1)
    if claws:
        cl=[]
        for q,z in enumerate((0.028,0.009,-0.01,-0.028)):
            b=-0.35+3.6;R=0.0255;p=V((s*math.cos(b)*R,-math.sin(b)*R,z));d=V((s*math.sin(b),math.cos(b),0))*-1
            cl.append(tube([tuple(p),tuple(p+d*0.012+V((0,0.006,0)))],lambda t:0.006*(1-t),6))
        mk(pre+'__hand'+sd+'__claws',merge_geo(*cl),M['claw'],hand)
def build_human(pre,st,M,loc=(0,0,0)):
    root=empty(pre,loc);hips=empty(pre+'__J_hips',(0,0.92,0),root)
    thighs={};knees={}
    for side in(-1,1):
        sd='L' if side>0 else 'R';th=empty(pre+'__J_thigh'+sd,(side*0.1,0,0),hips);kn=empty(pre+'__J_shin'+sd,(0,-0.44,0),th);build_leg(pre,side,th,kn,st,M)
    build_hakama(pre,hips,st,M);build_kusazuri(pre,hips,st,M)
    torso=empty(pre+'__J_torso',(0,0,0),hips);build_torso(pre,torso,st,M)
    neck=empty(pre+'__J_neck',(0,0.6,0),torso);c=build_head(pre,neck,st,M);build_hair(pre,neck,st,M,c,st.get('hair','topknot'))
    if st.get('hachimaki'):build_hachimaki(pre,neck,st,c,M['white'])
    for side in(-1,1):
        sd='L' if side>0 else 'R';sh=empty(pre+'__J_upperArm'+sd,(side*0.22,0.5,0),torso);el=empty(pre+'__J_foreArm'+sd,(0,-0.29,0),sh);ha=empty(pre+'__J_hand'+sd,(0,-0.28,0),el)
        build_arm(pre,side,sh,el,ha,st,M,glove=(st.get('glove') and side>0))
    if st.get('cape'):build_cape(pre,torso,st,M);build_hood(pre,torso,st,M)
    if st.get('saya'):
        import swords
        for q,(L,z) in enumerate(((0.74,0.0),(0.69,0.035))):
            Z=V((0.1+0.03*q,-0.42-0.05*q,-0.9)).normalized();up=V((0,1,0));Y=(up-Z*up.dot(Z)).normalized();X=Y.cross(Z);E=V((0.135,0.075-q*0.02,0.1-z*0.5))
            swords.build_saya(pre+'__hips__saya%d'%q,L,hips,fn=lambda p,X=X,Y=Y,Z=Z,E=E:E+X*p.x+Y*p.y+Z*p.z)
    if st.get('horns'):
        for sd in(-1,1):
            path=[(sd*0.045,0.19,0.02),(sd*0.075,0.24,0.0),(sd*0.09,0.3,-0.04),(sd*0.08,0.35,-0.1)]
            mk(pre+'__neck__horn%d'%(sd+1),tube(path,lambda t:0.022*(1-0.92*t),10,cap1=True),M['horn'],neck,sub=1,disp=lambda p,n:0.002*math.sin(p.y*200))
    return root
def mats_akira():
    return dict(skin=mat('AK_skin',(0.86,0.7,0.6),0.5,tex='skin_c',ntex='skin_n',nstr=0.6,dens=12,sheen=0.1),eye=mat('eye',(0.02,0.015,0.012),0.1,coat=1.0),
      hair=mat('hair',(0.03,0.026,0.024),0.45,tex='hair_c',ntex='hair_n',dens=20,sheen=0.15),cord=mat('cord_red',(0.45,0.05,0.04),0.8,tex='cloth_c',ntex='cloth_n',dens=60),
      white=mat('cloth_white',(0.8,0.77,0.7),0.85,tex='cloth_c',ntex='cloth_n',dens=30),
      kimono=mat('AK_kimono',(0.07,0.075,0.085),0.9,tex='cloth_c',ntex='cloth_n',nstr=1.0,dens=22,sheen=0.3),kimono2=mat('AK_kimono2',(0.24,0.04,0.035),0.85,tex='cloth_c',ntex='cloth_n',dens=24,sheen=0.3),
      juban=mat('AK_juban',(0.62,0.6,0.55),0.85,tex='cloth_c',ntex='cloth_n',dens=30),obi=mat('AK_obi',(0.2,0.14,0.08),0.8,tex='cloth_c',ntex='cloth_n',dens=30),
      lacquer=mat('AK_kozane',(1,1,1),0.3,0.0,tex='kozane_ak_c',ntex='kozane_n',nstr=1.5,coat=0.6,dens=2.27),plate=mat('AK_iron',(0.07,0.065,0.065),0.35,0.6,ntex='metal_n',nstr=0.7,coat=0.4,dens=8),
      gilt=mat('gilt',(0.8,0.58,0.25),0.3,1.0,ntex='metal_n',nstr=0.4,dens=12),leather=mat('leather',(0.18,0.11,0.07),0.6,tex='leather_c',ntex='leather_n',dens=10),
      hakama=mat('AK_hakama',(0.11,0.11,0.12),0.95,tex='cloth_c',ntex='cloth_n',nstr=1.2,dens=18,sheen=0.3),wrap=mat('AK_wrap',(0.36,0.33,0.28),0.95,tex='cloth_c',ntex='cloth_n',dens=26),
      tabi=mat('tabi',(0.06,0.06,0.07),0.9,tex='cloth_c',ntex='cloth_n',dens=30),straw=mat('straw',(1,1,1),0.95,tex='straw_c',ntex='straw_n',dens=8),rope=mat('rope',(0.5,0.42,0.3),0.95,tex='straw_c',ntex='straw_n',dens=40),
      kote=mat('AK_kote',(0.08,0.08,0.1),0.85,tex='cloth_c',ntex='cloth_n',dens=26),gauntlet=mat('AK_gauntlet',(0.42,0.43,0.46),0.28,1.0,ntex='metal_n',orm='metal_orm',nstr=0.8,dens=10),
      glow=mat('glow_blue',(0.3,0.6,1.0),0.3,emis=(0.35,0.7,1.0),es=3.0),orb=mat('orb_blue',(0.5,0.8,1.0),0.05,emis=(0.45,0.8,1.0),es=10.0),claw=mat('claw',(0.3,0.3,0.32),0.3,1.0,dens=10),
      cape=mat('AK_cape',(0.085,0.088,0.095),1.0,tex='cloth_c',ntex='cloth_n',nstr=1.4,dens=12,double=True),horn=mat('horn',(0.08,0.03,0.05),0.35,coat=0.5,dens=8))
def mats_sota():
    M=dict(mats_akira())
    M.update(skin=mat('SO_skin',(0.6,0.45,0.4),0.5,tex='skin_c',ntex='skin_n',nstr=0.8,dens=12),eye=mat('eye_red',(1,0.1,0.08),0.2,emis=(1.0,0.08,0.05),es=12),
      kimono=mat('SO_kimono',(0.03,0.02,0.025),0.9,tex='cloth_c',ntex='cloth_n',dens=22,sheen=0.3),kimono2=mat('SO_kimono2',(0.28,0.03,0.04),0.8,tex='cloth_c',ntex='cloth_n',dens=24),
      lacquer=mat('SO_kozane',(1,1,1),0.3,0.1,tex='kozane_so_c',ntex='kozane_n',nstr=1.6,coat=0.7,dens=2.27),plate=mat('SO_iron',(0.12,0.03,0.03),0.3,0.7,ntex='metal_n',coat=0.5,dens=8),
      hakama=mat('SO_hakama',(0.05,0.035,0.04),0.95,tex='cloth_c',ntex='cloth_n',dens=18,sheen=0.3),obi=mat('SO_obi',(0.3,0.05,0.04),0.8,tex='cloth_c',ntex='cloth_n',dens=30),
      kote=mat('SO_kote',(0.05,0.02,0.02),0.85,tex='cloth_c',ntex='cloth_n',dens=26),gilt=mat('SO_gilt',(0.5,0.12,0.1),0.35,1.0,ntex='metal_n',dens=12))
    return M
AKIRA=dict(hachimaki=True,cape=True,glove=True,saya=True,hair='topknot')
SOTA=dict(head=(0.075,0.114,0.096),bulk=1.06,hair='long',horns=True,do_arc=(-math.pi,math.pi),do_rows=5,kz_n=7,sode_rows=5,nose=0.024,brow=0.009,angry=3,saya=False)
