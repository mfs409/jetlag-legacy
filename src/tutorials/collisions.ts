import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig, Sides } from "../jetlag/Config";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ChaseMovement, ManualMovement, Path, PathMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Enemy, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { AdvancedCollisionSystem } from "../jetlag/Systems/Collisions";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { boundingBox, enableTilt } from "./common";

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
  musicNames = [];
  soundNames = [];
  imageNames = ["sprites.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  boundingBox();
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };

  if (level == 1) {
    // It can be useful to make a hero stick to an obstacle. As an example, if
    // the hero should stand on a platform that moves along a path, then we will
    // want the hero to "stick" to it, even as the platform moves downward.
    stage.world.setGravity(0, 10);
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (hero.role as Hero).jump(0, -7.5); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });

    // This platform is sticky on top... Jump onto it and watch what happens
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 0.25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 2, cy: 6, width: 2, height: 0.25 }, { stickySides: [Sides.TOP], density: 100, friction: 0.1 }),
      movement: new PathMovement(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true),
      role: new Obstacle(),
    });
    // Be sure to try out bottomSticky, leftSticky, and rightSticky

    // This obstacle is not sticky... The hero can slip around on it
    //
    // It's tempting to think "I'll use some friction here", but that still
    // wouldn't help with when the platform reaches the top of its path
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 0.25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 11, cy: 6, width: 2, height: 0.25 }, { density: 100, friction: 1 }),
      movement: new PathMovement(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true),
      role: new Obstacle(),
    });
  }

  else if (level == 2) {
    // Another popular feature is walls that can be passed through in one
    // direction, but not another
    enableTilt(10, 10);

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // create a box that is easy to fall into, but hard to get out of,
    // by making its sides each "one-sided"
    Actor.Make({
      appearance: new FilledBox({ width: 3, height: 0.2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 4.5, cy: 3.1, width: 3, height: 0.2 }, { singleRigidSide: Sides.BOTTOM }),
      role: new Obstacle(),
    });

    Actor.Make({
      appearance: new FilledBox({ width: 0.2, height: 3, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 3.1, cy: 4.5, width: 0.2, height: 3 }, { singleRigidSide: Sides.RIGHT }),
      role: new Obstacle(),
    });

    Actor.Make({
      appearance: new FilledBox({ width: 0.2, height: 3, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 5.9, cy: 4.5, width: 0.2, height: 3 }, { singleRigidSide: Sides.LEFT }),
      role: new Obstacle(),
    });

    Actor.Make({
      appearance: new FilledBox({ width: 3, height: 0.2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 4.5, cy: 7.5, width: 3, height: 0.2 }, { singleRigidSide: Sides.TOP }),
      role: new Obstacle(),
    });
  }

  else if (level == 3) {
    // Sometimes, we want to say that certain actors can pass through others
    enableTilt(10, 10);
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { passThroughId: 7 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // the enemy chases the hero, but can't get through the wall
    Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 2, radius: 0.25 }, { dynamic: true }),
      movement: new ChaseMovement({ speed: 1, target: h, chaseInX: true, chaseInY: true }),
      role: new Enemy(),
    });
    // Remember to make it dynamic, or it *will* go through the wall

    Actor.Make({
      appearance: new FilledBox({ width: 0.1, height: 7, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 1, width: 0.1, height: 7 }, { passThroughId: 7 }),
      role: new Obstacle(),
    });
  }

  else if (level == 4) {
    // We previously saw that we can have "sticky" actors, and also allow actors
    // to pass through other actors by making only certain sides rigid.  In this
    // example, we make sure they work together, by letting the hero jump
    // through a platform, and then stick to it.
    stage.world.setGravity(0, 10);
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (hero.role as Hero).jump(0, -7.5); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });

    // This obstacle is sticky on top, and only rigid on its top
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 0.25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 2, cy: 6, width: 2, height: 0.25, }, { stickySides: [Sides.TOP], singleRigidSide: Sides.TOP, density: 100, friction: 0.1 }),
      movement: new PathMovement(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true),
      role: new Obstacle(),
    });

    // This obstacle is not sticky, and it is rigid on all sides
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 0.25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 11, cy: 6, width: 2, height: 0.25, }, { density: 100, friction: 1 }),
      movement: new PathMovement(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true),
      role: new Obstacle(),
    })
  }

  else if (level == 5) {
    // Everything we've looked at so far deals with when collisions *start*.
    // Sometimes, we want to do something when the collision *ends*.
    enableTilt(10, 10);
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    let collisions = 0;
    let messages = ["Please leave me alone", "Why do you bother me so?", "Fine, you win."]
    let o = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Obstacle({
        heroCollision: () => {
          let text = Actor.Make({
            appearance: new TextSprite({ center: false, face: "Arial", size: 30, color: "#FF00FF" }, () => messages[collisions]),
            rigidBody: new BoxBody({ cx: 12, cy: 6, width: .01, height: .01 })
          });
          (stage.world.physics as AdvancedCollisionSystem).addEndContactHandler(o, h, () => {
            collisions++;
            text.remove();
            if (collisions == 3) stage.score.winLevel();
          });
        }
      }),
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
