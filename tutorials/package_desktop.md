# Packaging A JetLag Game As A Desktop Application

This tutorial shows how to use Electron to package a game for desktop play
(e.g., Steam).

- **TODO: Actually integrate with Steam APIs?**

## Using Electron

1. Build your game (`npm run build-game`)
2. Following [The Electron Forge Docs](https://www.electronforge.io/), create a
   project by typing `npm init electron-app@latest jetlag-electron` (note: I
   named my game `jetlag-electron`.  You should pick a different name.)
   - This can take a while to install everything it needs
3. Go into the folder you just made (e.g., `cd jetlag-electron`)
4. Copy your `assets/`, `game.js`, and `game.html` files from your `dist/`
   folder into the `src` folder.
5. Delete `src/preload.js` (it should be empty)
6. Rewrite `src/index.js` as described below

That's it.  You should be able to run `npm run make` to build executable files,
and `npm start` to test your program as a binary.

## `src/index.js` Contents

Below is the code that you'll need to put in `src/index.js` in order for JetLag
to work correctly.  Note that this has been tested with standard audio/image
assets, as well as fonts and svg files.  That said, if you're using different
fonts, you may need to make changes to the `font-src` line.

```javascript
const { app, BrowserWindow, session, globalShortcut } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { app.quit(); }

// Create the app's window
const createWindow = () => {
  // Create a browser window.
  const mainWindow = new BrowserWindow({
    // We'll ignore width and height, because of `fullscreen`:
    width: 800, height: 600, fullscreen: true,
    // No frame
    frame: false,
    // You should change the title!
    title: "JetLag Game",
  });


  // Set up security permissions so that Pixi.js loaders all work, and so that
  // game.html is able to load its js code and assets
  //
  // NB:  This uses the paths for google fonts.  You'll want to update it
  //      accordingly if your game loads fonts from other web providers.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "img-src 'self' data://*; " +
          "worker-src 'self' blob://*; " +
          "connect-src 'self' data://*; " +
          "style-src-elem 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com"
        ]
      }
    }))

  // Inject the HTML file into the browser window
  mainWindow.loadFile(path.join(__dirname, 'game.html'));

  // When you're developing, you can use ctrl-r to refresh, and ctrl-shift-i to
  // open the developer console.  When you deploy the app, you probably don't
  // want that, so you should uncomment the next line.  Disabling the menu also
  // disables the keyboard shortcuts.
  // 
  // mainWindow.removeMenu();
};

// Once electron is initialized, it will call this to make the window
app.on('ready', createWindow);

// If not macOS, quit when all windows are closed.
app.on('window-all-closed', () => { if (process.platform !== 'darwin') { app.quit(); } });

// If macOS, re-create the window if the dock icon is clicked when no windows
// are open.
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); } });
```
