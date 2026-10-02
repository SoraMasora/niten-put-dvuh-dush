# NITEN v0.10 — этап 2: скиннинг внешней модели к 13 суставам рига игры (makeHuman) и подгонка под его позу покоя.
#  1) арматура по ориентирам модели (A/T-поза) -> веса: веса по расстоянию до сегментов костей + диффузия по рёбрам (или перенос весов родного рига),
#  2) позирование костей в позу покоя игры (руки/ноги вниз, длины сегментов как у makeHuman) с сохранением объёма,
#  3) применение позы к мешу и экспорт GLB со скином (кости названы как суставы игры).
# Запуск: PYTHONPATH=/data/pylib python3 blender/ext/rig.py <name>
import bpy,sys,os,re,math
from mathutils import Vector,Matrix,Quaternion
sys.path.insert(0,os.path.dirname(__file__))
from cfg import CFG,PREP
from rigcfg import RIG
import numpy as np
name=sys.argv[-1];C=CFG[name];R=RIG[name]
bpy.ops.wm.open_mainfile(filepath=os.path.join(PREP,name+'.blend'))
ob=bpy.data.objects[name];me=ob.data
# ---------- ориентиры
L={}
for k,v in R['L'].items():
    L[k]=Vector(v)
    if k[-1]=='L' and k[:-1]+'R' not in R['L']:L[k[:-1]+'R']=Vector((-v[0],v[1],v[2]))
for s in 'RL':
    if 'toe'+s not in L:a=L['ankle'+s];L['toe'+s]=Vector((a.x,a.y-0.14,0.02))
    if 'pa'+s not in L:L['pa'+s]=L['wr'+s].lerp(L['fi'+s],0.3)
pel=(L['hipR']+L['hipL'])/2
# ---------- целевая поза покоя рига игры (координаты корня, Blender Z-вверх)
s=0.92/pel.z
T={'pel':Vector((0,0,0.92)),'neck':Vector((0,0,1.52))}
for s_,x in(('R',-1),('L',1)):
    T['hip'+s_]=Vector((0.1*x,0,0.92));T['knee'+s_]=Vector((0.1*x,0,0.48));T['ankle'+s_]=Vector((0.1*x,0,L['ankle'+s_].z*s))
    shz=0.92+0.6*(L['sh'+s_].z-pel.z)/(L['neck'].z-pel.z)
    T['sh'+s_]=Vector((0.22*x,0,shz));T['el'+s_]=Vector((0.22*x,0,shz-0.29));T['pa'+s_]=Vector((0.22*x,0,shz-0.57))
# ---------- деформирующая арматура (кости без иерархии — каждой задаём позу независимо)
BONES={'hips':('pel',None),'torso':('pel','neck'),'neck':('neck','top')}
for s_ in 'RL':
    BONES.update({'thigh'+s_:('hip'+s_,'knee'+s_),'shin'+s_:('knee'+s_,'ankle'+s_),'foot'+s_:('ankle'+s_,'toe'+s_),
      'upperArm'+s_:('sh'+s_,'el'+s_),'foreArm'+s_:('el'+s_,'wr'+s_),'hand'+s_:('wr'+s_,'fi'+s_)})
arm=bpy.data.armatures.new('def');ao=bpy.data.objects.new('def',arm);bpy.context.scene.collection.objects.link(ao)
bpy.context.view_layer.objects.active=ao;bpy.ops.object.mode_set(mode='EDIT')
hz=L['neck'].z-pel.z
for b,(h,t) in BONES.items():
    eb=arm.edit_bones.new(b)
    if b=='hips':eb.head=pel-Vector((0,0,0.08*hz));eb.tail=pel+Vector((0,0,0.12*hz))
    elif b=='torso':eb.head=pel+Vector((0,0,0.12*hz));eb.tail=L['neck']
    else:eb.head=L[h];eb.tail=L[t]
    eb.roll=0
bpy.ops.object.mode_set(mode='OBJECT')
# ---------- веса
def mapname(g):
    for rx,b in R.get('map',[]):
        if re.search(rx,g):return b
    return None
if R.get('map'):
    # перенос весов родного рига: суммируем группы костей в 13(+2) групп
    n=len(me.vertices);W={b:np.zeros(n) for b in BONES}
    gi={g.index:g.name for g in ob.vertex_groups};miss=set()
    for v in me.vertices:
        for g in v.groups:
            b=mapname(gi[g.group])
            if b:W[b][v.index]+=g.weight
            else:miss.add(gi[g.group])
    if miss:print('UNMAPPED',sorted(miss))
    # стороны: L_ у модели может быть зеркальным
    co=np.array([v.co[:] for v in me.vertices])
    if (W['handL']>0.5).any() and co[W['handL']>0.5,0].mean()<0:
        print('SWAP L/R');
        for a in['thigh','shin','foot','upperArm','foreArm','hand']:W[a+'L'],W[a+'R']=W[a+'R'],W[a+'L']
    for g in list(ob.vertex_groups):ob.vertex_groups.remove(g)
    for b in BONES:
        vg=ob.vertex_groups.new(name=b);idx=np.nonzero(W[b]>1e-4)[0]
        for i in idx:vg.add([int(i)],float(W[b][i]),'REPLACE')
else:
    for g in list(ob.vertex_groups):ob.vertex_groups.remove(g)
    # веса: расстояние до сегментов костей + ограничения сторон + диффузия по рёбрам меша
    co=np.array([v.co[:] for v in me.vertices]);n=len(co);bl=list(BONES)
    def sd(P,a,b):
        a=np.array(a);b=np.array(b);ab=b-a;t=np.clip(((P-a)@ab)/max(ab@ab,1e-9),0,1);return np.linalg.norm(P-(a+t[:,None]*ab),axis=1)
    D=np.stack([sd(co,arm.bones[x].head_local,arm.bones[x].tail_local) for x in bl],1)
    side=np.array([1 if x[-1]=='L' else -1 if x[-1]=='R' else 0 for x in bl]);cx=pel.x
    bad=((side[None,:]==1)&(co[:,0:1]<cx-0.03))|((side[None,:]==-1)&(co[:,0:1]>cx+0.03))
    D[bad]+=5
    dm=D.min(1,keepdims=True);sig=R.get('sigma',0.025)
    W=np.exp(-(D-dm)/sig);W[D>dm+4*sig]=0;W/=W.sum(1,keepdims=True)
    E=np.array([e.vertices[:] for e in me.edges])
    for it in range(R.get('diffuse',12)):
        acc=np.zeros_like(W);cnt=np.zeros(n)
        np.add.at(acc,E[:,0],W[E[:,1]]);np.add.at(acc,E[:,1],W[E[:,0]]);np.add.at(cnt,E[:,0],1);np.add.at(cnt,E[:,1],1)
        m=cnt>0;W[m]=0.5*W[m]+0.5*acc[m]/cnt[m,None];W[bad]=0;W/=np.maximum(W.sum(1,keepdims=True),1e-9)
    for j,x in enumerate(bl):
        vg=ob.vertex_groups.new(name=x);idx=np.nonzero(W[:,j]>1e-3)[0]
        for i in idx:vg.add([int(i)],float(W[i,j]),'REPLACE')
# правила по материалам: жёстко к кости / разрешённые кости
co=np.array([v.co[:] for v in me.vertices]);n=len(co)
Wm=np.zeros((n,len(BONES)));bn=list(BONES);bi={b:i for i,b in enumerate(bn)}
for v in me.vertices:
    for g in v.groups:Wm[v.index,bi[ob.vertex_groups[g.group].name]]=g.weight
vm=np.zeros(n,dtype=int)
for p in me.polygons:
    for vi in p.vertices:vm[vi]=p.material_index
mats=[m.name if m else '' for m in me.materials]
def segdist(P,a,b):
    a=np.array(a);b=np.array(b);ab=b-a;t=np.clip(((P-a)@ab)/max(ab@ab,1e-9),0,1);return np.linalg.norm(P-(a+t[:,None]*ab),axis=1)
D=np.stack([segdist(co,arm.bones[b].head_local,arm.bones[b].tail_local) for b in bn],1)
for rx,allow in R.get('allow',[]):
    sel=np.array([bool(re.search(rx,mats[m])) for m in vm])
    if not sel.any():continue
    mask=np.array([b in allow for b in bn]);Wm[np.ix_(sel,~mask)]=0
    z=sel&(Wm.sum(1)<1e-3)
    if z.any():Dz=D[z].copy();Dz[:,~mask]=9;Wm[z]=0;Wm[z,Dz.argmin(1)]=1
for rx,box,b in R.get('boxes',[]):   # области (оружие/предметы в руке) — целиком к кости
    lo,hi=np.array(box[0]),np.array(box[1]);sel=((co>=lo)&(co<=hi)).all(1);Wm[sel]=0;Wm[sel,bi[b]]=1;print('BOX',b,sel.sum())
z=Wm.sum(1)<1e-3;print('UNWEIGHTED',int(z.sum()),'of',n)
if z.any():
    w=1/(D[z]**4+1e-8);w[w<w.max(1,keepdims=True)*0.05]=0;Wm[z]=w
Wm/=Wm.sum(1,keepdims=True)
for g in list(ob.vertex_groups):ob.vertex_groups.remove(g)
for j,b in enumerate(bn):
    vg=ob.vertex_groups.new(name=b);idx=np.nonzero(Wm[:,j]>1e-4)[0]
    for i in idx:vg.add([int(i)],float(Wm[i,j]),'REPLACE')
bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.vertex_group_smooth(group_select_mode='ALL',factor=0.5,repeat=R.get('smooth',2))
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL',limit=4)
bpy.ops.object.vertex_group_normalize_all(lock_active=False)
bpy.ops.object.mode_set(mode='OBJECT')
# ---------- поза: перевод в позу покоя рига игры
def swing(a,b):return a.normalized().rotation_difference(b.normalized())
Q={};KK={}
for s_ in 'RL':
    Q['thigh'+s_]=swing(L['knee'+s_]-L['hip'+s_],T['knee'+s_]-T['hip'+s_]);KK['thigh'+s_]=(T['knee'+s_]-T['hip'+s_]).length/(L['knee'+s_]-L['hip'+s_]).length
    Q['shin'+s_]=swing(L['ankle'+s_]-L['knee'+s_],T['ankle'+s_]-T['knee'+s_]);KK['shin'+s_]=(T['ankle'+s_]-T['knee'+s_]).length/(L['ankle'+s_]-L['knee'+s_]).length
    Q['upperArm'+s_]=swing(L['el'+s_]-L['sh'+s_],T['el'+s_]-T['sh'+s_]);KK['upperArm'+s_]=(T['el'+s_]-T['sh'+s_]).length/(L['el'+s_]-L['sh'+s_]).length
    Q['foreArm'+s_]=swing(L['pa'+s_]-L['el'+s_],T['pa'+s_]-T['el'+s_]);KK['foreArm'+s_]=(T['pa'+s_]-T['el'+s_]).length/(L['pa'+s_]-L['el'+s_]).length
Q['torso']=swing(L['neck']-pel,T['neck']-T['pel']);KK['torso']=(T['neck']-T['pel']).length/(L['neck']-pel).length
print('SCALE',round(s,3),{k:round(v,3) for k,v in KK.items()})
ID=Quaternion()
bpy.context.view_layer.objects.active=ao;bpy.ops.object.mode_set(mode='POSE')
for pb in ao.pose.bones:pb.bone.inherit_scale='NONE'
def setpose(b,q,hs,ht,k):
    pb=ao.pose.bones[b];rest=ao.data.bones[b].matrix_local;R3=rest.to_3x3()
    Sx=R3@Matrix.Diagonal((s,(k*s if k else s),s))@R3.inverted()
    pb.matrix=Matrix.Translation(ht)@q.to_matrix().to_4x4()@Sx.to_4x4()@Matrix.Translation(-hs)@rest
H=arm.bones
for b in bn:
    h=Vector(H[b].head_local)
    if b=='hips':setpose(b,ID,pel,T['pel'],None)
    elif b=='torso':
        pb=ao.pose.bones[b];rest=ao.data.bones[b].matrix_local;kx=0.44/abs(L['shL'].x-L['shR'].x)
        pb.matrix=Matrix.Translation(T['pel'])@Matrix.Diagonal((kx,s,KK['torso'],1.0))@Q['torso'].to_matrix().to_4x4()@Matrix.Translation(-pel)@rest
    elif b=='neck':setpose(b,ID,L['neck'],T['neck'],None)
    elif b[:-1] in('thigh','shin','upperArm','foreArm'):
        hs={'thigh':'hip','shin':'knee','upperArm':'sh','foreArm':'el'}[b[:-1]]+b[-1]
        setpose(b,Q[b],L[hs],T[hs],KK[b]/s)
    elif b[:-1]=='foot':setpose(b,Q['shin'+b[-1]],L['ankle'+b[-1]],T['ankle'+b[-1]],None)
    elif b[:-1]=='hand':setpose(b,Q['foreArm'+b[-1]],L['pa'+b[-1]],T['pa'+b[-1]],None)
    bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode='OBJECT')
mod=next((m for m in ob.modifiers if m.type=='ARMATURE'),None) or ob.modifiers.new('arm','ARMATURE')
mod.object=ao;mod.use_deform_preserve_volume=R.get('dqs',True);mod.use_vertex_groups=True
ob.parent=None;bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
# ноги/кисти: временные группы стопы -> голень
for s_ in 'RL':
    f=ob.vertex_groups['foot'+s_];sh=ob.vertex_groups['shin'+s_]
    for v in me.vertices:
        for g in v.groups:
            if g.group==f.index:sh.add([v.index],g.weight,'ADD')
    ob.vertex_groups.remove(f)
bpy.data.objects.remove(ao)
# ---------- экспортная арматура (иерархия = makeHuman)
J=[('hips',None,T['pel']),('torso','hips',T['pel']+Vector((0,0,0.001))),('neck','torso',T['neck'])]
for s_ in 'RL':J+=[('thigh'+s_,'hips',T['hip'+s_]),('shin'+s_,'thigh'+s_,T['knee'+s_]),('upperArm'+s_,'torso',T['sh'+s_]),('foreArm'+s_,'upperArm'+s_,T['el'+s_]),('hand'+s_,'foreArm'+s_,T['pa'+s_])]
arm=bpy.data.armatures.new('XS_'+name);ao=bpy.data.objects.new('XS_'+name,arm);bpy.context.scene.collection.objects.link(ao)
bpy.context.view_layer.objects.active=ao;bpy.ops.object.mode_set(mode='EDIT')
for b,p,h in J:
    eb=arm.edit_bones.new(b);eb.head=h;eb.tail=h+Vector((0,0,0.08 if b in('hips','torso','neck') else -0.08));eb.roll=0
    if p:eb.parent=arm.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
ob.parent=ao;m=ob.modifiers.new('arm','ARMATURE');m.object=ao
ob.name='XS__'+name
for i,mt in enumerate(me.materials):
    if mt:mt.name=name+'_m%d'%i
co=np.array([v.co[:] for v in me.vertices]);print('BBOX',co.min(0).round(3),co.max(0).round(3))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(PREP,name+'_rig.blend'))
