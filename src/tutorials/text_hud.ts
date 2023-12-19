import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Path, PathMovement, ManualMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";

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
  if (level == 1) {
    // Everything is an actor, and text is just the 'appearance' of the actor.
    // This mean1 that the actor's body is the "anchor" for where the text
    // will go.  The easiest thing is to center the text on the anchor.  If
    // the text isn't also supposed to be interactive, it is sufficient to
    // make a tiny body for it:
    Actor.Make({
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: .01 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 22, color: "#FF0000" }, "JetLag")
    });

    // Every TextSprite must have a face, size, and color.  We can add a fourth
    // pair of digits to the color to make it transparent.  There are optional
    // configuration fields for an outline, too.
    Actor.Make({
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: .01 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "JetLag")
    });

    // Every appearance component has an optional "Z" argument, which can be -2,
    // -1, 0, 1, or 2.  This lets us control how things stack on top of each
    // other.  The default is 0.  If two things have the same Z, the one we made
    // second is the one on top.  So let's put a green ball in Z -1, to see how
    // the transparency worked on that previous text:
    Actor.Make({
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, z: -1, img: "green_ball.png" })
    });

    // Since every actor has a body, we can make Text interactive, just like
    // anything else.  The key thing is that the text's *body* is what is
    // interactive, not its appearance.  So in this case, let's make some text
    // that moves around:
    Actor.Make({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "Tap Me"),
      movement: new PathMovement(new Path().to(1, 1).to(15, 1).to(15, 8).to(1, 8).to(1, 1), 4, true)
    });
  }

  else if (level == 2) {
    // Let's stop that movement, and look at what's happening with that text
    Actor.Make({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "Tap Me"),
      gestures: { tap: () => { console.log("tap"); return true; } }
    });
  }

  else if (level == 3) {
    let tap_count = 0;
    // Let's stop that movement, and look at what's happening with that text
    Actor.Make({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "Taps: " + tap_count),
      gestures: { tap: () => { console.log("tap"); tap_count += 1; return true; } }
    });
  }

  else if (level == 4) {
    // When did the previous code run?
    let tap_count = 0;
    Actor.Make({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite(
        { center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 },
        () => "Taps: " + tap_count),
      gestures: { tap: () => { tap_count += 1; return true; } }
    });
  }

  else if (level == 5) {
    // The text moved in a weird way when the count went above 9.  Let's not
    // center?

    let tap_count = 0;
    Actor.Make({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 },
        () => "Taps: " + tap_count),
      gestures: { tap: () => { tap_count += 1; return true; } }
    });
    // Uh-oh, un-centering doesn't do what we want.  If you want interactive
    // text that isn't centered, you're probably going to want to use two
    // actors, an invisible but interactive one, and a visible but inert one.
  }

  else if (level == 6) {
    // We can put arbitrary code in the "producer" for the TextSprite:
    let hero = Actor.Make({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new ManualMovement({ rotateByDirection: true }),
    });

    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: .5, radius: .001 }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (hero.movement as ManualMovement).addVelocity(-1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (hero.movement as ManualMovement).addVelocity(1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (hero.movement as ManualMovement).addVelocity(0, -1))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (hero.movement as ManualMovement).addVelocity(0, 1))

    // Oh no, adding this doesn't do what we want
    stage.world.camera.setCameraFocus(hero);
  }

  else if (level == 7) {
    let hero = Actor.Make({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new ManualMovement({ rotateByDirection: true }),
    });

    // such a small change... we will just put this actor on the heads-up
    // display instead of in the world.
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: .5, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (hero.movement as ManualMovement).addVelocity(-1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (hero.movement as ManualMovement).addVelocity(1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (hero.movement as ManualMovement).addVelocity(0, -1))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (hero.movement as ManualMovement).addVelocity(0, 1))

    // Notice that we did not put any bounds on the camera, so the visible world
    // is going to be "infinite".
    stage.world.camera.setCameraFocus(hero);
  }

  else if (level == 8) {
    // This is probably going to look bad, but let's notice that we can make
    // *anything* on the HUD.  We probably don't want heroes or enemies or other
    // such roles, but certainly we can have different kinds of appearance, and
    // they can even have movement.

    let hero = Actor.Make({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new ManualMovement({ rotateByDirection: true }),
    });

    Actor.Make({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }, { scene: stage.hud }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new PathMovement(new Path().to(1, 1).to(15, 1).to(15, 8).to(1, 8).to(1, 1), 4, true)
    });

    // For reference, here's the "Arial" font that we had been using so far
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: .5, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });

    // You can add fonts to your game by linking to them in your html file.  In
    // this case, I've added a link for the "Lato" font:
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: 1.5, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Lato", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });

    // You can also add fonts by *downloading* them into your assets folder, and
    // then linking them differently in your html file.  I did that for the
    // Roboto font
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: 1, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Roboto", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (hero.movement as ManualMovement).addVelocity(-1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (hero.movement as ManualMovement).addVelocity(1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (hero.movement as ManualMovement).addVelocity(0, -1))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (hero.movement as ManualMovement).addVelocity(0, 1))

    stage.world.camera.setCameraFocus(hero);
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
