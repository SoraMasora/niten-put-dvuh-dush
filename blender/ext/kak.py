# v0.14: деревня Какарико (родная деревня героя) — kakariko_village_ocarina_of_time.glb + old_smithy.glb + интерьеры.
# python3 blender/ext/kak.py lv    -> blender/out/kak/lv.glb + kak.json (nav с высотами, двери, комнаты) + карта деревни
# python3 blender/ext/kak.py pack  -> blender/out/niten_kak.glb (LV__kak*, XS__sarah/orc/smith/girl, KK__hammer) и game/src/gK.js
# Координаты: blender (x,y,z) -> three (x,z,-y). Центр деревни — бывший колодец (дыра) в (0,0).
import bpy,bmesh,sys,os,json,math,base64,numpy as np
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from cfg import SRC,PREP
OUT=os.path.join(HERE,'..','out','kak');os.makedirs(OUT,exist_ok=True)
S=0.024;WELL=(760,-518)              # единицы OoT -> метры; колодец
NAVB=(-92,54,-52,38);CS=0.4          # область nav (игровые x0,x1,z0,z1)
SMITHY=dict(pos=(1.2,8.6),S=4.6,c=(0.3,-0.13))   # кузница у дыры-колодца (игровые x,z), открытой стороной к колодцу
NOBVH=('_mat18_','_mat1_')               # трава-карточки и крона дерева: проходимы
ROOMS=[  # интерьеры: размеры (w по x, d по z, h), шаблон; ставятся далеко от деревни (x=300+30k)
 dict(n='home',w=7.2,d=6.0,h=3.3),dict(n='tavern',w=8.4,d=6.4,h=3.5),dict(n='small',w=6.0,d=5.2,h=3.0)]
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def meshes(pre=None):return [o for o in bpy.data.objects if o.type=='MESH' and (pre is None or o.name.startswith(pre))]
def flatten_import(fp,skip=()):
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=fp);bpy.context.view_layer.update()
    new=[o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.type=='MESH':
            if o.data.users>1:o.data=o.data.copy()
            M=o.matrix_world.copy();o.parent=None;o.data.transform(M);o.matrix_world=Matrix()
    out=[]
    for o in new:
        if o.type!='MESH' or any(s==o.name or o.name.startswith(s) for s in skip):bpy.data.objects.remove(o)
        else:out.append(o)
    return out
def img_of(m):
    if not m or not m.use_nodes:return None,None
    for n in m.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED':
            l=n.inputs['Base Color'].links
            if l and l[0].from_node.type=='TEX_IMAGE':return l[0].from_node,n
            return None,n
    return None,None
def matfix(pref):
    for m in bpy.data.materials:
        if m.name.startswith('lv_'):continue
        tex,bs=img_of(m);m.name=pref+m.name
        if not bs:continue
        nt=m.node_tree
        for k in('Normal','Roughness','Metallic','Alpha'):
            for l in list(bs.inputs[k].links):nt.links.remove(l)
        bs.inputs['Alpha'].default_value=1.0;bs.inputs['Roughness'].default_value=0.85;bs.inputs['Metallic'].default_value=0.0
        if tex and tex.image and tex.image.size[0]:
            w,h=tex.image.size;a=np.empty(w*h*4,np.float32);tex.image.pixels.foreach_get(a);al=a[3::4]
            if al.mean()<0.985:
                r=nt.nodes.new('ShaderNodeMath');r.operation='ROUND';nt.links.new(tex.outputs['Alpha'],r.inputs[0]);nt.links.new(r.outputs[0],bs.inputs['Alpha'])
                m.use_backface_culling=False;print('MASK',m.name,round(float(al.mean()),2))
        try:m.surface_render_method='DITHERED'
        except Exception:pass
PMAT=[]
def ground_bvh(objs):
    V=[];F=[];PMAT.clear()
    for o in objs:
        n=len(V);V+=[v.co.copy() for v in o.data.vertices];F+=[[n+i for i in p.vertices] for p in o.data.polygons]
        PMAT.extend((o.data.materials[p.material_index].name if o.data.materials else '') for p in o.data.polygons)
    return BVHTree.FromPolygons(V,F,epsilon=0.0)
ROOF=('mat26',)   # черепица крыш — не ходить по крышам
# ------------------------------------------------------------------ деревня
def village():
    obs=flatten_import(os.path.join(SRC,'kak','kakariko_village_ocarina_of_time.glb'),skip=('Cube',))
    T=Matrix.Scale(S,4)@Matrix.Translation((-WELL[0],-WELL[1],0))
    for o in obs:o.data.transform(T);o.name='kakv_'+o.name
    return obs
HOUSES=[  # дома с входом (центр, игровые x,z): шаблон комнаты и жилец
 dict(id='A',c=(-30,-30),room=2,npc=None),dict(id='C',c=(-31,9),room=0,npc='sarah'),
 dict(id='D',c=(-20,24),room=1,npc='orc'),dict(id='F',c=(-14,-10),room=2,npc='girl')]
def place_doors(T,R,H):
    """дверь на стене дома: из проходимых клеток рядом луч к центру дома; стена ровная и широкая, перед ней свободно"""
    gx0,gx1,gz0,gz1=NAVB;h,w=R.shape;out=[]
    def ok(x,z):
        i=int((x-gx0)/CS);j=int((z-gz0)/CS);return 0<=i<w and 0<=j<h and R[j,i]
    def hg(x,z):return float(H[int((z-gz0)/CS),int((x-gx0)/CS)])
    for hs in HOUSES:
        cx,cz=hs['c'];best=None
        for j in range(h):
            for i in range(w):
                if not R[j,i]:continue
                x=gx0+(i+.5)*CS;z=gz0+(j+.5)*CS;dd=math.hypot(x-cx,z-cz)
                if dd>13 or dd<2:continue
                g=H[j,i];d=Vector((cx-x,-(cz-z),0)).normalized();r=T.ray_cast(Vector((x,-z,g+1.0)),d,2.6)
                if r[0] is None or abs(r[1].z)>0.15:continue
                n=Vector((r[1].x,r[1].y,0)).normalized()
                if n.dot(d)>-0.85:continue
                p=r[0];tg=Vector((-n.y,n.x,0));flat=True
                if math.hypot(p.x-cx,-p.y-cz)>hs.get('r',5.5):continue
                for a in(-0.75,0,0.75):
                    for hh in(0.15,1.2,2.5):
                        o=p+n*0.5+tg*a;o.z=g+hh;q=T.ray_cast(o,-n,0.8)
                        if q[0] is None or abs((q[0]-p).dot(n))>0.06:flat=False;break
                    if not flat:break
                if not flat:continue
                # перед дверью свободно и ровно
                fr=sum(1 for k in range(1,9) for a in(-0.6,0,0.6) if ok(p.x+n.x*0.35*k+tg.x*a,-(p.y+n.y*0.35*k+tg.y*a)) and abs(hg(p.x+n.x*0.35*k+tg.x*a,-(p.y+n.y*0.35*k+tg.y*a))-g)<0.35)
                sc=fr-0.15*dd
                if best is None or sc>best[0]:best=(sc,p.copy(),n.copy(),g)
        if not best:print('NO DOOR',hs['id']);continue
        sc,p,n,g=best;out.append(dict(id=hs['id'],room=hs['room'],npc=hs['npc'],x=round(p.x,3),z=round(-p.y,3),y=round(g,3),nx=round(n.x,4),nz=round(-n.y,4)))
        print('DOOR',out[-1],'score',round(sc,1))
    return out
def door_mesh(D,M):
    """дверь (рама, створка из досок, порог, фонарь-навес) на стене дома"""
    for d in D:
        P=[];x,z,y=d['x'],d['z'],d['y'];ang=math.atan2(d['nx'],d['nz'])
        Mx=Matrix.Translation((x,-z,y))@Matrix.Rotation(ang,4,'Z')   # локально: +y blender = -z игры... используем: локальная -Y -> нормаль наружу
        def B(nm,c,s,mt):
            o=box('door%s_%s'%(d['id'],nm),c,s,M[mt],0.6,P);o.data.transform(Mx);return o
        # локальные оси: x — вдоль стены, -y — наружу (нормаль), z — вверх
        B('frameL',(-0.72,-0.07,1.2),(0.16,0.16,2.4),'beam');B('frameR',(0.72,-0.07,1.2),(0.16,0.16,2.4),'beam');B('lintel',(0,-0.08,2.45),(1.66,0.2,0.2),'beam')
        B('leaf',(0,-0.03,1.15),(1.28,0.06,2.3),'door');B('sill',(0,-0.25,0.04),(1.7,0.5,0.08),'stone')
        B('roof',(0,-0.42,2.72),(2.0,0.85,0.08),'roof');B('bracketL',(-0.85,-0.3,2.6),(0.08,0.6,0.08),'beam');B('bracketR',(0.85,-0.3,2.6),(0.08,0.6,0.08),'beam')
        B('lamp',(0.95,-0.22,2.05),(0.16,0.16,0.26),'win')
        for o in P:o.name='kakd_'+o.name
# ------------------------------------------------------------------ кузница
def smithy(Tg):
    obs=flatten_import(os.path.join(SRC,'kak','old_smithy.glb'),skip=('Cube','Icosphere','sparkle','Plane001'))
    C=SMITHY;x,z=C['pos'];h=Tg.ray_cast(Vector((x,-z,60)),Vector((0,0,-1)),200)[0];y=h.z if h else 0
    M=Matrix.Translation((x,-z,y))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Scale(C['S'],4)@Matrix.Translation((-C['c'][0],-C['c'][1],0))
    for o in obs:o.data.transform(M);o.name='kaks_'+o.name
    C['y']=y;C['M']=M
    def lp(lx,ly,lz=0):v=M@Vector((lx,ly,lz));return (round(v.x,3),round(v.z,3),round(-v.y,3))
    # точки для игры: кузнец за наковальней, наковальня (верх), горн, точка разговора (перед наковальней)
    C['pts']=dict(smith=lp(0.33,0.14),anvil=lp(0.505,0.14,0.185),forge=lp(0.2,-0.09,0.16),talk=lp(0.78,0.14),well=(0,0,0))
    print('SMITHY y',round(y,2),C['pts']);return obs
# ------------------------------------------------------------------ nav с высотами
def navbake(T,doorsL,spawn):
    gx0,gx1,gz0,gz1=NAVB;w=int(round((gx1-gx0)/CS));h=int(round((gz1-gz0)/CS))
    H=np.full((h,w),np.nan);NZ=np.zeros((h,w));dn=Vector((0,0,-1));up=Vector((0,0,1))
    for j in range(h):
        for i in range(w):
            bx=gx0+(i+.5)*CS;by=-(gz0+(j+.5)*CS);r=T.ray_cast(Vector((bx,by,90)),dn,300)
            if r[0] is not None:H[j,i]=r[0].z;NZ[j,i]=0 if any(m in PMAT[r[2]] for m in ROOF) else abs(r[1].z)
    dirs=[Vector((math.cos(a),math.sin(a),0)) for a in np.arange(8)*math.pi/4];pad=0.4
    W=np.zeros((h,w),np.uint8)
    for j in range(h):
        for i in range(w):
            if np.isnan(H[j,i]) or NZ[j,i]<0.72:continue
            bx=gx0+(i+.5)*CS;by=-(gz0+(j+.5)*CS);hz=H[j,i];ok=1
            for zz in (0.5,1.3):
                for d in dirs:
                    if T.ray_cast(Vector((bx,by,hz+zz)),d,pad)[0] is not None:ok=0;break
                if not ok:break
            if ok and T.ray_cast(Vector((bx,by,hz+0.15)),up,1.8)[0] is not None:ok=0
            W[j,i]=ok
    def comp(G,seed):
        R=np.zeros_like(G);st=[seed];R[seed]=1
        while st:
            j,i=st.pop()
            for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
                a,b=j+dj,i+di
                if 0<=a<h and 0<=b<w and G[a,b] and not R[a,b] and abs(H[a,b]-H[j,i])<=0.5:R[a,b]=1;st.append((a,b))
        return R
    si=int((spawn[0]-gx0)/CS);sj=int((spawn[1]-gz0)/CS)
    if not W[sj,si]:
        cand=np.argwhere(W==1);dd=np.hypot(cand[:,0]-sj,cand[:,1]-si);sj,si=cand[dd.argmin()]
    R=comp(W,(sj,si))
    # край обрыва/уступа: у клетки сосед ниже на >0.5 м или пустота -> закрыта (не падать с террас)
    E=R.copy();Hn=np.where(np.isnan(H),-99,H)
    for dj,di in((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
        sh=np.roll(np.roll(Hn,-dj,0),-di,1);E[(Hn-sh)>0.55]=0
    E[0,:]=E[-1,:]=E[:,0]=E[:,-1]=0
    R=comp(E,(sj,si))
    print('NAV cells',int(W.sum()),'reach',int(R.sum()),'of',w*h)
    # высота земли для игры: у закрытых клеток — высота ближайшей проходимой (для билинейной интерполяции)
    G=np.where(R>0,H,np.nan)
    for it in range(6):
        m=np.isnan(G)
        if not m.any():break
        acc=np.zeros_like(G);cnt=np.zeros_like(G)
        for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
            sh=np.roll(np.roll(G,dj,0),di,1);ok=~np.isnan(sh);acc[ok]+=sh[ok];cnt[ok]+=1
        fill=m&(cnt>0);G[fill]=acc[fill]/cnt[fill]
    G=np.where(np.isnan(G),np.nan_to_num(H,nan=0),G)
    ho=float(np.floor(np.nanmin(np.where(R>0,H,np.nan))-2))
    gh=np.clip(np.round((G-ho)*100),0,65535).astype('<u2')
    Ht=np.zeros((h,w),np.uint8);Hl=np.full((h,w),255,np.uint8);hs=0.25
    for j in range(h):
        for i in range(w):
            if not np.isnan(H[j,i]):Ht[j,i]=int(np.clip(round((H[j,i]-ho)/hs),0,254))
            if R[j,i]:
                bx=gx0+(i+.5)*CS;by=-(gz0+(j+.5)*CS);r=T.ray_cast(Vector((bx,by,H[j,i]+0.3)),up,40)
                if r[0] is not None:Hl[j,i]=int(np.clip(round((r[0].z-ho)/hs),0,254))
    nav=dict(x0=gx0,z0=gz0,cs=CS,w=w,h=h,ho=ho,hs=hs,b=base64.b64encode(np.packbits(R.ravel()).tobytes()).decode(),
        ht=base64.b64encode(Ht.tobytes()).decode(),hl=base64.b64encode(Hl.tobytes()).decode(),gh=base64.b64encode(gh.tobytes()).decode())
    np.save(os.path.join(OUT,'nav.npy'),R);np.save(os.path.join(OUT,'navh.npy'),H)
    return nav,R,H
def gH(R,H,x,z):
    i=int((x-NAVB[0])/CS);j=int((z-NAVB[2])/CS);return float(H[j,i]),int(R[j,i])
# ------------------------------------------------------------------ интерьеры (процедурно, текстуры деревни)
def mat_from(name,src,tint=None,rough=0.85,emit=None):
    m=bpy.data.materials.new('lv_kakin_'+name);m.use_nodes=True;nt=m.node_tree;bs=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=0
    if src:
        sm=bpy.data.materials.get('lv_kak_'+src);tx,_=img_of(sm)
        tn=nt.nodes.new('ShaderNodeTexImage');tn.image=tx.image
        if tint:
            mx=nt.nodes.new('ShaderNodeMix');mx.data_type='RGBA';mx.blend_type='MULTIPLY';mx.inputs['Factor'].default_value=1.0
            nt.links.new(tn.outputs[0],mx.inputs['A']);mx.inputs['B'].default_value=(*tint,1);nt.links.new(mx.outputs['Result'],bs.inputs['Base Color'])
        else:nt.links.new(tn.outputs[0],bs.inputs['Base Color'])
    elif tint:bs.inputs['Base Color'].default_value=(*tint,1)
    if emit:bs.inputs['Emission Color'].default_value=(*emit,1);bs.inputs['Emission Strength'].default_value=2.0
    return m
def box(name,c,s,mat,uvs=1.0,parts=None):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1.0);bmesh.ops.scale(bm,vec=s,verts=bm.verts);bmesh.ops.translate(bm,vec=c,verts=bm.verts)
    uv=bm.loops.layers.uv.new()
    for f in bm.faces:
        n=f.normal;ax=max(range(3),key=lambda k:abs(n[k]));a,b=[k for k in range(3) if k!=ax]
        for l in f.loops:l[uv].uv=(l.vert.co[a]/uvs,l.vert.co[b]/uvs)
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);me.materials.append(mat)
    if parts is not None:parts.append(o)
    return o
def cyl(name,c,r,hh,mat,seg=12,parts=None):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,segments=seg,radius1=r,radius2=r,depth=hh);bmesh.ops.translate(bm,vec=c,verts=bm.verts)
    uv=bm.loops.layers.uv.new()
    for f in bm.faces:
        for l in f.loops:
            v=l.vert.co-Vector(c);l[uv].uv=((math.atan2(v.y,v.x)/math.pi+1)*r*1.6,v.z) if abs(f.normal.z)<0.5 else (v.x,v.y)
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);me.materials.append(mat)
    if parts is not None:parts.append(o)
    return o
def interiors():
    """три шаблона комнат. Пол y=0 игры; дверь в стене z=+d/2 (выход). Возвращает данные коллизий (коробки мебели в игровых x,z)."""
    M=dict(wall=mat_from('wall','mat7'),wall2=mat_from('wall2','mat10'),floor=mat_from('floor','mat15',(0.75,0.62,0.5)),beam=mat_from('beam','mat14',(0.8,0.7,0.6)),
       wood=mat_from('wood','mat25'),wood2=mat_from('wood2','mat14',(0.95,0.85,0.75)),plank=mat_from('plank','mat16',(0.9,0.8,0.7)),
       cloth=mat_from('cloth',None,(0.55,0.12,0.1)),cloth2=mat_from('cloth2',None,(0.18,0.3,0.5)),bed=mat_from('bed',None,(0.85,0.82,0.72)),
       clay=mat_from('clay',None,(0.6,0.35,0.22),0.7),iron=mat_from('iron',None,(0.12,0.12,0.13),0.5),fire=mat_from('fire',None,(1,0.45,0.1),emit=(1,0.42,0.08)),
       win=mat_from('win','mat20',emit=(0.9,0.75,0.35)),roof=mat_from('roof','mat26',(0.9,0.9,0.9)),door=mat_from('door','mat19',(0.8,0.7,0.6)),stone=mat_from('stone','mat13',(0.7,0.7,0.7)),hay=mat_from('hay','mat29',(1,0.95,0.7)))
    data=[]
    for k,R in enumerate(ROOMS):
        P=[];ox=300+30*k;w,d,hh=R['w'],R['d'],R['h'];col=[]
        def B(nm,c,s,mt,u=1.0,solid=True):   # c,s в игровых (x,y,z) относительно комнаты
            o=box('%s_%d_%s'%(R['n'],len(P),nm),(ox+c[0],-c[2],c[1]),(s[0],s[2],s[1]),M[mt],u,P)
            if solid:col.append([round(c[0]-s[0]/2,3),round(c[2]-s[2]/2,3),round(c[0]+s[0]/2,3),round(c[2]+s[2]/2,3)])
            return o
        def C(nm,c,r,h_,mt,solid=True,seg=12):
            o=cyl('%s_%d_%s'%(R['n'],len(P),nm),(ox+c[0],-c[2],c[1]),r,h_,M[mt],seg,P)
            if solid:col.append([round(c[0]-r,3),round(c[2]-r,3),round(c[0]+r,3),round(c[2]+r,3)])
            return o
        t=0.25
        B('floor',(0,-0.1,0),(w+0.6,0.2,d+0.6),'floor',1.2,False);B('ceil',(0,hh+0.1,0),(w+0.6,0.2,d+0.6),'beam',1.5,False)
        wm='wall' if k!=1 else 'wall2'
        B('wN',(0,hh/2,-d/2-t/2),(w+2*t,hh,t),wm,1.6,False);B('wW',(-w/2-t/2,hh/2,0),(t,hh,d),wm,1.6,False);B('wE',(w/2+t/2,hh/2,0),(t,hh,d),wm,1.6,False)
        dw=1.3;dh=2.3;sw=(w-dw)/2
        B('wS1',(-w/2+sw/2-t/2+t/2,hh/2,d/2+t/2),(sw,hh,t),wm,1.6,False);B('wS2',(w/2-sw/2,hh/2,d/2+t/2),(sw,hh,t),wm,1.6,False);B('wS3',(0,(hh+dh)/2,d/2+t/2),(dw,hh-dh,t),wm,1.6,False)
        B('door',(0,dh/2,d/2+t*0.9),(dw,dh,0.08),'door',dh,False)
        for zb in np.linspace(-d/2+0.6,d/2-0.6,4):B('beam',(0,hh-0.12,zb),(w,0.22,0.22),'beam',1.0,False)
        for xb in(-w/2+0.12,w/2-0.12):B('post',(xb,hh/2,-d/2+0.12),(0.24,hh,0.24),'beam',1.0,False)
        B('winN',(-w/4,1.7,-d/2+0.02),(1.0,0.8,0.05),'win',0.8,False);B('winN2',(w/4,1.7,-d/2+0.02),(1.0,0.8,0.05),'win',0.8,False)
        B('rug',(0,0.012,0.4),(2.4,0.02,1.6),'cloth' if k!=2 else 'cloth2',1,False)
        L=dict(fire=None,lamps=[])
        if R['n']=='home':
            B('table',(0.6,0.76,-0.5),(1.6,0.08,0.9),'wood');[B('tleg',(0.6+sx*0.7,0.36,-0.5+sz*0.38),(0.08,0.72,0.08),'wood',1,False) for sx in(-1,1) for sz in(-1,1)]
            B('stool',(0.6,0.45,0.3),(0.42,0.06,0.42),'wood2');B('stool2',(-0.4,0.45,-0.5),(0.42,0.06,0.42),'wood2')
            B('bed',(-w/2+0.55,0.3,-d/2+1.15),(1.0,0.4,2.1),'wood');B('bedm',(-w/2+0.55,0.56,-d/2+1.15),(0.92,0.14,2.0),'bed',1,False);B('pillow',(-w/2+0.55,0.68,-d/2+0.4),(0.7,0.12,0.36),'bed',1,False)
            B('shelf',(w/2-0.25,1.0,-0.8),(0.4,2.0,1.6),'plank');[C('pot',(w/2-0.25,1.25+0.6*q,-1.2+0.4*r),0.12,0.24,'clay',False) for q in range(2) for r in range(3)]
            B('hearth',(w/2-0.6,0.6,d/2-1.0),(1.1,1.2,1.0),'stone');B('fire',(w/2-0.6,0.5,d/2-1.52),(0.6,0.35,0.05),'fire',1,False)
            C('barrel',(-w/2+0.5,0.45,d/2-0.6),0.36,0.9,'wood2');L['fire']=(w/2-0.6,0.6,d/2-1.7);L['npc']=(-0.6,0.6);L['lamps']=[(0.6,2.2,-0.5)]
        elif R['n']=='tavern':
            B('counter',(-w/2+1.2,0.55,0),(0.7,1.1,3.2),'wood');B('ctop',(-w/2+1.2,1.12,0),(0.85,0.06,3.4),'wood2',1,False)
            for zz in(-1.1,0.0,1.1):C('barrelS',(-w/2+0.4,0.45,zz),0.34,0.9,'wood2')
            B('ltable',(1.2,0.76,-0.8),(2.6,0.08,1.0),'wood');B('bench1',(1.2,0.45,-1.55),(2.4,0.08,0.36),'plank');B('bench2',(1.2,0.45,-0.05),(2.4,0.08,0.36),'plank')
            [B('lleg',(1.2+sx*1.15,0.36,-0.8+sz*0.4),(0.1,0.72,0.1),'wood',1,False) for sx in(-1,1) for sz in(-1,1)]
            [C('mug',(0.6+0.5*q,0.86,-0.8),0.06,0.14,'clay',False) for q in range(3)]
            B('hay',(w/2-0.8,0.4,d/2-1.0),(1.2,0.8,1.4),'hay',1.0);B('crate',(w/2-0.5,0.35,-d/2+0.6),(0.7,0.7,0.7),'plank');B('crate2',(w/2-1.3,0.3,-d/2+0.5),(0.6,0.6,0.6),'plank')
            B('hearth',(0,0.6,-d/2+0.55),(1.2,1.2,0.9),'stone');B('fire',(0,0.5,-d/2+1.02),(0.6,0.35,0.05),'fire',1,False)
            L['fire']=(0,0.6,-d/2+1.2);L['npc']=(-w/2+2.0,0.3);L['lamps']=[(1.2,2.4,-0.8),(-w/2+1.2,2.4,0)]
        else:
            B('bed',(w/2-0.55,0.28,-d/2+1.0),(0.9,0.36,1.8),'wood');B('bedm',(w/2-0.55,0.52,-d/2+1.0),(0.82,0.12,1.7),'cloth2',1,False);B('pillow',(w/2-0.55,0.62,-d/2+0.35),(0.6,0.1,0.3),'bed',1,False)
            B('chest',(-w/2+0.55,0.3,-d/2+0.5),(0.8,0.6,0.5),'wood2');B('table',(-0.8,0.6,-0.9),(1.0,0.06,0.7),'wood');B('stool',(-0.8,0.35,-0.25),(0.36,0.05,0.36),'wood2')
            [B('tleg',(-0.8+sx*0.42,0.29,-0.9+sz*0.28),(0.06,0.58,0.06),'wood',1,False) for sx in(-1,1) for sz in(-1,1)]
            C('ball',(0.9,0.12,0.6),0.12,0.24,'cloth',False,8);B('toy',(1.2,0.1,0.9),(0.2,0.2,0.2),'plank',1,False);B('toy2',(1.2,0.3,0.9),(0.14,0.2,0.14),'cloth2',1,False)
            B('shelf',(-w/2+0.2,1.1,0.9),(0.3,1.6,1.2),'plank');C('pot',(-w/2+0.2,1.5,0.6),0.1,0.2,'clay',False);C('pot2',(-w/2+0.2,1.5,1.1),0.1,0.2,'clay',False)
            C('stove',(w/2-0.6,0.5,d/2-0.8),0.42,1.0,'iron');B('fire',(w/2-0.6,0.4,d/2-0.37),(0.3,0.2,0.04),'fire',1,False)
            L['fire']=(w/2-0.6,0.5,d/2-0.2);L['npc']=(0.2,-0.6);L['lamps']=[(-0.8,2.1,-0.9)]
        for o in P:o.name='kakin%d_%s'%(k,o.name)
        data.append(dict(n=R['n'],ox=ox,w=w,d=d,h=hh,col=col,**L))
    return data,M
# ------------------------------------------------------------------ карта (вид сверху, стилизация)
def mapimg(R):
    sc=bpy.context.scene;gx0,gx1,gz0,gz1=NAVB;Wd=gx1-gx0;Hd=gz1-gz0
    hide=[o for o in meshes() if 'mat14' in o.name or o.name.startswith('kakin')]
    for o in hide:o.hide_render=True
    cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam
    cam.data.type='ORTHO';cam.data.ortho_scale=max(Wd,Hd);cam.data.clip_end=1e5;cam.location=((gx0+gx1)/2,-(gz0+gz1)/2,150)
    Ls=bpy.data.objects.new('Ls',bpy.data.lights.new('Ls','SUN'));sc.collection.objects.link(Ls);Ls.data.energy=3.2;Ls.rotation_euler=(0.35,0.25,0)
    sc.world=bpy.data.worlds.new('w');sc.world.color=(0.5,0.5,0.5);sc.render.engine='CYCLES';sc.cycles.samples=8
    sc.render.resolution_x=1024;sc.render.resolution_y=int(1024*Hd/Wd);fp=os.path.join(OUT,'map_raw.png');sc.render.filepath=fp;bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam);bpy.data.objects.remove(Ls)
    for o in hide:o.hide_render=False
    from PIL import Image,ImageFilter,ImageOps
    im=Image.open(fp).convert('RGB');g=ImageOps.grayscale(im);g=ImageOps.autocontrast(g,2)
    a=np.asarray(g,np.float32)/255;paper=np.array([0.86,0.77,0.6]);ink=np.array([0.25,0.17,0.1])
    rgb=ink+(paper-ink)*a[...,None]**0.8
    # проходимая область чуть светлее, контур — тушью
    Rm=np.asarray(Image.fromarray((R[::-1]*255 if False else R*255).astype(np.uint8)).resize(im.size,Image.NEAREST),np.float32)/255
    rgb=rgb*(0.82+0.18*Rm[...,None]);ed=np.asarray(Image.fromarray((Rm*255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES),np.float32)/255
    rgb=rgb*(1-0.55*ed[...,None])
    out=Image.fromarray((np.clip(rgb,0,1)*255).astype(np.uint8)).resize((768,int(768*Hd/Wd)),Image.LANCZOS)
    fpw=os.path.join(OUT,'map.webp');out.save(fpw,'WEBP',quality=72);print('MAP',os.path.getsize(fpw))
    return base64.b64encode(open(fpw,'rb').read()).decode()
def lv():
    clean();vobs=village();matfix('lv_kak_')
    Tg=ground_bvh([o for o in vobs if not any(s in o.name for s in NOBVH)])
    sobs=smithy(Tg);matfix('lv_kaks_')
    T=ground_bvh([o for o in vobs+sobs if not any(s in o.name for s in NOBVH)])
    spawn=tuple(json.loads(os.environ.get('KAK_SPAWN','[-60,8]')))
    nav,R,H=navbake(T,None,spawn)
    DD=place_doors(T,R,H)
    rooms,MI=interiors();door_mesh(DD,MI);mp=mapimg(R)
    sm={k:v for k,v in SMITHY.items() if k in('pos','y','pts')}
    json.dump(dict(nav=nav,doors=DD,rooms=rooms,smithy=sm,map=mp,spawn=spawn),open(os.path.join(OUT,'kak.json'),'w'))
    # экспорт: деревня, кузница, интерьеры — отдельными префиксами
    k=0
    for o in meshes():
        n='kakin%s'%o.name[5] if o.name.startswith('kakin') else 'kaks' if o.name.startswith('kaks_') else 'kakd' if o.name.startswith('kakd_') else 'kak'
        o.name='LV__%s__%d'%(n,k);k+=1
    for im in bpy.data.images:
        if im.size[0] and im.packed_file is None and im.filepath:
            try:im.pack()
            except Exception:pass
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes():o.select_set(True)
    f=os.path.join(OUT,'lv.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_image_format='AUTO',export_apply=False,export_yup=True,export_tangents=False,export_morph=False,export_skins=False,export_animations=False)
    print('LVGLB',os.path.getsize(f))
    if os.environ.get('KAK_DBG'):bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'lv.blend'))
if __name__=='__main__':
    if sys.argv[-1]=='lv':lv()
# ------------------------------------------------------------------ pack: lv.glb + НПС (XS__) + молот кузнеца -> niten_kak.glb, gK.js
def hammer():
    """молот кузнеца (Box005 из lowpoly_blacksmith_girl.glb): тот же масштаб, что у модели (prep h=1.58); рукоять по -Y, хват в 0"""
    obs=flatten_import(os.path.join(SRC,'kak','lowpoly_blacksmith_girl.glb'))
    hm=[o for o in obs if 'Box005' in o.name];rest=[o for o in obs if o not in hm]
    co=np.array([(v.co[:]) for o in rest for v in o.data.vertices]);s=1.58/(co[:,2].max()-co[:,2].min())
    bpy.ops.object.select_all(action='DESELECT')
    for o in hm:o.select_set(True)
    bpy.context.view_layer.objects.active=hm[0]
    if len(hm)>1:bpy.ops.object.join()
    h=bpy.context.view_layer.objects.active
    for o in rest:bpy.data.objects.remove(o)
    V=np.array([v.co[:] for v in h.data.vertices])*s;c=V.mean(0);U,S_,Wt=np.linalg.svd(V-c);ax=Wt[0];t=(V-c)@ax
    lo,hi=t.min(),t.max();wid=lambda a,b:np.ptp((V-c)[(t>=a)&(t<=b)]-np.outer(t[(t>=a)&(t<=b)],ax),axis=0).max() if ((t>=a)&(t<=b)).sum()>3 else 0
    L=hi-lo;head_hi=wid(hi-0.2*L,hi)>wid(lo,lo+0.2*L)
    if head_hi:ax=-ax;t=-t;lo,hi=-hi,-lo
    grip=c+ax*(lo+0.12*L)       # хват у конца рукояти; ось ax: от рукояти к бойку
    # боёк: направление поперёк рукояти (наибольший разброс в головной части)
    hd=(V-c)[t>hi-0.2*L];hd=hd-np.outer(hd@ax,ax);_,_,W2=np.linalg.svd(hd-hd.mean(0));bx=W2[0];bx-=ax*(bx@ax);bx/=np.linalg.norm(bx)
    Rm=np.stack([bx,-ax,np.cross(bx,-ax)])    # строки: целевые оси x,y,z в исходных координатах (рукоять -> -Y... боёк по +X)
    M=Matrix([[*Rm[0]*s,0],[*Rm[1]*s,0],[*Rm[2]*s,0],[0,0,0,1]])
    Mt=Matrix.Translation(Vector(-(Rm@grip)))@M
    h.data.transform(Mt);h.name='KK__hammer';h.matrix_world=Matrix()
    for m in h.data.materials:
        if m:m.name='KK_hammer'
    V2=np.array([v.co[:] for v in h.data.vertices]);print('HAMMER len',round(L,3),'bbox',V2.min(0).round(3),V2.max(0).round(3))
    return h
def pack():
    clean()
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,'lv.glb'))
    for o in list(bpy.data.objects):
        if o.type!='MESH':bpy.data.objects.remove(o)
    for n in['sarah','orc','smith','girl']:
        with bpy.data.libraries.load(os.path.join(PREP,n+'_rig.blend')) as (src,dst):dst.objects=[x for x in src.objects if x.startswith('XS_')]
        for o in dst.objects:bpy.context.scene.collection.objects.link(o)
    hammer()
    for m in bpy.data.materials:
        if not m.use_nodes:continue
        for n in m.node_tree.nodes:
            if n.type=='BSDF_PRINCIPLED':
                for k in('Normal','Roughness','Metallic'):
                    for l in list(n.inputs[k].links):m.node_tree.links.remove(l)
    for im in list(bpy.data.images):
        if im.users==0:bpy.data.images.remove(im);continue
        if im.size[0] and max(im.size)>1024:k=1024/max(im.size);im.scale(max(4,int(im.size[0]*k)),max(4,int(im.size[1]*k)))
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:o.select_set(True)
    f=os.path.join(HERE,'..','out','niten_kak.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_skins=True,export_animations=False,export_image_format='AUTO',export_apply=False,
        export_yup=True,export_tangents=False,export_morph=False)
    print('KAK',os.path.getsize(f))
    J=json.load(open(os.path.join(OUT,'kak.json')));mp=J.pop('map')
    open(os.path.join(HERE,'..','..','game','src','gK.js'),'w').write('// v0.14: деревня Какарико (генерирует blender/ext/kak.py pack): nav с высотами (gh — высота земли, см), двери домов, интерьеры, кузница, карта.\nconst KAKD='+json.dumps(J,separators=(',',':'))+';\nconst KAKMAP="data:image/webp;base64,'+mp+'";\n')
if __name__=='__main__' and sys.argv[-1]=='pack':pack()
