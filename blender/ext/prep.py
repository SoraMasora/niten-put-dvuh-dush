# NITEN v0.10 — этап 1: импорт внешних моделей в Blender, чистка, ориентация, масштаб, децимация, текстуры.
# Запуск: PYTHONPATH=/data/pylib python3 blender/ext/prep.py <name>  (исходники в $NITEN_SRC, по умолчанию /data/src)
import bpy,sys,os,math,mathutils,re
sys.path.insert(0,os.path.dirname(__file__))
from cfg import CFG,SRC,PREP
name=sys.argv[-1];C=CFG[name]
for o in list(bpy.data.objects):bpy.data.objects.remove(o)
f=os.path.join(SRC,C['src'])
if f.endswith('.fbx'):bpy.ops.import_scene.fbx(filepath=f)
else:bpy.ops.import_scene.gltf(filepath=f)
bpy.context.view_layer.update()
ex=C.get('exclude')
for o in list(bpy.data.objects):
    if o.type=='MESH' and ex and re.search(ex,o.name):bpy.data.objects.remove(o)
# снять арматуру: меш в позе покоя, группы вершин (имена костей) сохраняются
for o in [o for o in bpy.data.objects if o.type=='MESH']:
    for m in list(o.modifiers):
        if m.type=='ARMATURE':o.modifiers.remove(m)
    mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
for o in list(bpy.data.objects):
    if o.type!='MESH':bpy.data.objects.remove(o)
ms=[o for o in bpy.data.objects if o.type=='MESH']
# материал-текстуры для FBX без встроенных картинок
for mn,tex in C.get('textures',{}).items():
    m=bpy.data.materials.get(mn)
    if not m:print('NO MAT',mn);continue
    m.use_nodes=True;nt=m.node_tree;bs=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
    for l in list(nt.links):
        if l.to_node==bs:nt.links.remove(l)
    for k,p in tex.items():
        im=bpy.data.images.load(os.path.join(SRC,p));tn=nt.nodes.new('ShaderNodeTexImage');tn.image=im
        if k!='base':im.colorspace_settings.name='Non-Color'
        if k=='base':nt.links.new(tn.outputs[0],bs.inputs['Base Color'])
        elif k=='rough':nt.links.new(tn.outputs[0],bs.inputs['Roughness'])
        elif k=='metal':nt.links.new(tn.outputs[0],bs.inputs['Metallic'])
        elif k=='emit':nt.links.new(tn.outputs[0],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=1.0
        elif k=='normal':nm=nt.nodes.new('ShaderNodeNormalMap');nt.links.new(tn.outputs[0],nm.inputs['Color']);nt.links.new(nm.outputs[0],bs.inputs['Normal'])
for o in ms:o.select_set(True)
bpy.context.view_layer.objects.active=ms[0]
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
if len(ms)>1:bpy.ops.object.join()
ob=bpy.context.view_layer.objects.active;ob.name=name
r=C.get('rot',(0,0,0));ob.rotation_mode='XYZ';ob.rotation_euler=[math.radians(a) for a in r];bpy.ops.object.transform_apply(rotation=True)
me=ob.data;import numpy as np
co=np.array([v.co[:] for v in me.vertices]);mn,mx=co.min(0),co.max(0)
s=C['h']/(mx[2]-mn[2])
hd=co[co[:,2]>mn[2]+0.86*(mx[2]-mn[2])];cx,cy=(hd.mean(0)[:2] if C.get('center','head')=='head' and len(hd) else ((mn+mx)/2)[:2])
ob.location=(-cx*s,-cy*s,-mn[2]*s);ob.scale=(s,s,s)
bpy.ops.object.transform_apply(location=True,scale=True)
import bmesh
for a,b,r in C.get('capsule',[]):   # вырезать капсулу (клинок, «запечённый» в меш)
    bm=bmesh.new();bm.from_mesh(me);A=mathutils.Vector(a);B=mathutils.Vector(b);AB=B-A
    def dist(p):
        t=max(0,min(1,(p-A).dot(AB)/AB.length_squared));return (p-(A+AB*t)).length
    dv=[v for v in bm.verts if dist(v.co)<r];print('CAPSULE',len(dv))
    bmesh.ops.delete(bm,geom=dv,context='VERTS');bm.to_mesh(me);bm.free()
for lo,hi in C.get('cut',[]):   # вырезать области (оружие, «запечённое» в меш)
    bm=bmesh.new();bm.from_mesh(me)
    dv=[v for v in bm.verts if all(lo[i]<=v.co[i]<=hi[i] for i in range(3))];print('CUT',len(dv))
    bmesh.ops.delete(bm,geom=dv,context='VERTS');bm.to_mesh(me);bm.free()
bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=C['h']*2e-5)
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bm.to_mesh(me);bm.free()
tr=sum(len(p.vertices)-2 for p in me.polygons)
if tr>C['tris']:
    d=ob.modifiers.new('dec','DECIMATE');d.ratio=C['tris']/tr;d.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier='dec')
for p in me.polygons:p.use_smooth=True
if me.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
keep=C.get('uv',me.uv_layers[0].name if me.uv_layers else None)
for u in [u for u in me.uv_layers if u.name!=keep]:me.uv_layers.remove(u)
if me.uv_layers:me.uv_layers[0].active_render=True
for im in bpy.data.images:
    if im.size[0]>C.get('tex',1024):
        k=C.get('tex',1024)/max(im.size);im.scale(int(im.size[0]*k),int(im.size[1]*k))
    if im.size[0]>0 and im.packed_file is None and im.filepath:im.pack()
print('PREP',name,'tris',sum(len(p.vertices)-2 for p in me.polygons),'verts',len(me.vertices),'vg',len(ob.vertex_groups))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(PREP,name+'.blend'))
