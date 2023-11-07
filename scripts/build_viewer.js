// build_viewer.js:
//   Compile/bundle the web app for viewing tutorials

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import esbuildServe from 'esbuild-serve';

// Compute paths to source and destination files
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src_folder = path.join(root_folder, "src", "viewer");
const src_ts = path.join(src_folder, "viewer.ts");
const dest_folder = path.join(root_folder, "tut-dist");
const dest_ts = path.join(dest_folder, "viewer.js");

// CSS and HTML files that need to be copied without any translation
const src_static_files = [
    ["node_modules/katex/dist/", "katex.min.css"],
    ["node_modules/highlight.js/styles/", "arta.min.css"],
    ["tutorials/", "tutorials.html"],
    ["tutorials/", "tutorials.css"],
];

// Erase and re-build the output folder
fs.rmSync(dest_folder, { recursive: true, force: true });
fs.mkdirSync(dest_folder);

// Copy the static CSS files to the DIST folder
src_static_files.forEach(name => {
    fs.copyFileSync(path.join(root_folder, name[0], name[1]), path.join(dest_folder, name[1]))
});

// Compile the web app into the DIST folder
esbuildServe({
    logLevel: "info",
    entryPoints: [src_ts],
    bundle: true,
    outfile: dest_ts,
    minify: true,
    sourcemap: false,
});