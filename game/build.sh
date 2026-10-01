#!/usr/bin/env bash
# Сборка игры: модели (Blender) -> оптимизация (meshopt) -> бандл (esbuild) -> dist/ и single-file HTML.
# Требования: python3 + pip install bpy==5.2.2 numpy pillow ; node 18+ ; npm install
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)";cd "$ROOT"
[ "$SKIP_MODELS" = "1" ] || { python3 blender/build.py; node tools/optimize.mjs blender/out/niten_assets.glb blender/out/niten_assets.opt.glb; python3 blender/loot.py; node tools/optimize.mjs blender/out/niten_loot.glb blender/out/niten_loot.opt.glb; }
cat game/src/gA.js game/src/gB.js game/src/gC.js game/src/gD.js game/src/gE.js game/src/gS.js game/src/gI.js game/src/gF.js > game/src/game.js
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
import json
src=open(d+'/niten.js').read();m=600000;gp=[src[i:i+m] for i in range(0,len(src),m)]
for i,p in enumerate(gp):open(d+'/assets/game%02d.js'%i,'w').write('(window.__NITEN_JS=window.__NITEN_JS||[]).push('+json.dumps(p)+');\n')
boot='<script>(function(){var s=document.createElement("script");s.type="module";s.src=URL.createObjectURL(new Blob([window.__NITEN_JS.join("")],{type:"text/javascript"}));document.body.appendChild(s)})()</script>'
open(d+'/index.html','w').write(head+''.join('<script src="assets/part%02d.js"></script>'%i for i in range(len(parts)))+''.join('<script src="assets/loot%02d.js"></script>'%i for i in range(len(lparts)))+''.join('<script src="assets/game%02d.js"></script>'%i for i in range(len(gp)))+boot+'</body></html>')
js=open(d+'/niten.js').read().replace('</script','<\\/script')
open(R+'/NITEN_3D_single.html','w').write(head+'<script>window.__NITEN_ASSETS="'+b64+'";window.__NITEN_LOOT="'+lb+'"</script><script type="module">'+js+'</script></body></html>')
print('dist ok, parts:',len(parts))
PY
rm -f dist/niten.js
