#!/usr/bin/env bash
# Сборка игры: модели (Blender) -> оптимизация (meshopt) -> бандл (esbuild) -> dist/ и single-file HTML.
# Требования: python3 + pip install bpy==5.2.2 numpy pillow ; node 18+ ; npm install
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$SKIP_MODELS" = "1" ] || { python3 blender/build.py; node tools/optimize.mjs blender/out/niten_assets.glb blender/out/niten_assets.opt.glb; python3 blender/loot.py; node tools/optimize.mjs blender/out/niten_loot.glb blender/out/niten_loot.opt.glb; python3 blender/fetch_tex.py; python3 blender/house.py; node tools/optimize.mjs blender/out/niten_house.glb blender/out/niten_house.opt.glb; }
# v0.10: внешние модели (исходники в $NITEN_SRC, см. blender/ext/cfg.py): blender/ext/prep.py + rig.py -> build_ext.py -> niten_ext.glb
[ "$SKIP_MODELS" = "1" ] || [ "$SKIP_EXT" = "1" ] || { python3 blender/ext/build_ext.py; RATIO=0.6 node tools/optimize.mjs blender/out/niten_ext.glb blender/out/niten_ext.opt.glb; }
# v0.12: локации (исходники в $NITEN_SRC/loc): blender/ext/locs.py -> niten_loc.glb (+ game/src/gN.js nav-сетки), v0.13: foliage.py (альфа листвы), текстуры -> WebP
# v0.13: звуки (tools/sfx.py: Kenney CC0 из $NITEN_SRC/sfx + синтез) -> blender/out/niten_sfx.json
[ "$SKIP_SFX" = "1" ] || python3 tools/sfx.py
[ "$SKIP_MODELS" = "1" ] || [ "$SKIP_LOC" = "1" ] || { for n in village sagano scifi portal manor; do python3 blender/ext/locs.py $n; done; python3 blender/ext/locs.py merge; python3 blender/ext/foliage.py; TEX=webp RATIO=1 node tools/optimize.mjs blender/out/niten_loc.glb blender/out/niten_loc.opt.glb; }
cat game/src/gA.js game/src/gN.js game/src/gL.js game/src/gB.js game/src/gC.js game/src/gD.js game/src/gE.js game/src/gS.js game/src/gI.js game/src/gH.js game/src/gAdm.js game/src/gF.js > game/src/game.js
npx esbuild game/src/game.js --bundle --minify --format=esm --target=es2022 --outfile=dist/niten.js --log-level=warning
python3 - "$ROOT" <<'PY'
import base64,os,sys
R=sys.argv[1];d=R+'/dist';os.makedirs(d+'/assets',exist_ok=True)
for f in os.listdir(d+'/assets'):os.remove(d+'/assets/'+f)
b64=base64.b64encode(open(R+'/blender/out/niten_assets.opt.glb','rb').read()).decode()
head='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NITEN: Путь Двух Душ — 3D</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{display:block}#hud{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:2}#ld{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#c9b88a;font:20px Georgia,serif;letter-spacing:4px}</style></head><body><div id="ld">ЗАГРУЗКА…</div>'
n=990000;parts=[b64[i:i+n] for i in range(0,len(b64),n)]
for i,p in enumerate(parts):open(d+'/assets/part%02d.js'%i,'w').write('(window.__NITEN_ASSETS_PARTS=window.__NITEN_ASSETS_PARTS||[]).push("'+p+'");\n')
lb=base64.b64encode(open(R+'/blender/out/niten_loot.opt.glb','rb').read()).decode() if os.path.exists(R+'/blender/out/niten_loot.opt.glb') else ''
lparts=[lb[i:i+n] for i in range(0,len(lb),n)]
for i,p in enumerate(lparts):open(d+'/assets/loot%02d.js'%i,'w').write('(window.__NITEN_LOOT_PARTS=window.__NITEN_LOOT_PARTS||[]).push("'+p+'");\n')
hb=base64.b64encode(open(R+'/blender/out/niten_house.opt.glb','rb').read()).decode() if os.path.exists(R+'/blender/out/niten_house.opt.glb') else ''
hparts=[hb[i:i+n] for i in range(0,len(hb),n)]
for i,p in enumerate(hparts):open(d+'/assets/house%02d.js'%i,'w').write('(window.__NITEN_HOUSE_PARTS=window.__NITEN_HOUSE_PARTS||[]).push("'+p+'");\n')
xb=base64.b64encode(open(R+'/blender/out/niten_ext.opt.glb','rb').read()).decode() if os.path.exists(R+'/blender/out/niten_ext.opt.glb') else ''
xparts=[xb[i:i+n] for i in range(0,len(xb),n)]
for i,p in enumerate(xparts):open(d+'/assets/ext%02d.js'%i,'w').write('(window.__NITEN_EXT_PARTS=window.__NITEN_EXT_PARTS||[]).push("'+p+'");\n')
cb=base64.b64encode(open(R+'/blender/out/niten_loc.opt.glb','rb').read()).decode() if os.path.exists(R+'/blender/out/niten_loc.opt.glb') else ''
cparts=[cb[i:i+n] for i in range(0,len(cb),n)]
for i,p in enumerate(cparts):open(d+'/assets/loc%02d.js'%i,'w').write('(window.__NITEN_LOC_PARTS=window.__NITEN_LOC_PARTS||[]).push("'+p+'");\n')
import json
# v0.13: звуковой банк (tools/sfx.py -> blender/out/niten_sfx.json) и музыка локаций ($NITEN_SRC/music/<ключ>.mp3)
sj=open(R+'/blender/out/niten_sfx.json').read() if os.path.exists(R+'/blender/out/niten_sfx.json') else ''
sparts=[sj[i:i+n] for i in range(0,len(sj),n)]
for i,p in enumerate(sparts):open(d+'/assets/sfx%02d.js'%i,'w').write('(window.__NITEN_SFX_PARTS=window.__NITEN_SFX_PARTS||[]).push('+json.dumps(p)+');\n')
MD=os.path.join(os.environ.get('NITEN_SRC','/data/src'),'music');MUS={};mfiles=[]
for k in('ash','forest','duel','house','boss'):
    fp=os.path.join(MD,k+'.mp3')
    if not os.path.exists(fp):continue
    mb=base64.b64encode(open(fp,'rb').read()).decode();MUS[k]=mb
    for i in range(0,len(mb),n):
        nm='mus_%s%02d.js'%(k,i//n);mfiles.append(nm);open(d+'/assets/'+nm,'w').write('(window.__NITEN_MUS=window.__NITEN_MUS||{});(window.__NITEN_MUS.%s=window.__NITEN_MUS.%s||[]).push("%s");\n'%(k,k,mb[i:i+n]))
src=open(d+'/niten.js').read();m=600000;gp=[src[i:i+m] for i in range(0,len(src),m)]
for i,p in enumerate(gp):open(d+'/assets/game%02d.js'%i,'w').write('(window.__NITEN_JS=window.__NITEN_JS||[]).push('+json.dumps(p)+');\n')
boot='<script>(function(){var s=document.createElement("script");s.type="module";s.src=URL.createObjectURL(new Blob([window.__NITEN_JS.join("")],{type:"text/javascript"}));document.body.appendChild(s)})()</script>'
open(d+'/index.html','w').write(head+''.join('<script src="assets/part%02d.js"></script>'%i for i in range(len(parts)))+''.join('<script src="assets/loot%02d.js"></script>'%i for i in range(len(lparts)))+''.join('<script src="assets/house%02d.js"></script>'%i for i in range(len(hparts)))+''.join('<script src="assets/ext%02d.js"></script>'%i for i in range(len(xparts)))+''.join('<script src="assets/loc%02d.js"></script>'%i for i in range(len(cparts)))+''.join('<script src="assets/sfx%02d.js"></script>'%i for i in range(len(sparts)))+''.join('<script src="assets/%s"></script>'%m for m in mfiles)+''.join('<script src="assets/game%02d.js"></script>'%i for i in range(len(gp)))+boot+'</body></html>')
js=open(d+'/niten.js').read().replace('</script','<\\/script')
open(R+'/NITEN_3D_single.html','w').write(head+'<script>window.__NITEN_ASSETS="'+b64+'";window.__NITEN_LOOT="'+lb+'";window.__NITEN_HOUSE="'+hb+'";window.__NITEN_EXT="'+xb+'";window.__NITEN_LOC="'+cb+'";window.__NITEN_SFX='+json.dumps(sj)+';window.__NITEN_MUS='+json.dumps(MUS)+'</script><script type="module">'+js+'</script></body></html>')
print('dist ok, parts:',len(parts))
PY
rm -f dist/niten.js
