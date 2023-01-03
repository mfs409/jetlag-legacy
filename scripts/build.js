import * as fs from 'fs';
import esbuildServe from "esbuild-serve";
import {
    DEST_FOLDER, DEST_INDEX_FILE, SRC_INDEX_FILE, SRC_ASSETS_FOLDER,
    DEST_ASSETS_FOLDER, SRC_ENTRY_FILE, DEST_BUNDLE_FILE
} from './config.mjs';

// This script creates a "distribution" folder, copies the static parts of the
// web app into it, and then compiles the TypeScript code into that folder,
// resulting in a fully-deployable web app in DEST_FOLDER.

fs.rmSync(DEST_FOLDER, { recursive: true, force: true });
fs.mkdirSync(DEST_FOLDER);
fs.copyFileSync(SRC_INDEX_FILE, DEST_INDEX_FILE);
fs.cpSync(SRC_ASSETS_FOLDER, DEST_ASSETS_FOLDER, { recursive: true });

esbuildServe({
    logLevel: "info",
    entryPoints: [SRC_ENTRY_FILE],
    bundle: true,
    outfile: DEST_BUNDLE_FILE,
    minify: true,
    sourcemap: false,
});
