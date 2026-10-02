# Конфигурация внешних моделей v0.10 (исходники не в git: положить в $NITEN_SRC)
import os
SRC=os.environ.get('NITEN_SRC','/data/src');PREP=os.environ.get('NITEN_PREP','/data/work/prep')
T='samurai-character/textures/'
def st(m,base,**k):
    d={'base':T+base+'_BaseColor.tga.png'};d.update({a:T+b for a,b in k.items()});return d
E='enemie.zip/textures/'
CFG={
 # 1. Акира — mysterious-ronin.zip
 'hero':dict(src='mysterious-ronin/source/model.glb',h=1.80,tris=36000,tex=1024),
 # 2. Сота — samurai-character.zip (катана из архива убрана: у Соты свои мечи игры)
 'sota':dict(src='samurai-character/source/Personaje+Espada.fbx',exclude='Katana_Guarda',h=1.86,tris=34000,tex=1024,textures={
   'Capa_mat':st('','Capa_mat',normal='Capa_mat_Normal.tga.png',rough='Capa_mat_Roughness.tga.png'),
   'Cuerpo_low_mat':st('','Cuerpo_low_mat',normal='Cuerpo_low_mat_Normal.tga.png'),
   'Frasco_Mat1':st('','Frasco_Mat1',normal='Frasco_Mat1_Normal.tga.png',rough='Frasco_Mat1_Roughness.tga.png'),
   'Lompa_low_mat':st('','Lompa_low_mat',normal='Lompa_low_mat_Normal.tga.png',rough='Lompa_low_mat_Roughness.tga.png'),
   'Masc_mat':st('','Masc_mat',normal='Masc_mat_Normal.tga.png',rough='Masc_mat_Roughness.tga.png'),
   'Medias_mat1':{'base':T+'Medias_low_Medias_mat_BaseColor.tga.png','rough':T+'Medias_low_Medias_mat_Roughness.tga.png'},
   'Zapas_Mat1':{'base':T+'Medias_low_Zapas_Mat_BaseColor.tga.png'},
   'Cristalino_Mat':{'base':T+'Cristalino_Mat_BaseColor.tga.png'},
   'Ojo_Mat':{'base':T+'Ojo_Mat_BaseColor.tga.png','emit':T+'Ojo_Mat_Emissive.tga.png'},
   'Parte_Arriba_mat':st('','Parte_Arriba_mat',normal='Parte_Arriba_mat_Normal.tga.png',rough='Parte_Arriba_mat_Roughness.tga.png'),
   'Sombrero_Mat':st('','Sombrero_Mat',normal='Sombrero_Mat_Normal.tga.png',rough='Sombrero_Mat_Roughness.tga.png')}),
 # 4. вражеские ронины (Куро-асигару) — enemie.zip.zip
 'ronin':dict(src='enemie.zip/source/samurai.fbx',uv='map1',exclude='sword',h=1.78,tris=16000,tex=1024,textures={
   'blinn4':{'base':E+'7_BaseColor.png','normal':E+'3_Normal.png','metal':E+'9_metallic.png'},
   'lambert2':{'base':E+'10_BaseColor.png'}}),
 # 5. лучники — monster_skeleton_archer
 'archer':dict(src='monster__skeleton__archer__vari02_kings_raid.glb',h=1.80,tris=9000,tex=1024),
 # 7. самураи Забытого дома — samuraienemy.glb (свой риг: веса костей переносятся)
 'musha':dict(src='samuraienemy.glb',exclude='Icosphere|plane|pCylinder21',h=1.82,tris=24000,tex=1024),
 # 8. фонари — pumpkin_monster.glb
 'pumpkin':dict(src='pumpkin_monster.glb',center='bbox',h=1.0,tris=9000,tex=512),
 # 9. босс дома — dark_samurai_shadow_warrior.glb
 'boss':dict(src='dark_samurai_shadow_warrior.glb',rot=(0,0,-90),capsule=[((0.207,-0.187,0.642),(-0.341,-1.012,0.505),0.07)],h=1.86,tris=40000,tex=1024),
 # v0.14 — деревня Какарико: НПС и кузнец (исходники в $NITEN_SRC/kak)
 'sarah':dict(src='kak/sarah_zzz_npc.glb',exclude='Icosphere',h=1.66,tris=16000,tex=1024),
 'orc':dict(src='kak/orc_npc_from_fuse.glb',h=2.02,tris=16000,tex=1024),
 'smith':dict(src='kak/lowpoly_blacksmith_girl.glb',exclude='Box005',center='bbox',h=1.58,tris=14000,tex=1024),
 'girl':dict(src='kak/girl_npc_outer_plane.glb',exclude='Icosphere',h=1.22,tris=14000,tex=1024),
}
