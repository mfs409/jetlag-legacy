// build_game.js: 
//   Compile/bundle the game specified by the TARGET environment variable

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import esbuildServe from 'esbuild-serve';

// Compute the root folder of this project (`import.meta.url` is the path to
// *this file*, which is assumed to be in the `scripts/` subfolder of the root).
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Query the environment to figure out which of the games/tutorials to build.
// If none is provided, print a message and exit
let target = process.env.TARGET;
if (!target) {
    console.error("Error: You must provide the name of the folder to build, via the TARGET environment variable");
    process.exit(1);
}
console.log(`Building ${target}`);

// Figure out path to the source of the target game/tutorial, the name of its
// index.html, the name of its entry .ts file, and the path to the assets folder
let src_folder = path.join(root_folder, "src", target);
let src_html = path.join(src_folder, `${target}.html`);
let src_ts = path.join(src_folder, `${target}.ts`);
let src_assets = path.join(root_folder, "assets");

// Figure out the paths where everything is going to be put.  Note that we
// preserve the target html name.
let dest_folder = path.join(root_folder, "dist");
let dest_html = path.join(dest_folder, `${target}.html`);
let dest_js = path.join(dest_folder, `${target}.js`);
let dest_assets = path.join(dest_folder, "assets");

// Try to make the destination folder
//
// NB:  We don't erase the destination folder, because we want to be able to
//      build several things into it
fs.mkdirSync(dest_folder, { recursive: true });

// Copy the html file and the assets folder
//
// NB:  This will try to overwrite the assets folder, which is OK
fs.copyFileSync(src_html, dest_html);
fs.cpSync(src_assets, dest_assets, { recursive: true });

// Build the game into the destination folder
esbuildServe({
    logLevel: "info",
    entryPoints: [src_ts],
    bundle: true,
    outfile: dest_js,
    minify: true,
    sourcemap: false,
});