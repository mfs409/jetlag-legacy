// serve_game.mjs: 
//   Serve (development mode) the game specified by the TARGET environment
//   variable.  This script watches for changes to the code and automatically
//   re-builds / refreshes the browser.  Note that, unfortunately, on changes to
//   the game's main HTML file or assets, it does not know to automatically
//   refresh the browser.  In those cases, you'll need to manually refresh.

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as chokidar from 'chokidar';
import esbuildServe from 'esbuild-serve';
import { DEV_OUTPUT_FOLDER } from './common.mjs';

// Compute the root folder of this project (`import.meta.url` is the path to
// *this file*, which is assumed to be in the `scripts/` subfolder of the root).
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Query the environment to figure out which of the games/tutorials to build.
// If none is provided, default to the demo game.
let target = process.env.TARGET;
if (!target) {
    target = "demo_game";
}
console.log(`Launching a development server for ${target}`);

// Figure out path to the source of the target game/tutorial, the name of its
// index.html, the name of its entry .ts file, and the path to the assets folder
let src_folder = path.join(root_folder, "src", target);
let src_html = path.join(src_folder, `${target}.html`);
let src_ts = path.join(src_folder, `${target}.ts`);
let src_assets = path.join(root_folder, "assets");

// Figure out the paths where everything is going to be put
let dest_folder = path.join(root_folder, DEV_OUTPUT_FOLDER);
let dest_html = path.join(dest_folder, "index.html");
let dest_js = path.join(dest_folder, `${target}.js`);
let dest_assets = path.join(dest_folder, "assets");

// Erase the destination folder, then re-create it
fs.rmSync(dest_folder, { recursive: true, force: true });
fs.mkdirSync(dest_folder);

// Copy the html file and the assets folder
fs.copyFileSync(src_html, dest_html);
fs.cpSync(src_assets, dest_assets, { recursive: true });

// Build the game into the destination folder
esbuildServe({
    logLevel: "info",
    entryPoints: [src_ts],
    bundle: true,
    outfile: dest_js,
    minify: false,
    sourcemap: true,
}, {
    port: 7000,
    root: dest_folder,
});

// When used in this way, esbuildServe doesn't know that it needs to watch the
// assets folder for changes, nor does it know that it needs to watch the game's
// html file.  To get that to work, we'll use chokidar.

// When chokidar sees a change, it will run this to erase the destination assets
// folder, re-copy the destination assets folder, and re-copy the html file.
let rebuild = function () {
    fs.rmSync(dest_assets, { recursive: true, force: true });
    fs.copyFileSync(src_html, dest_html);
    fs.cpSync(src_assets, dest_assets, { recursive: true });
}

// Set up chokidar to watch the source folder (where the html file is) and the
// assets folder.  On any insert/remove/modification, call rebuild()
//
// TODO: chokidar is choking on src_assets... what can we do about that?
var watcher = chokidar.watch([src_folder/*, src_assets*/], { ignored: /^\./, persistent: true });
watcher.on('add', rebuild)
    .on('change', rebuild)
    .on('unlink', rebuild)
    .on('error', function (error) { console.error('Unexpected error:', error); })
