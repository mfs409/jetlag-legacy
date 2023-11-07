// clean_check.js:
//   Clean up from a call to `npm run check`

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Use the MODE environment variable to decide what to clean up
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let folder = path.join(root_folder, "check");
fs.rmSync(folder, { recursive: true, force: true });