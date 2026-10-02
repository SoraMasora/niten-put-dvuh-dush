// Распаковка оптимизированного GLB (meshopt + квантование) в обычный GLB для повторного импорта в Blender.
// node tools/decode.mjs in.opt.glb out.glb
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dequantize} from '@gltf-transform/functions';import {MeshoptDecoder} from 'meshoptimizer';
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const [,,inp,out]=process.argv;const doc=await io.read(inp);await doc.transform(dequantize());
for(const e of doc.getRoot().listExtensionsUsed())if(/meshopt|quantization/.test(e.extensionName))e.dispose();
await io.write(out,doc);console.log('decoded',out);
