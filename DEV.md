# Developer Notes

Welcome to the "developer" branch of JetLag.  This branch has quite a few
pieces, and can be a bit confusing to understand at first.  This document
describes the layout and how to contribute.  

## Components

The developer branch contains the following pieces:

- The JetLag library (`src/jetlag`)
- A single set of assets (`assets`) for use in all demos and tutorials
- A demo that shows how to use the various JetLag features (`src/demo_game`)
- A web app for displaying markdown files as web pages, used for the tutorials
  (`src/viewer`)
- Documentation, generated by typedoc (`docs`)
- A series of tutorials.  The markdown source for each tutorial is in
  `tutorials`, and a live demo for each tutorial is in `/src`.  Note that the
  markdown, its subfolder in `tutorials`, and its subfolder in `src` must have
  the same name.

## Building, Running, and Cleaning

### The Demo Game

You can run a development server for the demo game via `npm run start-demo`.
This defaults to serving on port 7000.  To clean up from serving the demo game,
use `npm run clean-demo`.

### Tutorial Live Demos

To run a development server for a tutorial's live demo, use an environment
variable.  For example, on Linux, you can serve the "tut_getting_started" live
demo via `TARGET=tut_getting_started npm run start-dev`.  To clean up, use `npm run
clean-dev`.

### Release Versions (Demo Game and Tutorial Live Demos)

To build a release version of a game, use an environment variable.  For example,
on Linux, you can build the "demo_game" via `TARGET=demo_game npm run
build-game`.  To clean up, use `npm run clean-game`.

### Tutorial Viewer

To build a release version of the tutorial viewer use `npm run
build-tut-viewer`.  To clean up, use `npm run clean-tut-viewer`.

### Tutorial Website

To build the full tutorial website, with all demo games, use `npm run
build-tuts`.  To clean up, use `npm run clean-tuts`.  Note that this will build
the tutorial viewer.  The list of tutorials that will be built is in
`scripts/build_tuts.js`.

### Documentation

To build the latest version of the documentation, run `npm run clean-check`.
This will use `typedoc` to build documentation for everything in the
`src/jetlag` folder.

### Type Checking

Since we use `esbuild` to build and run JetLag games, strict type checking is
not done automatically.  Instead, you can check for errors via `npm run check`.
This will generate some temporary files, which you can remove via `npm run
clean-check`.

## Contributing

Please note that pull requests are never accepted in the main branch, only in
this branch

### Contributing a Feature to JetLag

To contribute a feature to JetLag, you will typically make changes to the
`src/jetlag` folder.  Then add a new level to the demo game in `src/demo_game`,
demonstrating how to use the new feature.

### Contributing a Tutorial

Below are the steps for contributing a tutorial on topic "X"

- Create a markdown file (`X.md`) in the `tutorials` folder.  Your tutorial
  should be written as a single markdown file.  If you have external file
  dependencies (such as images), they should go in a subfolder named
  `tutorials/X`.
- Create a demo game in `src/X`.  Typically you will just use the splash screen
  to demo your game.
- Update `tutorials/tutorials.html` so that it has a link to your tutorial.

## Deploying to Main

TODO: We need clean instructions for how to push a subset of this branch to the
main branch.

- Do not deploy the tutorials or documentation
- Deploy the documentation to a gh-pages branch instead
- Deploy the tutorials to another site instead
- Rename the `demo_game` folder
- Deploy a different build script that does not require `chokidar`
- Deploy the correct README files
- Clean up the package.json and tsconfig.json before deploying

## Contributors

The following people have contributed to JetLag and its predecessors, LibLOL and
ALE.  If you contributed, and we missed your name, please send a note reminding
us to give you credit!

- Mike Spear
- Dan Spear
- Greyson Parrelli
- Jennifer Bayzick
- Rachel Santangelo
- Micah Carlisle
- Maximilian Hasselbusch
- Jimmy Johnson
- Marc Soda
- Égide Ntwari
- Nana Nyanor
- Sebastian Chavarro