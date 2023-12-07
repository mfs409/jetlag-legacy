import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, GameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox } from "../jetlag/Components/Appearance";
import { ExplicitMovement } from "../jetlag/Components/Movement";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";

/**
 * A single place for storing screen dimensions and other game configuration, as
 * well as the names of all the assets (images and sounds) used by this game.
 */
export class EmptyGameConfig implements GameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "com.me.my_jetlag_game.storage";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  You'll
  // probably want to delete these files from the assets folder, remove them
  // from these lists, and add your own.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [
    "alien.json"
  ];

  // The name of the function that builds the initial screen of the game
  gameBuilder = tut_animations;
}

/**
 * buildSplashScreen is used to draw the scene that we see when the game starts.
 * In our case, it's just a menu.  The splash screen is mostly just branding: it
 * usually just has a big logo and then buttons for going to the level chooser,
 * the store, and the help scenes.  On a phone, it should also have a button for
 * quitting the app.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is an index parameter.  In this code, we just ignore the index.
 *
 * @param level Which splash screen should be displayed
 */
export function tut_animations(_level: number) {
  // Draw four walls, covering the four borders of the world
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: BoxBody.Box({ cx: 8, cy: .05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: BoxBody.Box({ cx: 8, cy: 8.95, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: BoxBody.Box({ cx: .05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: BoxBody.Box({ cx: 15.95, cy: 4.5, width: .1, height: 9 }),
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
    rigidBody: BoxBody.Box({ cx: 3, cy: 4, width: 1, height: 2 }, stage.world),
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    role: new Hero(),
    movement: new ExplicitMovement(),
  });

  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ExplicitMovement).updateYVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ExplicitMovement).updateYVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ExplicitMovement).updateXVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ExplicitMovement).updateXVelocity(0)));

  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ExplicitMovement).updateYVelocity(-5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ExplicitMovement).updateYVelocity(5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ExplicitMovement).updateXVelocity(-5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ExplicitMovement).updateXVelocity(5)));

  // TODO: Make some "collecting stuff"
  // TODO: Make some "crafting"
  // TODO: Make some "watering plants" (toss) (pirate_thrust) (pirate_walk)
  // TODO: Make some "sword" (toss) (pirate_slash_s) (pirate_walk_s)
  // TODO: Make some "invincibility"
  // TODO: Persist across sessions
  // TODO: Good stuff across "days"
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new EmptyGameConfig());
