import { FilledSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { game } from "../jetlag/Stage";

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
export function build_game(_level: number) {
  // TODO: Replace this line with a grid builder for debug mode?
  // Actor.Make({
  //   scene: game.world,
  //   rigidBody: RigidBodyComponent.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, game.world),
  //   appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "grid.png" })
  // });

  game.world.tilt!.tiltMax.Set(10, 10);
  game.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (game.accelerometer.accel.y = 0));
  game.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (game.accelerometer.accel.y = 0));
  game.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (game.accelerometer.accel.x = 0));
  game.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (game.accelerometer.accel.x = 0));

  game.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (game.accelerometer.accel.y = -5));
  game.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (game.accelerometer.accel.y = 5));
  game.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (game.accelerometer.accel.x = -5));
  game.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (game.accelerometer.accel.x = 5));
  game.world.tilt!.tiltVelocityOverride = false;

  for (let x = 0; x <= 16; x += 1) {
    Actor.Make({
      scene: game.world,
      rigidBody: RigidBodyComponent.Box({ cx: x, cy: 4.5, width: 0.01, height: 9 }, game.world),
      appearance: FilledSprite.Box({ width: 0.01, height: 9, lineWidth: 1, lineColor: "#000000" })
    });

    if (x < 16)
      Actor.Make({
        scene: game.world,
        rigidBody: RigidBodyComponent.Box({ cx: x + .5, cy: 4.5, width: 0.01, height: 9 }, game.world),
        appearance: FilledSprite.Box({ width: 0.01, height: 9, lineWidth: 0.5, lineColor: "#1100DC" })
      });
  }

  for (let y = 0; y <= 9; y += 1) {
    Actor.Make({
      scene: game.world,
      rigidBody: RigidBodyComponent.Box({ cx: 8, cy: y, width: 16, height: 0.01 }, game.world),
      appearance: FilledSprite.Box({ width: 16, height: 0.01, lineWidth: 1, lineColor: "#000000" })
    });

    if (y < 9)
      Actor.Make({
        scene: game.world,
        rigidBody: RigidBodyComponent.Box({ cx: 8, cy: y + .5, width: 16, height: 0.01 }, game.world),
        appearance: FilledSprite.Box({ width: 16, height: 0.01, lineWidth: 0.5, lineColor: "#1100DC" })
      });
  }

  Actor.Make({
    scene: game.world,
    rigidBody: RigidBodyComponent.Box({ cx: 3, cy: 4, width: 1, height: 1 }, game.world),
    appearance: FilledSprite.Box({ width: 1, height: 1, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Obstacle(),
  })

  Actor.Make({
    scene: game.world,
    rigidBody: RigidBodyComponent.Circle({ cx: 5, cy: 2, radius: .5 }, game.world),
    appearance: FilledSprite.Circle({ radius: .5, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Hero(),
    movement: new TiltMovement(),
  })

  Actor.Make({
    scene: game.world,
    rigidBody: RigidBodyComponent.Polygon({ cx: 10, cy: 5, vertices: [0, -.5, .5, 0, 0, .5, -.5, 0], width: 1, height: 1 }, game.world),
    appearance: FilledSprite.Polygon({ vertices: [0, -.5, .5, 0, 0, .5, -.5, 0], fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Obstacle(),
  })
}
