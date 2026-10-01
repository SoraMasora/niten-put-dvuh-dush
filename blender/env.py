"""Окружение v0.5: деревня Ивате (минка, заборы, пугала, телеги, колодец), бамбуковый лес (бамбук, листья, камни, трава, хокора),
храмовый двор (киноварные столбы с кронштейнами, стены цуйдзи с черепицей, фасад хондо, колокольня сёро, жаровни кагариби), земля.
Все части: EV__<part>__<detail>, корневые пустышки EV__J_<part>. Координаты — игровые (Y вверх)."""
import math,random,bpy,bmesh
from lib import *
P='EV';M={}
def M_env():
    M.update(
     wood=mat('ev_wood',(0.62,0.52,0.42),0.8,tex='wood_c',ntex='wood_n',nstr=0.8,dens=1.2),
     dark=mat('ev_darkwood',(0.3,0.24,0.2),0.75,tex='wood_c',ntex='wood_n',nstr=0.8,dens=1.2),
     char=mat('ev_char',(0.085,0.07,0.065),0.92,tex='wood_c',ntex='wood_n',nstr=1.6,dens=1.2),
     ember=mat('ev_ember',(0.12,0.04,0.02),0.9,tex='stone_c',emis=(1.0,0.28,0.05),es=2.2,dens=2),
     thatch=mat('ev_thatch',(0.7,0.6,0.47),0.95,tex='straw_c',ntex='straw_n',nstr=1.6,dens=1.6),
     thatchb=mat('ev_thatch_burnt',(0.2,0.16,0.13),0.95,tex='straw_c',ntex='straw_n',nstr=1.6,dens=1.6,double=True),
     shoji=mat('ev_shoji',(1,0.92,0.8),0.8,tex='paper_c',emis=(1.0,0.6,0.28),es=1.5,dens=2),
     shojid=mat('ev_shoji_dark',(0.55,0.5,0.42),0.85,tex='paper_c',dens=2,double=True),
     mud=mat('ev_mudwall',(0.62,0.52,0.4),0.95,tex='plaster_c',ntex='plaster_n',nstr=1.5,dens=0.6),
     mudb=mat('ev_mudwall_burnt',(0.16,0.13,0.11),0.95,tex='plaster_c',ntex='plaster_n',nstr=1.5,dens=0.6),
     stone=mat('ev_stone',(0.55,0.55,0.52),0.9,tex='stone_c',ntex='stone_n',nstr=1.6,dens=1.0),
     mossrock=mat('ev_mossrock',(0.24,0.27,0.21),0.92,tex='stone_c',ntex='stone_n',nstr=2.0,dens=0.8),
     plaster=mat('ev_plaster',(1.0,0.97,0.92),0.9,tex='plaster_c',ntex='plaster_n',dens=0.5),
     white=mat('ev_plaster_white',(1.25,1.25,1.2),0.9,tex='plaster_c',dens=0.5),
     kawara=mat('ev_kawara',(0.07,0.075,0.085),0.5,0.1,ntex='metal_n',nstr=0.3,dens=2),
     red=mat('ev_vermilion',(0.55,0.1,0.04),0.6,tex='wood_c',ntex='wood_n',nstr=0.2,coat=0.12,dens=0.8),
     black=mat('ev_blacklacquer',(0.03,0.03,0.03),0.4,ntex='wood_n',nstr=0.4,dens=1.0),
     brass=mat('ev_brass',(0.75,0.55,0.25),0.35,1.0,ntex='metal_n',nstr=0.4,dens=6),
     iron=mat('ev_iron',(0.07,0.07,0.075),0.55,0.85,ntex='metal_n',nstr=0.8,dens=4),
     bamboo=mat('ev_bamboo',(1,1,1),0.5,tex='bamboo_c',ntex='bamboo_n',nstr=0.6,dens=3),
     bamboob=mat('ev_bamboo_dry',(0.75,0.62,0.4),0.6,tex='bamboo_c',ntex='bamboo_n',nstr=0.6,dens=3),
     leaf=mat('ev_leaf',(0.17,0.3,0.08),0.6,double=True,dens=4),
     grass=mat('ev_grass',(0.24,0.32,0.11),0.85,double=True,dens=4),
     rope=mat('ev_rope',(0.5,0.42,0.3),0.95,tex='straw_c',ntex='straw_n',dens=30),
     rag=mat('ev_rag',(0.35,0.3,0.26),0.95,tex='cloth_c',ntex='cloth_n',dens=8,double=True),
     paper=mat('ev_paper',(1,1,1),0.85,tex='paper_c',ntex='paper_n',dens=3,double=True),
     gash=mat('ground_ash',(0.85,0.8,0.76),0.97,tex='ground_ash_c',ntex='ground_ash_n',nstr=1.6,dens=1),
     gmoss=mat('ground_moss',(0.75,0.8,0.72),0.95,tex='ground_moss_c',ntex='ground_moss_n',nstr=1.6,dens=1),
     gpave=mat('ground_paving',(0.33,0.34,0.37),0.7,tex='paving_c',ntex='paving_n',nstr=1.8,dens=1))
    return M
def geo_raw(verts,faces,uvs=None):
    if uvs is None:uvs=[[(verts[i][0]+verts[i][2],verts[i][1]) for i in f] for f in faces]
    return verts,faces,uvs
def holes(ob,fn,thr):
    me=ob.data;bm=bmesh.new();bm.from_mesh(me)
    dead=[f for f in bm.faces if fn(gm(f.calc_center_median()))>thr]
    bmesh.ops.delete(bm,geom=dead,context='FACES');bm.to_mesh(me);bm.free()
def rrect(ax,az,n=48,p=8.0):
    out=[]
    for j in range(n):
        a=TAU*j/n;c,s=math.cos(a),math.sin(a)
        out.append((ax*math.copysign(abs(c)**(2/p),c),az*math.copysign(abs(s)**(2/p),s)))
    return out
# ------------------------------------------------------------------ деревня
def minka(name,loc,burnt=False,w=6.0,d=4.5,h=2.5,seed=1):
    rnd=random.Random(seed);root=empty(P+'__J_'+name,loc);hw,hd=w/2,d/2;y0=0.3
    wd=M['char'] if burnt else M['dark'];N=P+'__'+name+'__'
    mk(N+'found',box(hw+0.12,0.15,hd+0.12,(0,0.15,0)),M['stone'],root,bevel=0.03,sharp=40,disp=lambda p,n:0.01*fbm3(p,4,2))
    fr=[];pts=set()
    for i in range(5):x=round(-hw+i*w/4,3);pts.add((x,-hd));pts.add((x,hd))
    for i in range(4):z=round(-hd+i*d/3,3);pts.add((-hw,z));pts.add((hw,z))
    for x,z in pts:fr.append(box(0.08,h/2,0.08,(x,y0+h/2,z)))
    for zz in(hd,-hd):fr.append(box(hw+0.3,0.1,0.1,(0,y0+h,zz)));fr.append(box(hw,0.045,0.05,(0,y0+h*0.62,zz+math.copysign(0.07,zz))))
    for xx in(hw,-hw):fr.append(box(0.1,0.1,hd+0.3,(xx,y0+h,0)))
    # энгава
    fr.append(box(hw+0.1,0.04,0.3,(0,0.48,hd+0.38)))
    for i in range(5):fr.append(box(0.05,0.12,0.05,(-hw+i*w/4,0.36,hd+0.6)))
    mk(N+'frame',merge_geo(*fr),wd,root,bevel=0.012,sharp=40)
    mk(N+'walls',box(hw-0.02,h/2,hd-0.02,(0,y0+h/2,0)),M['mudb'] if burnt else M['mud'],root,disp=lambda p,n:0.008*fbm3(p,3,2))
    # нижние доски (косиита) по периметру
    bd=[]
    for zz in(hd,-hd):bd.append(box(hw,0.38,0.012,(0,y0+0.38,zz+math.copysign(0.012,zz))))
    for xx in(hw,-hw):bd.append(box(0.012,0.38,hd,(xx+math.copysign(0.012,xx),y0+0.38,0)))
    for i in range(int(w/0.18)):bd.append(box(0.012,0.38,0.008,(-hw+0.09+i*0.18,y0+0.38,hd+0.028)))
    mk(N+'boards',merge_geo(*bd),wd,root,sharp=40)
    # сёдзи: дверь и окна (решётки)
    pan=[];lat=[]
    for cx,cy,pw,ph in((-1.0,y0+0.95,1.5,1.8),(1.3,y0+1.45,0.8,0.62),(2.3,y0+1.45,0.6,0.62)):
        pan.append(box(pw/2,ph/2,0.01,(cx,cy,hd+0.02)))
        nx=max(2,int(pw/0.28));ny=max(2,int(ph/0.28))
        for i in range(nx+1):lat.append(box(0.016,ph/2,0.02,(cx-pw/2+pw*i/nx,cy,hd+0.035)))
        for j in range(ny+1):lat.append(box(pw/2,0.016,0.02,(cx,cy-ph/2+ph*j/ny,hd+0.035)))
    shp=mk(N+'shoji',merge_geo(*pan),M['shojid'] if burnt else M['shoji'],root)
    if burnt:holes(shp,lambda p:fbm3(p,2.5,3,seed),0.05)
    mk(N+'lattice',merge_geo(*lat),M['char'] if burnt else M['wood'],root,sharp=40)
    # соломенная вальмовая крыша
    ye=y0+h+0.05;H=2.4;o=0.85;rings=[]
    rings.append([(x*0.9,ye+0.1,z*0.9) for x,z in rrect(hw+o-0.35,hd+o-0.35)])
    rings.append([(x,ye-0.28,z) for x,z in rrect(hw+o,hd+o)])
    rings.append([(x,ye+0.08,z) for x,z in rrect(hw+o+0.05,hd+o+0.05)])
    for k in range(1,9):
        t=k/8;ax=(hw+o)*(1-t)+hw*0.5*t;az=(hd+o)*(1-t)+0.12*t;y=ye+0.08+H*(1-(1-t)**1.25)
        rings.append([(x,y,z) for x,z in rrect(ax,az,48,8+6*t)])
    rf=mk(N+'roof',loft(rings,True,True,True),M['thatchb'] if burnt else M['thatch'],root,disp=lambda p,n:0.07*fbm3(p,1.2,3,seed)+0.02*fbm3(p,7,2))
    yt=ye+0.08+H
    if burnt:
        holes(rf,lambda p:fbm3(p,0.9,3,seed+5)+0.25*(p.y-ye)/H,0.12)
        raf=[]
        for i in range(9):
            x=-hw*0.5+hw*i/8
            for sz in(1,-1):raf.append(tube([(x,yt-0.05,0),(x*1.15,ye-0.05,sz*(hd+o-0.2))],0.045,5))
        mk(N+'rafters',merge_geo(*raf),M['char'],root)
        mk(N+'beamfall',xform(box(0.09,0.09,1.7),chain(rotx(0.55),roty(0.3),tr(1.2,1.0,hd+0.9))),M['char'],root,bevel=0.01)
    else:
        rd=[box(hw*0.5+0.25,0.13,0.2,(0,yt+0.05,0))]
        for i in range(7):
            x=-hw*0.5+hw*i/6
            for sg in(1,-1):rd.append(xform(box(0.028,0.3,0.028),chain(rotx(sg*0.55),tr(x,yt+0.2,0))))
        mk(N+'ridge',merge_geo(*rd),M['dark'],root,sharp=40)
    return root
def fence(name,loc,burnt=False,seed=3):
    rnd=random.Random(seed);root=empty(P+'__J_'+name,loc);N=P+'__'+name+'__';wd=M['char'] if burnt else M['dark']
    po=[box(0.05,0.6,0.05,(x,0.6,0)) for x in(-1.5,0,1.5)]
    for y in(0.35,0.85):po.append(box(1.55,0.03,0.025,(0,y,0.04)))
    mk(N+'posts',merge_geo(*po),wd,root,bevel=0.008,sharp=40)
    sl=[]
    for i in range(24):
        if burnt and rnd.random()<0.3:continue
        x=-1.45+i*0.126;hh=rnd.uniform(0.95,1.15) if not burnt else rnd.uniform(0.4,1.1)
        sl.append(tube([(x,0.02,0.0),(x+rnd.uniform(-.02,.02),hh,0.0)],0.018,6))
    mk(N+'slats',merge_geo(*sl),M['char'] if burnt else M['bamboob'],root)
    return root
def scarecrow(loc):
    root=empty(P+'__J_scarecrow',loc);N=P+'__scarecrow__'
    mk(N+'pole',merge_geo(tube([(0,0,0),(0,1.95,0)],0.04,7),tube([(-0.62,1.45,0),(0.62,1.47,0)],0.032,7)),M['dark'],root)
    mk(N+'body',lathe([(0.04,0.82),(0.2,0.9),(0.24,1.15),(0.22,1.4),(0.12,1.52),(0.05,1.58)],14,cap0=True,cap1=True),M['thatch'],root,disp=lambda p,n:0.03*fbm3(p,9,2))
    for sx in(-1,1):mk(N+'tuft%d'%(sx+1),lathe([(0.0001,0),(0.07,0.04),(0.05,0.18),(0.0001,0.22)],8,cap0=True,cap1=True),M['thatch'],root,loc=(sx*0.68,1.46,0),disp=lambda p,n:0.02*fbm3(p,12,2))
    mk(N+'head',lathe([(0.0001,1.62),(0.11,1.66),(0.15,1.76),(0.12,1.88),(0.0001,1.92)],12,cap0=True,cap1=True),M['paper'],root,sub=1)
    mk(N+'hat',lathe([(0.0001,2.04),(0.25,1.92),(0.42,1.84),(0.43,1.82),(0.0001,1.83)],20,cap0=True,cap1=True),M['thatch'],root,disp=lambda p,n:0.008*fbm3(p,10,2))
    mk(N+'rag',plate(1.1,0.65,0.01,nu=8,nv=5,c=(0,1.18,0.05),bend=0.06),M['rag'],root,disp=lambda p,n:0.04*fbm3(p,3,2))
    return root
def debris(loc,seed=5):
    rnd=random.Random(seed);root=empty(P+'__J_debris',loc);g=[];e=[]
    for i in range(7):
        L=rnd.uniform(0.5,1.4);g.append(xform(box(L,0.07,0.08),chain(rotx(rnd.uniform(-.3,.3)),roty(rnd.uniform(0,3.1)),tr(rnd.uniform(-.5,.5),0.08+i*0.06,rnd.uniform(-.4,.4)))))
    for i in range(5):e.append(xform(box(0.12,0.05,0.1),chain(roty(rnd.uniform(0,3)),tr(rnd.uniform(-.5,.5),0.04,rnd.uniform(-.5,.5)))))
    mk(P+'__debris__beams',merge_geo(*g),M['char'],root,bevel=0.01,disp=lambda p,n:0.01*fbm3(p,6,2))
    mk(P+'__debris__embers',merge_geo(*e),M['ember'],root,disp=lambda p,n:0.02*fbm3(p,9,2))
    return root
def barrel(loc):
    root=empty(P+'__J_barrel',loc);N=P+'__barrel__'
    mk(N+'staves',lathe([(0.0001,0.02),(0.24,0.0),(0.29,0.35),(0.24,0.7),(0.22,0.68),(0.0001,0.66)],18,cap0=True,cap1=True,f=lambda a:1+0.01*math.cos(a*18)),M['wood'],root,sharp=60)
    mk(N+'hoops',merge_geo(*[lathe([(r,y-0.025),(r+0.012,y),(r,y+0.025)],18) for r,y in((0.262,0.1),(0.29,0.35),(0.262,0.6))]),M['bamboob'],root)
    return root
def cart(loc):
    root=empty(P+'__J_cart',loc);N=P+'__cart__';g=[]
    for i in range(6):g.append(box(0.62,0.025,0.075,(0,0.62,-0.75+i*0.3)))
    for sx in(-0.55,0.55):g.append(box(0.05,0.05,1.9,(sx,0.58,0.4)))
    g.append(box(0.62,0.04,0.04,(0,0.58,1.95)))
    mk(N+'bed',merge_geo(*g),M['wood'],root,bevel=0.006,sharp=40)
    wh=[]
    for sx in(-0.72,0.72):
        rim=[(sx,0.5+math.sin(a)*0.48,math.cos(a)*0.48) for a in [TAU*i/32 for i in range(33)]]
        wh.append(tube(rim,0.035,6,cap0=False,cap1=False,flat=1.0))
        for k in range(10):
            a=TAU*k/10;wh.append(tube([(sx,0.5,0),(sx,0.5+math.sin(a)*0.46,math.cos(a)*0.46)],0.016,5))
        wh.append(xform(lathe([(0.0001,-0.09),(0.07,-0.09),(0.08,0.0),(0.07,0.09),(0.0001,0.09)],10,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(sx,0.5,0))))
    wh.append(tube([(-0.8,0.5,0),(0.8,0.5,0)],0.03,6))
    mk(N+'wheels',merge_geo(*wh),M['dark'],root)
    mk(N+'load',xform(lathe([(0.0001,0),(0.22,0.02),(0.25,0.3),(0.2,0.55),(0.0001,0.57)],12,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(0,0.88,-0.3))),M['thatch'],root,disp=lambda p,n:0.02*fbm3(p,8,2))
    return root
def well(loc):
    root=empty(P+'__J_well',loc);N=P+'__well__'
    mk(N+'ring',lathe([(0.5,0.0),(0.62,0.0),(0.62,0.72),(0.58,0.76),(0.5,0.76),(0.5,0.3)],20,cap0=False,cap1=False),M['stone'],root,disp=lambda p,n:0.02*fbm3(p,3,3),sharp=50)
    fr=[box(0.06,1.1,0.06,(sx,1.1,0)) for sx in(-0.7,0.7)]+[box(0.82,0.05,0.05,(0,2.0,0))]
    mk(N+'frame',merge_geo(*fr),M['dark'],root,bevel=0.008,sharp=40)
    rf=[xform(plate(1.9,0.75,0.025,nu=2,nv=2),chain(rotx(sg*1.0),tr(0,2.38-0.0,sg*0.3))) for sg in(1,-1)]
    mk(N+'roof',merge_geo(*rf),M['thatch'],root,disp=lambda p,n:0.015*fbm3(p,6,2))
    mk(N+'pulley',xform(lathe([(0.0001,-0.03),(0.09,-0.03),(0.07,0.0),(0.09,0.03),(0.0001,0.03)],14,cap0=True,cap1=True),chain(rotz(math.pi/2),tr(0,1.88,0))),M['wood'],root)
    mk(N+'rope',tube([(0.0,1.8,0.08),(0.0,0.9,0.1)],0.01,5),M['rope'],root)
    mk(N+'bucket',lathe([(0.0001,0.6),(0.13,0.6),(0.15,0.86),(0.13,0.86),(0.12,0.62)],14,cap0=True),M['wood'],root,loc=(0,0.0,0.1))
    return root
# ------------------------------------------------------------------ лес
def leaf_geo(b,d,side,L,w):
    b=V(b);d=V(d).normalized();s=V(side).normalized();up=d.cross(s).normalized()
    p1=b+d*L*0.35+s*w+up*w*0.3;p2=b+d*L;p3=b+d*L*0.35-s*w+up*w*0.3;p4=b+d*L*0.4
    v=[tuple(b),tuple(p1),tuple(p2),tuple(p3),tuple(p4)];f=[(0,1,4),(1,2,4),(2,3,4),(3,0,4)]
    return v,f,[[(0,0),(0.5,0.3),(0.5,0.5)],[(0.5,0.3),(1,0.5),(0.5,0.5)],[(1,0.5),(0.5,0.7),(0.5,0.5)],[(0.5,0.7),(0,0),(0.5,0.5)]]
def bamboo(loc,H=13.0,seed=11):
    rnd=random.Random(seed);root=empty(P+'__J_bamboo',loc);rings=[];y=0.0;i=0;n=7
    while y<H:
        t=y/H;r=0.065*(1-0.45*t)+0.006;seg=0.32+0.32*min(1,t*2.2)
        rings.append([(math.cos(TAU*j/n)*r,y,math.sin(TAU*j/n)*r) for j in range(n)])
        rings.append([(math.cos(TAU*j/n)*r*1.12,y+0.015,math.sin(TAU*j/n)*r*1.12) for j in range(n)])
        rings.append([(math.cos(TAU*j/n)*r,y+0.04,math.sin(TAU*j/n)*r) for j in range(n)])
        y+=seg
    mk(P+'__bamboo__stalk',loft(rings,True,False,True),M['bamboo'],root)
    tw=[];lv=[]
    for k in range(9):
        yb=H*0.6+k*H*0.045;a=rnd.uniform(0,TAU)+k*2.4;dx,dz=math.cos(a),math.sin(a);L=rnd.uniform(0.7,1.3)
        tip=(dx*L,yb+L*0.25,dz*L);tw.append(tube([(0,yb,0),(dx*L*0.5,yb+L*0.2,dz*L*0.5),tip],0.006,3,cap0=False,cap1=False))
        for q in range(7):
            t=0.3+q*0.11;b=(dx*L*t,yb+L*0.25*t,dz*L*t);ang=a+rnd.uniform(-1.2,1.2)
            d=(math.cos(ang),-rnd.uniform(0.5,1.1),math.sin(ang));sd=(-math.sin(ang),0.2,math.cos(ang))
            lv.append(leaf_geo(b,d,sd,rnd.uniform(0.18,0.28),0.022))
    mk(P+'__bamboo__twigs',merge_geo(*tw),M['bamboob'],root,smooth=True)
    mk(P+'__bambooleaf__leaves',merge_geo(*lv),M['leaf'],root,recalc=False)
    return root
def rock(name,loc,r=0.8,sq=0.6,seed=1):
    root=empty(P+'__J_'+name,loc)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=r);o=bpy.context.active_object
    for c in o.users_collection:c.objects.unlink(o)
    link(o);o.name=P+'__'+name+'__body';o.parent=root;o.location=(0,0,0);o.scale=(1.0,1.0*0.85,sq);
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(M['mossrock']);o.data.shade_smooth()
    displace(o,lambda p,n:r*(0.22*fbm3(p,1.6/r,3,seed)+0.05*fbm3(p,6/r,2,seed+2))-max(0,-p.y-r*sq*0.3)*0.5)
    box_uv(o,1.0);o.data.set_sharp_from_angle(angle=math.radians(50));return root
def grass(loc,seed=21):
    rnd=random.Random(seed);root=empty(P+'__J_grass',loc);bl_=[]
    for i in range(11):
        a=rnd.uniform(0,TAU);h=rnd.uniform(0.3,0.6);lean=rnd.uniform(0.15,0.45);w=0.018
        bx,bz=math.cos(a)*0.05,math.sin(a)*0.05;dx,dz=math.cos(a),math.sin(a);sx,sz=-dz,dx;v=[];f=[];u=[]
        for k in range(4):
            t=k/3;ww=w*(1-t*0.9);px=bx+dx*lean*h*t*t;pz=bz+dz*lean*h*t*t;py=h*t-lean*h*0.3*t*t
            v+= [(px-sx*ww,py,pz-sz*ww),(px+sx*ww,py,pz+sz*ww)]
        for k in range(3):f.append((2*k,2*k+1,2*k+3,2*k+2));u.append([(0,k/3),(1,k/3),(1,(k+1)/3),(0,(k+1)/3)])
        bl_.append((v,f,u))
    mk(P+'__grass__blades',merge_geo(*bl_),M['grass'],root,recalc=False)
    return root
def shrine(loc):
    root=empty(P+'__J_shrine',loc);N=P+'__shrine__'
    mk(N+'base',merge_geo(box(0.5,0.12,0.42,(0,0.12,0)),box(0.38,0.1,0.32,(0,0.34,0))),M['mossrock'],root,bevel=0.02,sharp=40,disp=lambda p,n:0.008*fbm3(p,5,2))
    mk(N+'body',merge_geo(box(0.24,0.26,0.2,(0,0.7,0)),box(0.27,0.02,0.23,(0,0.45,0))),M['dark'],root,bevel=0.008,sharp=40)
    mk(N+'doors',box(0.17,0.18,0.005,(0,0.7,0.205)),M['brass'],root)
    rf=[xform(plate(0.72,0.42,0.025,nu=3,nv=2),chain(rotx(-math.pi/2+sg*0.62),tr(0,1.08,sg*0.15))) for sg in(1,-1)]
    mk(N+'roof',merge_geo(*rf),M['kawara'],root,sharp=40)
    mk(N+'rope',tube([(-0.28,0.92,0.24),(0,0.86,0.27),(0.28,0.92,0.24)],0.018,6,twist=0.5),M['rope'],root)
    for sx in(-0.3,0.3):mk(N+'vase%d'%(1 if sx>0 else 0),lathe([(0.0001,0.44),(0.04,0.44),(0.05,0.5),(0.025,0.56),(0.035,0.6),(0.0001,0.59)],10,cap0=True,cap1=True,c=(sx,0,0.25)),M['plaster'],root)
    return root
# ------------------------------------------------------------------ храмовый двор
def tile_roof_loft(x0,x1,prof,pitch=0.26,amp=0.035,sori=0.0,nper=4,thick=0.12):
    """Черепичная кровля: кольца вдоль X, сечение prof [(z,y)] от переднего свеса к заднему; гофр по X."""
    rings=[];n=int((x1-x0)/pitch*nper)
    for i in range(n+1):
        x=x0+(x1-x0)*i/n;wave=amp*abs(math.sin(math.pi*(x-x0)/pitch));e=sori*(abs(2*(x-x0)/(x1-x0)-1))**4
        top=[(x,y+wave+e*(abs(z)/max(1e-3,max(abs(q[0]) for q in prof)))**2,z) for z,y in prof]
        bot=[(x,y-thick+e*(abs(z)/max(1e-3,max(abs(q[0]) for q in prof)))**2,z*0.97) for z,y in prof[::-1]]
        rings.append(top+bot)
    return loft(rings,True,True,True)
def pillar(loc,H=6.6):
    root=empty(P+'__J_pillar',loc);N=P+'__pillar__'
    mk(N+'column',lathe([(0.3,0.25),(0.31,0.6),(0.29,H-0.3),(0.27,H)],20,cap1=True),M['red'],root)
    mk(N+'base',lathe([(0.0001,0),(0.52,0),(0.5,0.14),(0.38,0.26),(0.0001,0.26)],10,cap0=True,cap1=True,f=lambda a:1/math.cos(((a)%(math.pi/4))-math.pi/8)),M['stone'],root,sharp=40,disp=lambda p,n:0.01*fbm3(p,5,2))
    br=[box(0.36,0.14,0.36,(0,H+0.14,0)),box(0.85,0.09,0.14,(0,H+0.37,0)),box(0.14,0.09,0.85,(0,H+0.37,0))]
    for x in(-0.75,0,0.75):br.append(box(0.13,0.08,0.13,(x,H+0.54,0)))
    for z in(-0.75,0.75):br.append(box(0.13,0.08,0.13,(0,H+0.54,z)))
    br.append(box(1.05,0.08,0.15,(0,H+0.7,0)))
    mk(N+'bracket',merge_geo(*br),M['dark'],root,bevel=0.01,sharp=40)
    mk(N+'band',merge_geo(lathe([(0.315,0.9),(0.325,0.94),(0.325,1.06),(0.315,1.1)],20),lathe([(0.29,H-0.5),(0.3,H-0.46),(0.3,H-0.34),(0.29,H-0.3)],20)),M['brass'],root)
    return root
def wall(loc,L=6.0):
    root=empty(P+'__J_wall',loc);N=P+'__wall__';hl=L/2
    mk(N+'base',box(hl,0.35,0.42,(0,0.35,0)),M['stone'],root,bevel=0.03,sharp=40,disp=lambda p,n:0.015*fbm3(p,2,3))
    body=loft([[(x,y,z*k) for x,y,z in((-hl,0.7,0.36),(hl,0.7,0.36),(hl,0.7,-0.36),(-hl,0.7,-0.36))] for k in(1,)] +
              [[(x,3.0,z) for x,_,z in((-hl,0,0.3),(hl,0,0.3),(hl,0,-0.3),(-hl,0,-0.3))]],True,True,True)
    mk(N+'body',body,M['plaster'],root,disp=lambda p,n:0.006*fbm3(p,3,2))
    li=[]
    for k in range(5):
        y=1.5+k*0.28;zz=0.36-(y-0.7)/2.3*0.06
        for sg in(1,-1):li.append(box(hl,0.025,0.01,(0,y,sg*(zz+0.008))))
    mk(N+'lines',merge_geo(*li),M['white'],root)
    mk(N+'beam',box(hl+0.05,0.08,0.34,(0,3.06,0)),M['dark'],root,bevel=0.01,sharp=40)
    prof=[(0.78,3.12),(0.4,3.3),(0.0,3.5),(-0.4,3.3),(-0.78,3.12)]
    mk(N+'tiles',tile_roof_loft(-hl-0.15,hl+0.15,prof,pitch=0.25,amp=0.03,thick=0.08),M['kawara'],root,sharp=55)
    mk(N+'ridge',merge_geo(box(hl+0.18,0.1,0.13,(0,3.52,0)),box(0.06,0.2,0.2,(hl+0.2,3.55,0)),box(0.06,0.2,0.2,(-hl-0.2,3.55,0))),M['kawara'],root,bevel=0.01,sharp=40)
    return root
def hall(loc):
    root=empty(P+'__J_hall',loc);N=P+'__hall__';W=9.0;D=5.0
    mk(N+'platform',box(W+0.6,0.55,D+0.6,(0,0.55,0)),M['stone'],root,bevel=0.03,sharp=40,disp=lambda p,n:0.01*fbm3(p,1.5,3))
    st=[box(1.8,0.09,0.25+0.25*(4-i),(0,0.09+i*0.18+0.0,D+0.6+0.25*(4-i))) for i in range(5)]
    mk(N+'stairs',merge_geo(*st),M['stone'],root,bevel=0.01,sharp=40)
    cols=[];xs=[-W+0.4+i*(2*W-0.8)/5 for i in range(6)]
    for x in xs:
        for z in(D-0.3,-D+0.3):cols.append(lathe([(0.26,1.1),(0.25,5.4)],16,c=(x,0,z),cap1=True))
    mk(N+'columns',merge_geo(*cols),M['red'],root)
    bm=[box(W,0.16,0.14,(0,5.3,D-0.3)),box(W,0.12,0.12,(0,3.0,D-0.3)),box(W+0.6,0.1,0.12,(0,1.15,D+0.35)),box(W,0.16,0.14,(0,5.3,-D+0.3))]
    for x in xs:bm.append(box(0.18,0.14,0.6,(x,5.55,D-0.2)))
    mk(N+'beams',merge_geo(*bm),M['red'],root,bevel=0.01,sharp=40)
    # двери ситоми (решётка) между колоннами
    dr=[];gl=[]
    for i in range(5):
        cx=(xs[i]+xs[i+1])/2;pw=(xs[i+1]-xs[i])/2-0.3
        gl.append(box(pw,0.95,0.01,(cx,2.05,D-0.32)))
        for k in range(int(2*pw/0.22)+1):dr.append(box(0.018,0.95,0.025,(cx-pw+k*0.22,2.05,D-0.28)))
        for k in range(10):dr.append(box(pw,0.018,0.025,(cx,1.1+k*0.21,D-0.28)))
        dr.append(box(pw,0.4,0.02,(cx,4.1,D-0.3)))
    mk(N+'lattice',merge_geo(*dr),M['dark'],root,sharp=40)
    mk(N+'paper',merge_geo(*gl),M['shoji'],root)
    mk(N+'back',box(W-0.1,2.2,0.15,(0,3.2,-D+0.3)),M['plaster'],root)
    mk(N+'veranda',box(W+0.4,0.05,0.5,(0,1.15,D+0.1)),M['dark'],root,sharp=40)
    prof=[(D+2.2,5.7),(D+1.0,6.15),(D-0.5,6.9),(2.0,7.9),(0.0,8.4),(-2.0,7.9),(-D+0.5,6.9),(-D-1.0,6.15),(-D-2.2,5.7)]
    mk(N+'roof',tile_roof_loft(-W-1.8,W+1.8,prof,pitch=0.32,amp=0.05,sori=0.45,nper=4,thick=0.25),M['kawara'],root,sharp=55)
    mk(N+'ridge',merge_geo(box(W+1.9,0.22,0.2,(0,8.55,0)),box(0.15,0.5,0.3,(W+1.85,8.75,0)),box(0.15,0.5,0.3,(-W-1.85,8.75,0))),M['kawara'],root,bevel=0.02,sharp=40)
    gb=[]
    for sx in(-1,1):
        x=sx*(W+0.3);gb.append(loft([[(x+dx,y,z) for z,y in((D-0.2,5.4),(0,8.2),(-D+0.2,5.4))] for dx in(-0.06,0.06)],False,True,True))
    mk(N+'gable',merge_geo(*gb),M['plaster'],root)
    mk(N+'bargeboards',merge_geo(*[tube([(sx*(W+1.75),5.75,D+2.1),(sx*(W+1.75),8.35,0),(sx*(W+1.75),5.75,-D-2.1)],0.09,4) for sx in(-1,1)]),M['dark'],root)
    return root
def shoro(loc):
    root=empty(P+'__J_shoro',loc);N=P+'__shoro__'
    mk(N+'base',box(2.3,0.35,2.3,(0,0.35,0)),M['stone'],root,bevel=0.03,sharp=40,disp=lambda p,n:0.012*fbm3(p,2,3))
    po=[]
    for sx in(-1,1):
        for sz in(-1,1):po.append(tube([(sx*1.75,0.7,sz*1.75),(sx*1.45,5.9,sz*1.45)],0.17,10,flat=1.0))
    mk(N+'posts',merge_geo(*po),M['red'],root)
    bm=[]
    for y in(2.0,5.15,5.85):
        for sz in(-1,1):bm.append(box(1.9,0.1,0.1,(0,y,sz*(1.62-(y-0.7)/5.2*0.3))))
        for sx in(-1,1):bm.append(box(0.1,0.1,1.9,(sx*(1.62-(y-0.7)/5.2*0.3),y,0)))
    bm.append(box(1.6,0.14,0.16,(0,5.02,0)))
    mk(N+'beams',merge_geo(*bm),M['dark'],root,bevel=0.01,sharp=40)
    rings=[]
    ye=6.0
    for k,(t,yy) in enumerate(((0.0,ye-0.2),(0.0,ye),(0.25,ye+0.45),(0.5,ye+0.95),(0.75,ye+1.5),(1.0,ye+2.0))):
        ax=2.7*(1-t)+0.7*t;az=2.7*(1-t)+0.08*t
        ring=[]
        for x,z in rrect(ax,az,48,10):
            e=0.35*(1-t)*(min(abs(x)/ax,abs(z)/az))**3 if t<0.6 else 0
            ring.append((x,yy+e,z))
        rings.append(ring)
    mk(N+'roof',loft(rings,True,True,True),M['kawara'],root,sharp=50)
    mk(N+'ridge',merge_geo(box(0.8,0.13,0.14,(0,ye+2.08,0)),box(0.09,0.28,0.2,(0.85,ye+2.2,0)),box(0.09,0.28,0.2,(-0.85,ye+2.2,0))),M['kawara'],root,bevel=0.01,sharp=40)
    return root
def brazier(loc):
    root=empty(P+'__J_brazier',loc);N=P+'__brazier__';lg=[]
    for k in range(3):
        a=k*TAU/3;lg.append(tube([(math.cos(a)*0.55,0,math.sin(a)*0.55),(0,1.0,0),(-math.cos(a)*0.22,1.25,-math.sin(a)*0.22)],0.022,6))
    bs=[lathe([(0.2,1.05),(0.21,1.07),(0.2,1.09)],14),lathe([(0.33,1.43),(0.345,1.45),(0.33,1.47)],16)]
    for k in range(10):a=k*TAU/10;bs.append(tube([(math.cos(a)*0.2,1.06,math.sin(a)*0.2),(math.cos(a)*0.34,1.47,math.sin(a)*0.34)],0.012,4))
    mk(N+'iron',merge_geo(*lg,*bs),M['iron'],root)
    rnd=random.Random(4);lo=[]
    for k in range(6):a=rnd.uniform(0,TAU);lo.append(xform(box(0.035,0.035,0.22),chain(rotx(rnd.uniform(-1,1)),roty(a),tr(0,1.2+k*0.03,0))))
    mk(N+'logs',merge_geo(*lo),M['ember'],root)
    return root
def grounds():
    for nm,m in(('ash','gash'),('moss','gmoss'),('paving','gpave')):
        root=empty(P+'__J_ground_'+nm,(0,-5,0));mk(P+'__ground_'+nm+'__plane',plate(1,1,0.01,nu=1,nv=1),M[m],root)
def build_all(x0=0.0):
    M_env();x=x0
    def nx(dx):
        nonlocal x;x+=dx;return x
    collection('Env_Village')
    minka('minka',(nx(0),0,-20),False,seed=1);minka('minkab',(nx(10),0,-20),True,seed=2)
    fence('fence',(nx(9),0,-20));fence('fenceb',(nx(4),0,-20),True,seed=9)
    scarecrow((nx(3),0,-20));debris((nx(2),0,-20));barrel((nx(2),0,-20));cart((nx(2),0,-20));well((nx(3),0,-20))
    collection('Env_Forest')
    x=x0;bamboo((nx(0),0,-45));rock('rock1',(nx(3),0,-45),0.9,0.6,3);rock('rock2',(nx(3),0,-45),0.55,0.75,7);rock('rock3',(nx(2.5),0,-45),1.4,0.45,11)
    grass((nx(3),0,-45));shrine((nx(2),0,-45))
    collection('Env_Temple')
    x=x0;pillar((nx(0),0,-75));wall((nx(5),0,-75));hall((nx(18),0,-75));shoro((nx(20),0,-75));brazier((nx(5),0,-75))
    collection('Env_Ground');grounds()
