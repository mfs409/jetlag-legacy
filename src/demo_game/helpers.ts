import { b2BodyType, b2Vec2 } from "@box2d/core";
import { AppearanceComponent, FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Scene } from "../jetlag/Entities/Scene";
import { ExplicitMovement, Draggable, FlickMovement, HoverFlick, PathMovement, Path, ProjectileMovement } from "../jetlag/Components/Movement";
import { Actor } from "../jetlag/Entities/Actor";
import { BoxBody, RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { AnimationSequence, GestureHandlers, Sides } from "../jetlag/Config";
import { Enemy, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { stage } from "../jetlag/Stage";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { MusicComponent } from "../jetlag/Components/Music";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";

/** Manage the state of Mute */
export function toggleMute() {
  // volume is either 1 or 0, switch it to the other and save it
  let volume = 1 - parseInt(stage.storage.getPersistent("volume") ?? "1");
  stage.storage.setPersistent("volume", "" + volume);
  // update all music
  stage.musicLibrary.resetMusicVolume(volume);
}

/**
 * Generate a random whole number x in the range [0,max)
 *
 * @param max The largest number returned will be one less than max
 */
export function getRandom(max: number) { return Math.floor(Math.random() * max); }

/**
 * Create a new animation that shows each of a set of images for the same
 * amount of time
 *
 * @param timePerFrame The time to show each image
 * @param repeat       True if the animation should repeat when it reaches
 *                     the end
 * @param imgNames     The names of the images that comprise the animation
 *
 * @return The animation
 */
export function makeAnimation(cfg: { timePerFrame: number, repeat: boolean, images: string[] }) {
  let a = new AnimationSequence(cfg.repeat);
  cfg.images.forEach((i) => a.to(i, cfg.timePerFrame));
  return a;
}

/**
 * Use this to determine if the game is muted or not.  True corresponds to not
 * muted, false corresponds to muted.
 */
export function getVolume() {
  return (stage.storage.getPersistent("volume") ?? "1") === "1";
}

/**
 * Set the background music for this level
 *
 * @param musicName Name of the music file to play.  Remember: this file
 *                  must have been registered as Music, not as a Sound
 */
export function setMusic(musicName: string) {
  stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic(musicName));
}

/**
 * Turn on accelerometer support, so that tilt can control actors in this
 * level.  Note that if the accelerometer is disabled, this code will set
 * the arrow keys to simulate tilt.
 *
 * @param xGravityMax Max X force that the accelerometer can produce
 * @param yGravityMax Max Y force that the accelerometer can produce
 */
export function enableTilt(xGravityMax: number, yGravityMax: number, asVelocity: boolean = false) {
  stage.tilt.tiltMax.Set(xGravityMax, yGravityMax);

  if (!stage.accelerometer.tiltSupported) {
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  }

  stage.tilt.tiltVelocityOverride = asVelocity;
}

/**
 * Draw a box on the scene
 *
 * Note: the box is actually four narrow rectangles
 *
 * @param x0          X coordinate of left side
 * @param y0          Y coordinate of top
 * @param x1          X coordinate of right side
 * @param y1          Y coordinate of bottom
 * @param thickness   How thick should the box be?
 * @param physicsCfg  Common extra configuration options for the walls
 */
export function drawBoundingBox(x0: number, y0: number, x1: number, y1: number, thickness: number, physicsCfg: { density?: number, elasticity?: number, friction?: number, disableRotation?: boolean, collisionsEnabled?: boolean, stickySides?: Sides[], stickyDelay?: number, singleRigidSide?: Sides, passThroughId?: number, rotationSpeed?: number, dynamic?: boolean } = {}) {
  // Bottom box:
  let width = Math.abs(x0 - x1);
  let cfg = { box: true, cx: x0 + width / 2, cy: y1 + thickness / 2, width: width + 2 * thickness, height: thickness, img: "" };
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle(),
  });

  // The top only differs by translating the Y from the bottom
  cfg.cy -= (thickness + Math.abs(y0 - y1));// = { box: true, cx: x0 + width / 2, cy: y0 - height / 2 + .5, width, height, img: "" };
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle(),
  });

  // Right box:
  let height = Math.abs(y0 - y1);
  cfg = { box: true, cx: x1 + thickness / 2, cy: y0 + height / 2, height: height + 2 * thickness, width: thickness, img: "" };
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle(),
  });

  // The left only differs by translating the X
  cfg.cx -= (thickness + Math.abs(x0 - x1));
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle(),
  });
}

/**
 * Convert coordinates on the overlay to coordinates in the world
 *
 * @param x The x coordinate, in meters, on the overlay
 * @param y The y coordinate, in meters, on the overlay
 *
 * @return  A pair {x,y} that represents the world coordinates, in meters
 */
export function overlayToWorldCoords(overlay: Scene, x: number, y: number) {
  let pixels1 = overlay.camera.metersToScreen(x, y);
  let pixels2 = stage.world.camera.screenToMeters(pixels1.x, pixels1.y);
  return pixels2;
}

/**
 * Add a button that performs an action when clicked.
 *
 * @param scene The scene where the button should go
 * @param cfg   Configuration for an image and a box
 * @param tap   The code to run in response to a tap
 */
// TODO: stop needing `any`
export function addTapControl(scene: Scene, cfg: any, tap: (coords: { x: number; y: number }) => boolean) {
  // TODO: we'd have more flexibility if we passed in an appearance, or just got
  // rid of this, but we use it too much for that refactor to be worthwhile.
  let c = Actor.Make({
    appearance: new FilledBox(cfg),
    rigidBody: BoxBody.Box(cfg, scene),
  });
  c.gestures = { tap };
  return c;
}

/**
 * Add a control that runs custom code when pressed, on any finger movement, and
 * when released
 *
 * @param scene     The scene where the control should be drawn
 * @param cfg       Configuration for an image and a box
 * @param panStart  The action to perform when the pan event starts
 * @param panMove   The action to perform when the finger moves
 * @param panStop   The action to perform when the pan event stops
 */
// TODO: stop needing `any`
export function addPanCallbackControl(scene: Scene, cfg: any, panStart: (coords: { x: number; y: number }) => boolean, panMove: (coords: { x: number; y: number }) => boolean, panStop: (coords: { x: number; y: number }) => boolean) {
  // TODO: it's probably not worth having this helper function
  let c = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, scene),
  });
  c.gestures = { panStart, panMove, panStop };
  return c;
}

/**
 * Create a region on screen, such that any Actor inside of that region that
 * has been marked draggable can be dragged anywhere within that region.
 *
 * @param scene Where to draw the region
 * @param cfg   An ImgConfig object, for the shape/appearance of the region
 */
// TODO: stop needing `any`
export function createDragZone(scene: Scene, cfg: any) {
  let foundActor: Actor | undefined;
  // pan start behavior is to update foundActor if there is an actor where
  // the touch began
  let pan_start = (hudCoords: { x: number; y: number }) => {
    // Need to turn the meters of the hud into screen pixels, so that
    // world can convert to its meters
    let pixels = scene.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let world_coords = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    // If world actor with draggable, we're good
    for (let actor of stage.world.physics!.actorsAt(world_coords)) {
      if (actor.movement instanceof Draggable) {
        foundActor = actor;
        return true;
      }
    }
    return false;
  };
  // pan move behavior is to change the actor position based on the new
  // coord
  let pan_move = (hudCoords: { x: number; y: number }) => {
    // need an actor, and need coords in pixels
    if (!foundActor) return false;
    let pixels = scene.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    // TODO: appearance or rigidBody?
    foundActor.rigidBody?.setCenter(meters.x, meters.y);
    return true;
  };
  // pan stop behavior is to stop tracking this actor
  let pan_stop = () => {
    foundActor = undefined;
    return false;
  };
  addPanCallbackControl(scene, cfg, pan_start, pan_move, pan_stop);
}

/**
 * Create a region on screen that is able to receive swipe gestures
 *
 * @param scene Where to make the region
 * @param cfg   An ImgConfig object, for the shape/appearance of the region
 */
// TODO: stop needing `any`
export function createFlickZone(overlay: Scene, cfgOpts: any) {
  let c = Actor.Make({
    appearance: new ImageSprite(cfgOpts),
    rigidBody: BoxBody.Box(cfgOpts, overlay),
  });
  let swipe = (hudCoord1: { x: number; y: number }, hudCoord2: { x: number; y: number }, time: number) => {
    // Need to turn the meters of the hud into screen pixels, so that world can convert to its meters
    let screenCoord1 = overlay.camera.metersToScreen(hudCoord1.x, hudCoord1.y);
    let worldCoord1 = stage.world.camera.screenToMeters(screenCoord1.x, screenCoord1.y);
    // If world actor with flickMultiplier, we're good
    let movement: FlickMovement | HoverFlick | undefined = undefined;
    for (let actor of stage.world.physics!.actorsAt(worldCoord1)) {
      if (!(actor.movement instanceof FlickMovement) && !(actor.movement instanceof HoverFlick))
        return true;
      if (actor.movement.multiplier === 0) return false;
      movement = actor.movement;
      break;
    }
    if (!movement) return false;

    // Figure out the velocity to apply, then apply it
    let v = new b2Vec2(hudCoord2.x, hudCoord2.y)
    v = v.Subtract(hudCoord1);
    v.Normalize();
    v.Scale(movement.multiplier * 2000 / time);
    movement.updateVelocity(v.x, v.y);
    return true;
  };
  c.gestures = { swipe };
  return c;
}

/**
 * Create a region on scene, such that touching the region will cause
 * the current active actor to immediately relocate to that place.
 *
 * @param scene Where to draw the region
 * @param cfg   An ImgConfig object, for the shape/appearance of the region
 */
// TODO: stop needing `any`
export function createPokeToPlaceZone(scene: Scene, cfgOpts: any) {
  stage.gestures.gestureHudFirst = false;
  addTapControl(scene, cfgOpts, (hudCoords: { x: number; y: number }) => {
    let who = stage.storage.getLevel("selected_entity") as Actor | undefined;
    if (!who || !who.rigidBody) return false;
    let pixels = scene.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    who.rigidBody?.setCenter(meters.x - who.rigidBody.w / 2, meters.y - who.rigidBody.h / 2);
    stage.storage.setLevel("selected_entity", undefined);
    return true;
  });
}

/**
 * Create a region on a scene, such that touching the region will cause
 * the current active actor to move to that place.
 *
 * @param scene     Where to draw the region
 * @param cfg       An ImgConfig object, for the shape/appearance of the region
 * @param velocity  The speed at which the actor should move
 * @param clear     Should the active actor be cleared (so that subsequent
 *                  touches won't change its trajectory)
 */
// TODO: stop needing `any`
export function createPokeToMoveZone(scene: Scene, cfg: any, velocity: number, clear: boolean) {
  stage.gestures.gestureHudFirst = false;
  addTapControl(scene, cfg, (hudCoords: { x: number; y: number }) => {
    let who = stage.storage.getLevel("selected_entity") as Actor | undefined;
    if (!who || !who.rigidBody) return false;
    let pixels = scene.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    let r = new Path().to(who.rigidBody.getCenter().x, who.rigidBody.getCenter().y).to(meters.x, meters.y);
    who.rigidBody.body.SetLinearVelocity({ x: 0, y: 0 });
    who.rigidBody.body.SetAngularVelocity(0);
    (who.movement as PathMovement).resetPath(r, velocity, false);
    if (clear) stage.storage.setLevel("selected_entity", undefined);
    return true;
  });
}

/**
 * Create a region on a scene, such that touching the region will cause
 * the current active actor to move toward that place (but not stop when it
 * gets there).
 *
 * @scene           Where to draw the region
 * @param cfg       An ImgConfig object, for the shape/appearance of the region
 * @param velocity  The speed at which the actor should move
 * @param clear     Should the active actor be cleared (so that subsequent
 *                  touches won't change its trajectory)
 */
// TODO: stop needing `any`
export function createPokeToRunZone(scene: Scene, cfg: any, velocity: number, clear: boolean) {
  stage.gestures.gestureHudFirst = false;
  addTapControl(scene, cfg, (hudCoords: { x: number; y: number }) => {
    let who = stage.storage.getLevel("selected_entity") as Actor | undefined;
    if (!who || !who.rigidBody) return false;
    let pixels = scene.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    // TODO: for dx and dy, appearance or rigidBody?
    let dx = meters.x - who.rigidBody.getCenter().x;
    let dy = meters.y - who.rigidBody.getCenter().y;
    let hy = Math.sqrt(dx * dx + dy * dy) / velocity;
    let v = new b2Vec2(dx / hy, dy / hy);
    who.rigidBody.body.SetAngularVelocity(0);
    who.rigidBody.body.SetLinearVelocity(v);
    if (clear) stage.storage.setLevel("selected_entity", undefined);
    return true;
  });
}

/**
 * Draw a touchable region of the screen that acts as a joystick.  As the
 * user performs Pan actions within the region, the actor's velocity should
 * change accordingly.
 *
 * @param scene     Where to draw the joystick
 * @param cfgOpts   An ImgConfig object, for the appearance of the joystick
 * @param actor     The actor to move with this joystick
 * @param scale     A value to use to scale the velocity produced by the
 *                  joystick
 * @param stopOnUp  Should the actor stop when the joystick is released?
 */
// TODO: stop needing `any`
export function addJoystickControl(scene: Scene, cfgOpts: any, cfg: { actor: Actor, scale?: number, stopOnUp?: boolean }) {
  let moving = false;
  function doMove(hudCoords: { x: number; y: number }) {
    moving = true;
    (cfg.actor.movement as ExplicitMovement).setAbsoluteVelocity(
      (cfg.scale ?? 1) * (hudCoords.x - cfgOpts.cx),
      (cfg.scale ?? 1) * (hudCoords.y - cfgOpts.cy));
    return true;
  }
  function doStop() {
    if (!moving) return true;
    moving = false;
    if (!!cfg.stopOnUp) {
      (cfg.actor.movement as ExplicitMovement).setAbsoluteVelocity(0, 0);
      cfg.actor.rigidBody?.clearRotation();
    }
    return true;
  }
  return addPanCallbackControl(scene, cfgOpts, doMove, doMove, doStop);
}

/**
 * Add a button that has one behavior while it is being pressed, and another
 * when it is released
 *
 * @param scene           Where to draw the button
 * @param cfg             An ImgConfig object, which will specify how to draw
 *                        the button
 * @param whileDownAction The action to execute, repeatedly, whenever the button
 *                        is pressed
 * @param onUpAction      The action to execute once any time the button is
 *                        released
 */
// TODO: stop needing `any`
export function addToggleButton(overlay: Scene, cfg: any, whileDownAction?: () => void, onUpAction?: (coords: { x: number; y: number }) => void) {
  let c = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, overlay),
  });
  let active = false; // will be captured by lambdas below
  let touchDown = () => {
    active = true;
    return true;
  };
  let touchUp = (hudCoords: { x: number; y: number }) => {
    if (!active) return false;
    active = false;
    if (onUpAction) onUpAction(hudCoords);
    return true;
  };
  c.gestures = { touchDown, touchUp };
  // Put the control and events in the appropriate lists
  stage.world.repeatEvents.push(() => { if (active && whileDownAction) whileDownAction(); });
  return c;
}

/**
 * The default behavior for tossing is to toss in a straight line. If we
 * instead desire that the projectiles have some sort of aiming to them, we need
 * to use this method, which tosses toward where the screen was pressed
 *
 * Note: you probably want to use an invisible button that covers the screen...
 *
 * @param scene   Where to draw the button
 * @param cfg     Configuration for an image and a box
 * @param actor   The actor who should toss the projectile
 * @param msDelay A delay between tosses, so that holding doesn't lead to too
 *                many tosses at once
 * @param offsetX The x distance between the top left of the projectile and the
 *                top left of the actor tossing the projectile
 * @param offsetY The y distance between the top left of the projectile and the
 *                top left of the actor tossing the projectile
 */
// TODO: stop needing `any`
export function addDirectionalTossButton(overlay: Scene, projectiles: ActorPoolSystem, cfg: any, actor: Actor, msDelay: number, offsetX: number, offsetY: number) {
  let c = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, overlay),
  });
  let v = new b2Vec2(0, 0);
  let isHolding = false;
  let touchDown = (hudCoords: { x: number; y: number }) => {
    isHolding = true;
    let pixels = overlay.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    v.x = world.x;
    v.y = world.y;
    return true;
  };
  let touchUp = () => {
    isHolding = false;
    return true;
  };
  let panMove = (hudCoords: { x: number; y: number }) => {
    let pixels = overlay.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    v.x = world.x;
    v.y = world.y;
    return isHolding;
  };
  c.gestures = { touchDown, touchUp, panMove };

  let mLastToss = 0;
  stage.world.repeatEvents.push(() => {
    if (isHolding) {
      let now = new Date().getTime();
      if (mLastToss + msDelay < now) {
        mLastToss = now;
        // TODO: fix ??
        (projectiles.get()?.role as Projectile | undefined)?.tossAt(actor.rigidBody?.getCenter().x ?? 0, actor.rigidBody?.getCenter().y ?? 0, v.x, v.y, actor, offsetX, offsetY);
      }
    }
  });
  return c;
}

/**
 * Return a function for moving an actor in the X and Y directions, with
 * dampening on release. This action can be used by a Control.
 *
 * @param actor     The actor to move
 * @param xRate     The rate at which the actor should move in the X direction
 *                  (negative values are allowed)
 * @param yRate     The rate at which the actor should move in the Y direction
 *                  (negative values are allowed)
 * @param dampening The dampening factor
 */
export function makeXYDampenedMotionAction(actor: Actor, xRate: number, yRate: number, dampening: number) {
  // TODO:  I think that dampening should only get set once per actor, but right
  //        now that's not true
  (actor.movement as ExplicitMovement).setDamping(dampening);
  return () => (actor.movement as ExplicitMovement).updateVelocity(xRate, yRate);
}

/**
 * Return a function that makes an actor toss a projectile in a direction that
 * relates to how the screen was touched
 *
 * @param scene   The scene that was touched
 * @param actor   The actor who should toss the projectile
 * @param offsetX The x distance between the top left of the projectile and the
 *                top left of the actor tossing the projectile
 * @param offsetY The y distance between the top left of the projectile and the
 *                top left of the actor tossing the projectile
 */
export function TossDirectionalAction(scene: Scene, projectiles: ActorPoolSystem, actor: Actor, offsetX: number, offsetY: number) {
  return (hudCoords: { x: number; y: number }) => {
    let pixels = scene.camera.metersToScreen(hudCoords.x, hudCoords.y);
    let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
    (projectiles.get()?.role as Projectile | undefined)?.tossAt(actor.rigidBody?.getCenter().x ?? 0, actor.rigidBody?.getCenter().y ?? 0, world.x, world.y, actor, offsetX, offsetY);
    return true;
  };
}

/**
 * Return a function for making an actor toss a projectile if enough time has
 * transpired
 *
 * @param actor     The actor who should toss the projectile
 * @param msDelay   A delay between tosses, so that holding doesn't lead to too
 *                  many tosses at once
 * @param offsetX   The x distance between the top left of the projectile and
 *                  the top left of the actor tossing the projectile
 * @param offsetY   The y distance between the top left of the projectile and
 *                  the top left of the actor tossing the projectile
 * @param velocityX The X velocity of the projectile when it is tossed
 * @param velocityY The Y velocity of the projectile when it is tossed
 */
export function makeRepeatToss(projectiles: ActorPoolSystem, actor: Actor, msDelay: number, offsetX: number, offsetY: number, velocityX: number, velocityY: number) {
  let last = 0;
  return () => {
    let now = new Date().getTime();
    if (last + msDelay < now) {
      last = now;
      (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(actor, offsetX, offsetY, velocityX, velocityY);
    }
  };
}

/**
 * Return a function that makes a hero jump.
 *
 * @param hero    The hero who we want to jump
 * @param msDelay If there should be time between being allowed to jump
 */
export function jumpAction(hero: Actor, x: number, y: number, msDelay: number) {
  let mLastJump = 0;
  return () => {
    let now = new Date().getTime();
    if ((mLastJump + msDelay) < now) {
      mLastJump = now;
      (hero.role as Hero).jump(x, y);
      return true;
    }
    return false;
  };
}

/**
 * Indicate that this actor should shrink over time.  Note that using negative
 * values will lead to growing instead of shrinking.
 *
 * @param actor         The Actor who should shrink over time
 * @param shrinkX       The number of meters by which the X dimension should
 *                      shrink each second
 * @param shrinkY       The number of meters by which the Y dimension should
 *                      shrink each second
 * @param keepCentered  Should the actor's center point stay the same as it
 *                      shrinks, or should its top left corner stay in the same
 *                      position
 */
export function setShrinkOverTime(actor: Actor, shrinkX: number, shrinkY: number, keepCentered: boolean) {
  let done = false;
  let te = new TimedEvent(0.05, true, () => {
    if (done) return;
    // NB: we shrink 20 times per second
    let x = 0, y = 0;
    if (keepCentered) {
      x = (actor.rigidBody?.getCenter().x ?? 0) + shrinkX / 20 / 2;
      y = (actor.rigidBody?.getCenter().y ?? 0) + shrinkY / 20 / 2;
    } else {
      x = actor.rigidBody?.getCenter().x ?? 0;
      y = actor.rigidBody?.getCenter().y ?? 0;
    }
    let w = actor.appearance.width - shrinkX / 20;
    let h = actor.appearance.height - shrinkY / 20;
    // if the area remains >0, resize it and schedule a timer to run again
    if (w > 0.05 && h > 0.05) {
      actor.resize(x, y, w, h);
    } else {
      actor.remove();
      done = true;
    }
  });
  stage.world.timer.addEvent(te);
}

/**
 * Indicate that if the player touches this enemy, the enemy will be removed
 * from the game.  Note that this can vibrate the phone :)
 *
 * @param enemy The enemy to defeat
 */
export function defeatOnTouch(enemy: Enemy) {
  // TODO: It's probably not worth having this as its own function?
  if (enemy.actor!.gestures == undefined) enemy.actor!.gestures = new GestureHandlers();
  enemy.actor!.gestures.tap = () => {
    stage.vibrate(100);
    enemy.defeat(true);
    enemy.actor!.gestures!.tap = undefined;
    return true;
  };
}

/**
 * Indicate that upon a touch, this Actor should begin moving with a specific
 * velocity
 *
 * @param a The actor to start moving
 * @param x Velocity in X dimension
 * @param y Velocity in Y dimension
 */
export function setTouchAndGo(e: Actor, x: number, y: number) {
  if (!e.gestures) e.gestures = new GestureHandlers();
  e.gestures.tap = () => {
    let body = e.rigidBody?.body;
    if (!body) return false;
    // if it was hovering, its body type won't be Dynamic
    if (body.GetType() != b2BodyType.b2_dynamicBody)
      body.SetType(b2BodyType.b2_dynamicBody);
    (e.movement as ExplicitMovement).setAbsoluteVelocity(x, y);
    // turn off isTouchAndGo, so we can't double-touch
    e.gestures!.tap = undefined;
    return true;
  };
}

/**
 * Return a function that changes the speed of an actor, based on a collision.
 *
 * @param boostAmountX  The amount of X velocity to add
 * @param boostAmountY  The amount of Y velocity to add
 * @param boostDuration How long should the boost last (forever if not provided)
 */
export function setSpeedBoost(boostAmountX: number, boostAmountY: number, boostDuration: number | undefined = undefined) {
  return (_self: Actor, h: Actor) => {
    // boost the speed
    let v = h.rigidBody?.body.GetLinearVelocity() ?? { x: 0, y: 0 };
    let x = v.x + boostAmountX;
    let y = v.y + boostAmountY;
    (h.movement as ExplicitMovement).updateVelocity(x, y);
    // now set a timer to un-boost the speed
    if (boostDuration != undefined) {
      stage.world.timer.addEvent(
        new TimedEvent(boostDuration, false, () => {
          let v = h.rigidBody?.body.GetLinearVelocity() ?? { x: 0, y: 0 };
          let x = v.x - boostAmountX;
          let y = v.y - boostAmountY;
          (h.movement as ExplicitMovement).updateVelocity(x, y);
        })
      );
    }
  };
}

/**
 * Create an Actor whose appearance is text.  Since every Actor needs to have a
 * body, this will create a simple body to accompany the actor.
 *
 * @param scene     The scene where the Text should be made
 * @param cfgOpts   Text configuration options
 * @param producer  A callback for making the text for this Actor
 *
 * @returns An actor whose appearance is a TextSprite based on `cfgOpts`
 */
// TODO: stop needing `any`
export function makeText(scene: Scene, cfgOpts: any, producer: () => string): Actor {
  return Actor.Make({
    appearance: new TextSprite(cfgOpts, producer),
    rigidBody: BoxBody.Box(cfgOpts, scene),
  });
}

/**
 * Put some appropriately-configured projectiles into the projectile system
 *
 * @param cfg                           Configuration options for the
 *                                      projectiles
 * @param cfg.size                      The number of projectiles that can ever
 *                                      be on screen at once
 * @param cfg.bodyMaker                 Make each projectile's initial rigid
 *                                      body
 * @param cfg.appearanceMaker           Make each projectile's appearance
 * @param cfg.strength                  The amount of damage a projectile can do
 *                                      to enemies
 * @param cfg.multiplier                A multiplier on projectile speed
 * @param cfg.immuneToCollisions        Should projectiles pass through walls
 * @param cfg.gravityAffectsProjectiles Should projectiles be subject to gravity
 * @param cfg.fixedVectorVelocity       A fixed velocity for all projectiles
 * @param cfg.rotateVectorToss          Should projectiles be rotated in the
 *                                      direction they are tossed?
 * @param cfg.soundEffects              A sound to play when a projectile
 *                                      disappears
 * @param cfg.randomImageSources        A set of image names to randomly assign
 *                                      to projectiles' appearance
 * @param cfg.range                     Limit the range that projectiles can
 *                                      travel?
 * @param cfg.disappearOnCollide        Should projectiles disappear when they
 *                                      collide with each other?
 */
export function populateProjectilePool(pool: ActorPoolSystem, cfg: { size: number, bodyMaker: () => RigidBodyComponent, appearanceMaker: () => AppearanceComponent, strength: number, multiplier?: number, immuneToCollisions: boolean, gravityAffectsProjectiles?: boolean, fixedVectorVelocity?: number, rotateVectorToss?: boolean, soundEffects?: SoundEffectComponent, randomImageSources?: string[], range: number, disappearOnCollide: boolean }) {
  // set up the pool of projectiles
  for (let i = 0; i < cfg.size; ++i) {
    let appearance = cfg.appearanceMaker();
    let rigidBody = cfg.bodyMaker();
    if (cfg.gravityAffectsProjectiles)
      rigidBody.body.SetGravityScale(1);
    rigidBody.setCollisionsEnabled(cfg.immuneToCollisions);
    let reclaimer = (actor: Actor) => {
      pool.put(actor);
      actor.enabled = false;
    }
    let role = new Projectile({ damage: cfg.strength, range: cfg.range, disappearOnCollide: cfg.disappearOnCollide, reclaimer, randomImageSources: cfg.randomImageSources });
    // Put in some code for eliminating the projectile quietly if it has
    // traveled too far
    role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
      if (!actor) return;
      if (!actor.enabled) return;
      let role = actor.role as Projectile;
      let body = actor.rigidBody.body;
      let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
      let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
      if ((dx * dx + dy * dy) > (role.range * role.range)) reclaimer(actor);
    });
    // TODO: Should we clone the soundEffects?
    let p = Actor.Make({ appearance, rigidBody, movement: new ProjectileMovement(cfg), role, sounds: cfg.soundEffects });
    pool.put(p);
  }
}