import * as fs from 'fs';
import { DEST_FOLDER, DBG_BUNDLE_FILE, DBG_MAP_FILE } from './config.mjs';

// This script "cleans up", by deleting the folder where we put everything when
// we are building the "production" version of the code, as well as the files we
// made while creating the "debug" version of the code.

fs.rmSync(DEST_FOLDER, { recursive: true, force: true });
fs.rmSync(DBG_BUNDLE_FILE, { force: true });
fs.rmSync(DBG_MAP_FILE, { force: true });