import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * The root folder of this project.  
 *
 * NB: `import.meta.url` is the path to *this file*, which we assume is in the
 *     `scripts` subfolder of the root.
 */
const ROOT_FOLDER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The location where the developer's index.html can be found */
export const SRC_INDEX_FILE = path.join(ROOT_FOLDER, "index.html");

/** The location where the developer's assets folder can be found */
export const SRC_ASSETS_FOLDER = path.join(ROOT_FOLDER, "assets");

/** The location of the file that serves as the program entry point */
export const SRC_ENTRY_FILE = path.join(ROOT_FOLDER, "src", "index.ts");

/** In debug mode, the place where the compiled code should go */
export const DBG_BUNDLE_FILE = path.join(ROOT_FOLDER, "bundle.js");

/** In debug mode, the place where the compiled source map should go */
export const DBG_MAP_FILE = path.join(ROOT_FOLDER, "bundle.js.map");

/** In production mode, the folder where everything should go */
export const DEST_FOLDER = path.join(ROOT_FOLDER, "dist");
/** In production mode, the output location of the index.html file */
export const DEST_INDEX_FILE = path.join(DEST_FOLDER, "index.html");

/** In production mode, the output location of the assets folder */
export const DEST_ASSETS_FOLDER = path.join(DEST_FOLDER, "assets");

/** In production mode, the place where the compiled code should go */
export const DEST_BUNDLE_FILE = path.join(DEST_FOLDER, "bundle.js");