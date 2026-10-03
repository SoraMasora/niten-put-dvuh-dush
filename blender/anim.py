"""Анимации героя (Мусаси), созданные в Blender.
Ключевые позы ставятся как ключи Action на суставах-пустышках AK__J_* (кватернионы, интерполяция Blender:
SINE/EXPO/BACK/Безье), каждое действие кладётся в NLA-дорожку с именем клипа (видно в .blend).
Затем клип «запекается» через scene.frame_set() и сохраняется в game/src/anims.js — игра проигрывает его
поверх процедурной позы. Мечи — отдельные пустышки AK__J_swR/swL: в ножнах (saya), скольжение из ножен,
в руке, свободный полёт (подбрасывание)."""
import bpy, math, re, json, os
from mathutils import Matrix, Vector, Quaternion
HERE=os.path.dirname(os.path.abspath(__file__));REPO=os.path.dirname(HERE)
FPS=60;STEP=2   # ключи в кадрах 60 к/с, запекание каждые 2 кадра (30 к/с)
JOINTS=['hips','torso','neck','thighR','shinR','thighL','shinL','upperArmR','foreArmR','handR','upperArmL','foreArmL','handL']
JOFF={'hips':(0,0.92,0),'thighR':(-0.1,0,0),'thighL':(0.1,0,0),'shinR':(0,-0.44,0),'shinL':(0,-0.44,0),'torso':(0,0,0),'neck':(0,0.6,0),
 'upperArmR':(-0.22,0.5,0),'upperArmL':(0.22,0.5,0),'foreArmR':(0,-0.29,0),'foreArmL':(0,-0.29,0),'handR':(0,-0.28,0),'handL':(0,-0.28,0)}
# ножны (из chars.build_human: E,X,Y,Z) -> «гнездо» меча в пространстве бёдер; клинок начинается на z=0.085
def sockets():
    out={}
    for q,(side,L,z) in enumerate((('R',0.74,0.0),('L',0.69,0.035))):
        Z=Vector((0.1+0.03*q,-0.42-0.05*q,-0.9)).normalized();Y=(Vector((0,1,0))-Z*Z.y).normalized();X=Y.cross(Z);E=Vector((0.135,0.075-q*0.02,0.1-z*0.5))
        M=Matrix((X,Y,Z)).transposed().to_4x4();M.translation=E-Z*0.078;out[side]=dict(M=M,Z=Z,L=L+0.085)
    return out
SOCK=sockets()
# ---------------------------------------------------------------- позы из models.js
def load_poses():
    src=open(os.path.join(REPO,'game','src','models.js')).read();P={}
    for m in re.finditer(r"(\w+):\{c:([-\d.]+),tx:([-\d.]+),ty:([-\d.]+),R:\[([^\]]+)\],L:\[([^\]]+)\]\}",src):
        P[m.group(1)]=dict(c=float(m.group(2)),tx=float(m.group(3)),ty=float(m.group(4)),R=[float(x) for x in m.group(5).split(',')],L=[float(x) for x in m.group(6).split(',')])
    return P
POSE=load_poses()
def Rx(a):return Matrix.Rotation(a,4,'X')
def Ry(a):return Matrix.Rotation(a,4,'Y')
def Rz(a):return Matrix.Rotation(a,4,'Z')
def exyz(x,y,z):return Rx(x)@Ry(y)@Rz(z)      # three.js Euler 'XYZ'
def eyxz(x,y,z):return Ry(y)@Rx(x)@Rz(z)      # three.js Euler 'YXZ'
def T(v):return Matrix.Translation(Vector(v))
def P_(name,**ov):
    p=dict(POSE[name]) if isinstance(name,str) else dict(name);p['R']=list(p['R']);p['L']=list(p['L'])
    for k,v in ov.items():p[k]=v
    return p
def locals_(p):
    """Поза (как applyPose в models.js без ходьбы) + доп. ключи -> {сустав:(кватернион, позиция)} в координатах игры."""
    g=lambda k,d=0.0:p.get(k,d)
    c,tx,ty,r,l=p['c'],p['tx'],p['ty'],p['R'],p['L'];dp=g('dp',(0,0,0));R={}
    hp=Vector((dp[0],0.92-c*0.28+dp[1],dp[2]))
    R['hips']=exyz(g('hx'),-ty*0.3+g('hy'),g('hz'))
    R['torso']=exyz(tx+g('tx2'),ty+g('ty2'),g('tz'))
    R['neck']=exyz(*g('nk',(0,0,0)))
    for i,s in((0,'R'),(1,'L')):
        side=1 if i else -1;cr=c*0.5 if i else c*0.9;th=g('th'+s,(0,0,0))
        R['thigh'+s]=exyz(-cr+th[0],th[1],side*(0.06+c*0.15)+th[2]);R['shin'+s]=exyz((c*1.3 if i else c*1.6)+g('kn'+s),0,0)
    hr=g('hR',(0,0));hl=g('hL',(0,0))
    R['upperArmR']=eyxz(r[0],r[1],-r[2]);R['foreArmR']=exyz(r[3],0,0);R['handR']=exyz(r[4]-r[0]-r[3],hr[0],hr[1])
    R['upperArmL']=eyxz(l[0],-l[1],l[2]);R['foreArmL']=exyz(l[3],0,0);R['handL']=exyz(l[4]-l[0]-l[3],hl[0],hl[1])
    return {k:(R[k].to_quaternion(),hp if k=='hips' else Vector(JOFF[k])) for k in JOINTS}
def fk_hand(L,side):
    """Матрица кисти в пространстве бёдер (как в игре: hips -> torso -> upperArm -> foreArm -> hand)."""
    m=Matrix.Identity(4)
    for j in('torso','upperArm'+side,'foreArm'+side,'hand'+side):q,pp=L[j];m=m@T(pp)@q.to_matrix().to_4x4()
    return m
def ik(p,side,target,iters=500):
    """Подбор углов руки (плечо 3 + локоть) так, чтобы кисть оказалась в target (пространство бёдер)."""
    p=P_(p);a=list(p[side]);tgt=Vector(target);seed=list(a)
    def err(v):
        q=dict(p);q[side]=v[:4]+[v[0]+v[3]];L=locals_(q);d=(fk_hand(L,side).translation-tgt).length
        return d*d+0.0004*sum((v[i]-seed[i])**2 for i in range(4))+(0.05*max(0,v[3]))**2
    v=a[:4]+[0];best=err(v);st=0.3
    for it in range(iters):
        imp=False
        for i in range(4):
            for s in(st,-st):
                w=list(v);w[i]+=s;e=err(w)
                if e<best:best,v,imp=e,w,True
        if not imp:
            st*=0.6
            if st<1e-4:break
    p[side]=v[:4]+[v[0]+v[3]];print('ik',side,round(math.sqrt(max(0,best)),3));return p
# ---------------------------------------------------------------- Blender: ключи
def bl_q(q):return Quaternion((q.w,q.x,-q.z,q.y))
def bl_v(v):return Vector((v.x,-v.z,v.y))
def gm_q(q):return Quaternion((q.w,q.x,q.z,-q.y))
def gm_v(v):return Vector((v.x,v.z,-v.y))
OBJ={}
def objs():
    for j in JOINTS:OBJ[j]=bpy.data.objects['AK__J_'+j]
    hips=OBJ['hips']
    for s in('R','L'):
        n='AK__J_sw'+s
        o=bpy.data.objects.get(n) or bpy.data.objects.new(n,None);o.empty_display_size=0.06;o.empty_display_type='ARROWS'
        if o.name not in bpy.context.scene.collection.all_objects:bpy.context.scene.collection.objects.link(o)
        o.parent=hips;M=SOCK[s]['M'];o.rotation_mode='QUATERNION';o.location=bl_v(M.translation);o.rotation_quaternion=bl_q(M.to_quaternion());OBJ['sw'+s]=o
    for o in OBJ.values():o.rotation_mode='QUATERNION'
def key_clip(name,keys):
    """keys: [(кадр, поза-dict, интерполяция)] -> Action на каждом суставе."""
    pref=bpy.context.preferences.edit;last={}
    for f,p,interp in keys:
        pref.keyframe_new_interpolation_type=interp;L=locals_(p)
        for j in JOINTS:
            o=OBJ[j];q=bl_q(L[j][0])
            if j in last and last[j].dot(q)<0:q=-q
            last[j]=q;o.rotation_quaternion=q;o.keyframe_insert('rotation_quaternion',frame=f)
            if j=='hips':o.location=bl_v(L[j][1]);o.keyframe_insert('location',frame=f)
    for j in JOINTS:
        a=OBJ[j].animation_data.action;a.name=name+'__'+j
    pref.keyframe_new_interpolation_type='BEZIER'
def stash(name):
    for o in OBJ.values():
        ad=o.animation_data
        if not ad or not ad.action:continue
        tr=ad.nla_tracks.new();tr.name=name;st=tr.strips.new(name,0,ad.action);tr.mute=True;ad.action=None
def sample(n):
    sc=bpy.context.scene;out=[]
    for f in range(0,n+1,STEP):
        sc.frame_set(f);L={}
        for j in JOINTS:
            o=OBJ[j];q=gm_q(o.rotation_quaternion.normalized());pp=gm_v(o.location) if j=='hips' else Vector(JOFF[j]);L[j]=(q,pp)
        out.append((f,L))
    return out
def mtx(q,p):m=q.to_matrix().to_4x4();m.translation=p;return m
def sword_track(frames,side,events,free=None):
    """events: [(кадр, режим)] режимы saya|slide|hand|free; смена режима плавно за 6 кадров.
    Возвращает по кадру [px,py,pz,qx,qy,qz,qw,a] в пространстве бёдер (a — «в руке»)."""
    S=SOCK[side];res=[];prev=None
    def mode_at(f):
        m=events[0][1];t0=0
        for fe,me in events:
            if f>=fe:m,t0=me,fe
        return m,t0
    def pose_of(m,f,L):
        if m=='saya':return S['M'].copy(),0.0
        H=fk_hand(L,side)
        if m=='hand':return H,1.0
        if m=='slide':
            s=max(0.0,min(S['L'],(H.translation-S['M'].translation).dot(-S['Z'])*1.55));M=S['M'].copy();M.translation=S['M'].translation-S['Z']*s;return M,0.0
        if m=='free':return free(f,L),0.0
    hist=[]
    for f,L in frames:
        m,t0=mode_at(f);M,a=pose_of(m,f,L)
        # плавный переход из предыдущего режима
        pm=None
        for fe,me in events:
            if fe==t0:break
            pm=me
        if pm and f-t0<6 and m!='free' and pm!='free':
            k=(f-t0)/6;k=k*k*(3-2*k);M0,a0=pose_of(pm,f,L)
            q=M0.to_quaternion().slerp(M.to_quaternion(),k);M=mtx(q,M0.translation.lerp(M.translation,k));a=a0+(a-a0)*k
        q=M.to_quaternion();t=M.translation
        if hist and Quaternion((hist[-1][6],*hist[-1][3:6])).dot(q)<0:q=-q
        res.append([round(t.x,4),round(t.y,4),round(t.z,4),round(q.x,4),round(q.y,4),round(q.z,4),round(q.w,4),round(a,3)]);hist.append(res[-1])
        o=OBJ['sw'+side];o.location=bl_v(t);o.rotation_quaternion=bl_q(q);o.keyframe_insert('location',frame=f);o.keyframe_insert('rotation_quaternion',frame=f)
    o=OBJ['sw'+side]
    if o.animation_data and o.animation_data.action:o.animation_data.action.name='clip__sw'+side
    return res
def pack(frames):
    q=[];h=[]
    for f,L in frames:
        for j in JOINTS:
            x=L[j][0];q+= [round(x.x,4),round(x.y,4),round(x.z,4),round(x.w,4)]
        p=L['hips'][1];h+=[round(p.x,4),round(p.y,4),round(p.z,4)]
    return q,h
# ---------------------------------------------------------------- хореография
def build(out_js):
    objs();CL={};SH=P_('rest',c=0.05,tx=0.03,ty=0.08,R=[0.06,0.05,0.14,-0.22,-0.16])
    SR,SL=SOCK['R'],SOCK['L']
    SH=ik(SH,'L',SL['M'].translation+Vector((0.03,-0.005,0.06)))   # левая ладонь на ножнах (большой палец на цубе)
    sheath=SH
    def grab(p,sides):
        for s in sides:p=ik(p,s,SOCK[s]['M'].translation+Vector((0,0,0.0)))
        return p
    def pull(p,sides,d=0.42):
        for s in sides:p=ik(p,s,SOCK[s]['M'].translation-SOCK[s]['Z']*d)
        return p
    crane=P_('crane')
    clips=[]
    # --- обнажение (оба меча)
    g=grab(P_(sheath,ty2=0.42,tx2=0.12,c=0.12,hy=0.12,nk=(0.15,-0.25,0)),'RL')
    pu=pull(P_(sheath,ty2=0.15,tx2=0.05,c=0.14,hy=0.05,nk=(0.05,-0.1,0)),'RL',0.5)
    clips.append(('draw',40,[(0,sheath,'SINE'),(11,g,'SINE'),(14,g,'CUBIC'),(24,pu,'EXPO'),(31,P_(crane,R=[-0.45,0.1,0.4,-0.4,0.75],L=[-0.75,0.2,0.4,-0.7,-0.55]),'SINE'),(40,crane,'BEZIER')],
        {'R':[(0,'saya'),(14,'slide'),(24,'hand')],'L':[(0,'saya'),(14,'slide'),(24,'hand')]}))
    # --- в ножны: тибури (стряхнуть кровь), затем вложить
    cw=P_(crane,R=[-1.9,-0.2,0.75,-1.3,-1.4],L=[-0.5,0.1,0.5,-0.6,-0.2],ty2=-0.15)
    cf=P_(crane,R=[-0.35,-0.45,0.85,-0.05,0.55],L=[-0.5,0.1,0.5,-0.6,-0.2],ty2=0.1,c=0.18)
    pu2=pull(P_(sheath,ty2=0.2,tx2=0.06,c=0.12),'RL',0.5);g2=grab(P_(sheath,ty2=0.38,tx2=0.1,c=0.1,hy=0.1),'RL')
    clips.append(('sheathe',72,[(0,crane,'SINE'),(12,cw,'EXPO'),(19,cf,'SINE'),(32,pu2,'SINE'),(50,g2,'SINE'),(56,g2,'SINE'),(72,sheath,'BEZIER')],
        {'R':[(0,'hand'),(32,'slide'),(54,'saya')],'L':[(0,'hand'),(32,'slide'),(54,'saya')]}))
    # --- idle: обнажить катану, подбросить, поймать, тибури, в ножны
    gR=grab(P_(sheath,ty2=0.35,tx2=0.1,c=0.08),'R');puR=pull(P_(sheath,ty2=0.1,c=0.08),'R',0.5)
    hold=P_(sheath,R=[-0.55,0.05,0.35,-0.55,0.6])
    wind=P_(sheath,c=0.14,R=[-0.15,0.15,0.3,-1.0,0.9],tx2=0.08)
    up=P_(sheath,c=0.02,R=[-2.5,0.1,0.25,-0.25,-1.6],tx2=-0.05,nk=(-0.35,0,0))
    ready=P_(sheath,c=0.04,R=[-2.0,0.12,0.25,-0.55,-1.2],nk=(-0.5,0,0))
    catch=P_(sheath,c=0.1,R=[-1.75,0.12,0.3,-0.75,-0.9],nk=(-0.25,0,0))
    cw2=P_(sheath,R=[-1.9,-0.2,0.75,-1.3,-1.4],ty2=-0.15);cf2=P_(sheath,R=[-0.35,-0.45,0.85,-0.05,0.55],ty2=0.1,c=0.16)
    puR2=pull(P_(sheath,ty2=0.15,c=0.1),'R',0.5);gR2=grab(P_(sheath,ty2=0.35,tx2=0.1,c=0.08),'R')
    TK=[(0,sheath,'SINE'),(16,gR,'SINE'),(20,gR,'CUBIC'),(32,puR,'EXPO'),(50,hold,'SINE'),(66,wind,'SINE'),(76,up,'EXPO'),(96,ready,'SINE'),(118,ready,'SINE'),(128,catch,'BACK'),
        (146,cw2,'EXPO'),(154,cf2,'SINE'),(176,puR2,'SINE'),(200,gR2,'SINE'),(206,gR2,'SINE'),(240,sheath,'BEZIER')]
    clips.append(('toss',240,TK,{'R':[(0,'saya'),(20,'slide'),(32,'hand'),(76,'free'),(118,'hand'),(176,'slide'),(204,'saya')],'L':[(0,'saya')]}))
    # --- атаки (кадры = startup/active/recovery из ATK в gC.js)
    rUp,rDn=P_('rUp'),P_('rDown')
    def A(n,keys):clips.append((n,keys[-1][0],keys,None))
    A('R1',[(0,crane,'SINE'),(10,P_(rUp,ty2=0.3,hy=0.15,c=0.16,nk=(0,-0.2,0)),'SINE'),(18,P_(rUp,ty2=0.42,tx2=-0.06,hy=0.2,c=0.18,R=[-3.1,0.12,0.32,-0.55,-3.85]),'EXPO'),
        (24,P_(rDn,ty2=-0.3,hy=-0.2,dp=(0,-0.03,0.08),thR=(-0.3,0,0),knR=0.25),'SINE'),(34,P_(rDn,ty2=-0.45,hy=-0.25,dp=(0,-0.04,0.1),thR=(-0.3,0,0),knR=0.25,R=[-0.35,0.9,0.15,-0.05,1.25]),'SINE'),(46,crane,'BEZIER')])
    r2a=P_('rDown',c=0.26,tx=0.3,ty=-0.55,R=[-0.6,0.95,0.12,-0.7,1.7]);r2b=P_('rUp',c=0.14,tx=0.02,ty=0.55,R=[-2.5,-0.35,0.65,-0.15,-2.3])
    A('R2',[(0,crane,'SINE'),(12,r2a,'SINE'),(18,P_(r2a,hy=-0.2,c=0.3),'EXPO'),(24,P_(r2b,hy=0.25,dp=(0,0.0,0.07),thL=(-0.25,0,0)),'SINE'),(34,P_(r2b,hy=0.3,ty2=0.15,R=[-2.75,-0.45,0.7,-0.1,-2.6]),'SINE'),(46,crane,'BEZIER')])
    sA,sB=P_('spinA'),P_('spinB')
    A('R3',[(0,crane,'SINE'),(10,P_(sA,hy=0.6,c=0.45),'SINE'),(16,P_(sA,hy=0.9,c=0.5),'EXPO'),(19,P_(sB,hy=-0.6,c=0.45),'LINEAR'),(22,P_(sB,hy=-2.1,c=0.42),'LINEAR'),(26,P_(sB,hy=-3.6,c=0.42,dp=(0,0.02,0)),'SINE'),
        (34,P_(sB,hy=-5.0,c=0.4),'SINE'),(42,P_(crane,hy=-5.9,c=0.3),'SINE'),(52,P_(crane,hy=-2*math.pi),'BEZIER')])
    lB,lT=P_('lBack'),P_('lThrust')
    A('L1',[(0,crane,'SINE'),(7,P_(lB,ty2=0.25,hy=0.1),'SINE'),(10,P_(lB,ty2=0.32,hy=0.12,c=0.2),'EXPO'),(14,P_(lT,ty2=-0.25,dp=(0,-0.04,0.12),thL=(-0.35,0,0),knL=0.3),'SINE'),(19,P_(lT,ty2=-0.3,dp=(0,-0.04,0.13),thL=(-0.35,0,0),knL=0.3),'SINE'),(26,crane,'BEZIER')])
    l2a=P_('lBack',ty=-0.4,L=[-1.3,-0.4,0.6,-0.9,-1.4]);l2b=P_('lThrust',ty=0.5,L=[-1.2,0.95,0.1,-0.15,-1.0])
    A('L2',[(0,crane,'SINE'),(7,l2a,'SINE'),(10,P_(l2a,hy=-0.15),'EXPO'),(14,P_(l2b,hy=0.2,dp=(0,-0.02,0.08)),'SINE'),(19,P_(l2b,hy=0.25,L=[-1.1,1.1,0.1,-0.1,-0.8]),'SINE'),(26,crane,'BEZIER')])
    l3a=P_('lBack',c=0.3,L=[0.4,0.2,0.3,-2.2,0.2]);l3b=P_('lThrust',c=0.32,L=[-1.6,0.25,0.0,-0.02,0.05])
    A('L3',[(0,crane,'SINE'),(7,P_(l3a,ty2=0.35),'SINE'),(10,P_(l3a,ty2=0.42,hy=0.15),'EXPO'),(14,P_(l3b,ty2=-0.35,dp=(0,-0.06,0.16),thL=(-0.45,0,0),knL=0.35,hy=-0.15),'SINE'),(19,P_(l3b,ty2=-0.38,dp=(0,-0.06,0.17),thL=(-0.45,0,0),knL=0.35),'SINE'),(26,crane,'BEZIER')])
    nU,nD=P_('nUp'),P_('nDown')
    A('N',[(0,crane,'SINE'),(9,P_(nU,tx2=-0.12,dp=(0,0.02,-0.03),nk=(-0.2,0,0)),'SINE'),(14,P_(nU,tx2=-0.18,dp=(0,0.03,-0.04),R=[-3.05,0.3,0.15,-0.45,-3.7],L=[-3.05,0.3,0.15,-0.45,-3.6]),'EXPO'),
        (20,P_(nD,tx2=0.2,dp=(0,-0.07,0.12),thR=(-0.35,0,0),knR=0.4),'SINE'),(28,P_(nD,tx2=0.25,dp=(0,-0.08,0.13),thR=(-0.35,0,0),knR=0.4,R=[-0.6,0.5,0.1,-0.05,1.0],L=[-0.6,0.5,0.1,-0.05,1.05]),'SINE'),(40,crane,'BEZIER')])
    A('X',[(0,crane,'SINE'),(6,P_(nD,c=0.5,tx2=0.15),'SINE'),(8,P_(nD,c=0.55,tx2=0.18),'EXPO'),(14,P_(nU,c=0.05,dp=(0,0.06,0.05),tx2=-0.2,nk=(-0.3,0,0)),'SINE'),(22,P_(nU,c=0.05,dp=(0,0.05,0.05),tx2=-0.25),'SINE'),(32,crane,'BEZIER')])
    # --- v0.13: катсцены, «Путь одной катаны», клипы Кагэмару (blender/anim13.py)
    import anim13,sys as _s;anim13.setup(_s.modules[__name__]);clips+=anim13.clips()
    import anim18;anim18.setup(_s.modules[__name__],anim13);clips+=anim18.clips()
    # --- запекание
    for name,n,keys,sw in clips:
        key_clip(name,keys);frames=sample(n);q,h=pack(frames);C=dict(n=n,q=q,h=h)
        if sw:
            C['sw']={}
            for s,ev in sw.items():
                free=None
                if name=='toss' and s=='R':free=toss_free(frames,76,118)
                C['sw'][s]=[x for row in sword_track(frames,s,ev,free) for x in row]
        stash(name);CL[name]=C
    sk={s:[round(x,4) for x in list(SOCK[s]['M'].translation)+list(SOCK[s]['M'].to_quaternion())[1:]+[SOCK[s]['M'].to_quaternion().w]] for s in('R','L')}
    js={'fps':FPS/STEP,'step':STEP,'joints':JOINTS,'poses':{'sheath':{k:sheath[k] for k in('c','tx','ty','R','L')}},'sockets':sk,'clips':CL}
    txt='// Сгенерировано blender/anim.py (Blender: Actions/NLA на AK__J_*). Не редактировать вручную.\nexport const ANIMS='+json.dumps(js,separators=(',',':'))+';\n'
    for p in out_js:
        if os.path.isdir(os.path.dirname(p)):open(p,'w').write(txt)
    for o in OBJ.values():
        if o.name.startswith('AK__J_sw'):continue
        o.rotation_quaternion=(1,0,0,0)
    OBJ['hips'].location=bl_v(Vector(JOFF['hips']))
    print('anims',len(CL),'clips',len(txt)//1024,'KB')
def toss_free(frames,f0,f1):
    """Баллистический полёт меча: от кисти в кадре f0 до кисти в кадре f1, 2 оборота вокруг локальной X."""
    F={f:L for f,L in frames};near=lambda f:F[min(F,key=lambda k:abs(k-f))]
    M0=fk_hand(near(f0),'R');M1=fk_hand(near(f1),'R');Tt=(f1-f0)/FPS;g=Vector((0,-9.8,0))
    v=(M1.translation-M0.translation-0.5*g*Tt*Tt)/Tt;q0,q1=M0.to_quaternion(),M1.to_quaternion()
    def fn(f,L):
        t=(f-f0)/FPS;k=max(0,min(1,t/Tt));p=M0.translation+v*t+0.5*g*t*t
        q=q0.slerp(q1,k)@Quaternion(Vector((1,0,0)),-2*math.tau*k);return mtx(q,p)
    return fn
