"""Общие инструменты генерации моделей в Blender (bpy).
Координаты задаются в системе игры: X — влево/вправо, Y — вверх, Z — вперёд (метры).
Конвертация в Blender (Z-up): (x, y, z) -> (x, -z, y). glTF-экспорт возвращает их обратно."""
import bpy, bmesh, math, random, os
import numpy as np
from mathutils import Vector as V, Matrix, noise
TEX=os.path.join(os.path.dirname(__file__),'tex')
TAU=math.pi*2
def bl(p): return (p[0],-p[2],p[1])
def gm(p): return V((p[0],p[2],-p[1]))
COLL=[None]
def collection(name):
    c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);COLL[0]=c;return c
def link(ob):
    (COLL[0] or bpy.context.scene.collection).objects.link(ob);return ob
# ---------------------------------------------------------------- материалы
MATS={};IMGS={}
def img(name,non_color=False):
    k=(name,non_color)
    if k in IMGS:return IMGS[k]
    im=bpy.data.images.load(os.path.join(TEX,name+'.png'),check_existing=True)
    if non_color:im.colorspace_settings.name='Non-Color'
    IMGS[k]=im;return im
def mat(name,col=(0.5,0.5,0.5),rough=0.6,metal=0.0,tex=None,ntex=None,nstr=1.0,orm=None,emis=None,es=1.0,coat=0.0,double=False,dens=4.0,alpha=None,sheen=0.0):
    if name in MATS:return MATS[name]
    m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;P=nt.nodes['Principled BSDF']
    P.inputs['Roughness'].default_value=rough;P.inputs['Metallic'].default_value=metal
    if tex:
        t=nt.nodes.new('ShaderNodeTexImage');t.image=img(tex)
        mx=nt.nodes.new('ShaderNodeMix');mx.data_type='RGBA';mx.blend_type='MULTIPLY';mx.inputs['Factor'].default_value=1.0
        nt.links.new(t.outputs['Color'],mx.inputs[6]);mx.inputs[7].default_value=(*col,1);nt.links.new(mx.outputs[2],P.inputs['Base Color'])
    else:P.inputs['Base Color'].default_value=(*col,1)
    if ntex:
        t=nt.nodes.new('ShaderNodeTexImage');t.image=img(ntex,True);nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=nstr
        nt.links.new(t.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],P.inputs['Normal'])
    if orm:
        t=nt.nodes.new('ShaderNodeTexImage');t.image=img(orm,True);sp=nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t.outputs['Color'],sp.inputs['Color']);nt.links.new(sp.outputs['Green'],P.inputs['Roughness']);nt.links.new(sp.outputs['Blue'],P.inputs['Metallic'])
    if emis:
        P.inputs['Emission Color'].default_value=(*emis,1);P.inputs['Emission Strength'].default_value=es
    if coat:P.inputs['Coat Weight'].default_value=coat;P.inputs['Coat Roughness'].default_value=0.08
    pass  # sheen отключён (в WebGL слишком высветляет ткань)
    if alpha is not None:P.inputs['Alpha'].default_value=alpha
    m.use_backface_culling=not double
    m['dens']=dens;MATS[name]=m;return m
# ---------------------------------------------------------------- меши
def new_obj(name,verts,faces,material=None,parent=None,uvs=None,smooth=True,loc=(0,0,0)):
    me=bpy.data.meshes.new(name);me.from_pydata([bl(v) for v in verts],[],faces);me.update()
    if uvs is not None:
        ul=me.uv_layers.new(name='UVMap');d=ul.data;k=0
        for fi,poly in enumerate(me.polygons):
            for j,li in enumerate(poly.loop_indices):d[li].uv=uvs[fi][j]
    ob=bpy.data.objects.new(name,me);link(ob)
    if material:me.materials.append(material)
    if smooth:me.shade_smooth()
    if parent:ob.parent=parent
    ob.location=bl(loc);return ob
def empty(name,loc=(0,0,0),parent=None):
    e=bpy.data.objects.new(name,None);e.empty_display_size=0.05;link(e)
    if parent:e.parent=parent
    e.location=bl(loc);return e
def loft(rings,closed=True,cap0=False,cap1=False,us=1.0,vs=1.0):
    """rings: список колец (списки точек одинаковой длины). UV: u — по кольцу (в метрах), v — по длине."""
    n=len(rings[0]);verts=[];faces=[];uvs=[]
    for r in rings:verts+= [tuple(p) for p in r]
    # длины дуг для UV
    vacc=[0.0]
    for i in range(1,len(rings)):
        d=sum((V(rings[i][j])-V(rings[i-1][j])).length for j in range(n))/n;vacc.append(vacc[-1]+d)
    uacc=[]
    for r in rings:
        a=[0.0]
        for j in range(1,n+1 if closed else n):a.append(a[-1]+(V(r[j%n])-V(r[j-1])).length)
        uacc.append(a)
    m=n if closed else n-1
    for i in range(len(rings)-1):
        for j in range(m):
            j2=(j+1)%n;faces.append((i*n+j,i*n+j2,(i+1)*n+j2,(i+1)*n+j))
            uvs.append([(uacc[i][j]*us,vacc[i]*vs),(uacc[i][j+1]*us,vacc[i]*vs),(uacc[i+1][j+1]*us,vacc[i+1]*vs),(uacc[i+1][j]*us,vacc[i+1]*vs)])
    for cap,ri in((cap0,0),(cap1,len(rings)-1)):
        if cap:
            c=V((0,0,0))
            for p in rings[ri]:c+=V(p)
            c/=n;ci=len(verts);verts.append(tuple(c))
            for j in range(n):
                a,b=ri*n+j,ri*n+(j+1)%n;faces.append((a,b,ci) if ri==0 else (b,a,ci))
                uvs.append([(V(verts[a]).x*us,V(verts[a]).z*us),(V(verts[b]).x*us,V(verts[b]).z*us),(c.x*us,c.z*us)])
    return verts,faces,uvs
def ellipse_ring(c,rx,rz,n,f=None,a0=0.0,a1=TAU,closed=True,yfn=None):
    pts=[];cnt=n if closed else n
    for j in range(cnt):
        a=a0+(a1-a0)*j/(n if closed else n-1);s=f(a) if f else 1.0
        y=c[1]+(yfn(a) if yfn else 0)
        pts.append((c[0]+math.sin(a)*rx*s,y,c[2]+math.cos(a)*rz*s))
    return pts
def frames(path):
    T=[];P=[V(p) for p in path]
    for i in range(len(P)):
        a=P[max(i-1,0)];b=P[min(i+1,len(P)-1)];T.append((b-a).normalized())
    up=V((0,1,0)) if abs(T[0].y)<0.9 else V((1,0,0))
    N=[T[0].cross(up).normalized()];B=[T[0].cross(N[0])]
    for i in range(1,len(P)):
        n=N[-1]-T[i]*N[-1].dot(T[i]);n.normalize();N.append(n);B.append(T[i].cross(n))
    return P,T,N,B
def tube(path,radii,n=8,cap0=True,cap1=True,flat=1.0,twist=0.0,rfn=None):
    P,T,N,B=frames(path);rings=[]
    for i,p in enumerate(P):
        r=radii(i/(len(P)-1)) if callable(radii) else radii;ring=[]
        for j in range(n):
            a=TAU*j/n+twist*i;s=rfn(a,i/(len(P)-1)) if rfn else 1
            ring.append(tuple(p+(N[i]*math.cos(a)+B[i]*math.sin(a)*flat)*r*s))
        rings.append(ring)
    return loft(rings,True,cap0,cap1)
def merge_geo(*gs):
    V_=[];F=[];U=[]
    for v,f,u in gs:
        o=len(V_);V_+=v;F+=[tuple(i+o for i in ff) for ff in f];U+=u
    return V_,F,U
def mk(name,geo,material,parent=None,loc=(0,0,0),sub=0,disp=None,smooth=True,solid=0.0,bevel=0.0,sharp=None,recalc=True,shade_flat=False):
    v,f,u=geo;dens=material['dens'] if material and 'dens' in material else 4.0
    u=[[(a*dens,b*dens) for a,b in face] for face in u]
    ob=new_obj(name,v,f,material,parent,u,smooth and not shade_flat,loc)
    if recalc:
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free()
    if solid:
        m=ob.modifiers.new('sol','SOLIDIFY');m.thickness=solid;m.offset=0;m.use_even_offset=True
    if bevel:
        m=ob.modifiers.new('bev','BEVEL');m.width=bevel;m.segments=2;m.limit_method='ANGLE'
    if sub:
        m=ob.modifiers.new('sub','SUBSURF');m.levels=sub;m.render_levels=sub
    apply_mods(ob)
    if disp:displace(ob,disp)
    if sharp is not None:ob.data.set_sharp_from_angle(angle=math.radians(sharp))
    return ob
def apply_mods(ob):
    if not ob.modifiers:return
    dg=bpy.context.evaluated_depsgraph_get();ev=ob.evaluated_get(dg)
    me=bpy.data.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=dg);old=ob.data;ob.modifiers.clear();ob.data=me
    if old.users==0:bpy.data.meshes.remove(old)
def displace(ob,fn):
    """fn(p_game, n_game) -> смещение вдоль нормали (м)."""
    me=ob.data;me.update();k=len(me.vertices)
    co=np.zeros(k*3);me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
    nr=np.zeros(k*3);me.vertex_normals.foreach_get('vector',nr);nr=nr.reshape(-1,3)
    for i in range(k):
        p=gm(co[i]);n=gm(nr[i]);d=fn(p,n);co[i]+=nr[i]*d
    me.vertices.foreach_set('co',co.reshape(-1));me.update()
def nz(p,s=1.0,o=0):
    return noise.noise(V((p[0]*s+o,p[1]*s+o*1.7,p[2]*s-o)))
def fbm3(p,s=1.0,oct=4,o=0):
    t=0;a=1;f=s;tot=0
    for i in range(oct):t+=nz(p,f,o+i*3.1)*a;tot+=a;a*=0.5;f*=2.03
    return t/tot
def skin_body(name,verts,edges,radii,material,parent=None,sub=2,disp=None,loc=(0,0,0)):
    """Органическая форма через Skin-модификатор: verts (game), edges, radii [(rx,rz)]."""
    me=bpy.data.meshes.new(name);me.from_pydata([bl(v) for v in verts],edges,[]);ob=bpy.data.objects.new(name,me);link(ob)
    if parent:ob.parent=parent
    ob.location=bl(loc)
    m=ob.modifiers.new('skin','SKIN');m.use_smooth_shade=True;m.branch_smoothing=0.6
    sv=me.skin_vertices[''].data
    for i,r in enumerate(radii):sv[i].radius=r
    sv[0].use_root=True
    s=ob.modifiers.new('sub','SUBSURF');s.levels=sub;s.render_levels=sub
    apply_mods(ob);me=ob.data
    if material:me.materials.clear();me.materials.append(material)
    me.shade_smooth();box_uv(ob,material['dens'] if material else 4)
    if disp:displace(ob,disp)
    return ob
def box_uv(ob,dens=4.0):
    me=ob.data
    if me.uv_layers:me.uv_layers.remove(me.uv_layers[0])
    ul=me.uv_layers.new(name='UVMap');d=ul.data;vs=me.vertices
    for poly in me.polygons:
        n=poly.normal;ax=max(range(3),key=lambda i:abs(n[i]))
        for li in poly.loop_indices:
            c=vs[me.loops[li].vertex_index].co
            u,v=((c.y,c.z),(c.x,c.z),(c.x,c.y))[ax];d[li].uv=(u*dens,v*dens)
def mirror_x(geo):
    v,f,u=geo;return [(-p[0],p[1],p[2]) for p in v],[tuple(reversed(ff)) for ff in f],[list(reversed(uu)) for uu in u]
def xform(geo,fn):
    v,f,u=geo;return [tuple(fn(V(p))) for p in v],f,u
def rotx(a):
    c,s=math.cos(a),math.sin(a);return lambda p:V((p.x,p.y*c-p.z*s,p.y*s+p.z*c))
def roty(a):
    c,s=math.cos(a),math.sin(a);return lambda p:V((p.x*c+p.z*s,p.y,-p.x*s+p.z*c))
def rotz(a):
    c,s=math.cos(a),math.sin(a);return lambda p:V((p.x*c-p.y*s,p.x*s+p.y*c,p.z))
def tr(dx,dy,dz):return lambda p:V((p.x+dx,p.y+dy,p.z+dz))
def chain(*fs):
    def g(p):
        for f in fs:p=f(p)
        return p
    return g
def box(sx,sy,sz,c=(0,0,0),seg=1):
    """Коробка (полуразмеры) с UV."""
    hx,hy,hz=sx,sy,sz;cx,cy,cz=c
    rings=[];n=4
    pts=lambda y:[(cx-hx,y,cz+hz),(cx+hx,y,cz+hz),(cx+hx,y,cz-hz),(cx-hx,y,cz-hz)]
    rings=[pts(cy-hy+2*hy*i/seg) for i in range(seg+1)]
    return loft(rings,True,True,True)
def plate(w,h,th,curve=0.0,nu=8,nv=4,c=(0,0,0),bend=0.0):
    """Изогнутая пластина: ширина w по X, высота h по Y, толщина th; curve — радиус изгиба (0 — плоская)."""
    vs=[];fs=[];us=[];idx={}
    for side in (0,1):
        for j in range(nv+1):
            for i in range(nu+1):
                x=-w/2+w*i/nu;y=-h/2+h*j/nv;z=0.0
                if curve:
                    a=x/curve;z=curve*(math.cos(a)-1);x=curve*math.sin(a)
                z+=bend*(y/h)**2;nz_=(0 if not curve else 0)
                if curve:
                    a=(-w/2+w*i/nu)/curve;dz=math.cos(a);dx=math.sin(a)
                else:dz,dx=1,0
                off=th/2 if side==0 else -th/2
                idx[(side,i,j)]=len(vs);vs.append((c[0]+x+dx*off,c[1]+y,c[2]+z+dz*off))
    def q(a,b,cc,d,uv):fs.append((a,b,cc,d));us.append(uv)
    for j in range(nv):
        for i in range(nu):
            uv=[(i/nu*w,j/nv*h),((i+1)/nu*w,j/nv*h),((i+1)/nu*w,(j+1)/nv*h),(i/nu*w,(j+1)/nv*h)]
            q(idx[(0,i,j)],idx[(0,i+1,j)],idx[(0,i+1,j+1)],idx[(0,i,j+1)],uv)
            q(idx[(1,i,j+1)],idx[(1,i+1,j+1)],idx[(1,i+1,j)],idx[(1,i,j)],uv[::-1])
    for i in range(nu):
        for j in (0,nv):
            uv=[(0,0),(th,0),(th,th),(0,th)];a,b=idx[(0,i,j)],idx[(0,i+1,j)];c2,d=idx[(1,i+1,j)],idx[(1,i,j)]
            q(a,d,c2,b,uv) if j==0 else q(a,b,c2,d,uv)
    for j in range(nv):
        for i in (0,nu):
            uv=[(0,0),(th,0),(th,th),(0,th)];a,b=idx[(0,i,j)],idx[(0,i,j+1)];c2,d=idx[(1,i,j+1)],idx[(1,i,j)]
            q(a,b,c2,d,uv) if i==0 else q(a,d,c2,b,uv)
    return vs,fs,us
def lathe(profile,n=16,c=(0,0,0),cap0=False,cap1=False,f=None):
    """profile: [(r,y)] вращение вокруг оси Y."""
    rings=[ellipse_ring((c[0],c[1]+y,c[2]),r,r,n,f) for r,y in profile]
    return loft(rings,True,cap0,cap1)
# ---------------------------------------------------------------- превью-рендер (Cycles CPU)
def render_preview(path,target=(0,1,0),dist=3.0,yaw=30,pitch=8,res=(640,800),lens=50,samples=24,objs=None):
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=samples;sc.cycles.use_denoising=True
    try:sc.cycles.denoiser='OPENIMAGEDENOISE'
    except Exception:pass
    sc.render.resolution_x,sc.render.resolution_y=res;sc.render.resolution_percentage=100;sc.render.filepath=path
    sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast'
    if not sc.world:sc.world=bpy.data.worlds.new('W')
    sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(0.03,0.032,0.04,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=1.0
    for o in [o for o in bpy.data.objects if o.name.startswith('_PV')]:bpy.data.objects.remove(o)
    t=V(bl(target))
    def light(nm,kind,energy,loc,col=(1,1,1),size=1.0):
        ld=bpy.data.lights.new(nm,kind);ld.energy=energy;ld.color=col
        if kind=='AREA':ld.size=size
        o=bpy.data.objects.new(nm,ld);bpy.context.scene.collection.objects.link(o);o.location=loc
        d=t-V(loc);o.rotation_euler=d.to_track_quat('-Z','Y').to_euler();return o
    ya=math.radians(yaw);pa=math.radians(pitch)
    cam_loc=t+V((math.sin(ya)*math.cos(pa)*dist,-math.cos(ya)*math.cos(pa)*dist,math.sin(pa)*dist))
    light('_PVkey','AREA',160*dist/3,t+V((2.2,-2.0,2.2)),(1.0,0.86,0.7),1.5)
    light('_PVrim','AREA',200*dist/3,t+V((-1.8,2.4,1.6)),(0.6,0.75,1.0),1.0)
    light('_PVfill','AREA',40*dist/3,t+V((-2.5,-1.5,0.5)),(0.7,0.75,0.85),2.5)
    cd=bpy.data.cameras.new('_PVcam');cd.lens=lens;co=bpy.data.objects.new('_PVcam',cd);bpy.context.scene.collection.objects.link(co)
    co.location=cam_loc;co.rotation_euler=(t-cam_loc).to_track_quat('-Z','Y').to_euler();sc.camera=co
    bpy.ops.render.render(write_still=True)
