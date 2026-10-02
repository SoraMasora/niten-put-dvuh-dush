# NITEN v0.10 — сборка всех внешних моделей в один GLB (blender/out/niten_ext.glb):
#  XS__<имя> — скин на 13 суставов рига игры (hero, sota, ronin, archer, musha, boss),
#  KM__body + KM_rig — Кама-итати (bunny_rat) с клипами KM_idle/run/crouch/leap/hit,
#  PK__body — фонарь-тыква (pumpkin_monster), KN__sword/KN__saya/KN__TIP — катана героя (katana.glb).
import bpy,sys,os,math
import numpy as np
from mathutils import Vector,Matrix
sys.path.insert(0,os.path.dirname(__file__))
from cfg import SRC,PREP
from bunny import build_bunny
OUT=os.path.join(os.path.dirname(__file__),'..','out')
os.makedirs(OUT,exist_ok=True)
for o in list(bpy.data.objects):bpy.data.objects.remove(o)
for n in['hero','sota','ronin','archer','musha','boss']:
    with bpy.data.libraries.load(os.path.join(PREP,n+'_rig.blend')) as (src,dst):dst.objects=[x for x in src.objects if x.startswith('XS_')]
    for o in dst.objects:bpy.context.scene.collection.objects.link(o)
# тыква
with bpy.data.libraries.load(os.path.join(PREP,'pumpkin.blend')) as (src,dst):dst.objects=['pumpkin']
pk=dst.objects[0];bpy.context.scene.collection.objects.link(pk);pk.name='PK__body'
co=np.array([v.co[:] for v in pk.data.vertices]);c=(co.min(0)+co.max(0))/2
pk.data.transform(Matrix.Scale(0.9,4)@Matrix.Translation(Vector(-c)))
for m in pk.data.materials:
    if m:m.name='PK_skin'
build_bunny()
# катана
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC,'katana.glb'));bpy.context.view_layer.update()
new=[o for o in bpy.data.objects if o not in before]
def grab(pref):
    P=[]
    for o in new:
        if o.type=='MESH' and o.name.split('|')[0].split('_')[0] in pref:P.append(o)
    return P
def join(objs,name):
    for o in objs:
        mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    if len(objs)>1:bpy.ops.object.join()
    o=bpy.context.view_layer.objects.active;o.name=name;return o
sw=join(grab({'Sword'}),'KN__sword');sa=join(grab({'Scabbard','Rope'}),'KN__saya')
for o in list(bpy.data.objects):
    if o in new and o not in(sw,sa) and o.name in bpy.data.objects:bpy.data.objects.remove(o)
V=np.array([v.co[:] for v in sw.data.vertices])
ax=np.argmax(V.max(0)-V.min(0));xs=V[:,ax];bins=np.linspace(xs.min(),xs.max(),120)
ext=[(np.ptp(V[(xs>=bins[i])&(xs<bins[i+1])][:,[k for k in range(3) if k!=ax]],axis=0).max() if ((xs>=bins[i])&(xs<bins[i+1])).sum()>3 else 0) for i in range(119)]
ti=int(np.argmax(ext));tx=(bins[ti]+bins[ti+1])/2
side=1 if xs.max()-tx>tx-xs.min() else -1
sel=V[np.abs(xs-tx)<(bins[1]-bins[0])*1.5];tc=sel.mean(0)
tip=V[np.argmax(side*xs)];u=(tip-tc)/np.linalg.norm(tip-tc)
mid=V[np.abs(xs-(tx+tip[ax])/2)<(bins[1]-bins[0])*4];mc=mid.mean(0)-tc;cv=mc-u*(mc@u);cv/=np.linalg.norm(cv)
L=np.linalg.norm(tip-tc);s=0.75/L;w=np.cross(u,cv)
# базис: u -> -Y, cv -> +Z, w -> ?
Rm=np.stack([u,cv,w]);Tg=np.stack([[0,-1,0],[0,0,1],np.cross([0,-1,0],[0,0,1])])
R3=Tg.T@Rm
M=Matrix.Translation((0,-0.075,0))@Matrix(((R3[0,0]*s,R3[0,1]*s,R3[0,2]*s,0),(R3[1,0]*s,R3[1,1]*s,R3[1,2]*s,0),(R3[2,0]*s,R3[2,1]*s,R3[2,2]*s,0),(0,0,0,1)))@Matrix.Translation(Vector(-tc))
sw.data.transform(M);sa.data.transform(M)
t=bpy.data.objects.new('KN__TIP',None);bpy.context.scene.collection.objects.link(t);t.location=M@Vector(tip)
print('KATANA tsuba->tip',round(L,2),'tip',t.location[:])
for o in(sw,sa):
    for m in o.data.materials:
        if m:m.name='KN_mat'
# текстуры: оставляем только base color / emission (normal/roughness/metallic в игре не нужны — экономия размера)
for m in bpy.data.materials:
    if not m.use_nodes:continue
    nt=m.node_tree
    for n in list(nt.nodes):
        if n.type=='BSDF_PRINCIPLED':
            for k in('Normal','Roughness','Metallic','Specular IOR Level','Alpha'):
                for l in list(n.inputs[k].links) if k in n.inputs else[]:nt.links.remove(l)
    used=set()
    for n in nt.nodes:
        if n.type=='BSDF_PRINCIPLED':
            for k in('Base Color','Emission Color'):
                st=[l.from_node for l in n.inputs[k].links]
                while st:
                    x=st.pop();used.add(x);st+=[l.from_node for i in x.inputs for l in i.links]
    for n in list(nt.nodes):
        if n.type in('TEX_IMAGE','NORMAL_MAP','SEPARATE_COLOR','SEPRGB','MAPPING','TEX_COORD','UVMAP') and n not in used:nt.nodes.remove(n)
    for n in nt.nodes:
        if n.type=='BSDF_PRINCIPLED':
            n.inputs['Roughness'].default_value=0.75;n.inputs['Metallic'].default_value=0.0
big=('hero','boss','sota')
for im in list(bpy.data.images):
    if im.users==0:bpy.data.images.remove(im);continue
    if im.size[0]==0:continue
    own=[m.name for m in bpy.data.materials if m.use_nodes and any(n.type=='TEX_IMAGE' and n.image==im for n in m.node_tree.nodes)]
    lim=1024 if any(o.split('_m')[0] in big for o in own) and max(im.size)>=1024 else 512
    if max(im.size)>lim:k=lim/max(im.size);im.scale(max(4,int(im.size[0]*k)),max(4,int(im.size[1]*k)))
# родной клип Take 001 кролика дублирует KM_idle
for a in list(bpy.data.actions):
    if a.name.startswith('Take 001'):
        for o in bpy.data.objects:
            ad=o.animation_data
            if ad:
                for t in list(ad.nla_tracks):
                    if any(st.action==a for st in t.strips):ad.nla_tracks.remove(t)
                if ad.action==a:ad.action=None
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'niten_ext.glb'),export_format='GLB',use_selection=True,export_skins=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='JPEG',export_jpeg_quality=78,export_apply=False,
    export_yup=True,export_tangents=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False,export_morph=False)
print('EXT',os.path.getsize(os.path.join(OUT,'niten_ext.glb')))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(PREP,'niten_ext.blend'))
