# v0.17: ГЛАВА 8 «Путь» — храм из готовой модели enviroment_temple.glb (Sketchfab, Lucia Criscuolo, CC-BY-4.0)
#   + процедурные мосты к двум островам со светящимися столпами и алтари двух катан (Кьору — синяя, Шиори — красная).
# python3 blender/ext/temple.py   -> blender/out/niten_temple.glb + game/src/gTd.js (nav с высотами, точки алтарей)
# Исходник: $NITEN_SRC/temple/enviroment_temple.glb (в git не хранится)
import bpy,bmesh,sys,os,json,math,base64,random
import numpy as np
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'..'))
import tex as TX
import lib as L
SRC=os.environ.get('NITEN_SRC','/data/src')
TEMPLE=os.path.join(SRC,'temple','enviroment_temple.glb')
ROOT=os.path.join(HERE,'..','..');OUT=os.path.join(HERE,'..','out','temple');os.makedirs(OUT,exist_ok=True)
S=100.0        # модель в сотых долях: x100 -> метры (дорожки 4 м, столпы 9 м, стены 12 м)
CS=0.25        # шаг nav-сетки (мосты узкие)
NAVB=(-6.0,28.0,-26.0,26.0)   # x0,x1,z0,z1 (игровые координаты)
WATER_Y=-0.14  # вода в каналах чуть ниже пола
# игровые координаты (x, z=-y_blender): спавн у западного входа, лицом на восток (+x); слева (z<0) — северный остров
SPAWN=(1.6,0.0)
ISL={'blue':(10.0,-10.0),'red':(11.0,10.0)}        # центры островов: синяя (левая) / красная (правая)
BRIDGE={'blue':(10.0,-1.75,-6.25),'red':(11.0,1.75,6.25)}   # x, z0 (у дорожки), z1 (у острова)
BW=1.25        # полуширина моста
def g2b(x,z,y=0.0):return Vector((x,-z,y))
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
REN={'caminos1':'tp_path','canales1':'tp_canal','piso':'tp_floor','deco':'tp_deco','pared2':'tp_wall','oceantest':'tp_water'}
FLOOR={'tp_path','tp_floor','tp_bstone'}
def temple():
    bpy.ops.import_scene.gltf(filepath=TEMPLE)
    for m in bpy.data.materials:
        if m.name in REN:m.name=REN[m.name]
    for im in list(bpy.data.images):  # list(): переименование меняет порядок коллекции
        if not im.name.startswith('tp_'):im.name='tp_'+im.name
        if im.size[0]>1024:im.scale(1024,1024)
    meshes=[o for o in bpy.data.objects if o.type=='MESH']
    for o in meshes:bake_xf(o)
    for o in [o for o in bpy.data.objects if o.type!='MESH']:bpy.data.objects.remove(o)
    for o in meshes:
        o.data.transform(Matrix.Scale(S,4))
        m=o.data.materials[0].name if o.data.materials else ''
        if m=='tp_water':
            for v in o.data.vertices:v.co.z=WATER_Y
            o['part']='tpwater'
        else:o['part']='tpl'
    return meshes
def mats():
    M={}
    M['stone']=L.mat('tp_bstone',(0.66,0.62,0.56),0.85,tex='stone_c',ntex='stone_n',dens=0.9)
    M['dark']=L.mat('tp_bdark',(0.22,0.2,0.2),0.7,tex='stone_c',ntex='stone_n',dens=1.1)
    M['wood']=L.mat('tp_lacq',(0.08,0.035,0.03),0.35,coat=0.6)
    M['gold']=L.mat('tp_gold',(0.85,0.62,0.25),0.3,metal=1.0)
    M['silkB']=L.mat('tp_silkB',(0.12,0.22,0.6),0.55,emis=(0.1,0.25,0.9),es=0.35,double=True)
    M['silkR']=L.mat('tp_silkR',(0.6,0.08,0.06),0.55,emis=(0.9,0.12,0.06),es=0.35,double=True)
    M['rope']=L.mat('tp_rope',(0.85,0.76,0.52),0.9,tex='straw_c',dens=3)
    M['paper']=L.mat('tp_paper',(0.95,0.93,0.86),0.8,double=True)
    M['candle']=L.mat('tp_candle',(0.95,0.9,0.78),0.6)
    M['flame']=L.mat('tp_flame',(1.0,0.75,0.35),0.4,emis=(1.0,0.7,0.3),es=4.0)
    return M
def P(name,geo,m,part,**kw):
    o=L.mk(name,geo,m,**kw);o['part']=part;return o
def bridge(M,k):
    # каменный мост с невысокой аркой и перилами; концы заходят на пол дорожки/острова (без ступеньки)
    x,z0,z1=BRIDGE[k];sg=1 if z1>z0 else -1;n=14;rise=0.32
    za,zb=z0-sg*0.45,z1+sg*0.45
    def yat(t):return rise*math.sin(math.pi*t)
    rings=[]
    for i in range(n+1):
        t=i/n;z=za+(zb-za)*t;y=yat(t)
        rings.append([(x-BW,y+0.02,z),(x+BW,y+0.02,z),(x+BW,y-0.38,z),(x-BW,y-0.38,z)])
    P('tp_bdeck',L.loft(rings,True,True,True,us=1.0,vs=1.0),M['stone'],'tpbridge',shade_flat=True)
    for sx in(-1,1):   # перила: столбики + брус
        for i in range(0,n+1,2):
            t=i/n;z=za+(zb-za)*t;y=yat(t)
            P('tp_bpost',L.box(0.11,0.38,0.11,(x+sx*(BW-0.12),y+0.4,z)),M['dark'],'tpbridge',shade_flat=True)
        rail=[Vector((x+sx*(BW-0.12),yat(i/n)+0.82,za+(zb-za)*i/n)) for i in range(n+1)]
        P('tp_brail',L.tube(rail,0.075,n=6,flat=0.8),M['dark'],'tpbridge')
        for e in(0,n):   # гибоси — навершия на крайних столбах
            t=e/n;z=za+(zb-za)*t;y=yat(t)
            P('tp_bgib',L.lathe([(0.0,y+0.78),(0.13,y+0.86),(0.11,y+0.98),(0.0,y+1.12)],10,c=(x+sx*(BW-0.12),0,z)),M['gold'],'tpbridge')
    return [x-BW,x+BW,min(za,zb),max(za,zb)]
def altar(M,k):
    # алтарь катаны: ступенчатый каменный постамент, шёлк цвета катаны, лакированная подставка (катана-какэ), свечи
    x,z=ISL[k];silk=M['silkB'] if k=='blue' else M['silkR']
    P('tp_alt0',L.box(1.15,0.09,0.75,(x,0.09,z)),M['dark'],'tpaltar',shade_flat=True)
    P('tp_alt1',L.box(0.95,0.22,0.55,(x,0.4,z)),M['stone'],'tpaltar',shade_flat=True)
    P('tp_alt2',L.box(1.02,0.05,0.62,(x,0.66,z)),M['dark'],'tpaltar',shade_flat=True)
    # шёлковое покрывало, свисающее спереди и сзади
    cl=[[(x-0.8,0.715,z-0.66),(x+0.8,0.715,z-0.66)],[(x-0.8,0.72,z-0.4),(x+0.8,0.72,z-0.4)],[(x-0.8,0.72,z+0.4),(x+0.8,0.72,z+0.4)],[(x-0.8,0.715,z+0.66),(x+0.8,0.715,z+0.66)]]
    vs=[];fs=[];us=[]
    pts=[(x-0.82,0.42,z-0.67),(x+0.82,0.42,z-0.67),(x+0.82,0.72,z-0.66),(x-0.82,0.72,z-0.66),(x-0.82,0.72,z+0.66),(x+0.82,0.72,z+0.66),(x+0.82,0.42,z+0.67),(x-0.82,0.42,z+0.67)]
    o=L.new_obj('tp_silk',pts,[(0,1,2,3),(3,2,5,4),(4,5,6,7)],silk,uvs=[[(0,0),(1,0),(1,1),(0,1)]]*3,smooth=False);o['part']='tpaltar'
    # подставка: основание + две стойки с выемками
    P('tp_kbase',L.box(0.62,0.035,0.16,(x,0.765,z)),M['wood'],'tpaltar',shade_flat=True)
    for sx in(-0.42,0.42):
        P('tp_kpost',L.box(0.04,0.13,0.11,(x+sx,0.93,z)),M['wood'],'tpaltar',shade_flat=True)
        P('tp_kcap',L.box(0.05,0.012,0.12,(x+sx,1.065,z)),M['gold'],'tpaltar',shade_flat=True)
    # свечи и симэнава вокруг постамента
    for (dx,dz) in((-0.9,-0.55),(0.9,-0.55),(-0.9,0.55),(0.9,0.55)):
        P('tp_cand',L.lathe([(0.0,0.18),(0.045,0.18),(0.045,0.42),(0.0,0.42)],8,c=(x+dx*1.25,0,z+dz*1.3)),M['candle'],'tpaltar')
        P('tp_cstand',L.lathe([(0.0,0.0),(0.09,0.0),(0.05,0.05),(0.03,0.18),(0.07,0.2),(0.0,0.2)],8,c=(x+dx*1.25,0,z+dz*1.3)),M['gold'],'tpaltar')
        P('tp_flame',L.lathe([(0.0,0.43),(0.02,0.47),(0.0,0.53)],6,c=(x+dx*1.25,0,z+dz*1.3)),M['flame'],'tpglow')
    rope=[Vector((x+math.cos(a)*1.45,0.95+0.05*math.cos(a*8),z+math.sin(a)*1.05)) for a in np.linspace(0,math.tau,41)]
    for (dx,dz) in((-1,-1),(1,-1),(-1,1),(1,1)):
        P('tp_rpost',L.box(0.05,0.5,0.05,(x+dx*1.45*0.7071,0.5,z+dz*1.05*0.7071)),M['wood'],'tpaltar',shade_flat=True)
    rp=[Vector((x+math.cos(a)*1.45,0.92-0.08*abs(math.sin(a*2)),z+math.sin(a)*1.05)) for a in np.linspace(0,math.tau,49)]
    P('tp_rope',L.tube(rp,0.03,n=5,twist=0.6,cap0=False,cap1=False),M['rope'],'tpaltar')
    for k2 in range(8):
        a=(k2+0.5)/8*math.tau;px,pz=x+math.cos(a)*1.45,z+math.sin(a)*1.05;py=0.92-0.08*abs(math.sin(a*2))
        for j in range(3):P('tp_shide',L.box(0.04,0.06,0.003,(px,py-0.09-j*0.12,pz)),M['paper'],'tpaltar')
    return [round(x,3),1.09,round(z,3)]
# ------------------------------------------------------------------ nav
def scene_bvh():
    bm=bmesh.new();tags=[]
    for o in [x for x in bpy.data.objects if x.type=='MESH']:
        m=o.data.materials[0].name if o.data.materials else ''
        t=bmesh.new();t.from_mesh(o.data);t.transform(o.matrix_world);bmesh.ops.triangulate(t,faces=t.faces[:])
        me=bpy.data.meshes.new('tmp');t.to_mesh(me);t.free();n0=len(bm.faces);bm.from_mesh(me);bpy.data.meshes.remove(me)
        tags+= [m]*(len(bm.faces)-n0)
    bm.faces.ensure_lookup_table()
    return BVHTree.FromBMesh(bm),tags,bm
def navbake(circles):
    T,tags,_=scene_bvh()
    gx0,gx1,gz0,gz1=NAVB;w=int(round((gx1-gx0)/CS));h=int(round((gz1-gz0)/CS))
    H=np.full((h,w),np.nan);Wk=np.zeros((h,w),bool);dn=Vector((0,0,-1))
    for j in range(h):
        z=gz0+(j+.5)*CS
        for i in range(w):
            x=gx0+(i+.5)*CS;r=T.ray_cast(Vector((x,-z,40)),dn,100)
            if r[0] is None:continue
            H[j,i]=r[0].z
            if tags[r[2]] in FLOOR and abs(r[1].z)>0.8 and -0.3<r[0].z<0.8:Wk[j,i]=True
    for (x,z,rr) in circles:
        for j in range(h):
            zz=gz0+(j+.5)*CS
            if abs(zz-z)>rr+0.5:continue
            for i in range(w):
                xx=gx0+(i+.5)*CS
                if math.hypot(xx-x,zz-z)<rr:Wk[j,i]=False
    # отступ 0.35 м от края пола (стены, каналы, столпы): эрозия
    E=Wk.copy();k=int(math.ceil(0.35/CS))
    for dj in range(-k,k+1):
        for di in range(-k,k+1):
            if dj*dj+di*di>k*k:continue
            E&=np.roll(np.roll(Wk,dj,0),di,1)
    Hn=np.where(np.isnan(H),-99,H)
    for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
        sh=np.roll(np.roll(Hn,-dj,0),-di,1);E[np.abs(Hn-sh)>0.3]=False
    E[0,:]=E[-1,:]=E[:,0]=E[:,-1]=False
    si=int((SPAWN[0]-gx0)/CS);sj=int((SPAWN[1]-gz0)/CS)
    R=np.zeros_like(E);st=[(sj,si)];R[sj,si]=1
    while st:
        j,i=st.pop()
        for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
            a,b=j+dj,i+di
            if 0<=a<h and 0<=b<w and E[a,b] and not R[a,b]:R[a,b]=1;st.append((a,b))
    print('NAV walk',int(Wk.sum()),'reach',int(R.sum()),'of',w*h)
    G=np.where(R>0,H,0.0);G=np.where(np.isnan(G),0.0,G)
    ho=-2.0;gh=np.clip(np.round((G-ho)*100),0,65535).astype('<u2')
    nav=dict(x0=gx0,z0=gz0,cs=CS,w=w,h=h,ho=ho,b=base64.b64encode(np.packbits(R.astype(np.uint8).ravel()).tobytes()).decode(),gh=base64.b64encode(gh.tobytes()).decode())
    np.save(os.path.join(OUT,'nav.npy'),R);np.save(os.path.join(OUT,'navh.npy'),H)
    return nav,R
# ------------------------------------------------------------------ main
def main():
    if not os.path.exists(os.path.join(HERE,'..','tex','wood_c.png')):TX.build()
    clean();temple();M=mats()
    br={k:bridge(M,k) for k in ISL};alt={k:altar(M,k) for k in ISL}
    nav,R=navbake([(ISL[k][0],ISL[k][1],1.75) for k in ISL])
    # имена для игры LV__<part>__k; объединение по (часть, материал)
    byk={}
    for o in [x for x in bpy.data.objects if x.type=='MESH']:
        m=o.data.materials[0].name if o.data.materials else '';byk.setdefault((o.get('part','tpl'),m),[]).append(o)
    for (part,m),objs in byk.items():
        j=join(objs,'j_'+part);j['part']=part
    k=0
    for o in [x for x in bpy.data.objects if x.type=='MESH']:o.name='LV__%s__%d'%(o['part'],k);k+=1
    for im in bpy.data.images:
        if im.size[0] and im.packed_file is None:
            try:im.pack()
            except Exception:pass
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True)
    f=os.path.join(HERE,'..','out','niten_temple.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_image_format='WEBP',export_image_quality=82,export_apply=True,export_yup=True,
        export_tangents=False,export_morph=False,export_skins=False,export_animations=False)
    print('TEMPLE GLB',os.path.getsize(f))
    pil=[]
    for (cx,cz) in ISL.values():
        for dx in(-3.75,3.75):
            for dz in(-3.75,3.75):pil.append([cx+dx,cz+dz])
    D=dict(nav=nav,spawn=list(SPAWN),alt=alt,isl={k:list(v) for k,v in ISL.items()},bridges=br,pil=pil,bounds=[-1.6,22.6,-21.6,21.6],water=WATER_Y)
    open(os.path.join(ROOT,'game','src','gTd.js'),'w').write('// v0.17: «Путь» (генерирует blender/ext/temple.py): nav с высотами, алтари катан, мосты.\nconst TEMPLED='+json.dumps(D,separators=(',',':'))+';\n')
    json.dump({k:v for k,v in D.items() if k!='nav'},open(os.path.join(OUT,'temple.json'),'w'),indent=0)
    print('gTd.js ok')
if __name__=='__main__':main()
