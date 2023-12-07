import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { buildChooserScreen } from "./Chooser";
import { buildHelpScreen } from "./Help";
import { MusicComponent } from "../jetlag/Components/Music";

/**
 * buildSplashScreen is used to draw the scene that we see when the game starts.
 * In our case, it's just a menu.  The splash screen is mostly just branding: it
 * usually just has a big logo and then buttons for going to the level chooser,
 * the store, and the help scenes.  On a phone, it should also have a button for
 * quitting the app.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is a level parameter.  In this code, we just ignore it.
 *
 * @param level Which splash screen should be displayed
 */
export function buildSplashScreen(_level: number) {
  // Based on the values in GameConfig.ts, we can expect to have a level that is
  // 1600x900 pixels (16x9 meters), with no default gravitational forces

  // start the music
  stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic("tune.ogg"));

  // Paint the background white
  stage.backgroundColor = "#FFFFFF";

  // Draw a brown box at the top of the screen, put some text in it
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: 3, fillColor: "#523216" }),
    rigidBody: new BoxBody({ cx: 8, cy: 1.5, width: 16, height: 3 }),
  });
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", size: 120, color: "#FFFFFF" }, "JetLag Demo"),
    rigidBody: new BoxBody({ cx: 8, cy: 1.25, width: .1, height: .1 }),
  });
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", size: 56, color: "#FFFFFF" }, "2D Games for Web and Mobile"),
    rigidBody: new BoxBody({ cx: 8, cy: 2.4, width: .1, height: .1 }),
  });

  // Draw some text.  Tapping its *rigidBody* will go to the first page of the
  // level chooser
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", size: 96, color: "#000000" }, "Play"),
    rigidBody: new BoxBody({ cx: 8, cy: 5.625, width: 2.5, height: 1.25 }),
    gestures: { tap: () => { stage.switchTo(buildChooserScreen, 1); return true; } }
  });

  // Make some text for going to the help screen
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", size: 72, color: "#000000" }, "Help"),
    rigidBody: new BoxBody({ cx: 3.2, cy: 6.15, width: 1.8, height: 0.9 }),
    gestures: { tap: () => { stage.switchTo(buildHelpScreen, 1); return true; } }
  });

  // Make a quit button
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", size: 72, color: "#000000" }, "Quit"),
    rigidBody: new BoxBody({ cx: 12.75, cy: 6.15, width: 1.8, height: 0.9 }),
    gestures: { tap: () => { stage.exit(); return true; } }
  });

  // Draw a mute button
  let cfg = { box: true, cx: 15, cy: 8, width: 0.75, height: 0.75, img: "audio_off.png" };
  let mute = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg, stage.world),
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
