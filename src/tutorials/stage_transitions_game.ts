import { PathMovement, TiltMovement, Path } from "../jetlag/Components/Movement";
import { stage } from "../jetlag/Stage";
import { Scene } from "../jetlag/Entities/Scene";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Hero, Destination, Enemy, Goodie, Obstacle, Sensor } from "../jetlag/Components/Role";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { splashBuilder } from "./stage_transitions_splash";
import { chooserBuilder } from "./stage_transitions_chooser";
import { b2Vec2 } from "@box2d/core";
import { drawMuteButton } from "./stage_transitions_common";

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
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
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
  Actor.Make({
    appearance: new ImageSprite({ img: "pause.png", width: 1, height: 1 }),
    rigidBody: new BoxBody({ cx: .5, cy: 1.5, width: 1, height: 1 }, stage.hud),
    gestures: { tap: () => { if (level != 9) pauseGame(level); return true; } }
  });

  // Put the level number in the top left corner
  Actor.Make({
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

  // Level 1 will just have a hero and a destination
  if (level == 1) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });

    welcomeMessage("Use tilt (or arrows) to reach the destination");
  }

  // Level two adds an enemy
  else if (level == 2) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    welcomeMessage("Avoid the enemy!");
  }

  // Level three requires one goodie before the destination works
  else if (level == 3) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    welcomeMessage("Use tilt (or arrows) to reach the destination");
  }

  // Now we'll have an enemy and a goodie!
  else if (level == 4) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    welcomeMessage("Be careful!");
  }

  // This time, we'll add some obstacles
  else if (level == 5) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    for (let cy of [0.5, 8.5]) {
      Actor.Make({
        appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
        rigidBody: new CircleBody({ cx: 14, cy, radius: 0.4 }),
        role: new Obstacle()
      });
    }
    welcomeMessage("You cannot pass through the purple obstacles");
  }

  // This time we'll add a sensor, which will change the hero's trajectory
  else if (level == 6) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    welcomeMessage("The (grey) sensor will change your movement");
  }

  // Now we'll add an enemy
  else if (level == 7) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    welcomeMessage("It's getting harder...");
  }

  // Now we'll add another enemy, so it's harder to get to the goodie
  else if (level == 8) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 7, radius: 0.4 }),
      role: new Enemy(),
    });

    welcomeMessage("Almost done...");
  }

  // For our last level, we'll throw in a few more enemies.  Note how we can
  // alter their paths by adding a waypoint
  else if (level == 9) {
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: () => stage.score.getGoodieCount(0) == 1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: .8, height: .8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.5, radius: .4 }),
      role: new Sensor({ heroCollision: (_a: Actor, h: Actor) => { (h.movement as TiltMovement).updateVelocity(new b2Vec2(0, -10)) } })
    })

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });

    let a1 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 1), 5, true)
    });
    (a1.movement as PathMovement).skip_to(1);

    let a2 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 4.5).to(13, 8).to(13, 1), 5, true)
    });
    (a2.movement as PathMovement).skip_to(1);

    let a3 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.4 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(13, 1).to(13, 8).to(13, 4.5).to(13, 1), 5, true)
    });
    (a3.movement as PathMovement).skip_to(2);

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 7, radius: 0.4 }),
      role: new Enemy(),
    });

    welcomeMessage("Don't give up!");

    // Make a special pause scene for this level
    Actor.Make({
      appearance: new ImageSprite({ img: "pause.png", width: 1, height: 1 }),
      rigidBody: new BoxBody({ cx: .5, cy: 1.5, width: 1, height: 1 }, stage.hud),
      gestures: { tap: () => { specialPauseGame(9, h); return true; } }
    });
  }
}

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
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          return true;
        }
      },
    });
    // The text goes in the middle
    Actor.Make({
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, overlay),
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message),
    });
  }, false);
}

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
    Actor.Make({ appearance: screenshot!, rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay), });

    // It's always good to have a way to go back to the chooser:
    Actor.Make({
      appearance: new ImageSprite({ img: "back_arrow.png", width: 1, height: 1 }),
      rigidBody: new BoxBody({ cx: 15.5, cy: .5, width: 1, height: 1 }, overlay),
      gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(chooserBuilder, Math.ceil(level / 4)); return true; } }
    });

    // Pressing anywhere on the text box will make the overlay go away
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 1, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 2, height: 1 }, overlay),
      gestures: { tap: () => { stage.clearOverlay(); return true; } },
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, "Paused"),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, overlay),
    });

    // It's not a bad idea to have a mute button...
    drawMuteButton({ scene: overlay, cx: 15.5, cy: 1.5, width: 1, height: 1 });
  }, true);
}


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
    Actor.Make({ appearance: screenshot!, rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay), });

    // It's always good to have a way to go back to the chooser:
    Actor.Make({
      appearance: new ImageSprite({ img: "back_arrow.png", width: 1, height: 1 }),
      rigidBody: new BoxBody({ cx: 15.5, cy: .5, width: 1, height: 1 }, overlay),
      gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(chooserBuilder, Math.ceil(level / 4)); return true; } }
    });

    // Pressing anywhere on the text box will make the overlay go away
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 1, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 2, height: 1 }, overlay),
      gestures: { tap: () => { stage.clearOverlay(); return true; } },
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, "Paused"),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, overlay),
    });

    // It's not a bad idea to have a mute button...
    drawMuteButton({ scene: overlay, cx: 15.5, cy: 1.5, width: 1, height: 1 });

    // A "cheat" button for winning right away
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 5.5, radius: .5 }, overlay),
      gestures: { tap: () => { stage.clearOverlay(); stage.score.winLevel(); return true; } },
    });

    // A "cheat" button that makes you lose right away
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 6.5, radius: .5 }, overlay),
      gestures: { tap: () => { stage.clearOverlay(); stage.score.loseLevel(); return true; } },
    });

    // A mystery button.  It opens *another* pause scene, by hiding this one and
    // installing a new one.
    //
    // One very cool thing is that you can change the *world* from within the
    // pause scene.  In this case, we'll give the hero strength, so it can
    // withstand collisions with enemies.
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 7.5, radius: .5 }, overlay),
      gestures: {
        tap: () => {
          // clear the pause scene, draw another one
          stage.clearOverlay();
          stage.requestOverlay((overlay: Scene) => {
            // This one just has one button that boosts the hero's strength and returns to the game
            Actor.Make({
              appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
              rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .5 }, overlay),
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

/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will start the next level.
 *
 * @param message A message to display in the middle of the screen
 */
function winMessage(message: string) {
  stage.score.winSceneBuilder = (overlay: Scene) => {
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
          return true;
        }
      },
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, overlay),
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
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
          return true;
        }
      },
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, overlay),
    })
  };
}
