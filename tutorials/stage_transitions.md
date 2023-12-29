# Transitions Among Stages

When you are designing a game, you'll quickly find that putting
everything in one file is a bad idea.  This tutorial presents one way of
organizing your code, and also discusses how to transition between the
different parts of your game.  This tutorial also shows how to do
background music.

## Importing Your Own Code

In this tutorial, we're going to have our `game.ts` file, and then a few more
files: `common.ts`, `splash.ts`, `help.ts`, `chooser.ts`, and `play.ts`.  Each
of these will include some functions that some of the other files will need.  To
get this to work, you'll need to do two things:

1. If a function in one file needs to be used in another file, then in the file
   where you make the function, you need to put the word `export` before the
   function declaration (for example, `export function toggleMute() {...}`).
2. In the file that uses that function, you'll need to import it.  For example,
   `import { toggleMute } from "./common";`.  Notice that we don't include the
   `.ts` part of the file name.

The end state for this tutorial will be several files:

- `game.ts` will just have the `Config` object and the call to
  `initializeAndLaunch`
- `common.ts` will export some helper functions
- `splash.ts` will export a builder function for the welcome screen / main menu
- `chooser.ts` will export a builder function for a level chooser
- `help.ts` will export a builder function for the help screens
- `play.ts` will export a builder function for the playable levels of the game

## The `game.ts` File

We're in a weird situation here... almost every file depends on some other file!
Rather than make some edits, then make more later, we'll look at one file at a
time.  The easiest is `game.ts`:

```typescript
import { JetLagGameConfig } from "../jetlag/Config";
import { initializeAndLaunch } from "../jetlag/Stage";
import { splashBuilder } from "./splash";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;
    canVibrate = true;
    forceAccelerometerOff = true;
    storageKey = "--no-key--";
    hitBoxes = true;
    resourcePrefix = "./assets/";
    musicNames = ["tune.ogg", "tune2.ogg"];
    soundNames = [];
    imageNames = ["sprites.json"];
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), splashBuilder);
```

Hopefully, this file is familiar.  In order for it to work, you'll need the  spritesheet that we've seen from other tutorials.  You'll also need these two sound files, which we will use as background music:

- [tune.ogg](stage_transitions/tune.ogg)
- [tune2.ogg](stage_transitions/tune2.ogg)

Neither is a particularly good bit of music.  We're going to use them to show
how we can have per-level music, or have music that is consistent (and doesn't
restart) while we move among parts of the game.  Other than these new imports,
the only tricky part of the code is that `splashBuilder` is not defined in the
file, but instead is imported.  We'll get to it soon.

## The `common.ts` File

The `common.ts` file is where we'll put common code that gets used in more than
one file:

```typescript
import { ImageSprite } from "../jetlag/Components/Appearance";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Actor } from "../jetlag/Entities/Actor";
import { Scene } from "../jetlag/Entities/Scene";
import { stage } from "../jetlag/Stage";

/**
 * Draw a mute button
 *
 * @param cfg         Configuration for how to draw the button
 * @param cfg.scene   The scene where the button should be drawn
 * @param cfg.cx      The center X coordinate of the button
 * @param cfg.cy      The center Y coordinate of the button
 * @param cfg.width   The width of the button
 * @param cfg.height  The height of the button
 */
export function drawMuteButton(cfg: { cx: number, cy: number, width: number, height: number, scene: Scene }) {
  // Draw a mute button
  let getVolume = () => (stage.storage.getPersistent("volume") ?? "1") === "1";
  let mute = new Actor({
    appearance: new ImageSprite({ width: cfg.width, height: cfg.height, img: "audio_off.png" }),
    rigidBody: new BoxBody({ cx: cfg.cx, cy: cfg.cy, width: cfg.width, height: cfg.height }, { scene: cfg.scene }),
  });
  // If the game is not muted, switch the image
  if (getVolume())
    (mute.appearance as ImageSprite).setImage("audio_on.png");
  // when the obstacle is touched, switch the mute state and update the picture
  mute.gestures = {
    tap: () => {
      // volume is either 1 or 0, switch it to the other and save it
      let volume = 1 - parseInt(stage.storage.getPersistent("volume") ?? "1");
      stage.storage.setPersistent("volume", "" + volume);
      // update all music
      stage.musicLibrary.resetMusicVolume(volume);

      if (getVolume()) (mute.appearance as ImageSprite).setImage("audio_on.png");
      else (mute.appearance as ImageSprite).setImage("audio_off.png");
      return true;
    }
  };
}
```

In addition to the mute button, you might want to put things like `boundingBox`
and `enableTilt` in here, instead of in `play.ts`.

## The `splash.ts` File

The first thing the player will see is our "splash" screen.  It's just a menu.
In truth, it's a "playable" level, except that there is no notion of winning or
losing.

Since this is the first thing that will be shown (we used it in
`initializeAndLaunch`), it's a great place to set the `stage.gameMusic`.  This
music will keep playing until we manually pause it, or the game exits.  Calling
`play()` on music that is already playing does not do anything, so we can start
the music by (1) making sure it's set, and (2) playing it.

```typescript
import { FilledBox, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { MusicComponent } from "../jetlag/Components/Music";
import { chooserBuilder } from "./chooser";
import { helpBuilder } from "./help";
import { drawMuteButton } from "./common";

/**
 * splashBuilder will draw the scene that we see when the game starts. In our
 * case, it's just a menu and some branding.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is a `level` parameter.  In this code, we just ignore it.
 *
 * @param level Which splash screen should be displayed
 */
export function splashBuilder(_level: number) {
  // start the music
  if (stage.gameMusic === undefined)
    stage.gameMusic = new MusicComponent(stage.musicLibrary.getMusic("tune2.ogg"));
  stage.gameMusic.play();

  // Paint the background white
  stage.backgroundColor = "#FFFFFF";

  // Draw a brown box at the top of the screen, put some text in it
  new Actor({
    appearance: new FilledBox({ width: 16, height: 3, fillColor: "#523216" }),
    rigidBody: new BoxBody({ cx: 8, cy: 1.5, width: 16, height: 3 }),
  });
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 120, color: "#FFFFFF" }, "JetLag Demo"),
    rigidBody: new BoxBody({ cx: 8, cy: 1.25, width: .1, height: .1 }),
  });
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 56, color: "#FFFFFF" }, "2D Games for Web and Mobile"),
    rigidBody: new BoxBody({ cx: 8, cy: 2.4, width: .1, height: .1 }),
  });

  // Draw some text.  Tapping its *rigidBody* will go to the first page of the
  // level chooser
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 96, color: "#000000" }, "Play"),
    rigidBody: new BoxBody({ cx: 8, cy: 5.625, width: 2.5, height: 1.25 }),
    gestures: { tap: () => { stage.switchTo(chooserBuilder, 1); return true; } }
  });

  // Make some text for going to the help screen
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 72, color: "#000000" }, "Help"),
    rigidBody: new BoxBody({ cx: 3.2, cy: 6.15, width: 1.8, height: 0.9 }),
    gestures: { tap: () => { stage.switchTo(helpBuilder, 1); return true; } }
  });

  // Make a quit button.  This is probably not useful in browser games, only
  // mobile/desktop.
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 72, color: "#000000" }, "Quit"),
    rigidBody: new BoxBody({ cx: 12.75, cy: 6.15, width: 1.8, height: 0.9 }),
    gestures: { tap: () => { stage.exit(); return true; } }
  });

  // And a mute button...
  drawMuteButton({ cx: 15, cy: 8, width: .75, height: .75, scene: stage.world });
}
```

Other than that, the code should be pretty familiar.  We have some buttons that
can be pressed to cause the game to jump to another screen, and we use
`stage.switchTo` to say which builder to use (and which level to pass to that
builder).

## The `chooser.ts` File

Next, let's look at the level chooser.  In this code, we use a helper function
(which we do not export) to make it easier to draw the buttons for switching to
levels of the game.  The other interesting thing here is that we *pause* the
game-wide music, and we install some music that is specific to the chooser.
You'll notice that this music re-starts when we switch choosers... that's what
`levelMusic` is supposed to do.  Otherwise, we chould have used `gameMusic`.

```typescript
import { Actor } from "../jetlag/Entities/Actor";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { stage } from "../jetlag/Stage";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { splashBuilder } from "./splash";
import { gameBuilder } from "./play";
import { MusicComponent } from "../jetlag/Components/Music";

/**
 * buildChooserScreen draws the level chooser screens.
 *
 * Since we have 9 levels, and we show 4 levels per screen, our chooser
 * will have 3 screens.
 *
 * @param level Which screen of the chooser should be displayed
 */
export function chooserBuilder(level: number) {
  // start the chooser music, pause the game music
  stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic("tune.ogg"));
  stage.gameMusic?.pause();

  // Paint the background white
  stage.backgroundColor = "#FFFFFF";

  // Draw a brown box at the top of the screen, put some text in it
  new Actor({
    appearance: new FilledBox({ width: 16, height: 2.3, fillColor: "#523216" }),
    rigidBody: new BoxBody({ cx: 8, cy: 1.15, width: 16, height: 2.3 }, { collisionsEnabled: false }),
  });
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 120, color: "#FFFFFF" }, "Choose a Level"),
    rigidBody: new BoxBody({ cx: 8, cy: 1.15, width: .1, height: .1 }),
  });

  // Draw some buttons, based on which chooser "level" we're on
  if (level == 1) {
    // Levels 1-4
    drawLevelButton(5, 4, 1);
    drawLevelButton(11, 4, 2);
    drawLevelButton(5, 7, 3);
    drawLevelButton(11, 7, 4);
  }

  else if (level == 2) {
    // Levels 5-8
    drawLevelButton(5, 4, 5);
    drawLevelButton(11, 4, 6);
    drawLevelButton(5, 7, 7);
    drawLevelButton(11, 7, 8);
  }

  else {
    // Level 9
    drawLevelButton(8, 5.5, 9);
  }

  // Add a button for going to the next chooser screen, but only if this isn't
  // the last chooser screen
  if (level < 3) {
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "right_arrow.png" }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: 15.5, cy: 5.625 }),
      gestures: { tap: () => { stage.switchTo(chooserBuilder, level + 1); return true; } }
    });
  }
  // Add a button for going to the previous chooser screen, but only if this
  // isn't the first chooser screen
  if (level > 1) {
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "left_arrow.png" }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: .5, cy: 5.625 }),
      gestures: { tap: () => { stage.switchTo(chooserBuilder, level - 1); return true; } }
    });
  }

  // Add a button for returning to the splash screen
  new Actor({
    appearance: new ImageSprite({ width: 1, height: 1, img: "back_arrow.png" }),
    rigidBody: new BoxBody({ width: 1, height: 1, cx: 15.5, cy: 8.5 }),
    gestures: { tap: () => { stage.switchTo(splashBuilder, 1); return true; } }
  });
}

/**
 * Draw a button for that jumps to a level when tapped
 *
 * @param cx    X coordinate of the center of the button
 * @param cy    Y coordinate of the center of the button
 * @param level which level to play when the button is tapped
 */
function drawLevelButton(cx: number, cy: number, level: number) {
  // Drawing a tile.  Touching it goes to a level.
  new Actor({
    appearance: new ImageSprite({ width: 2, height: 2, img: "level_tile.png" }),
    rigidBody: new BoxBody({ cx, cy, width: 2, height: 2 }),
    gestures: { tap: () => { stage.switchTo(gameBuilder, level); return true; } }
  });
  // Put some text over it
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56, z: 0 }, () => level + ""),
    rigidBody: new BoxBody({ cx, cy, width: .1, height: .1 }),
  });
}
```

## The `help.ts` File

In the chooser, and also in the help, we have ways to move between "levels"
within the file.  That gets us three chooser screens, and now we'll have two
help screens.

```typescript
import { Actor } from "../jetlag/Entities/Actor";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { stage } from "../jetlag/Stage";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { splashBuilder } from "./splash";

/**
 * helpBuilder is for drawing the help screens.  These are no different from
 * game screens... except that you probably don't want them to involve "winning"
 * and "losing". 
 *
 * In this demonstration, we just provide a bit of information about the demo
 * game, and how to get started.  This is also often a good place to put
 * credits.
 *
 * For the purposes of this demonstration, there are two Help screens.  That
 * way, we can show how to move from one to the next.
 *
 * @param level Which help screen should be displayed
 */
export function helpBuilder(level: number) {
  if (level == 1) {
    // Our first scene describes the color coding that we use for the different
    // entities in the game

    stage.backgroundColor = "#19698e"; // Light blue background

    // put some information and pictures on the screen
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56, }, "The levels of this game demonstrate JetLag features"),
      rigidBody: new BoxBody({ cx: 8, cy: 1, width: .1, height: .1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 2.5, radius: 0.375 }),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "You control the hero"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 2.25, width: .1, height: .1, }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 3.5, radius: 0.375 }),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "Collect these goodies"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 3.25, width: .1, height: .1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 4.5, radius: 0.375 }),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "Avoid or defeat enemies"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 4.25, width: .1, height: .1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 5.5, radius: 0.375 }),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "Reach the destination"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 5.25, width: .1, height: .1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 6.5, radius: 0.375 }),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "These are obstacles"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 6.25, width: .1, height: .1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 7.5, radius: 0.375 }),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "toss projectiles"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 7.25, width: .1, height: .1 }),
    });

    // Tap anywhere to go to the next screen
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }), // the fourth "00" is the alpha channel, for invisibility
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }),
      gestures: { tap: () => { stage.switchTo(helpBuilder, 2); return true; } }
    });
  }

  else if (level == 2) {
    // Our second help scene is just here to show that it is possible to have
    // more than one help scene. This is just like the previous screen, but with
    // different text

    stage.backgroundColor = "#19698e";
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56 }, "That's All"),
      rigidBody: new BoxBody({ cx: 8, cy: 1, width: .1, height: .1 }),
    });
    let big_text = `We hope you enjoy learning about game development!

If you publish a game based on JetLag, please be sure to let us know.`;
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 32 }, big_text),
      rigidBody: new BoxBody({ cx: 8, cy: 5, width: .1, height: .1 }),
    });

    // Tap anywhere to go back to the splash screen
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }),
      gestures: { tap: () => { stage.switchTo(splashBuilder, 1); return true; } }
    });
  }
}
```

There isn't really anything special about the help screens.  But it is worth
noting that all of these builders are really making playable levels.  That means
that you could have animations, interactivity, "training experiences",
interactive stores, and so forth, if you wanted to.

## The Hard Part: `play.ts`

`play.ts` is going to be quite a bit more difficult than everything else we've
done so far.  One thing is that we'll need to have nine different levels,
because of how we set up our chooser.  But it's also time to think about how to
make the transitions more pleasant.

You've already seen the `world` and the `hud`.  There can be other scenes in
JetLag, but they're short-lived.  We call them "overlay" scenes.

An overlay scene is defined by a builder function.  If you call
`stage.requestOverlay()` and give a builder function, then your game will
immediately pause, that overlay will be drawn, and it will stay until you call
`stage.clearOverlay()`.  Here's an example: this code will ask for an overlay,
which pauses the game.  When it gets an overlay, it will put a black background
on it, then write some text in the middle.  Clicking the background will clear
the overlay, resuming the game:

```typescript
/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will resume the current level.  This will
 * show immediately when the game starts.
 *
 * @param message A message to display in the middle of the screen
 */
function welcomeMessage(message: string) {
  // Immediately install the overlay, to pause the game
  stage.requestOverlay((overlay: Scene) => {
    // Pressing anywhere on the black background will make the overlay go away
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          return true;
        }
      },
    });
    // The text goes in the middle
    new Actor({
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message),
    });
  }, false);
}
```

It turns out that whenever we make an overlay, we can optionally also get a
screenshot of the game *immediately before* the overlay was made.  Here's a
pause scene.  You'll see that it receives the screenshot as an `ImageSprite`,
and uses it to make the background.  The pause scene is also interactive.  It
can cause the game to go back to the chooser, and it could even change things
inside of the current level of the game.

```typescript
/**
 * Create an overlay (blocking all game progress) consisting of a text box over
 * a snapshot of the in-progress game.  Clearing the overlay will resume the
 * current level.
 *
 * @param level The current level
 */
function pauseGame(level: number) {
  // Immediately install the overlay, to pause the game
  stage.requestOverlay((overlay: Scene, screenshot: ImageSprite | undefined) => {
    // Draw the screenshot
    new Actor({ appearance: screenshot!, rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }), });

    // It's always good to have a way to go back to the chooser:
    new Actor({
      appearance: new ImageSprite({ img: "back_arrow.png", width: 1, height: 1 }),
      rigidBody: new BoxBody({ cx: 15.5, cy: .5, width: 1, height: 1 }, { scene: overlay }),
      gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(chooserBuilder, Math.ceil(level / 4)); return true; } }
    });

    // Pressing anywhere on the text box will make the overlay go away
    new Actor({
      appearance: new FilledBox({ width: 2, height: 1, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 2, height: 1 }, { scene: overlay }),
      gestures: { tap: () => { stage.clearOverlay(); return true; } },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, "Paused"),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    });

    // It's not a bad idea to have a mute button...
    drawMuteButton({ scene: overlay, cx: 15.5, cy: 1.5, width: 1, height: 1 });
  }, true);
}
```

Since overlays can interact with the world, we'll make a special way of pausing
the game.  In this variant, there will be buttons for winning instantly, losing
instantly, and powering up the hero.

```typescript
/**
 * Create an overlay (blocking all game progress) consisting of a text box over
 * a snapshot of the in-progress game.  Clearing the overlay will resume the
 * current level.  This is different from pauseGame in a few ways (see below).
 *
 * @param level The current level
 */
function specialPauseGame(level: number, h: Actor) {
  // Immediately install the overlay, to pause the game
  stage.requestOverlay((overlay: Scene, screenshot: ImageSprite | undefined) => {
    // Draw the screenshot
    new Actor({ appearance: screenshot!, rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }), });

    // It's always good to have a way to go back to the chooser:
    new Actor({
      appearance: new ImageSprite({ img: "back_arrow.png", width: 1, height: 1 }),
      rigidBody: new BoxBody({ cx: 15.5, cy: .5, width: 1, height: 1 }, { scene: overlay }),
      gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(chooserBuilder, Math.ceil(level / 4)); return true; } }
    });

    // Pressing anywhere on the text box will make the overlay go away
    new Actor({
      appearance: new FilledBox({ width: 2, height: 1, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 2, height: 1 }, { scene: overlay }),
      gestures: { tap: () => { stage.clearOverlay(); return true; } },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, "Paused"),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    });

    // It's not a bad idea to have a mute button...
    drawMuteButton({ scene: overlay, cx: 15.5, cy: 1.5, width: 1, height: 1 });

    // A "cheat" button for winning right away
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 5.5, radius: .5 }, { scene: overlay }),
      gestures: { tap: () => { stage.clearOverlay(); stage.score.winLevel(); return true; } },
    });

    // A "cheat" button that makes you lose right away
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 6.5, radius: .5 }, { scene: overlay }),
      gestures: { tap: () => { stage.clearOverlay(); stage.score.loseLevel(); return true; } },
    });

    // A mystery button.  It opens *another* pause scene, by hiding this one and
    // installing a new one.
    //
    // One very cool thing is that you can change the *world* from within the
    // pause scene.  In this case, we'll give the hero strength, so it can
    // withstand collisions with enemies.
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 7.5, radius: .5 }, { scene: overlay }),
      gestures: {
        tap: () => {
          // clear the pause scene, draw another one
          stage.clearOverlay();
          stage.requestOverlay((overlay: Scene) => {
            // This one just has one button that boosts the hero's strength and returns to the game
            new Actor({
              appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
              rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .5 }, { scene: overlay }),
              gestures: {
                tap: () => {
                  (h.role as Hero).strength = 10;
                  stage.clearOverlay();
                  return true;
                }
              }
            });
          }, false);
          return true;
        }
      }
    });
  }, true);
}
```

Finally, we'll write code for two more overlays: one to put when the level is
won, another for when the level is lost.  Note that these do not use
`requestOverlay`.  In JetLag, the score is able to store the builders for the
win and lose overlays.  This lets JetLag create the overlay when it figures out
that the player has won or lost.

```typescript
/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will start the next level.
 *
 * @param message A message to display in the middle of the screen
 */
function winMessage(message: string) {
  stage.score.winSceneBuilder = (overlay: Scene) => {
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
          return true;
        }
      },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    });
  };
}

/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will restart the level.
 *
 * @param message A message to display in the middle of the screen
 */
function loseMessage(message: string) {
  stage.score.loseSceneBuilder = (overlay: Scene) => {
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
          return true;
        }
      },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    })
  };
}
```

Now that we've got all of our helper code for making overlays, let's write the
nine levels of the game.  You'll notice that I'm providing the whole `builder()`
function, exactly as I would write it.  There are a few things to notice:

- For the most part, each level builds on the one before it, so hopefully
  they're not too hard to understand.
- We go back to using the same music as in the splash screen.
- The code uses the pattern `if (level == xxx)` and `else if (level == xxx)` to
  separate the code for the different levels.
- Before the first `if (level == xxx)`, there is some common code that runs no
  matter which level is being created.

```typescript
import { PathMovement, TiltMovement, Path } from "../jetlag/Components/Movement";
import { stage } from "../jetlag/Stage";
import { Scene } from "../jetlag/Entities/Scene";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Hero, Destination, Enemy, Goodie, Obstacle, Sensor } from "../jetlag/Components/Role";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { splashBuilder } from "./splash";
import { chooserBuilder } from "./chooser";
import { b2Vec2 } from "@box2d/core";
import { drawMuteButton } from "./common";

/**
 * gameBuilder is for drawing the playable levels of the game
 *
 * We currently have 9 levels, which is just enough to let the chooser be
 * interesting.
 *
 * @param level Which level should be displayed
 */
export function gameBuilder(level: number) {
  // Every level will have some common configuration stuff.  We'll put it all
  // here, at the top.  Some of it relies on functions that are at the end of
  // this file.

  // Play the music
  stage.gameMusic?.play();

  // Draw four walls, covering the four borders of the world
  new Actor({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });

  // Every level will use tilt to control the hero, with arrow keys simulating
  // tilt on devices that lack an accelerometer
  stage.tilt.tiltMax.Set(10, 10);
  if (!stage.accelerometer.tiltSupported) {
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  }

  // Every level is won when a hero reaches the destination
  stage.score.setVictoryDestination(1);

  // Indicate that we want to print a message when the player wins or loses
  winMessage("Great Job");
  loseMessage("Try Again");

  // Make a pause button.  We'll pause differently for the last scene, so it's
  // not here...
  new Actor({
    appearance: new ImageSprite({ img: "pause.png", width: 1, height: 1 }),
    rigidBody: new BoxBody({ cx: .5, cy: 1.5, width: 1, height: 1 }, { scene: stage.hud }),
    gestures: { tap: () => { if (level != 9) pauseGame(level); return true; } }
  });

  // Put the level number in the top left corner
  new Actor({
    appearance: new TextSprite({ center: false, face: "arial", color: "#872436", size: 32, z: 2 }, () => "Level " + level),
    rigidBody: new BoxBody({ cx: .25, cy: 0.25, width: .1, height: .1, }),
  });

  // Make sure we go to the correct level when this level is won/lost: for
  // anything but the last level, we go to the next level.  Otherwise, go to the splash screen
  if (level != 9) {
    stage.score.onLose = { level: level, builder: gameBuilder };
    stage.score.onWin = { level: level + 1, builder: gameBuilder };
  }
  else {
    stage.score.onLose = { level: level, builder: gameBuilder };
    stage.score.onWin = { level: 1, builder: splashBuilder };
  }

  if (level == 1) {
    // Level 1 will just have a hero and a destination
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });

    welcomeMessage("Use tilt (or arrows) to reach the destination");
  }

  else if (level == 2) {
    // Level two adds an enemy
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    welcomeMessage("Avoid the enemy!");
  }

  else if (level == 3) {
    // Level three requires one goodie before the destination works
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    welcomeMessage("Use tilt (or arrows) to reach the destination");
  }

  else if (level == 4) {
    // Now we'll have an enemy and a goodie!
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    welcomeMessage("Be careful!");
  }

  else if (level == 5) {
    // This time, we'll add some obstacles
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    for (let cy of [0.5, 8.5]) {
      new Actor({
        appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
        rigidBody: new CircleBody({ cx: 14, cy, radius: 0.4 }),
        role: new Obstacle()
      });
    }
    welcomeMessage("You cannot pass through the purple obstacles");
  }

  else if (level == 6) {
    // This time we'll add a sensor, which will change the hero's trajectory
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    welcomeMessage("The (grey) sensor will change your movement");
  }

  else if (level == 7) {
    // Now we'll add an enemy again
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    welcomeMessage("It's getting harder...");
  }

  else if (level == 8) {
    // Now we'll add another enemy, so it's harder to get to the goodie
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 7, radius: 0.4 }),
      role: new Enemy(),
    });

    welcomeMessage("Almost done...");
  }

  else if (level == 9) {
    // For our last level, we'll throw in a few more enemies.  Note how we can
    // alter their paths by adding a waypoint
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    new Actor({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    let a1 = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });
    (a1.movement as PathMovement).skip_to(1);

    let a2 = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 4.5).to(13, 8).to(13, 1), 5, true)
    });
    (a2.movement as PathMovement).skip_to(1);

    let a3 = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 4.5).to(13, 1), 5, true)
    });
    (a3.movement as PathMovement).skip_to(2);

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 7, radius: 0.4 }),
      role: new Enemy(),
    });

    welcomeMessage("Don't give up!");

    // Make a special pause scene for this level
    new Actor({
      appearance: new ImageSprite({ img: "pause.png", width: 1, height: 1 }),
      rigidBody: new BoxBody({ cx: .5, cy: 1.5, width: 1, height: 1 }, { scene: stage.hud }),
      gestures: { tap: () => { specialPauseGame(9, h); return true; } }
    });
  }
}
```

## Wrapping Up

With all of that code written, we now have a pretty nice menu system for our
game:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "stage_transitions.html?1"
}
```

A very important point about this tutorial is that it let us split the game into
several files, and also into logically distinct units.  If you're working in a
team, you will be much more efficient if different team members can avoid
editing the same file at the same time.  This approach is a great step in that
direction.

```md-config
page-title = Transitions Among Stages
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
