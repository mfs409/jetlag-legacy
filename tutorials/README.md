# JetLag Tutorials

This folder holds the markdown for each of the JetLag tutorials.

To make a new tutorial, please follow these steps:

1. Create a single markdown file for your tutorial.  File names should be
   lowercase, no spaces, begin with `tut_`, and end with `.md`.
2. Create a folder within this `tutorials/` folder for holding any assets
   (typically images) used by your tutorial.  The name of the folder should be
   the same as the name of your tutorial file, minus the `.md` extension.
3. Create a folder in `src/` for your tutorial's game code.  The folder name
   should be the same as the name of your asset folder from the previous step.
4. Create some game levels to demonstrate your tutorial.  Any assets must be in
   the top-level `assets/` folder.
5. Add your tutorial's path to the `tsconfig.json` file, so that `npm run check`
   can type-check it.
6. Add your tutorial to the `tutorials` array in `scripts/build_tuts.js`, so
   that it will get built and deployed with the other tutorials.
7. Then you can go ahead and actually write your tutorial.
