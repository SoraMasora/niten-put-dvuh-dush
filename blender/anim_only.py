"""Только анимации героя (без пересборки моделей): python3 blender/anim_only.py -> game/src/anims.js
Суставы AK__J_* создаются пустышками той же иерархии, что в chars.build_human (для ключей нужны только они)."""
import sys,os;HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
import anim
PAR={'torso':'hips','neck':'torso','thighR':'hips','shinR':'thighR','thighL':'hips','shinL':'thighL','upperArmR':'torso','foreArmR':'upperArmR','handR':'foreArmR','upperArmL':'torso','foreArmL':'upperArmL','handL':'foreArmL'}
for j in anim.JOINTS:
    o=bpy.data.objects.new('AK__J_'+j,None);bpy.context.scene.collection.objects.link(o)
for j,p in PAR.items():bpy.data.objects['AK__J_'+j].parent=bpy.data.objects['AK__J_'+p]
anim.build([os.path.join(HERE,'..','game','src','anims.js')])
