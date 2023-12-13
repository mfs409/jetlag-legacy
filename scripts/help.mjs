// help.mjs:
//   Print a help message, since all of these npm scripts can become confusing

console.log(`npm run <command>: Runs a command from package.json

  Note that in some cases, you will want to pass some information to the
  command.  You can do this by typing TARGET=<info> npm run <command>.  For
  example, to build the demo game, you could type 
    "TARGET=demo_game npm run start-dev"

  Commands for Building and/or Serving Games:
    start-demo      Build the demo game and start serving it
    start-dev       Build a development version of the game specified by TARGET,
                    and start serving it
    build-game      Build a production version of the game specified by TARGET
    start-tut       Build a development version of the tutorial specified by 
                    TARGET, and start serving it

  Commands for Building and Serving Tutorials and Slides:
    build-tuts      Build all the tutorials
    start-tuts      Start serving the tutorials
    build-slides    Build the slides
    start-slides    Start serving the slides

  Commands for Building and Serving Documentation
    build-docs      Build the JetLag documentation and put it in the "docs" 
                    folder
    start-docs      Serve the "docs" folder

  Commands for Type Checking
    check           Run TypeScript's type checker on all code in the repository

  Commands for Cleaning Up
    clean-game      Clean up after running start-game
    clean-tut       Clean up after running start-tut
    clean-game      Clean up after running build-game
    clean-tuts      Clean up after running build-tuts
    clean-slides    Clean up after running build-slides
    clean-check     Clean up after running check
    clean-all       Clean up *everything*

  Other Commands
    help            Prints this message
`);