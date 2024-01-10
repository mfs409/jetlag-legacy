# Packaging A JetLag Game For Mobile Devices

This tutorial shows how to use Capacitor to package a game so that it can be
installed as an app on a mobile device.  It also discusses games with vertical
(portrait) orientation.

- **TODO: Talk about gestures vs. keyboard**
- **TODO: Switch the game to portrait?**

## Using Capacitor

Here are the "basic" steps:

1. Install capacitor: `npm i @capacitor/core` `npm i -D @capacitor/cli`
2. Initialize capacitor: `npx cap init`
    - Name: jetlag-capacitor
    - Id: com.github.mfs409.jetlag.capacitor
    - Directory: dist
3. Create Android project: `npm i @capacitor/android` `npx cap add android`
    - You can do ios with `npm i @capacitor/ios` `npx cap add ios`
4. Make your game: `npm run build-game`
5. Rename your html file: `mv dist/game.html dist/index.html`
6. Sync it: `npx cap sync`
7. `npx cap run android`

It will take a minute, but your app should load...

Now let's configure it to stay in landscape mode:

- Open `android/app/src/main/AndroidManifest.xml`
- In the `<activity>` tag, add `android:screenOrientation="landscape"`

Now let's get rid of the status bar:

- `npm install @capacitor/status-bar`
- Add this to the end of `game.ts`, right before `initializeAndLaunch()`

```typescript
import { StatusBar } from '@capacitor/status-bar';
const hideStatusBar = async () => {
  await StatusBar.hide();
};
hideStatusBar();
```

Let's test it:

- `npm run build-game`
- `npx cap sync`
- `npx cap run android`
