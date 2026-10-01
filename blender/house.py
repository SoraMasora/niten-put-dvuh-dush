"""«Забытый дом» (v0.9): экстерьер усадьбы, двери, интерьерный кит и мебель (HO), самурай-призрак Мукуро-муся (MU),
тётин-обакэ (TC), мокумокурэн (MK), новые предметы (LT). Текстуры: процедурные (tex.py) + CC0 Poly Haven (fetch_tex.py).
Запуск: python3 blender/house.py [--preview] -> blender/out/niten_house.glb (+ .blend)."""
import sys,os,math,random;HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
import bpy
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
OUT=os.path.join(HERE,'out');os.makedirs(OUT,exist_ok=True)
import tex,fetch_tex
if not os.path.exists(os.path.join(HERE,'tex','tar_n.png')):tex.build()
for i in fetch_tex.IDS:fetch_tex.fetch(i)
bpy.ops.wm.read_factory_settings(use_empty=True)
from lib import *
import lib
TEXD=os.path.join(HERE,'tex')
# ---------------------------------------------------------------- рисованные текстуры (PIL)
def paint_textures():
    R=random.Random(5)
    # фусума: сусальное золото, облака, сосна
    W,H=512,1024;im=Image.new('RGB',(W,H),(196,160,92));d=ImageDraw.Draw(im)
    for i in range(900):
        x,y=R.randint(0,W),R.randint(0,H);s=R.randint(18,40);c=R.randint(-14,14);d.rectangle([x,y,x+s,y+s],fill=(206+c,170+c,96+c//2))
    for k in range(5):
        cy=R.randint(80,H-80);cx=R.randint(-50,W)
        for j in range(7):d.ellipse([cx+j*55-60,cy-28-(j%2)*12,cx+j*55+60,cy+28],fill=(232,206,140))
    # ствол сосны
    pts=[(W*0.15,H),(W*0.25,H*0.75),(W*0.18,H*0.55),(W*0.42,H*0.38),(W*0.7,H*0.33),(W*0.95,H*0.36)]
    for i in range(len(pts)-1):d.line([pts[i],pts[i+1]],fill=(58,40,30),width=int(34-i*5))
    for (x,y) in [(W*0.3,H*0.5),(W*0.5,H*0.36),(W*0.72,H*0.3),(W*0.9,H*0.34),(W*0.2,H*0.68),(W*0.6,H*0.42)]:
        for j in range(26):
            a=R.uniform(0,6.28);r=R.uniform(10,70);d.line([(x,y),(x+math.cos(a)*r,y+math.sin(a)*r*0.45)],fill=(30+R.randint(0,20),70+R.randint(0,30),38),width=3)
    im=im.filter(ImageFilter.GaussianBlur(0.8));im.save(os.path.join(TEXD,'ho_fusuma_c.png'))
    # какэдзику: цветущая слива на шёлке
    W,H=256,768;im=Image.new('RGB',(W,H),(226,214,186));d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,90],fill=(120,92,60));d.rectangle([0,H-110,W,H],fill=(120,92,60));d.rectangle([0,90,14,H-110],fill=(120,92,60));d.rectangle([W-14,90,W,H-110],fill=(120,92,60))
    br=[(40,H-140),(90,520),(70,400),(140,300),(200,210)];
    for i in range(len(br)-1):d.line([br[i],br[i+1]],fill=(50,34,26),width=10-i*2)
    d.line([(90,520),(180,470),(220,430)],fill=(50,34,26),width=4);d.line([(140,300),(80,240)],fill=(50,34,26),width=3)
    for i in range(60):
        t=R.random();j=R.randint(0,len(br)-2);x=br[j][0]+(br[j+1][0]-br[j][0])*t+R.randint(-25,25);y=br[j][1]+(br[j+1][1]-br[j][1])*t+R.randint(-20,20)
        r=R.randint(5,9);d.ellipse([x-r,y-r,x+r,y+r],fill=(232,120+R.randint(0,40),110));d.ellipse([x-2,y-2,x+2,y+2],fill=(200,60,40))
    d.rectangle([W-60,H-190,W-38,H-150],outline=(170,30,24),width=3)
    im.save(os.path.join(TEXD,'ho_kake_c.png'))
    # бёбу: журавли над волнами по золоту
    W,H=1536,512;im=Image.new('RGB',(W,H),(200,164,96));d=ImageDraw.Draw(im)
    for i in range(1600):
        x,y=R.randint(0,W),R.randint(0,H);s=R.randint(20,36);c=R.randint(-12,12);d.rectangle([x,y,x+s,y+s],fill=(208+c,172+c,98+c//2))
    for k in range(9):
        y=H-60-k%3*20;d.arc([k*180-40,y-60,k*180+200,y+60],190,350,fill=(40,70,120),width=8)
    for (x,y,s) in [(300,160,1),(620,110,0.8),(1000,190,1.1),(1300,120,0.7)]:
        d.ellipse([x-40*s,y-14*s,x+40*s,y+14*s],fill=(245,244,238));d.polygon([(x-10*s,y),(x-120*s,y-70*s),(x-30*s,y-8*s)],fill=(240,240,236));d.polygon([(x+10*s,y),(x+120*s,y-70*s),(x+30*s,y-8*s)],fill=(240,240,236))
        d.line([(x+38*s,y-4*s),(x+80*s,y-40*s)],fill=(20,20,20),width=int(6*s));d.ellipse([x+74*s,y-48*s,x+88*s,y-34*s],fill=(200,20,20))
    im.save(os.path.join(TEXD,'ho_byobu_c.png'))
    # знамя с гербом (мон) — три томоэ
    W,H=256,768;im=Image.new('RGB',(W,H),(232,226,212));d=ImageDraw.Draw(im);cx,cy=128,240
    d.ellipse([cx-90,cy-90,cx+90,cy+90],outline=(150,20,18),width=12)
    for k in range(3):
        a=k*2.094;x=cx+math.cos(a)*36;y=cy+math.sin(a)*36;d.ellipse([x-30,y-30,x+30,y+30],fill=(150,20,18))
        d.pieslice([x-46,y-46,x+46,y+46],math.degrees(a)+60,math.degrees(a)+160,fill=(150,20,18))
    for k in range(6):d.rectangle([40,420+k*48,216,440+k*48],fill=(30,26,24))
    im.save(os.path.join(TEXD,'ho_banner_c.png'))
    # бумага фонаря-обакэ: старая, в пятнах, с иероглифом
    W,H=512,256;a=np.array(Image.new('RGB',(W,H),(214,190,150))).astype(float);n=tex.fbm(256,2.0,11)
    n=np.array(Image.fromarray((n*255).astype(np.uint8)).resize((W,H)))/255.0;a*=(0.75+0.35*n[...,None]);im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
    for k in range(8):d.line([(0,k*32),(W,k*32)],fill=(120,90,60),width=2)
    d.rectangle([340,60,400,200],outline=(30,20,18),width=10);d.line([(370,40),(370,220)],fill=(30,20,18),width=10)
    im.save(os.path.join(TEXD,'ho_tcpaper_c.png'))
    # карта Забытого дома (для предмета)
    W,H=512,384;im=Image.new('RGB',(W,H),(214,196,156));d=ImageDraw.Draw(im)
    for (x0,z0,x1,z1) in [(-20,-11,-10,-3),(-20,-3,-10,5),(-10,-11,10,5),(10,-11,20,-3),(10,-3,20,5),(-3.5,-17,3.5,-11),(-10,5,10,15),(-10,15,10,25)]:
        X=lambda x:int(256+x*11);Z=lambda z:int(300-z*11);d.rectangle([X(x0),Z(z1),X(x1),Z(z0)],outline=(60,36,24),width=3)
    d.ellipse([256-24,300-10*11-20,256+24,300-10*11+20],outline=(40,60,110),width=3)
    for k in range(5):d.line([(30,30+k*8),(140,30+k*8)],fill=(80,50,30),width=2)
    d.ellipse([440,30,480,70],outline=(150,30,24),width=4)
    im.save(os.path.join(TEXD,'lt_map_c.png'))
paint_textures()
# ---------------------------------------------------------------- материалы
P='HO'
def phm(name,ph,col=(1,1,1),rough=0.7,dens=1.0,nstr=1.0,coat=0.0,metal=0.0):
    return mat(name,col,rough,metal,tex='ph_%s_c'%ph,ntex='ph_%s_n'%ph,nstr=nstr,dens=dens,coat=coat)
M=dict(
  plaster=phm('ho_plaster','clay_plaster',(1.05,0.98,0.86),0.92,0.5,1.2),
  hinoki=phm('ho_hinoki','hinoki_planks',(1,1,1),0.55,0.45,0.8,coat=0.25),
  cedar=phm('ho_cedar','japanese_cedar_planks',(0.75,0.6,0.5),0.6,0.5,1.0),
  post=phm('ho_post','dark_wood',(0.62,0.44,0.36),0.55,0.8,0.8,coat=0.15),
  tatami=phm('ho_tatami','tatami_mat',(1,1,0.95),0.85,0.55,1.0),
  floor=phm('ho_floor','wood_floor_worn',(0.85,0.7,0.6),0.5,0.45,0.8,coat=0.3),
  stone=phm('ho_stone','japanese_stone_wall',(0.8,0.8,0.82),0.9,0.5,1.4),
  snow=phm('ho_snow','snow_02',(1.0,1.02,1.08),0.75,0.35,1.0),
  gravel=phm('ho_gravel','gravel_floor',(0.85,0.85,0.88),0.95,0.5,1.4),
  shoji=mat('ho_shoji',(1.0,0.95,0.86),0.85,tex='paper_c',ntex='paper_n',dens=2,double=True),
  shojil=mat('ho_shoji_lit',(1.0,0.92,0.78),0.85,tex='paper_c',emis=(1.0,0.66,0.34),es=1.6,dens=2,double=True),
  black=mat('ho_lacq_black',(0.025,0.022,0.02),0.25,coat=0.8,ntex='wood_n',nstr=0.2,dens=2),
  red=mat('ho_lacq_red',(0.42,0.05,0.03),0.3,coat=0.6,ntex='wood_n',nstr=0.2,dens=2),
  vermilion=mat('ho_vermilion',(0.55,0.12,0.05),0.55,tex='wood_c',ntex='wood_n',nstr=0.3,dens=1.0),
  gold=mat('ho_gold',(0.92,0.7,0.32),0.3,1.0,ntex='metal_n',nstr=0.4,dens=6),
  brass=mat('ho_brass',(0.75,0.55,0.26),0.35,1.0,ntex='metal_n',nstr=0.4,dens=6),
  iron=mat('ho_iron',(0.06,0.06,0.065),0.55,0.9,ntex='metal_n',nstr=0.8,dens=4),
  kawara=mat('ho_kawara',(0.08,0.085,0.095),0.45,0.15,ntex='metal_n',nstr=0.3,dens=2),
  cloth=mat('ho_redcloth',(0.42,0.03,0.04),0.75,tex='cloth_c',ntex='cloth_n',nstr=0.8,dens=6,double=True),
  purple=mat('ho_purplecloth',(0.22,0.06,0.3),0.7,tex='cloth_c',ntex='cloth_n',dens=8),
  white=mat('ho_whitecloth',(0.8,0.78,0.72),0.85,tex='cloth_c',ntex='cloth_n',dens=8),
  glass=mat('ho_glass',(0.6,0.7,0.75),0.05,alpha=0.18,double=True),
  amber=mat('ho_amber',(0.9,0.55,0.2),0.1,emis=(1.0,0.6,0.25),es=3.0,alpha=0.85),
  lamp=mat('ho_lamp_paper',(1.0,0.9,0.7),0.8,tex='paper_c',emis=(1.0,0.62,0.3),es=3.5,dens=3,double=True),
  lampred=mat('ho_lamp_red',(0.8,0.15,0.08),0.8,tex='paper_c',emis=(1.0,0.25,0.1),es=2.8,dens=3,double=True),
  water=mat('ho_water',(0.02,0.03,0.04),0.04,0.0,ntex='stone_n',nstr=0.15,coat=1.0,dens=0.6),
  koi=mat('ho_koi',(0.95,0.4,0.1),0.35,coat=0.6,dens=8),
  koiw=mat('ho_koi_white',(0.95,0.93,0.9),0.35,coat=0.6,dens=8),
  bark=mat('ho_bark',(0.28,0.22,0.18),0.95,tex='wood_c',ntex='wood_n',nstr=2.0,dens=2.5),
  leaf=mat('ho_leaf_gold',(0.95,0.68,0.18),0.7,emis=(0.35,0.2,0.02),es=0.8,double=True,ntex='paper_n',dens=3),
  rock=mat('ho_rock',(0.38,0.38,0.4),0.9,tex='stone_c',ntex='stone_n',nstr=1.8,dens=1.2),
  clay=mat('ho_clay',(0.55,0.42,0.32),0.95,tex='plaster_c',ntex='plaster_n',nstr=1.5,dens=1.2),
  ember=mat('ho_ember',(0.15,0.04,0.02),0.9,tex='stone_c',emis=(1.0,0.3,0.06),es=3.0,dens=3),
  ash=mat('ho_ash',(0.35,0.33,0.31),0.98,tex='stone_c',dens=4),
  straw=mat('ho_straw',(0.82,0.7,0.48),0.95,tex='straw_c',ntex='straw_n',nstr=1.4,dens=4),
  rope=mat('ho_rope',(0.62,0.52,0.36),0.95,tex='straw_c',ntex='straw_n',dens=30),
  paper=mat('ho_paper',(0.93,0.9,0.82),0.85,tex='paper_c',ntex='paper_n',dens=3,double=True),
  steel=mat('ho_steel',(0.75,0.77,0.8),0.2,1.0,ntex='metal_n',nstr=0.3,dens=4),
  fusuma=mat('ho_fusuma',(1,1,1),0.6,tex='ho_fusuma_c',dens=1.0),
  kake=mat('ho_kake',(1,1,1),0.8,tex='ho_kake_c',dens=1.0,double=True),
  byobu=mat('ho_byobu',(1,1,1),0.55,tex='ho_byobu_c',dens=1.0,double=True),
  banner=mat('ho_banner',(1,1,1),0.85,tex='ho_banner_c',dens=1.0,double=True),
  ink=mat('ho_ink',(0.02,0.02,0.02),0.3,coat=0.5,dens=4),
  flame=mat('ho_flame',(1.0,0.6,0.2),0.5,emis=(1.0,0.55,0.15),es=8.0),
  book=[mat('ho_book%d'%i,c,0.8,tex='cloth_c',dens=6) for i,c in enumerate([(0.3,0.08,0.06),(0.12,0.16,0.28),(0.18,0.22,0.12),(0.42,0.32,0.18),(0.1,0.1,0.1)])],
)
def quad(w,h,c=(0,0,0),uv=(0,0,1,1),axis='z',flip=False):
    """Плоский четырёхугольник с UV 0..1 (для рисованных текстур). axis — нормаль."""
    cx,cy,cz=c;u0,v0,u1,v1=uv
    if axis=='z':vs=[(cx-w/2,cy-h/2,cz),(cx+w/2,cy-h/2,cz),(cx+w/2,cy+h/2,cz),(cx-w/2,cy+h/2,cz)]
    elif axis=='y':vs=[(cx-w/2,cy,cz+h/2),(cx+w/2,cy,cz+h/2),(cx+w/2,cy,cz-h/2),(cx-w/2,cy,cz-h/2)]
    else:vs=[(cx,cy-h/2,cz+w/2),(cx,cy-h/2,cz-w/2),(cx,cy+h/2,cz-w/2),(cx,cy+h/2,cz+w/2)]
    f=[(0,1,2,3)] if not flip else [(3,2,1,0)];uv_=[[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]]
    if flip:uv_=[uv_[0][::-1]]
    return vs,f,uv_
def J(name,loc,parent=None):return empty(P+'__J_'+name,loc,parent)
def nm(part,det):return P+'__'+part+'__'+det
def bx(*a,**k):return box(*a,**k)
import env
tile_roof_loft=env.tile_roof_loft
# ================================================================ ЭКСТЕРЬЕР
def build_ext(loc):
    r=J('ext',loc);W=9.0;D=5.0;y0=0.62;H1=3.7
    mk(nm('ext','base'),merge_geo(bx(W+0.5,0.31,D+0.5,(0,0.31,0)),bx(2.6,0.12,0.9,(0,0.12,D+1.3)),bx(2.0,0.12,0.5,(0,0.36,D+0.95))),M['stone'],r,bevel=0.03,sharp=40)
    mk(nm('ext','deck'),merge_geo(bx(W+0.3,0.05,0.7,(0,y0+0.02,D+0.35)),bx(W,0.05,D,(0,y0,0))),M['hinoki'],r,sharp=40)
    xs=[-W+i*2*W/10 for i in range(11)];pst=[]
    for x in xs:
        for z in (D,-D):pst.append(bx(0.12,H1/2,0.12,(x,y0+H1/2,z)))
    for z in [-D+i*2*D/5 for i in range(1,5)]:
        for x in (-W,W):pst.append(bx(0.12,H1/2,0.12,(x,y0+H1/2,z)))
    for x in xs:pst.append(bx(0.09,0.3,0.09,(x,y0-0.3+0.02,D+0.62)))
    mk(nm('ext','posts'),merge_geo(*pst),M['post'],r,bevel=0.012,sharp=40)
    bm=[bx(W+0.1,0.1,0.13,(0,y0+H1,D)),bx(W+0.1,0.1,0.13,(0,y0+H1,-D)),bx(0.13,0.1,D,(W,y0+H1,0)),bx(0.13,0.1,D,(-W,y0+H1,0)),
        bx(W,0.05,0.08,(0,y0+2.65,D+0.04)),bx(W,0.06,0.07,(0,y0+0.32,D+0.05))]
    mk(nm('ext','beams'),merge_geo(*bm),M['post'],r,bevel=0.01,sharp=40)
    walls=[bx(W,H1/2,0.06,(0,y0+H1/2,-D)),bx(0.06,H1/2,D,(W,y0+H1/2,0)),bx(0.06,H1/2,D,(-W,y0+H1/2,0))]
    mk(nm('ext','walls'),merge_geo(*walls),M['plaster'],r)
    kick=[bx(W,0.16,0.05,(0,y0+0.16,D))]
    mk(nm('ext','kick'),merge_geo(*kick),M['cedar'],r)
    # фасад: сёдзи между столбами, центр — вход
    lat=[];pap=[];top=[]
    for i in range(10):
        x0,x1=xs[i]+0.12,xs[i+1]-0.12;cx=(x0+x1)/2;w=(x1-x0)/2
        top.append(bx(w,0.5,0.04,(cx,y0+3.15,D)))
        if abs(cx)<1.0:continue
        pap.append(bx(w,1.0,0.01,(cx,y0+1.3,D+0.02)))
        for k in range(5):lat.append(bx(0.015,1.0,0.02,(x0+(k+0.5)*(x1-x0)/5,y0+1.3,D+0.035)))
        for k in range(7):lat.append(bx(w,0.015,0.02,(cx,y0+0.32+k*0.33,D+0.035)))
        lat.append(bx(w,0.03,0.03,(cx,y0+2.32,D+0.04)))
    mk(nm('ext','lattice'),merge_geo(*lat),M['post'],r,sharp=40)
    mk(nm('ext','shoji'),merge_geo(*pap),M['shojil'],r)
    mk(nm('ext','transom'),merge_geo(*top),M['plaster'],r)
    # проём двери
    mk(nm('ext','doorframe'),merge_geo(bx(1.32,0.08,0.1,(0,y0+2.5,D+0.05)),bx(0.08,1.25,0.1,(-1.3,y0+1.25,D+0.05)),bx(0.08,1.25,0.1,(1.3,y0+1.25,D+0.05)),bx(1.32,0.04,0.12,(0,y0+0.02,D+0.05))),M['black'],r,bevel=0.01,sharp=40)
    mk(nm('ext','doordark'),bx(1.22,1.22,0.02,(0,y0+1.24,D-0.25)),M['ink'],r)
    # навес над входом (карахафу)
    for sx in (-1,1):mk(nm('ext','porchpost%d'%(sx+1)),bx(0.11,1.6,0.11,(sx*1.9,y0+1.6,D+1.6)),M['vermilion'],r,bevel=0.01)
    mk(nm('ext','porchbeam'),merge_geo(bx(2.2,0.12,0.13,(0,y0+3.2,D+1.6)),bx(0.12,0.12,0.9,(1.9,y0+3.2,D+0.85)),bx(0.12,0.12,0.9,(-1.9,y0+3.2,D+0.85))),M['vermilion'],r,bevel=0.01)
    prof=[(-1.6,4.05),(-1.0,4.35),(-0.45,4.58),(0.0,4.68),(0.45,4.58),(1.0,4.35),(1.6,4.05)]
    pr=tile_roof_loft(-1.2,1.2,[(z,y) for z,y in prof],pitch=0.24,amp=0.03,sori=0.2,thick=0.1)
    pr=xform(pr,chain(roty(math.pi/2),tr(0,0,D+1.4)))
    mk(nm('ext','porchroof'),pr,M['kawara'],r,sharp=55)
    gab=merge_geo(*[loft([[(x,y+0.0,D+2.62+dz) for x,y in ((-1.6,3.95),(0.0,4.6),(1.6,3.95))] for dz in (-0.04,0.04)],False,True,True)])
    mk(nm('ext','porchgable'),merge_geo(gab,tube([(-1.7,3.9,D+2.66),(-0.9,4.42,D+2.66),(0,4.62,D+2.66),(0.9,4.42,D+2.66),(1.7,3.9,D+2.66)],0.06,5)),M['gold'],r)
    # основная кровля (вальмовая: перед/зад + торцы)
    prof=[(D+2.0,y0+H1+0.05),(D+1.0,y0+H1+0.45),(D-0.6,y0+H1+1.1),(D-2.2,y0+H1+1.75),(-D+2.2,y0+H1+1.75),(-D+0.6,y0+H1+1.1),(-D-1.0,y0+H1+0.45),(-D-2.0,y0+H1+0.05)]
    mk(nm('ext','roof'),tile_roof_loft(-W-1.2,W+1.2,prof,pitch=0.3,amp=0.045,sori=0.35,thick=0.22),M['kawara'],r,sharp=55)
    side=[(D+1.6,y0+H1+0.05),(D+0.6,y0+H1+0.5),(D-0.8,y0+H1+1.2),(-D+0.8,y0+H1+1.2),(-D-0.6,y0+H1+0.5),(-D-1.6,y0+H1+0.05)]
    for sx in (-1,1):
        g=tile_roof_loft(-D-1.2,D+1.2,[(z,y) for z,y in [(W+2.0,y0+H1+0.05),(W+1.0,y0+H1+0.45),(W-0.6,y0+H1+1.1),(W-2.0,y0+H1+1.7)]],pitch=0.3,amp=0.045,sori=0.2,thick=0.22)
        g=xform(g,(lambda s:lambda p:V((s*p.z,p.y,p.x)))(sx))
        mk(nm('ext','roofside%d'%(sx+1)),g,M['kawara'],r,sharp=55)
    # верхний этаж
    W2,D2,yb=6.0,3.0,y0+H1+1.0;H2=2.6
    mk(nm('ext','upwalls'),merge_geo(bx(W2,H2/2,D2,(0,yb+H2/2,0))),M['plaster'],r)
    up=[];upp=[]
    for i in range(12):
        x=-W2+0.5+i*(2*W2-1.0)/11;up.append(bx(0.1,H2/2,0.1,(x,yb+H2/2,D2+0.02)))
        if i<11:
            cx=x+(2*W2-1.0)/22;upp.append(bx((2*W2-1.0)/22-0.12,0.55,0.01,(cx,yb+1.35,D2+0.03)))
            for k in range(4):up.append(bx(0.012,0.55,0.015,(cx-0.3+k*0.2,yb+1.35,D2+0.045)))
            for k in range(4):up.append(bx((2*W2-1.0)/22-0.12,0.012,0.015,(cx,yb+0.9+k*0.3,D2+0.045)))
    up+= [bx(W2+0.1,0.09,0.12,(0,yb+H2,D2)),bx(W2+0.1,0.06,0.1,(0,yb+0.75,D2+0.03))]
    mk(nm('ext','upframe'),merge_geo(*up),M['post'],r,sharp=40)
    mk(nm('ext','upshoji'),merge_geo(*upp),M['shojil'],r)
    rl=[bx(W2+0.4,0.04,0.04,(0,yb+0.95,D2+0.75)),bx(W2+0.4,0.05,0.4,(0,yb+0.05,D2+0.4))]
    for i in range(14):rl.append(bx(0.035,0.48,0.035,(-W2-0.3+i*(2*W2+0.6)/13,yb+0.5,D2+0.75)))
    mk(nm('ext','uprail'),merge_geo(*rl),M['vermilion'],r,sharp=40)
    prof=[(D2+1.9,yb+H2+0.05),(D2+0.9,yb+H2+0.55),(D2-0.6,yb+H2+1.2),(1.0,yb+H2+1.95),(0,yb+H2+2.1),(-1.0,yb+H2+1.95),(-D2+0.6,yb+H2+1.2),(-D2-0.9,yb+H2+0.55),(-D2-1.9,yb+H2+0.05)]
    mk(nm('ext','uproof'),tile_roof_loft(-W2-1.8,W2+1.8,prof,pitch=0.3,amp=0.045,sori=0.45,thick=0.22),M['kawara'],r,sharp=55)
    mk(nm('ext','ridge'),merge_geo(bx(W2+1.9,0.18,0.18,(0,yb+H2+2.22,0)),bx(0.14,0.45,0.28,(W2+1.85,yb+H2+2.42,0)),bx(0.14,0.45,0.28,(-W2-1.85,yb+H2+2.42,0))),M['kawara'],r,bevel=0.02,sharp=40)
    gb=[]
    for sx in (-1,1):
        x=sx*(W2+0.6);gb.append(loft([[(x+dx,y,z) for z,y in ((D2+0.3,yb+H2+0.6),(0,yb+H2+2.05),(-D2-0.3,yb+H2+0.6))] for dx in (-0.05,0.05)],False,True,True))
    mk(nm('ext','gable'),merge_geo(*gb),M['plaster'],r)
    mk(nm('ext','shachi'),merge_geo(*[tube([(sx*(W2+1.85),yb+H2+2.6,0),(sx*(W2+1.95),yb+H2+2.95,0.05),(sx*(W2+1.8),yb+H2+3.2,0.18)],lambda t:0.12*(1-0.7*t),8) for sx in(-1,1)]),M['gold'],r,sub=1)
    # фонари на входе
    for sx in (-1,1):lantern_geo(r,nm('ext','lant%d'%(sx+1)),(sx*1.9,y0+2.75,D+2.0),M['lampred'])
def lantern_geo(parent,name,c,lm,s=1.0):
    x,y,z=c;rib=[]
    prof=[(0.07*s,-0.22*s),(0.15*s,-0.16*s),(0.19*s,-0.05*s),(0.19*s,0.05*s),(0.15*s,0.16*s),(0.07*s,0.22*s)]
    mk(name+'paper',lathe(prof,16,c=c),lm,parent)
    for k in range(7):
        yy=-0.18+k*0.06;rr=0.19*math.cos(yy/0.25*1.2)+0.005
        rib.append(lathe([(rr*s,yy*s-0.004),(rr*s+0.004,yy*s),(rr*s,yy*s+0.004)],16,c=c))
    mk(name+'ribs',merge_geo(*rib),M['ink'],parent)
    mk(name+'caps',merge_geo(lathe([(0.0001,0.22*s),(0.08*s,0.22*s),(0.08*s,0.26*s),(0.0001,0.26*s)],12,c=c,cap0=True,cap1=True),lathe([(0.0001,-0.26*s),(0.08*s,-0.26*s),(0.08*s,-0.22*s),(0.0001,-0.22*s)],12,c=c,cap0=True,cap1=True),tube([(x,y+0.26*s,z),(x,y+0.6*s,z)],0.006,5)),M['black'],parent)
def build_extdoor(loc,side):
    r=J('extdoor'+side,loc);w=0.62;h=1.24
    fr=[bx(w,0.035,0.035,(0,h*2-0.035,0)),bx(w,0.05,0.035,(0,0.05,0)),bx(0.035,h,0.035,(-w+0.035,h,0)),bx(0.035,h,0.035,(w-0.035,h,0))]
    for k in range(1,6):fr.append(bx(0.012,h-0.05,0.02,(-w+k*2*w/6,h,0.005)))
    for k in range(1,12):fr.append(bx(w-0.03,0.012,0.02,(0,0.4+k*0.17,0.005)))
    mk(nm('extdoor'+side,'frame'),merge_geo(*fr),M['post'],r,sharp=40)
    mk(nm('extdoor'+side,'panel'),bx(w-0.03,0.18,0.012,(0,0.24,0)),M['cedar'],r)
    mk(nm('extdoor'+side,'paper'),bx(w-0.04,h-0.3,0.004,(0,h+0.2,-0.008)),M['shojil'],r)
    mk(nm('extdoor'+side,'pull'),xform(lathe([(0.025,0),(0.025,0.01),(0.0001,0.01)],12,cap1=True),chain(rotx(math.pi/2),tr((-1 if side=='R' else 1)*(w-0.15),1.1,0.03))),M['brass'],r)
# ================================================================ ИНТЕРЬЕР
def build_shoji(loc,name='shoji',lit=False):
    r=J(name,loc);w=0.45;h=2.0
    fr=[bx(w,0.025,0.02,(0,h-0.025,0)),bx(w,0.03,0.02,(0,0.27,0)),bx(0.025,h/2,0.02,(-w+0.025,h/2,0)),bx(0.025,h/2,0.02,(w-0.025,h/2,0))]
    for k in range(1,4):fr.append(bx(0.008,(h-0.3)/2,0.012,(-w+k*2*w/4,0.3+(h-0.3)/2,0)))
    for k in range(1,8):fr.append(bx(w-0.02,0.008,0.012,(0,0.3+k*(h-0.3)/8,0)))
    mk(nm(name,'frame'),merge_geo(*fr),M['post'],r,sharp=40)
    mk(nm(name,'kick'),bx(w-0.02,0.12,0.012,(0,0.14,0)),M['cedar'],r)
    mk(nm(name,'paper'),bx(w-0.02,(h-0.3)/2,0.003,(0,0.3+(h-0.3)/2,-0.006)),M['shojil' if lit else 'shoji'],r)
def build_fusuma(loc):
    r=J('fusuma',loc);w=0.45;h=2.0
    mk(nm('fusuma','frame'),merge_geo(bx(w,0.02,0.022,(0,h-0.02,0)),bx(w,0.02,0.022,(0,0.02,0)),bx(0.018,h/2,0.022,(-w+0.018,h/2,0)),bx(0.018,h/2,0.022,(w-0.018,h/2,0))),M['black'],r,bevel=0.004,sharp=40)
    mk(nm('fusuma','paint'),merge_geo(quad(2*w-0.03,h-0.04,(0,h/2,0.012),(0,0,1,1)),quad(2*w-0.03,h-0.04,(0,h/2,-0.012),(1,0,0,1),flip=True)),M['fusuma'],r)
    mk(nm('fusuma','hikite'),merge_geo(*[xform(lathe([(0.028,0),(0.028,0.006),(0.018,0.006),(0.018,0.002),(0.0001,0.002)],16,cap1=True),chain(rotx(s*math.pi/2),tr(w-0.12,1.0,s*0.012))) for s in (1,-1)]),M['brass'],r)
def build_ramma(loc):
    r=J('ramma',loc);w=0.9;h=0.22;g=[bx(w,0.02,0.03,(0,0.02,0)),bx(w,0.02,0.03,(0,2*h-0.02,0)),bx(0.02,h,0.03,(-w+0.02,h,0)),bx(0.02,h,0.03,(w-0.02,h,0))]
    n=9
    for i in range(n):
        x0=-w+0.04+i*(2*w-0.08)/n;x1=x0+(2*w-0.08)/n;cx=(x0+x1)/2
        g.append(xform(bx(0.008,h*1.15,0.012),chain(rotz(0.62),tr(cx,h,0))));g.append(xform(bx(0.008,h*1.15,0.012),chain(rotz(-0.62),tr(cx,h,0))))
        g.append(bx(0.006,h-0.03,0.012,(x0,h,0)))
    mk(nm('ramma','lattice'),merge_geo(*g),M['post'],r,sharp=40)
    mk(nm('ramma','back'),bx(w-0.03,h-0.03,0.002,(0,h,-0.01)),M['shoji'],r)
def build_andon(loc):
    r=J('andon',loc)
    lg=[bx(0.018,0.32,0.018,(sx*0.17,0.32,sz*0.17)) for sx in(-1,1) for sz in(-1,1)]
    lg+=[bx(0.19,0.012,0.012,(0,y,sz*0.17)) for y in (0.08,0.36,0.62) for sz in(-1,1)]+[bx(0.012,0.012,0.19,(sx*0.17,y,0)) for y in (0.08,0.36,0.62) for sx in(-1,1)]
    lg.append(bx(0.012,0.1,0.012,(0,0.7,0)));lg.append(bx(0.21,0.012,0.012,(0,0.78,0)))
    mk(nm('andon','frame'),merge_geo(*lg),M['black'],r,sharp=40)
    mk(nm('andon','paper'),merge_geo(bx(0.16,0.13,0.16,(0,0.49,0))),M['lamp'],r)
    mk(nm('andon','flame'),lathe([(0.0001,0.3),(0.012,0.32),(0.0001,0.36)],8,cap0=True),M['flame'],r)
def build_lantern(loc):
    r=J('lantern',loc);lantern_geo(r,nm('lantern',''),(0,0,0),M['lamp'],1.0)
    mk(nm('lantern','band'),lathe([(0.191,-0.02),(0.191,0.05)],16),M['lampred'],r)
def build_pendant(loc):
    r=J('pendant',loc)
    mk(nm('pendant','cord'),tube([(0,0,0),(0,-1.2,0)],0.004,5),M['ink'],r)
    mk(nm('pendant','cap'),lathe([(0.0001,-1.2),(0.03,-1.2),(0.045,-1.26),(0.045,-1.28),(0.0001,-1.28)],16,cap0=True,cap1=True),M['brass'],r)
    mk(nm('pendant','glass'),lathe([(0.04,-1.28),(0.07,-1.34),(0.13,-1.48),(0.14,-1.56),(0.11,-1.6),(0.0001,-1.6)],20,cap1=True),M['amber'],r)
def build_armorcase(loc):
    r=J('armorcase',loc);W,D=0.5,0.45
    mk(nm('armorcase','base'),merge_geo(bx(W,0.24,D,(0,0.24,0)),bx(W+0.04,0.03,D+0.04,(0,0.03,0)),bx(W+0.02,0.02,D+0.02,(0,0.49,0))),M['black'],r,bevel=0.01,sharp=40)
    vents=[bx(0.012,0.12,0.004,(x,0.25,D+0.002)) for x in [-0.3+i*0.05 for i in range(13)]]
    mk(nm('armorcase','vents'),merge_geo(*vents),M['iron'],r)
    mk(nm('armorcase','glass'),bx(W-0.02,1.0,D-0.02,(0,1.5,0)),M['glass'],r)
    ed=[bx(0.012,1.0,0.012,(sx*(W-0.02),1.5,sz*(D-0.02))) for sx in(-1,1) for sz in(-1,1)]+[bx(W,0.015,D,(0,2.51,0))]
    mk(nm('armorcase','edges'),merge_geo(*ed),M['black'],r)
    mk(nm('armorcase','light'),bx(W-0.08,0.008,D-0.08,(0,2.49,0)),M['lamp'],r)
    mk(nm('armorcase','stand'),merge_geo(bx(0.02,0.5,0.02,(0,1.0,-0.15)),bx(0.25,0.015,0.015,(0,1.45,-0.15))),M['post'],r)
def build_byobu(loc):
    r=J('byobu',loc);n=6;w=0.5;h=1.6;g=[];fr=[]
    for i in range(n):
        a=0.35*(1 if i%2 else -1);x0=-n*w*0.9/2+i*w*0.9
        z=0.0 if i%2==0 else w*math.sin(0.35)*0.8
        pts=[(x0,0.05,0),(x0+w*0.9,0.05,0)]
        u0,u1=i/n,(i+1)/n
        zz=(0.0,0.14) if i%2==0 else (0.14,0.0)
        vs=[(x0,0.06,zz[0]),(x0+w*0.9,0.06,zz[1]),(x0+w*0.9,h,zz[1]),(x0,h,zz[0])]
        g.append((vs,[(0,1,2,3)],[[(u0,0),(u1,0),(u1,1),(u0,1)]]))
        g.append((vs,[(3,2,1,0)],[[(u0,1),(u1,1),(u1,0),(u0,0)]]))
        fr.append(tube([(x0,0.0,zz[0]),(x0,h+0.02,zz[0])],0.015,4))
        fr.append(tube([(x0,h+0.01,zz[0]),(x0+w*0.9,h+0.01,zz[1])],0.012,4));fr.append(tube([(x0,0.06,zz[0]),(x0+w*0.9,0.06,zz[1])],0.012,4))
    fr.append(tube([(n*w*0.9/2,0.0,0.0),(n*w*0.9/2,h+0.02,0.0)],0.015,4))
    mk(nm('byobu','paint'),merge_geo(*g),M['byobu'],r)
    mk(nm('byobu','frame'),merge_geo(*fr),M['black'],r)
def build_tansu(loc):
    r=J('tansu',loc);W,H,D=0.6,0.55,0.22
    mk(nm('tansu','body'),bx(W,H,D,(0,H,0)),M['post'],r,bevel=0.008,sharp=40)
    fr=[];hd=[]
    rows=[(0.12,2),(0.36,2),(0.62,1),(0.86,1)]
    for y,n in rows:
        for i in range(n):
            w=(2*W-0.06)/n/2-0.01;cx=-W+0.03+(2*i+1)*(2*W-0.06)/n/2
            fr.append(bx(w,0.1,0.01,(cx,y,D+0.006)));hd.append(tube([(cx-0.06,y+0.02,D+0.02),(cx-0.04,y-0.02,D+0.03),(cx+0.04,y-0.02,D+0.03),(cx+0.06,y+0.02,D+0.02)],0.005,5,False,False))
            hd.append(bx(0.035,0.035,0.004,(cx,y+0.03,D+0.017)))
    for sx in(-1,1):
        for y in (0.02,2*H-0.02):hd.append(bx(0.05,0.02,0.05,(sx*(W-0.03),y,D-0.03)))
    mk(nm('tansu','drawers'),merge_geo(*fr),M['cedar'],r,bevel=0.004)
    mk(nm('tansu','iron'),merge_geo(*hd),M['iron'],r)
def build_desk(loc):
    r=J('desk',loc)
    mk(nm('desk','body'),merge_geo(bx(0.6,0.02,0.28,(0,0.32,0)),bx(0.03,0.15,0.26,(-0.55,0.15,0)),bx(0.03,0.15,0.26,(0.55,0.15,0)),bx(0.53,0.02,0.04,(0,0.03,-0.22))),M['black'],r,bevel=0.005,sharp=40)
    mk(nm('desk','inkstone'),merge_geo(bx(0.07,0.012,0.1,(-0.35,0.352,0.02)),bx(0.05,0.004,0.03,(-0.35,0.366,-0.04))),M['ink'],r,bevel=0.004)
    mk(nm('desk','papers'),merge_geo(*[xform(bx(0.16,0.002,0.11,(0,0,0)),chain(roty(0.15*i-0.2),tr(0.05+i*0.03,0.343+i*0.003,0.0))) for i in range(4)]),M['paper'],r)
    mk(nm('desk','brush'),merge_geo(tube([(-0.2,0.35,0.12),(0.0,0.35,0.16)],0.005,6),tube([(-0.2,0.35,0.12),(-0.24,0.35,0.11)],lambda t:0.006*(1-0.9*t),6)),M['post'],r)
    mk(nm('desk','candle'),merge_geo(lathe([(0.04,0.34),(0.04,0.35),(0.012,0.36),(0.012,0.5),(0.03,0.5),(0.03,0.51),(0.0001,0.51)],10,c=(0.45,0,-0.12),cap1=True)),M['brass'],r)
    mk(nm('desk','wax'),lathe([(0.012,0.51),(0.012,0.58),(0.0001,0.58)],10,c=(0.45,0,-0.12),cap1=True),M['white'],r)
    mk(nm('desk','flame'),lathe([(0.0001,0.585),(0.008,0.6),(0.0001,0.635)],8,c=(0.45,0,-0.12),cap0=True),M['flame'],r)
def build_shelf(loc):
    r=J('shelf',loc);W,H,D=0.9,1.0,0.2;R_=random.Random(3)
    sh=[bx(0.02,H,D,(-W,H,0)),bx(0.02,H,D,(W,H,0)),bx(W,0.01,0.005,(0,H,-D))]+[bx(W,0.015,D,(0,y,0)) for y in (0.02,0.5,0.98,1.46,1.98)]
    mk(nm('shelf','frame'),merge_geo(*sh),M['post'],r,bevel=0.004,sharp=40)
    bk=[[] for _ in M['book']];sc=[]
    for y in (0.035,0.515,0.995,1.475):
        x=-W+0.04
        while x<W-0.1:
            if R_.random()<0.18:
                n=R_.randint(2,4)
                for k in range(n):sc.append(xform(lathe([(0.025,0),(0.025,0.3)],8,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(x+0.15,y+0.025+k*0.05,R_.uniform(-0.05,0.05)))))
                x+=0.34;continue
            w=R_.uniform(0.012,0.03);h=R_.uniform(0.16,0.3);d=R_.uniform(0.12,0.17)
            lean=R_.uniform(-0.08,0.08) if R_.random()<0.2 else 0
            bk[R_.randrange(len(bk))].append(xform(bx(w,h/2,d),chain(rotz(lean),tr(x+w,y+h/2,0.0))));x+=2*w+0.004
    for i,b in enumerate(bk):
        if b:mk(nm('shelf','books%d'%i),merge_geo(*b),M['book'][i],r)
    mk(nm('shelf','scrolls'),merge_geo(*sc),M['paper'],r)
def build_futon(loc):
    r=J('futon',loc)
    mk(nm('futon','mat'),bx(0.5,0.05,1.0,(0,0.05,0)),M['white'],r,bevel=0.03)
    cov=[];N=12
    rings=[[(x,0.12+0.03*math.cos(x*3)+0.02*math.sin(z*4),z) for x in [-0.55+1.1*i/N for i in range(N+1)]] for z in [-0.95+1.5*j/10 for j in range(11)]]
    for rr in rings:rr[0]=(rr[0][0],0.04,rr[0][2]);rr[-1]=(rr[-1][0],0.04,rr[-1][2])
    mk(nm('futon','cover'),loft(rings,False,False,False),M['purple'],r,solid=0.03)
    mk(nm('futon','pillow'),xform(lathe([(0.06,0),(0.06,0.4)],12,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(0.2,0.14,0.8))),M['white'],r,sub=1)
def build_zabuton(loc):
    r=J('zabuton',loc);mk(nm('zabuton','cushion'),bx(0.27,0.04,0.27,(0,0.04,0)),M['cloth'],r,bevel=0.03,sub=1)
def build_table(loc):
    r=J('table',loc)
    mk(nm('table','top'),bx(0.6,0.025,0.4,(0,0.33,0)),M['red'],r,bevel=0.008)
    mk(nm('table','legs'),merge_geo(*[bx(0.03,0.15,0.03,(sx*0.52,0.15,sz*0.33)) for sx in(-1,1) for sz in(-1,1)]),M['black'],r)
    mk(nm('table','cups'),merge_geo(*[lathe([(0.0001,0.355),(0.03,0.355),(0.035,0.4),(0.03,0.4)],12,c=(x,0,0.1),cap0=True) for x in(-0.2,0.15)],lathe([(0.0001,0.355),(0.05,0.355),(0.07,0.42),(0.04,0.5),(0.03,0.5)],14,c=(0,0,-0.1),cap0=True)),M['koiw'],r)
def build_kamado(loc):
    r=J('kamado',loc);W,D,H=0.9,0.42,0.38
    mk(nm('kamado','body'),bx(W,H,D,(0,H,0)),M['clay'],r,bevel=0.06,disp=lambda p,n:0.01*fbm3(p,4,3))
    mk(nm('kamado','mouths'),merge_geo(*[bx(0.13,0.1,0.01,(sx*0.45,0.25,D+0.002)) for sx in(-1,1)]),M['ember'],r)
    for sx in(-1,1):
        mk(nm('kamado','pot%d'%(sx+1)),lathe([(0.24,0.7),(0.27,0.78),(0.28,0.88),(0.26,0.92),(0.3,0.93),(0.0001,0.93)],18,c=(sx*0.45,0,0)),M['iron'],r)
        mk(nm('kamado','lid%d'%(sx+1)),merge_geo(lathe([(0.0001,0.95),(0.27,0.95),(0.27,0.97),(0.0001,0.97)],18,c=(sx*0.45,0,0),cap0=True,cap1=True),bx(0.12,0.025,0.025,(sx*0.45,0.99,0))),M['cedar'],r)
def build_irori(loc):
    r=J('irori',loc)
    mk(nm('irori','frame'),merge_geo(bx(0.6,0.04,0.06,(0,0.04,0.54)),bx(0.6,0.04,0.06,(0,0.04,-0.54)),bx(0.06,0.04,0.6,(0.54,0.04,0)),bx(0.06,0.04,0.6,(-0.54,0.04,0))),M['post'],r,bevel=0.008)
    mk(nm('irori','ash'),bx(0.48,0.01,0.48,(0,0.015,0)),M['ash'],r,disp=lambda p,n:0.01*fbm3(p,6,2))
    mk(nm('irori','embers'),merge_geo(*[xform(bx(0.12,0.025,0.03),chain(roty(a),tr(math.cos(a)*0.06,0.04,math.sin(a)*0.06))) for a in (0,1.2,2.3,3.5,4.6)]),M['ember'],r,bevel=0.01)
    mk(nm('irori','hook'),merge_geo(tube([(0,0.75,0),(0,2.6,0)],0.022,8),tube([(0,0.75,0),(0,0.66,0),(0.03,0.62,0)],0.006,5)),M['post'],r)
    mk(nm('irori','kettle'),merge_geo(lathe([(0.0001,0.42),(0.1,0.43),(0.13,0.5),(0.12,0.58),(0.05,0.62),(0.05,0.64),(0.0001,0.64)],18,cap1=True),tube([(-0.1,0.6,0),(-0.08,0.7,0),(0.08,0.7,0),(0.1,0.6,0)],0.006,5,False,False),tube([(0.12,0.52,0),(0.2,0.56,0)],lambda t:0.02*(1-0.5*t),6)),M['iron'],r)
def build_crate(loc):
    r=J('crate',loc);s=0.3;mk(nm('crate','box'),bx(s,s,s,(0,s,0)),M['cedar'],r,bevel=0.01)
    mk(nm('crate','slats'),merge_geo(*[bx(s+0.006,0.03,s+0.006,(0,y,0)) for y in (0.06,s*2-0.06)],*[bx(0.03,s,s+0.008,(x,s,0)) for x in (-s+0.04,s-0.04)]),M['post'],r)
def build_tawara(loc):
    r=J('tawara',loc);mk(nm('tawara','bag'),xform(lathe([(0.14,0),(0.22,0.06),(0.24,0.3),(0.22,0.54),(0.14,0.6)],14,cap0=True,cap1=True),chain(tr(0,-0.3,0),rotz(math.pi/2),tr(0,0.23,0))),M['straw'],r,disp=lambda p,n:0.006*fbm3(p,20,2))
    mk(nm('tawara','ties'),merge_geo(*[xform(lathe([(0.235,-0.015),(0.245,0),(0.235,0.015)],14),chain(rotz(math.pi/2),tr(x,0.23,0))) for x in (-0.18,0,0.18)]),M['rope'],r)
def build_rack(loc):
    r=J('rack',loc)
    mk(nm('rack','stand'),merge_geo(bx(0.45,0.03,0.12,(0,0.03,0)),*[bx(0.025,0.3,0.025,(sx*0.38,0.32,0)) for sx in(-1,1)],*[xform(bx(0.04,0.015,0.05),tr(sx*0.38,0.25+k*0.18,0.04)) for sx in(-1,1) for k in range(3)]),M['black'],r,bevel=0.004)
    sw=[]
    for k in range(3):
        y=0.28+k*0.18;sw.append(tube([(-0.5,y,0.06),(0.5,y+0.01,0.06)],0.018,8));sw.append(tube([(-0.62,y-0.004,0.06),(-0.5,y,0.06)],0.016,6))
    mk(nm('rack','saya'),merge_geo(*sw),M['red'],r)
    mk(nm('rack','tsuba'),merge_geo(*[xform(lathe([(0.0001,-0.004),(0.04,-0.004),(0.04,0.004),(0.0001,0.004)],12,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(-0.5,0.28+k*0.18,0.06))) for k in range(3)]),M['gold'],r)
def build_yari(loc):
    r=J('yari',loc)
    mk(nm('yari','frame'),merge_geo(bx(0.9,0.04,0.06,(0,0.5,0)),bx(0.9,0.04,0.06,(0,2.2,0)),*[bx(0.03,1.2,0.03,(sx*0.86,1.2,0)) for sx in(-1,1)]),M['post'],r,bevel=0.006)
    mk(nm('yari','shafts'),merge_geo(*[tube([(x,0.05,0.07),(x,2.55,0.07)],0.016,6) for x in (-0.6,-0.2,0.2,0.6)]),M['red'],r)
    mk(nm('yari','heads'),merge_geo(*[xform(lathe([(0.012,0),(0.02,0.04),(0.004,0.32),(0.0001,0.33)],4,cap1=True),tr(x,2.55,0.07)) for x in (-0.6,-0.2,0.2,0.6)]),M['steel'],r,sharp=30)
def build_kamidana(loc):
    r=J('kamidana',loc)
    mk(nm('kamidana','shelf'),merge_geo(bx(0.7,0.03,0.25,(0,0,0)),bx(0.03,0.15,0.2,(-0.6,-0.15,-0.04)),bx(0.03,0.15,0.2,(0.6,-0.15,-0.04))),M['hinoki'],r,bevel=0.005)
    mk(nm('kamidana','shrine'),merge_geo(bx(0.22,0.2,0.14,(0,0.23,-0.02)),bx(0.26,0.02,0.16,(0,0.05,0))),M['hinoki'],r,bevel=0.004)
    mk(nm('kamidana','roof'),merge_geo(loft([[(x,0.43,-0.2),(x,0.55,-0.02),(x,0.43,0.18)] for x in (-0.3,0.3)],False,False,False)),M['post'],r,solid=0.02)
    mk(nm('kamidana','rope'),tube([(-0.65,0.02,0.24),(-0.3,-0.05,0.25),(0,-0.07,0.25),(0.3,-0.05,0.25),(0.65,0.02,0.24)],0.025,8,twist=0.6),M['rope'],r)
    mk(nm('kamidana','shide'),merge_geo(*[xform(bx(0.02,0.07,0.002),chain(rotz(0.1),tr(x,-0.15,0.26))) for x in (-0.4,0,0.4)]),M['paper'],r)
    mk(nm('kamidana','vases'),merge_geo(*[lathe([(0.0001,0.03),(0.03,0.03),(0.035,0.1),(0.02,0.14),(0.025,0.16)],10,c=(sx*0.45,0,0.05),cap0=True) for sx in(-1,1)]),M['koiw'],r)
    mk(nm('kamidana','sakaki'),merge_geo(*[xform(bx(0.03,0.01,0.015),chain(rotz(a),tr(sx*0.45+math.cos(a)*0.03,0.2+k*0.02,0.05))) for sx in(-1,1) for k,a in enumerate((0.3,1.2,2.2,2.9,-0.6))]),M['leaf'],r)
def build_tokonoma(loc):
    r=J('tokonoma',loc)
    mk(nm('tokonoma','dais'),bx(0.9,0.07,0.35,(0,0.07,0)),M['post'],r,bevel=0.006)
    mk(nm('tokonoma','scroll'),merge_geo(quad(0.42,1.3,(0,1.25,-0.3),(0,0,1,1))),M['kake'],r)
    mk(nm('tokonoma','rods'),merge_geo(tube([(-0.25,0.59,-0.29),(0.25,0.59,-0.29)],0.012,6),tube([(-0.23,1.91,-0.29),(0.23,1.91,-0.29)],0.008,6),tube([(-0.1,1.91,-0.29),(0,2.0,-0.3),(0.1,1.91,-0.29)],0.003,4,False,False)),M['black'],r)
    mk(nm('tokonoma','vase'),lathe([(0.0001,0.14),(0.06,0.14),(0.09,0.22),(0.07,0.32),(0.03,0.36),(0.035,0.4)],16,c=(0.4,0,0.05),cap0=True),M['ink'],r)
    br=[tube([(0.4,0.38,0.05),(0.35,0.6,0.08),(0.22,0.78,0.02),(0.12,0.85,0.0)],lambda t:0.01*(1-0.7*t),5),tube([(0.4,0.38,0.05),(0.47,0.55,0.02),(0.58,0.62,0.06)],0.006,5)]
    mk(nm('tokonoma','branch'),merge_geo(*br),M['bark'],r)
    mk(nm('tokonoma','blossom'),merge_geo(*[xform(lathe([(0.0001,-0.012),(0.016,0),(0.0001,0.012)],6,cap0=True,cap1=True),tr(x,y,z)) for x,y,z in ((0.35,0.62,0.09),(0.26,0.75,0.04),(0.16,0.83,0.01),(0.12,0.86,0.0),(0.5,0.56,0.03),(0.57,0.63,0.06),(0.3,0.7,0.06))]),M['lampred'],r)
def build_stairs(loc):
    r=J('stairs',loc);n=16;w=0.8;run=0.27;rise=0.215;st=[]
    for i in range(n):st.append(bx(w,0.025,run/2+0.02,(0,(i+1)*rise,-i*run)));st.append(bx(w-0.01,rise/2,0.01,(0,(i+0.5)*rise,-i*run+run/2)))
    mk(nm('stairs','treads'),merge_geo(*st),M['hinoki'],r,sharp=40)
    sg=[]
    for sx in(-1,1):sg.append(loft([[(sx*(w+0.02),y,z) for y,z in ((0.0,run/2),(rise*n+0.05,-run*(n-1)-run/2),(rise*n-0.35,-run*(n-1)-run/2),(-0.3,run/2))] ] + [[(sx*(w+0.07),y,z) for y,z in ((0.0,run/2),(rise*n+0.05,-run*(n-1)-run/2),(rise*n-0.35,-run*(n-1)-run/2),(-0.3,run/2))]],True,True,True))
    mk(nm('stairs','stringers'),merge_geo(*sg),M['post'],r)
    rl=[]
    for sx in(-1,1):
        rl.append(tube([(sx*(w+0.05),1.0,run/2),(sx*(w+0.05),rise*n+0.95,-run*(n-1))],0.03,6))
        for i in range(0,n,3):rl.append(bx(0.025,0.45,0.025,(sx*(w+0.05),(i+1)*rise+0.5,-i*run)))
    mk(nm('stairs','rail'),merge_geo(*rl),M['black'],r)
def build_rail(loc):
    r=J('rail',loc);g=[bx(2.0,0.03,0.04,(0,1.0,0)),bx(2.0,0.02,0.03,(0,0.55,0)),bx(2.0,0.05,0.06,(0,0.05,0))]
    for i in range(9):g.append(bx(0.03,0.5,0.03,(-2.0+i*0.5,0.5,0)))
    mk(nm('rail','rail'),merge_geo(*g),M['black'],r,sharp=40)
    mk(nm('rail','gilt'),merge_geo(*[lathe([(0.04,1.03),(0.05,1.06),(0.0001,1.12)],10,c=(-2.0+i*1.0,0,0),cap1=True) for i in range(5)]),M['gold'],r)
def build_drape(loc):
    r=J('drape',loc);N=24;rings=[]
    for j in range(5):
        v=j/4;ring=[]
        for i in range(N+1):
            u=i/N;x=-1.0+2.0*u;sag=0.38*math.sin(math.pi*u);y=-sag-v*(0.12+0.18*math.sin(math.pi*u));z=0.05*math.sin(u*40)*v
            ring.append((x,y,z+0.03))
        rings.append(ring)
    mk(nm('drape','cloth'),loft(rings,False,False,False),M['cloth'],r,solid=0.008)
    mk(nm('drape','tassel'),merge_geo(*[merge_geo(tube([(sx,0.0,0.04),(sx,-0.35,0.04)],0.008,5),lathe([(0.0001,-0.6),(0.035,-0.5),(0.02,-0.36),(0.0001,-0.34)],8,c=(sx,0,0.04))) for sx in(-1,1)]),M['gold'],r)
def build_nobori(loc):
    r=J('nobori',loc)
    mk(nm('nobori','pole'),merge_geo(tube([(0,0,0),(0,2.6,0)],0.022,8),tube([(0,2.45,0),(0.62,2.45,0)],0.015,6)),M['post'],r)
    mk(nm('nobori','cloth'),quad(0.56,1.9,(0.31,1.48,0.02),(0,0,1,1)),M['banner'],r)
def build_tree(loc):
    r=J('tree',loc);R_=random.Random(17)
    trunk=[(0,0,0),(0.1,0.6,0.05),(-0.15,1.3,0.1),(0.05,2.0,-0.05),(0.35,2.6,0.0),(0.2,3.2,0.1)]
    mk(nm('tree','trunk'),tube(trunk,lambda t:0.32*(1-0.65*t)+0.06*(t<0.1),14),M['bark'],r,disp=lambda p,n:0.04*fbm3(p,2.5,3)+0.02*abs(math.sin(p.y*9+fbm3(p,1.5,2)*4)))
    br=[];leaves=[]
    tips=[]
    for k in range(7):
        a=k*0.9+R_.uniform(-0.3,0.3);h=R_.uniform(1.6,3.1);L=R_.uniform(1.2,2.2)
        b0=V((0.05*math.cos(a),h,0.05*math.sin(a)));b1=b0+V((math.cos(a)*L*0.55,0.3+R_.uniform(0,0.4),math.sin(a)*L*0.55));b2=b0+V((math.cos(a)*L,0.15+R_.uniform(0,0.5),math.sin(a)*L))
        br.append(tube([tuple(b0),tuple(b1),tuple(b2)],lambda t:0.11*(1-0.8*t),8));tips+= [b1,b2]
    tips.append(V((0.2,3.4,0.1)))
    mk(nm('tree','branches'),merge_geo(*br),M['bark'],r,disp=lambda p,n:0.015*fbm3(p,4,2))
    for t in tips:
        for q in range(9):
            c=t+V((R_.uniform(-0.7,0.7),R_.uniform(-0.15,0.45),R_.uniform(-0.7,0.7)));s=R_.uniform(0.22,0.42)
            leaves.append(xform(lathe([(0.0001,-0.55),(0.45,-0.4),(0.62,-0.05),(0.52,0.3),(0.0001,0.5)],12,cap0=True,cap1=True),chain(lambda p,s=s:V((p.x*s,p.y*s*0.62,p.z*s)),tr(c.x,c.y,c.z))))
    mk(nm('tree','leaves'),merge_geo(*leaves),M['leaf'],r,disp=lambda p,n:0.07*fbm3(p,5,3)+0.03*fbm3(p,14,2))
    for (x,y,z) in [(0.9,2.6,0.3),(-1.0,2.3,-0.4),(0.3,2.9,-1.1)]:lantern_geo(r,nm('tree','lant%d'%int(x*10+20)),(x,y,z),M['lamp'],0.45)
def build_pond(loc):
    r=J('pond',loc);R_=random.Random(9);N=40;sh=lambda a:1+0.18*math.sin(a*2+0.5)+0.1*math.sin(a*3+1.3)
    w=[];rk=[]
    pts=[(math.sin(TAU*i/N)*2.2*sh(TAU*i/N),0.06,math.cos(TAU*i/N)*1.6*sh(TAU*i/N)) for i in range(N)]
    mk(nm('pond','water'),loft([pts,[(0,0.06,0)]*N],True,False,False),M['water'],r)
    mk(nm('pond','bed'),loft([[(x,-0.25,z) for x,_,z in pts],[(0,-0.3,0)]*N],True,False,False),M['rock'],r)
    for i in range(0,N,2):
        a=TAU*i/N;s=R_.uniform(0.18,0.32);x=math.sin(a)*2.35*sh(a);z=math.cos(a)*1.75*sh(a)
        rk.append(xform(lathe([(0.0001,-0.1),(1.0,-0.05),(0.85,0.35),(0.0001,0.6)],7,cap0=True,cap1=True),chain(lambda p,s=s:V((p.x*s*1.3,p.y*s,p.z*s)),roty(a),tr(x,0.0,z))))
    mk(nm('pond','rocks'),merge_geo(*rk),M['rock'],r,disp=lambda p,n:0.03*fbm3(p,5,3))
def build_koi(loc):
    r=J('koi',loc)
    body=[(0,0,-0.16),(0,0,-0.08),(0,0,0.04),(0,0,0.12),(0,0,0.17)]
    mk(nm('koi','body'),tube(body,lambda t:0.012+0.035*math.sin(math.pi*min(1,t*1.3)),10,flat=0.7),M['koi'],r)
    mk(nm('koi','fins'),merge_geo(loft([[(0,0,-0.16),(0,0.0,-0.16)],[(-0.04,0.0,-0.24),(0.04,0.0,-0.24)]],False,False,False)),M['koiw'],r,solid=0.004)
def build_eave(loc):
    r=J('eave',loc);prof=[(1.3,3.45),(0.8,3.62),(0.2,3.85),(-0.25,4.05)]
    mk(nm('eave','tiles'),tile_roof_loft(-2.05,2.05,[(z,y) for z,y in prof],pitch=0.25,amp=0.035,thick=0.1),M['kawara'],r,sharp=55)
    mk(nm('eave','rafters'),merge_geo(*[xform(bx(0.035,0.04,0.7),chain(rotx(-0.32),tr(x,3.48,0.6))) for x in [-1.9+i*0.38 for i in range(11)]],bx(2.05,0.05,0.05,(0,3.38,1.25))),M['post'],r)
def build_kyodai(loc):
    r=J('kyodai',loc)
    mk(nm('kyodai','box'),merge_geo(bx(0.2,0.08,0.13,(0,0.08,0)),bx(0.02,0.18,0.02,(-0.15,0.32,-0.05)),bx(0.02,0.18,0.02,(0.15,0.32,-0.05))),M['red'],r,bevel=0.004)
    mk(nm('kyodai','mirror'),xform(bx(0.13,0.16,0.01),chain(rotx(-0.15),tr(0,0.4,-0.04))),M['steel'],r)
def build_cage(loc):
    """Решётка-заслон (кости дома): закрывает проход, пока комната не зачищена."""
    r=J('bars',loc);g=[bx(0.9,0.04,0.04,(0,2.15,0)),bx(0.9,0.04,0.04,(0,0.06,0))]+[bx(0.02,1.05,0.02,(-0.85+i*0.17,1.1,0)) for i in range(11)]
    mk(nm('bars','bars'),merge_geo(*g),M['iron'],r)
# ================================================================ ВРАГИ
import chars
def build_musha(loc):
    st=dict(chars.SOTA);st.update(hair='topknot',horns=False,saya=False,angry=3.5,brow=0.01)
    Mm=dict(chars.mats_sota())
    Mm.update(skin=mat('MU_skin',(0.32,0.38,0.46),0.55,tex='skin_c',ntex='skin_n',nstr=0.9,dens=12),eye=mat('MU_eye',(0.4,0.8,1.0),0.2,emis=(0.4,0.85,1.0),es=14),
      lacquer=mat('MU_kozane',(0.55,0.62,0.8),0.32,0.1,tex='kozane_ak_c',ntex='kozane_n',nstr=1.6,coat=0.6,dens=2.27),plate=mat('MU_iron',(0.07,0.08,0.1),0.35,0.75,ntex='metal_n',coat=0.4,dens=8),
      kimono=mat('MU_kimono',(0.04,0.05,0.07),0.9,tex='cloth_c',ntex='cloth_n',dens=22),kimono2=mat('MU_kimono2',(0.1,0.16,0.28),0.85,tex='cloth_c',ntex='cloth_n',dens=24),
      hakama=mat('MU_hakama',(0.05,0.055,0.07),0.95,tex='cloth_c',ntex='cloth_n',dens=18),obi=mat('MU_obi',(0.12,0.2,0.32),0.8,tex='cloth_c',ntex='cloth_n',dens=30),
      kote=mat('MU_kote',(0.03,0.035,0.05),0.85,tex='cloth_c',ntex='cloth_n',dens=26),gilt=mat('MU_gilt',(0.7,0.55,0.3),0.35,1.0,ntex='metal_n',dens=12))
    root=chars.build_human('MU',st,Mm,loc)
    neck=bpy.data.objects['MU__J_neck'];c=(0,0.105,0.008)
    ghost=mat('MU_ghost',(0.3,0.7,1.0),0.3,emis=(0.35,0.75,1.0),es=4.0)
    # кабуто: купол с рёбрами-судзи, козырёк, сикоро, фукигаэси, кувагата
    dome=[(0.128,0.125),(0.127,0.16),(0.118,0.2),(0.1,0.24),(0.07,0.27),(0.035,0.285),(0.0001,0.29)]
    mk('MU__neck__kabuto',lathe(dome,32,c=(0,0,-0.005),cap1=True),Mm['plate'],neck,disp=lambda p,n:0.004*abs(math.sin(math.atan2(p.x,p.z+0.005)*16)))
    mk('MU__neck__tehen',lathe([(0.02,0.285),(0.025,0.3),(0.0001,0.305)],12,c=(0,0,-0.005),cap1=True),Mm['gilt'],neck)
    viz=[];N=20
    for k in range(N+1):
        a=-1.15+2.3*k/N;viz.append([(math.sin(a)*0.135,0.135,math.cos(a)*0.135-0.005),(math.sin(a)*0.175,0.115,math.cos(a)*0.175-0.005)])
    mk('MU__neck__mabizashi',loft([[q[0] for q in viz],[q[1] for q in viz]],False,False,False),Mm['plate'],neck,solid=0.006)
    for L in range(4):
        rr=0.135+L*0.022;y=0.12-L*0.045;ring=[];ring2=[]
        for k in range(25):
            a=math.pi*0.42+(2*math.pi-0.84*math.pi)*k/24;ring.append((math.sin(a)*rr,y,math.cos(a)*rr-0.01));ring2.append((math.sin(a)*(rr+0.03),y-0.05,math.cos(a)*(rr+0.03)-0.01))
        mk('MU__neck__shikoro%d'%L,loft([ring,ring2],False,False,False),Mm['lacquer'],neck,solid=0.008)
    for sx in(-1,1):
        mk('MU__neck__fuki%d'%(sx+1),xform(plate(0.07,0.09,0.008,curve=0.12,nu=6,nv=2),chain(roty(sx*1.1),tr(sx*0.14,0.12,0.06))),Mm['lacquer'],neck)
        mk('MU__neck__kuwa%d'%(sx+1),tube([(sx*0.02,0.2,0.13),(sx*0.06,0.26,0.15),(sx*0.11,0.34,0.15),(sx*0.13,0.44,0.12),(sx*0.11,0.5,0.09)],lambda t:0.012*(1-0.6*t)+0.004,6,flat=0.25),Mm['gilt'],neck)
    mk('MU__neck__maedate',xform(lathe([(0.0001,-0.004),(0.035,-0.004),(0.035,0.004),(0.0001,0.004)],16,cap0=True,cap1=True),chain(rotx(math.pi/2),tr(0,0.21,0.135))),Mm['gilt'],neck)
    # мэмпо: маска нижней части лица с усами и зубами
    fc=[]
    for j in range(7):
        v=j/6;y=c[1]-0.085+v*0.07;ring=[]
        for i in range(13):
            u=-1+2*i/12;a=u*1.2;rr=0.083*(1-0.15*v)
            ring.append((math.sin(a)*rr,y,math.cos(a)*rr*1.12+c[2]+0.012+0.012*math.exp(-(u/0.25)**2)*(v>0.6)))
        fc.append(ring)
    mk('MU__neck__menpo',loft(fc,False,False,False),Mm['red'] if 'red' in Mm else mat('MU_menpo',(0.35,0.04,0.03),0.3,coat=0.8,dens=4),neck,solid=0.006)
    mk('MU__neck__teeth',merge_geo(*[bx(0.006,0.007,0.004,(x,c[1]-0.045,c[2]+0.098)) for x in(-0.025,-0.013,0,0.013,0.025)]),mat('MU_teeth',(0.9,0.85,0.7),0.4,dens=8),neck)
    mk('MU__neck__hige',merge_geo(*[tube([(sx*0.01,c[1]-0.03,c[2]+0.1),(sx*0.04,c[1]-0.035,c[2]+0.092),(sx*0.065,c[1]-0.06,c[2]+0.07)],lambda t:0.006*(1-0.7*t),5) for sx in(-1,1)]),mat('MU_hige',(0.85,0.85,0.88),0.6,dens=8),neck)
    # сасимоно на спине (рваный флажок) и призрачные огоньки
    tor=bpy.data.objects['MU__J_torso']
    mk('MU__torso__sashipole',tube([(0,0.25,-0.18),(0,1.25,-0.22)],0.012,6),Mm['plate'],tor)
    rings=[[(x,y,-0.23+0.02*math.sin(y*12+x*8)) for x in (0.0,0.08,0.18,0.3)] for y in [1.2-0.12*k for k in range(7)]]
    for k,rr in enumerate(rings):rr[-1]=(rr[-1][0]-0.08*(k%2),rr[-1][1],rr[-1][2])
    mk('MU__torso__sashi',loft(rings,False,False,False),ghost,tor,solid=0.003)
    return root
def build_tc(loc):
    """Тётин-обакэ: старый бумажный фонарь с глазом и языком."""
    r=empty('TC',loc);body=empty('TC__J_body',(0,0.6,0),r)
    pm=mat('tc_paper',(1,1,1),0.85,tex='ho_tcpaper_c',emis=(1.0,0.55,0.22),es=1.4,dens=1.0,double=True)
    prof=[(0.12,-0.36),(0.25,-0.28),(0.3,-0.12),(0.31,0.05),(0.27,0.22),(0.13,0.34)]
    rings=[];N=28
    for y_r in prof:
        rr,y=y_r;ring=[]
        for i in range(N+1):
            a=TAU*i/N;tear=0.02*math.sin(a*7+y*9)
            ring.append((math.sin(a)*(rr+tear),y,math.cos(a)*(rr+tear)))
        rings.append(ring)
    v,f,u=loft(rings,False,False,False);u=[[(uu/(TAU*0.31),vv/0.75) for uu,vv in face] for face in u]
    mk('TC__body__paper',(v,f,u),pm,body)
    rib=[lathe([(rr*0.98+0.006,y-0.006),(rr*0.98+0.012,y),(rr*0.98+0.006,y+0.006)],24) for rr,y in [(0.25,-0.28),(0.29,-0.18),(0.31,-0.06),(0.31,0.06),(0.29,0.16),(0.26,0.25)]]
    mk('TC__body__ribs',merge_geo(*rib),M['ink'],body)
    mk('TC__body__caps',merge_geo(lathe([(0.0001,0.33),(0.14,0.33),(0.14,0.39),(0.0001,0.39)],16,cap0=True,cap1=True),lathe([(0.0001,-0.41),(0.13,-0.41),(0.13,-0.35),(0.0001,-0.35)],16,cap0=True,cap1=True),tube([(0,0.39,0),(0,0.55,0),(0.06,0.6,0)],0.012,6)),M['black'],body)
    # рот (тёмная щель) + зубы
    mth=[]
    for i in range(15):
        a=-0.9+1.8*i/14;mth.append((math.sin(a)*0.315,-0.13+0.06*abs(a)**1.5,math.cos(a)*0.315))
    mk('TC__body__mouth',tube(mth,lambda t:0.035*(1-abs(2*t-1)**2)+0.008,8,flat=0.45),mat('tc_mouth',(0.12,0.01,0.01),0.6,emis=(0.6,0.05,0.02),es=1.5),body)
    mk('TC__body__teeth',merge_geo(*[xform(lathe([(0.011,0),(0.0001,0.035)],5,cap0=True),chain(rotx(math.pi),tr(math.sin(a)*0.32,-0.1,math.cos(a)*0.32))) for a in (-0.6,-0.3,0,0.3,0.6)]),mat('tc_teeth',(0.9,0.86,0.75),0.4),body)
    eye=empty('TC__J_eye',(0,0.09,0.27),body)
    mk('TC__eye__ball',lathe([(0.0001,-0.09),(0.07,-0.06),(0.095,0),(0.07,0.06),(0.0001,0.09)],16,cap0=True,cap1=True),mat('tc_eyewhite',(0.92,0.9,0.8),0.2,coat=0.8),eye)
    mk('TC__eye__iris',xform(lathe([(0.0001,0),(0.04,0),(0.0001,0.015)],14,cap0=True),chain(rotx(math.pi/2),tr(0,0,0.088))),mat('tc_iris',(1.0,0.2,0.05),0.2,emis=(1.0,0.2,0.05),es=6),eye)
    tg=empty('TC__J_tongue',(0,-0.14,0.27),body)
    mk('TC__tongue__tongue',tube([(0,0,0),(0,-0.04,0.08),(0,-0.14,0.14),(0,-0.3,0.12),(0,-0.42,0.06)],lambda t:0.04*(1-0.6*t)+0.01,10,flat=0.35),mat('tc_tongue',(0.75,0.2,0.25),0.35,coat=0.4),tg,sub=1)
    return r
def build_mk(loc):
    """Мокумокурэн: рваная сёдзи-стена, в клетках которой открываются глаза."""
    r=empty('MK',loc);g=empty('MK__J_panel',(0,0,0),r);w=0.9;h=2.1
    fr=[bx(w,0.03,0.025,(0,h,0)),bx(w,0.03,0.025,(0,0.03,0)),bx(0.03,h/2,0.025,(-w,h/2,0)),bx(0.03,h/2,0.025,(w,h/2,0))]
    for k in range(1,6):fr.append(bx(0.01,h/2-0.03,0.015,(-w+k*2*w/6,h/2,0)))
    for k in range(1,7):fr.append(bx(w-0.02,0.01,0.015,(0,k*h/7,0)))
    mk('MK__panel__frame',merge_geo(*fr),M['post'],g,sharp=40)
    R_=random.Random(4);pp=[]
    for i in range(6):
        for j in range(7):
            if R_.random()<0.3:continue
            cx=-w+(i+0.5)*2*w/6;cy=(j+0.5)*h/7;pp.append(bx(w/6-0.012,h/14-0.012,0.002,(cx,cy,-0.004)))
    mk('MK__panel__paper',merge_geo(*pp),mat('mk_paper',(0.78,0.72,0.6),0.85,tex='paper_c',ntex='paper_n',emis=(0.3,0.15,0.4),es=0.6,dens=2,double=True),g)
    eyes=[];iris=[]
    for (i,j) in [(0,5),(2,6),(4,5),(1,3),(3,4),(5,3),(2,1),(4,2),(0,1),(5,0)]:
        cx=-w+(i+0.5)*2*w/6;cy=(j+0.5)*h/7
        eyes.append(xform(lathe([(0.0001,-0.03),(0.06,-0.015),(0.075,0),(0.06,0.015),(0.0001,0.03)],14,cap0=True,cap1=True),chain(lambda p:V((p.x,p.z*0.55,p.y*0.5)),tr(cx,cy,0.015))))
        iris.append(xform(lathe([(0.0001,0),(0.026,0),(0.0001,0.008)],12,cap0=True),chain(rotx(math.pi/2),tr(cx,cy,0.03))))
    mk('MK__panel__eyes',merge_geo(*eyes),mat('mk_eyewhite',(0.9,0.86,0.78),0.25,coat=0.8),g)
    mk('MK__panel__iris',merge_geo(*iris),mat('mk_iris',(0.7,0.2,1.0),0.2,emis=(0.7,0.2,1.0),es=7),g)
    return r
# ================================================================ ПРЕДМЕТЫ (LT)
LM={k:mat(n,c,ro,me,**kw) for k,n,c,ro,me,kw in [
  ('paper','lt_paper',(0.93,0.88,0.76),0.9,0.0,dict(tex='paper_c',ntex='paper_n',dens=3,double=True)),
  ('map','lt_mapsheet',(1,1,1),0.85,0.0,dict(tex='lt_map_c',dens=1.0,double=True)),
  ('iron','lt_iron',(0.06,0.06,0.06),0.5,1.0,dict(ntex='metal_n',dens=8)),
  ('silk','lt_silk',(0.55,0.06,0.08),0.55,0.0,dict(tex='cloth_c',ntex='cloth_n',dens=14)),
  ('gold','lt_goldthread',(0.95,0.72,0.3),0.35,0.9,dict(dens=10)),
  ('black','lt_lacq_black',(0.02,0.018,0.016),0.22,0.0,dict(coat=0.9,dens=4)),
  ('red','lt_lacq_red',(0.45,0.03,0.02),0.25,0.0,dict(coat=0.8,ntex='leather_n',nstr=0.2,dens=4)),
  ('wood','lt_wood',(0.4,0.25,0.15),0.7,0.0,dict(tex='wood_c',ntex='wood_n',nstr=0.45,dens=2.2)),
  ('glaze','lt_glaze_white',(0.88,0.86,0.8),0.15,0.0,dict(coat=0.7,dens=5)),
  ('blue','lt_glaze_blue',(0.08,0.18,0.42),0.18,0.0,dict(coat=0.6,ntex='stone_n',nstr=0.3,dens=5)),
  ('tea','lt_tea',(0.15,0.3,0.1),0.4,0.0,dict(coat=0.5,dens=5)),
  ('thunder','lt_thunder',(0.5,0.8,1.0),0.4,0.0,dict(emis=(0.4,0.75,1.0),es=5.0)),
  ('rope','lt_rope',(0.62,0.52,0.36),0.95,0.0,dict(tex='straw_c',ntex='straw_n',dens=30)),
  ('steel','blade_steel',(1,1,1),0.15,1.0,dict(tex='blade_c',orm='blade_orm',ntex='metal_n',nstr=0.25,dens=1.0)),
  ('lapis','lt_lapis',(0.08,0.2,0.75),0.15,0.0,dict(coat=1.0,emis=(0.1,0.3,1.0),es=1.5,dens=6)),
  ('ito','lt_ito',(0.08,0.12,0.25),0.8,0.0,dict(tex='cloth_c',ntex='cloth_n',dens=20)),
  ('same','lt_same',(0.85,0.82,0.75),0.6,0.0,dict(ntex='leather_n',dens=20)),
]}
def LJ(n,loc):return empty('LT__J_'+n,loc)
def build_map(loc):
    r=LJ('map',loc)
    mk('LT__map__roll',merge_geo(xform(lathe([(0.025,-0.12),(0.025,0.12)],14,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(-0.11,0.025,0)))),LM['paper'],r)
    rings=[[(x,0.003+0.004*math.sin(x*20)+(0.02*(1-(x+0.11)/0.05) if x<-0.06 else 0),z) for x in [-0.1+0.22*i/12 for i in range(13)]] for z in (-0.11,0.11)]
    v,f,u=loft(rings,False,False,False);u=[[(uu/0.24,vv/0.22) for uu,vv in fc] for fc in u]
    mk('LT__map__sheet',(v,f,u),LM['map'],r,solid=0.002)
    mk('LT__map__cord',tube([(-0.11,0.03,-0.03),(-0.08,0.0,-0.05),(-0.05,0.002,-0.09)],0.003,5),LM['silk'],r)
def build_housekey(loc):
    r=LJ('housekey',loc)
    ring=[(math.cos(TAU*i/28)*0.035,0.0,0.09+math.sin(TAU*i/28)*0.035) for i in range(29)]
    mk('LT__housekey__bow',merge_geo(tube(ring,0.007,8,False,False),xform(lathe([(0.0001,-0.004),(0.02,-0.004),(0.02,0.004),(0.0001,0.004)],6,cap0=True,cap1=True),tr(0,0,0.09))),LM['iron'],r)
    mk('LT__housekey__shank',merge_geo(tube([(0,0,0.05),(0,0,-0.12)],0.006,8),bx(0.004,0.022,0.018,(0,-0.012,-0.105)),bx(0.004,0.014,0.01,(0,-0.022,-0.085)),xform(lathe([(0.01,0),(0.012,0.006),(0.01,0.012)],10),chain(rotx(math.pi/2),tr(0,0,0.04)))),LM['iron'],r)
    mk('LT__housekey__mon',xform(lathe([(0.0001,0),(0.014,0),(0.014,0.003),(0.0001,0.003)],12,cap0=True,cap1=True),tr(0,0.005,0.09)),LM['gold'],r)
    mk('LT__housekey__tassel',merge_geo(tube([(0,0,0.125),(0.01,-0.03,0.14),(0.0,-0.07,0.15)],0.003,5),lathe([(0.0001,-0.16),(0.014,-0.13),(0.007,-0.075),(0.0001,-0.07)],8,c=(0,0,0.15))),LM['silk'],r)
def build_yoihilt(loc):
    r=LJ('yoihilt',loc)
    mk('LT__yoihilt__tsuka',tube([(0,0,0),(0,0,-0.24)],lambda t:0.016-0.002*t,10,flat=0.75),LM['same'],r)
    mk('LT__yoihilt__ito',merge_geo(*[xform(bx(0.019,0.004,0.008),chain(rotz(0.7*(1 if k%2 else -1)),tr(0,0,-0.02-k*0.022))) for k in range(10)]),LM['ito'],r)
    mk('LT__yoihilt__tsuba',merge_geo(xform(lathe([(0.0001,-0.004),(0.042,-0.004),(0.045,0.0),(0.042,0.004),(0.0001,0.004)],24,cap0=True,cap1=True,f=lambda a:1+0.05*math.cos(a*6)),chain(rotx(math.pi/2),tr(0,0,0.006)))),LM['iron'],r)
    mk('LT__yoihilt__lapis',xform(lathe([(0.0001,-0.006),(0.009,0),(0.0001,0.006)],10,cap0=True,cap1=True),tr(0,0.03,0.006)),LM['lapis'],r)
    mk('LT__yoihilt__habaki',bx(0.006,0.016,0.012,(0,0.002,0.024)),LM['gold'],r)
    bl=[(0,0.0,0.03),(0,0.0,0.11)];
    v=[(0.0035,0.012,0.03),(-0.0035,0.012,0.03),(0.0,-0.013,0.03),(0.0025,0.011,0.1),(-0.0025,0.011,0.09),(0.0,-0.012,0.125)]
    f=[(0,1,4,3),(1,2,5,4),(2,0,3,5),(3,4,5)];u=[[(0,0),(1,0),(1,1),(0,1)],[(0,0),(1,0),(1,1),(0,1)],[(0,0),(1,0),(1,1),(0,1)],[(0,0),(1,0),(1,1)]]
    mk('LT__yoihilt__stub',(v,f,u),LM['steel'],r,shade_flat=True)
def build_shard(loc):
    r=LJ('shard',loc)
    v=[(0.003,0.012,0),(-0.003,0.012,0),(0,-0.012,0),(0.002,0.01,0.09),(-0.002,0.01,0.075),(0,-0.01,0.1)]
    f=[(0,1,4,3),(1,2,5,4),(2,0,3,5),(3,4,5),(2,1,0)];u=[[(0,0),(1,0),(1,1),(0,1)]]*3+[[(0,0),(1,0),(1,1)]]*2
    mk('LT__shard__blade',(v,f,u),LM['steel'],r,shade_flat=True)
def build_tea(loc):
    r=LJ('tea',loc)
    mk('LT__tea__natsume',lathe([(0.0001,0),(0.035,0.0),(0.045,0.02),(0.046,0.05),(0.04,0.07),(0.0001,0.075)],20,cap0=True,cap1=True),LM['black'],r)
    mk('LT__tea__band',lathe([(0.0462,0.045),(0.0465,0.05),(0.0462,0.055)],20),LM['gold'],r)
    mk('LT__tea__cup',lathe([(0.0001,0.0),(0.025,0.0),(0.028,0.008),(0.038,0.045),(0.035,0.047),(0.026,0.012),(0.0001,0.012)],16,c=(0.09,0,0.02),cap0=True),LM['glaze'],r)
    mk('LT__tea__liquid',lathe([(0.0001,0.036),(0.033,0.036)],16,c=(0.09,0,0.02),cap0=True),LM['tea'],r)
def build_smoke(loc):
    r=LJ('smoke',loc)
    mk('LT__smoke__ball',lathe([(0.0001,0),(0.03,0.006),(0.045,0.04),(0.03,0.075),(0.0001,0.08)],16,cap0=True,cap1=True),LM['black'],r,disp=lambda p,n:0.002*fbm3(p,60,2))
    mk('LT__smoke__wrap',lathe([(0.046,0.035),(0.047,0.045)],16),LM['paper'],r)
    mk('LT__smoke__fuse',tube([(0,0.078,0),(0.01,0.1,0.005),(0.025,0.11,0.0)],0.003,5),LM['rope'],r)
def build_ofuda(loc):
    r=LJ('ofuda',loc)
    mk('LT__ofuda__paper',xform(plate(0.05,0.16,0.002,nu=2,nv=6,bend=0.01),tr(0,0.09,0)),LM['paper'],r)
    mk('LT__ofuda__glyph',merge_geo(bx(0.004,0.06,0.0012,(0,0.1,0.0018)),bx(0.016,0.003,0.0012,(0,0.14,0.0018)),xform(bx(0.003,0.02,0.0012),chain(rotz(0.6),tr(-0.008,0.07,0.0018))),xform(bx(0.003,0.02,0.0012),chain(rotz(-0.6),tr(0.008,0.055,0.0018)))),LM['thunder'],r)
    mk('LT__ofuda__seal',bx(0.012,0.012,0.0012,(0,0.03,0.0018)),LM['red'],r)
def build_sake(loc):
    r=LJ('sake',loc)
    mk('LT__sake__tokkuri',lathe([(0.0001,0),(0.035,0),(0.05,0.03),(0.052,0.07),(0.035,0.11),(0.016,0.14),(0.015,0.17),(0.02,0.18),(0.0001,0.18)],20,cap0=True,cap1=True),LM['glaze'],r)
    mk('LT__sake__pattern',merge_geo(*[xform(lathe([(0.0001,-0.002),(0.01,-0.002),(0.01,0.002),(0.0001,0.002)],8,cap0=True,cap1=True),chain(rotx(math.pi/2),roty(a),tr(math.sin(a)*0.052,0.06+0.02*math.sin(a*3),math.cos(a)*0.052))) for a in [k*0.9 for k in range(7)]]),LM['blue'],r)
    mk('LT__sake__cup',lathe([(0.0001,0),(0.015,0),(0.03,0.018),(0.028,0.02),(0.0001,0.006)],14,c=(0.08,0,0.02),cap0=True),LM['red'],r)
# ================================================================ материалы-носители (для геометрии, построенной в игре)
def carriers(loc):
    r=J('mats',loc)
    for i,k in enumerate(['plaster','hinoki','cedar','post','tatami','floor','stone','snow','gravel','shoji','shojil','black','red','vermilion','gold','kawara','cloth','water','lamp','ink','iron','glass']):
        mk(nm('mats',k),bx(0.05,0.05,0.05,(i*0.12,0.05,0)),M[k],r)
# ================================================================ сборка
collection('House')
build_ext((0,0,-30))
build_extdoor((-0.6,0.62,-30+5.05),'L');build_extdoor((0.6,0.62,-30+5.05),'R')
items=[build_shoji,lambda l:build_shoji(l,'shojil',True),build_fusuma,build_ramma,build_andon,build_lantern,build_pendant,build_armorcase,build_byobu,build_tansu,build_desk,build_shelf,build_futon,build_zabuton,build_table,build_kamado,build_irori,build_crate,build_tawara,build_rack,build_yari,build_kamidana,build_tokonoma,build_stairs,build_rail,build_drape,build_nobori,build_tree,build_pond,build_koi,build_eave,build_kyodai,build_cage]
for i,f in enumerate(items):f(((i%8)*2.6-9,0 if f is not build_pendant else 2.0,(i//8)*3.0))
collection('Enemies');build_musha((-3,0,14));build_tc((-1.5,0,14));build_mk((0.5,0,14))
collection('Items')
for i,f in enumerate((build_map,build_housekey,build_yoihilt,build_shard,build_tea,build_smoke,build_ofuda,build_sake)):f((3+0.35*i,0,14))
carriers((3,0,16))
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'niten_house.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'niten_house.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=80,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=False,export_tangents=False)
print('exported',os.path.getsize(os.path.join(OUT,'niten_house.glb')),'verts',sum(len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'))
if '--preview' in sys.argv:
    render_preview(os.path.join(OUT,'preview_ext.png'),target=(0,3.5,-26),dist=26,yaw=20,pitch=10,res=(1200,700),lens=40,samples=12)
    render_preview(os.path.join(OUT,'preview_props.png'),target=(0,0.9,3.0),dist=14,yaw=0,pitch=28,res=(1600,900),lens=40,samples=12)
    render_preview(os.path.join(OUT,'preview_enemies.png'),target=(-1.5,1.0,14),dist=5.5,yaw=0,pitch=6,res=(1400,800),lens=50,samples=16)
    render_preview(os.path.join(OUT,'preview_musha.png'),target=(-3,1.5,14),dist=1.6,yaw=25,pitch=5,res=(800,800),lens=50,samples=16)
    render_preview(os.path.join(OUT,'preview_hitems.png'),target=(4.2,0.06,14),dist=2.6,yaw=0,pitch=40,res=(1400,600),lens=60,samples=16)
