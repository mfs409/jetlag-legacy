// deploy_game.mjs: 
//   Compile/bundle the game that is in the `src/game` folder.

import * as path from 'path';
import { fileURLToPath } from 'url';
import { GAME_DIST_FOLDER, production_builder } from './common.mjs';

// Compute the root folder of this project (`import.meta.url` is the path to
// *this file*, which is assumed to be in the `scripts/` subfolder of the root).
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Build the code in the `game` folder
const target = "game";
console.log(`Building ${target}`);

// Compute the source and destination folders
const src_folder = path.join(root_folder, "src", target);
const dest_folder = path.join(root_folder, GAME_DIST_FOLDER);

// Figure out paths to the game's main `ts` file, its `html` file, and its
// `assets` folder
const src = {
    folder: src_folder,
    html: path.join(src_folder, `${target}.html`),
    ts: path.join(src_folder, `${target}.ts`),
    assets: path.join(root_folder, "assets"),
};

// Figure out the paths where everything is going to be put
const dest = {
    folder: dest_folder,
    html: path.join(dest_folder, `${target}.html`),
    js: path.join(dest_folder, `${target}.js`),
    assets: path.join(dest_folder, "assets"),
};

// Build the game
production_builder(src, dest);