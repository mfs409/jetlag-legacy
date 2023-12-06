// clean_tuts.mjs:
//   Clean up by removing the folder into which we built the tutorial viewer and
//   tutorials

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DEV_OUTPUT_FOLDER, GAME_DIST_FOLDER, SLIDE_DIST_FOLDER, TUT_DIST_FOLDER, TYPE_CHECK_FOLDER } from './common.mjs';

// TODO:  If the scripts used the cli args, we could probably get by with fewer
//        scripts.  See `console.log(process.argv)` for a starting point.

// Compute the paths:
for (let f of [TYPE_CHECK_FOLDER, GAME_DIST_FOLDER, TUT_DIST_FOLDER, DEV_OUTPUT_FOLDER, SLIDE_DIST_FOLDER]) {
  const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
  fs.rmSync(folder, { recursive: true, force: true });
}
