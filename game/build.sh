cd /data/n3d && cat src/gA.js src/gB.js src/gC.js src/gD.js src/gE.js src/gF.js > src/game.js && npx esbuild src/game.js --bundle --minify --outfile=game.min.js --log-level=warning && python3 -c "
js=open('/data/n3d/game.min.js').read()
html='<!doctype html><html lang=\"ru\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>NITEN: Путь Двух Душ — 3D</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{display:block}#hud{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none}</style></head><body><script>'+js.replace('</script','<\\\\/script')+'</script></body></html>'
open('/data/n3d/niten3d.html','w').write(html)"
