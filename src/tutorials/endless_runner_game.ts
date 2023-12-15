import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig, Sides } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon, ImageSprite } from "../jetlag/Components/Appearance";
import { ManualMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { CollisionExemptions, Destination, Enemy, Goodie, Hero, Obstacle, Sensor } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";
import { Scene } from "../jetlag/Entities/Scene";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  Make
  // sure names don't have spaces or other funny characters, and make sure you
  // put the corresponding files in the folder identified by `resourcePrefix`.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {


  // In side-scrolling games, we can have the hero move at a fixed velocity,
  // instead of controlling its velocity with tilt or a joystick.
  if (level == 34) {
    // default side-scroller setup.  Note that neither the hero nor the bounding box has
    // friction
    stage.world.camera.setBounds(0, 0, 128, 9);
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    drawBoundingBox(0, 0, 128, 9, .1, { density: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0, disableRotation: true }),
      movement: new ManualMovement({ gravityAffectsIt: true }),
      role: new Hero(),
    });
    // Give the hero a fixed velocity
    (h.movement as ManualMovement).addVelocity(10, 0);

    cfg = { cx: 124, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // center the camera a little ahead of the hero, so we can see more of the
    // world during gameplay
    stage.world.camera.setCameraFocus(h, 6, 0);
    // Put a button on screen that makes the hero jump. Note that we can put a
    // delay (in this case, 9000 milliseconds) to prevent rapid re-jumping.  If
    // you make it 0, you still can't jump while in the air, but you can jump as
    // soon as you land.
    addTapControl(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, jumpAction(h, 0, -10, 9000));
    // set up the backgrounds
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 0, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // if the hero jumps over the destination, we have a problem. To fix
    // it, let's put an invisible enemy right after the destination, so
    // that if the hero misses the destination, it hits the enemy and we
    // can start over. Of course, we could just do the destination like
    // this instead, but this is more fun...
    let boxCfg = { cx: 127, cy: 4.5, width: 0.5, height: 9, img: "" };
    // Note: to debug this, you might want to temporarily move the hero to x=100
    // or so, so it doesn't take so long to get to it :)
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Enemy(),
    });

    welcomeMessage("Press anywhere to jump");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // the default is that once a hero jumps, it can't jump again until it touches
  // an obstacle (floor or wall). Here, we enable multiple jumps. Coupled with a
  // small jump impulse, this makes jumping feel more like swimming or
  // controlling a helicopter.
  else if (level == 35) {
    // Note: we can go above the trees
    stage.world.camera.setBounds(0, 0, 64, 15);
    stage.world.setGravity(0, 10);
    drawBoundingBox(0, 0, 64, 15, .1, { density: 1 });
    let boxCfg = { cx: 0.25, cy: 10, width: 0.75, height: 0.75, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 0, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero({ allowMultiJump: true }),
    });
    // You might be wondering why we can't provide the velocity as part of the
    // creation of ExplicitMovement.  It's complicated... the movement actually
    // gets attached to the rigid body, but the movement isn't connected to the
    // rigid body until the preceding line *finishes*, so the best we can do is
    // add the velocity after we make the movement.
    (h.movement as ManualMovement).addVelocity(5, 0);

    stage.world.camera.setCameraFocus(h, 6, 0);
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 10.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // Now we'll say that the destination is as high as the screen, so reaching
    // the end means victory
    addTapControl(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, jumpAction(h, 0, -5, 0));
    boxCfg = { cx: 63.5, cy: 7.5, width: 0.5, height: 15, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // Draw some random scattered enemies.  They'll be between 10 and 60 in X,
    // and between 0 and 14 in the Y
    for (let i = 0; i < 30; ++i) {
      let cfg = { cx: 10 + getRandom(50), cy: getRandom(14), radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Enemy(),
      });
    }

    // This level would be more challenging if the floor was lava (a big
    // enemy)... Try changing it!

    welcomeMessage("Multi-jump is enabled");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level only exists to show that backgrounds can scroll vertically.
  else if (level == 41) {
    // set up a level where tilt only makes the hero move up and down
    stage.world.camera.setBounds(0, 0, 16, 36);
    enableTilt(0, 10);
    drawBoundingBox(0, 0, 16, 36, .1, { density: 1, friction: 1 });
    let cfg = { cx: 2, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.world.camera.setCameraFocus(h);

    // Win by reaching the bottom
    let boxCfg = { cx: 8, cy: 35.5, width: 16, height: 1, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // set up vertical scrolling backgrounds.  I was lazy and didn't make
    // anything that looks even halfway good.
    stage.backgroundColor = "#ff00ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1, isHorizontal: false });
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0, isHorizontal: false });
    stage.background.addLayer({ cx: 8, cy: 6.4, }, { imageMaker: () => new ImageSprite({ width: 16, height: 2.8, img: "front.png" }), speed: 0.5, isHorizontal: false });

    welcomeMessage("Vertical scroller demo");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows callbacks that run on a collision between hero and
  // obstacle. In this case, it lets us draw out the next part of the level
  // later, instead of drawing the whole thing right now. In a real level, we'd
  // draw a few screens at a time, and not put the callback obstacle at the end
  // of a screen, so that we'd never see the drawing of stuff taking place, but
  // for this demo, that's actually a nice effect.
  else if (level == 61) {
    enableTilt(10, 10);
    welcomeMessage("Keep going right!");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 64, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    stage.world.camera.setBounds(0, 0, 64, 9);

    let cfg = { cx: 2, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.world.camera.setCameraFocus(h);
    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => stage.score.getGoodieCount(0) + " Goodies");
    stage.score.setVictoryDestination(1);

    // this obstacle is a collision callback... when the hero hits it, we'll run
    // a script to build the next part of the level.
    let boxCfg = { cx: 14, cy: 4.5, width: 1, height: 9, img: "purple_ball.png" };
    let callback_obstacle = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 1 }),
      movement: new ManualMovement(),
      role: new Obstacle({ disableHeroCollision: true }),
    });

    // Let's count how many goodies we collect
    let collects = 0;

    // Here's a script for making goodies
    let makeGoodie = function (x: number) {
      cfg = { cx: x, cy: 8, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie({
          onCollect: () => {
            collects++;
            (callback_obstacle.role as Obstacle).disableCollision(CollisionExemptions.HERO);
            return true;
          }
        }),
      });
    }

    // And now we can make the script to run when the hero collides with the
    // obstacle
    let handleCollision = function () {
      // If the obstacle is still at its starting point, we move it and add a
      // goodie
      if (callback_obstacle.rigidBody.getCenter().x == 14) {
        callback_obstacle.rigidBody.setCenter(30, 4.5);
        makeGoodie(18);
        (callback_obstacle.role as Obstacle).enableCollision(CollisionExemptions.HERO);
        // Notice that we can explicitly play a sound like this:
        stage.musicLibrary.getSound("high_pitch.ogg").play();
        return;
      }

      // If the obstacle is at 30, we need a goodie to have been collected
      if (callback_obstacle.rigidBody?.getCenter().x == 30) {
        if (collects != 1) return;
        callback_obstacle.rigidBody.setCenter(50, 4.5);
        makeGoodie(46);
        (callback_obstacle.role as Obstacle).enableCollision(CollisionExemptions.HERO);
        stage.musicLibrary.getSound("high_pitch.ogg").play();
        return;
      }

      // if the obstacle is at 50, we need two goodies
      else if (callback_obstacle.rigidBody?.getCenter().x == 50) {
        if (collects != 2) return;
        callback_obstacle.rigidBody.setCenter(60, 4.5);
        makeGoodie(56);
        (callback_obstacle.role as Obstacle).enableCollision(CollisionExemptions.HERO);
        stage.musicLibrary.getSound("high_pitch.ogg").play();
        return;
      }

      // if the obstacle is at 60 and we have 3 goodies, remove the obstacle,
      // pause the game, draw the destination.
      else if (callback_obstacle.rigidBody?.getCenter().x == 60) {
        if (collects != 3) return;
        callback_obstacle.remove();

        stage.musicLibrary.getSound("high_pitch.ogg").play();

        // print a message and pause the game, via PauseScene
        stage.requestOverlay((overlay: Scene) => {
          addTapControl(overlay,
            { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000" },
            () => { stage.clearOverlay(); return true; }
          );
          makeText(overlay,
            { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
            () => "The destination is now available");

          cfg = { cx: 63, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
          Actor.Make({
            appearance: new ImageSprite(cfg),
            rigidBody: new CircleBody(cfg, stage.world),
            role: new Destination(),
          });
        }, false);
      }
    };

    // Now we can connect the script to the obstacle
    (callback_obstacle.role as Obstacle).heroCollision = handleCollision;
  }

  // Here's the start of doodle jump.  The main idea is that the platform is
  // "one-sided", but also has a script that runs when the hero collides with
  // it, to give a jump-like boost.
  else if (level == 76) {
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    welcomeMessage("One-sided + Callbacks");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1, friction: 0.5, disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // create a platform that we can jump through from below
    let platform_cfg = { z: -1, cx: 3, cy: 7.5, width: 2, height: 0.2, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(platform_cfg),
      rigidBody: new BoxBody(platform_cfg, stage.world, { collisionsEnabled: true, singleRigidSide: Sides.TOP }),
      // Set a callback, then re-enable the platform's collision effect.
      role: new Obstacle({ heroCollision: (_thisActor: Actor, collideActor: Actor) => (collideActor.movement as ManualMovement).updateYVelocity(-5) }),
    });
  }

  // This level shows how to make something that feels "infinite".  It also
  // shows "foreground" layers
  else if (level == 88) {
    // set up a standard side scroller, but make it really really long, to
    // emulate infinite length
    stage.world.camera.setBounds(0, 0, undefined, 9);
    stage.world.setGravity(0, 10);
    welcomeMessage("Press to make the hero go up");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 300000, 9, .1);

    // make a hero, have the camera follow it
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 0.1, friction: 0, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).setAbsoluteVelocity(5, 0);
    stage.world.camera.setCameraFocus(h);

    // touching the screen makes the hero go upwards
    addToggleButton(stage.hud,
      { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      () => (h.movement as ManualMovement).updateYVelocity(-5),
      () => (h.movement as ManualMovement).updateYVelocity(0)
    );

    // set up our background, with a few layers
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 });
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 2.8, img: "front.png" }), speed: -0.5 });

    // Add a foreground layer
    stage.foreground.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // we win by collecting 10 goodies...
    stage.score.setVictoryGoodies(10, 0, 0, 0);
    makeText(stage.hud,
      { cx: 1, cy: 1, center: false, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 20, z: 2 },
      () => stage.score.getGoodieCount(0) + " goodies");

    // This is a bit tricky... we don't want to create the whole level all at
    // once, so what we'll do is draw the first part, and then make a sensor
    // (which is just like an obstacle).  Every time the hero collides with the
    // sensor, we'll draw the next part of the world, and move the obstacle
    // forward some more.
    let boxCfg = { cx: 16, cy: 4.5, width: 1, height: 9, img: "" };
    let sensor = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Sensor(),
    });

    // The code for the sensor is complicated, so we'll make it as a function,
    // then attach it to the sensor.role.
    //
    // This code will run when the hero collides with the sensor
    let lc = function () {
      // Make a new enemy.  Notice that we use the sensor's location as the
      // starting point, and we add a random distance to it, so that the level
      // isn't too predictable.
      let cfg = {
        // It's at least 8 meters ahead of the sensor, so that we won't see it
        // appear on screen.
        cx: sensor.rigidBody!.getCenter().x + 8 + getRandom(10),
        cy: .25 + getRandom(8),
        width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png",
      };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Enemy(),
      });

      // Now draw a goodie.  It should be at least 9 ahead of the sensor
      cfg = {
        cx: (sensor.rigidBody?.getCenter().x ?? 0) + 9 + getRandom(10),
        cy: .25 + getRandom(8),
        width: 0.5, radius: 0.25, height: 0.5, img: "blue_ball.png",
      };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie(),
      });

      // Move the sensor forward, so we can re-use it
      sensor.rigidBody!.setCenter(sensor.rigidBody!.getCenter().x + 16, 4.5);
    };

    // Finally, attach the code to the sensor
    (sensor.role as Sensor).heroCollision = lc;
  }

}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
