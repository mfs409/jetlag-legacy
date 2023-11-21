// clean_game.mjs:
//   Clean up by removing the folder into which we built a game

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { DEV_OUTPUT_FOLDER, GAME_DIST_FOLDER } from './common.mjs';

// Use the MODE environment variable to decide what to clean up
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let mode = process.env.MODE;
let folder = "";
if (mode === "DEV") {
    folder = path.join(root_folder, DEV_OUTPUT_FOLDER);
} else if (mode === "BUILD") {
    folder = path.join(root_folder, GAME_DIST_FOLDER);
} else {
    console.error("MODE environment variable must be DEV or BUILD");
    process.exit(1);
}

fs.rmSync(folder, { recursive: true, force: true });
