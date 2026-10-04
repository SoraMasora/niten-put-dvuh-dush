# v0.20: ГЛАВА 10 «Пустые глаза» — локация-фотограмметрия (старая частная школа Варёнам) и финальный босс Мудзин.
# python3 blender/ext/v20.py   -> blender/out/niten_v20.glb + game/src/gWd.js (многоуровневая nav, воксели камеры, кости босса, оружие)
# Исходники ($NITEN_SRC/v20, в git не хранятся; Sketchfab):
#   waryongam_old_private_educational_institution.glb — lacomi1975, CC-BY-4.0   (локация: дом-школа, двор, река, поля)
#   oldsamurai.glb                                     — Mikhail_Kozyrev, CC-BY-NC-4.0 (босс Мудзин; некоммерческая лицензия!)
import bpy,bmesh,sys,os,json,math,base64
import numpy as np
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'..'))
import lib as L
from v18 import clean,bake_xf,join,matname,decimate,verts,prefix_mats,seg_d
SRC=os.path.join(os.environ.get('NITEN_SRC','/data/src'),'v20')
ROOT=os.path.join(HERE,'..','..');OUT=os.path.join(HERE,'..','out','v20');os.makedirs(OUT,exist_ok=True)
def f(n):return os.path.join(SRC,n)
S=3.6;Z0=1.9                 # масштаб фотограмметрии (дом ~9 м) и высота двора -> y=0
CS=0.3;STEP=0.5;CLEAR=1.7    # nav: клетка, макс. перепад между соседями, мин. высота над полом
TRIS=1000000                 # бюджет треугольников локации (v0.21: было 300 тыс.)
RSTEP=1.0;RAMPS=[([(3.0,1.8),(3.4,-3.0),(3.0,-7.8)],2.6),([(10.5,-0.8),(11.0,-4.5),(7.6,-6.4)],2.2)]   # тропы к воде (игровые x,z), ширина
DOOR=(9.9,9.4)               # восточная дверь дома (игровые x,z) — выход героя
BOSS=(3.0,-13.0)              # v0.21: на воде (река под скалами) — Мудзин
# ------------------------------------------------------------------ локация
NEAR=(-32,44,-36,18)          # игровая зона (x0,x1,z0,z1): дом, двор, скалы, река — детализация почти полная
def location():
    n0=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=f('waryongam_old_private_educational_institution.glb'))
    new=[o for o in bpy.data.objects if o not in n0];ms=[o for o in new if o.type=='MESH' and len(o.data.polygons)]
    for o in ms:bake_xf(o)
    for o in [o for o in new if o not in ms]:bpy.data.objects.remove(o)
    M=Matrix.Scale(S,4)@Matrix.Translation((0,0,-Z0))
    for o in ms:o.data.transform(M);o.data.update()
    # v0.21: один меш (без щелей между кусками скана), сварка швов, затем прореживание: дальние поля сильно, игровая зона почти не трогается
    o=join(ms,'w0loc');bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=0.004);bm.to_mesh(o.data);bm.free();o.data.update()
    n0=sum(len(p.vertices)-2 for p in o.data.polygons)
    vg=o.vertex_groups.new(name='far');x0,x1,z0,z1=NEAR;co=verts(o)
    far=[i for i,c in enumerate(co) if not(x0<c[0]<x1 and z0<-c[1]<z1)]
    vg.add(far,1.0,'REPLACE')
    nf=min(n0*0.9,len(far)*2.0);m=o.modifiers.new('dec','DECIMATE');m.ratio=max(0.05,(n0-0.72*nf)/n0);print('LOC far verts',len(far),'ratio',m.ratio);m.vertex_group='far';m.use_collapse_triangulate=True;L.apply_mods(o)
    o.vertex_groups.clear();n1=sum(len(p.vertices)-2 for p in o.data.polygons)
    decimate(o,TRIS)
    print('LOC tris',n0,'->',n1,'->',sum(len(p.vertices)-2 for p in o.data.polygons))
    ms=[o]
    prefix_mats(ms,'w0_')
    for im in bpy.data.images:
        if im.users and not im.name.startswith('w0_'):im.name='w0_'+im.name
    return ms
def bvh_of(objs):
    bm=bmesh.new()
    for o in objs:
        t=bmesh.new();t.from_mesh(o.data);bmesh.ops.triangulate(t,faces=t.faces[:]);me=bpy.data.meshes.new('tmp');t.to_mesh(me);t.free();bm.from_mesh(me);bpy.data.meshes.remove(me)
    return BVHTree.FromBMesh(bm)
def navbake(ms):
    T=bvh_of(ms);P=np.concatenate([verts(o) for o in ms]);mn,mx=P.min(0),P.max(0)
    x0=math.floor(mn[0]);x1=math.ceil(mx[0]);z0=math.floor(-mx[1]);z1=math.ceil(-mn[1])
    w=int(round((x1-x0)/CS));h=int(round((z1-z0)/CS));dn=Vector((0,0,-1));up=Vector((0,0,1));top0=float(mx[2])+2
    print('NAV grid',w,h,'bounds',x0,x1,z0,z1)
    LAY=[[[] for i in range(w)] for j in range(h)]
    for j in range(h):
        z=z0+(j+.5)*CS
        for i in range(w):
            x=x0+(i+.5)*CS;hits=[];top=top0
            for k in range(12):
                r=T.ray_cast(Vector((x,-z,top)),dn,80)
                if r[0] is None:break
                p,n=r[0],r[1]
                if n.z>0.45:
                    c=T.ray_cast(p+up*0.05,up,10);cl=(c[3]+0.05) if c[0] is not None else 99
                    if cl>=CLEAR:hits.append(round(p.z,3))
                top=p.z-0.05
            hs=[]
            for y in sorted(hits):
                if hs and y-hs[-1]<0.25:hs[-1]=y
                else:hs.append(y)
            LAY[j][i]=hs
    # v0.21: «тропы» по скалам между двором и рекой — шаг до RSTEP, без проверки стен (герой перелезает камни)
    RM=np.zeros((h,w),bool)
    for pts,wd in RAMPS:
        for (ax,az),(bx,bz) in zip(pts,pts[1:]):
            for j in range(h):
                z=z0+(j+.5)*CS
                for i in range(w):
                    x=x0+(i+.5)*CS;sx,sz=bx-ax,bz-az;t=max(0,min(1,((x-ax)*sx+(z-az)*sz)/(sx*sx+sz*sz)))
                    if math.hypot(x-ax-sx*t,z-az-sz*t)<=wd/2:RM[j,i]=True
    print('NAV ramp cells',int(RM.sum()))
    def lim(j,i,j2,i2):return RSTEP if RM[j,i] and RM[j2,i2] else STEP
    def passable(j,i,hA,j2,i2,hB):
        if RM[j,i] and RM[j2,i2]:return abs(hA-hB)<=RSTEP
        if abs(hA-hB)>STEP:return False
        a=Vector((x0+(i+.5)*CS,-(z0+(j+.5)*CS),0));b=Vector((x0+(i2+.5)*CS,-(z0+(j2+.5)*CS),0))
        for dy in(0.5,1.3):
            yy=max(hA,hB)+dy;pa=Vector((a.x,a.y,yy));d=Vector((b.x,b.y,yy))-pa
            if T.ray_cast(pa,d.normalized(),d.length)[0] is not None:return False
        return True
    D4=((0,1),(0,-1),(1,0),(-1,0))
    sj=int((DOOR[1]-z0)/CS);si=int((DOOR[0]-x0)/CS)
    # стартовый узел: ближайшая к двери ячейка с полом около y=0
    best=None
    for r in range(12):
        for dj in range(-r,r+1):
            for di in range(-r,r+1):
                a,b=sj+dj,si+di
                if 0<=a<h and 0<=b<w:
                    for q,y in enumerate(LAY[a][b]):
                        s=abs(y-0.3)+0.3*math.hypot(dj,di)
                        if best is None or s<best[0]:best=(s,a,b,q)
        if best:break
    _,sj,si,s0=best;print('NAV start',sj,si,LAY[sj][si])
    R={(sj,si,s0)};st=[(sj,si,s0)];E={}
    while st:
        j,i,q=st.pop();hA=LAY[j][i][q]
        for d,(dj,di) in enumerate(D4):
            a,b=j+dj,i+di
            if not(0<=a<h and 0<=b<w):continue
            bq=None
            for q2,hB in enumerate(LAY[a][b]):
                if abs(hB-hA)<=lim(j,i,a,b) and (bq is None or abs(hB-hA)<abs(LAY[a][b][bq]-hA)):bq=q2
            if bq is None or not passable(j,i,hA,a,b,LAY[a][b][bq]):continue
            E[(j,i,q,d)]=bq
            if (a,b,bq) not in R:R.add((a,b,bq));st.append((a,b,bq))
    print('NAV nodes',len(R))
    NL=1   # единицы ячеек с двумя слоями (карнизы, выступы скал) -> слой с наибольшим числом связей
    HH=np.zeros((NL,h,w),'<u2');CC=np.zeros((NL,h,w),np.uint8);idx={};ho=-12.0
    for j in range(h):
        for i in range(w):
            ql=sorted([q for q in range(len(LAY[j][i])) if (j,i,q) in R],key=lambda q:-sum(1 for d in range(4) if (j,i,q,d) in E))[:NL]
            for k,q in enumerate(ql):idx[(j,i,q)]=k;HH[k,j,i]=int(round((LAY[j][i][q]-ho)*100))
    for (j,i,q),k in idx.items():
        c=0
        for d,(dj,di) in enumerate(D4):
            q2=E.get((j,i,q,d))
            if q2 is None or (j+dj,i+di,q2) not in idx:continue
            c|=(idx[(j+dj,i+di,q2)]+1)<<(2*d)
        CC[k,j,i]=c
    # воксели для клипа камеры
    VS=0.5;vy0=-7.0;vy1=13.0;vw=int(round((x1-x0)/VS));vh=int(round((z1-z0)/VS));vn=int(round((vy1-vy0)/VS))
    bits=np.zeros(vw*vh*vn,np.uint8)
    for k in range(vn):
        yy=vy0+(k+.5)*VS
        for j in range(vh):
            zz=z0+(j+.5)*VS
            for i in range(vw):
                c=Vector((x0+(i+.5)*VS,-zz,yy));r=T.find_nearest(c,0.45)
                if r[0] is not None and (r[3]<0.12 or (c-r[0]).dot(r[1])<0):bits[(k*vh+j)*vw+i]=1
    print('VOX',vw,vh,vn,'solid',int(bits.sum()))
    vox=dict(s=VS,y0=vy0,w=vw,h=vh,n=vn,b=base64.b64encode(np.packbits(bits).tobytes()).decode())
    np.save(os.path.join(OUT,'navH.npy'),HH);np.save(os.path.join(OUT,'navC.npy'),CC)
    return dict(x0=x0,z0=z0,cs=CS,w=w,h=h,ho=ho,nl=NL,step=STEP,H=base64.b64encode(HH.tobytes()).decode(),C=base64.b64encode(CC.tobytes()).decode(),vox=vox)
# ------------------------------------------------------------------ босс Мудзин (CAT-риг -> 23 кости, веса в вершинном цвете, оружие отдельно)
MZ_B=[('hips',-1,'CATRigHub001_01','CATRigSpine1_011'),('spine',0,'CATRigSpine1_011','CATRigSpine2_012'),('chest',1,'CATRigSpine2_012','CATRigHub002_013'),
 ('chest2',2,'CATRigHub002_013','CATRigSpine1_014'),('neck',3,'CATRigSpine1_014','CATRigHub003_015'),('head',4,'CATRigHub003_015',(0,0,150)),('hair',5,'Hair_01_016','Hair_06_021'),
 ('clavL',3,'CATRigLArmCollarbone_022','CATRigLArm1_023'),('armL',7,'CATRigLArm1_023','CATRigLArm2_024'),('foreL',8,'CATRigLArm2_024','CATRigLArmPalm_025'),('handL',9,'CATRigLArmPalm_025','CATRigLArmDigit31_032'),
 ('clavR',3,'CATRigRArmCollarbone_042','CATRigRArm1_043'),('armR',11,'CATRigRArm1_043','CATRigRArm2_044'),('foreR',12,'CATRigRArm2_044','CATRigRArmPalm_045'),('handR',13,'CATRigRArmPalm_045','CATRigRArmDigit31_052'),
 ('thighL',0,'CATRigLLeg1_02','CATRigLLeg2_03'),('shinL',15,'CATRigLLeg2_03','CATRigLLegAnkle_04'),('footL',16,'CATRigLLegAnkle_04','CATRigLLegDigit11_05'),
 ('thighR',0,'CATRigRLeg1_06','CATRigRLeg2_07'),('shinR',18,'CATRigRLeg2_07','CATRigRLegAnkle_08'),('footR',19,'CATRigRLegAnkle_08','CATRigRLegDigit11_09'),
 ('skirtF',0,'CATRigHub001_01',(0,-60,-420)),('skirtB',0,'CATRigHub001_01',(0,90,-420))]
def mz_map(n):
    b=n.split('_')[0] if not n.startswith('Hair') else 'Hair'
    if n.startswith(('Cloth','Ropes','CATRigSpine1_011_')):return 'cloth'
    if n.startswith(('Armor01','Armor02')):return 'pad'
    if n.startswith('Armor03') or n.startswith('CATRigRArm2_044_'):return 'foreR'
    if n.startswith('Hair'):return 'hair'
    T={'CATRigHub001':'hips','CATRigHub001Bone001':'hips','CATRigSpine1':'spine','CATRigSpine2':'chest','CATRigHub002':'chest2','CATRigHub003':'head'}
    if n.startswith('CATRigSpine1_014') or n.startswith('CATRigSpine2_00'):return 'neck'
    if b in T:return T[b]
    for sd in 'LR':
        if b=='CATRig%sArmCollarbone'%sd:return 'clav'+sd
        if b=='CATRig%sArm1'%sd:return 'arm'+sd
        if b=='CATRig%sArm2'%sd:return 'fore'+sd
        if b.startswith('CATRig%sArmPalm'%sd) or b.startswith('CATRig%sArmDigit'%sd):return 'hand'+sd
        if b=='CATRig%sLeg1'%sd:return 'thigh'+sd
        if b=='CATRig%sLeg2'%sd:return 'shin'+sd
        if b.startswith('CATRig%sLegAnkle'%sd) or b.startswith('CATRig%sLegDigit'%sd):return 'foot'+sd
    return None
def mudzin(H=1.9):
    n0=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=f('oldsamurai.glb'),guess_original_bind_pose=False);new=[o for o in bpy.data.objects if o not in n0]
    arm=[o for o in new if o.type=='ARMATURE'][0]
    if arm.animation_data:arm.animation_data.action=None
    for pb in arm.pose.bones:pb.matrix_basis.identity()
    bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
    ms=[o for o in new if o.type=='MESH' and len(o.data.vertices)>=50 and not o.name.startswith('Floor') and o.vertex_groups]
    for o in ms:
        e=o.evaluated_get(dg);m=e.to_mesh();PP=[tuple(e.matrix_world@v.co) for v in m.vertices];e.to_mesh_clear()
        if o.data.users>1:o.data=o.data.copy()
        for v,p in zip(o.data.vertices,PP):v.co=p
        for md in list(o.modifiers):o.modifiers.remove(md)
        o.parent=None;o.matrix_world=Matrix.Identity(4);o.data.update()
    bh={pb.name:arm.matrix_world@pb.head for pb in arm.pose.bones};bt={pb.name:arm.matrix_world@pb.tail for pb in arm.pose.bones}
    for o in [o for o in new if o not in ms]:bpy.data.objects.remove(o)
    def dom(o):
        acc={}
        for v in o.data.vertices:
            for g in v.groups:acc[o.vertex_groups[g.group].name]=acc.get(o.vertex_groups[g.group].name,0)+g.weight
        return max(acc,key=acc.get)
    wkat=[o for o in ms if dom(o).startswith('Katana_02')][0];wsaya=[o for o in ms if dom(o).startswith('Katana_01')][0]
    body=[o for o in ms if o not in(wkat,wsaya)]
    allc=np.concatenate([verts(o) for o in body]);mn,mx=allc.min(0),allc.max(0);s=H/(mx[2]-mn[2]);hp=bh['CATRigHub001_01']
    M=Matrix.Scale(s,4)@Matrix.Translation((-hp.x,-hp.y,-mn[2]))
    for o in ms:o.data.transform(M);o.data.update()
    Pt=lambda v:M@Vector(v)
    B=[];pts=[]
    for nm,p,hn,tn in MZ_B:
        hb=Pt(bh[hn]);tb=Pt(bh[hn]+Vector(tn)) if isinstance(tn,tuple) else Pt(bt[tn] if nm=='hair' else bh[tn])
        pts.append((hb,tb));B.append([nm,p]+[round(x,4) for x in(hb.x,hb.z,-hb.y,tb.x,tb.z,-tb.y)])
    names=[b[0] for b in MZ_B];SA=np.array([[a.x,a.y,a.z] for a,b in pts]);SB=np.array([[b.x,b.y,b.z] for a,b in pts])
    # --- оружие: локальные рамки (катана: начало у цубы, +Y к острию; ножны: начало у устья, +Y к кодзири)
    def frame(o,palm,kind):
        P=verts(o);c=P.mean(0);U,Sv,Vt=np.linalg.svd(P-c,full_matrices=False);a=Vt[0];b=Vt[1]
        t=(P-c)@a;pp=np.array(palm);tp=(pp-c)@a
        if kind=='saya':
            if abs(t.min()-tp)>abs(t.max()-tp):a=-a;b=-b;t=-t;tp=-tp
            o0=t.min();org=c+a*o0;grip=tp-o0;Ln=t.max()-o0
        else:
            # острие — дальний от ладони конец; цуба — максимум радиуса на участке 8..45% от навершия
            if abs(t.min()-tp)>abs(t.max()-tp):a=-a;b=-b;t=-t;tp=-tp
            L0=t.min();Lt=t.max()-L0;rad=np.linalg.norm((P-c)-np.outer(t,a),axis=1);best=None
            for u in np.linspace(0.08,0.45,60):
                m=np.abs(t-(L0+u*Lt))<Lt*0.012
                if m.sum()>3:
                    r=rad[m].max()
                    if best is None or r>best[0]:best=(r,u)
            ts=L0+best[1]*Lt;org=c+a*ts;grip=tp-ts;Ln=t.max()-ts
        Z=Vector(a.tolist());Y=Vector((-b).tolist());Y=(Y-Z*Y.dot(Z)).normalized();X=Y.cross(Z)
        R=Matrix((X,Y,Z)).to_4x4();Mw=R@Matrix.Translation(-Vector(org.tolist()))
        o.data.transform(Mw);o.data.update();return dict(len=round(float(Ln),4),grip=round(float(grip),4),pommel=round(float(-(ts-L0)) if kind=='kat' else 0,4))
    Pp=lambda n:list(M@bh[n])
    kinfo=frame(wkat,Pp('CATRigLArmPalm_025'),'kat');sinfo=frame(wsaya,Pp('CATRigRArmPalm_045'),'saya')
    # ножны -> две половины (ломаются об колено в фазе 2)
    wsb=wsaya.copy();wsb.data=wsaya.data.copy();bpy.context.scene.collection.objects.link(wsb)
    cut=sinfo['len']*0.46
    for o,keep in((wsaya,lambda z:z<cut),(wsb,lambda z:z>=cut)):
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.delete(bm,geom=[fc for fc in bm.faces if not keep(fc.calc_center_median().z)],context='FACES');bm.to_mesh(o.data);bm.free();o.data.update()
    for o in(wkat,wsaya,wsb):
        for vg in list(o.vertex_groups):o.vertex_groups.remove(vg)
    wkat.name='V8Z__kat__m';wsaya.name='V8Z__sayaA__m';wsb.name='V8Z__sayaB__m';sinfo['cut']=round(cut,4)
    # --- тело: наплечник (Armor01/02) — отдельный меш (снимается в фазе 2)
    pad=[o for o in body if mz_map(dom(o))=='pad'];rest=[o for o in body if o not in pad]
    prefix_mats(ms+[wsb],'n0z_')
    for m in bpy.data.materials:
        if m.name.startswith('n0z_'):
            m.blend_method='CLIP' if hasattr(m,'blend_method') else None
            try:m.alpha_threshold=0.5
            except Exception:pass
    out={}
    for key,objs in(('body',rest),('pad',pad)):
        o=join(objs,'V8Z__%s__m'%key);co=verts(o);nv=len(co);W=np.zeros((nv,len(names)))
        gm={vg.index:mz_map(vg.name) for vg in o.vertex_groups}
        hy=pts[0][0].y
        for v in o.data.vertices:
            for g in v.groups:
                k=gm.get(g.group)
                if g.weight<=0:continue
                if k=='cloth':
                    p=co[v.index];sk='skirtF' if p[1]<hy else 'skirtB'
                    k=sk
                elif k=='pad':k='armR'
                if k is None:
                    D=np.array([seg_d(co[v.index][None],SA[q],SB[q])[0] for q in range(len(names))]);k=names[int(D.argmin())]
                W[v.index,names.index(k)]+=g.weight
        empty=W.sum(1)<=1e-6
        if empty.any():
            D=np.stack([seg_d(co[empty],SA[q],SB[q]) for q in range(len(names))],1);W[np.where(empty)[0],D.argmin(1)]=1
        o2=np.argsort(-W,1)[:,:2];w1=W[np.arange(nv),o2[:,0]];w2=W[np.arange(nv),o2[:,1]];wt=np.where(w1+w2>0,w1/(w1+w2+1e-9),1)
        ca=o.data.color_attributes.new('Col','FLOAT_COLOR','POINT');col=np.zeros((nv,4));col[:,0]=(o2[:,0]+1)/32.0;col[:,1]=np.where(w2>1e-4,(o2[:,1]+1)/32.0,0);col[:,2]=wt;col[:,3]=1
        ca.data.foreach_set('color',col.ravel().astype(np.float32));o.data.color_attributes.active_color=ca
        while o.vertex_groups:o.vertex_groups.remove(o.vertex_groups[0])
        out[key]=o;print('MZ',key,'tris',sum(len(p.vertices)-2 for p in o.data.polygons),'usage',dict(zip(names,np.bincount(o2[:,0],minlength=len(names)).tolist())))
    for o in(wkat,wsaya,wsb):
        ca=o.data.color_attributes.new('Col','FLOAT_COLOR','POINT');ca.data.foreach_set('color',np.tile([0,0,0,1],len(o.data.vertices)).astype(np.float32));o.data.color_attributes.active_color=ca
    for im in list(bpy.data.images):
        if not im.users:continue
        if not im.name.startswith('n0z_'):im.name='n0z_'+im.name
        big=('Image_0' in im.name);mxs=2048 if big else 1024
        if im.size[0]>mxs:im.scale(mxs,mxs)
    co=verts(out['body']);print('MZ bbox game',co.min(0).round(3),co.max(0).round(3))
    return dict(B=B,kat=kinfo,saya=sinfo,palmL=[round(x,4) for x in(lambda v:(v.x,v.z,-v.y))(M@bh['CATRigLArmPalm_025'])],palmR=[round(x,4) for x in(lambda v:(v.x,v.z,-v.y))(M@bh['CATRigRArmPalm_045'])])
# ------------------------------------------------------------------ сборка
def build_all():
    clean();ms=location();nav=navbake(ms)
    for k,o in enumerate(ms):o.name='LV__w0__%d'%k
    mz=mudzin()
    for im in bpy.data.images:
        if im.users and im.packed_file is None and im.size[0]:
            try:im.pack()
            except Exception:pass
    fn=os.path.join(HERE,'..','out','niten_v20.glb')
    bpy.ops.export_scene.gltf(filepath=fn,export_format='GLB',export_image_format='WEBP',export_image_quality=78,export_yup=True,export_apply=True,
        export_tangents=False,export_morph=False,export_skins=False,export_animations=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    print('V20 GLB',os.path.getsize(fn))
    D=dict(nav=nav,door=list(DOOR),boss=list(BOSS),mz=mz)
    open(os.path.join(ROOT,'game','src','gWd.js'),'w').write('// v0.20 (генерирует blender/ext/v20.py): nav локации «Варёнам», воксели камеры, кости и оружие Мудзина.\nconst W0D='+json.dumps(D,separators=(',',':'))+';\n')
    print('gWd.js ok')
if __name__=='__main__':
    stage=sys.argv[-1]
    if stage=='mz':
        clean();mz=mudzin();json.dump(mz,open(os.path.join(OUT,'mz.json'),'w'))
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'mz.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=78,export_yup=True,export_apply=True,export_skins=False,export_animations=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    elif stage=='loc':
        clean();ms=location();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'loc.blend'))
    else:build_all()
