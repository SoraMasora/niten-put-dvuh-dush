# v0.12: локации из внешних моделей (исходники в $NITEN_SRC/loc, см. cfg.py).
# python3 blender/ext/locs.py <village|sagano|scifi|portal|manor|merge>
# Каждая локация: импорт -> чистка (небо/купол) -> масштаб/поворот -> выравнивание земли арены до y=0
# (плавное поле смещений по высоте) -> размещение под координаты игры -> запекание nav-сетки (проходимость)
# -> blender/out/loc/<name>.glb + <name>.nav.json. merge -> blender/out/niten_loc.glb (WebP-текстуры).
import bpy,sys,os,json,math,base64,mathutils,numpy as np
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from cfg import SRC
OUT=os.path.join(HERE,'..','out','loc');os.makedirs(OUT,exist_ok=True)
DBG=os.environ.get('LOC_DBG','')
# Координаты: blender (x,y,z) -> three (x,z,-y). Игровые: старт (0,-12), портал (0,16) => blender (0,12),(0,-16).
L={
 'village':dict(src='loc/village.glb',skip=['Material2.001','Material3.003'],S=12,
   flat=dict(shape='circle',c=(-40,2),R=27,F=8,sig=1.0,ground=['auto_77','auto_18','auto_65','auto_2','auto_20','auto_27','auto_53','auto_11','auto_48','auto_87','auto_43']),
   place=dict(A=(-40,14),B=(-40,-14),s=(-3,8),d=(0,-1)),
   nav=dict(shape='circle',R=25)),
 'sagano':dict(src='loc/sagano_bamboo_forest.glb',skip=[],S=1.6,
   flat=dict(shape='box',b=(-15,16,-44,72),F=8,sig=1.5,ground=['Material_979','Material_972','Material_973','Material_975','Material_974','Material_976','Material_1592','Material_977']),
   place=dict(A=(0.8,-20),B=(0.8,8)),
   nav=dict(shape='box',b=(-9,9,-28,44))),
 'scifi':dict(src='loc/sci-fi_japan_environment.glb',skip=['sky'],S=0.01,flat=None,
   place=dict(T=(130,-8)),nav=None),
 # портал: кольцо камней, центр проёма на высоте 1.75 (как у прежних тории), плоскость кольца — XZ blender (лицом по оси z игры)
 'portal':dict(src='loc/magic_portal.glb',skip=['PortalSurface'],S=1.3,flat=None,place=dict(T=(0,0.2)),nav=None,tex=512),
 # усадьба «Забытый дом»: дверной проём (src x -0.1125..-0.0075, z 0.155..0.275, косяк y 0.094) -> дверь игры z=-28.95, пол 0.62
 'manor':dict(src='loc/manor.glb',skip=[],S=1,flat=None,place=None,nav=None,tex=1024,manor=dict(S=21,cx=-0.06,dy=0.094,fz=0.155,cut=0.03,tris=90000)),
}
def manor(M):
    import bmesh
    S=M['S'];T=Matrix.Translation((0,28.95,0.62))@Matrix.Scale(S,4)@Matrix.Translation((-M['cx'],-M['dy'],-M['fz']))
    cut=(M['cut']-M['dy'])*S+28.95;tot=0
    for o in meshes():
        o.data.transform(T);bm=bmesh.new();bm.from_mesh(o.data)
        r=bmesh.ops.bisect_plane(bm,geom=bm.verts[:]+bm.edges[:]+bm.faces[:],plane_co=(0,cut,0),plane_no=(0,1,0),clear_inner=True)
        dead=[f for f in bm.faces if max(v.co.z for v in f.verts)<-0.35]
        bmesh.ops.delete(bm,geom=dead,context='FACES');bm.to_mesh(o.data);bm.free();o.data.update();tot+=len(o.data.polygons)
    k=M['tris']/max(tot,1);print('manor tris after cut',tot,'ratio',round(k,3))
    for o in meshes():
        bpy.context.view_layer.objects.active=o;md=o.modifiers.new('d','DECIMATE');md.ratio=min(1,k);bpy.ops.object.modifier_apply(modifier='d')
    print('manor tris',sum(len(o.data.polygons) for o in meshes()))
def clean():
    for o in list(bpy.data.objects):bpy.data.objects.remove(o)
    for c in (bpy.data.meshes,bpy.data.materials,bpy.data.images):
        for x in list(c):c.remove(x)
def load(name,C):
    clean();bpy.ops.import_scene.gltf(filepath=os.path.join(SRC,C['src']));bpy.context.view_layer.update()
    for o in list(bpy.data.objects):
        if o.type=='MESH' and any(s in o.name for s in C.get('skip',[])):bpy.data.objects.remove(o)
    bpy.context.view_layer.update()
    for o in [o for o in bpy.data.objects if o.type=='MESH']:
        if o.data.users>1:o.data=o.data.copy()
        M=o.matrix_world.copy();o.parent=None;o.data.transform(M);o.matrix_world=Matrix()
    for o in list(bpy.data.objects):
        if o.type!='MESH':bpy.data.objects.remove(o)
    S=C.get('S',1);R=Matrix.Rotation(math.radians(C.get('rot',0)),4,'Z')@Matrix.Scale(S,4)
    for o in bpy.data.objects:o.data.transform(R)
def meshes():return [o for o in bpy.data.objects if o.type=='MESH']
def gmask(o,G):
    if G is None:return None
    ok=[i for i,m in enumerate(o.data.materials) if m and m.name in G];return set(ok)
def bvh(G=None):
    V=[];F=[]
    for o in meshes():
        gm=gmask(o,G)
        if gm is not None and not gm:continue
        n=len(V);V+=[v.co.copy() for v in o.data.vertices];F+=[[n+i for i in p.vertices] for p in o.data.polygons if gm is None or p.material_index in gm]
    return BVHTree.FromPolygons(V,F,epsilon=0.0)
def zr():
    z=[v.co.z for o in meshes() for v in o.data.vertices];return min(z),max(z)
def heights(T,xs,ys,top):
    H=np.full((len(ys),len(xs)),np.nan);d=Vector((0,0,-1))
    for j,y in enumerate(ys):
        for i,x in enumerate(xs):
            h=T.ray_cast(Vector((x,y,top)),d,1e5)
            if h[0] is not None:H[j,i]=h[0].z
    return H
def wfield(F,X,Y):
    if F['shape']=='circle':r=np.hypot(X-F['c'][0],Y-F['c'][1])-F['R']
    else:
        x0,x1,y0,y1=F['b'];dx=np.maximum(np.maximum(x0-X,X-x1),0);dy=np.maximum(np.maximum(y0-Y,Y-y1),0);r=np.hypot(dx,dy)
    t=np.clip(1-r/F['F'],0,1);return t*t*(3-2*t)
def w_at(F,x,y):return wfield(F,x,y)
def gsmooth(A,sig,step):
    k=int(3*sig/step);x=np.arange(-k,k+1)*step;g=np.exp(-x*x/(2*sig*sig));m=~np.isnan(A);a=np.where(m,A,0.0);w=m.astype(float)
    for ax in (0,1):
        a=np.apply_along_axis(lambda v:np.convolve(v,g,'same'),ax,a);w=np.apply_along_axis(lambda v:np.convolve(v,g,'same'),ax,w)
    return np.where(w>1e-3,a/np.maximum(w,1e-9),np.nan)
def flatten(F):
    st=0.5
    if F['shape']=='circle':cx,cy=F['c'];e=F['R']+F['F']+2;x0,x1,y0,y1=cx-e,cx+e,cy-e,cy+e
    else:b=F['b'];e=F['F']+2;x0,x1,y0,y1=b[0]-e,b[1]+e,b[2]-e,b[3]+e
    xs=np.arange(x0,x1+st,st);ys=np.arange(y0,y1+st,st);GM=set(F['ground']);T=bvh(GM);z0,z1=zr()
    H=heights(T,xs,ys,z1+5)
    import warnings;warnings.simplefilter('ignore')
    Hs=gsmooth(H,F['sig'],st);Hs2=gsmooth(H,F['sig']*4,st);Hs=np.where(np.isnan(Hs),Hs2,Hs)
    X,Y=np.meshgrid(xs,ys);w=wfield(F,X,Y)
    c=(F['c'] if F['shape']=='circle' else ((F['b'][0]+F['b'][1])/2,(F['b'][2]+F['b'][3])/2))
    base=float(np.nanmedian(Hs[w>0.99]));Hs=np.where(np.isnan(Hs),base,Hs);D=w*(Hs-base)
    for o in meshes():
        n=len(o.data.vertices);co=np.zeros(n*3);o.data.vertices.foreach_get('co',co);co=co.reshape(-1,3)
        fi=np.clip((co[:,0]-x0)/st,0,len(xs)-1.001);fj=np.clip((co[:,1]-y0)/st,0,len(ys)-1.001);i=fi.astype(int);j=fj.astype(int);u=fi-i;v=fj-j
        d=D[j,i]*(1-u)*(1-v)+D[j,i+1]*u*(1-v)+D[j+1,i]*(1-u)*v+D[j+1,i+1]*u*v
        out=(co[:,0]<x0)|(co[:,0]>x1)|(co[:,1]<y0)|(co[:,1]>y1);d[out]=0
        gm=gmask(o,GM)
        if gm:
            gv=np.zeros(n,bool)
            for p in o.data.polygons:
                if p.material_index in gm:gv[list(p.vertices)]=True
            ww=w_at(F,co[:,0],co[:,1]);d=np.where(gv,ww*(co[:,2]-base),d)
        co[:,2]-=d;o.data.vertices.foreach_set('co',co.ravel());o.data.update()
    print('flatten base',round(base,2),'D range',round(float(D.min()),2),round(float(D.max()),2))
    return base
def place(C,base):
    p=C['place']
    if 'A' in p:
        A=Vector(p['A']);B=Vector(p['B']);v=B-A;phi=math.atan2(-28,0)-math.atan2(v.y,v.x)
        R=Matrix.Rotation(phi,4,'Z');A2=R@A.to_3d();M=Matrix.Translation((-A2.x,12-A2.y,-base))@R
    else:M=Matrix.Translation((-p['T'][0],-p['T'][1],-base))
    if 's' in p:  # доп. перенос: точка s (игровые x,z) -> старт (0,-12), направление d -> +z игры
        sb=Vector((p['s'][0],-p['s'][1],0));db=Vector((p['d'][0],-p['d'][1]));phi=math.atan2(-1,0)-math.atan2(db.y,db.x)
        M=Matrix.Translation((0,12,0))@Matrix.Rotation(phi,4,'Z')@Matrix.Translation(-sb)@M
    for o in meshes():o.data.transform(M)
    for o in meshes():o.data.update()
def navbake(name,N,cs=0.4,pad=0.42):
    T=bvh()
    if N['shape']=='circle':R=N['R'];gx0,gx1,gz0,gz1=-R,R,-R,R
    else:gx0,gx1,gz0,gz1=N['b']
    w=int(round((gx1-gx0)/cs));h=int(round((gz1-gz0)/cs));G=np.zeros((h,w),np.uint8);Hg=np.full((h,w),np.nan)
    dirs=[Vector((math.cos(a),math.sin(a),0)) for a in np.arange(8)*math.pi/4];dn=Vector((0,0,-1))
    for j in range(h):
        for i in range(w):
            gx=gx0+(i+.5)*cs;gz=gz0+(j+.5)*cs;bx,by=gx,-gz
            if N['shape']=='circle' and math.hypot(gx,gz)>R-0.3:continue
            r=T.ray_cast(Vector((bx,by,2.4)),dn,6)
            if r[0] is None:continue
            Hg[j,i]=r[0].z
            if r[0].z>0.35 or r[0].z<-0.6:continue
            ok=1
            for zz in (0.45,1.2):
                for d in dirs:
                    if T.ray_cast(Vector((bx,by,zz)),d,pad)[0] is not None:ok=0;break
                if not ok:break
            G[j,i]=ok
    # эрозия у обрывов/пустоты: клетка без опоры рядом -> закрыта
    k=int(math.ceil(pad/cs));lowv=np.isnan(Hg)|(Hg<-0.6);E=G.copy()
    for dj in range(-k,k+1):
        for di in range(-k,k+1):
            if di*di+dj*dj>k*k:continue
            sh=np.roll(np.roll(lowv,dj,0),di,1);E[sh]=0
    G=E
    # связность от старта
    si=int((0-gx0)/cs);sj=int((-12-gz0)/cs);
    if not G[sj,si]:
        cand=np.argwhere(G==1);dd=np.hypot(cand[:,0]-sj,cand[:,1]-si);sj,si=cand[dd.argmin()];print('start moved to cell',si,sj)
    Rm=np.zeros_like(G);st=[(sj,si)];Rm[sj,si]=1
    while st:
        j,i=st.pop()
        for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
            a,b=j+dj,i+di
            if 0<=a<h and 0<=b<w and G[a,b] and not Rm[a,b]:Rm[a,b]=1;st.append((a,b))
    print('nav',name,'cells',int(G.sum()),'reach',int(Rm.sum()),'of',w*h)
    # для камеры: верх геометрии (луч сверху) и низ навеса над проходимой клеткой (луч вверх), 0.1 м/ед.
    Ht=np.zeros((h,w),np.uint8);Hl=np.full((h,w),255,np.uint8);up=Vector((0,0,1))
    for j in range(h):
        for i in range(w):
            bx=gx0+(i+.5)*cs;by=-(gz0+(j+.5)*cs);r=T.ray_cast(Vector((bx,by,80)),dn,200)
            if r[0] is not None:Ht[j,i]=int(np.clip(round(r[0].z*10),0,254))
            if Rm[j,i]:
                r=T.ray_cast(Vector((bx,by,0.3)),up,25)
                if r[0] is not None:Hl[j,i]=int(np.clip(round(r[0].z*10),0,254))
    bits=np.packbits(Rm.ravel());nav=dict(x0=gx0,z0=gz0,cs=cs,w=w,h=h,b=base64.b64encode(bits.tobytes()).decode(),ht=base64.b64encode(Ht.tobytes()).decode(),hl=base64.b64encode(Hl.tobytes()).decode())
    json.dump(nav,open(os.path.join(OUT,name+'.nav.json'),'w'))
    np.save(os.path.join(OUT,name+'.nav.npy'),Rm);np.save(os.path.join(OUT,name+'.navh.npy'),Hg)
    return Rm,Hg,(gx0,gx1,gz0,gz1)
def texfix(name,lim=1024):
    for im in bpy.data.images:
        if im.size[0] and im.name in('Render Result','Viewer Node'):pass
    for m in bpy.data.materials:
        if not m.name.startswith('lv_'):m.name='lv_%s_%s'%(name,m.name)
    for im in bpy.data.images:
        if im.size[0] and max(im.size)>lim:k=lim/max(im.size);im.scale(max(4,int(im.size[0]*k)),max(4,int(im.size[1]*k)))
def export(name):
    for i,o in enumerate(meshes()):o.name='LV__%s__%d'%(name,i)
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes():o.select_set(True)
    f=os.path.join(OUT,name+'.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_image_format='AUTO',export_apply=False,export_yup=True,export_tangents=False,export_morph=False,export_skins=False,export_animations=False)
    print('GLB',name,os.path.getsize(f))
def debug(name,Rm,Hg,ext,marks):
    import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
    gx0,gx1,gz0,gz1=ext;fig,ax=plt.subplots(1,2,figsize=(14,7.4))
    sc=bpy.context.scene;cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam
    W=max(gx1-gx0,gz1-gz0);cam.data.type='ORTHO';cam.data.ortho_scale=W;cam.data.clip_end=1e5;cam.location=((gx0+gx1)/2,-(gz0+gz1)/2,60)
    Ls=bpy.data.objects.new('Ls',bpy.data.lights.new('Ls','SUN'));sc.collection.objects.link(Ls);Ls.data.energy=3;Ls.rotation_euler=(0.4,0.2,0)
    sc.world=bpy.data.worlds.new('w');sc.world.color=(0.7,0.7,0.7);sc.render.engine='CYCLES';sc.cycles.samples=4
    sc.render.resolution_x=int(700*(gx1-gx0)/W);sc.render.resolution_y=int(700*(gz1-gz0)/W);fp=os.path.join(OUT,name+'_top.png');sc.render.filepath=fp;bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam);bpy.data.objects.remove(Ls)
    img=plt.imread(fp);ax[0].imshow(img,extent=(gx0,gx1,gz1,gz0));ax[0].contour(np.linspace(gx0,gx1,Rm.shape[1]),np.linspace(gz0,gz1,Rm.shape[0]),Rm,[0.5],colors='c',linewidths=0.8);ax[0].set_ylim(gz0,gz1)
    ax[1].imshow(Rm,origin='lower',extent=ext,cmap='gray');ax[1].set_title('nav')
    for a in ax:
        for (x,z,c) in marks:a.plot(x,z,'o',color=c,ms=5)
        a.grid(True,color='r',lw=0.3);a.set_xticks(np.arange(math.ceil(gx0/2)*2,gx1,2));a.set_yticks(np.arange(math.ceil(gz0/2)*2,gz1,2));a.tick_params(labelsize=5)
    plt.tight_layout();plt.savefig(os.path.join(OUT,name+'_nav.png'),dpi=80)
def run(name):
    C=L[name];load(name,C);base=flatten(C['flat']) if C.get('flat') else 0.0
    if C.get('place'):place(C,base)
    if C.get('manor'):manor(C['manor'])
    texfix(name,C.get('tex',1024))
    if C.get('nav'):Rm,Hg,ext=navbake(name,C['nav']);debug(name,Rm,Hg,ext,C.get('marks',[(0,-12,'b'),(0,16,'m')]))
    export(name)

def merge(names=('village','sagano','scifi','portal','manor')):
    clean()
    for n in names:bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,n+'.glb'))
    for o in list(bpy.data.objects):
        if o.type!='MESH':bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes():o.select_set(True)
    f=os.path.join(HERE,'..','out','niten_loc.glb')
    bpy.ops.export_scene.gltf(filepath=f,export_format='GLB',use_selection=True,export_image_format='AUTO',export_apply=False,export_yup=True,export_tangents=False,export_morph=False,export_skins=False,export_animations=False)
    print('LOC',os.path.getsize(f))
    # nav-сетки -> game/src/gN.js (коммитится вместе с кодом)
    D={}
    for n in names:
        q=os.path.join(OUT,n+'.nav.json')
        if os.path.exists(q):D[n]=json.load(open(q))
    open(os.path.join(HERE,'..','..','game','src','gN.js'),'w').write('// v0.12: nav-сетки проходимости локаций (генерирует blender/ext/locs.py merge). 1 бит на клетку cs×cs, строки по z.\nconst NAVD='+json.dumps(D,separators=(',',':'))+';\n')
if __name__=='__main__':merge() if sys.argv[-1]=='merge' else run(sys.argv[-1])
