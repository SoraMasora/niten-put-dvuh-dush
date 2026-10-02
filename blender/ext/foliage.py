# v0.13: листва локаций — «карточки» растений, у которых в исходнике потерялась альфа (непрозрачные зелёные
# прямоугольники). В Blender: альфа восстанавливается хромакеем по цвету фона карточки (мягкий край, 2x апскейл),
# материал -> Alpha Clip (glTF MASK) + двусторонний; полупрозрачные BLEND-карточки с бинарной альфой -> тоже MASK
# (без артефактов сортировки). python3 blender/ext/foliage.py [in.glb] [out.glb]  (по умолчанию blender/out/niten_loc.glb на месте)
import bpy,sys,os,numpy as np
HERE=os.path.dirname(os.path.abspath(__file__));OUTD=os.path.join(HERE,'..','out')
args=[a for a in sys.argv[1:] if a.endswith('.glb')];SRC=args[0] if args else os.path.join(OUTD,'niten_loc.glb');DST=args[1] if len(args)>1 else SRC
bpy.ops.wm.read_factory_settings(use_empty=True)
TMP=os.path.join(OUTD,'foliage');os.makedirs(TMP,exist_ok=True)
bpy.ops.import_scene.gltf(filepath=SRC)
def img_of(m):
    if not m or not m.use_nodes:return None,None
    for n in m.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED':
            l=n.inputs['Base Color'].links
            if l and l[0].from_node.type=='TEX_IMAGE':return l[0].from_node,n
    return None,None
def px(im):
    w,h=im.size;a=np.empty(w*h*4,np.float32);im.pixels.foreach_get(a);return a.reshape(h,w,4)
def bgcol(a):
    b=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])[:,:3];q=np.floor(b*255/8).astype(int);k=q[:,0]*10000+q[:,1]*100+q[:,2];u,c=np.unique(k,return_counts=True);m=u[c.argmax()]
    sel=b[k==m];return sel.mean(0),(k==m).mean()
def is_card(a):
    if a.shape[0]<16:return False
    bg,bf=bgcol(a);d=np.linalg.norm(a[...,:3]-bg,axis=2)*255;frac=(d<22).mean()
    return bf>0.45 and frac>0.15 and bg[1]>bg[0] and bg[1]>bg[2]
def key(im):
    w,h=im.size;im.scale(w*2,h*2);a=px(im);bg,_=bgcol(a);d=np.linalg.norm(a[...,:3]-bg,axis=2)*255
    al=np.clip((d-14)/16,0,1);a[...,3]=al
    # краевые пиксели: убрать зелёную кайму фона (подмешать цвет соседних листьев)
    m=al>0.5
    if m.any():
        mean=a[m][:,:3].mean(0);edge=(al>0.05)&(al<0.95);a[edge,:3]=a[edge,:3]*0.6+mean*0.4
    nw=bpy.data.images.new(im.name+'_a',w*2,h*2,alpha=True);nw.pixels.foreach_set(a.ravel());nw.update()
    fp=os.path.join(TMP,bpy.path.clean_name(im.name)+'.png');nw.filepath_raw=fp;nw.file_format='PNG';nw.save()
    bpy.data.images.remove(nw);ni=bpy.data.images.load(fp);ni.alpha_mode='STRAIGHT';return ni,float(al.mean())
def clip(m,tex,bsdf):
    nt=m.node_tree
    for l in list(bsdf.inputs['Alpha'].links):nt.links.remove(l)
    r=nt.nodes.new('ShaderNodeMath');r.operation='ROUND';nt.links.new(tex.outputs['Alpha'],r.inputs[0]);nt.links.new(r.outputs[0],bsdf.inputs['Alpha'])
    m.use_backface_culling=False
    try:m.surface_render_method='DITHERED'
    except Exception:pass
done=[]
for m in bpy.data.materials:
    if not m.name.startswith('lv_'):continue
    tex,bsdf=img_of(m)
    if not tex or not tex.image:continue
    im=tex.image;a=px(im)
    if a[...,3].mean()<0.985:
        al=a[...,3];binary=((al<0.1)|(al>0.9)).mean()
        if binary>0.9:clip(m,tex,bsdf);done.append((m.name,'blend->mask',round(float(al.mean()),2)))
        continue
    if m.name.startswith('lv_village_') and is_card(a):
        ni,k=key(im);tex.image=ni;clip(m,tex,bsdf);done.append((m.name,'key',round(k,2)))
for d in done:print('foliage',*d)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=DST,export_format='GLB',use_selection=True,export_image_format='AUTO',export_apply=False,export_yup=True,export_tangents=False,export_morph=False,export_skins=False,export_animations=False)
print('FOLIAGE',len(done),os.path.getsize(DST))
