"""Катаны: Акацуки (золотая цуба, красная оплётка), Ёи (тёмно-синяя цуба с лазуритом), клинки Соты и Гасы.
Система координат меча (как в игре): рукоять у начала координат (точка хвата), клинок вдоль +Z, обух — +Y."""
import bpy, math
from lib import *
def blade_geo(L,sori=0.035,w0=0.032,th0=0.0075,z0=0.085,segs=96,hi=True):
    rings=[];uvs_t=[]
    for i in range(segs+1):
        t=i/segs;w=w0*(1-0.32*t);th=th0*(1-0.4*t)
        ys=w/2;ye=-w/2;s=max(0,(t-0.925)/0.075)
        if s>0:ye=-w/2+w*0.92*(s**1.7);ys=w/2-w*0.15*s**3
        cy=sori*t*t;z=z0+L*t-0.0*s
        shin=ys-(ys-ye)*0.28
        gf=min(1,max(0,(t-0.015)/0.03))*min(1,max(0,(0.8-t)/0.1)) if hi else 0.0;d=th*0.2*gf
        half=[(th*.33,ys-th*.32),(th*.42,ys-w*0.075),(th*.42-d,ys-w*0.1),(th*.46-d,ys-w*0.205),(th*.48,ys-w*0.235),(th*.5,shin),(th*.13,ye+0.0025*(1-s))]
        sec=[(0,ys)]+half+[(0,ye)]+[(-x,y) for x,y in half[::-1]]
        if i==segs:sec=[(x*0.05,ys-0.001+(y-ys)*0.05) for x,y in sec]
        rings.append([(x,y+cy,z) for x,y in sec]);uvs_t.append(t)
    v,f,_=loft(rings,True,True,True)
    # UV: u — вдоль, v — поперёк (0 обух .. 1 лезвие)
    n=16;u=[]
    for fi,face in enumerate(f):
        uu=[]
        for vi in face:
            r=min(vi//n,segs);p=v[vi];t=uvs_t[r];ring=rings[r];ys=ring[0][1];ye=ring[8][1]
            uu.append((t,(p[1]-ye)/max(1e-5,ys-ye)))
        u.append(uu)
    return v,f,u
def tsuka_geo(z0=0.045,z1=-0.205,rx=0.0125,ry=0.0165):
    prof=[];N=24
    for i in range(N+1):
        t=i/N;z=z0+(z1-z0)*t;k=1-0.08*math.sin(math.pi*t)+0.04*t
        prof.append(ellipse_ring((0,0,0),rx*k,ry*k,16))
    rings=[[(p[0],p[2],z0+(z1-z0)*i/N) for p in r] for i,r in enumerate(prof)]
    return loft(rings,True,True,True)
def ito_geo(z0=0.04,z1=-0.195,rx=0.0125,ry=0.0165,turns=8,w=0.0115):
    gs=[]
    for hand in (1,-1):
        path=[];M=turns*24
        for i in range(M+1):
            t=i/M;a=hand*t*turns*TAU;z=z0+(z1-z0)*t;k=1-0.08*math.sin(math.pi*t)+0.04*t
            path.append((math.cos(a)*(rx*k+0.0022),math.sin(a)*(ry*k+0.0022),z))
        P,T,N,B=frames(path);rings=[]
        for i,p in enumerate(P):
            radial=V((p.x,p.y,0)).normalized();side=T[i].cross(radial).normalized()
            rings.append([tuple(p+side*w*0.5*math.cos(b)+radial*0.0018*math.sin(b)) for b in [j*TAU/6 for j in range(6)]])
        gs.append(loft(rings,True,True,True))
    return merge_geo(*gs)
def tsuba_shape(style):
    if style=='A':return lambda a:1+0.09*abs(math.cos(2*a))**0.5-0.05  # мокко (4 лепестка)
    if style=='Y':return lambda a:1+0.015*math.sin(a*18)
    if style=='S':return lambda a:1+0.22*max(0,math.cos(a*5))**6
    return None
def build_sword(pre,L,style,parent=None,loc=(0,0,0)):
    root=empty(pre,loc,parent)
    steel=mat('blade_steel',(1,1,1),0.15,1.0,tex='blade_c',orm='blade_orm',ntex='metal_n',nstr=0.25,dens=1.0)
    gold=mat('gold_tsuba',(0.85,0.62,0.25),0.32,1.0,ntex='metal_n',nstr=0.6,orm=None,dens=8)
    iron=mat('iron_blue',(0.12,0.15,0.22),0.38,0.9,ntex='metal_n',nstr=0.8,dens=8)
    dark=mat('iron_dark',(0.09,0.05,0.05),0.42,0.85,ntex='metal_n',nstr=0.8,dens=8)
    brass=mat('habaki_brass',(0.9,0.7,0.35),0.25,1.0,ntex='metal_n',nstr=0.3,dens=10)
    same=mat('samegawa',(0.95,0.93,0.86),0.6,0.0,tex='same_c',ntex='same_n',dens=14)
    itoc={'A':(0.42,0.04,0.035),'Y':(0.05,0.07,0.16),'S':(0.07,0.02,0.02),'G':(0.1,0.08,0.06)}[style]
    ito=mat('ito_'+style,itoc,0.85,0,tex='cloth_c',ntex='cloth_n',nstr=1.2,dens=60,sheen=0.4)
    tm={'A':gold,'Y':iron,'S':dark,'G':dark}[style]
    b=mk(pre+'__blade',blade_geo(L,sori=0.035 if style!='G' else 0.05,w0=0.032 if style!='G' else 0.045,th0=0.0075 if style!='G' else 0.01,hi=style!='G'),steel,root,sharp=50)
    # хабаки
    hb=loft([[(-0.0062*k,0.0175*k+0.001,z),(0.0062*k,0.0175*k+0.001,z),(0.0068*k,0.0,z),(0.0045*k,-0.0165*k,z),(-0.0045*k,-0.0165*k,z),(-0.0068*k,0.0,z)] for z,k in((0.061,1.06),(0.07,1.0),(0.082,0.92),(0.089,0.86))],True,True,True)
    mk(pre+'__habaki',hb,brass,root,bevel=0.0008,sharp=35)
    # цуба
    f=tsuba_shape(style);R=0.043 if style!='G' else 0.055
    ts=mk(pre+'__tsuba',lathe([(0.0001,-0.0036),(R*0.86,-0.0036),(R*0.89,-0.0052),(R*0.985,-0.0054),(R,-0.004),(R,0.004),(R*0.985,0.0054),(R*0.89,0.0052),(R*0.86,0.0036),(0.0001,0.0036)],64,f=f,cap0=True,cap1=True),tm,root,sub=0,sharp=40)
    me=ts.data  # диск повёрнут осью вдоль клинка
    import bmesh as _b
    bm=_b.new();bm.from_mesh(me);_b.ops.rotate(bm,verts=bm.verts,cent=(0,0,0),matrix=Matrix.Rotation(math.pi/2,3,'X'));_b.ops.translate(bm,verts=bm.verts,vec=(0,-0.062,0));bm.to_mesh(me);bm.free()
    # прорези (сукаси) — булевы
    cut=[]
    if style in('A','S'):
        for k in range(4 if style=='A' else 5):
            a=k*TAU/(4 if style=='A' else 5)+math.pi/4;bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=0.0075,depth=0.03,location=(math.cos(a)*0.028,-0.062,math.sin(a)*0.028),rotation=(math.pi/2,0,0))
            cut.append(bpy.context.active_object)
    else:
        for x,r in((0.026,0.006),(-0.026,0.005)):
            bpy.ops.mesh.primitive_cylinder_add(vertices=14,radius=r,depth=0.03,location=(x,-0.062,0.002),rotation=(math.pi/2,0,0));cut.append(bpy.context.active_object)
    for c in cut:
        m=ts.modifiers.new('cut','BOOLEAN');m.object=c;m.solver='EXACT'
    apply_mods(ts)
    for c in cut:bpy.data.objects.remove(c)
    ts.data.set_sharp_from_angle(angle=math.radians(40));box_uv(ts,8)
    # рельеф цубы: лучи солнца (Акацуки) / волны (Ёи)
    rel=[]
    for zf in (0.062-0.0042,0.062+0.0042):
        if style=='A':
            for j in range(12):
                a=(j//3)*math.pi/2+((j%3)-1)*math.radians(20);ln=0.012 if j%3==1 else 0.008
                rel.append(xform(box(ln,0.0011,0.0008,(0.018+ln,0,zf)),rotz(a)))
            rel.append(xform(lathe([(0.0145,-0.0007),(0.0165,-0.0007),(0.0165,0.0007),(0.0145,0.0007)],32,cap0=False,cap1=False),chain(rotx(math.pi/2),tr(0,0,zf))))
        elif style=='Y':
            for k,r0 in enumerate((0.0352,)):
                pts=[(math.cos(a)*(r0+0.0012*math.sin(a*9)),math.sin(a)*(r0+0.0012*math.sin(a*9)),zf) for a in [TAU*i/180 for i in range(181)]]
                rel.append(tube(pts,0.0009,6,cap0=False,cap1=False,flat=0.6))
    if rel:mk(pre+'__tsubarelief',merge_geo(*rel),tm,root,sharp=40)
    # мэкуги (бамбуковый штифт) и хисигами
    peg=mat('mekugi',(0.55,0.42,0.25),0.6,0.0,dens=20)
    mk(pre+'__mekugi',tube([(-0.0152,0,0.02),(0.0152,0,0.02)],0.0026,10,flat=1.0),peg,root)
    # сэппа
    for z in (0.0545,0.0695):
        sp=mk(pre+'__seppa%d'%int(z*1e4),box(0.0105,0.017,0.0012,(0,0.0,z)),brass,root,bevel=0.0006,sharp=30)
    # фути и касира
    def ring_z(z,rx,ry,n=20):return [(math.cos(TAU*j/n)*rx,math.sin(TAU*j/n)*ry,z) for j in range(n)]
    mk(pre+'__fuchi',loft([ring_z(0.053,0.0138,0.0178),ring_z(0.053,0.0145,0.0186),ring_z(0.038,0.0142,0.0182),ring_z(0.036,0.0132,0.0172)],True,False,True),tm,root,sharp=35)
    mk(pre+'__kashira',loft([ring_z(-0.192,0.0134,0.0175),ring_z(-0.2,0.0146,0.0188),ring_z(-0.212,0.0135,0.0175),ring_z(-0.218,0.009,0.012),ring_z(-0.2195,0.004,0.005)],True,False,True),tm,root,sharp=30)
    mk(pre+'__tsuka',tsuka_geo(),same,root)
    mk(pre+'__ito',ito_geo(),ito,root)
    # мэнуки
    for sd,z in((1,-0.06),(-1,-0.1)):
        mk(pre+'__menuki%d'%(1 if sd>0 else 2),tube([(sd*0.0148,0.0,z-0.016),(sd*0.0158,0.0,z),(sd*0.0148,0.0,z+0.016)],0.0035,8,flat=0.6),gold if style!='A' else brass,root)
    if style=='Y':
        lap=mat('lapis_glow',(0.1,0.25,1.0),0.2,0.0,emis=(0.15,0.35,1.0),es=6.0)
        g=lathe([(0.0001,-0.004),(0.006,-0.002),(0.006,0.002),(0.0001,0.004)],16,cap0=True,cap1=True);g=xform(g,chain(rotx(math.pi/2),tr(0,0.03,0.062)))
        mk(pre+'__lapis',g,lap,root,sub=1)
    tip=empty(pre+'__TIP',(0,0.035 if style!='G' else 0.05,0.085+L),root)
    return root
def build_saya(pre,L,parent=None,loc=(0,0,0),col=(0.03,0.025,0.025),fn=None):
    F=(lambda g:xform(g,fn)) if fn else (lambda g:g)
    lac=mat('saya_lacquer',(0.03,0.02,0.02),0.18,0.0,ntex='leather_n',nstr=0.25,coat=1.0,dens=6)
    horn=mat('saya_horn',(0.08,0.06,0.05),0.3,0.0,dens=8)
    cord=mat('sageo',(0.35,0.05,0.04),0.8,0,tex='cloth_c',ntex='cloth_n',dens=50)
    rings=[]
    for i in range(41):
        t=i/40;z=t*(L+0.03);cy=0.035*t*t;k=1-0.18*t
        rings.append([(math.cos(TAU*j/14)*0.0125*k,math.sin(TAU*j/14)*0.021*k+cy,z) for j in range(14)])
    root=parent
    mk(pre+'__saya',F(loft(rings,True,True,True)),lac,root)
    mk(pre+'__koiguchi',F(loft([[(math.cos(TAU*j/14)*0.0138,math.sin(TAU*j/14)*0.0225,z) for j in range(14)] for z in(-0.003,0.012)],True,True,False)),horn,root)
    mk(pre+'__kojiri',F(loft([[(math.cos(TAU*j/14)*0.0108,math.sin(TAU*j/14)*0.0178+0.035,L+0.03+z) for j in range(14)] for z in(-0.02,0.0,0.004)],True,False,True)),horn,root)
    mk(pre+'__kurikata',F(box(0.004,0.006,0.012,(0.0,-0.022,0.1))),horn,root,bevel=0.002)
    path=[(0,-0.026,0.1),(0.01,-0.05,0.12),(0.03,-0.08,0.2),(0.02,-0.12,0.33),(0.0,-0.13,0.4)]
    mk(pre+'__sageo',F(tube(path,0.004,6,flat=0.4)),cord,root)
    return root
