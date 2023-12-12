import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox } from "../jetlag/Components/Appearance";
import { StandardMovement } from "../jetlag/Components/Movement";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";

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

  // Here's where we name all the images/sounds/background music files.  You'll
  // probably want to delete these files from the assets folder, remove them
  // from these lists, and add your own.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = ["alien.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {
  // Draw four walls, covering the four borders of the world
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: .05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 8.95, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: .05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 15.95, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });

  // Draw a hero.  Note that the animations are pretty tricky
  let animations = new Map();
  animations.set(AnimationState.WALK_N, new AnimationSequence(true)
    .to("alien_walk_u_0.png", 75).to("alien_walk_u_1.png", 75)
    .to("alien_walk_u_2.png", 75).to("alien_walk_u_3.png", 75)
    .to("alien_walk_u_4.png", 75).to("alien_walk_u_5.png", 75)
    .to("alien_walk_u_6.png", 75).to("alien_walk_u_7.png", 75)
    .to("alien_walk_u_8.png", 75));

  animations.set(AnimationState.WALK_W, new AnimationSequence(true)
    .to("alien_walk_l_0.png", 75).to("alien_walk_l_1.png", 75)
    .to("alien_walk_l_2.png", 75).to("alien_walk_l_3.png", 75)
    .to("alien_walk_l_4.png", 75).to("alien_walk_l_5.png", 75)
    .to("alien_walk_l_6.png", 75).to("alien_walk_l_7.png", 75)
    .to("alien_walk_l_8.png", 75));

  animations.set(AnimationState.WALK_S, new AnimationSequence(true)
    .to("alien_walk_d_0.png", 75).to("alien_walk_d_1.png", 75)
    .to("alien_walk_d_2.png", 75).to("alien_walk_d_3.png", 75)
    .to("alien_walk_d_4.png", 75).to("alien_walk_d_5.png", 75)
    .to("alien_walk_d_6.png", 75).to("alien_walk_d_7.png", 75)
    .to("alien_walk_d_8.png", 75));

  animations.set(AnimationState.WALK_E, new AnimationSequence(true)
    .to("alien_walk_r_0.png", 75).to("alien_walk_r_1.png", 75)
    .to("alien_walk_r_2.png", 75).to("alien_walk_r_3.png", 75)
    .to("alien_walk_r_4.png", 75).to("alien_walk_r_5.png", 75)
    .to("alien_walk_r_6.png", 75).to("alien_walk_r_7.png", 75)
    .to("alien_walk_r_8.png", 75));

  animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("alien_thrust_u_0.png", 750).to("alien_thrust_u_1.png", 75));
  animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));
  animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("alien_thrust_d_0.png", 750).to("alien_thrust_d_1.png", 75));
  // demonstrate skip-to:
  // animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 7500).to("alien_thrust_r_1.png", 7500));
  animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

  let remap = new Map();
  remap.set(AnimationState.WALK_NW, AnimationState.WALK_W);
  remap.set(AnimationState.WALK_SW, AnimationState.WALK_W);
  remap.set(AnimationState.WALK_NE, AnimationState.WALK_E);
  remap.set(AnimationState.WALK_SE, AnimationState.WALK_E);
  remap.set(AnimationState.IDLE_NW, AnimationState.IDLE_W);
  remap.set(AnimationState.IDLE_SW, AnimationState.IDLE_W);
  remap.set(AnimationState.IDLE_NE, AnimationState.IDLE_E);
  remap.set(AnimationState.IDLE_SE, AnimationState.IDLE_E);

  const hero = Actor.Make({
    rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 2 }, stage.world),
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    role: new Hero(),
    movement: new StandardMovement(),
  });

  // Demonstrate skip-to
  //  (hero.appearance as AnimatedSprite).skipTo(1, 7000);

  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as StandardMovement).updateYVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as StandardMovement).updateYVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as StandardMovement).updateXVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as StandardMovement).updateXVelocity(0)));

  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as StandardMovement).updateYVelocity(-5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as StandardMovement).updateYVelocity(5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as StandardMovement).updateXVelocity(-5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as StandardMovement).updateXVelocity(5)));
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
