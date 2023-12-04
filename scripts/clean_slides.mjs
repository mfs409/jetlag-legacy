// clean_slides.mjs:
//   Clean up by removing the folder into which we built the slide viewer and
//   slides

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SLIDE_DIST_FOLDER } from './common.mjs';

// Compute the path to the slide output folder
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest_folder = path.join(root_folder, SLIDE_DIST_FOLDER);

fs.rmSync(dest_folder, { recursive: true, force: true });
