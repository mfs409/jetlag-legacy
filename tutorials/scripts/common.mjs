import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import esbuildServe from 'esbuild-serve';

/**
 * The root folder of this project.  `import.meta.url` is the path to *this
 * file*, which we assume is in a subfolder at depth 1 from the root.
 */
const ROOT_FOLDER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The location of the main `.js` file for the web app */
const SRC_ENTRY_FILE = path.join(ROOT_FOLDER, "webapp-src", "index.js");

/** The folder where everything should go */
const DIST_FOLDER = path.join(ROOT_FOLDER, "dist");

/** The file name for the compiled webapp */
const PROD_BUNDLE_FILE = path.join(DIST_FOLDER, "bundle.js");

/** The names of files that need to be copied directly to DIST_FOLDER */
const CSS_DEPENDENCIES = [
    ["node_modules/katex/dist/", "katex.min.css"],
    ["node_modules/highlight.js/styles/", "arta.min.css"],
];

/**
 * Copy the contents of a folder into the DIST folder
 *
 * NB:  This is currently unused.  It's just here as a reference in case we ever
 *      need it.
 *
 * @param relative_folder_name  The path (relative to ROOT_FOLDER) of the folder
 *                              to copy
 */
function copy_folder(relative_folder_name) {
    let folder = path.join(ROOT_FOLDER, relative_folder_name);
    fs.readdirSync(folder).forEach(file =>
        fs.copyFileSync(path.join(folder, file), path.join(DIST_FOLDER, file)));
}

/** Delete the DIST folder.  Equivalent to `rm -rf` */
export function clean_dist_folder() {
    fs.rmSync(DIST_FOLDER, { recursive: true, force: true });
}

/**
 * Erase and re-create the `dist` folder with a compiled version of the webapp
 * source, along with its static pieces.
 */
export function build_to_dist() {
    // Erase and re-build the DIST folder
    clean_dist_folder();
    fs.mkdirSync(DIST_FOLDER);

    // Copy the static CSS files to the DIST folder
    CSS_DEPENDENCIES.forEach(name => {
        fs.copyFileSync(path.join(ROOT_FOLDER, name[0], name[1]), path.join(DIST_FOLDER, name[1]))
    });

    // Compile the web app into the DIST folder
    esbuildServe({
        logLevel: "info",
        entryPoints: [SRC_ENTRY_FILE],
        bundle: true,
        outfile: PROD_BUNDLE_FILE,
        minify: true,
        sourcemap: false,
    });
}