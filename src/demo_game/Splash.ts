// Last review: 08-10-2023

import * as Helpers from "./helpers";
import { ImageSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { game } from "../jetlag/Stage";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { InertMovement } from "../jetlag/Components/Movement";
import { Passive } from "../jetlag/Components/Role";

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
  Helpers.setMusic("tune.ogg");

  // draw the background. Note that "Play", "Help", and "Quit" are part of the
  // image.  Since the world is 16x9 meters, and we want it to fill the screen,
  // we'll make its dimensions 16x9, and center it at (8, 4.5).  We use z = -2,
  // so this will be behind everything.
  new Actor({
    scene: game.world,
    appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "splash.png" }),
    rigidBody: RigidBodyComponent.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, game.world, { collisionsEnabled: false }),
    movement: new InertMovement(),
    role: new Passive(),
  });

  // Place an invisible button over the "Play" text of the background image,
  // and set it up so that pressing it switches to the first page of the level
  // chooser.
  // test
  Helpers.addTapControl(game.hud, { cx: 8, cy: 5.625, width: 2.5, height: 1.25, img: "" }, () => {
    game.switchTo(game.config.chooserBuilder, 1 + 1 - 1);
    return true;
  });

  // Do the same, but this button goes to the first help screen
  Helpers.addTapControl(game.hud, { cx: 3.2, cy: 6.15, width: 1.8, height: 0.9, img: "" }, () => {
    game.switchTo(game.config.helpBuilder, 1);
    return true;
  });

  // Set up the quit button
  Helpers.addTapControl(game.hud, { cx: 12.75, cy: 6.1, width: 2, height: 0.9, img: "" }, () => {
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
  if (Helpers.getVolume())
    (mute.appearance as ImageSprite).setImage("audio_on.png");
  // when the obstacle is touched, switch the mute state and update the picture
  mute.gestures = {
    tap: () => {
      Helpers.toggleMute();
      if (Helpers.getVolume()) (mute.appearance as ImageSprite).setImage("audio_on.png");
      else (mute.appearance as ImageSprite).setImage("audio_off.png");
      return true;
    }
  };
}
