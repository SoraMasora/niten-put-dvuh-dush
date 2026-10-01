"""Сундуки, ключ, записка и предметы-лут (префикс LT). Запуск: python3 blender/loot.py [--preview]
Результат: blender/out/niten_loot.glb (+ blender/out/niten_loot.blend, превью)."""
import sys,os,math;HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
import bpy
OUT=os.path.join(HERE,'out');os.makedirs(OUT,exist_ok=True)
import tex
if not os.path.exists(os.path.join(HERE,'tex','tar_n.png')):tex.build()
bpy.ops.wm.read_factory_settings(use_empty=True)
from lib import *
P='LT'
def M_loot():
    return dict(
      wood=mat('lt_wood',(0.4,0.25,0.15),0.7,tex='wood_c',ntex='wood_n',nstr=0.45,dens=2.2),
      woodin=mat('lt_woodin',(0.13,0.08,0.05),0.85,tex='wood_c',ntex='wood_n',dens=2.2),
      brass=mat('lt_brass',(0.78,0.6,0.3),0.32,1.0,ntex='metal_n',nstr=0.5,dens=8),
      bronze=mat('lt_bronze',(0.42,0.34,0.2),0.42,1.0,tex='stone_c',ntex='metal_n',nstr=0.7,dens=6),
      iron=mat('lt_iron',(0.06,0.06,0.06),0.5,1.0,ntex='metal_n',dens=8),
      paper=mat('lt_paper',(0.93,0.88,0.76),0.9,tex='paper_c',ntex='paper_n',dens=3,double=True),
      ink=mat('lt_ink',(0.5,0.02,0.02),0.6,emis=(1.0,0.12,0.05),es=2.5),
      rope=mat('lt_rope',(0.62,0.52,0.36),0.95,tex='straw_c',ntex='straw_n',dens=30),
      red=mat('lt_lacq_red',(0.45,0.03,0.02),0.25,coat=0.8,ntex='leather_n',nstr=0.2,dens=4),
      black=mat('lt_lacq_black',(0.02,0.018,0.016),0.22,coat=0.9,dens=4),
      blue=mat('lt_glaze_blue',(0.08,0.18,0.42),0.18,coat=0.6,ntex='stone_n',nstr=0.3,dens=5),
      silk=mat('lt_silk',(0.55,0.06,0.08),0.55,tex='cloth_c',ntex='cloth_n',dens=14),
      silkp=mat('lt_silk_purple',(0.28,0.08,0.4),0.55,tex='cloth_c',ntex='cloth_n',dens=14),
      gold=mat('lt_goldthread',(0.95,0.72,0.3),0.35,0.9,dens=10),
      stone=mat('lt_whet',(0.42,0.44,0.46),0.95,tex='stone_c',ntex='stone_n',nstr=1.4,dens=6),
      bone=mat('lt_bone',(0.86,0.82,0.72),0.5,tex='bone_c',ntex='bone_n',dens=4,coat=0.3),
      glow=mat('lt_glow',(1.0,0.7,0.3),0.4,emis=(1.0,0.55,0.2),es=4.0),
      rice=mat('lt_rice',(0.95,0.94,0.9),0.8,ntex='stone_n',nstr=0.4,dens=12),
      nori=mat('lt_nori',(0.03,0.06,0.04),0.6,dens=10),
      wax=mat('lt_wax',(0.55,0.04,0.03),0.35,coat=0.5,dens=10))
M=M_loot()
def rivets(pts,r=0.009,m=None,parent=None,name='rivets'):
    g=[xform(lathe([(r,0),(r*0.9,r*0.35),(r*0.55,r*0.7),(0.0001,r*0.8)],8,cap1=True),chain(rotx(math.pi/2*a[3]) if len(a)>3 else (lambda p:p),tr(a[0],a[1],a[2]))) for a in pts]
    return mk(P+'__'+name,merge_geo(*g),m or M['brass'],parent)
def scroll(cx,cy,cz,sx,s=1.0):
    pts=[];n=26
    for i in range(n+1):
        t=i/n;a=t*4.2;r=0.075*s*(1-0.75*t)
        pts.append((cx+sx*(0.02+math.sin(a)*r+0.06*s*t),cy+math.cos(a)*r-0.04*s,cz))
    return tube(pts,lambda t:0.011*s*(1-0.5*t)+0.004,8,flat=0.55)
# ---------------------------------------------------------------- сундук
def build_chest(loc):
    root=empty(P+'__J_chest',loc);W,D,Hb=0.45,0.3,0.52
    pl=[]
    for i in range(6):  # передние и задние доски
        x=-W+0.02+i*(2*W-0.04)/6+(2*W-0.04)/12
        for z in (D-0.012,-D+0.012):pl.append(box((2*W-0.04)/12-0.004,(Hb-0.07)/2,0.014,(x,0.065+(Hb-0.07)/2,z)))
    for sx in (-1,1):
        for i in range(4):
            z=-D+0.02+i*(2*D-0.04)/4+(2*D-0.04)/8;pl.append(box(0.014,(Hb-0.07)/2,(2*D-0.04)/8-0.004,(sx*(W-0.012),0.065+(Hb-0.07)/2,z)))
    mk(P+'__chest__planks',merge_geo(*pl),M['wood'],root,bevel=0.003,sharp=40,disp=lambda p,n:0.0006*fbm3(p,30,3))
    mk(P+'__chest__inner',merge_geo(box(W-0.03,0.01,D-0.03,(0,0.08,0)),box(W-0.03,0.2,0.004,(0,0.28,D-0.03)),box(W-0.03,0.2,0.004,(0,0.28,-D+0.03)),box(0.004,0.2,D-0.03,(W-0.03,0.28,0)),box(0.004,0.2,D-0.03,(-W+0.03,0.28,0))),M['woodin'],root)
    # металлический каркас
    fr=[box(W+0.035,0.03,D+0.035,(0,0.03,0)),box(W+0.012,0.022,D+0.012,(0,Hb-0.02,0)),box(W+0.012,0.018,D+0.012,(0,0.08,0))]
    for sx in (-1,1):
        for sz in (-1,1):
            fr.append(box(0.035,(Hb-0.06)/2,0.006,(sx*(W-0.025),0.06+(Hb-0.06)/2,sz*(D+0.008))))
            fr.append(box(0.006,(Hb-0.06)/2,0.035,(sx*(W+0.008),0.06+(Hb-0.06)/2,sz*(D-0.025))))
    fr.append(box(0.022,(Hb-0.06)/2,0.006,(0,0.06+(Hb-0.06)/2,D+0.008)))
    for sx in (-1,1):fr.append(box(0.006,(Hb-0.06)/2,0.02,(sx*(W+0.008),0.06+(Hb-0.06)/2,0)))
    mk(P+'__chest__frame',merge_geo(*fr),M['brass'],root,bevel=0.004,sharp=35,disp=lambda p,n:0.0008*fbm3(p,40,2))
    # завитки и ромб на фасаде
    orn=[scroll(-0.11,0.36,D+0.016,-1),scroll(0.11,0.36,D+0.016,1),scroll(-0.11,0.2,D+0.016,-1,0.8),scroll(0.11,0.2,D+0.016,1,0.8)]
    orn.append(xform(lathe([(0.0001,-0.035),(0.022,0),(0.0001,0.035)],4,cap0=True,cap1=True),chain(rotx(math.pi/2),tr(0,0.2,D+0.02))))
    for sx in (-1,1):orn.append(xform(lathe([(0.0001,-0.025),(0.016,0),(0.0001,0.025)],4,cap0=True,cap1=True),chain(rotx(math.pi/2),tr(sx*0.2,0.3,D+0.02))))
    mk(P+'__chest__ornament',merge_geo(*orn),M['brass'],root,sub=1)
    # замочная накладка (нижняя половина) с скважиной
    lp=[];N=40
    for i in range(N):
        a=TAU*i/N;r=0.075+0.02*math.cos(4*a)+0.01*math.cos(8*a);lp.append((math.sin(a)*r*1.25,math.cos(a)*r*0.9))
    rings=[[(x,Hb-0.02+y,D+0.012) for x,y in lp],[(x*0.97,Hb-0.02+y*0.97,D+0.028) for x,y in lp]]
    mk(P+'__chest__lockplate',loft(rings,True,False,True),M['brass'],root,bevel=0.002,disp=lambda p,n:0.0006*fbm3(p,60,2))
    mk(P+'__chest__keyhole',merge_geo(lathe([(0.0001,0),(0.011,0),(0.011,0.006),(0.0001,0.006)],12,c=(0,0,0)),box(0.005,0.012,0.003)),M['iron'],root,loc=(0,0,0)) if False else None
    kh=merge_geo(xform(lathe([(0.0001,0),(0.0105,0),(0.0105,0.004),(0.0001,0.004)],12,cap0=True,cap1=True),chain(rotx(math.pi/2),tr(0,Hb-0.025,D+0.03))),box(0.0045,0.014,0.002,(0,Hb-0.042,D+0.03)))
    mk(P+'__chest__keyhole',kh,M['iron'],root)
    # кольца-ручки по бокам
    for sx in (-1,1):
        ring=[(sx*(W+0.03),0.36+math.cos(TAU*i/24)*0.05-0.05,math.sin(TAU*i/24)*0.05) for i in range(25)]
        mk(P+'__chest__ring%d'%(sx+1),tube(ring,0.009,8,False,False),M['brass'],root)
        mk(P+'__chest__ringmount%d'%(sx+1),merge_geo(box(0.008,0.03,0.035,(sx*(W+0.016),0.37,0)),xform(lathe([(0.012,-0.02),(0.012,0.02)],10,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(sx*(W+0.03),0.36,0)))),M['brass'],root,bevel=0.002)
    rp=[]
    for x in (-W+0.025,W-0.025):
        for y in (0.1,0.2,0.3,0.4):rp.append((x,y,D+0.014,1))
    for x in (-0.38,-0.2,0,0.2,0.38):rp.append((x,0.03,D+0.036,1));rp.append((x,Hb-0.02,D+0.013,1))
    rivets(rp,0.007,parent=root,name='chest__rivets')
    # крышка (шарнир у задней кромки)
    lid=empty(P+'__J_lid',(0,Hb,-D),root);Hl=0.22;NA=18
    def arc(r_add=0.0,z0=-0.0):
        return [(0,0.0+(Hl+r_add)*math.sin(math.pi*k/NA),D+(D+r_add)*math.cos(math.pi*k/NA)) for k in range(NA+1)]
    a0=arc()
    def lidsec(x,sc=1.0,add=0.0):
        pts=[(x,y*sc+0.0,z*sc+(1-sc)*D) for _,y,z in arc(add)]
        return pts+[(x,0.0,D+(D)*1.0-0.0001)][:0]
    rings=[[(x,y,z) for _,y,z in a0] for x in (-W+0.03,W-0.03)]
    mk(P+'__lid__planks',loft(rings,False,False,False),M['wood'],lid,solid=0.02,disp=lambda p,n:0.0012*fbm3(p,25,3))
    rings=[[(x,y*0.9,D+(z-D)*0.94) for _,y,z in a0] for x in (-W+0.035,W-0.035)]
    mk(P+'__lid__under',loft(rings,False,False,False),M['woodin'],lid,solid=0.004)
    # торцы крышки
    for sx in (-1,1):
        cap=[(sx*(W-0.02),y,z) for _,y,z in a0]
        v=cap+[(sx*(W-0.02),0.0,D)];f=[tuple(range(len(cap)))] if False else [(len(cap),i,i+1) if sx>0 else (len(cap),i+1,i) for i in range(len(cap)-1)]
        uv=[[(0,0),(1,0),(1,1)] for _ in f]
        mk(P+'__lid__end%d'%(sx+1),(v,f,uv),M['wood'],lid,solid=0.02)
    bands=[]
    for x in (-W+0.012,W-0.012,-0.07,0.07):
        w=0.026 if abs(x)>0.3 else 0.02
        bands.append(loft([[(x-w,y,z) for _,y,z in arc(0.012)],[(x+w,y,z) for _,y,z in arc(0.012)]],False,False,False))
    bands.append(box(W+0.012,0.018,0.012,(0,0.012,2*D+0.004)))
    mk(P+'__lid__bands',merge_geo(*bands),M['brass'],lid,solid=0.008,disp=lambda p,n:0.0006*fbm3(p,40,2))
    # верхняя часть накладки на крышке (язычок)
    tp=[];N=30
    for i in range(N):
        a=math.pi*i/(N-1)-math.pi/2;r=0.05+0.018*math.cos(3*a);tp.append((math.sin(a)*r,0.01+abs(math.cos(a))*r*1.3))
    tp=[(x,y) for x,y in tp]
    rings=[[(x,y,2*D+0.014) for x,y in tp],[(x*0.95,y*0.95,2*D+0.03) for x,y in tp]]
    mk(P+'__lid__hasp',loft(rings,False,False,False),M['brass'],lid,solid=0.006)
    rivets([(x,0.012,2*D+0.012,1) for x in (-0.4,-0.25,0.25,0.4)],0.007,parent=lid,name='lid__rivets')
    # печать: верёвка симэнава + бумажные о-фуда
    seal=empty(P+'__J_seal',(0,0,0),root)
    pts=[];hx,hz,rc=W+0.035,D+0.035,0.05
    for q,(cx,cz) in enumerate(((hx-rc,hz-rc),(-hx+rc,hz-rc),(-hx+rc,-hz+rc),(hx-rc,-hz+rc))):
        for k in range(7):
            a=q*math.pi/2+math.pi/2*k/6;pts.append((cx+math.cos(a)*rc,0.42+0.006*math.sin(len(pts)*1.3),cz+math.sin(a)*rc))
    pts.append(pts[0])
    mk(P+'__seal__rope',tube(pts,0.018,10,False,False,rfn=lambda a,t:1+0.18*math.sin(a*2+t*160)),M['rope'],seal)
    of=[];ink=[]
    for k,(x,rz) in enumerate(((-0.2,0.1),(0.2,-0.08),(0.0,0.03))):
        g=xform(plate(0.085,0.26,0.002,nu=1,nv=6,bend=0.01),chain(rotz(rz),tr(x,0.3,D+0.058+k*0.002)));of.append(g)
        for j in range(4):ink.append(xform(box(0.026-0.008*(j%2),0.006,0.002),chain(tr(0,0.38-0.045*j-0.3,0),rotz(rz),tr(x,0.3,D+0.061+k*0.002))))
    mk(P+'__seal__ofuda',merge_geo(*of),M['paper'],seal);mk(P+'__seal__ink',merge_geo(*ink),M['ink'],seal)
    return root
# ---------------------------------------------------------------- ключ
def build_key(loc):
    r=empty(P+'__J_key',loc)
    ring=[(0,0.075+math.cos(TAU*i/32)*0.028,math.sin(TAU*i/32)*0.028) for i in range(33)]
    g=[tube(ring,0.0055,8,False,False),box(0.002,0.0045,0.024,(0,0.075,0)),box(0.002,0.024,0.0045,(0,0.075,0))]
    g.append(tube([(0,0.045,0),(0,0.0,0),(0,-0.075,0)],0.0055,10))
    g+= [box(0.0035,0.006,0.012,(0,-0.07,0.012)),box(0.0035,0.012,0.006,(0,-0.058,0.02)),box(0.0035,0.005,0.01,(0,-0.045,0.01))]
    g.append(lathe([(0.009,0.038),(0.012,0.044),(0.009,0.05)],12))
    mk(P+'__key__metal',merge_geo(*g),M['brass'],r,bevel=0.001)
    mk(P+'__key__cord',tube([(0,0.104,0),(0.005,0.118,0.006),(0,0.128,0)],0.003,6),M['silk'],r)
    mk(P+'__key__tassel',lathe([(0.003,0.128),(0.007,0.14),(0.011,0.17),(0.0001,0.172)],12,cap1=True,f=lambda a:1+0.15*math.sin(a*9)),M['silk'],r)
    return r
# ---------------------------------------------------------------- записка брата
def build_note(loc):
    r=empty(P+'__J_note',loc)
    mk(P+'__note__paper',xform(plate(0.2,0.13,0.004,nu=8,nv=4,bend=0.008),chain(rotx(-math.pi/2),tr(0,0.004,0))),M['paper'],r,disp=lambda p,n:0.0012*fbm3(p,30,2))
    mk(P+'__note__fold',xform(plate(0.2,0.05,0.003,nu=6,nv=1),chain(rotx(-math.pi/2+0.35),tr(0,0.01,0.04))),M['paper'],r)
    mk(P+'__note__string',merge_geo(xform(box(0.003,0.0035,0.068),tr(0.03,0.009,0)),xform(box(0.1,0.0035,0.003),tr(0,0.012,0.0))),M['silk'],r)
    mk(P+'__note__wax',lathe([(0.0001,0.0),(0.017,0.0),(0.018,0.005),(0.012,0.008),(0.0001,0.008)],18,cap0=True,cap1=True,f=lambda a:1+0.08*math.sin(a*7),c=(0.03,0.012,0)),M['wax'],r,sub=1)
    return r
# ---------------------------------------------------------------- предметы
def build_gourd(loc):
    r=empty(P+'__J_gourd',loc)
    pr=[(0.0001,0),(0.04,0.004),(0.058,0.03),(0.06,0.06),(0.05,0.09),(0.028,0.11),(0.024,0.12),(0.036,0.14),(0.04,0.16),(0.033,0.18),(0.018,0.195),(0.014,0.205)]
    mk(P+'__gourd__body',lathe(pr,28,cap0=True),M['red'],r,sub=1)
    mk(P+'__gourd__stopper',lathe([(0.012,0.2),(0.016,0.215),(0.012,0.23),(0.0001,0.232)],12,cap1=True),M['wood'],r)
    mk(P+'__gourd__cord',merge_geo(tube([(math.sin(TAU*i/24)*0.027,0.116,math.cos(TAU*i/24)*0.027) for i in range(25)],0.004,6,False,False),tube([(0.027,0.116,0),(0.05,0.1,0.01),(0.055,0.07,0.02)],0.0035,6)),M['gold'],r)
    mk(P+'__gourd__tassel',lathe([(0.004,0.07),(0.008,0.058),(0.011,0.03),(0.0001,0.028)],10,c=(0.055,0,0.02),cap1=True),M['silk'],r)
    mk(P+'__gourd__mon',xform(lathe([(0.0001,0),(0.02,0),(0.02,0.002),(0.0001,0.002)],16,cap0=True,cap1=True),chain(rotx(math.pi/2),tr(0,0.055,0.059))),M['gold'],r)
def build_flask(loc):
    r=empty(P+'__J_flask',loc)
    pr=[(0.0001,0),(0.035,0.0),(0.04,0.008),(0.052,0.05),(0.055,0.09),(0.046,0.13),(0.022,0.16),(0.016,0.18),(0.02,0.195),(0.016,0.2)]
    mk(P+'__flask__body',lathe(pr,28,cap0=True),M['blue'],r,sub=1,disp=lambda p,n:0.0008*fbm3(p,40,2))
    mk(P+'__flask__label',xform(plate(0.045,0.06,0.001,curve=0.056,nu=6,nv=1),tr(0,0.08,0.057)),M['paper'],r)
    mk(P+'__flask__cork',lathe([(0.014,0.19),(0.015,0.21),(0.0001,0.212)],12,cap1=True),M['wood'],r)
    mk(P+'__flask__cord',tube([(math.sin(TAU*i/20)*0.018,0.175,math.cos(TAU*i/20)*0.018) for i in range(21)],0.003,6,False,False),M['rope'],r)
    mk(P+'__flask__glyph',merge_geo(*[box(0.012-0.005*(j%2),0.002,0.001,(0,0.1-0.013*j,0.0575)) for j in range(4)]),M['ink'],r)
def build_omamori(loc):
    r=empty(P+'__J_omamori',loc)
    mk(P+'__omamori__pouch',merge_geo(box(0.032,0.045,0.008,(0,0.05,0)),xform(lathe([(0.0001,0),(0.032,0),(0.0001,0.02)],16,cap0=True),chain(lambda p:V((p.x,p.y,p.z*0.25)),tr(0,0.095,0)))),M['silk'],r,sub=2)
    mk(P+'__omamori__brocade',merge_geo(*[box(0.03,0.0018,0.0005,(0,0.02+0.012*j,0.0105)) for j in range(6)]),M['gold'],r)
    mk(P+'__omamori__knot',merge_geo(tube([(math.sin(TAU*i/24)*0.012,0.112+math.cos(TAU*i/24)*0.012,0) for i in range(25)],0.0028,6,False,False),tube([(0,0.1,0),(-0.006,0.112,0.004),(0.006,0.112,0.004),(0,0.1,0)],0.003,6)),M['gold'],r)
def build_whetstone(loc):
    r=empty(P+'__J_whetstone',loc)
    mk(P+'__whetstone__base',box(0.1,0.018,0.04,(0,0.018,0)),M['wood'],r,bevel=0.004,sharp=40)
    mk(P+'__whetstone__stone',box(0.085,0.016,0.03,(0,0.05,0)),M['stone'],r,bevel=0.003,sharp=40,disp=lambda p,n:0.001*fbm3(p,50,3))
    mk(P+'__whetstone__band',merge_geo(box(0.008,0.02,0.032,(-0.06,0.05,0)),box(0.008,0.02,0.032,(0.06,0.05,0))),M['brass'],r,bevel=0.002)
    mk(P+'__whetstone__cloth',xform(plate(0.06,0.05,0.002,nu=4,nv=4,bend=0.012),chain(rotx(-math.pi/2+0.2),tr(0.04,0.04,0.045))),M['silkp'],r)
def build_censer(loc):
    r=empty(P+'__J_censer',loc)
    mk(P+'__censer__bowl',lathe([(0.0001,0.03),(0.04,0.03),(0.06,0.05),(0.066,0.08),(0.06,0.1),(0.064,0.105)],28,cap0=True),M['bronze'],r,solid=0.004)
    mk(P+'__censer__legs',merge_geo(*[tube([(math.sin(a)*0.045,0.04,math.cos(a)*0.045),(math.sin(a)*0.058,0.015,math.cos(a)*0.058),(math.sin(a)*0.055,0.0,math.cos(a)*0.055)],0.008,8) for a in (0,TAU/3,2*TAU/3)]),M['bronze'],r)
    mk(P+'__censer__lid',lathe([(0.064,0.105),(0.055,0.13),(0.03,0.15),(0.012,0.16),(0.018,0.175),(0.0001,0.19)],24,cap1=True,f=lambda a:1+0.04*math.cos(a*6)),M['bronze'],r,solid=0.003)
    for sx in (-1,1):mk(P+'__censer__handle%d'%(sx+1),tube([(sx*0.064,0.095,0),(sx*0.085,0.105,0),(sx*0.08,0.12,0)],0.006,8),M['bronze'],r)
    mk(P+'__censer__ember',lathe([(0.0001,0.098),(0.05,0.098),(0.0001,0.104)],16,cap0=True),M['glow'],r)
def build_scroll(loc):
    r=empty(P+'__J_scroll',loc);L=0.12
    f=lambda g:xform(g,chain(rotz(math.pi/2),tr(0,0.028,0)))
    mk(P+'__scroll__paper',f(lathe([(0.0001,-L),(0.024,-L),(0.026,-L+0.01),(0.026,L-0.01),(0.024,L),(0.0001,L)],24,cap0=True,cap1=True)),M['paper'],r)
    mk(P+'__scroll__silk',f(lathe([(0.0275,-L+0.012),(0.0275,L-0.012)],24)),M['silkp'],r,solid=0.001)
    mk(P+'__scroll__rods',merge_geo(f(lathe([(0.007,-L-0.03),(0.012,-L-0.025),(0.012,-L-0.002),(0.007,-L)],12,cap0=True)),f(lathe([(0.007,L),(0.012,L+0.002),(0.012,L+0.025),(0.007,L+0.03)],12,cap1=True))),M['black'],r)
    mk(P+'__scroll__ribbon',merge_geo(tube([(0.0,0.028+math.cos(TAU*i/24)*0.029,math.sin(TAU*i/24)*0.029) for i in range(25)],0.0035,6,False,False),tube([(0,0.0,0.029),(0.01,-0.0,0.06),(0.02,0.0,0.09)],0.004,6,flat=0.3),tube([(0,0.0,0.029),(-0.012,0,0.055),(-0.018,0,0.08)],0.004,6,flat=0.3)),M['gold'],r)
def build_mask(loc):
    r=empty(P+'__J_mask',loc)
    face=[]
    NU,NV=18,22
    for j in range(NV+1):
        v=j/NV;y=0.02+v*0.2;ring=[]
        w=0.07*(0.55+0.45*math.sin(math.pi*min(1,v*1.15)))+0.012*(v>0.5)
        for i in range(NU+1):
            u=i/NU*2-1;x=u*w;z=0.04*(1-u*u)-0.012*abs(u)**3+0.018*math.exp(-((v-0.45)/0.07)**2)*(1-abs(u))*1.2-0.02*math.exp(-((v-0.62)/0.05)**2)*(abs(u)<0.6)*(1-abs(u))
            ring.append((x,y,z))
        face.append(ring)
    mk(P+'__mask__face',loft(face,False,False,False,us=1,vs=1),M['bone'],r,solid=0.006,sub=1)
    for sx in (-1,1):
        mk(P+'__mask__horn%d'%(sx+1),tube([(sx*0.05,0.19,0.0),(sx*0.075,0.23,-0.005),(sx*0.08,0.27,-0.02),(sx*0.065,0.3,-0.03)],lambda t:0.013*(1-t)+0.002,10),M['bone'],r,sub=1)
        mk(P+'__mask__eye%d'%(sx+1),xform(lathe([(0.0001,0),(0.014,0),(0.0001,0.004)],12,cap0=True,f=lambda a:1+0.4*math.cos(a)),chain(lambda p:V((p.x*1.4,p.y,p.z*0.6)),rotx(math.pi/2),rotz(sx*0.35),tr(sx*0.03,0.145,0.045))),M['brass'],r)
        mk(P+'__mask__brow%d'%(sx+1),tube([(sx*0.012,0.16,0.05),(sx*0.03,0.172,0.047),(sx*0.055,0.168,0.035)],0.004,6),M['black'],r)
    mk(P+'__mask__mouth',merge_geo(xform(plate(0.075,0.02,0.004,curve=0.06,nu=8,nv=1),tr(0,0.07,0.032)),*[box(0.004,0.006,0.002,(x,0.07,0.035)) for x in (-0.024,-0.012,0.0,0.012,0.024)]),M['red'],r)
    mk(P+'__mask__cord',tube([(-0.07,0.13,-0.01),(-0.06,0.1,-0.05),(0,0.1,-0.07),(0.06,0.1,-0.05),(0.07,0.13,-0.01)],0.003,6),M['silk'],r)
def build_bento(loc):
    r=empty(P+'__J_bento',loc)
    mk(P+'__bento__tiers',merge_geo(box(0.07,0.025,0.05,(0,0.026,0)),box(0.07,0.025,0.05,(0,0.078,0))),M['black'],r,bevel=0.005,sharp=40)
    mk(P+'__bento__inner',merge_geo(box(0.072,0.0025,0.052,(0,0.052,0)),box(0.072,0.0025,0.052,(0,0.0015,0))),M['red'],r,bevel=0.001)
    mk(P+'__bento__lid',box(0.073,0.008,0.053,(0,0.108,0)),M['red'],r,bevel=0.004,sharp=40)
    mk(P+'__bento__mon',xform(lathe([(0.0001,0),(0.018,0),(0.018,0.0015),(0.0001,0.0015)],5,cap0=True,cap1=True),tr(0,0.116,0)),M['gold'],r)
    mk(P+'__bento__cord',merge_geo(tube([(0,0.0,0.054),(0,0.06,0.054),(0,0.118,0.03),(0,0.118,-0.03),(0,0.06,-0.054),(0,0,-0.054)],0.004,6,False,False),tube([(-0.074,0,0),(-0.074,0.06,0),(-0.05,0.118,0),(0.05,0.118,0),(0.074,0.06,0),(0.074,0,0)],0.004,6,False,False)),M['silkp'],r)
    mk(P+'__bento__onigiri',merge_geo(xform(lathe([(0.0001,0),(0.02,0),(0.018,0.012),(0.006,0.03),(0.0001,0.031)],3,cap0=True,cap1=True),chain(rotx(-math.pi/2),tr(0.09,0.03,0.03)))),M['rice'],r,sub=2)
    mk(P+'__bento__nori',box(0.012,0.012,0.0105,(0.09,0.012,0.03)),M['nori'],r)
collection('Loot')
build_chest((0,0,0));build_key((0.8,0,0));build_note((1.0,0,0))
for i,f in enumerate((build_gourd,build_flask,build_omamori,build_whetstone,build_censer,build_scroll,build_mask,build_bento)):f((-0.9-0.25*i,0,0.5))
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'niten_loot.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'niten_loot.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=82,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=False,export_tangents=False)
print('exported',os.path.getsize(os.path.join(OUT,'niten_loot.glb')),'verts',sum(len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'))
if '--preview' in sys.argv:
    render_preview(os.path.join(OUT,'preview_chest.png'),target=(0,0.35,0),dist=2.0,yaw=28,pitch=14,res=(900,700),lens=50,samples=24)
    render_preview(os.path.join(OUT,'preview_items.png'),target=(-1.78,0.1,0.5),dist=3.0,yaw=0,pitch=18,res=(1400,500),lens=60,samples=16)
