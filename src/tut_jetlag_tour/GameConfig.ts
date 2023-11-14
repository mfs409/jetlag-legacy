import { GameCfg } from "../jetlag/Config";
import { ErrorVerbosity } from "../jetlag/Services/Console";
import { ImageSprite } from "../jetlag/Components/Appearance";
import { Scene } from "../jetlag/Entities/Scene";
import { InertMovement } from "../jetlag/Components/Movement";
import { Actor } from "../jetlag/Entities/Actor";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { BoxCfgOpts, AdvancedRigidBodyCfgOpts, ImgConfigOpts } from "../jetlag/Config";
import { Obstacle, Passive } from "../jetlag/Components/Role";
import { game } from "../jetlag/Stage";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class GameConfig implements GameCfg {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "com.me.my_jetlag_game.storage";
  verbosity = ErrorVerbosity.LOUD;
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  You'll
  // probably want to delete these files from the assets folder, remove them
  // from these lists, and add your own.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [
    // The non-animated actors in the game
    "green_ball.png", "mustard_ball.png", "red_ball.png", "blue_ball.png", "purple_ball.png", "grey_ball.png",

    // Images that we use for buttons in the Splash and Chooser
    "left_arrow.png", "right_arrow.png", "back_arrow.png", "level_tile.png", "audio_on.png", "audio_off.png",

    // Some raw colors
    "black.png", "red.png", // TODO: stop needing these!

    // Background images for OverlayScenes
    "msg2.png", "fade.png",

    // The backgrounds for the Splash and Chooser
    "splash.png", "chooser.png",

    // Layers for Parallax backgrounds and foregrounds
    "mid.png", "front.png", "back.png",

    // The animation for a star with legs
    "leg_star_1.png", "leg_star_2.png", "leg_star_3.png", "leg_star_4.png", "leg_star_5.png", "leg_star_6.png", "leg_star_7.png", "leg_star_8.png",

    // The animation for the star with legs, with each image flipped
    "flip_leg_star_1.png", "flip_leg_star_2.png", "flip_leg_star_3.png", "flip_leg_star_4.png", "flip_leg_star_5.png", "flip_leg_star_6.png", "flip_leg_star_7.png", "flip_leg_star_8.png",

    // The flying star animation
    "fly_star_1.png", "fly_star_2.png",

    // Animation for a star that expands and then disappears
    "star_burst_1.png", "star_burst_2.png", "star_burst_3.png", "star_burst_4.png",

    // eight colored stars
    "color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png", "color_star_5.png", "color_star_6.png", "color_star_7.png", "color_star_8.png",

    // background noise, and buttons
    "noise.png", "pause.png",
  ];

  // The name of the function that builds the initial screen of the game
  gameBuilder = my_game_code;
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
 * @param index Which splash screen should be displayed
 */
function my_game_code(_level: number) {
  // Based on the values in GameConfig.ts, we can expect to have a level that is
  // 1600x900 pixels (16x9 meters), with no default gravitational forces

  // start the music
  setMusic("tune.ogg");

  // draw the background. Note that "Play", "Help", and "Quit" are part of the
  // image.  Since the world is 16x9 meters, and we want it to fill the screen,
  // we'll make its dimensions 16x9, and center it at (8, 4.5).  We use z = -2,
  // so this will be behind everything.
  new Actor({
    scene: game.world,
    appearance: new ImageSprite({ width: 16, height: 9, img: "splash.png" }),
    rigidBody: RigidBodyComponent.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, game.world, { collisionsEnabled: false }),
    movement: new InertMovement(),
    role: new Passive(),
  });

  // Place an invisible button over the "Play" text of the background image,
  // and set it up so that pressing it switches to the first page of the level
  // chooser.
  // test
  addTapControl(game.hud, { cx: 8, cy: 5.625, width: 2.5, height: 1.25, img: "" }, () => {
    game.switchTo(() => { }, 1);
    return true;
  });

  // Do the same, but this button goes to the first help screen
  addTapControl(game.hud, { cx: 3.2, cy: 6.15, width: 1.8, height: 0.9, img: "" }, () => {
    game.switchTo(() => { }, 1);
    return true;
  });

  // Set up the quit button
  addTapControl(game.hud, { cx: 12.75, cy: 6.1, width: 2, height: 0.9, img: "" }, () => {
    game.score.doQuit();
    return true;
  });

  // Draw a mute button
  let cfg = { box: true, cx: 15, cy: 8, width: 0.75, height: 0.75, img: "audio_off.png" };
  let mute = new Actor({
    scene: game.world,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, game.world),
    movement: new InertMovement(),
    role: new Passive(),
  });
  // If the game is not muted, switch the image
  if (getVolume())
    (mute.appearance as ImageSprite).setImage("audio_on.png");
  // when the obstacle is touched, switch the mute state and update the picture
  mute.gestures = {
    tap: () => {
      toggleMute();
      if (getVolume()) (mute.appearance as ImageSprite).setImage("audio_on.png");
      else (mute.appearance as ImageSprite).setImage("audio_off.png");
      return true;
    }
  };
}

/** Manage the state of Mute */
function toggleMute() {
  // volume is either 1 or 0, switch it to the other and save it
  let volume = 1 - parseInt(game.storage.getPersistent("volume") ?? "1");
  game.storage.setPersistent("volume", "" + volume);
  // update all music
  game.musicLibrary.resetMusicVolume(volume);
}

/**
 * Use this to determine if the game is muted or not.  True corresponds to not
 * muted, false corresponds to muted.
 */
function getVolume() {
  return (game.storage.getPersistent("volume") ?? "1") === "1";
}

/**
 * Set the background music for this level
 *
 * @param musicName Name of the music file to play.  Remember: this file
 *                  must have been registered as Music, not as a Sound
 */
function setMusic(musicName: string) {
  game.stageMusic.setMusic(game.musicLibrary.getMusic(musicName));
}

/**
 * Draw a box on the scene
 *
 * TODO:  This is a placeholder.  We should use it, instead of just exporting it
 *        to dodge an error message.
 *
 * Note: the box is actually four narrow rectangles
 *
 * @param x0         X coordinate of left side
 * @param y0         Y coordinate of top
 * @param x1         X coordinate of right side
 * @param y1         Y coordinate of bottom
 * @param thickness  How thick should the box be?
 * @param commonCfg  Common extra configuration options for the walls
 */
export function drawBoundingBox(x0: number, y0: number, x1: number, y1: number, thickness: number, commonCfg: AdvancedRigidBodyCfgOpts = {}) {
  // Bottom box:
  let width = Math.abs(x0 - x1);
  let cfg = { box: true, cx: x0 + width / 2, cy: y1 + thickness / 2, width: width + 2 * thickness, height: thickness, img: "" };
  new Actor({
    scene: game.world,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, game.world, commonCfg),
    movement: new InertMovement(),
    role: new Obstacle(),
  });
  // TODO: we shouldn't need appearance to get debug contexts

  // The top only differs by translating the Y from the bottom
  cfg.cy -= (thickness + Math.abs(y0 - y1));// = { box: true, cx: x0 + width / 2, cy: y0 - height / 2 + .5, width, height, img: "" };
  new Actor({
    scene: game.world,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, game.world, commonCfg),
    movement: new InertMovement(),
    role: new Obstacle(),
  });

  // Right box:
  let height = Math.abs(y0 - y1);
  cfg = { box: true, cx: x1 + thickness / 2, cy: y0 + height / 2, height: height + 2 * thickness, width: thickness, img: "" };
  new Actor({
    scene: game.world,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, game.world, commonCfg),
    movement: new InertMovement(),
    role: new Obstacle(),
  });

  // The left only differs by translating the X
  cfg.cx -= (thickness + Math.abs(x0 - x1));
  new Actor({
    scene: game.world,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, game.world, commonCfg),
    movement: new InertMovement(),
    role: new Obstacle(),
  });
}

/**
 * Add a button that performs an action when clicked.
 *
 * @param scene The scene where the button should go
 * @param cfg   Configuration for an image and a box
 * @param tap   The code to run in response to a tap
 */
function addTapControl(scene: Scene, cfg: ImgConfigOpts & BoxCfgOpts, tap: (coords: { x: number; y: number }) => boolean) {
  // TODO: we'd have more flexibility if we passed in an appearance, or just got
  // rid of this, but we use it too much for that refactor to be worthwhile.
  let c = new Actor({
    scene,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, scene),
    movement: new InertMovement(),
    role: new Passive(),
  });
  c.gestures = { tap };
  return c;
}
