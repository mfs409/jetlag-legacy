// build_slides.mjs:
//   Compile/bundle the web app for viewing slides, and also all of the 
//   slides

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import esbuildServe from 'esbuild-serve';
import { SLIDE_DIST_FOLDER } from './common.mjs';

// Compute paths to source and destination files for the slide viewer web app
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const webapp_src_folder = path.join(root_folder, "src", "viewer");
const webapp_src_ts = path.join(webapp_src_folder, "viewer.ts");
const dest_folder = path.join(root_folder, SLIDE_DIST_FOLDER);
const webapp_dest_ts = path.join(dest_folder, "viewer.js");

// CSS and HTML files that need to be copied without any translation
const src_static_files = [
    ["node_modules/katex/dist/", "katex.min.css"],
    ["node_modules/highlight.js/styles/", "arta.min.css"],
    ["slides/", "slides.html"],
    ["slides/", "slides.css"],
];

// Erase and re-build the output folder
fs.rmSync(dest_folder, { recursive: true, force: true });
fs.mkdirSync(dest_folder);

// Copy the static files to the destination folder
src_static_files.forEach(name => {
    fs.copyFileSync(path.join(root_folder, name[0], name[1]), path.join(dest_folder, name[1]))
});

// Compile the web app into the destination folder
esbuildServe({
    logLevel: "info",
    entryPoints: [webapp_src_ts],
    bundle: true,
    outfile: webapp_dest_ts,
    minify: true,
    sourcemap: false,
});

// Now it's time to set up the slides
const tut_src_folder = path.join(root_folder, "slides");
let slides = [
    { slide_name: "slide_example", code_name: undefined },
];

// First, copy the .md and subfolder
for (let t of slides) {
    let mdname = `${t.slide_name}.md`;
    let subfolder = `${t.slide_name}`;
    fs.copyFileSync(path.join(tut_src_folder, mdname), path.join(dest_folder, mdname));
    fs.cpSync(path.join(tut_src_folder, subfolder), path.join(dest_folder, subfolder), { recursive: true });
}

// Next, build each tutorial's game into the destination folder
for (let t of slides) {
    if (t.code_name) {
        build_game(t.code_name);
    }
}

// Finally, copy over the assets
fs.cpSync(path.join(root_folder, "assets"), path.join(dest_folder, "assets"), { recursive: true });

/**
 * Build the game whose name is given by `target`, saving it in `dest_folder`.
 * The expectation is that for a given `target`, this will produce `target.html`
 * and `target.js`.
 */
function build_game(target) {
    // Figure out path to the source of the target game/tutorial
    let src_folder = path.join(root_folder, "src", target);

    // Copy the html file
    fs.copyFileSync(path.join(src_folder, `${target}.html`), path.join(dest_folder, `${target}.html`));

    // Build the game into the destination folder
    esbuildServe({
        logLevel: "info",
        entryPoints: [path.join(src_folder, `${target}.ts`)],
        bundle: true,
        outfile: path.join(dest_folder, `${target}.js`),
        minify: true,
        sourcemap: false,
    });
}
