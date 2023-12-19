// serve_tut.mjs: 
//   Serve (development mode) the tutorial specified by the TUT environment
//   variable.  This is only intended for internal development of tutorials.
//
//   This script watches for changes to the code and automatically re-builds /
//   refreshes the browser.  Note that, unfortunately, on changes to the game's
//   main HTML file or assets, it does not know to automatically refresh the
//   browser.  In those cases, you'll need to manually refresh.

import * as path from 'path';
import { fileURLToPath } from 'url';
import { DEV_OUTPUT_FOLDER, run_dev_server } from './common.mjs';

// Compute the root folder of this project (`import.meta.url` is the path to
// *this file*, which is assumed to be in the `scripts/` subfolder of the root).
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Compute the source and destination folders
const src_folder = path.join(root_folder, "src", "tutorials");
const dest_folder = path.join(root_folder, DEV_OUTPUT_FOLDER);

// Query the environment to figure out which of the games/tutorials to build.
// If none is provided, default to the demo game.
const target = process.env.TUT;
if (!target) {
    throw "You must define the TUT environment variable";
}
console.log(`Launching a development server for ${target}`);

// Figure out paths to the tutorial's main `ts` file, its `html` file, and its
// `assets` folder
const src = {
    folder: src_folder,
    html: path.join(src_folder, `${target}.html`),
    ts: path.join(src_folder, `${target}.ts`),
    assets: path.join(root_folder, "tut_assets"),
}

// Figure out the paths where everything is going to be put
const dest = {
    folder: dest_folder,
    html: path.join(dest_folder, "index.html"),
    js: path.join(dest_folder, `${target}.js`),
    assets: path.join(dest_folder, "assets"),
}

// Launch the development server
run_dev_server(src, dest);