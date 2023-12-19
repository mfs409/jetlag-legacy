// help.mjs:
//   Print a help message, since all of these npm scripts can become confusing

console.log(`npm run <command>: Runs a command from package.json

  Note that in some cases, you will want to pass some information to the
  command.  You can do this by typing TUT=<info> npm run <command>.  For
  example, to serve the "storage" tutorial, you could type:
      TUT=storage npm run start-tut

  Commands for Building and Serving the Main Games:
    start-game      Build the main game and start serving it
    build-game      Build a production version of the main game
    
  Commands for Building and Serving Tutorials
    start-tut       Build and serve the tutorial specified by the TUT
                    environment variable
    build-tuts      Build all the tutorials
    serve-tuts      Start serving the tutorials (call build-tuts first!)

  Commands for Building and Serving Documentation
    build-docs      Build the JetLag documentation and put it in the "docs" 
                    folder
    start-docs      Serve the "docs" folder (call build-docs first!)

  Commands for Type Checking
    check           Run TypeScript's type checker on all game and tutorial code
                    in the repository

  Commands for Cleaning Up
    clean           Remove any built files that aren't tracked by git

  Other Commands
    help            Print this message
`);