import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";

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


  // This level fleshes out some more poke-to-move stuff. Now we'll say
  // that once a hero starts moving, the player must re-poke the hero
  // before it can be given a new position. Also, the hero will keep
  // moving after the screen is released. We will also show the Fact
  // interface.
  if (level == 77) {
    drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Poke the hero, then  where you want it to go.");
    winMessage("Great Job");
    loseMessage("Try Again");

    let w = AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_8.png", "flip_leg_star_8.png"] });
    let animations = new Map();
    // TODO:  AnimatedSprite::getAnimationState is rather lackluster right now,
    //        leading to a lot of redundancy in these situations.  Consider
    //        something better?
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] }));
    animations.set(AnimationState.IDLE_W, w);
    animations.set(AnimationState.IDLE_NW, w);
    animations.set(AnimationState.IDLE_SW, w);
    animations.set(AnimationState.WALK_W, w);
    animations.set(AnimationState.WALK_SW, w);
    animations.set(AnimationState.WALK_NW, w);

    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, animations,
    };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 1, friction: 0.5 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    h.gestures = { tap: () => { stage.storage.setLevel("selected_entity", h); return true; } };
    // Be sure to change to "false" and see what happens
    createPokeToRunZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, 5, true);

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // We've actually done a few things with "facts" already, but now it's time
    // to discuss them in more detail.
    //
    // JetLag has three kinds of "facts"... level, session, and persistent.  A
    // level fact resets to "undefined" every time you restart the level (by
    // dying, going back to the menu, etc).  A session fact resets to
    // "undefined" every time you refresh the page or close and re-open the
    // browser.  Persistent facts never get reset after you set them, unless you
    // set them to undefined.
    //
    // To test it out, we have three facts (all are just numbers).  You can
    // press the buttons to increment the numbers.  Then exit the level or
    // refresh the page, and watch what happens.
    makeText(stage.hud,
      { cx: 1.25, cy: 0.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Level: " + (stage.storage.getLevel("level test") ?? -1));
    makeText(stage.hud,
      { cx: 1.25, cy: 1, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Session: " + (stage.storage.getSession("session test") ?? -1));
    makeText(stage.hud,
      { cx: 1.25, cy: 1.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Game: " + (stage.storage.getPersistent("game test") ?? "-1"));

    addTapControl(stage.hud,
      { cx: .5, cy: 0.65, width: 0.5, height: 0.5, img: "red_ball.png" },
      () => {
        stage.storage.setLevel("level test", "" + (1 + parseInt(stage.storage.getLevel("level test") ?? -1)));
        return true;
      }
    );
    addTapControl(stage.hud,
      { cx: .5, cy: 1.15, width: 0.5, height: 0.5, img: "blue_ball.png" },
      () => {
        stage.storage.setSession("session test", "" + (1 + parseInt(stage.storage.getSession("session test") ?? -1)));
        return true;
      }
    );
    addTapControl(stage.hud,
      { cx: .5, cy: 1.65, width: 0.5, height: 0.5, img: "green_ball.png" },
      () => {
        stage.storage.setPersistent("game test", "" + (1 + parseInt(stage.storage.getPersistent("game test") ?? "-1")));
        return true;
      }
    );
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
