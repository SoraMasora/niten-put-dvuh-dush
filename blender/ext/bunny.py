# NITEN v0.10 — Кама-итати: bunny_rat_monster.glb. Масштаб, свои клипы (idle из модели, run, crouch, leap, hit) на родных костях.
# Используется из build_ext.py: build_bunny() -> объекты в текущей сцене.
import bpy,math,os
from mathutils import Matrix,Quaternion,Vector
from cfg import SRC
def build_bunny(H=0.78):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC,'bunny_rat_monster.glb'))
    new=[o for o in bpy.data.objects if o not in before]
    a=next(o for o in new if o.type=='ARMATURE');me=next(o for o in new if o.type=='MESH' and o.vertex_groups)
    for o in new:
        if o not in(a,me) and o.type in('MESH','EMPTY') and o!=a.parent:
            if o.type=='MESH' or 'Gizmo' in o.name:bpy.data.objects.remove(o)
    # снять корневой узел, применить масштаб
    root=a.parent;mw=a.matrix_world.copy();a.parent=None;a.matrix_world=mw
    if root:bpy.data.objects.remove(root)
    idle=a.animation_data.action;idle.name='KM_idle'
    bpy.context.view_layer.update()
    # высота модели
    import numpy as np
    co=np.array([me.matrix_world@v.co for v in me.data.vertices]);h=co[:,2].max()-co[:,2].min()
    k=H/h;a.scale=a.scale*k;a.location=(0,0,-co[:,2].min()*k)
    bpy.ops.object.select_all(action='DESELECT');a.select_set(True);bpy.context.view_layer.objects.active=a
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
    a.name='KM_rig';me.name='KM__body'
    for i,m in enumerate(me.data.materials):
        if m:m.name='KM_skin'
    P=a.pose.bones;B=a.data.bones
    def q(b,ang):  # поворот вокруг поперечной оси X (тангаж) в пространстве арматуры
        R3=B[b].matrix_local.to_3x3();return (R3.inverted()@Matrix.Rotation(ang,3,'X')@R3).to_quaternion()
    def qz(b,ang):
        R3=B[b].matrix_local.to_3x3();return (R3.inverted()@Matrix.Rotation(ang,3,'Z')@R3).to_quaternion()
    def act(name,keys,loop=True):
        ac=bpy.data.actions.new(name);a.animation_data.action=ac
        frames=sorted(keys)
        for f in frames:
            for pb in P:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
            for b,v in keys[f].items():
                if b=='lift':
                    pb=P['RigPelvis_01'];R3=B['RigPelvis_01'].matrix_local.to_3x3();pb.location=R3.inverted()@Vector((0,v[1],v[0]))
                    continue
                if isinstance(v,tuple):P[b].rotation_quaternion=q(b,v[0])@qz(b,v[1])
                else:P[b].rotation_quaternion=q(b,v)
            for pb in P:
                pb.keyframe_insert('rotation_quaternion',frame=f);pb.keyframe_insert('location',frame=f)
        ac.use_fake_user=True;return ac
    LL,RL='RigLLeg1_028','RigRLeg1_041';LK,RK='RigLLeg2_029','RigRLeg2_042';LA,RA='RigLLegAnkle_030','RigRLegAnkle_043'
    sp,hd,md='RigSpine2_03','RigHead_08','RigMouthDown_010';T1,T3='RigTail1_033','RigTail3_035'
    ears=['RigEarLeft1_011','RigEarRight1_019']
    def legs(t,kn,an,s=None):
        d={LL:t,RL:t,LK:kn,RK:kn,LA:an,RA:an}
        return d
    # бег: прыжки обеими лапами (12 кадров)
    run={}
    for f,(t,kn,an,lift,bd,tl,er) in {0:(-0.5,0.5,-0.2,0.0,0.15,0.2,0.3),3:(0.3,-0.1,0.3,0.02,0.05,-0.1,0.1),
            6:(0.8,-0.4,0.6,0.09,-0.1,-0.3,-0.2),9:(-0.1,0.3,0.0,0.06,0.1,0.1,0.2),12:(-0.5,0.5,-0.2,0.0,0.15,0.2,0.3)}.items():
        d=legs(t,kn,an);d['lift']=(lift*1,0);d[sp]=bd;d[T1]=tl;d[T3]=tl;d[hd]=-bd*0.5
        for e in ears:d[e]=er
        run[f]=d
    act('KM_run',run)
    # подготовка к прыжку: присед, голова к земле
    cr={0:{},10:dict(legs(-0.8,0.9,-0.4),**{sp:0.45,hd:-0.25,T1:0.4,ears[0]:-0.5,ears[1]:-0.5,md:0.3,'lift':(-0.06,0)})}
    act('KM_crouch',cr,loop=False)
    # прыжок: тело вытянуто, лапы назад, пасть открыта
    lp={0:dict(legs(0.9,-0.5,0.7),**{sp:-0.25,hd:0.2,T1:-0.4,T3:-0.3,ears[0]:-0.7,ears[1]:-0.7,md:0.6}),
        8:dict(legs(-0.4,0.6,-0.2),**{sp:0.2,hd:0.0,T1:0.3,ears[0]:0.2,ears[1]:0.2,md:0.2})}
    act('KM_leap',lp,loop=False)
    hit={0:{},3:{sp:-0.5,hd:0.4,ears[0]:-0.6,ears[1]:-0.6,md:0.5,T1:-0.4},10:{}}
    act('KM_hit',hit,loop=False)
    # каждое действие — своя дорожка NLA (экспорт glTF: все действия как клипы)
    a.animation_data.action=None
    for ac in [idle]+[bpy.data.actions[n] for n in('KM_run','KM_crouch','KM_leap','KM_hit')]:
        tr=a.animation_data.nla_tracks.new();tr.name=ac.name;tr.strips.new(ac.name,int(ac.frame_range[0]),ac)
    for pb in P:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    return a,me
