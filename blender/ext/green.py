# v0.16: ГЛАВА 7 «Зелёная пустошь» — локация из готовой модели landscape_forest__mountains.glb (Sketchfab)
#   + реквизит загадки из greenhouse_props.glb, процедурные врата корней, пьедесталы, портал, шахта колодца.
# python3 blender/ext/green.py   -> blender/out/niten_green.glb + game/src/gGd.js (nav с высотами, деревья-коллайдеры, точки загадки)
# Исходники моделей: $NITEN_SRC/green/{landscape_forest__mountains.glb,greenhouse_props.glb} (в git не хранятся)
import bpy,bmesh,sys,os,json,math,base64,random
import numpy as np
from mathutils import Vector,Matrix,noise
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'..'))
import tex as TX
import lib as L
SRC=os.environ.get('NITEN_SRC','/data/src')
LAND=os.path.join(SRC,'green','landscape_forest__mountains.glb');PROPS=os.path.join(SRC,'green','greenhouse_props.glb')
ROOT=os.path.join(HERE,'..','..');OUT=os.path.join(HERE,'..','out','green');os.makedirs(OUT,exist_ok=True)
S=3.0          # масштаб ландшафта (модель ~40 м -> ~120 м)
GS=0.5         # трава: карточки уменьшаются относительно общего масштаба (иначе по пояс)
CS=0.4         # шаг nav-сетки
NAVB=(-150.0,62.0,-90.0,50.0)    # x0,x1,z0,z1 (игровые координаты)
FOOT=[(-19.83,20.0,-13.9,14.01),(-49.5,-19.19,-16.45,29.26)]   # подножие земли (blender x0,x1,y0,y1 до масштаба)
# --- точки (игровые x,z): посадка, лагерь травника, врата, чаши, портал, предметы
LAND_P=(-6.0,27.0)
CAMP=(-21.0,13.5)
GATE=(6.0,0.5)                     # центр проёма врат (смотрят на юг, +z)
POTS=[(3.3,5.2),(6.0,5.6),(8.7,5.2)]   # левая / средняя / правая (стоя лицом к вратам, т.е. глядя на север)
PORTAL=(6.0,-5.0)
ITEMS=dict(shovel=(-42.0,29.0),can=(41.0,23.0),book=(CAMP[0]-2.6,CAMP[1]+0.6),flask=(CAMP[0]+2.2,CAMP[1]-0.1),bottle=(-63.0,-4.0))
CLEAR=[(LAND_P,6.0),(CAMP,7.5),(GATE,6.5),(PORTAL,6.5),((6.0,8.5),5.0),(ITEMS['shovel'],2.6),(ITEMS['can'],2.6),(ITEMS['bottle'],2.6)]
CLEARG=[(CAMP,4.6),(GATE,3.0),(PORTAL,3.4),((6.0,5.4),3.6)]   # трава убирается только под реквизитом
def g2b(x,z,y=0.0):return Vector((x,-z,y))
def b2g(v):return (v.x,v.z,-v.y)
def clean():bpy.ops.wm.read_factory_settings(use_empty=True)
def bake_xf(o):
    if o.data.users>1:o.data=o.data.copy()
    o.data.transform(o.matrix_world);o.parent=None;o.matrix_world=Matrix.Identity(4)
def join(objs,name):
    objs=[o for o in objs if o]
    if not objs:return None
    if len(objs)>1:
        with bpy.context.temp_override(active_object=objs[0],selected_editable_objects=objs,selected_objects=objs):bpy.ops.object.join()
    objs[0].name=name;return objs[0]
def bbox(o):
    vs=[o.matrix_world@v.co for v in o.data.vertices]
    return Vector((min(v.x for v in vs),min(v.y for v in vs),min(v.z for v in vs))),Vector((max(v.x for v in vs),max(v.y for v in vs),max(v.z for v in vs)))
# ------------------------------------------------------------------ ландшафт
def landscape():
    bpy.ops.import_scene.gltf(filepath=LAND)
    ren={'Material.001':'gr_ground','Material.002':'gr_grassA','Material.003':'gr_grassB','Material.004':'gr_treeA','Material.005':'gr_treeB','Material.006':'gr_treeC',
         'Material.007':'gr_hillA','Material.008':'gr_hillB','Material.009':'gr_snow','Material.011':'gr_sky'}
    for m in bpy.data.materials:
        if m.name in ren:m.name=ren[m.name]
    for im in bpy.data.images:im.name='gr_'+im.name
    meshes=[o for o in bpy.data.objects if o.type=='MESH']
    for o in meshes:bake_xf(o)
    for o in [o for o in bpy.data.objects if o.type!='MESH']:bpy.data.objects.remove(o)
    grp={};trees=[]
    for o in meshes:
        mn,mx=bbox(o);m=o.data.materials[0].name
        if mn.z>10 and m not in('gr_sky',):bpy.data.objects.remove(o);continue      # прототипы карточек над сценой
        c=Vector(((mn.x+mx.x)/2,(mn.y+mx.y)/2,mn.z))
        gx,gz=c.x*S,-c.y*S
        if m.startswith('gr_tree') and any(math.hypot(gx-p[0],gz-p[1])<r for p,r in CLEAR):bpy.data.objects.remove(o);continue
        if m.startswith('gr_grass') and any(math.hypot(gx-p[0],gz-p[1])<r for p,r in CLEARG):bpy.data.objects.remove(o);continue
        # масштаб: всё x S; трава дополнительно сжимается вокруг своего основания
        o.data.transform(Matrix.Scale(S,4))
        if m.startswith('gr_grass'):
            cs=c*S;o.data.transform(Matrix.Translation(cs)@Matrix.Scale(GS,4)@Matrix.Translation(-cs))
        if m.startswith('gr_tree'):trees.append((round(gx,2),round(gz,2),round((mx.x-mn.x)*S,2),m))
        grp.setdefault(m,[]).append(o)
    seam(grp['gr_ground'])
    out={}
    for m,objs in grp.items():
        if m.startswith(('gr_tree','gr_grass')):
            # чанки 40 м — для отсечения по пирамиде видимости
            ch={}
            for o in objs:
                mn,mx=bbox(o);k=(int(math.floor((mn.x+mx.x)/2/40)),int(math.floor((mn.y+mx.y)/2/40)));ch.setdefault(k,[]).append(o)
            out[m]=[join(v,'%s_%d_%d'%(m,k[0],k[1])) for k,v in ch.items()]
        else:out[m]=[join(objs,m)]
    return out,trees
def seam(objs):
    # западная равнина стыкуется с основной землёй без ступеньки
    west=[o for o in objs if bbox(o)[0].x<-100][0];main=[o for o in objs if o is not west][0]
    Tm,_=ground_bvh([main]);XE=FOOT[0][0]*S
    def mh(x,y):
        r=Tm.ray_cast(Vector((max(x,XE+0.05),y,200)),Vector((0,0,-1)),500);return r[0].z if r[0] is not None else None
    xs=sorted(set(round(v.co.x,2) for v in west.data.vertices));x1=xs[-1];x2=max(x for x in xs if x<XE-0.5)
    for v in west.data.vertices:
        x,y=v.co.x,v.co.y
        if not(FOOT[0][2]*S-6<=y<=FOOT[0][3]*S+6):continue
        yy=min(max(y,FOOT[0][2]*S+0.3),FOOT[0][3]*S-0.3)
        if x>XE-0.5:
            h=mh(x,yy)
            if h is not None:v.co.z=h-0.04
        elif abs(x-x2)<0.3:
            z1=(mh(x1,yy) or 0)-0.04;t=mh(XE+0.05,yy) or 0;f=(XE-x2)/(x1-x2)
            v.co.z=(t+0.03-z1*f)/(1-f)
    west.data.update()
def ground_bvh(objs):
    bm=bmesh.new()
    for o in objs:
        t=bmesh.new();t.from_mesh(o.data);t.transform(o.matrix_world);me=bpy.data.meshes.new('tmp');t.to_mesh(me);t.free();bm.from_mesh(me);bpy.data.meshes.remove(me)
    return BVHTree.FromBMesh(bm),bm
def gh_at(T,x,z):
    r=T.ray_cast(Vector((x,-z,200)),Vector((0,0,-1)),500)
    return r[0].z if r[0] is not None else None
# ------------------------------------------------------------------ холмы-горизонт вокруг долины
def in_any(bx,by):
    for x0,x1,y0,y1 in FOOT:
        if x0*S<=bx<=x1*S and y0*S<=by<=y1*S:return True
    return False
def in_foot(bx,by,pad=0.0):
    return all(in_any(bx+dx,by+dy) for dx,dy in((0,0),(pad,0),(-pad,0),(0,pad),(0,-pad),(pad*.7,pad*.7),(-pad*.7,pad*.7),(pad*.7,-pad*.7),(-pad*.7,-pad*.7)))
def foot_dist(bx,by):
    best=1e9;cp=None
    for x0,x1,y0,y1 in FOOT:
        X0,X1,Y0,Y1=x0*S,x1*S,y0*S,y1*S;qx=min(max(bx,X0),X1);qy=min(max(by,Y0),Y1);d=math.hypot(bx-qx,by-qy)
        if d<best:best=d;cp=(qx,qy)
    return best,cp
def hills(T,mat):
    x0,x1,y0,y1=-260.0,170.0,-150.0,200.0;st=5.0
    nx=int((x1-x0)/st)+1;ny=int((y1-y0)/st)+1;V=[];F=[];UV=[]
    for j in range(ny):
        for i in range(nx):
            bx=x0+i*st;by=y0+j*st;d,cp=foot_dist(bx,by)
            if d<=0.01:
                h=T.ray_cast(Vector((bx,by,200)),Vector((0,0,-1)),500)[0];z=(h.z if h else 0)-1.6
            else:
                ix=cp[0]+(1.2 if cp[0]<bx else -1.2)*0;iy=cp[1]
                # точка чуть внутри подножия
                c=Vector((bx,by))-Vector(cp);c=c.normalized() if c.length>1e-6 else Vector((0,0));px,py=cp[0]-c.x*1.0,cp[1]-c.y*1.0
                h=T.ray_cast(Vector((px,py,200)),Vector((0,0,-1)),500)[0];h0=h.z if h else 0
                k=min(1.0,d/70.0);rise=26*(k*k*(3-2*k))**1.15
                nn=noise.noise(Vector((bx*0.018,by*0.018,0.3)))*7+noise.noise(Vector((bx*0.06,by*0.06,1.7)))*2.2
                z=h0-0.35+rise+nn*min(1.0,d/18.0)
            V.append((bx,by,z))
    for j in range(ny-1):
        for i in range(nx-1):
            a=j*nx+i;F.append((a,a+1,a+nx+1,a+nx))
    me=bpy.data.meshes.new('gr_hills');me.from_pydata(V,[],F);me.update()
    ul=me.uv_layers.new(name='UVMap')
    for p in me.polygons:
        for li in p.loop_indices:
            v=me.vertices[me.loops[li].vertex_index].co;ul.data[li].uv=(v.x/9.0,v.y/9.0)
    me.materials.append(mat);me.shade_smooth()
    o=bpy.data.objects.new('gr_hills',me);bpy.context.scene.collection.objects.link(o);return o
# ------------------------------------------------------------------ реквизит оранжереи
PROPN=['WaterHose','Microscope','Wateringcan','Bookstand','Soilbag','SoilbagAngled1','SoilbagAngled2','Shovel','Flask','FlaskTall','LittleShovel','BoxInside1','BoxInside',
       'Rake','Bottle1','Bottle','PlantPot1','PlantPot','PencilHolder','Book1','Book2','Book3','Book','TIncan1','TIncan2','Tincan2','TIncan3','Tincan3','Tincan4','BoxOpen1','BoxOpen','Pencil','Box1','Box','NoteBoard']
PROTO={}
def load_props():
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=PROPS)
    new=[o for o in bpy.data.objects if o not in before]
    for m in bpy.data.materials:
        if m.name.startswith('Greenhouse'):m.name='gr_props'
    for im in bpy.data.images:
        if not im.name.startswith('gr_'):
            im.name='gr_props_tex'
            if im.size[0]>2048:im.scale(2048,2048)
    for o in new:
        if o.type!='MESH':continue
        bake_xf(o)
        nm=o.name.split('_Greenhouse')[0]
        mn,mx=bbox(o);c=Vector(((mn.x+mx.x)/2,(mn.y+mx.y)/2,mn.z))
        o.data.transform(Matrix.Scale(0.01,4)@Matrix.Translation(-c))   # см -> м, центр основания в 0
        o.name='proto_'+nm;PROTO[nm]=o;o.hide_render=True
    for o in new:
        if o.type!='MESH' and o.name in bpy.data.objects:bpy.data.objects.remove(o)
def place(nm,part,x,y,z,yaw=0.0,s=1.0,tilt=(0,0)):
    p=PROTO[nm];o=p.copy();o.data=p.data.copy();bpy.context.scene.collection.objects.link(o);o.hide_render=False
    o.data.transform(Matrix.Translation(g2b(x,z,y))@Matrix.Rotation(yaw,4,'Z')@Matrix.Rotation(tilt[0],4,'X')@Matrix.Rotation(tilt[1],4,'Y')@Matrix.Scale(s,4))
    o['part']=part;return o
def item_proto(nm,part,s):
    p=PROTO[nm];o=p.copy();o.data=p.data.copy();bpy.context.scene.collection.objects.link(o);o.hide_render=False
    o.data.transform(Matrix.Scale(s,4));o['part']=part;return o
# ------------------------------------------------------------------ процедурные детали (координаты игры через lib)
def mats():
    M={}
    M['wood']=L.mat('gr_wood',(0.42,0.3,0.2),0.85,tex='wood_c',ntex='wood_n',dens=1.2)
    M['bark']=L.mat('gr_bark',(0.32,0.24,0.17),0.9,tex='wood_c',ntex='wood_n',dens=0.8)
    M['stone']=L.mat('gr_stone',(0.62,0.62,0.58),0.85,tex='stone_c',ntex='stone_n',dens=0.9)
    M['moss']=L.mat('gr_moss',(0.55,0.62,0.45),0.9,tex='rock_c',ntex='rock_n',dens=0.7)
    M['leaf']=L.mat('gr_leaf',(0.2,0.42,0.14),0.7,double=True)
    M['rope']=L.mat('gr_rope',(0.78,0.68,0.45),0.9,tex='straw_c',dens=3)
    M['paper']=L.mat('gr_paper',(0.95,0.93,0.86),0.8,double=True)
    M['glow']=L.mat('gr_glow',(0.5,1.0,0.6),0.4,emis=(0.45,1.0,0.55),es=3.0,double=True)
    M['bud']=L.mat('gr_bud',(1.0,0.85,0.5),0.4,emis=(1.0,0.8,0.45),es=2.5)
    M['shaft']=L.mat('gr_shaftst',(0.42,0.42,0.4),0.95,tex='stone_c',ntex='stone_n',dens=0.6)
    M['dark']=L.mat('gr_void',(0.02,0.02,0.03),1.0)
    return M
def P(name,geo,m,part,**kw):
    o=L.mk(name,geo,m,**kw);o['part']=part;return o
def gate(M):
    gx,gz=GATE;H=4.4;Wd=2.3
    for sx in(-1,1):
        x=gx+sx*Wd
        path=[Vector((x+math.sin(t*2.1+sx)*0.08,t*H,gz+math.cos(t*1.7)*0.06)) for t in np.linspace(0,1,9)]
        P('gr_gpil',L.tube(path,lambda t:0.36-0.08*t,n=10,twist=0.25),M['bark'],'grgate')
        # корни у основания
        for k in range(5):
            a=k/5*math.tau+sx;pth=[Vector((x+math.cos(a)*r*1.0,0.55-r*0.45,gz+math.sin(a)*r)) for r in np.linspace(0.15,1.1,6)]
            P('gr_groot',L.tube(pth,lambda t:0.16*(1-t)+0.03,n=6,cap1=True),M['bark'],'grgate')
    # касаги (верхняя балка, слегка изогнута) и нуки
    kas=[Vector((gx+u*(Wd+1.0),H+0.25+0.18*(abs(u)**2),gz)) for u in np.linspace(-1,1,11)]
    P('gr_gkas',L.tube(kas,0.24,n=8,flat=0.75),M['bark'],'grgate')
    nuki=[Vector((gx+u*(Wd+0.55),H-0.75,gz)) for u in np.linspace(-1,1,5)]
    P('gr_gnuki',L.tube(nuki,0.16,n=6),M['bark'],'grgate')
    # симэнава с сидэ
    rope=[Vector((gx+u*Wd*0.95,H-1.15-0.32*(1-u*u),gz+0.05)) for u in np.linspace(-1,1,13)]
    P('gr_grope',L.tube(rope,0.07,n=6,twist=0.8),M['rope'],'grgate')
    for u in(-0.6,-0.2,0.2,0.6):
        x=gx+u*Wd*0.95;y=H-1.15-0.32*(1-u*u)
        for k in range(3):
            P('gr_shide',L.box(0.07,0.09,0.004,(x+(0.05 if k%2 else -0.05),y-0.12-k*0.17,gz+0.08)),M['paper'],'grgate')
    # лианы-печать в проёме (исчезают после решения загадки)
    random.seed(7)
    for k in range(30):
        y0=random.uniform(0.1,H-1.2);y1=random.uniform(0.1,H-1.2)
        pts=[Vector((gx+u*(Wd-0.15),y0+(y1-y0)*(u+1)/2+math.sin(u*3+k)*0.4,gz+math.sin(u*5+k*1.3)*0.15)) for u in np.linspace(-1,1,12)]
        P('gr_vine',L.tube(pts,0.06+random.random()*0.05,n=6,twist=0.3),M['bark'],'grvine')
        for u in np.linspace(-0.92,0.92,9):
            i=int((u+1)/2*11);p=pts[i];a=random.uniform(0,math.tau)
            o=P('gr_vleaf',L.plate(0.24,0.13,0.01,c=(0,0,0)),M['leaf'],'grvine',smooth=False)
            o.data.transform(Matrix.Translation(g2b(p.x,p.z+0.06,p.y+0.05))@Matrix.Rotation(a,4,'Y')@Matrix.Rotation(math.pi/2,4,'X'))
    # печать: светящееся кольцо с тремя точками (три чаши)
    ring=L.lathe([(0.62,-0.035),(0.68,0.0),(0.62,0.035)],24,c=(0,0,0),f=None)
    o=P('gr_seal',ring,M['glow'],'grseal');o.data.transform(Matrix.Translation(g2b(gx,gz+0.12,2.05))@Matrix.Rotation(math.pi/2,4,'X'));
    for k in range(3):
        a=math.pi/2+k*math.tau/3;o=P('gr_sealdot',L.lathe([(0.0,-0.03),(0.09,-0.02),(0.09,0.02),(0.0,0.03)],10),M['glow'],'grseal')
        o.data.transform(Matrix.Translation(g2b(gx+math.cos(a)*0.32,gz+0.12,2.05+math.sin(a)*0.32))@Matrix.Rotation(math.pi/2,4,'X'))
def pedestals(M,T):
    top=[]
    for i,(x,z) in enumerate(POTS):
        y=gh_at(T,x,z);prof=[(0.42,0),(0.42,0.12),(0.32,0.18),(0.27,0.7),(0.36,0.78),(0.36,0.86)]
        P('gr_ped',L.lathe([(r,y+h) for r,h in prof],8,c=(x,0,z),cap1=True),M['moss'],'grgate',shade_flat=True)
        place('PlantPot','grgate',x,y+0.86,z,yaw=i*0.7,s=2.0)
        top.append([round(x,2),round(y+0.86+0.5,2),round(z,2)])
        # каменная табличка с вырезанным знаком
        P('gr_tab',L.box(0.18,0.12,0.03,(x,y+0.12,z+0.5)),M['stone'],'grgate')
    # каменные фонари торо по сторонам
    for sx in(-1,1):
        x=GATE[0]+sx*5.2;z=GATE[1]+3.2;y=gh_at(T,x,z)
        P('gr_toro',L.lathe([(0.32,y),(0.32,y+0.15),(0.12,y+0.2),(0.1,y+0.95),(0.25,y+1.0),(0.25,y+1.05)],6,c=(x,0,z),cap1=True),M['moss'],'grgate',shade_flat=True)
        P('gr_torob',L.box(0.22,0.2,0.22,(x,y+1.25,z)),M['stone'],'grgate')
        P('gr_torol',L.box(0.15,0.12,0.15,(x,y+1.25,z)),M['bud'],'grlamp')
        P('gr_toror',L.lathe([(0.42,y+1.45),(0.05,y+1.78)],6,c=(x,0,z),cap0=True),M['moss'],'grgate',shade_flat=True)
    return top
def portal(M,T):
    x,z=PORTAL;y=gh_at(T,x,z)
    random.seed(3)
    for k in range(7):
        a=k/7*math.tau+0.2;r=3.0;h=random.uniform(1.6,2.6)
        P('gr_mono',L.box(0.32,h/2,0.22,(x+math.cos(a)*r,y+h/2-0.1,z+math.sin(a)*r)),M['moss'],'grport',shade_flat=True)
    P('gr_pbase',L.lathe([(2.2,y-0.1),(2.2,y+0.08),(1.9,y+0.14)],24,c=(x,0,z),cap1=True),M['stone'],'grport')
    disc=L.lathe([(0.0,-0.01),(1.5,0.0),(0.0,0.01)],32)
    o=P('gr_pdisc',disc,M['glow'],'grportd');o.data.transform(Matrix.Translation(g2b(x,z,y+1.75))@Matrix.Rotation(math.pi/2,4,'X'))
    o=P('gr_pring',L.lathe([(1.55,-0.06),(1.66,0),(1.55,0.06)],32),M['stone'],'grport');o.data.transform(Matrix.Translation(g2b(x,z,y+1.75))@Matrix.Rotation(math.pi/2,4,'X'))
    return [round(x,2),round(y+1.75,2),round(z,2)]
def camp(M,T):
    cx,cz=CAMP;y=lambda x,z:gh_at(T,x,z)
    # доска-записка на двух столбах
    bx,bz=cx,cz-2.6;by=y(bx,bz)
    for sx in(-0.62,0.62):P('gr_post',L.box(0.06,0.95,0.06,(bx+sx,by+0.95,bz-0.03)),M['wood'],'grcamp')
    place('NoteBoard','grcamp',bx,by+0.85,bz,yaw=0,s=1.7)
    # стол на козлах
    tx,tz=cx+2.4,cz;ty=y(tx,tz)
    P('gr_table',L.box(1.1,0.04,0.45,(tx,ty+0.82,tz)),M['wood'],'grcamp')
    for sx in(-0.9,0.9):
        for sz in(-0.35,0.35):P('gr_leg',L.box(0.05,0.4,0.05,(tx+sx,ty+0.4,tz+sz)),M['wood'],'grcamp')
    T0=ty+0.86
    place('Microscope','grcamp',tx-0.55,T0,tz-0.1,yaw=0.4,s=1.6)
    place('FlaskTall','grcamp',tx+0.25,T0,tz-0.22,s=1.6);place('Bottle1','grcamp',tx+0.5,T0,tz-0.25,s=1.5)
    place('PencilHolder','grcamp',tx+0.75,T0,tz+0.2,s=1.6);place('Pencil','grcamp',tx+0.45,T0,tz+0.25,yaw=0.9,s=1.6)
    place('TIncan1','grcamp',tx+0.9,T0,tz-0.15,s=1.6);place('TIncan2','grcamp',tx-0.15,T0,tz+0.25,s=1.6)
    place('Shovel','grcamp',tx+1.25,ty,tz+0.1,yaw=0.2,s=1.25,tilt=(0,-0.25));place('Rake','grcamp',tx+1.25,ty,tz-0.3,yaw=-0.3,s=1.25,tilt=(0,-0.3))
    # пюпитр с книгами
    sx_,sz_=cx-2.6,cz+0.6;sy=y(sx_,sz_)
    place('Bookstand','grcamp',sx_,sy,sz_,yaw=math.pi/2,s=1.9)
    place('Book1','grcamp',sx_+0.6,sy,sz_+0.6,yaw=0.3,s=1.6);place('Book2','grcamp',sx_+0.62,sy+0.06,sz_+0.6,yaw=0.8,s=1.6)
    # мешки с землёй, ящики
    for k,(nm,dx,dz,yw) in enumerate([('Soilbag',0.6,2.6,0.2),('SoilbagAngled1',1.3,2.3,1.0),('SoilbagAngled2',0.0,2.9,2.4)]):
        place(nm,'grcamp',cx+dx,y(cx+dx,cz+dz),cz+dz,yaw=yw,s=1.5)
    place('Box','grcamp',cx-1.8,y(cx-1.8,cz+2.6),cz+2.6,yaw=0.3,s=1.5);place('Box1','grcamp',cx-1.75,y(cx-1.8,cz+2.6)+0.35,cz+2.55,yaw=0.8,s=1.5)
    place('BoxOpen','grcamp',cx-2.9,y(cx-2.9,cz+2.0),cz+2.0,yaw=-0.4,s=1.5);place('BoxInside','grcamp',cx-2.9,y(cx-2.9,cz+2.0),cz+2.0,yaw=-0.4,s=1.5)
    place('WaterHose','grcamp',cx+3.9,y(cx+3.9,cz+2.2),cz+2.2,yaw=0.5,s=1.0)
    place('PlantPot1','grcamp',cx+1.6,y(cx+1.6,cz-2.4),cz-2.4,s=1.6)
    place('Tincan2','grcamp',cx+0.3,y(cx+0.3,cz+1.5),cz+1.5,yaw=1,s=1.6)
    cols=[[bx,bz,0.8],[tx-0.6,tz,0.65],[tx+0.6,tz,0.65],[tx+1.3,tz,0.35],[sx_,sz_,0.55],[cx+0.6,cz+2.6,0.55],[cx+1.3,cz+2.3,0.5],[cx,cz+2.9,0.5],
          [cx-1.8,cz+2.6,0.5],[cx-2.9,cz+2.0,0.5],[cx+3.9,cz+2.2,0.6],[cx+1.6,cz-2.4,0.35]]
    return dict(board=[round(bx,2),round(bz+0.5,2)],stand=[round(sx_,2),round(sz_,2),round(sy+1.15,2)],table=[round(tx,2),round(T0,2),round(tz,2)]),cols
def sprout(M):
    # росток (растёт в чашах после решения), центр основания в 0
    st=[Vector((math.sin(t*2.2)*0.05,t*0.55,math.cos(t*1.6)*0.04)) for t in np.linspace(0,1,7)]
    P('gr_spst',L.tube(st,lambda t:0.035*(1-t)+0.012,n=6),M['leaf'],'grsprout')
    for k in range(5):
        a=k/5*math.tau;h=0.15+k*0.08
        o=P('gr_spl',L.plate(0.28,0.12,0.01,c=(0.15,h,0),bend=0.05),M['leaf'],'grsprout',smooth=False);o.data.transform(Matrix.Rotation(a,4,'Z'))
    P('gr_spb',L.lathe([(0.0,0.52),(0.07,0.56),(0.06,0.64),(0.0,0.69)],8),M['bud'],'grsprout')
def shaft(M):
    # шахта колодца: каменный цилиндр (нормали внутрь), корни; верх в y=0, глубина 40 м
    n=20;Hh=40.0;R=1.55;rings=[]
    for j in range(41):
        y=-Hh*j/40;rings.append([(math.cos(a)*R*(1+0.05*noise.noise(Vector((a*2,y*0.4,0)))),y,math.sin(a)*R*(1+0.05*noise.noise(Vector((a*2,y*0.4,1))))) for a in np.linspace(0,math.tau,n,endpoint=False)])
    o=P('gr_shaft',L.loft(rings,True,False,False,us=3.0,vs=12.0),M['shaft'],'grshaft',recalc=False)
    o.data.flip_normals()
    random.seed(11)
    for k in range(70):   # выступающие камни
        a=random.uniform(0,math.tau);y=-random.uniform(0.5,39);r=R-0.06
        P('gr_shst',L.box(random.uniform(0.12,0.22),random.uniform(0.08,0.14),0.08,(math.cos(a)*r,y,math.sin(a)*r)),M['shaft'],'grshaft',shade_flat=True)
    for k in range(14):   # корни
        a=random.uniform(0,math.tau);y0=-random.uniform(0.5,30);L_=random.uniform(1.5,4)
        pts=[Vector((math.cos(a)*(R-0.05-0.25*t),y0-L_*t,math.sin(a)*(R-0.05-0.25*t)+math.sin(t*5)*0.08)) for t in np.linspace(0,1,7)]
        P('gr_shroot',L.tube(pts,lambda t:0.06*(1-t)+0.01,n=5),M['bark'],'grshaft')
    o=P('gr_shbot',L.lathe([(0.0,-39.9),(R,-39.9)],n),M['glow'],'grshaft')
def skyring(M):
    o=P('gr_ring',L.lathe([(1.6,-0.12),(1.85,0.0),(1.6,0.12),(1.35,0.0)],32,cap0=False),M['glow'],'grring')
    o2=P('gr_ringd',L.lathe([(0.0,0.0),(1.45,0.0)],32),M['dark'],'grring')
# ------------------------------------------------------------------ nav
def navbake(T,circles,spawn):
    gx0,gx1,gz0,gz1=NAVB;w=int(round((gx1-gx0)/CS));h=int(round((gz1-gz0)/CS))
    H=np.full((h,w),np.nan);NZ=np.zeros((h,w));dn=Vector((0,0,-1))
    for j in range(h):
        z=gz0+(j+.5)*CS
        for i in range(w):
            x=gx0+(i+.5)*CS;r=T.ray_cast(Vector((x,-z,200)),dn,500)
            if r[0] is not None:H[j,i]=r[0].z;NZ[j,i]=abs(r[1].z)
    Wk=(~np.isnan(H))&(NZ>0.8)
    # край подножия: 1.2 м от края — нельзя
    for j in range(h):
        z=gz0+(j+.5)*CS
        for i in range(w):
            if Wk[j,i] and not in_foot(gx0+(i+.5)*CS,-z,1.2):Wk[j,i]=False
    # деревья/реквизит
    for (x,z,r) in circles:
        i0=int((x-r-gx0)/CS)-1;i1=int((x+r-gx0)/CS)+1;j0=int((z-r-gz0)/CS)-1;j1=int((z+r-gz0)/CS)+1
        for j in range(max(0,j0),min(h,j1+1)):
            for i in range(max(0,i0),min(w,i1+1)):
                if math.hypot(gx0+(i+.5)*CS-x,gz0+(j+.5)*CS-z)<r:Wk[j,i]=False
    Hn=np.where(np.isnan(H),-99,H);E=Wk.copy()
    for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
        sh=np.roll(np.roll(Hn,-dj,0),-di,1);E[np.abs(Hn-sh)>0.45]=False
    E[0,:]=E[-1,:]=E[:,0]=E[:,-1]=False
    si=int((spawn[0]-gx0)/CS);sj=int((spawn[1]-gz0)/CS)
    R=np.zeros_like(E);st=[(sj,si)];R[sj,si]=1
    while st:
        j,i=st.pop()
        for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
            a,b=j+dj,i+di
            if 0<=a<h and 0<=b<w and E[a,b] and not R[a,b]:R[a,b]=1;st.append((a,b))
    print('NAV cells walk',int(Wk.sum()),'reach',int(R.sum()),'of',w*h)
    G=np.where(np.isnan(H),np.nanmin(H),H)
    ho=float(np.floor(np.nanmin(H)-1));gh=np.clip(np.round((G-ho)*100),0,65535).astype('<u2')
    nav=dict(x0=gx0,z0=gz0,cs=CS,w=w,h=h,ho=ho,b=base64.b64encode(np.packbits(R.astype(np.uint8).ravel()).tobytes()).decode(),gh=base64.b64encode(gh.tobytes()).decode())
    np.save(os.path.join(OUT,'nav.npy'),R);np.save(os.path.join(OUT,'navh.npy'),H)
    return nav,R
# ------------------------------------------------------------------ main
def main():
    if not os.path.exists(os.path.join(HERE,'..','tex','wood_c.png')):TX.build()
    clean()
    groups,trees=landscape()
    T,_=ground_bvh(groups['gr_ground'])
    H=hills(T,bpy.data.materials['gr_ground'])
    load_props();M=mats()
    gate(M);pots=pedestals(M,T);port=portal(M,T);cp,ccols=camp(M,T);sprout(M);shaft(M);skyring(M)
    # предметы загадки (экспорт в нуле; расставляет игра)
    its=dict(shovel=('LittleShovel',1.9,'Садовая лопатка'),can=('Wateringcan',1.35,'Лейка'),book=('Book',1.7,'Травник отшельника'),flask=('Flask',1.8,'Склянка'),bottle=('Bottle',1.6,'Пустая бутыль'))
    items={}
    for k,(nm,s,label) in its.items():
        item_proto(nm,'gri_'+k,s);x,z=ITEMS[k]
        y=gh_at(T,x,z) if k not in('book','flask') else None
        if k=='book':y=cp['stand'][2]
        if k=='flask':y=cp['table'][1]
        items[k]=dict(p=[round(x,2),round(y,3),round(z,2)],n=label)
    # коллайдеры: стволы деревьев + реквизит + врата + чаши + портал
    cols=[[t[0],t[1],0.42] for t in trees]+ccols
    for (x,z) in POTS:cols.append([x,z,0.5])
    for sx in(-1,1):cols.append([GATE[0]+sx*2.3,GATE[1],0.5]);cols.append([GATE[0]+sx*5.2,GATE[1]+3.2,0.4])
    for k in range(7):
        a=k/7*math.tau+0.2;cols.append([PORTAL[0]+math.cos(a)*3.0,PORTAL[1]+math.sin(a)*3.0,0.45])
    nav,R=navbake(T,[[c[0],c[1],c[2]*0.8] for c in cols],LAND_P)
    # имена для игры: LV__<part>__k; объединение по (часть, материал) — меньше вызовов отрисовки
    for o in [x for x in bpy.data.objects if x.type=='MESH' and x.name.startswith('proto_') and 'part' not in x]:bpy.data.objects.remove(o)
    byk={}
    for o in [x for x in bpy.data.objects if x.type=='MESH']:
        m=o.data.materials[0].name if o.data.materials else ''
        part=o.get('part') or ('grtree' if m.startswith('gr_tree') else 'grgrass' if m.startswith('gr_grass') else 'grsky' if m=='gr_sky' else 'grbg' if m in('gr_hillA','gr_hillB','gr_snow') else 'green')
        o['part']=part
        if part in('grtree','grgrass'):continue
        byk.setdefault((part,m),[]).append(o)
    for (part,m),objs in byk.items():
        if len(objs)>1:j=join(objs,'j_'+part);j['part']=part
    k=0
    for o in [x for x in bpy.data.objects if x.type=='MESH']:
        if o.name.startswith('proto_') and 'part' not in o:bpy.data.objects.remove(o);continue
        m=o.data.materials[0].name if o.data.materials else ''
        part=o.get('part') or ('grtree' if m.startswith('gr_tree') else 'grgrass' if m.startswith('gr_grass') else 'grsky' if m=='gr_sky' else 'grbg' if m in('gr_hillA','gr_hillB','gr_snow') else 'green')
        o.name='LV__%s__%d'%(part,k);k+=1
    for im in bpy.data.images:
        if im.size[0] and im.packed_file is None:
            try:im.pack()
            except Exception:pass
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True)
    f=os.path.join(HERE,'..','out','niten_green.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_image_format='WEBP',export_image_quality=80,export_apply=True,export_yup=True,
        export_tangents=False,export_morph=False,export_skins=False,export_animations=False)
    print('GREEN GLB',os.path.getsize(f))
    D=dict(nav=nav,S=S,land=list(LAND_P),landY=round(gh_at(T,*LAND_P),3),camp=list(CAMP),board=cp['board'],stand=cp['stand'],gate=[GATE[0],round(gh_at(T,*GATE),2),GATE[1]],
           pots=pots,portal=port,items=items,cols=[[round(c[0],2),round(c[1],2),round(c[2],2)] for c in cols])
    open(os.path.join(ROOT,'game','src','gGd.js'),'w').write('// v0.16: «Зелёная пустошь» (генерирует blender/ext/green.py): nav с высотами, коллайдеры деревьев, точки загадки.\nconst GREEND='+json.dumps(D,separators=(',',':'))+';\n')
    json.dump({k:v for k,v in D.items() if k!='nav'},open(os.path.join(OUT,'green.json'),'w'),indent=0)
    print('gGd.js ok trees',len(trees),'cols',len(cols))
if __name__=='__main__':main()
