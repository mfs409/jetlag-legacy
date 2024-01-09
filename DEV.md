# Developer Notes

Welcome to the "developer" branch of JetLag.  This branch has quite a few
pieces, and can be a bit confusing to understand at first.  This document
describes the layout and how to contribute.  

## Components

The developer branch contains the following pieces:

- The JetLag library (`src/jetlag`)
- A starter game (`src/game`) with assets (`assets/`)
- A series of tutorials.  The markdown source for each tutorial is in
  `tutorials`, and a live demo for each tutorial is in `/src/tutorials`.
  Note that the markdown, its subfolder in `tutorials`, and its files in
  `src` must have the same base name.
- A set of assets (`tut_assets`) for use in the tutorials
- A web app for displaying markdown files as web pages, used for the tutorials
  (`src/viewer`)
- Documentation, generated by typedoc (`docs`)

## Building, Running, and Cleaning

Run `npm run help` to get instructions on building, running, and cleaning.

Note that since we use `esbuild` to build and run JetLag games, strict type
checking is not done automatically.  Instead, you can check for errors via
`npm run check`.  This will generate some temporary files, which you can
remove via `npm run clean-check`.

## Contributing

Please note that pull requests are never accepted in the main branch, only in
this branch

### Contributing a Feature to JetLag

To contribute a feature to JetLag, you will typically make changes to the
`src/jetlag` folder.  Then add or update a tutorial.

### Contributing a Tutorial

Below are the steps for contributing a tutorial on topic "X"

- Create a markdown file (`X.md`) in the `tutorials` folder.  Your tutorial
  should be written as a single markdown file.  If you have external file
  dependencies (such as images), they should go in a subfolder named
  `tutorials/X`.
- Create a demo game in `src/tutorials/X.ts`.  Typically you will just use
  the splash screen to demo your game.  Be sure to also create
  `src/tutorials/X.html`
- Update `tutorials/tutorials.html` so that it has a link to your tutorial.

## Deploying to Main

Right now, this is a manual process.  Barring major changes, the only things
that will need to be deployed are:

- src/jetlag
- docs
- src/game