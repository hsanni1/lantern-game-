// Package the same static viewer as a portable HTML file, including Three.js.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const js = await build({ entryPoints: ['main.js'], bundle: true, minify: true, format: 'iife', write: false });
const css = await build({ entryPoints: ['style.css'], bundle: true, minify: true, loader: { '.woff2': 'dataurl' }, write: false });
const template = await readFile('index.html', 'utf8');
const modelPath = template.match(/data-kimono-model="([^"]+)"/)[1];
const model = await readFile(modelPath);
const page = template
  .replace(modelPath, () => 'data:model/gltf-binary;base64,' + model.toString('base64'))
  .replace('<link rel="stylesheet" href="style.css">', () => '<style>' + css.outputFiles[0].text + '</style>')
  .replace(/<script type="importmap">[\s\S]*?<\/script>/, '')
  .replace(/<script type="module" id="village-entry">[\s\S]*?<\/script>/, () => '<script>' + js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>');
await mkdir('dist', { recursive: true });
const licenses = await Promise.all(['fonts/DMSans-OFL.txt', 'fonts/InstrumentSerif-OFL.txt', 'node_modules/three/LICENSE']
  .map(path => readFile(path, 'utf8')));
await writeFile('dist/index.html', page.replace('</html>', () => '<!-- Bundled asset licenses\n' + licenses.join('\n') + '\n-->\n</html>'));
