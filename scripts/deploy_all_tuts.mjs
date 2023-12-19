// deploy_all_tuts.mjs:
//   - Compile/bundle the web app for viewing tutorials to the destination
//     folder
//   - Compile/bundle all of the tutorials to the destination folder
//   - Copy the static tutorial website to the destination folder

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import esbuildServe from 'esbuild-serve';
import { TUT_DIST_FOLDER } from './common.mjs';

// Compute paths to source and destination files for the tutorial viewer web app
const root_folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Compute the destination folder where everything goes
const dest_folder = path.join(root_folder, TUT_DIST_FOLDER);

// Compute source folder for the webapp
const webapp_src_folder = path.join(root_folder, "src", "viewer");

// Figure out the paths to the markdown viewer's main `ts` file and the static
// CSS/HTML files it needs to copy
const webapp_src = {
  folder: webapp_src_folder,
  ts: path.join(webapp_src_folder, "viewer.ts"),
  static_files: [
    ["node_modules/katex/dist/", "katex.min.css"],
    ["node_modules/highlight.js/styles/", "arta.min.css"],
    ["tutorials/", "tutorials.html"],
    ["tutorials/", "tutorials.css"],
  ],
}

// Figure out the paths for the output from building the markdown viewer
const webapp_dest = {
  folder: dest_folder,
  ts: path.join(dest_folder, "viewer.js"),
}

// Erase and re-build the output folder
fs.rmSync(dest_folder, { recursive: true, force: true });
fs.mkdirSync(dest_folder);

// Build the web app
build_web_app(root_folder, webapp_src, webapp_dest);

// Now it's time to set up the tutorials
const tut_src = {
  folder: path.join(root_folder, "tutorials"),
  code: [
    "assets_audio_animations", "collisions", "endless_runner_game",
    "gestures", "getting_started", "joints",
    "maze_game", "movement_physics", "overhead_fight_farm_game",
    "overview", "package_desktop", "package_mobile",
    "platformer_game", "projectiles", "roles",
    "score", "simulation_conway", "stage_transitions",
    "storage", "svg", "text_hud",
    "timers",
  ],
  md: [
    "assets_audio_animations.md", "camera_gravity.md", "collisions.md",
    "endless_runner_game.md", "gestures.md", "getting_started.md",
    "joints.md", "maze_game.md", "movement_physics.md",
    "overhead_fight_farm_game.md", "overview.md", "package_desktop.md",
    "package_mobile.md", "platformer_game.md", "projectiles.md",
    "roles.md", "score.md", "simulation_conway.md",
    "stage_transitions.md", "storage.md", "svg.md",
    "text_hud.md", "timers.md",
  ],
};

// First, copy the .md and subfolder
for (let t of tut_src.md) {
  let md = `${t}.md`;
  let folder = `${t}`;
  fs.copyFileSync(path.join(tut_src.folder, md), path.join(dest_folder, md));
  fs.cpSync(path.join(tut_src.folder, folder), path.join(dest_folder, folder), { recursive: true });
}

// Next, build each tutorial's game into the destination folder
for (let t of tut_src.code) {
  build_tutorial_game(t);
}

// Finally, copy over the assets
fs.cpSync(path.join(root_folder, "tut_assets"), path.join(dest_folder, "assets"), { recursive: true });

/**
 * Build the game whose name is given by `target`, saving it in `dest_folder`.
 * The expectation is that for a given `target`, this will produce `target.html`
 * and `target.js`.
 */
function build_tutorial_game(target) {
  // Figure out path to the source of the target game/tutorial
  let src_folder = path.join(root_folder, "src", "tutorials");

  // Copy the html file
  fs.copyFileSync(path.join(src_folder, `${target}.html`), path.join(dest_folder, `${target}.html`));

  // Build the game into the destination folder
  esbuildServe({
    logLevel: "info",
    entryPoints: [path.join(src_folder, `${target}.ts`)],
    bundle: true,
    outfile: path.join(dest_folder, `${target}.js`),
    minify: true,
    sourcemap: false,
  });
}

/**
 * Build the markdown viewer web app
 *
 * @param root  The path to the root of the repository
 * @param src   The source folder and ts file paths, and the paths to static
 *              files that need to be copied.
 * @param dest  The destination folder and js file paths
 */
function build_web_app(root, src, dest) {
  // Copy the static files to the destination folder
  src.static_files.forEach(name => {
    fs.copyFileSync(path.join(root, name[0], name[1]), path.join(dest.folder, name[1]))
  });

  // Compile the web app into the destination folder
  esbuildServe({
    logLevel: "info",
    entryPoints: [src.ts],
    bundle: true,
    outfile: dest.ts,
    minify: true,
    sourcemap: false,
  });
}
