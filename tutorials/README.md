# JetLag Tutorials

This folder holds a simple web app for displaying a custom markdown flavor.  It
also has all of our tutorials.

## Layout

- `webapp-src` The source for the markdown viewer web app.
- `scripts` Some scripts for building the viewer and tutorials.
- `tut-src` The source markdown files for the tutorials.

## Usage

Type `npm run build` to build a `dist` folder with the compiled webapp sources.
To remove the folder, type `npm run clean`.  During tutorial development, you
may wish to run `npm run build-watch`, so that the webapp continually rebuilds.

For the time being, if you wish to render your tutorials, you should:

1. Copy the files from `tut-src` into the `dist` folder
2. From the `dist` folder, type `npx http-server -c-1 .`

This should make your tutorials available at <http://localhost:8080/>

Note: You will probably need to edit the `tut-src/tutorials.html` file so that
your `.md` file can be reached.

## To Do

If we wish to put live demos into the markdown (via the `iframe` code block), we
will need to have a more intelligent plan for how to get the compiled tutorial
games into the `dist` folder.
