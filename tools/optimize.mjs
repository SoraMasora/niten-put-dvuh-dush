// Оптимизация GLB: дедупликация, сварка вершин, квантование и сжатие meshopt.
// node tools/optimize.mjs in.glb out.glb
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld,quantize,meshopt,reorder,simplify} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready;await MeshoptSimplifier.ready;const RATIO=+(process.env.RATIO||0.55);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const [,,inp,out]=process.argv;const doc=await io.read(inp);
await doc.transform(dedup(),prune({keepLeaves:true}),weld(),simplify({simplifier:MeshoptSimplifier,ratio:RATIO,error:0.0006}),reorder({encoder:MeshoptEncoder}),quantize({quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}),meshopt({encoder:MeshoptEncoder,level:'high'}));
await io.write(out,doc);
const r=doc.getRoot();let tex=0;for(const t of r.listTextures())tex+=t.getImage().byteLength;
console.log('meshes',r.listMeshes().length,'textures',r.listTextures().length,'texbytes',tex);
