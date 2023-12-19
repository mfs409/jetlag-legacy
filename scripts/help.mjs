// help.mjs:
//   Print a help message, since all of these npm scripts can become confusing

console.log(`npm run <command>: Runs a command from package.json

  Commands for Building and Serving the Main Game:
    start           Build the main game and start serving it
    build-game      Build a production version of the main game
    
  Commands for Type Checking
    check           Run TypeScript's type checker on all game and tutorial code
                    in the repository

  Commands for Cleaning Up
    clean           Remove any built files that aren't tracked by git

  Other Commands
    help            Print this message
`);