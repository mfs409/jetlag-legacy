import { FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { InertMovement } from "../jetlag/Components/Movement";
import { Passive } from "../jetlag/Components/Role";
import { buildChooserScreen } from "./Chooser";
import { buildHelpScreen } from "./Help";
import { MusicComponent } from "../jetlag/Components/Music";
import { Scene } from "../jetlag/Entities/Scene";

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
export function buildSplashScreen(_index: number) {
  // Based on the values in GameConfig.ts, we can expect to have a level that is
  // 1600x900 pixels (16x9 meters), with no default gravitational forces

  // start the music
  stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic("tune.ogg"));

  // draw the background. Note that "Play", "Help", and "Quit" are part of the
  // image.  Since the world is 16x9 meters, and we want it to fill the screen,
  // we'll make its dimensions 16x9, and center it at (8, 4.5).  We use z = -2,
  // so this will be behind everything.
  Actor.Make({
    appearance: new ImageSprite({ width: 16, height: 9, img: "splash.png" }),
    rigidBody: BoxBody.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, stage.world, { collisionsEnabled: false }),
    movement: new InertMovement(),
    role: new Passive(),
  });

  // Place an invisible button over the "Play" text of the background image,
  // and set it up so that pressing it switches to the first page of the level
  // chooser.
  // test
  addTapControl(stage.hud, { cx: 8, cy: 5.625, width: 2.5, height: 1.25, fillColor: "#00000000" }, () => {
    stage.switchTo(buildChooserScreen, 1 + 1 - 1);
    return true;
  });

  // Do the same, but this button goes to the first help screen
  addTapControl(stage.hud, { cx: 3.2, cy: 6.15, width: 1.8, height: 0.9, fillColor: "#00000000" }, () => {
    stage.switchTo(buildHelpScreen, 1);
    return true;
  });

  // Set up the quit button
  addTapControl(stage.hud, { cx: 12.75, cy: 6.1, width: 2, height: 0.9, fillColor: "#00000000" }, () => {
    stage.exit();
    return true;
  });

  // Draw a mute button
  let cfg = { box: true, cx: 15, cy: 8, width: 0.75, height: 0.75, img: "audio_off.png" };
  let mute = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world),
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
  let volume = 1 - parseInt(stage.storage.getPersistent("volume") ?? "1");
  stage.storage.setPersistent("volume", "" + volume);
  // update all music
  stage.musicLibrary.resetMusicVolume(volume);
}

/**
 * Use this to determine if the game is muted or not.  True corresponds to not
 * muted, false corresponds to muted.
 */
function getVolume() {
  return (stage.storage.getPersistent("volume") ?? "1") === "1";
}

/**
 * Add a button that performs an action when clicked.
 *
 * @param scene The scene where the button should go
 * @param cfg   Configuration for an image and a box
 * @param tap   The code to run in response to a tap
 */
// TODO: stop needing `any`
function addTapControl(scene: Scene, cfg: any, tap: (coords: { x: number; y: number }) => boolean) {
  // TODO: we'd have more flexibility if we passed in an appearance, or just got
  // rid of this, but we use it too much for that refactor to be worthwhile.
  let c = Actor.Make({
    appearance: new FilledBox(cfg),
    rigidBody: BoxBody.Box(cfg, scene),
  });
  c.gestures = { tap };
  return c;
}
