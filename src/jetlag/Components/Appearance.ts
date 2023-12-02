import { b2Vec2 } from "@box2d/core";
import { Text, Sprite } from "../Services/ImageLibrary";
import { CameraSystem } from "../Systems/Camera";
import { Actor } from "../Entities/Actor";
import { AnimationSequence, AnimationState } from "../Config";
import { StateEvent, IStateObserver, ActorState, DIRECTION } from "./StateManager";
import { stage } from "../Stage";
import { BoxBody } from "./RigidBody";
import { InertMovement } from "./Movement";
import { Passive } from "./Role";
import { Graphics } from "pixi.js";

/**
 * Validate a filled Box/Circle/Polygon's line/fill information
 *
 * @param cfg     The object being validated
 * @param cfgName The type of the object, for error messages
 */
function validateFilledConfig(cfg: FilledBox | FilledCircle | FilledPolygon, cfgName: string) {
  // Validate: if there's a line width, there needs to be a line color
  if (cfg.lineWidth !== undefined && cfg.lineColor === undefined)
    stage.console.log(`Error: ${cfgName} with lineWidth must have lineColor`);

  // Validate: if there's a line color, there needs to be a line width
  else if (cfg.lineColor !== undefined && cfg.lineWidth === undefined)
    stage.console.log(`Error: ${cfgName} with lineColor must have lineWidth`);

  // Validate: if there is no line width or line color, there needs to be a fill color
  else if (cfg.lineWidth === undefined && cfg.fillColor === undefined)
    stage.console.log(`Error: ${cfgName} must have lineWidth or fillColor`);

}

/** Coerce a z value into the range -2...2 */
function coerceZ(z: number | undefined): (-2 | -1 | 0 | 1 | 2) {
  if (z == -2) return -2;
  if (z == -1) return -1;
  if (z == 1) return 1;
  if (z == 2) return 2;
  return 0;
}

/**
 * TextSprite describes any text object that can be drawn to the screen. The
 * text that is displayed can be controlled by a callback, so that it can change
 * over time.
 */
export class TextSprite {
  /** The Actor to which this TextSprite is attached */
  public actor?: Actor;
  /** The low-level text object that we pass to the Renderer */
  private readonly text: Text;
  /** Width of the text (computed) */
  width = 0;
  /** Height of the text (computed) */
  height = 0;
  /** Z index of the image */
  z: -2 | -1 | 0 | 1 | 2;
  /** Should the text be centered at X,Y (true) or is (X,Y) top-left (false) */
  center: boolean;
  /** Font to use */
  face: string;
  /** Color for the text */
  color: string;
  /** Font size */
  size: number;

  /**
   * Build some text that can be rendered
   *
   * @param opts        The configuration options for this TextSprite
   * @param opts.center Should the text be centered at the rigid body's (cx,cy)
   *                    (true) or is the rigid body's (cx,cy) top-left (false)
   * @param opts.face   Font to use
   * @param opts.color  Color for the text (should be an RGB string code, like
   *                    #aa4433)
   * @param opts.size   Font size
   * @param opts.z      An optional z index in the range [-2,2]
   * @param producer    A function that creates the text to display, or a String
   */
  constructor(opts: { center: boolean, face: string, color: string, size: number, z?: number }, public producer: string | (() => string)) {
    this.center = opts.center;
    this.face = opts.face;
    this.color = opts.color;
    this.size = opts.size;
    this.z = coerceZ(opts.z);
    let sample_text = (typeof this.producer == "string") ? this.producer : this.producer();
    this.text = Text.makeText(sample_text, { fontFamily: this.face, fontSize: this.size, fill: this.color });
    this.width = this.text.text.width;
    this.height = this.text.text.height;
  }

  /**
   * Render the text
   *
   * @param camera    The camera that defines the bounds for the Scene where
   *                  this image should be drawn
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor) {
      // Update the text before passing to the renderer!
      this.text.text.text = (typeof this.producer == "string") ? this.producer : this.producer();
      this.width = this.text.text.width;
      this.height = this.text.text.height;
      stage.renderer.addTextToFrame(this.text, this.actor.rigidBody, camera, this.center);
    }
  }

  /** Perform any custom updates to the text before displaying it */
  prerender(_elapsedMs: number) { }

  /**
   * Return the width and height of the text
   *
   * @param camera      The camera of the scene where the text is being drawn
   * @param sampleText  Some text whose size we're computing, since the object's
   *                    real text might not be available yet
   */
  dims(camera: CameraSystem, sampleText: string) {
    // NB:  When the game starts, text.text will usually be "", which gets us a
    //      valid height but not a valid width.  Swapping in sampleText gets us
    //      a better estimate.
    let t = this.text.text.text;
    this.text.text.text = sampleText;
    let res = { width: this.text.text.width / camera.getScale(), height: this.text.text.height / camera.getScale() };
    this.text.text.text = t;
    return res;
  }

  /**
   * Change the size of the text.  You shouldn't call this directly.  It gets
   * called by Actor.resize().
   *
   * @param width   The new width
   * @param height  The new height
   */
  resize(width: number, height: number) {
    let xScale = width * stage.fontScaling / this.width;
    let yScale = height * stage.fontScaling / this.height;
    this.size *= xScale;
    // (this.text.text.style.fontSize as number) *= xScale;
    this.text.text.width = width * xScale;
    this.text.text.height = height * yScale;
    this.width = this.text.text.width;
    this.height = this.text.text.height;
  }
}

/**
 * ImageSprite describes any object whose visual representation is a single
 * image that is not animated.
 */
export class ImageSprite {
  /** The Actor to which this ImageSprite is attached */
  public actor?: Actor;

  /** The image to display for this actor */
  public image: Sprite;

  /** Width of the image */
  width: number;
  /** Height of the image */
  height: number;
  /** Z index of the image */
  z: -2 | -1 | 0 | 1 | 2;
  /** The name of the image file */
  img: string;

  /**
   * Build an image that can be rendered
   *
   * @param opts        Configuration information for this ImageConfig object
   * @param opts.width  The width of the image, in meters
   * @param opts.height The height of the image, in meters
   * @param opts.img    The name of the file to use as the image
   * @param opts.z      An optional z index in the range [-2,2]
   */
  constructor(opts: { width: number, height: number, img: string, z?: number }) {
    this.width = opts.width;
    this.height = opts.height;
    this.z = coerceZ(opts.z);
    this.img = opts.img;
    this.image = stage.imageLibrary.getSprite(this.img);
  }

  /**
   * Render the image
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor)
      stage.renderer.addBodyToFrame(this, this.actor.rigidBody, this.image, camera);
  }

  /**
   * Render the image when it does not have a rigidBody. This is only used for
   * Parallax
   *
   * @param anchor    The center x/y at which to draw the image
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  renderWithoutBody(anchor: { cx: number, cy: number }, camera: CameraSystem, _elapsedMs: number) {
    stage.renderer.addPictureToFrame(anchor, this, this.image, camera);
  }

  /**
   * Change the image being used to display the actor
   *
   * @param imgName The name of the new image file to use
   */
  public setImage(imgName: string) {
    this.image = stage.imageLibrary.getSprite(imgName);
  }

  /** Perform any custom updates to the text before displaying it */
  prerender(_elapsedMs: number) { }

  /**
   * Change the size of the image.  You shouldn't call this directly.  It gets
   * called by Actor.resize().
   *
   * @param width   The new width
   * @param height  The new height
   */
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

/**
 * AnimatedSprite describes any object whose visual representation is an
 * animation.  There can be many types of animations.  The "IDLE_E"
 * (right-facing) animation is the default.  AnimatedSprite can be notified when
 * an Entity's state changes, so that it can switch to the animation associated
 * with the new state.
 *
 * TODO:  Add a way to advance to a frame, and advance the elapsed time in that
 *        frame
 */
export class AnimatedSprite implements IStateObserver {
  /** The Actor to which this AnimatedSprite is attached */
  set actor(a: Actor | undefined) {
    this._actor = a;
    a?.state.registerObserver(this);
  }
  get actor() { return this._actor; }
  private _actor?: Actor;

  /** The currently running animation */
  private current_ani: AnimationSequence;

  /** The frame of the currently running animation that is being displayed */
  private activeFrame = 0;

  /** The amount of time for which the current frame has been displayed */
  private elapsedTime = 0;

  /** The amount of time remaining in a throw animation, if one is active */
  private throwRemain = 0;

  /** Width of the animation */
  width: number;
  /** Height of the animation */
  height: number;
  /** Z index of the image */
  z: -2 | -1 | 0 | 1 | 2;
  /**
   * The animation sequences to use (they correspond to different
   * AnimationStates) 
   */
  animations: Map<AnimationState, AnimationSequence>;
  /**
   * Disappearance animations are special, because they can have a different
   * Geometry than the Entity that they represent, so we store them in a special
   * bundle
   */
  disappear?: {
    /** The disappear animation */
    animation: AnimationSequence,
    /** Dimensions for the animation */
    dims: b2Vec2,
    /**
     * Offset of the animation's center, relative to the corresponding entity's
     * center
     */
    offset: b2Vec2
  };

  /**
   * Build an animation that can be rendered
   *
   * @param opts                  Configuration information for this
   *                              AnimationConfig object
   * @param opts.width            The width of the animation
   * @param opts.height           The height of the animation
   * @param opts.animations       A map with the valid animations.  Note that
   *                              you must include one for IDLE_E, since that is
   *                              the default animation
   * @param opts.disappear        An animation to use when making the actor
   *                              disappear
   * @param opts.disappearDims    Dimensions for the disappear animation
   * @param opts.disappearOffset  An offset between the disappear animation and
   *                              the center of the actor
   * @param opts.z                An optional z index in the range [-2,2]
   */
  constructor(opts: { width: number, height: number, animations: Map<AnimationState, AnimationSequence>, disappear?: AnimationSequence, disappearDims?: { x: number, y: number }, disappearOffset?: { x: number, y: number }, z?: number }) {
    this.width = opts.width;
    this.height = opts.height;
    this.z = coerceZ(opts.z);

    if (!opts.animations.has(AnimationState.IDLE_E))
      stage.console.log("Error: you must always provide an IDLE_E animation");

    // Clone all animations into the map
    this.animations = new Map();
    for (let k of opts.animations.keys()) {
      let v = opts.animations.get(k);
      if (v)
        this.animations.set(k, v.clone())
    }

    // Disappearance animations are special, because of their dimension and
    // offset properties.
    if (opts.disappear) {
      this.disappear = {
        animation: opts.disappear.clone(),
        dims: new b2Vec2(opts.disappearDims?.x ?? 0, opts.disappearDims?.y ?? 0),
        offset: new b2Vec2(opts.disappearOffset?.x ?? 0, opts.disappearOffset?.y ?? 0)
      };
    }
    this.current_ani = this.animations.get(AnimationState.IDLE_E)!;
  }

  /** Restart the current animation */
  public restartCurrentAnimation() { this.activeFrame = this.elapsedTime = 0; }

  /**
   * When an actor renders, we use this method to figure out which image to
   * display
   *
   * @param elapsedMs The time since the last render
   */
  private advanceAnimation(elapsedMs: number) {
    // Advance the time
    this.elapsedTime += elapsedMs;

    // are we still in this frame?
    if (this.elapsedTime <= this.current_ani.steps[this.activeFrame].duration) return;

    // are we on the last frame, with no loop? If so, stay where we are
    if (this.activeFrame == this.current_ani.steps.length - 1 && !this.current_ani.loop) return;

    // advance the animation and reset its timer to zero
    this.activeFrame = (this.activeFrame + 1) % this.current_ani.steps.length;
    this.elapsedTime = 0;
  }

  /** Return the current image for the active animation. */
  public getCurrent() { return this.current_ani.steps[this.activeFrame].cell; }

  /**
   * When the attached Actor's state changes, figure out if the animation needs
   * to change
   *
   * @param actor     The actor whose state is changing.
   * @param event     The event that might have caused `actor`'s state to change
   * @param newState  The new state of `actor`
   */
  onStateChange(actor: Actor, event: StateEvent, newState: ActorState) {
    // Should we kick off a disappear animation?
    if (newState.disappearing) {
      if (!this.disappear) return; // Exit early... no animation

      let cx = (this.actor?.rigidBody.getCenter().x ?? 0) + this.disappear.offset.x;
      let cy = (this.actor?.rigidBody.getCenter().y ?? 0) + this.disappear.offset.y;
      let animations = new Map();
      animations.set(AnimationState.IDLE_E, this.disappear.animation);
      let o = Actor.Make({
        appearance: new AnimatedSprite({ animations, width: this.disappear.dims.x, height: this.disappear.dims.y, z: this.z }),
        rigidBody: BoxBody.Box({ cx, cy, width: this.disappear.dims.x, height: this.disappear.dims.y, }, actor.scene, { collisionsEnabled: false }),
        // TODO: will we always want this to be inert, or might we sometimes want to animate it while letting it keep moving / bouncing / etc?
        movement: new InertMovement(),
        // TODO: will we always want this to have a Passive role?
        role: new Passive(),
      });
      actor.scene.camera.addEntity(o);
      return;
    }

    // Do a regular animation
    let st = AnimatedSprite.getAnimationState(newState);
    let newAni = this.animations.get(st);
    // [mfs] I suspect that this check rarely passes, because object equality != configOpts equality...
    if (newAni === this.current_ani) return;
    if (newAni === undefined) { newAni = this.animations.get(AnimationState.IDLE_E)!; }
    this.current_ani = newAni;
    this.activeFrame = 0;
    this.elapsedTime = 0;

    // If it's a toss, then it's our responsibility to figure out when to stop
    // it
    //
    // TODO: What if the toss animation is long enough that you can get a second
    //       before the first is done?  Do we need a special case for
    //       TOSS_Y while in throwing?
    if (event == StateEvent.TOSS_Y)
      this.throwRemain = newAni.getDuration();
  }

  /**
   * Figure out what AnimationState to use, given an ActorState
   *
   * @param s The ActorState from which we will derive an AnimationState
   */
  private static getAnimationState(s: ActorState) {
    // NB:  It's somewhat unavoidable that somewhere we need to have a big chunk
    //      of code for dealing with the 80 different animations.  Here it is.  

    // TODO:  Despite the above comment, this code needs to be smarter
    if (s.moving) {
      if (s.direction == DIRECTION.N) {
        if (s.crawling) { return AnimationState.CRAWL_N; }
        else if (s.invincible) { return AnimationState.INV_N; }
        else if (s.jumping) { return AnimationState.JUMP_N; }
        else if (s.tossing) { return AnimationState.TOSS_N; }
        else { return AnimationState.WALK_N; }
      }
      else if (s.direction == DIRECTION.NE) {
        if (s.crawling) { return AnimationState.CRAWL_NE; }
        else if (s.invincible) { return AnimationState.INV_NE; }
        else if (s.jumping) { return AnimationState.JUMP_NE; }
        else if (s.tossing) { return AnimationState.TOSS_NE; }
        else { return AnimationState.WALK_NE; }
      }
      else if (s.direction == DIRECTION.E) {
        if (s.crawling) { return AnimationState.CRAWL_E; }
        else if (s.invincible) { return AnimationState.INV_E; }
        else if (s.jumping) { return AnimationState.JUMP_E; }
        else if (s.tossing) { return AnimationState.TOSS_E; }
        else { return AnimationState.WALK_E; }
      }
      else if (s.direction == DIRECTION.SE) {
        if (s.crawling) { return AnimationState.CRAWL_SE; }
        else if (s.invincible) { return AnimationState.INV_SE; }
        else if (s.jumping) { return AnimationState.JUMP_SE; }
        else if (s.tossing) { return AnimationState.TOSS_SE; }
        else { return AnimationState.WALK_SE; }
      }
      else if (s.direction == DIRECTION.S) {
        if (s.crawling) { return AnimationState.CRAWL_S; }
        else if (s.invincible) { return AnimationState.INV_S; }
        else if (s.jumping) { return AnimationState.JUMP_S; }
        else if (s.tossing) { return AnimationState.TOSS_S; }
        else { return AnimationState.WALK_S; }
      }
      else if (s.direction == DIRECTION.SW) {
        if (s.crawling) { return AnimationState.CRAWL_SW; }
        else if (s.invincible) { return AnimationState.INV_SW; }
        else if (s.jumping) { return AnimationState.JUMP_SW; }
        else if (s.tossing) { return AnimationState.TOSS_SW; }
        else { return AnimationState.WALK_SW; }
      }
      else if (s.direction == DIRECTION.W) {
        if (s.crawling) { return AnimationState.CRAWL_W; }
        else if (s.invincible) { return AnimationState.INV_W; }
        else if (s.jumping) { return AnimationState.JUMP_W; }
        else if (s.tossing) { return AnimationState.TOSS_W; }
        else { return AnimationState.WALK_W; }
      }
      else if (s.direction == DIRECTION.NW) {
        if (s.crawling) { return AnimationState.CRAWL_NW; }
        else if (s.invincible) { return AnimationState.INV_NW; }
        else if (s.jumping) { return AnimationState.JUMP_NW; }
        else if (s.tossing) { return AnimationState.TOSS_NW; }
        else { return AnimationState.WALK_NW; }
      }
    }
    else {
      if (s.direction == DIRECTION.N) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_N; }
        else if (s.invincible) { return AnimationState.INV_IDLE_N; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_N; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_N; }
        else { return AnimationState.IDLE_N; }
      }
      else if (s.direction == DIRECTION.NE) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_NE; }
        else if (s.invincible) { return AnimationState.INV_IDLE_NE; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_NE; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_NE; }
        else { return AnimationState.IDLE_NE; }
      }
      else if (s.direction == DIRECTION.E) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_E; }
        else if (s.invincible) { return AnimationState.INV_IDLE_E; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_E; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_E; }
        else { return AnimationState.IDLE_E; }
      }
      else if (s.direction == DIRECTION.SE) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_SE; }
        else if (s.invincible) { return AnimationState.INV_IDLE_SE; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_SE; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_SE; }
        else { return AnimationState.IDLE_SE; }
      }
      else if (s.direction == DIRECTION.S) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_S; }
        else if (s.invincible) { return AnimationState.INV_IDLE_S; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_S; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_S; }
        else { return AnimationState.IDLE_S; }
      }
      else if (s.direction == DIRECTION.SW) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_SW; }
        else if (s.invincible) { return AnimationState.INV_IDLE_SW; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_SW; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_SW; }
        else { return AnimationState.IDLE_SW; }
      }
      else if (s.direction == DIRECTION.W) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_W; }
        else if (s.invincible) { return AnimationState.INV_IDLE_W; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_W; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_W; }
        else { return AnimationState.IDLE_W; }
      }
      else if (s.direction == DIRECTION.NW) {
        if (s.crawling) { return AnimationState.CRAWL_IDLE_NW; }
        else if (s.invincible) { return AnimationState.INV_IDLE_NW; }
        else if (s.jumping) { return AnimationState.JUMP_IDLE_NW; }
        else if (s.tossing) { return AnimationState.TOSS_IDLE_NW; }
        else { return AnimationState.IDLE_NW; }
      }
    }
    // Default case: IDLE_E
    return AnimationState.IDLE_E;
  }

  /**
   * Render the animated image's current cell
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor)
      stage.renderer.addBodyToFrame(this, this.actor.rigidBody, this.getCurrent(), camera);
  }

  /**
   * Render the animated image's current cell when it does not have a rigidBody.
   * This is only used for Parallax
   *
   * @param anchor    The center x/y at which to draw the image
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  renderWithoutBody(anchor: { cx: number, cy: number }, camera: CameraSystem, _elapsedMs: number) {
    stage.renderer.addPictureToFrame(anchor, this, this.getCurrent(), camera);
  }

  /**
   * Prior to rendering, update the animation state
   *
   * @param elapsedMs The time since the last render
   */
  prerender(elapsedMs: number) {
    // Check if it is time to turn off the throwing animation
    if (this.throwRemain > 0) {
      this.throwRemain -= elapsedMs;
      if (this.throwRemain <= 0) {
        this.throwRemain = 0;
        this._actor!.state.changeState(this._actor!, StateEvent.TOSS_N);
        // TOSS_N will put us in a new animation, so we don't want to
        // advance it
        elapsedMs = 0;
      }
    }

    // Now update the cell of the current animation
    this.advanceAnimation(elapsedMs);
  }

  /**
   * Change the size of the animation.  You shouldn't call this directly.  It
   * gets called by Actor.resize().
   *
   * @param width   The new width
   * @param height  The new height
   */
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

/**
 * FilledBox describes any object whose visual representation is a filled box.
 */
export class FilledBox {
  /** The Actor to which this FilledSprite is attached */
  public actor?: Actor;
  /** The low-level graphics object that we pass to the Renderer */
  readonly graphics = new Graphics();
  /** Width of the box */
  width: number;
  /** Height of the box */
  height: number;
  /** Z index of the box */
  z: -2 | -1 | 0 | 1 | 2;
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;

  /**
   * Build a FilledBox
   *
   * @param opts            Configuration information for this FilledBoxConfig
   *                        object
   * @param opts.width      Width of the box 
   * @param opts.height     Height of the box 
   * @param opts.lineWidth  Width of the border
   * @param opts.lineColor  Color for the border
   * @param opts.fillColor  Color to fill the box
   * @param opts.z          An optional z index in the range [-2,2]
   */
  public constructor(opts: { width: number, height: number, lineWidth?: number, lineColor?: string, fillColor?: string, z?: number }) {
    this.width = opts.width;
    this.height = opts.height;
    this.z = coerceZ(opts.z);
    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;
    validateFilledConfig(this, "FilledBox");
  }

  /**
   * Render the FilledBox
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor)
      stage.renderer.addFilledSpriteToFrame(this, this.actor.rigidBody, this.graphics, camera);
  }

  /** Perform any custom updates to the box before displaying it */
  prerender(_elapsedMs: number) { }

  /**
   * Change the size of the box.  You shouldn't call this directly.  It gets
   * called by Actor.resize().
   *
   * @param width   The new width
   * @param height  The new height
   */
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

/**
 * FilledCircle describes any object whose visual representation is a filled
 * circle.
 */
export class FilledCircle {
  /** The Actor to which this FilledCircle is attached */
  public actor?: Actor;
  /** The low-level graphics object that we pass to the Renderer */
  readonly graphics = new Graphics();
  /** Radius of the circle */
  radius: number;
  /** Width, to simplify some other code */
  width: number;
  /** Height, to simplify some other code */
  height: number;
  /** Z index of the circle: Must be in the range [-2, 2] */
  z: number;
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;

  /**
   * Build a FilledCircle
   * 
   * @param opts            Configuration information for this
   *                        FilledCircleConfig object
   * @param opts.radius     Radius of the circle
   * @param opts.lineWidth  Width of the border
   * @param opts.lineColor  Color for the border
   * @param opts.fillColor  Color to fill the circle
   * @param opts.z          An optional z index in the range [-2,2]
   */
  public constructor(opts: { radius: number, lineWidth?: number, lineColor?: string, fillColor?: string, z?: number }) {
    this.radius = opts.radius;
    this.width = this.height = 2 * this.radius;
    this.z = coerceZ(opts.z);
    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;
    validateFilledConfig(this, "FilledCircle");
  }

  /**
   * Render the FilledCircle
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor)
      stage.renderer.addFilledSpriteToFrame(this, this.actor.rigidBody, this.graphics, camera);
  }

  /** Perform any custom updates to the circle before displaying it */
  prerender(_elapsedMs: number) { }

  /**
   * Change the size of the circle.  You shouldn't call this directly.  It gets
   * called by Actor.resize().
   *
   * @param width   The new width
   * @param height  The new height
   */
  resize(width: number, height: number) {
    this.radius = width > height ? width / 2 : height / 2;
    this.width = 2 * this.radius;
    this.height = 2 * this.radius;
  }
}

/**
 * FilledPolygon describes any object whose visual representation is a filled
 * polygon.
 */
export class FilledPolygon {
  /** The Actor to which this FilledPolygon is attached */
  public actor?: Actor;
  /** The low-level graphics object that we pass to the Renderer */
  readonly graphics = new Graphics();
  /** Z index of the polygon: Must be in the range [-2, 2] */
  z: number;
  /** Width, to simplify some other code */
  width: number;
  /** Height, to simplify some other code */
  height: number;
  /** Vertices of the polygon */
  vertices: { x: number, y: number }[] = [];
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;

  /**
   * Build a FilledPolygon
   *
   * @param opts            Configuration information for this
   *                        FilledPolygonConfig object
   * @param opts.vertices   An array of vertex points.  Even indices are x
   *                        values, odd indices are y values.  The points should
   *                        be relative to the center.
   * @param opts.lineWidth  Width of the border
   * @param opts.lineColor  Color for the border
   * @param opts.fillColor  Color to fill the box
   * @param opts.z          An optional z index in the range [-2,2]
   */
  constructor(opts: { vertices: number[], lineWidth?: number, lineColor?: string, fillColor?: string, z?: number }) {
    for (let i = 0; i < opts.vertices.length; i += 2)
      this.vertices.push({ x: opts.vertices[i], y: opts.vertices[i + 1] });
    let minX = this.vertices[0].x;
    let minY = this.vertices[0].y;
    let maxX = minX;
    let maxY = minY;
    for (let v of this.vertices) {
      maxX = Math.max(maxX, v.x)
      maxY = Math.max(maxY, v.y)
      minX = Math.min(minX, v.x)
      minY = Math.min(minY, v.y)
    }
    this.width = (Math.abs(maxX) > Math.abs(minX)) ? 2 * maxX : 2 * minX;
    this.height = (Math.abs(maxY) > Math.abs(minY)) ? 2 * maxY : 2 * minY;
    this.z = opts.z ?? 0;
    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;
    validateFilledConfig(this, "FilledPolygon");
  }

  /**
   * Render the FilledPolygon
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor)
      stage.renderer.addFilledSpriteToFrame(this, this.actor.rigidBody, this.graphics, camera);
  }

  /** Perform any custom updates to the polygon before displaying it */
  prerender(_elapsedMs: number) { }

  /**
   * Change the size of the polygon.  You shouldn't call this directly.  It gets
   * called by Actor.resize().
   *
   * @param width   The new width
   * @param height  The new height
   */
  resize(width: number, height: number) {
    // we need to manually scale all the vertices, based on the old verts
    let xScale = width / this.width;
    let yScale = height / this.height;
    let vertArray: b2Vec2[] = [];
    for (let i = 0; i < this.vertices.length; ++i) {
      let point = this.vertices[i];
      vertArray.push(new b2Vec2(point.x * xScale, point.y * yScale));
    }
    this.vertices = vertArray;
    this.width = width;
    this.height = height;
  }
}

/**
 * AppearanceComponent is the type of anything that can be drawn to the screen.
 */
export type AppearanceComponent = TextSprite | ImageSprite | AnimatedSprite | FilledBox | FilledCircle | FilledPolygon;
