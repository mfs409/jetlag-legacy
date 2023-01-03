import { Text } from "../../support/Text"
import { Picture } from "../../support/Picture"
import { Timer } from "../support/Timer"
import { Camera } from "../support/Camera"
import { PointToActorCallback } from "../support/PointToActorCallback"
import { JetLagRenderer, JetLagDevice, Renderable } from "../support/Interfaces";
import { JetLagConfig } from "../../support/JetLagConfig";
import { b2World, b2Vec2 } from "@box2d/core";

/**
 * BaseScene represents an interactive, dynamic, visible portion of a game.
 *
 * There are two prominent types of scenes, one of which houses the core
 * gameplay (WorldScene), and the other of which can sit on top of that core
 * gameplay and add additional functionality (OverlayScene).  Scenes have actors
 * inside of them, and we render all components of a scene at the same time.
 *
 * There is a close relationship between a BaseActor and a BaseScene, namely
 * that a BaseActor should not need any functionality that is not present in
 * BaseScene.  In contrast, a WorldActor may need functionality that is added by
 * WorldScene.
 */
export abstract class BaseScene {
  /** The physics world in which all actors interact */
  protected readonly world: b2World;

  /** 
   * Anything in the world that can be rendered, in 5 planes [-2, -1, 0, 1, 2] 
   */
  protected readonly renderables: Renderable[][];

  /** The camera will make sure important actors are on screen */
  protected readonly camera: Camera;

  /** For querying the point that was toucned */
  protected readonly pointQuerier = new PointToActorCallback();

  /** Events that get processed on the next render, then discarded */
  protected readonly oneTimeEvents: (() => void)[] = [];

  /** Events that get processed on every render */
  protected readonly repeatEvents: (() => void)[] = [];

  /** For tracking time... */
  protected readonly timer: Timer = new Timer();

  /**
   * Construct a new scene
   *
   * @param config The game-wide configuration
   * @param device The abstract device on which the game is running
   */
  constructor(private config: JetLagConfig, private device: JetLagDevice) {
    let w = this.config.screenWidth / this.config.pixelMeterRatio;
    let h = this.config.screenHeight / this.config.pixelMeterRatio;

    // set up the game camera, with (0, 0) in the top left
    this.camera = new Camera(w, h, this.config.pixelMeterRatio, config, device.getConsole());

    // create a world with no default gravitational forces
    this.world = b2World.Create(new b2Vec2(0, 0));

    // set up the containers for holding anything we can render
    this.renderables = new Array<Array<Renderable>>(5);
    for (let i = 0; i < 5; ++i) {
      this.renderables[i] = new Array<Renderable>();
    }
  }

  /**
   * Query to find the actor at a screen coordinate
   * 
   * @param screenX The X coordinate to look up
   * @param screenY The Y coordinate to look up
   */
  public actorAt(screenX: number, screenY: number) {
    let worldCoords = this.camera.screenToMeters(screenX, screenY);
    this.pointQuerier.query(worldCoords.x, worldCoords.y, this.world);
    return this.pointQuerier.getFoundActor();
  }

  /**
   * Handle a tap action
   * 
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  public tap(screenX: number, screenY: number) {
    let actor = this.actorAt(screenX, screenY);
    if (!actor)
      return false;
    if (actor.getTapHandler()) {
      let worldCoords = this.camera.screenToMeters(screenX, screenY);
      actor.getTapHandler()!(worldCoords.x, worldCoords.y);
      return true;
    }
    return false;
  }

  /** 
   * Run this when a pan event starts 
   * 
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  public panStart(screenX: number, screenY: number) {
    let actor = this.actorAt(screenX, screenY);
    if (!actor)
      return false;
    if (!actor.getPanStartHandler())
      return false;
    let worldCoords = this.camera.screenToMeters(screenX, screenY);
    return actor.getPanStartHandler()!(worldCoords.x, worldCoords.y);
  }

  /**
   * This runs when a pan produces a "move" event
   * 
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  public panMove(screenX: number, screenY: number) {
    let actor = this.actorAt(screenX, screenY);
    if (!actor)
      return false;
    if (!actor.getPanMoveHandler())
      return false;
    let worldCoords = this.camera.screenToMeters(screenX, screenY);
    return actor.getPanMoveHandler()!(worldCoords.x, worldCoords.y);
  }

  /**
   * This runs when a pan event stops
   * 
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  public panStop(screenX: number, screenY: number) {
    let actor = this.actorAt(screenX, screenY);
    if (!actor)
      return false;
    if (!actor.getPanStopHandler())
      return false;
    let worldCoords = this.camera.screenToMeters(screenX, screenY);
    return actor.getPanStopHandler()!(worldCoords.x, worldCoords.y);
  }

  /**
   * This runs in response to a down-press
   * 
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  public touchDown(screenX: number, screenY: number) {
    let actor = this.actorAt(screenX, screenY);
    if (!actor)
      return false;
    if (!actor.getTouchDownHandler())
      return false;
    let worldCoords = this.camera.screenToMeters(screenX, screenY);
    return actor.getTouchDownHandler()!(worldCoords.x, worldCoords.y);
  }

  /**
   * This runs when a down-press is released
   * 
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  public touchUp(screenX: number, screenY: number) {
    let actor = this.actorAt(screenX, screenY);
    if (!actor)
      return false;
    if (!actor.getTouchUpHandler())
      return false;
    let worldCoords = this.camera.screenToMeters(screenX, screenY);
    return actor.getTouchUpHandler()!(worldCoords.x, worldCoords.y);
  }

  /** 
   * This runs in response to a screen swipe event
   * 
   * @param screenX0 The x of the start position of the swipe
   * @param screenY0 The y of the start position of the swipe
   * @param screenX1 The x of the end posiiton of the swipe
   * @param screenY1 The y of the end position of the swipe
   * @param time The time it took for the swipe to happen
   */
  public swipe(screenX0: number, screenY0: number, screenX1: number, screenY1: number, time: number) {
    let sActor = this.actorAt(screenX0, screenY0);
    let eActor = this.actorAt(screenX1, screenY1);
    if (!sActor)
      return false;
    if (sActor !== eActor)
      return false;
    if (!sActor.getSwipeHandler())
      return false;
    let wc1 = this.camera.screenToMeters(screenX0, screenY0);
    let wc2 = this.camera.screenToMeters(screenX1, screenY1);
    return sActor.getSwipeHandler()!(wc1.x, wc1.y, wc2.x, wc2.y, time);
  }

  /**
   * Add an actor to the level, putting it into the appropriate z plane
   *
   * @param actor  The actor to add
   * @param zIndex The z plane. valid values are -2, -1, 0, 1, and 2. 0 is the
   * default.
   */
  addActor(actor: Renderable, zIndex: number) {
    // Coerce index into legal range, then add the actor
    zIndex = (zIndex < -2) ? -2 : zIndex;
    zIndex = (zIndex > 2) ? 2 : zIndex;
    this.renderables[zIndex + 2].push(actor);
  }

  /**
   * Remove an actor from its z plane
   *
   * @param actor  The actor to remove
   * @param zIndex The z plane where it is expected to be
   */
  removeActor(actor: Renderable, zIndex: number) {
    // Coerce index into legal range, then remove the actor
    zIndex = (zIndex < -2) ? -2 : zIndex;
    zIndex = (zIndex > 2) ? 2 : zIndex;
    let i = this.renderables[zIndex + 2].indexOf(actor);
    this.renderables[zIndex + 2].splice(i, 1);
  }

  /** Reset a scene by clearing all of its lists */
  reset() {
    this.oneTimeEvents.length = 0;
    this.repeatEvents.length = 0;
    for (let a of this.renderables) {
      a.length = 0;
    }
  }

  /**
   * Advance the physics world
   * 
   * @param dt The change in time
   * @param velocityIterations The number of velocity update steps to run
   * @param positionIterations The number of position update steps to run
   */
  public advanceWorld(dt: number, velocityIterations: number, positionIterations: number) {
    this.world.Step(dt, { velocityIterations, positionIterations });
  }

  /**
   * Set the default gravitational force for the world
   * 
   * @param newXGravity The new force in the X direction
   * @param newYGravity The new force in the Y direction
   */
  public setGravity(newXGravity: number, newYGravity: number): void {
    this.world.SetGravity(new b2Vec2(newXGravity, newYGravity));
  }

  /** 
   * Return the box2d physics world, so that we can use it to create and destroy
   * bodies, joints, etc.
   */
  public getWorld() { return this.world; }

  /**
   * Add an image to the scene.  The image will not have any physics attached to
   * it.
   *
   * @param x       The X coordinate of the top left corner, in meters
   * @param y       The Y coordinate of the top left corner, in meters
   * @param width   The image width, in meters
   * @param height  The image height, in meters
   * @param imgName The file name for the image, or ""
   * @param zIndex  The z index of the text
   * @return A Renderable of the image, so it can be enabled/disabled by program
   * code
   */
  public makePicture(x: number, y: number, width: number, height: number, imgName: string, zIndex: number) {
    // set up the image to display
    // NB: this will fail gracefully (no crash) for invalid file names
    let r = new Picture(x, y, width, height, imgName, this.device.getRenderer());
    this.addActor(r, zIndex);
    return r;
  }

  /**
   * Draw some text in the scene, using a top-left coordinate
   *
   * @param x         The x coordinate of the top left corner
   * @param y         The y coordinate of the top left corner
   * @param fontName  The name of the font to use
   * @param fontColor The color of the font
   * @param fontSize  The size of the font
   * @param zIndex    The z index of the text
   * @param producer  Code to generate the text to display
   * @return A Renderable of the text, so it can be enabled/disabled by program
   * code
   */
  public addText(x: number, y: number, fontName: string, fontColor: string, fontSize: number, zIndex: number, producer: () => string) {
    let t = new Text(this.device.getRenderer(), fontName, fontSize, fontColor, x, y, false, producer);
    this.addActor(t, zIndex);
    return t;
  }

  /**
   * Draw some text in the scene, centering it on a specific point
   *
   * @param centerX   The x coordinate of the center
   * @param centerY   The y coordinate of the center
   * @param fontName  The name of the font to use
   * @param fontColor The color of the font
   * @param fontSize  The size of the font
   * @param zIndex    The z index of the text
   * @param producer  Code to generate the text to display
   * @return A Renderable of the text, so it can be enabled/disabled by program
   *         code
   */
  public addTextCentered(centerX: number, centerY: number, fontName: string, fontColor: string, fontSize: number, zIndex: number, producer: () => string) {
    let t = new Text(this.device.getRenderer(), fontName, fontSize, fontColor, centerX, centerY, true, producer);
    this.addActor(t, zIndex);
    return t;
  }

  /**
   * Render this scene
   *
   * @return True if the scene was rendered, false if it was not
   */
  abstract render(renderer: JetLagRenderer, elapsedTime: number): void;

  /** Return the camera for this scene */
  public getCamera() { return this.camera; }

  /** Return the timer object for this scene */
  public getTimer() { return this.timer; }

  /**
   * Indicate that the provided callback should run on every render tick
   * 
   * @param callback The code to run
   */
  public addRepeatEvent(callback: () => void) { this.repeatEvents.push(callback); }
}