import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { GravityMovement, HoverMovement, ManualMovement, Path, PathMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { b2Vec2 } from "@box2d/core";

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
  imageNames = ["sprites.json", "noise.png"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // There will be winning and losing in these tutorials, and we'll always want
  // to restart
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };

  // side scroller, fixed speed, jump by touching anywhere
  if (level == 1) {
    // In this level, we're going to cover the screen with a button.  Tapping
    // the button will make the hero jump
    boundingBox();
    stage.world.setGravity(0, 10);

    // A hero who can jump and who is moving
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).setAbsoluteVelocity(5, 0);

    // A destination to reach
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 11, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    // If you don't make it, you'll lose
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 15.95, cy: 4.5, width: .1, height: 9 }),
      role: new Enemy(),
    });

    Actor.Make({
      appearance: new FilledBox({ width: 0.1, height: 0.1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }),
      gestures: { tap: () => { (hero.role as Hero).jump(0, -7.5); return true; } }
    });
    return;
  }

  // We have a problem though... what if the world is bigger?  Does it really
  // make sense to cover the whole screen with the button?
  if (level == 2) {
    // In this level, we're going to cover the screen with a button.  Tapping
    // the button will make the hero jump
    boundingBox2();
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, 32, 9);

    // A background image, to help see that the hero is moving
    Actor.Make({
      appearance: new ImageSprite({ z: -2, width: 32, height: 9, img: "noise.png" }),
      rigidBody: new BoxBody({ cx: 16, cy: 4.5, width: .1, height: .1 }),
    });

    // A hero who can jump and who is moving
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).setAbsoluteVelocity(5, 0);
    stage.world.camera.setCameraFocus(hero);

    // A destination to reach
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 27, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    // If you don't make it, you'll lose
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
      role: new Enemy(),
    });

    // A button for jumping
    Actor.Make({
      appearance: new FilledBox({ width: 0.1, height: 0.1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }), // put it on the HUD
      gestures: { tap: () => { (hero.role as Hero).jump(0, -7.5); return true; } }
    });
  }

  // So far, we've only really looked at the tap gesture.  Now let's look at
  // panning.
  //
  // Panning has three parts: what to do when the pan begins, what to do while
  // it continues, and what to do when it ends.  We'll demonstrate it with a
  // joystick.
  else if (level == 3) {
    boundingBox();

    // A hero with ManualMovement, so that the joystick can control it
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // A destination to reach
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 11, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    // Let's put a joystick in the bottom left.  We'll define the code for
    // moving the hero first:
    let jcx = 1, jcy = 8; // center of joystick
    let scale = 2;
    // here's code for moving the hero, based on how hard we're pushing the
    // joystick and where the touch is relative to the joystick center
    function doMove(hudCoords: { x: number; y: number }) {
      (hero.movement as ManualMovement).setAbsoluteVelocity(scale * (hudCoords.x - jcx), scale * (hudCoords.y - jcy));
      return true;
    }
    // And here's code for stopping the hero:
    function doStop() {
      (hero.movement as ManualMovement).setAbsoluteVelocity(0, 0);
      hero.rigidBody.clearRotation(); // be sure to try without this
      return true;
    }

    // Make a joystick
    Actor.Make({
      appearance: new ImageSprite({ width: 2, height: 2, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: jcx, cy: jcy, radius: 1 }, { scene: stage.hud }),
      gestures: { panStart: doMove, panMove: doMove, panStop: doStop },
    });

    // Notice that if you glide your finger off the joystick, the panStop event
    // won't happen.  That is a problem that can be fixed, but we're not going
    // to worry about it for now.
  }

  // We've seen a gesture on the HUD change the behavior of an actor in the
  // world.  An important concept is that we can translate HUD coordinates to
  // screen coordinates.  Let's try it out:
  else if (level == 4) {
    // In this level, we're going to cover the screen with a button.  Tapping
    // the button will make the hero jump
    boundingBox2();
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, 32, 9);

    // A background image, to help see that the hero is moving
    Actor.Make({
      appearance: new ImageSprite({ z: -2, width: 32, height: 9, img: "noise.png" }),
      rigidBody: new BoxBody({ cx: 16, cy: 4.5, width: .1, height: .1 }),
    });

    // A hero who is moving
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).setAbsoluteVelocity(5, 0);
    stage.world.camera.setCameraFocus(hero);

    // A button for dropping things
    Actor.Make({
      appearance: new FilledBox({ width: 0.1, height: 0.1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 2.25, width: 16, height: 4.5 }, { scene: stage.hud }), // put it on the HUD
      gestures: {
        tap: (hudMeters: { x: number, y: number }) => {
          // We need to translate the coordinates from the HUD to the world.  We
          // do that by turning them into screen coordinates, then turning them
          // back.
          let screenPixels = stage.hud.camera.metersToScreen(hudMeters.x, hudMeters.y);
          let worldMeters = stage.world.camera.screenToMeters(screenPixels.x, screenPixels.y);
          Actor.Make({
            appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
            rigidBody: new CircleBody({ cx: worldMeters.x, cy: worldMeters.y, radius: .25 }),
            movement: new GravityMovement(),
            role: new Goodie(),
          });
          return true;
        }
      }
    });
  }

  // Now that we understand how to translate coordinates, let's try to use it to
  // implement some dragging of actors using pan events.
  else if (level == 5) {
    boundingBox();
    stage.world.setGravity(0, 10);

    // draw two obstacles that we can drag, and one that we can't.  The whole
    // key to deciding who is draggable and who isn't will be whether we give
    // them "extra" information.
    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 2, radius: 0.375 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Obstacle(),
      extra: { drag: true }
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 1, radius: 0.375 }, { elasticity: 1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
      extra: { drag: true }
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.375 }, { elasticity: 1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });

    // We need a way to keep track of the actor currently being dragged.  We'll
    // use this local variable (but we *could* use "level" storage)
    let foundActor: Actor | undefined;
    // pan start updates foundActor if there is an actor where the touch began
    let panStart = (hudCoords: { x: number; y: number }) => {
      // Turn HUD coordinates to world coordinates
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let world_coords = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      // Ask the physics world for all actors at that position, and stop when we find one who is draggable:
      for (let actor of stage.world.physics!.actorsAt(world_coords)) {
        if (actor.extra.drag) {
          foundActor = actor;
          return true;
        }
      }
      return false;
    };

    // pan move changes the actor's position
    let panMove = (hudCoords: { x: number; y: number }) => {
      // If we have an Actor, move it using the translated coordinates
      if (!foundActor) return false;
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      foundActor.rigidBody?.setCenter(meters.x, meters.y);
      return true;
    };

    // pan stop clears foundActor to stop letting this actor be dragged
    let panStop = () => {
      if (!foundActor) return false;
      // This turns gravity back on, if appropriate
      foundActor.rigidBody.body.SetAwake(true);
      foundActor = undefined;
      return true;
    };

    // Now we can cover the HUD with a button that handles the pan gestures
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { panStart, panMove, panStop },
    });

    // Fun fact: more than 1M downloads came from a game that noticed that you
    // could use panMove as a way to "scribble" on the screen to make a track
    // for a car.
  }

  // This level shows that we can use "flick" or "swipe" gestures to move actors
  else if (level == 6) {
    boundingBox();
    stage.world.setGravity(0, 10);

    // create a few Actors that can be flicked, and one who cannot
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
      extra: { flickSpeed: 1 }
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 6, radius: 0.4 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Obstacle(),
      extra: { flickSpeed: 0.5 }
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 5, radius: 0.4 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });

    // A swipe gesture consists of starting coordinates and ending coordinates,
    // as well as the amount of time the swipe took
    let swipe = (hudCoord1: { x: number; y: number }, hudCoord2: { x: number; y: number }, time: number) => {
      // Convert starting coordinates from hud to world
      let screenCoord1 = stage.hud.camera.metersToScreen(hudCoord1.x, hudCoord1.y);
      let worldCoord1 = stage.world.camera.screenToMeters(screenCoord1.x, screenCoord1.y);
      // Is there a flickable actor there?
      let foundActor: Actor | undefined = undefined;
      for (let actor of stage.world.physics!.actorsAt(worldCoord1)) {
        if (actor.extra.flickSpeed != undefined) {
          foundActor = actor;
          break;
        }
      }
      if (!foundActor) return false;

      // Figure out the velocity to apply, then apply it
      let v = new b2Vec2(hudCoord2.x, hudCoord2.y)
      v = v.Subtract(hudCoord1);
      v.Normalize();
      v.Scale(foundActor.extra.flickSpeed * 2000 / time);
      (foundActor.movement as ManualMovement).updateVelocity(v.x, v.y);
      return true;
    };

    // Make the area on the HUD that receives swipe gestures
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { swipe }
    });
  }

  // In the previous levels, any single kind of gesture only happened in one
  // place.  What if we want a kind of gestures to be handled on the HUD and in
  // the world?
  if (level == 7) {
    boundingBox();

    // Track the actor most recently tapped
    let lastTapActor: Actor | undefined = undefined;

    // make an actor who can "teleport".  Tapping it will "activate" it.
    // Double-tapping will remove it
    const teleport_actor = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 1, radius: .5 }),
      gestures: {
        tap: () => {
          let x = stage.renderer.now; // Time of this tap
          // If it's been less than 300 milliseconds since the last tap, remove
          // it
          if (x - teleport_actor.extra.last_tap < 300 && lastTapActor == teleport_actor) {
            lastTapActor = undefined;
            teleport_actor.remove();
            return true;
          }
          // Otherwise, remember the time of the tap, and that it is activated
          teleport_actor.extra.last_tap = x;
          lastTapActor = teleport_actor;
          return true;
        }
      },
      extra: {
        last_tap: 0,
        poke_responder: (meters: { x: number, y: number }) => { teleport_actor.rigidBody.setCenter(meters.x, meters.y); }
      }
    });



    // Make the tappable region on the hud
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: {
        tap: (hudCoords: { x: number; y: number }) => {
          if (!lastTapActor) return false;
          let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
          let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
          // "teleport" the actor:
          lastTapActor.extra.poke_responder(meters);
          // don't interact again without re-activating
          lastTapActor = undefined;
          return true;
        }
      }
    });

    // This effectively puts the tappable region "under" the world, so that
    // pokes can find an actor before trying to move an actor.
    stage.gestures.gestureHudFirst = false;


    // make an actor who can move along a path.
    const path_actor = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 2, radius: .5 }),
      movement: new PathMovement(new Path().to(14, 1), 0, false),
      gestures: {
        tap: () => { lastTapActor = path_actor; return true; }
      },
      extra: {
        poke_responder: (meters: { x: number, y: number }) => {
          let r = new Path().to(path_actor.rigidBody.getCenter().x, path_actor.rigidBody.getCenter().y).to(meters.x, meters.y);
          path_actor.rigidBody.body.SetLinearVelocity({ x: 0, y: 0 });
          path_actor.rigidBody.body.SetAngularVelocity(0);
          (path_actor.movement as PathMovement).resetPath(r, 5, false);
        }
      }
    });

    // This actor will move in a direction, but won't stop
    const walk_actor = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 3, radius: .5 }),
      movement: new ManualMovement(),
      gestures: {
        tap: () => { lastTapActor = walk_actor; return true; }
      },
      extra: {
        poke_responder: (meters: { x: number, y: number }) => {
          let speed = 2;
          // This might be a nice time to brush up on your trigonometry :)
          let dx = meters.x - walk_actor.rigidBody.getCenter().x;
          let dy = meters.y - walk_actor.rigidBody.getCenter().y;
          let hy = Math.sqrt(dx * dx + dy * dy) / speed;
          let v = new b2Vec2(dx / hy, dy / hy);
          walk_actor.rigidBody.body.SetAngularVelocity(0);
          walk_actor.rigidBody.body.SetLinearVelocity(v);
        }
      }
    });
  }

  // This level shows that we can set a button's action to happen repeatedly for
  // as long as it is being depressed, by making use of the touch-down and
  // touch-up gestures.
  else if (level == 8) {
    boundingBox();

    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .4, cy: .4, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    // If we just gave it a velocity once, it would slow down...
    (h.movement as ManualMovement).setDamping(5);

    // There is some complexity to how this works, because each button needs to
    // know if it is active.  We could do that via "extra" on each button, but
    // instead we'll use the idea of "capturing" the `active` variable in each
    // call to this function.
    function addToggleButton(actor: Actor, whileDownAction: () => void, onUpAction: (coords: { x: number; y: number }) => void) {
      let active = false; // will be captured by lambdas below
      let touchDown = () => { active = true; return true; };
      let touchUp = (hudCoords: { x: number; y: number }) => {
        if (!active) return false;
        active = false;
        onUpAction(hudCoords);
        return true;
      };
      // Put the control and events in the appropriate lists
      stage.world.repeatEvents.push(() => { if (active && whileDownAction) whileDownAction(); });
      actor.gestures.touchDown = touchDown;
      actor.gestures.touchUp = touchUp;
    }

    // draw some buttons for moving the hero.  These are "toggle" buttons: they
    // run some code when they are pressed, and other code when they are
    // released.
    let l = Actor.Make({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 1, cy: 4.5, width: 2, height: 5 }, { scene: stage.hud }),
    });
    addToggleButton(l, () => (h.movement as ManualMovement).updateXVelocity(-5), () => { });
    let r = Actor.Make({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 15, cy: 4.5, width: 2, height: 5 }, { scene: stage.hud }),
    });
    addToggleButton(r, () => (h.movement as ManualMovement).updateXVelocity(5), () => { });
    let d = Actor.Make({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 8, width: 12, height: 2 }, { scene: stage.hud }),
    });
    addToggleButton(d, () => (h.movement as ManualMovement).updateYVelocity(5), () => { });
    let u = Actor.Make({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 1, width: 12, height: 2 }, { scene: stage.hud }),
    });
    addToggleButton(u, () => (h.movement as ManualMovement).updateYVelocity(-5), () => { });
    // One thing you'll notice about these buttons is that unexpected things
    // happen if you slide your finger off of them.  Be sure to try to do things
    // like that when testing your code.  Maybe you'll decide you like the
    // unexpected behavior.  Maybe you'll decide that you need to make changes
    // to JetLag to fix the problem :)

  }

  // There is a "pseudo-movement" called Hover.  It makes an actor stay at the
  // same part of the HUD, while behaving like it is in the world.
  else if (level == 9) {
    stage.world.setGravity(0, 10);
    boundingBox();

    // make a hero who doesn't start moving until it is touched
    let hover_walk = Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.5, cy: 8.25, radius: 0.375 }, { density: 1, friction: 0, disableRotation: true }),
      movement: new HoverMovement(0.5, 8.25),
      role: new Hero(),
    });
    // The `HoverMovement` isn't a full-fledged movement component, so if you
    // want to make its actor move, you'll need to work with the body directly.
    hover_walk.gestures.tap = () => {
      (hover_walk.movement as HoverMovement).stopHover();
      hover_walk.rigidBody.body.SetLinearVelocity({ x: 5, y: 0 });
      hover_walk.gestures.tap = undefined;
      return true;
    }

    // Make a hero who is hovering, but who we will eventually flick
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 7, radius: .5 }),
      movement: new HoverMovement(1, 7),
      role: new Hero(),
      extra: { flickSpeed: .5 }
    });

    // Set up a "swipe" zone on the HUD, for swiping that hero
    let swipe = (hudCoord1: { x: number; y: number }, hudCoord2: { x: number; y: number }, time: number) => {
      // Convert starting coordinates from hud to world
      let screenCoord1 = stage.hud.camera.metersToScreen(hudCoord1.x, hudCoord1.y);
      let worldCoord1 = stage.world.camera.screenToMeters(screenCoord1.x, screenCoord1.y);
      // Is there a flickable actor there?
      let foundActor: Actor | undefined = undefined;
      for (let actor of stage.world.physics!.actorsAt(worldCoord1)) {
        if (actor.extra.flickSpeed != undefined) {
          foundActor = actor;
          break;
        }
      }
      if (!foundActor) return false;

      // Figure out the velocity to apply, then apply it
      let v = new b2Vec2(hudCoord2.x, hudCoord2.y)
      v = v.Subtract(hudCoord1);
      v.Normalize();
      v.Scale(foundActor.extra.flickSpeed * 2000 / time);
      // Don't forget to turn off hovering!
      (foundActor.movement as HoverMovement).stopHover();
      foundActor.rigidBody.body.SetLinearVelocity(v);
      return true;
    };
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9, }, { scene: stage.hud }),
      gestures: { swipe },
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

/** Draw a bounding box that surrounds the default world viewport */
function boundingBox() {
  // Draw a box around the world
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
}

/** Draw a bounding box that surrounds an extended world viewport */
function boundingBox2() {
  // Draw a box around the world
  Actor.Make({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: -.05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: 9.05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 32.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
}