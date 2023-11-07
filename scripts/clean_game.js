// clean_game.js:
//   Clean up by removing the folder into which we built a game

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Use the MODE environment variable to decide what to clean up
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let mode = process.env.MODE;
let folder = "";
if (mode === "DEV") {
    folder = path.join(root_folder, "dev-serve");
} else if (mode === "BUILD") {
    folder = path.join(root_folder, "dist");
} else {
    console.error("MODE environment variable must be DEV or BUILD");
    process.exit(1);
}

fs.rmSync(folder, { recursive: true, force: true });