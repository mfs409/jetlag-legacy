// clean_check.mjs:
//   Clean up from a call to `npm run check`

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { TYPE_CHECK_FOLDER } from './common.mjs';

const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let folder = path.join(root_folder, TYPE_CHECK_FOLDER);
fs.rmSync(folder, { recursive: true, force: true });
