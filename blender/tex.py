"""Процедурные тайлящиеся текстуры (numpy) для моделей NITEN."""
import numpy as np, os
from PIL import Image
OUT=os.path.join(os.path.dirname(__file__),'tex')
R=np.random.default_rng(7)
def fbm(n,beta=2.0,seed=0,ny=None):
    ny=ny or n;r=np.random.default_rng(seed)
    fx=np.fft.fftfreq(n)[None,:];fy=np.fft.fftfreq(ny)[:,None];f=np.sqrt(fx*fx+fy*fy);f[0,0]=1
    sp=(r.normal(size=(ny,n))+1j*r.normal(size=(ny,n)))/f**(beta/2);sp[0,0]=0
    h=np.real(np.fft.ifft2(sp));h-=h.min();h/=h.max();return h
def norm_from_h(h,s=2.0):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s*h.shape[1]/256;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s*h.shape[0]/256
    n=np.dstack([-gx,gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True);return ((n*0.5+0.5)*255).astype(np.uint8)
def save(name,a):
    a=np.clip(a,0,1) if a.dtype!=np.uint8 else a
    if a.dtype!=np.uint8:a=(a*255).astype(np.uint8)
    if a.ndim==2:a=np.dstack([a]*3)
    Image.fromarray(a).save(os.path.join(OUT,name+'.png'))
def lin(n):return np.linspace(0,1,n,endpoint=False)
def build():
    os.makedirs(OUT,exist_ok=True);n=512;u=lin(n)[None,:];v=lin(n)[:,None]
    # ткань: саржевое плетение + шум
    th=48;wx=np.sin(2*np.pi*th*(u+v*0.0))*0.5+0.5;wy=np.sin(2*np.pi*th*v)*0.5+0.5
    sel=((np.floor(u*th)+np.floor(v*th))%2==0)
    weave=np.where(sel,wx*0.6+0.4*wy,wy*0.6+0.4*wx)
    nz=fbm(n,2.4,1);nz2=fbm(n,1.2,2)
    h=weave*0.6+nz*0.3+nz2*0.1;save('cloth_n',norm_from_h(h,1.6))
    save('cloth_c',0.72+0.18*nz+0.1*weave-0.08*nz2)
    # лаковые пластины кодзанэ + шнуровка (odoshi)
    rows=8;cols=16;ry=(v*rows)%1;cx=(u*cols)%1
    plate=np.clip(np.minimum(ry/0.08,1)*np.minimum((1-ry)/0.05,1),0,1)
    seam=np.clip(np.abs(cx-0.5)*2,0,1)**8
    lace=((np.abs(((u*cols*0.5)%1)-0.5)<0.16)).astype(float)*np.ones_like(v)
    holes=((np.abs(cx-0.5)<0.12)&(np.abs(ry-0.3)<0.06)).astype(float)
    hk=plate*(1-seam*0.6)*0.7+lace*0.25+fbm(n,2.0,3)*0.15;save('kozane_n',norm_from_h(hk,3.0))
    wear=fbm(n,1.6,4)
    for nm,lc,base in [('kozane_ak_c',(0.55,0.06,0.05),(0.05,0.045,0.045)),('kozane_so_c',(0.32,0.05,0.38),(0.07,0.02,0.02)),('kozane_rot_c',(0.28,0.2,0.12),(0.12,0.09,0.07))]:
        c=np.zeros((n,n,3))
        for i in range(3):
            pl=base[i]*(0.8+0.4*wear)+plate*0.0+(1-plate)*0.02+((wear>0.75)*(1-plate*0.5))*0.15
            c[...,i]=np.where(lace>0.5,lc[i]*(0.75+0.35*nz)*(0.6+0.4*np.sin(np.pi*ry)),pl)
            c[...,i]*=1-holes*0.7
        save(nm,c)
    # кожа
    pores=fbm(n,0.8,5);sk=fbm(n,2.6,6)
    save('skin_n',norm_from_h(pores*0.25+sk*0.4,0.8))
    c=np.dstack([0.78+0.08*sk-0.05*pores,0.58+0.06*sk-0.04*pores,0.48+0.04*sk-0.04*pores]);save('skin_c',c)
    # волосы: пряди вдоль V
    st=fbm(n,2.0,7,);st=np.repeat(fbm(n,1.5,8)[0:1,:],n,0)*0.7+fbm(n,2.8,9)*0.3
    save('hair_n',norm_from_h(st,2.5));save('hair_c',0.55+0.45*st)
    # металл: шлифовка + царапины
    br=np.repeat(fbm(n,1.0,10)[0:1,:],n,0)*0.6+fbm(n,2.5,11)*0.4
    scr=np.zeros((n,n))
    for _ in range(140):
        x0,y0=R.integers(0,n,2);ang=R.uniform(0,np.pi);L=R.integers(10,90)
        for t in range(L):
            x=int(x0+np.cos(ang)*t)%n;y=int(y0+np.sin(ang)*t)%n;scr[y,x]=1
    save('metal_n',norm_from_h(br*0.3+scr*0.25,1.5))
    orm=np.dstack([np.ones((n,n)),0.25+0.3*fbm(n,2.0,12)+0.2*scr,np.ones((n,n))]);save('metal_orm',orm)
    # клинок: хамон вдоль длины (u), поперёк (v: 0 обух .. 1 лезвие)
    W,H=2048,256;uu=lin(W)[None,:];vv=lin(H)[:,None]
    gun=np.abs(np.sin(uu*np.pi*46+0.6*np.sin(uu*2*np.pi*7)))**0.6
    cho=np.abs(np.sin(uu*np.pi*130+1.3))**3
    ham=0.6+0.07*gun+0.025*cho+0.03*(fbm(W,2,13,H)[H//2:H//2+1,:]-0.5)
    tip=np.clip((uu-0.9)/0.1,0,1);ham=ham*(1-tip)+(0.55+0.3*tip)*tip   # боси: хамон поворачивает в кончике
    edge=np.clip((vv-ham)/0.012,0,1);nioi=np.exp(-((vv-ham)/0.018)**2)
    nie=(R.random((H,W))>0.985).astype(float)*np.exp(-((vv-ham)/0.04)**2)
    hada=np.repeat(fbm(W,1.6,17,H).mean(axis=0,keepdims=True)*0,H,0)+fbm(W,2.4,18,H)*0.5+np.roll(fbm(W,1.2,19,H),0,1)*0.5
    hada=0.5+0.5*np.sin(hada*40)
    jit=fbm(W,1.1,14,H)
    shin=(vv<0.28).astype(float);yok=np.exp(-((uu-0.925)/0.0015)**2)
    g=0.44+0.08*jit+0.05*hada*(1-edge)+edge*0.34+nioi*0.16+nie*0.25-shin*0.1+yok*0.15
    save('blade_c',np.dstack([g*0.97,g*0.99,g*1.03]))
    save('blade_orm',np.dstack([np.ones_like(g),0.1+edge*0.22+nioi*0.1-shin*0.04+hada*0.04,np.ones_like(g)]))
    # смола Гэнмы: морщины и прожилки
    t1=fbm(n,2.2,15);rid=1-np.abs(fbm(n,1.9,16)*2-1);rid=rid**6
    save('tar_n',norm_from_h(t1*0.5+rid*0.5,3.5))
    save('tar_c',np.dstack([0.06+0.25*rid,0.02+0.02*rid,0.03+0.02*rid]))
    # солома
    sw=np.sin(2*np.pi*(u*40+fbm(n,2,17)*0.3))*0.5+0.5;bands=np.sin(2*np.pi*v*10)*0.5+0.5
    hs=sw*0.6+bands*0.3+fbm(n,2,18)*0.1;save('straw_n',norm_from_h(hs,2))
    save('straw_c',np.dstack([0.55+0.25*hs,0.45+0.2*hs,0.27+0.12*hs]))
    # дерево
    gr=np.sin(2*np.pi*(v*0+u*12+fbm(n,2.5,19)*2.5))*0.5+0.5;gr=gr*0.7+fbm(n,1.5,20)*0.3
    save('wood_n',norm_from_h(gr,1.5));save('wood_c',np.dstack([0.32+0.2*gr,0.22+0.14*gr,0.15+0.08*gr]))
    # кожа (leather)
    cr=1-np.abs(fbm(n,1.7,21)*2-1);cr=cr**4;lh=fbm(n,1.0,22)*0.5+cr*0.5
    save('leather_n',norm_from_h(lh,1.6));save('leather_c',0.6+0.4*fbm(n,2.2,23)-0.2*cr)
    # кожа ската (samegawa)
    sg=np.zeros((n,n))
    yy,xx=np.mgrid[0:n,0:n]
    for _ in range(900):
        cx_,cy_=R.integers(0,n,2);r_=R.uniform(3,7)
        dx=(xx-cx_+n//2)%n-n//2;dy=(yy-cy_+n//2)%n-n//2
        sg=np.maximum(sg,np.clip(1-(dx*dx+dy*dy)/(r_*r_),0,1))
    save('same_n',norm_from_h(sg,2));save('same_c',0.75+0.2*sg)
    # камень
    s1=fbm(n,2.0,24);s2=fbm(n,1.3,25);cr2=(1-np.abs(fbm(n,2.2,26)*2-1))**8
    save('stone_n',norm_from_h(s1*0.6+s2*0.3-cr2*0.3,2.5));save('stone_c',0.45+0.3*s1+0.15*s2-0.3*cr2)
    # кость
    b1=fbm(n,2.4,27);bc=(1-np.abs(fbm(n,2,28)*2-1))**10
    save('bone_n',norm_from_h(b1*0.5-bc*0.3,1.5));save('bone_c',np.dstack([0.86-0.2*bc+0.08*b1,0.8-0.22*bc+0.06*b1,0.66-0.2*bc]))
    # бумага (зонт)
    p1=fbm(n,1.2,29);st2=fbm(n,2.8,30)
    save('paper_c',np.dstack([0.78-0.25*st2,0.7-0.28*st2,0.55-0.3*st2])*(0.9+0.1*p1)[...,None]);save('paper_n',norm_from_h(p1*0.3+st2*0.2,1))
    build_env()
def build_env():
    """Текстуры окружения: земля (пепел/мох/каменные плиты), штукатурка, бамбук, черепица."""
    n=512;u=lin(n)[None,:];v=lin(n)[:,None]
    a1=fbm(n,2.2,40);a2=fbm(n,1.3,41);a3=fbm(n,2.8,42)
    soot=(fbm(n,1.8,43)>0.62).astype(float)*0.6;bits=(R.random((n,n))>0.993).astype(float)
    h=a1*0.5+a3*0.3+bits*0.5
    c=np.dstack([0.33+0.18*a1-0.2*soot+0.3*bits*0.2,0.3+0.16*a1-0.18*soot,0.28+0.14*a1-0.16*soot])*(0.85+0.3*a2)[...,None]
    save('ground_ash_c',c);save('ground_ash_n',norm_from_h(h,2.0))
    m1=fbm(n,2.0,44);m2=fbm(n,2.6,45);leaf=fbm(n,3.0,46)
    moss=np.clip((m1-0.45)*3,0,1)
    c=np.dstack([0.22+0.12*m2-0.1*moss+0.1*leaf,0.2+0.12*m2+0.1*moss,0.12+0.06*m2])
    save('ground_moss_c',c);save('ground_moss_n',norm_from_h(m1*0.4+m2*0.3+leaf*0.3,2.0))
    # каменные плиты: ряды прямоугольных плит со смещением
    rows=6;hgt=np.zeros((n,n));col=np.zeros((n,n));rr=np.random.default_rng(47)
    rh=n//rows
    for r in range(rows):
        y0=r*rh;x=int(rr.integers(0,n//4))
        while x<n+n//4:
            w=int(rr.integers(n//7,n//3));tone=rr.uniform(-0.12,0.12)
            xs=np.arange(x,x+w)%n
            gx=np.minimum(np.arange(w),w-1-np.arange(w))[None,:];gy=np.minimum(np.arange(rh),rh-1-np.arange(rh))[:,None]
            e=np.clip(np.minimum(gx,gy)/5.0,0,1)
            hgt[y0:y0+rh][:,xs]=e*(0.8+0.2*rr.random());col[y0:y0+rh][:,xs]=tone
            x+=w
    s1=fbm(n,2.3,48);s2=fbm(n,1.5,49)
    hh=hgt*0.7+s1*0.2+s2*0.1
    g=(0.42+col+0.18*s1+0.1*s2)*(0.35+0.65*np.clip(hgt*1.5,0,1))
    save('paving_c',np.dstack([g*0.95,g*0.96,g*1.0]));save('paving_n',norm_from_h(hh,3.0))
    # штукатурка
    p1=fbm(n,2.4,50);p2=fbm(n,1.4,51)
    save('plaster_c',np.dstack([0.8,0.74,0.62])*(0.82+0.12*p1+0.08*p2)[...,None]-(fbm(n,1.6,52)[...,None]>0.7)*0.12);save('plaster_n',norm_from_h(p1*0.5+p2*0.2,1.2))
    # бамбук: продольные волокна
    fib=np.repeat(fbm(n,1.0,53)[0:1,:],n,0)*0.5+fbm(n,2.2,54)*0.5
    save('bamboo_c',np.dstack([0.42+0.15*fib,0.48+0.14*fib,0.22+0.08*fib]));save('bamboo_n',norm_from_h(fib*0.3,1.0))
if __name__=='__main__':build();print('ok',len(os.listdir(OUT)))
