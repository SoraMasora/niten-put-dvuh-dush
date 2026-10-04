# v0.18: ГЛАВА 9 «Пробуждение» — сон-космос со Старцем, новые катаны, PS1-локация с волнами хоррор-мобов.
# python3 blender/ext/v18.py   -> blender/out/niten_v18.glb + game/src/gQd.js (многоуровневая nav-сетка, облако галактики, точки)
# Исходники ($NITEN_SRC/v18, в git не хранятся; все — Sketchfab):
#   location_ps1_style.glb      — Parado10, CC-BY-4.0          (локация: атриум с деревом, галерея, лестницы)
#   need_some_space.glb         — Loïc Norgeot, CC-BY-4.0      (облако точек галактики -> сон-космос)
#   the_old_man.glb             — Felnev, CC-BY-NC-4.0         (Старец; некоммерческая лицензия!)
#   set_of_two_katanas.glb      — stasbelyk13, CC-BY-4.0       (две новые катаны + ножны)
#   enemie_for_horror_game.glb  — DynamicSAV, CC-BY-4.0        (моб «Тряпичник»)
#   smily_horror_monster.glb    — Bento, CC-BY-4.0             (моб «Улыбака», ползун)
#   dog_monster.glb             — Ploobert, CC-BY-NC-SA-4.0    (моб «Пёс»; некоммерческая лицензия!)
#   (если этих двух файлов нет — строятся процедурные заглушки)
import bpy,bmesh,sys,os,json,math,base64,random
import numpy as np
from mathutils import Vector,Matrix,Quaternion
from mathutils.bvhtree import BVHTree
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);sys.path.insert(0,os.path.join(HERE,'..'))
import lib as L
SRC=os.path.join(os.environ.get('NITEN_SRC','/data/src'),'v18')
ROOT=os.path.join(HERE,'..','..');OUT=os.path.join(HERE,'..','out','v18');os.makedirs(OUT,exist_ok=True)
def f(n):return os.path.join(SRC,n)
CS=0.25;NAVB=(-19.0,13.0,-19.0,17.0)     # x0,x1,z0,z1 игровые (z=-y Blender)
STEP=0.42;CLEAR=1.65                       # макс. ступень, мин. высота над полом
NOSOLID=('Shadow_Glass','Water','Foliage','Fish')
SPAWN=(0.0,8.4)                           # пробуждение: терраса у южного входа (игровые x,z)
def clean():bpy.ops.wm.read_factory_settings(use_empty=True)
def bake_xf(o):
    if o.data.users>1:o.data=o.data.copy()
    o.data.transform(o.matrix_world);o.parent=None;o.matrix_world=Matrix.Identity(4)
def join(objs,name):
    objs=[o for o in objs if o]
    if not objs:return None
    if len(objs)>1:
        with bpy.context.temp_override(active_object=objs[0],selected_editable_objects=objs,selected_objects=objs):bpy.ops.object.join()
    objs[0].name=name;return objs[0]
def matname(o):return o.data.materials[0].name if o.data.materials and o.data.materials[0] else ''
# ------------------------------------------------------------------ локация
def location():
    n0=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f('location_ps1_style.glb'))
    new=[o for o in bpy.data.objects if o not in n0]
    # скиннинг (качающаяся листва, рыбы) -> фиксируем позу покоя, арматуру удаляем
    for o in new:
        if o.type=='MESH':
            for md in list(o.modifiers):
                if md.type=='ARMATURE':o.modifiers.remove(md)
    meshes=[o for o in new if o.type=='MESH' and len(o.data.polygons)>0 and o.data.materials and o.data.materials[0]]
    for o in meshes:bake_xf(o)
    for o in [o for o in new if o not in meshes]:bpy.data.objects.remove(o)
    for o in meshes:
        m=matname(o)
        o['part']='ps1glass' if 'Shadow_Glass_Light'==m else 'ps1shadow' if m=='Shadow_Glass_Light_1' else 'ps1water' if m=='Water' else 'ps1fol' if m in('Foliage','Fish') else 'ps1lamp' if m=='Light' else 'ps1'
    for m in bpy.data.materials:
        if not m.name.startswith('p1_'):m.name='p1_'+m.name
    for im in list(bpy.data.images):
        if not im.name.startswith('p1_'):im.name='p1_'+im.name
        if im.size[0]>1024:im.scale(1024,1024)
    return meshes
def scene_bvh(filt):
    bm=bmesh.new()
    for o in [x for x in bpy.data.objects if x.type=='MESH' and filt(x)]:
        t=bmesh.new();t.from_mesh(o.data);t.transform(o.matrix_world);bmesh.ops.triangulate(t,faces=t.faces[:])
        me=bpy.data.meshes.new('tmp');t.to_mesh(me);t.free();bm.from_mesh(me);bpy.data.meshes.remove(me)
    bm.faces.ensure_lookup_table();return BVHTree.FromBMesh(bm),bm
def navbake():
    solid=lambda o:not any(s in matname(o) for s in NOSOLID)
    T,_=scene_bvh(solid);TW,_=scene_bvh(lambda o:'Water' in matname(o))
    x0,x1,z0,z1=NAVB;w=int(round((x1-x0)/CS));h=int(round((z1-z0)/CS));dn=Vector((0,0,-1));up=Vector((0,0,1))
    LAY=[[[] for i in range(w)] for j in range(h)]
    for j in range(h):
        z=z0+(j+.5)*CS
        for i in range(w):
            x=x0+(i+.5)*CS;hits=[]
            # v0.19: 5 лучей на ячейку (ступени из отдельных досок с зазорами) и горизонтальные грани любой ориентации
            # (у деревянных винтовых лестниц нормали верхних граней развёрнуты вниз — раньше они не считались полом)
            for ox,oz in((0,0),(-0.08,-0.08),(0.08,-0.08),(-0.08,0.08),(0.08,0.08)):
                top=30.0
                for k in range(16):
                    r=T.ray_cast(Vector((x+ox,-(z+oz),top)),dn,60)
                    if r[0] is None:break
                    p,n=r[0],r[1]
                    if abs(n.z)>0.6:
                        c=T.ray_cast(p+up*0.05,up,10);cl=(c[3]+0.05) if c[0] is not None else 99
                        wt=TW.ray_cast(p+up*0.02,up,3)
                        if cl>=CLEAR and wt[0] is None:hits.append(round(p.z,3))
                    top=p.z-0.03
            hs=[]
            for y in sorted(hits):
                if hs and y-hs[-1]<0.1:hs[-1]=y
                else:hs.append(y)
            LAY[j][i]=hs
    # рёбра между узлами (ячейка, слой): перепад <= STEP и свободный проход на высоте колен/груди
    def node_ok(j,i,hh):return True
    def passable(j,i,hA,j2,i2,hB):
        if abs(hA-hB)>STEP:return False
        a=Vector((x0+(i+.5)*CS,-(z0+(j+.5)*CS),0));b=Vector((x0+(i2+.5)*CS,-(z0+(j2+.5)*CS),0))
        for dy in(0.45,1.25):
            yy=max(hA,hB)+dy;pa=Vector((a.x,a.y,yy));d=Vector((b.x,b.y,yy))-pa
            r=T.ray_cast(pa,d.normalized(),d.length)
            if r[0] is not None:return False
        return True
    D4=((0,1),(0,-1),(1,0),(-1,0))   # (dj,di): +x,-x,+z,-z
    sj=int((SPAWN[1]-z0)/CS);si=int((SPAWN[0]-x0)/CS)
    lay0=LAY[sj][si];assert lay0,'spawn has no floor'
    s0=min(range(len(lay0)),key=lambda q:abs(lay0[q]-1.16))   # терраса пробуждения (~1,16 м)
    R={(sj,si,s0)};st=[(sj,si,s0)];E={}
    while st:
        j,i,q=st.pop();hA=LAY[j][i][q]
        for d,(dj,di) in enumerate(D4):
            a,b=j+dj,i+di
            if not(0<=a<h and 0<=b<w):continue
            best=None
            for q2,hB in enumerate(LAY[a][b]):
                if abs(hB-hA)<=STEP and (best is None or abs(hB-hA)<abs(LAY[a][b][best]-hA)):best=q2
            if best is None or not passable(j,i,hA,a,b,LAY[a][b][best]):continue
            E[(j,i,q,d)]=best
            if (a,b,best) not in R:R.add((a,b,best));st.append((a,b,best))
    # отступ от стен/обрывов: узел без всех 4 соседей -> край (оставляем, но помечаем)
    core=set(n for n in R if all((n[0],n[1],n[2],d) in E for d in range(4)))
    print('NAV nodes',len(R),'core',len(core))
    # плотная упаковка: по ячейке до 3 достижимых слоёв (сортировка по высоте)
    NL=3;HH=np.zeros((NL,h,w),'<u2');CC=np.zeros((NL,h,w),np.uint8);idx={}
    ho=-8.0
    for j in range(h):
        for i in range(w):
            ql=sorted([q for q in range(len(LAY[j][i])) if (j,i,q) in R],key=lambda q:LAY[j][i][q])
            if len(ql)>NL:print('cell',j,i,'layers',len(ql));ql=ql[:NL]
            for k,q in enumerate(ql):idx[(j,i,q)]=k;HH[k,j,i]=int(round((LAY[j][i][q]-ho)*100))
    for (j,i,q),k in idx.items():
        c=0
        for d,(dj,di) in enumerate(D4):
            q2=E.get((j,i,q,d))
            if q2 is None or (j+dj,i+di,q2) not in idx:continue
            c|=(idx[(j+dj,i+di,q2)]+1)<<(2*d)
        if (j,i,q) not in core:c|=0   # край: соединения сохраняются (коллизия — по рёбрам)
        CC[k,j,i]=c
    # воксели для клипа камеры (0.4 м): ячейка занята, если поверхность ближе 0.36 м от центра и центр за ней
    VS=0.4;vy0=-9.0;vy1=15.0;vw=int(round((x1-x0)/VS));vh=int(round((z1-z0)/VS));vn=int(round((vy1-vy0)/VS))
    bits=np.zeros(vw*vh*vn,np.uint8)
    for k in range(vn):
        yy=vy0+(k+.5)*VS
        for j in range(vh):
            zz=z0+(j+.5)*VS
            for i in range(vw):
                c=Vector((x0+(i+.5)*VS,-zz,yy));r=T.find_nearest(c,0.36)
                # одностороннее заполнение: только за поверхностью (по нормали) или вплотную к ней —
                # точка камеры/героя в комнате не оказывается «внутри стены»
                if r[0] is not None and (r[3]<0.1 or (c-r[0]).dot(r[1])<0):bits[(k*vh+j)*vw+i]=1
    print('VOX',vw,vh,vn,'solid',int(bits.sum()))
    vox=dict(s=VS,y0=vy0,w=vw,h=vh,n=vn,b=base64.b64encode(np.packbits(bits).tobytes()).decode())
    np.save(os.path.join(OUT,'navH.npy'),HH);np.save(os.path.join(OUT,'navC.npy'),CC)
    json.dump({'%d,%d'%(j,i):v for j,row in enumerate(LAY) for i,v in enumerate(row) if v},open(os.path.join(OUT,'lay.json'),'w'))
    nav=dict(x0=x0,z0=z0,cs=CS,w=w,h=h,ho=ho,nl=NL,step=STEP,
        H=base64.b64encode(HH.tobytes()).decode(),C=base64.b64encode(CC.tobytes()).decode(),vox=vox)
    return nav
# ------------------------------------------------------------------ общие утилиты моделей
def imp(path):
    n0=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=path);new=[o for o in bpy.data.objects if o not in n0]
    meshes=[o for o in new if o.type=='MESH' and len(o.data.polygons)>0]
    for o in meshes:
        for md in list(o.modifiers):
            if md.type=='ARMATURE':o.modifiers.remove(md)
        bake_xf(o)
    for o in [o for o in new if o not in meshes]:bpy.data.objects.remove(o)
    return meshes
def decimate(o,tris):
    n=sum(len(p.vertices)-2 for p in o.data.polygons)
    if n<=tris:return
    m=o.modifiers.new('dec','DECIMATE');m.ratio=max(0.002,tris/n);m.use_collapse_triangulate=True;L.apply_mods(o)
def verts(o):
    k=len(o.data.vertices);co=np.zeros(k*3);o.data.vertices.foreach_get('co',co);return co.reshape(-1,3)
def xform_objs(objs,M):
    for o in objs:o.data.transform(M);o.data.update()
def shrink_imgs(prefix,mx):
    for im in list(bpy.data.images):
        if im.users==0:continue
        if not im.name.startswith(prefix):im.name=prefix+im.name
        if im.size[0]>mx or im.size[1]>mx:im.scale(min(mx,im.size[0]),min(mx,im.size[1]))
def prefix_mats(objs,prefix):
    for o in objs:
        for m in o.data.materials:
            if m and not m.name.startswith(prefix):m.name=prefix+m.name
# ------------------------------------------------------------------ катаны (SW_N1 / SW_N2) и ножны (SN1 / SN2)
# Кадр меча в игре: клинок вдоль +Z, цуба на z=0.075, рукоять в -Z, изгиб к +Y (как bladeGeo / KN). Blender: игра(x,y,z) -> (x,-z,y).
KAT_BLADE=0.78
def g2bM():return Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))   # игра -> Blender
def katanas():
    ms=imp(f('set_of_two_katanas.glb'))
    by={}
    for o in ms:by.setdefault(o.data.name,o)
    # меши исходника: Object_0+1 — катана 1 (.001), Object_3+4 — катана 2, Object_2/5 — ножны; *.001 — дубликаты
    keep={'k1':['Object_0','Object_1'],'k2':['Object_3','Object_4'],'s1':['Object_5'],'s2':['Object_2']}
    used=set(sum(keep.values(),[]))
    for o in ms:
        if o.data.name not in used:bpy.data.objects.remove(o)
    out={};info={}
    for k in('k1','k2'):
        objs=[by[n] for n in keep[k]];j=join(objs,'kat_'+k);decimate(j,4200)
        co=verts(j);c0=co.mean(0);U,S,Vt=np.linalg.svd(co-c0,full_matrices=False);ax=Vt[0]
        t=(co-c0)@ax
        # рукоять — конец с плотной сеткой обмотки
        lo,hi=t.min(),t.max();nlo=(t<lo+0.15*(hi-lo)).sum();nhi=(t>hi-0.15*(hi-lo)).sum()
        if nhi>nlo:ax=-ax;t=-t;lo,hi=t.min(),t.max()
        # цуба: самый широкий срез в нижней трети
        best=None
        for tt in np.linspace(lo,lo+0.45*(hi-lo),90):
            sel=np.abs(t-tt)<(hi-lo)/200
            if sel.sum()<3:continue
            P=co[sel]-c0;P=P-np.outer(P@ax,ax);wd=np.linalg.norm(P,axis=1).max()
            if best is None or wd>best[1]:best=(tt,wd)
        tts=best[0]
        # касательная клинка у цубы и направление изгиба
        bl_=(t>tts+0.03*(hi-lo))&(t<tts+0.3*(hi-lo));Pb=co[bl_];cb=Pb.mean(0);_,_,Vb=np.linalg.svd(Pb-cb,full_matrices=False);zd=Vb[0]*np.sign(Vb[0]@ax)
        base=c0+ax*tts;tip_sel=t>hi-0.02*(hi-lo);tip=co[tip_sel].mean(0)
        dv=(tip-base);yd=dv-zd*(dv@zd);yd/=np.linalg.norm(yd);xd=np.cross(yd,zd)
        # центр цубы: центроид вершин среза
        sel=np.abs(t-tts)<(hi-lo)/100;cts=co[sel].mean(0);cts=cts-zd*((cts-base)@zd)
        L_bl=(tip-cts)@zd;s=KAT_BLADE/L_bl
        R=Matrix(((*xd,0),(*yd,0),(*zd,0),(0,0,0,1)))  # строки: оси меча -> координаты в кадре меча
        M=Matrix.Translation((0,0,0.075))@Matrix.Scale(s,4)@R@Matrix.Translation(Vector(-cts))
        j.data.transform(g2bM()@M);j.data.update()
        tipg=M@Vector(tip);info[k]=dict(tip=[round(tipg.x,4),round(tipg.y,4),round(tipg.z,4)],scale=s,frame=(cts,xd,yd,zd,s))
        out[k]=j
        print('KATANA',k,'blade',round(L_bl*s,3),'tip',info[k]['tip'],'tris',sum(len(p.vertices)-2 for p in j.data.polygons))
    # ножны: выравнивание по своей оси, устье (широкий конец) у цубы, длина под клинок
    for k,kk in(('s1','k1'),('s2','k2')):
        j=join([by[n] for n in keep[k]],'saya_'+k);decimate(j,1600)
        co=verts(j);c0=co.mean(0);_,_,Vt=np.linalg.svd(co-c0,full_matrices=False);ax=Vt[0];t=(co-c0)@ax;lo,hi=t.min(),t.max()
        def wid(a,b):
            sel=(t>a)&(t<b);P=co[sel]-c0;P=P-np.outer(P@ax,ax);return np.linalg.norm(P,axis=1).max() if sel.any() else 0
        if wid(hi-0.04*(hi-lo),hi)>wid(lo,lo+0.04*(hi-lo)):ax=-ax;t=-t;lo,hi=t.min(),t.max()
        # устье при t=lo; изгиб: середина относительно хорды
        a0=co[t<lo+0.01*(hi-lo)].mean(0);a1=co[t>hi-0.01*(hi-lo)].mean(0);zd=(a1-a0)/np.linalg.norm(a1-a0)
        mid=co[np.abs(t-(lo+hi)/2)<(hi-lo)/50].mean(0);dm=mid-(a0+a1)/2;dm=dm-zd*(dm@zd)
        yd=-dm/np.linalg.norm(dm) if np.linalg.norm(dm)>1e-5 else np.array([0,0,1.0]);xd=np.cross(yd,zd)
        Ls=(a1-a0)@zd;s=(KAT_BLADE+0.05)/Ls
        R=Matrix(((*xd,0),(*yd,0),(*zd,0),(0,0,0,1)))
        M=Matrix.Translation((0,0,0.072))@Matrix.Scale(s,4)@R@Matrix.Translation(Vector(-a0))
        j.data.transform(g2bM()@M);j.data.update();out[k]=j
        print('SAYA',k,'len',round(Ls*s,3))
    prefix_mats(out.values(),'n8k_')
    names={'k1':'SW_N1__blade','k2':'SW_N2__blade','s1':'SN1__saya','s2':'SN2__saya'}
    for k,o in out.items():o.name=names[k]
    for k,pre in(('k1','SW_N1'),('k2','SW_N2')):
        e=bpy.data.objects.new(pre+'__TIP',None);bpy.context.scene.collection.objects.link(e);tp=info[k]['tip'];e.location=(tp[0],-tp[2],tp[1])
    return info
# ------------------------------------------------------------------ Старец (the_old_man.glb, CC-BY-NC-4.0 Felnev)
# Один меш V8__old: цвет вершины R = номер «кости» для жёсткого скиннинга в игре (gQ.js v8Skin), 0 — по близости.
OLD_DEC={'Cube.002':6500,'Plane.003':2600,'Plane.004':2600,'Plane.005':2400,'Torus.002':1800,'Torus.003':1800,'Skull':7000,'GEO-head':900,'GEO-chest':1200,
 'GEO-arm_lower_male_primitive_realistic.L':1600,'GEO-arm_lower_male_primitive_realistic.R':1600,'GEO-arm_upper':1000,'GEO-finger':1800,'GEO-toe':1200,'Gear':900,'Sphere':500,'GEO-eye':240,'GEO-neck':500,'GEO-shoulder':300,'GEO-leg':500}
# кости (игровые координаты после выравнивания, см. gQd.js OLDB): 1 hips 2 chest 3 head 4 armR 5 foreR 6 handR 7 armL 8 foreL 9 handL
OLD_ID={'Skull':3,'GEO-head':3,'GEO-eye':3,'GEO-neck':3,'GEO-arm_lower_male_primitive_realistic.R':5,'Sphere':6,'GEO-arm_lower_male_primitive_realistic.L':8,'GEO-finger':9,'GEO-arm_upper':7,'GEO-shoulder':7,'Gear':7,'GEO-chest':2}
def oldman():
    ms=imp(f('the_old_man.glb'))
    allc=np.concatenate([verts(o) for o in ms]);mn=allc.min(0);mx=allc.max(0)
    head=[o for o in ms if o.name.startswith('Skull')][0];hc=verts(head).mean(0)
    cx,cy=hc[0],(mn[1]+mx[1])/2*0+hc[1]
    T=Matrix.Translation((-hc[0],-hc[1],-mn[2]))
    for o in ms:
        key=next((k for k in OLD_DEC if o.name.startswith(k)),None)
        if key:decimate(o,OLD_DEC[key])
        o.data.transform(T);o.data.update()
        idk=next((k for k in OLD_ID if o.name.startswith(k)),None);v=OLD_ID[idk]/16.0 if idk else 0.0
        ca=o.data.color_attributes.new('Col','BYTE_COLOR','CORNER') if 'Col' not in o.data.color_attributes else o.data.color_attributes['Col']
        for d in ca.data:d.color=(v,0,0,1)
    for o in ms:
        c=verts(o);print('  part',o.name[:40],'game min',[round(c[:,0].min(),3),round(c[:,2].min(),3),round(-c[:,1].max(),3)],'max',[round(c[:,0].max(),3),round(c[:,2].max(),3),round(-c[:,1].min(),3)])
    prefix_mats(ms,'n8o_')
    j=join(ms,'V8__old');shrink_imgs('n8o_',512)
    co=verts(j);print('OLD bbox',co.min(0).round(3),co.max(0).round(3),'tris',sum(len(p.vertices)-2 for p in j.data.polygons))
    return j
OLDB=[['hips',-1,0,0.95,-0.2,0,1.18,-0.2],['chest',0,0,1.18,-0.2,0,1.34,-0.1],['head',1,0,1.36,-0.08,0,1.6,-0.05],
 ['armR',1,-0.19,1.3,-0.17,-0.16,1.03,-0.02],['foreR',3,-0.16,1.03,-0.02,-0.12,1.02,0.25],['handR',4,-0.12,1.02,0.25,-0.1,1.02,0.33],
 ['armL',1,0.2,1.3,-0.19,0.3,1.04,-0.2],['foreL',6,0.3,1.04,-0.2,0.4,0.86,-0.28],['handL',7,0.4,0.86,-0.28,0.42,0.7,-0.3],
 ['legL',0,0.1,0.9,-0.3,0.1,0.1,-0.42],['legR',0,-0.08,0.9,-0.12,-0.08,0.1,-0.1]]
def set_id(o,k):
    ca=o.data.color_attributes.new('Col','FLOAT_COLOR','POINT') if 'Col' not in o.data.color_attributes else o.data.color_attributes['Col']
    for d in ca.data:d.color=(k/32.0,0,0,1)
# ------------------------------------------------------------------ мобы
def wraith():
    ms=imp(f('enemie_for_horror_game.glb'));o=join(ms,'V8W__body')
    co=verts(o);mn,mx=co.min(0),co.max(0);H=2.05;s=H/(mx[2]-mn[2])
    o.data.transform(Matrix.Scale(s,4)@Matrix.Translation((-(mn[0]+mx[0])/2,-co[:,1].mean(),-mn[2])));o.data.transform(Matrix.Translation((0,0,0.12)));o.data.update()
    im=[i for i in bpy.data.images if i.users][0];im.name='n8w_rag'
    m=bpy.data.materials.new('n8w_rag');m.use_nodes=True;nt=m.node_tree;P=nt.nodes['Principled BSDF'];t=nt.nodes.new('ShaderNodeTexImage');t.image=im
    nt.links.new(t.outputs['Color'],P.inputs['Base Color']);P.inputs['Roughness'].default_value=0.85;m.use_backface_culling=False
    o.data.materials.clear();o.data.materials.append(m)
    co=verts(o);g=np.stack([co[:,0],co[:,2],-co[:,1]],1);Hh=g[:,1].max();zc=float(np.median(g[:,2]))
    B=[['body',-1,0,0.3*Hh,zc,0,0.62*Hh,zc],['chest',0,0,0.62*Hh,zc,0,0.8*Hh,zc],['head',1,0,0.8*Hh,zc,0,Hh,zc+0.05]]
    for sd,nm in((1,'clawL'),(-1,'clawR')):
        sel=g[(g[:,0]*sd)>0.55*np.abs(g[:,0]).max()];c=sel.mean(0) if len(sel) else np.array([sd*0.4,0.75*Hh,zc+0.2])
        B.append([nm,1,sd*0.12,0.76*Hh,zc,float(c[0]),float(c[1]),float(c[2])])
    B.append(['skirt',0,0,0.3*Hh,zc,0,0.0,zc-0.05])
    set_id(o,0);print('WRAITH H',round(Hh,3),'bones',[[b[0]]+[round(x,2) for x in b[2:]] for b in B])
    return o,B
def smile():
    """Заглушка «Улыбаки» (smily_horror_monster.glb не прислан): худой гигант 2.5 м, руки до колен, голова с огромной светящейся улыбкой."""
    skin=L.mat('n8s_skin',(0.8,0.76,0.7),0.72,tex='skin_c',ntex='skin_n',dens=2.0)
    dark=L.mat('n8s_dark',(0.03,0.02,0.02),0.9);teeth=L.mat('n8s_teeth',(0.95,0.9,0.78),0.35)
    glow=L.mat('n8s_glow',(0.9,0.12,0.05),0.5,emis=(1.0,0.16,0.05),es=4.0);eye=L.mat('n8s_eye',(1,1,0.9),0.3,emis=(1,0.95,0.7),es=6.0)
    V=[(0,1.15,0),(0,1.5,0.02),(0,1.85,0.06),(0,2.08,0.1),
       (0.15,1.1,0),(0.18,0.6,0.09),(0.16,0.1,-0.02),(0.16,0.03,0.17),
       (-0.15,1.1,0),(-0.18,0.6,0.09),(-0.16,0.1,-0.02),(-0.16,0.03,0.17),
       (0.27,1.95,0.04),(0.46,1.42,0.06),(0.53,0.88,0.14),(0.56,0.62,0.22),
       (-0.27,1.95,0.04),(-0.46,1.42,0.06),(-0.53,0.88,0.14),(-0.56,0.62,0.22)]
    E=[(0,1),(1,2),(2,3),(0,4),(4,5),(5,6),(6,7),(0,8),(8,9),(9,10),(10,11),(2,12),(12,13),(13,14),(14,15),(2,16),(16,17),(17,18),(18,19)]
    R=[(0.17,0.13),(0.15,0.11),(0.19,0.13),(0.06,0.06),(0.08,0.08),(0.055,0.055),(0.045,0.045),(0.04,0.03),(0.08,0.08),(0.055,0.055),(0.045,0.045),(0.04,0.03),
       (0.06,0.06),(0.045,0.045),(0.035,0.035),(0.04,0.025),(0.06,0.06),(0.045,0.045),(0.035,0.035),(0.04,0.025)]
    body=L.skin_body('V8S__body__b',V,E,R,skin,sub=1,disp=lambda p,n:0.012*L.fbm3(p,7.0)-0.01*max(0,math.sin(p[1]*38))*(1 if 1.4<p[1]<1.9 else 0))
    parts=[body]
    for sd in(1,-1):   # когти: по 3 длинных
        for k in range(3):
            a=(k-1)*0.05;base=Vector((sd*(0.56+a*0.4),0.6,0.22+a));tip=Vector((sd*(0.58+a*0.9),0.3,0.34+a*1.5))
            parts.append(L.mk('V8S__body__claw',L.tube([base,(base+tip)/2+Vector((0,0,0.03)),tip],lambda t:0.018*(1-t)+0.002,n=5),dark))
    hc=Vector((0,2.33,0.14))
    head=L.mk('V8S__body__head',L.lathe([(0.001,-0.3),(0.16,-0.27),(0.24,-0.15),(0.27,0.0),(0.25,0.14),(0.18,0.25),(0.001,0.3)],18,c=tuple(hc)),skin,sub=1)
    parts.append(head)
    # улыбка: светящаяся щель-полумесяц по передней поверхности и два ряда зубов
    arc=[];N=22
    for i in range(N+1):
        a=-1.15+2.3*i/N;y=hc.y-0.08+0.07*(a*a);arc.append(Vector((0.265*math.sin(a),y,hc.z+0.265*math.cos(a)*0.98)))
    rings=[[tuple(p+Vector((0,-0.035*(1-((i/N*2-1)**2)),0))),tuple(p+Vector((0,0.03*(1-((i/N*2-1)**2))*0.6,0)))] for i,p in enumerate(arc)]
    vs=[];fs=[];us=[]
    for i,(a,b) in enumerate(rings):vs+=[a,b]
    for i in range(N):fs.append((2*i,2*i+2,2*i+3,2*i+1));us.append([(0,0),(1,0),(1,1),(0,1)])
    parts.append(L.mk('V8S__body__grin',(vs,fs,us),glow,smooth=False,recalc=False))
    for i in range(1,N,1):
        p=arc[i];w=1-((i/N*2-1)**2)
        for up in(1,-1):
            c=p+Vector((0,up*(0.026*w*(0.6 if up>0 else 1)),0.004))
            parts.append(L.mk('V8S__body__tooth',L.box(0.009,0.012+0.01*w,0.006,tuple(c)),teeth,shade_flat=True))
    for sd in(1,-1):
        parts.append(L.mk('V8S__body__socket',L.lathe([(0.001,-0.05),(0.05,-0.03),(0.055,0.0),(0.05,0.03),(0.001,0.05)],10,c=(sd*0.1,hc.y+0.07,hc.z+0.235)),dark))
        parts.append(L.mk('V8S__body__eye',L.lathe([(0.001,-0.012),(0.012,0.0),(0.001,0.012)],8,c=(sd*0.1,hc.y+0.07,hc.z+0.28)),eye))
    for o in parts:set_id(o,0)
    for o in parts:
        if '__head' in o.name or '__grin' in o.name or '__tooth' in o.name or '__socket' in o.name or '__eye' in o.name:set_id(o,3)
    B=[['hips',-1,0,1.1,0,0,1.5,0.02],['chest',0,0,1.5,0.02,0,2.05,0.08],['head',1,0,2.08,0.1,0,2.6,0.14],
       ['armL',1,0.27,1.95,0.04,0.46,1.42,0.06],['foreL',3,0.46,1.42,0.06,0.53,0.88,0.14],['handL',4,0.53,0.88,0.14,0.58,0.3,0.34],
       ['armR',1,-0.27,1.95,0.04,-0.46,1.42,0.06],['foreR',6,-0.46,1.42,0.06,-0.53,0.88,0.14],['handR',7,-0.53,0.88,0.14,-0.58,0.3,0.34],
       ['thighL',0,0.15,1.1,0,0.18,0.6,0.09],['shinL',9,0.18,0.6,0.09,0.16,0.03,0.17],['thighR',0,-0.15,1.1,0,-0.18,0.6,0.09],['shinR',11,-0.18,0.6,0.09,-0.16,0.03,0.17]]
    return parts,B
def dog():
    """Заглушка «Пса» (dog_monster.glb не прислан): облезлый четвероногий падальщик ~1.9 м, рёбра наружу, челюсть отдельно."""
    flesh=L.mat('n8d_flesh',(0.36,0.17,0.14),0.7,tex='leather_c',ntex='leather_n',dens=2.5)
    bone=L.mat('n8d_bone',(0.86,0.8,0.68),0.5,tex='bone_c',ntex='bone_n',dens=3)
    eye=L.mat('n8d_eye',(1,0.6,0.1),0.3,emis=(1,0.45,0.05),es=7.0);gum=L.mat('n8d_gum',(0.35,0.03,0.04),0.4)
    V=[(0,0.9,-0.6),(0,0.84,-0.95),(0,0.72,-1.35),(0,0.96,-0.15),(0,1.02,0.3),(0,1.15,0.6),(0,1.2,0.78),
       (0.17,0.86,-0.6),(0.22,0.55,-0.78),(0.19,0.25,-0.62),(0.2,0.03,-0.66),
       (-0.17,0.86,-0.6),(-0.22,0.55,-0.78),(-0.19,0.25,-0.62),(-0.2,0.03,-0.66),
       (0.2,0.92,0.3),(0.23,0.5,0.36),(0.2,0.03,0.42),(-0.2,0.92,0.3),(-0.23,0.5,0.36),(-0.2,0.03,0.42)]
    E=[(0,1),(1,2),(0,3),(3,4),(4,5),(5,6),(0,7),(7,8),(8,9),(9,10),(0,11),(11,12),(12,13),(13,14),(4,15),(15,16),(16,17),(4,18),(18,19),(19,20)]
    R=[(0.2,0.17),(0.08,0.07),(0.03,0.03),(0.17,0.15),(0.23,0.21),(0.12,0.11),(0.1,0.1),(0.11,0.11),(0.07,0.07),(0.045,0.045),(0.05,0.04),(0.11,0.11),(0.07,0.07),(0.045,0.045),(0.05,0.04),(0.1,0.1),(0.055,0.055),(0.05,0.04),(0.1,0.1),(0.055,0.055),(0.05,0.04)]
    body=L.skin_body('V8D__body__b',V,E,R,flesh,sub=1,disp=lambda p,n:0.02*L.fbm3(p,5.0));parts=[body]
    skull=L.skin_body('V8D__body__skull',[(0,1.22,0.74),(0,1.2,0.98),(0,1.14,1.22)],[(0,1),(1,2)],[(0.15,0.14),(0.12,0.11),(0.06,0.05)],bone,sub=1);parts.append(skull)
    jaw=L.skin_body('V8D__body__jaw',[(0,1.06,0.8),(0,1.03,1.02),(0,1.02,1.2)],[(0,1),(1,2)],[(0.1,0.05),(0.08,0.04),(0.04,0.025)],gum,sub=1);parts.append(jaw)
    for i in range(7):   # зубы верх/низ
        z=0.9+i*0.045
        for sd in(1,-1):
            parts.append(L.mk('V8D__body__toothU',L.lathe([(0.012,0),(0.001,-0.06)],5,c=(sd*(0.075-i*0.006),1.12-i*0.006,z)),bone))
            t=L.mk('V8D__body__toothL',L.lathe([(0.01,0),(0.001,0.05)],5,c=(sd*(0.06-i*0.005),1.06,z)),bone);set_id(t,6);parts.append(t)
    for i in range(6):   # рёбра наружу
        z=0.25-i*0.12;rr=0.25-abs(i-2)*0.015
        pts=[Vector((math.sin(a)*rr,0.98+math.cos(a)*rr*0.95,z)) for a in np.linspace(-2.2,2.2,13)]
        parts.append(L.mk('V8D__body__rib',L.tube(pts,0.017,n=5),bone))
    for i in range(8):   # шипы по хребту
        z=0.55-i*0.16;y=1.08+0.12*math.cos((z-0.1)*2.0)
        parts.append(L.mk('V8D__body__spike',L.lathe([(0.03,0),(0.001,0.14+0.05*(i%2))],6,c=(0,y,z),f=None),bone))
    for sd in(1,-1):parts.append(L.mk('V8D__body__eye',L.lathe([(0.001,-0.022),(0.022,0.0),(0.001,0.022)],8,c=(sd*0.085,1.27,0.93)),eye))
    for o in parts:
        if o.get('_id') is None:
            nm=o.name;k=6 if '__jaw' in nm or '__toothL' in nm else 5 if ('__skull' in nm or '__eye' in nm or '__toothU' in nm) else 0
            set_id(o,k)
    B=[['hips',-1,0,0.9,-0.6,0,0.96,-0.15],['spine',0,0,0.96,-0.15,0,1.02,0.3],['chest',1,0,1.02,0.3,0,1.15,0.6],['neck',2,0,1.15,0.6,0,1.2,0.78],
       ['head',3,0,1.2,0.78,0,1.14,1.22],['jaw',4,0,1.06,0.8,0,1.02,1.2],['tail',0,0,0.84,-0.95,0,0.72,-1.35],
       ['hlL',0,0.17,0.86,-0.6,0.22,0.55,-0.78],['hlL2',7,0.22,0.55,-0.78,0.2,0.03,-0.66],['hlR',0,-0.17,0.86,-0.6,-0.22,0.55,-0.78],['hlR2',9,-0.22,0.55,-0.78,-0.2,0.03,-0.66],
       ['flL',2,0.2,0.92,0.3,0.23,0.5,0.36],['flL2',11,0.23,0.5,0.36,0.2,0.03,0.42],['flR',2,-0.2,0.92,0.3,-0.23,0.5,0.36],['flR2',13,-0.23,0.5,0.36,-0.2,0.03,0.42]]
    return parts,B
# Присланные модели (Sketchfab, риг в glTF): импорт без «угадывания» bind-позы, меш в позе покоя (evaluated),
# упрощение, перенос весов исходных костей на упрощённый скелет игры (2 кости на вершину -> вершинный цвет: id1/32, id2/32, w1).
DOG_B=[['hips',-1,(-0.12,1.10,-0.70),(-0.03,1.11,-0.17)],['spine',0,None,(-0.05,1.06,0.40)],['chest',1,None,(-0.10,1.07,0.63)],['neck',2,None,(-0.13,1.20,0.78)],
 ['head',3,(-0.13,1.20,0.78),(-0.11,1.12,0.95)],['jaw',4,(-0.11,1.04,0.76),(-0.10,0.98,0.93)],['tail',0,(-0.12,1.0,-0.75),(-0.12,0.75,-0.95)],
 ['hlL',0,(0.068,1.019,-0.641),(0.318,0.686,-0.355)],['hlL2',7,None,(0.215,0.006,-0.617)],['hlR',0,(-0.263,0.997,-0.54),(-0.136,0.54,-0.368)],['hlR2',9,None,(-0.274,0.006,-0.696)],
 ['flL',2,(0.15,1.131,0.277),(0.325,0.417,0.186)],['flL2',11,None,(0.28,0.005,0.645)],['flR',2,(-0.176,1.111,0.273),(-0.386,0.414,0.172)],['flR2',13,None,(-0.429,0.045,0.668)]]
DOG_G={'hips':['DEF-spine.004','DEF-spine.005','DEF-spine.006','DEF-pelvis.L','DEF-pelvis.R'],'tail':['DEF-spine','DEF-spine.001','DEF-spine.002','DEF-spine.003'],
 'spine':['DEF-spine.007','DEF-spine.008'],'chest':['DEF-spine.009','DEF-spine.010','DEF-breast.L','DEF-breast.R'],'neck':['DEF-spine.011','head.001','head.002'],
 'head':['head','head.005','head.006'],'jaw':['head.003','head.004']}
for sd in 'LR':
    DOG_G['hl'+sd]=['DEF-thigh.'+sd,'DEF-thigh.%s.001'%sd];DOG_G['hl%s2'%sd]=['DEF-shin.'+sd,'DEF-shin.%s.001'%sd,'DEF-foot.'+sd,'DEF-foot.%s.001'%sd,'DEF-toe.'+sd]
    DOG_G['fl'+sd]=['DEF-shoulder.'+sd,'DEF-front_thigh.'+sd,'DEF-front_thigh.%s.001'%sd];DOG_G['fl%s2'%sd]=['DEF-front_shin.'+sd,'DEF-front_shin.%s.001'%sd,'DEF-front_foot.'+sd,'DEF-front_foot.%s.001'%sd,'DEF-front_toe.'+sd]
SM_B=[['hips',-1,(-70.249,61.598,-32.376),(-73.489,59.058,-15.476)],['spine',0,None,(-77.985,65.702,7.972)],['chest',1,None,(-81.442,71.456,26.001)],['neck',2,None,(-83.609,75.292,37.302)],
 ['head',3,None,(-84.0,77.5,58.0)],['jaw',4,(-81.53,70.959,45.146),(-78.787,64.887,51.488)],
 ['armL',2,(-57.72,70.18,29.112),(-49.316,49.77,25.614)],['foreL',6,None,(-47.786,10.274,41.55)],['handL',7,None,(-46.5,1.5,47)],
 ['armR',2,(-102.392,63.336,17.682),(-116.992,46.85,13.88)],['foreR',9,None,(-127.555,11.353,34.966)],['handR',10,None,(-129,2,40)],
 ['thighL',0,(-57.138,58.358,-23.309),(-33.263,34.388,6.516)],['shinL',12,None,(-49.042,16.672,-42.764)],['footL',13,None,(-36.726,1.539,-28.844)],
 ['thighR',0,(-85.662,64.856,-28.325),(-113.323,35.245,-8.522)],['shinR',15,None,(-81.591,15.701,-48.553)],['footR',16,None,(-99.305,1.722,-40.475)]]
SM_G={'hips':['spinebase','Hip.L','Hip.R'],'spine':['belly'],'chest':['chest','shoulder.L','shoulder.R'],'neck':['neck'],'head':['head','frontface'],'jaw':['jaw']}
for sd in 'LR':
    SM_G['arm'+sd]=['Arm.'+sd];SM_G['fore'+sd]=['Forearm.'+sd];SM_G['hand'+sd]=['Hand.'+sd];SM_G['thigh'+sd]=['leg.'+sd];SM_G['shin'+sd]=['sheen.'+sd];SM_G['foot'+sd]=['foot.'+sd,'toes.'+sd]
def gbase(n):
    b=n.rsplit('_',1)
    return b[0] if len(b)==2 and b[1].isdigit() else n
def seg_d(p,a,b):
    ab=b-a;t=np.clip(((p-a)@ab)/max(1e-9,ab@ab),0,1);return np.linalg.norm(p-(a+np.outer(t,ab)),axis=1)
def rig_mob(fn,pre,H,BD,GM,tris,mat_pre):
    n0=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=f(fn),guess_original_bind_pose=False);new=[o for o in bpy.data.objects if o not in n0]
    arm=[o for o in new if o.type=='ARMATURE'][0]
    if arm.animation_data:arm.animation_data.action=None
    for pb in arm.pose.bones:pb.matrix_basis.identity()
    bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
    ms=[o for o in new if o.type=='MESH' and len(o.data.vertices)>=100]
    for o in ms:   # координаты из evaluated (поза покоя), группы вершин сохраняются
        e=o.evaluated_get(dg);m=e.to_mesh();P=[tuple(e.matrix_world@v.co) for v in m.vertices];e.to_mesh_clear()
        if o.data.users>1:o.data=o.data.copy()
        for v,p in zip(o.data.vertices,P):v.co=p
        for md in list(o.modifiers):o.modifiers.remove(md)
        mw=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4);o.data.update()
    bone_par={b.name:(b.parent.name if b.parent else None) for b in arm.data.bones}
    for o in [o for o in new if o not in ms]:bpy.data.objects.remove(o)
    for o in ms:
        if len(o.vertex_groups)==0:decimate(o,400)
    allc=np.concatenate([verts(o) for o in ms]);mn,mx=allc.min(0),allc.max(0);s=H/(mx[2]-mn[2])
    M=Matrix.Scale(s,4)@Matrix.Translation((-(mn[0]+mx[0])/2,-(mn[1]+mx[1])/2,-mn[2]))
    for o in ms:o.data.transform(M);o.data.update()
    gpt=lambda g:M@Vector((g[0],-g[2],g[1]))
    B=[];pts=[]
    for i,(nm,p,h,t) in enumerate(BD):
        hb=gpt(h) if h else pts[p][1];tb=gpt(t);pts.append((hb,tb))
        B.append([nm,p]+[round(x,4) for x in(hb.x,hb.z,-hb.y,tb.x,tb.z,-tb.y)])
    names=[b[0] for b in BD];g2b={}
    for bn,gl in GM.items():
        for g in gl:g2b[g]=names.index(bn)
    SA=np.array([[p[0].x,p[0].y,p[0].z] for p in pts]);SB=np.array([[p[1].x,p[1].y,p[1].z] for p in pts])
    def nearest(P):
        D=np.stack([seg_d(P,SA[q],SB[q]) for q in range(len(pts))],1);return D
    prefix_mats(ms,mat_pre)
    o=join(ms,pre+'__body__m');decimate(o,tris)
    co=verts(o);nv=len(co);W=np.zeros((nv,len(BD)))
    gmap={}
    for vg in o.vertex_groups:
        b=gbase(vg.name);k=None;cur=vg.name
        while cur is not None:
            if gbase(cur) in g2b:k=g2b[gbase(cur)];break
            cur=bone_par.get(cur)
        gmap[vg.index]=k
    unk={}
    for v in o.data.vertices:
        for g in v.groups:
            k=gmap.get(g.group)
            if k is None:unk.setdefault(g.group,[]).append((v.index,g.weight))
            elif g.weight>0:W[v.index,k]+=g.weight
    for gi,lst in unk.items():   # кость не найдена -> ближайший сегмент к центру группы
        idx=np.array([a for a,_ in lst]);w=np.array([b for _,b in lst])
        if w.sum()<=0:continue
        c=(co[idx]*w[:,None]).sum(0)/w.sum();k=int(np.argmin(nearest(c[None])[0]));W[idx,k]+=w
    empty=W.sum(1)<=1e-6
    if empty.any():   # без групп (глаза и т.п.) -> ближайший сегмент
        D=nearest(co[empty]);W[np.where(empty)[0],D.argmin(1)]=1
    o2=np.argsort(-W,1)[:,:2];w1=W[np.arange(nv),o2[:,0]];w2=W[np.arange(nv),o2[:,1]];wt=np.where(w1+w2>0,w1/(w1+w2+1e-9),1)
    ca=o.data.color_attributes.new('Col','FLOAT_COLOR','POINT')
    col=np.zeros((nv,4));col[:,0]=(o2[:,0]+1)/32.0;col[:,1]=np.where(w2>1e-4,(o2[:,1]+1)/32.0,0);col[:,2]=wt;col[:,3]=1
    ca.data.foreach_set('color',col.ravel().astype(np.float32))
    o.data.color_attributes.active_color=ca
    while o.vertex_groups:o.vertex_groups.remove(o.vertex_groups[0])
    co=verts(o);print(pre,'tris',sum(len(p.vertices)-2 for p in o.data.polygons),'bbox game',[round(co[:,0].min(),3),round(co[:,2].min(),3),round(-co[:,1].max(),3)],[round(co[:,0].max(),3),round(co[:,2].max(),3),round(-co[:,1].min(),3)])
    print(pre,'bone usage',dict(zip(names,np.bincount(o2[:,0],minlength=len(BD)).tolist())))
    return o,B
# ------------------------------------------------------------------ облако галактики (need_some_space.glb, точки)
def space_data(n=36000):
    import struct
    fp=open(f('need_some_space.glb'),'rb');fp.read(12);l,_=struct.unpack('<II',fp.read(8));j=json.loads(fp.read(l));l2,_=struct.unpack('<II',fp.read(8));b=fp.read(l2)
    pr=j['meshes'][0]['primitives'][0];A=j['accessors']
    def get(i,nc):
        a=A[i];bv=j['bufferViews'][a['bufferView']];o=bv.get('byteOffset',0)+a.get('byteOffset',0);return np.frombuffer(b,dtype=np.float32,count=a['count']*nc,offset=o).reshape(-1,nc)
    P=get(pr['attributes']['POSITION'],3).astype(np.float64);C=get(pr['attributes']['COLOR_0'],4)
    P=P-np.median(P,0);r=np.abs(P).max();rng=np.random.default_rng(7);idx=rng.choice(len(P),n,replace=False);P=P[idx];C=C[idx]
    q=np.clip(np.round(P/r*32767),-32767,32767).astype('<i2');c=np.clip(np.round(C[:,:3]*255),0,255).astype(np.uint8)
    return dict(n=n,p=base64.b64encode(q.tobytes()).decode(),c=base64.b64encode(c.tobytes()).decode())
# ------------------------------------------------------------------ v0.19: HP-бары (SAO / Demon Slayer) и онигири
SRC19=os.path.join(os.environ.get('NITEN_SRC','/data/src'),'v19')
def f19(n):return os.path.join(SRC19,n)
def imp19(fn):
    n0=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=f19(fn));new=[o for o in bpy.data.objects if o not in n0]
    ms=[o for o in new if o.type=='MESH' and len(o.data.polygons)>0]
    for o in ms:bake_xf(o)
    for o in [o for o in new if o not in ms]:bpy.data.objects.remove(o)
    return ms
def flat_bar(objs,width,x_center=None):
    """Плоский бар в плоскости XZ Blender (= XY игры, лицом к +Z игры): глубина обнуляется, ширина -> width, центр по X, низ/верх по центру Z."""
    P=np.concatenate([verts(o) for o in objs]);mn,mx=P.min(0),P.max(0);s=width/(mx[0]-mn[0]);cx=(mn[0]+mx[0])/2 if x_center is None else x_center;cz=(mn[2]+mx[2])/2
    for o in objs:
        for v in o.data.vertices:v.co=Vector(((v.co.x-cx)*s,-(v.co.y-mn[1])*s*0.0,(v.co.z-cz)*s))
        o.data.update()
    return s
def hud19():
    out=[]
    if os.path.exists(f19('sao_health_bar.glb')):
        ms=imp19('sao_health_bar.glb');flat_bar(ms,1.0)
        for o in ms:
            m=matname(o);o.name='V8H__saoB__m' if 'Outer' in m else 'V8H__saoI__m'
        prefix_mats(ms,'n9h_');out+=ms
    if os.path.exists(f19('demon_slayer_ui_concept_art.glb')):
        ms=imp19('demon_slayer_ui_concept_art.glb')
        keep=[];
        for o in ms:
            m=matname(o);c=verts(o).mean(0)
            if c[2]>2800 or m in('hero_ui','Hero','hero_mask'):bpy.data.objects.remove(o);continue
            keep.append(o)
        ch=[o for o in keep if 'Chain' in matname(o)]
        def relink(o,nu=8,nv=4):   # звено цепи -> лёгкий эллиптический тор по PCA исходного звена
            P=verts(o);c=P.mean(0);U,S,Vt=np.linalg.svd(P-c,full_matrices=False);a1,a2,nn=Vt[0],Vt[1],Vt[2]
            e1=np.abs((P-c)@a1).max();e2=np.abs((P-c)@a2).max();t=np.abs((P-c)@nn).max();r=t;R1=max(e1-r,r*1.2);R2=max(e2-r,r*1.2)
            bm=bmesh.new();V=[]
            for i in range(nu):
                u=2*math.pi*i/nu;cu,su=math.cos(u),math.sin(u);q=c+a1*R1*cu+a2*R2*su;rad=a1*cu+a2*su
                V.append([bm.verts.new(tuple(q+(rad*math.cos(2*math.pi*k/nv)+nn*math.sin(2*math.pi*k/nv))*r)) for k in range(nv)])
            for i in range(nu):
                for k in range(nv):bm.faces.new((V[i][k],V[(i+1)%nu][k],V[(i+1)%nu][(k+1)%nv],V[i][(k+1)%nv]))
            bm.to_mesh(o.data);bm.free();o.data.update()
        for o in ch:relink(o)
        P=np.concatenate([verts(o) for o in keep]);mn,mx=P.min(0),P.max(0)
        # центр — по полосе здоровья (Demon_Health), ширина всей группы -> 2.2 м
        hp=[o for o in keep if 'Health' in matname(o)][0];hc=verts(hp);s=2.2/(mx[0]-mn[0]);cx=(hc[:,0].min()+hc[:,0].max())/2;cz=(hc[:,2].min()+hc[:,2].max())/2
        ymid=np.median(P[:,1])
        for o in keep:
            m=matname(o);dz=0.0 if 'Chain' in m else 0.0
            for v in o.data.vertices:v.co=Vector(((v.co.x-cx)*s,-(v.co.y-ymid)*s*(1.0 if 'Chain' in m else 0.0),(v.co.z-cz)*s))
            o.data.update()
        groups={'dsBack':[o for o in keep if 'back' in matname(o).lower()],'dsHp':[hp],'dsIco':[o for o in keep if matname(o) in('Demon','EYES')],'dsChain':ch}
        print('DS tris',{k:sum(len(p.vertices)-2 for o in v for p in o.data.polygons) for k,v in groups.items()})
        for k,objs in groups.items():
            prefix_mats(objs,'n9h_')
            if k=='dsIco':
                for o in objs:o.name='V8H__dsIco__'+matname(o)
                out+=objs
            else:out.append(join(objs,'V8H__%s__m'%k))
    if os.path.exists(f19('onigiri_1.glb')):
        ms=imp19('onigiri_1.glb');o=join(ms,'V8G__oni__m');decimate(o,3000)
        co=verts(o);mn,mx=co.min(0),co.max(0);s=0.095/(mx[0]-mn[0])
        o.data.transform(Matrix.Scale(s,4)@Matrix.Translation((-(mn+mx)/2)));o.data.update();prefix_mats([o],'n9g_');shrink_imgs('n9g_',512);out.append(o)
        co=verts(o);print('ONIGIRI bbox',co.min(0).round(3),co.max(0).round(3))
    return out
# ------------------------------------------------------------------ сборка
def build_all():
    clean();locs=location();nav=navbake()
    k=0
    byk={}
    for o in locs:byk.setdefault((o['part'],matname(o)),[]).append(o)
    for (part,m),objs in byk.items():
        jj=join(objs,'j');jj.name='LV__%s__%d'%(part,k);k+=1
    kinfo=katanas();old=oldman();W,WB=wraith()
    mobs={'wraith':WB}
    if os.path.exists(f('smily_horror_monster.glb')):_,SB=rig_mob('smily_horror_monster.glb','V8S',1.5,SM_B,SM_G,9000,'n8s_')
    else:_,SB=smile()
    if os.path.exists(f('dog_monster.glb')):_,DB=rig_mob('dog_monster.glb','V8D',1.3,DOG_B,DOG_G,10000,'n8d_')
    else:_,DB=dog()
    mobs['smile']=SB;mobs['dog']=DB
    hud19()
    shrink_imgs('n8_',1024)
    for im in bpy.data.images:
        if im.users and im.packed_file is None and im.size[0]:
            try:im.pack()
            except Exception:pass
    bpy.ops.object.select_all(action='DESELECT')
    fn=os.path.join(HERE,'..','out','niten_v18.glb')
    bpy.ops.export_scene.gltf(filepath=fn,export_format='GLB',export_image_format='WEBP',export_image_quality=82,export_yup=True,export_apply=True,
        export_tangents=False,export_morph=False,export_skins=False,export_animations=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    print('V18 GLB',os.path.getsize(fn))
    D=dict(nav=nav,spawn=list(SPAWN),kat={k:v['tip'] for k,v in kinfo.items()},kblade=KAT_BLADE,old=OLDB,mob=mobs,space=space_data())
    open(os.path.join(ROOT,'game','src','gQd.js'),'w').write('// v0.18 (генерирует blender/ext/v18.py): многоуровневая nav PS1-локации, кости мобов и Старца, облако галактики.\nconst V8D='+json.dumps(D,separators=(',',':'))+';\n')
    print('gQd.js ok')
if __name__=='__main__':
    stage=sys.argv[-1]
    if stage not in('nav','old','kat','mobs','hud'):build_all()
    if stage=='hud':
        clean();hud19()
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'hud.glb'),export_format='GLB',export_image_format='WEBP',export_yup=True,export_apply=True,export_skins=False,export_animations=False)
    if stage=='mobs':
        clean();_,SB=rig_mob('smily_horror_monster.glb','V8S',1.5,SM_B,SM_G,9000,'n8s_');_,DB=rig_mob('dog_monster.glb','V8D',1.3,DOG_B,DOG_G,10000,'n8d_');shrink_imgs('n8_',1024)
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'mobs.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=82,export_yup=True,export_apply=True,export_skins=False,export_animations=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
        json.dump({'smile':SB,'dog':DB},open(os.path.join(OUT,'mobs.json'),'w'))
    if stage=='nav':
        clean();location();nav=navbake();json.dump(nav,open(os.path.join(OUT,'nav.json'),'w'))
    if stage=='old':
        clean();oldman()
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'old.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=80,export_yup=True)
    if stage=='kat':
        clean();info=katanas();shrink_imgs('n8k_',1024)
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'kat.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=82,export_yup=True)
