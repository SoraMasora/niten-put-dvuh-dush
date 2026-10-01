"""Скачивает CC0-текстуры Poly Haven (https://polyhaven.com, лицензия CC0) для «Забытого дома».
Запуск: python3 blender/fetch_tex.py  -> blender/tex/ph_<id>_c.png / ph_<id>_n.png (512 px)."""
import os,json,urllib.request,io
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'tex');os.makedirs(OUT,exist_ok=True)
IDS=['tatami_mat','hinoki_planks','japanese_cedar_planks','clay_plaster','dark_wood','japanese_stone_wall','snow_02','gravel_floor','wood_floor_worn']
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'niten-build'}),timeout=60).read()
def fetch(i,size=512):
    for kind,key in (('c','Diffuse'),('n','nor_gl')):
        dst=os.path.join(OUT,'ph_%s_%s.png'%(i,kind))
        if os.path.exists(dst):continue
        d=json.loads(get('https://api.polyhaven.com/files/'+i));u=d[key]['1k']['jpg']['url']
        im=Image.open(io.BytesIO(get(u))).convert('RGB').resize((size,size),Image.LANCZOS);im.save(dst);print('ok',dst)
if __name__=='__main__':
    for i in IDS:fetch(i)
