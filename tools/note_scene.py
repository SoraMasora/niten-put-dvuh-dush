from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps
import numpy as np,random,math
random.seed(7);np.random.seed(7)
W,H=1280,720
def noise(w,h,s):
    a=np.random.rand(h//s+2,w//s+2);im=Image.fromarray((a*255).astype('uint8')).resize((w,h),Image.BICUBIC);return np.asarray(im)/255.0
# фон: тёмное дерево
bg=np.zeros((H,W,3));g=noise(W,H,40)*0.5+noise(W,H,8)*0.3+np.sin(np.linspace(0,60,H))[:,None]*0.1
bg[...,0]=0.13+g*0.07;bg[...,1]=0.08+g*0.045;bg[...,2]=0.05+g*0.03
yy,xx=np.mgrid[0:H,0:W];v=1-0.75*(((xx-W/2)/(W*0.7))**2+((yy-H/2)/(H*0.7))**2);bg*=np.clip(v,0.15,1)[...,None]
base=Image.fromarray((np.clip(bg,0,1)*255).astype('uint8')).convert('RGBA')
def paper(w,h,seed):
    np.random.seed(seed);n=noise(w,h,30)*0.6+noise(w,h,6)*0.25+noise(w,h,2)*0.15
    a=np.zeros((h,w,4));a[...,0]=0.86+n*0.09;a[...,1]=0.79+n*0.08;a[...,2]=0.62+n*0.07
    # пятна и затемнение краёв
    yy,xx=np.mgrid[0:h,0:w];e=np.minimum(np.minimum(xx,w-1-xx),np.minimum(yy,h-1-yy))/30.0
    a[...,:3]*=np.clip(0.72+0.28*np.minimum(e,1),0,1)[...,None]
    st=noise(w,h,60);a[...,:3]*=(1-0.08*np.clip((st-0.7)*4,0,1))[...,None]
    # рваный край
    edge=noise(w,h,5)*10;a[...,3]=np.clip((np.minimum(np.minimum(xx,w-1-xx),np.minimum(yy,h-1-yy))-edge+4)/2,0,1)
    return Image.fromarray((np.clip(a,0,1)*255).astype('uint8'),'RGBA')
def place(img,ang,cx,cy):
    r=img.rotate(ang,expand=True,resample=Image.BICUBIC);sh=Image.new('RGBA',r.size,(0,0,0,0));al=r.split()[3].filter(ImageFilter.GaussianBlur(10))
    sh.putalpha(al.point(lambda p:int(p*0.7)));base.alpha_composite(Image.new('RGBA',r.size,(0,0,0,0)),(0,0))
    blk=Image.new('RGBA',r.size,(0,0,0,255));blk.putalpha(al.point(lambda p:int(p*0.75)))
    base.alpha_composite(blk,(int(cx-r.width/2+12),int(cy-r.height/2+16)));base.alpha_composite(r,(int(cx-r.width/2),int(cy-r.height/2)))
# записка 1 с фотографией
p1=paper(500,600,1);ph=Image.open('photo.jpg').convert('RGB');ph=ImageOps.fit(ph,(430,300),centering=(0.5,0.45))
phb=Image.new('RGBA',(450,320),(236,228,210,255));phb.paste(ph,(10,10));phb=phb.rotate(-2.5,expand=True,resample=Image.BICUBIC)
p1.alpha_composite(phb,(22,60))
d=ImageDraw.Draw(p1);F=ImageFont.truetype('marck.ttf',40);Fs=ImageFont.truetype('marck.ttf',30)
d.text((70,420),'Акира и Сота',font=F,fill=(40,26,18,235))
d.text((70,475),'лето, деревня Ивате',font=Fs,fill=(60,40,28,210))
d.line([(250,38),(262,70)],fill=(120,20,20,255),width=6)  # булавка
d.ellipse([240,28,262,50],fill=(150,24,22,255))
place(p1,5,355,370)
# записка 2 с текстом
p2=paper(560,650,2);d=ImageDraw.Draw(p2);F=ImageFont.truetype('marck.ttf',33)
txt="Брат мой, прости, когда ты это прочтешь, скорее всего, я уже потеряю свой рассудок. Просто иди дальше по испытаниям, что подготовила тебе жизнь и тогда ты поймешь, какая сила перенесла тебя сюда и какова твоя роль в этой сцене."
words=txt.split();lines=[];cur=''
for w in words:
    t=(cur+' '+w).strip()
    if d.textlength(t,font=F)>470:lines.append(cur);cur=w
    else:cur=t
lines.append(cur);y=56
for i,l in enumerate(lines):
    x=46+random.randint(-3,3);d.text((x,y),l,font=F,fill=(32,20,14,240));y+=47+random.randint(-2,2)
d.text((330,y+22),'— Сота',font=ImageFont.truetype('marck.ttf',38),fill=(70,14,12,240))
# клякса
#d.ellipse([60,y+40,80,y+56],fill=(30,18,12,140))
place(p2,-4,890,360)
base.convert('RGB').save('note_scene.jpg',quality=86)
print('ok')
