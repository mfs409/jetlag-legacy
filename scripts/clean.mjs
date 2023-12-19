// clean_tuts.mjs:
//   Clean up by removing all the output folders that aren't tracked in git

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DEV_OUTPUT_FOLDER, GAME_DIST_FOLDER, TYPE_CHECK_FOLDER } from './common.mjs';

// Compute the paths:
for (let f of [TYPE_CHECK_FOLDER, GAME_DIST_FOLDER, DEV_OUTPUT_FOLDER]) {
  const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
  fs.rmSync(folder, { recursive: true, force: true });
}
