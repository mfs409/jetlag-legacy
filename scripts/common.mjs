// common.mjs:
//   Constants and other common code/configuration used by scripts

import * as fs from 'fs';
import * as chokidar from 'chokidar';
import esbuildServe from 'esbuild-serve';

/** 
 * The folder where we put build files when serving a game in development mode
 */
export const DEV_OUTPUT_FOLDER = "dev-serve";

/**
 * The folder where we put build files when preparing tutorials for distribution
 */
export const TUT_DIST_FOLDER = "tut-dist";

/**
 * The folder where we put build files when making a single game for
 * distribution
 */
export const GAME_DIST_FOLDER = "dist";

/** The folder where `npm run check` will put its outputs */
export const TYPE_CHECK_FOLDER = "check";

/**
 * Run a development server that builds the game specified by the `src`
 * parameters, placing it into the folder specified by the `dest` parameters.
 * - Automatically rebuilds code and sends a refresh to the browser when a
 *   source file changes.
 * - Automatically updates the `dest` folder to keep the HTML file and assets
 *   folder up to date, but does not auto-refresh the browser on these changes.
 *
 * @param src   The source folder, html file, ts file, and asset folder paths
 * @param dest  The destination folder, html file, js file, and asset folder
 *              paths
 */
export function run_dev_server(src, dest) {
  // Erase the destination folder, then re-create it
  fs.rmSync(dest.folder, { recursive: true, force: true });
  fs.mkdirSync(dest.folder);

  // Copy the html file and the assets folder
  fs.copyFileSync(src.html, dest.html);
  fs.cpSync(src.assets, dest.assets, { recursive: true });

  // Build the game into the destination folder
  esbuildServe(
    { logLevel: "info", entryPoints: [src.ts], bundle: true, outfile: dest.js, minify: false, sourcemap: true },
    { port: 7000, root: dest.folder }
  );

  // When used in this way, esbuildServe doesn't know that it needs to watch the
  // assets folder for changes, nor does it know that it needs to watch the game's
  // html file.  To get that to work, we'll use chokidar.

  // When chokidar sees a change, it will run this to erase the destination assets
  // folder, re-copy the destination assets folder, and re-copy the html file.
  let rebuild = () => {
    fs.rmSync(dest.assets, { recursive: true, force: true });
    fs.copyFileSync(src.html, dest.html);
    fs.cpSync(src.assets, dest.assets, { recursive: true });
  }

  // Set up chokidar to watch the source folder (where the html file is) and the
  // assets folder.  On any insert/remove/modification, call rebuild()
  //
  // Warning: if src_assets is very big, this will take a long time
  let watcher = chokidar.watch([src.folder, src.assets], { ignored: /^\./, persistent: true });
  watcher.on('add', rebuild)
    .on('change', rebuild)
    .on('unlink', rebuild)
    .on('error', function (error) { console.error('Unexpected error:', error); })
}

/**
 * Build and bundle (production mode) the game specified by the `src`
 * parameters, placing it into the folder specified by the `dest` parameter.
 *
 * @param src   The source folder, html file, ts file, and asset folder paths
 * @param dest  The destination folder, html file, js file, and asset folder
 *              paths
 */
export function production_builder(src, dest) {
  // Try to make the destination folder.  Don't erase it first, since we
  // sometimes build several things into one place
  fs.mkdirSync(dest.folder, { recursive: true });

  // Copy the html file and the assets folder
  //
  // NB:  This will try to overwrite the assets folder, which is OK
  fs.copyFileSync(src.html, dest.html);
  fs.cpSync(src.assets, dest.assets, { recursive: true });

  // Build the game into the destination folder
  esbuildServe({
    logLevel: "info",
    entryPoints: [src.ts],
    bundle: true,
    outfile: dest.js,
    minify: true,
    sourcemap: false,
  });
}