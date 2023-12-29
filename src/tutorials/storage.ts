import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { Scene } from "../jetlag/Entities/Scene";
import { AnimatedSprite, FilledBox, FilledPolygon, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { boundingBox } from "./common";

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
  storageKey = "com.github.mfs409.jetlag.tut_storage";
  hitBoxes = true;
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = ["sprites.json"];
}

/** This is for Level Storage */
class LStore {
  coins = 0; // Coins collected during a stage
};

/** This is for Session Storage */
class SStore {
  coins = 0; // Coins collected so far during this session
}

/** This is for Persistent Storage.  It shouldn't have any methods */
class PStore {
  num_times_played = 0;
  last_played = new Date().toUTCString();
  rubies = 0; // 10 coins automatically become a ruby and get saved
}

/** Save a PStore */
function persist(p: PStore, key: string) {
  stage.storage.setPersistent(key, JSON.stringify(p))
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  if (level == 1) {
    // When the size of your game gets past a certain size, you'll find that it
    // is hard to use the `()=>{}` syntax to effectively keep track of all of
    // the information that a level of your game needs.  The "level" storage
    // feature lets you store information so that it is "globally accessible"
    // throughout your code.  It gets reset each time JetLag calls your
    // builder() code.

    // You can store *anything* in level storage, as a key/value pair.  You'll
    // probably find that it is easier if you organize things in an object,
    // though.

    // Session storage is similar, except it gets reset whenever you *quit* or
    // *refresh the browser*.

    // Persistent storage is "forever".

    // In this game, you can collect coins.  Every 5 coins becomes a "ruby".  If
    // you lose the level, you don't keep the coins you collected.  If you leave
    // the game with unconverted coins, they're lost, but rubies persist
    // forever.

    // We'll also print welcome messages for "first time playing" and "first
    // time playing today".

    // Set up level storage
    let lstore = new LStore();
    stage.storage.setLevel("stats", lstore);

    // Only set up session storage if we don't have one already
    if (!stage.storage.getSession("session_state"))
      stage.storage.setSession("session_state", new SStore());
    let sstore = stage.storage.getSession("session_state");

    // Only set up persistent storage if we don't have one already. Note that
    // for our "first time playing" rules, we need this to be a bit more complex
    // than session storage.

    // Persistent storage is trickier, because you have to explicitly save it
    // back to persistent after any change.

    let first_time = false; // Is this the very first time?
    if (stage.storage.getPersistent("persistent_info") == undefined) {
      first_time = true;
      persist(new PStore(), "persistent_info");
    }
    let pstore = JSON.parse(stage.storage.getPersistent("persistent_info")!) as PStore;

    // Now let's see if this is the first login of the day
    let today = new Date();
    let new_day = false;
    let last_day = new Date(pstore.last_played);
    if (today.getDay() != last_day.getDay() || today.getMonth() != last_day.getMonth() || today.getFullYear() != last_day.getFullYear())
      new_day = true;
    pstore.last_played = today.toUTCString();
    pstore.num_times_played += 1;
    persist(pstore, "persistent_info");

    if (first_time) {
      stage.requestOverlay((overlay: Scene) => {
        new Actor({
          appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
          rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
          gestures: { tap: () => { stage.clearOverlay(); return true; } }
        });
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Welcome!"),
          rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
        });
      }, false);
    }

    else if (new_day) {
      stage.requestOverlay((overlay: Scene) => {
        new Actor({
          appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
          rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
          gestures: { tap: () => { stage.clearOverlay(); return true; } }
        });
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Welcome Back!"),
          rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
        });
      }, false);
    }

    // Now let's make the actual game:
    stage.world.setGravity(0, 10);
    stage.tilt.tiltMax.Set(10, 0);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }
    boundingBox();

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));

    for (let cx = 0.5; cx < 16.5; cx += 2) {
      let animations = new Map();
      animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["coin0.png", "coin1.png", "coin2.png", "coin3.png", "coin4.png", "coin5.png", "coin6.png", "coin7.png"] }))
      new Actor({
        appearance: new AnimatedSprite({ width: 0.4, height: 0.4, animations }),
        rigidBody: new CircleBody({ cx, cy: 5, radius: 0.2 }),
        role: new Goodie({ onCollect: () => { lstore.coins += 1; return true; } }),
      });
    }

    for (let cx = 1.5; cx < 16.5; cx += 2) {
      new Actor({
        appearance: new ImageSprite({ width: 0.4, height: 0.4, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx, cy: 5, radius: 0.2 }),
        role: new Enemy(),
      });
    }

    // Make a destination
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });
    stage.score.setVictoryDestination(1);


    // Make the coin counter
    new Actor({
      appearance: new ImageSprite({ width: 0.4, height: 0.4, img: "coin0.png" }),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.5, radius: 0.2 }, { scene: stage.hud })
    });
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 24, color: "#000000" }, () => "x " + (lstore.coins + sstore.coins)),
      rigidBody: new CircleBody({ cx: 0.8, cy: 0.35, radius: 0.01 }, { scene: stage.hud })
    });

    // Make the ruby counter
    new Actor({
      appearance: new FilledPolygon({ fillColor: "#FF0000", vertices: [-.1, 0, 0, -.2, .1, 0, 0, .2] }),
      rigidBody: new CircleBody({ cx: 0.5, cy: 1, radius: 0.2 }, { scene: stage.hud })
    });
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 24, color: "#000000" }, () => "x " + (pstore.rubies)),
      rigidBody: new CircleBody({ cx: 0.8, cy: 0.9, radius: 0.01 }, { scene: stage.hud })
    });

    // Specify default win and lose behaviors
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    // When the player wins, move coins from local to session storage, and then
    // compute ruby updates before printing a message
    stage.score.winSceneBuilder = (overlay) => {
      sstore.coins += lstore.coins;
      let rubies = 0;
      while (sstore.coins > 5) {
        rubies += 1;
        sstore.coins -= 5;
      }
      if (rubies > 0) {
        pstore.rubies += rubies;
        persist(pstore, "persistent_info");
      }
      new Actor({
        appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
        rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
        gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(builder, level); return true; } }
      });
      new Actor({
        appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Good Job"),
        rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
      });
      if (rubies == 1) {
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "You earned 1 ruby"),
          rigidBody: new CircleBody({ cx: 8, cy: 5.5, radius: .01 }, { scene: overlay }),
        });
      }
      if (rubies == 2) {
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "You earned 2 rubies"),
          rigidBody: new CircleBody({ cx: 8, cy: 5.5, radius: .01 }, { scene: overlay }),
        });
      }
    }

    // When the player loses, just give a message and let them start over
    stage.score.loseSceneBuilder = (overlay) => {
      new Actor({
        appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
        rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
        gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(builder, level); return true; } }
      });
      new Actor({
        appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Try Again"),
        rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
      });
    }
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
