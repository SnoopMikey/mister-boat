import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

async function clean() {
  if (existsSync(DIST)) await rm(DIST, { recursive: true });
  await mkdir(DIST, { recursive: true });
}

async function copyStatic() {
  await cp(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });
  await writeFile(path.join(DIST, '.nojekyll'), '');
}

async function vendorReact() {
  const dst = path.join(DIST, 'vendor');
  await mkdir(dst, { recursive: true });
  await cp(
    path.join(ROOT, 'node_modules/react/umd/react.production.min.js'),
    path.join(dst, 'react.production.min.js')
  );
  await cp(
    path.join(ROOT, 'node_modules/react-dom/umd/react-dom.production.min.js'),
    path.join(dst, 'react-dom.production.min.js')
  );
}

async function buildScripts() {
  // Transpile JSX → JS for each source file (no bundling — they rely on window globals,
  // same pattern as the prototype). esbuild just strips JSX and minifies.
  await esbuild.build({
    entryPoints: [
      path.join(SRC, 'tweaks-panel.jsx'),
      path.join(SRC, 'app.jsx'),
    ],
    outdir: DIST,
    bundle: false,
    minify: true,
    target: ['es2020'],
    loader: { '.jsx': 'jsx' },
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    outExtension: { '.js': '.js' },
  });
}

async function hashFile(p) {
  const buf = await readFile(p);
  return createHash('sha256').update(buf).digest('hex').slice(0, 10);
}

async function writeIndexAndSW() {
  const html = await readFile(path.join(ROOT, 'public/index.html'), 'utf8');
  // Cache-bust script refs with content hashes so SW updates pick up new code.
  const scripts = ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js',
                   'ios-frame.js', 'tweaks-panel.js', 'app.js'];
  const hashes = {};
  for (const s of scripts) hashes[s] = await hashFile(path.join(DIST, s));
  let out = html;
  for (const [s, h] of Object.entries(hashes)) {
    out = out.replaceAll(`"${s}"`, `"${s}?v=${h}"`);
  }
  await writeFile(path.join(DIST, 'index.html'), out);

  // Build service worker with a cache version bound to the bundle hashes.
  const swTpl = await readFile(path.join(ROOT, 'public/sw.js'), 'utf8');
  const version = createHash('sha256').update(Object.values(hashes).join('|')).digest('hex').slice(0, 10);
  const urls = [
    './',
    'index.html',
    'manifest.webmanifest',
    'assets/mister-boat-clean.png',
    'assets/mister-boat-waterline.png',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/apple-touch-icon.png',
    ...scripts.map((s) => `${s}?v=${hashes[s]}`),
  ];
  const sw = swTpl
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify(urls));
  await writeFile(path.join(DIST, 'sw.js'), sw);
}

await clean();
await vendorReact();
await buildScripts();
await copyStatic();
await writeIndexAndSW();
console.log('Built → dist/');
