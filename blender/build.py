"""Сборка всех моделей NITEN.
Запуск:  python3 blender/build.py   (нужен модуль bpy: pip install bpy==5.2.2)
Результат: blender/out/niten_characters.blend, blender/out/niten_assets.glb, превью в blender/out/preview_*.png"""
import sys,os,time;HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
import bpy
OUT=os.path.join(HERE,'out');os.makedirs(OUT,exist_ok=True)
import tex
if not os.path.exists(os.path.join(HERE,'tex','tar_n.png')):tex.build()
bpy.ops.wm.read_factory_settings(use_empty=True)
from lib import *
import chars,swords,demons,props
t0=time.time()
collection('Akira');chars.build_human('AK',chars.AKIRA,chars.mats_akira(),(0,0,0))
collection('Sota');chars.build_human('SO',chars.SOTA,chars.mats_sota(),(1.2,0,0))
collection('Swords')
for pre,L,stl,x in(('SW_A',0.74,'A',-0.9),('SW_Y',0.69,'Y',-1.1),('SW_S',0.9,'S',-1.3),('SW_G',1.2,'G',-1.5)):
    r=swords.build_sword(pre,L,stl,None,(x,1.0,0))
M=demons.M_demon()
collection('Genma');demons.build_ge(M,(2.6,0,0))
collection('Gasa');demons.build_ga(M,(4.0,0,0))
collection('Kama');demons.build_ka(M,(5.4,0,0.2))
collection('Yumi');demons.build_yu(M,(6.8,0,0))
collection('Props');PM=props.M_props();props.build_lantern(PM,(8.2,0,0));props.build_torii(PM,(11,0,0));props.build_bell(PM,(14.5,2.2,0))
nv=sum(len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH');print('built %.1fs objects=%d verts=%d'%(time.time()-t0,len(bpy.data.objects),nv))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'niten_characters.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'niten_assets.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=82,export_yup=True,export_apply=True,
    export_animations=False,export_cameras=False,export_lights=False,export_extras=False,export_tangents=False)
print('exported',os.path.getsize(os.path.join(OUT,'niten_assets.glb')))
if '--preview' in sys.argv:
    render_preview(os.path.join(OUT,'preview_lineup.png'),target=(3.0,0.9,0),dist=9.5,yaw=0,pitch=4,res=(1800,700),lens=50,samples=16)
