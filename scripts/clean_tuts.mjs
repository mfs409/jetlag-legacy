// clean_tuts.mjs:
//   Clean up by removing the folder into which we built the tutorial viewer and
//   tutorials

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TUT_DIST_FOLDER } from './common.mjs';

// Compute the path to the tutorial output folder
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest_folder = path.join(root_folder, TUT_DIST_FOLDER);

fs.rmSync(dest_folder, { recursive: true, force: true });
