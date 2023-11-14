// TODO: re-review this.  No addPictureToFrame?
// Last review: 08-11-2023

import { b2Vec2 } from "@box2d/core";
import { Text, Sprite } from "../Services/ImageService";
import { CameraSystem } from "../Systems/Camera";
import { Actor } from "../Entities/Actor";
import { AniCfgOpts, AnimationSequence, FilledBoxConfigOpts, FilledCircleConfigOpts, FilledPolyConfigOpts, ImgConfigOpts, TxtConfigOpts } from "../Config";
import { AnimationState as AnimationState, StateEvent, IStateObserver, transitions } from "./StateManager";
import { game } from "../Stage";
import { RigidBodyComponent } from "./RigidBody";
import { InertMovement } from "./Movement";
import { Passive } from "./Role";
import { Graphics } from "pixi.js";

// TODO: do we need rot in any of these configs, now that everything has a RigidBody?

/** 
 * ImageConfig stores the geometry and other configuration information needed
 * when describing an image that is not animated.
 */
export class ImageConfig {
  /** Width of the image */
  w: number;
  /** Height of the image */
  h: number;
  /** Z index of the image */
  z: -2 | -1 | 0 | 1 | 2;
  /** Amount of rotation */
  rot: number;

  /**
   * Construct an ImageConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             image's configuration
   */
  constructor(opts: ImgConfigOpts) {
    this.w = opts.width;
    this.h = opts.height;
    this.rot = opts.rotation ?? 0;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;
  }
}

/** 
 * FilledBoxConfig stores the configuration information needed when describing
 * an appearance that is achieved using a filled box, not images or text.
 */
export class FilledBoxConfig {
  /** Width of the box */
  w: number;
  /** Height of the box */
  h: number;
  /** Z index of the box */
  z: -2 | -1 | 0 | 1 | 2;
  /** Amount of rotation */
  rot: number;
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: number;
  /** Fill color */
  fillColor?: number;

  /**
   * Construct a FilledBoxConfig object
   *
   * @param opts The configuration options that describe how to make this box's
   *             configuration
   */
  constructor(opts: FilledBoxConfigOpts) {
    this.w = opts.width;
    this.h = opts.height;
    this.rot = opts.rotation ?? 0;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;

    // Validate: if there's a line width, there needs to be a line color
    if (this.lineWidth !== undefined && this.lineColor === undefined)
      game.console.urgent("Error: FilledBox with lineWidth must have lineColor");

    // Validate: if there's a line color, there needs to be a line width
    else if (this.lineColor !== undefined && this.lineWidth === undefined)
      game.console.urgent("Error: FilledBox with lineColor must have lineWidth");

    // Validate: if there is no line width or line color, there needs to be a fill color
    else if (this.lineWidth === undefined && this.fillColor === undefined)
      game.console.urgent("Error: FilledBox must have lineWidth or fillColor");
  }
}

/**
 * FilledCircleConfig stores the configuration information needed when
 * describing an appearance that is achieved using a filled circle, not images
 * or text
 */
export class FilledCircleConfig {
  /** Radius of the circle */
  radius: number;
  /** Width, to simplify some other code */
  w: number;
  /** Height, to simplify some other code */
  h: number;
  /** Z index of the circle: Must be in the range [-2, 2] */
  z: number;
  /** Amount of rotation */
  rot: number;
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: number;
  /** Fill color */
  fillColor?: number;

  /**
   * Construct a FilledCircleConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             circle's configuration
   */
  constructor(opts: FilledCircleConfigOpts) {
    this.radius = opts.radius;
    this.rot = opts.rotation ?? 0;
    this.w = this.h = 2 * this.radius;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;

    // Validate: if there's a line width, there needs to be a line color
    if (this.lineWidth !== undefined && this.lineColor === undefined)
      game.console.urgent("Error: FilledCircle with lineWidth must have lineColor");

    // Validate: if there's a line color, there needs to be a line width
    else if (this.lineColor !== undefined && this.lineWidth === undefined)
      game.console.urgent("Error: FilledCircle with lineColor must have lineWidth");

    // Validate: if there is no line width or line color, there needs to be a fill color
    else if (this.lineWidth === undefined && this.fillColor === undefined)
      game.console.urgent("Error: FilledCircle must have lineWidth or fillColor");
  }
}

/**
 * FilledPolyConfig expresses the required and optional fields that a programmer
 * should provide to JetLag in order to create an entity whose visual
 * representation is a solid polygon.
 */
export class FilledPolyConfig {
  /** Z index of the polygon: Must be in the range [-2, 2] */
  z: number;
  /** Amount of rotation */
  rot: number;
  /** Width, to simplify some other code */
  w: number;
  /** Height, to simplify some other code */
  h: number;
  /** Vertices of the polygon */
  vertices: { x: number, y: number }[];
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: number;
  /** Fill color */
  fillColor?: number;

  /**
   * Construct a FilledPolyConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             polygon's configuration
   */
  constructor(opts: FilledPolyConfigOpts) {
    this.vertices = [];
    for (let i = 0; i < opts.vertices.length; i += 2)
      this.vertices.push({ x: opts.vertices[i], y: opts.vertices[i + 1] });
    this.rot = opts.rotation ?? 0;
    let minx = this.vertices[0].x;
    let miny = this.vertices[0].y;
    let maxx = minx;
    let maxy = miny;
    for (let v of this.vertices) {
      maxx = Math.max(maxx, v.x)
      maxy = Math.max(maxy, v.y)
      minx = Math.min(minx, v.x)
      miny = Math.min(miny, v.y)
    }
    this.w = (Math.abs(maxx) > Math.abs(minx)) ? 2 * maxx : 2 * minx;
    this.h = (Math.abs(maxy) > Math.abs(miny)) ? 2 * maxy : 2 * miny;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;

    // Validate: if there's a line width, there needs to be a line color
    if (this.lineWidth !== undefined && this.lineColor === undefined)
      game.console.urgent("Error: FilledPoly with lineWidth must have lineColor");

    // Validate: if there's a line color, there needs to be a line width
    else if (this.lineColor !== undefined && this.lineWidth === undefined)
      game.console.urgent("Error: FilledPoly with lineColor must have lineWidth");

    // Validate: if there is no line width or line color, there needs to be a fill color
    else if (this.lineWidth === undefined && this.fillColor === undefined)
      game.console.urgent("Error: FilledPoly must have lineWidth or fillColor");
  }
}

/**
 * TextConfig stores the geometry and other configuration information needed
 * when describing on-screen text.
 */
export class TextConfig {
  /** Width of the text (computed) */
  w = 0;
  /** Height of the text (computed) */
  h = 0;
  /** Z index of the image */
  z: -2 | -1 | 0 | 1 | 2;
  /** Amount of rotation */
  rot: number;
  /** Should the text be centered at X,Y (true) or is (X,Y) top-left (false) */
  c: boolean;
  /** Font to use */
  face: string;
  /** Color for the text */
  rgb: string;
  /** Font size */
  size: number;

  /**
   * Construct a TextConfig object 
   *
   * @param opts The configuration options that describe how to make this text's
   *             configuration
   */
  constructor(opts: TxtConfigOpts) {
    this.rot = opts.rotation ?? 0;
    this.c = opts.center;
    this.face = opts.face;
    this.rgb = opts.color;
    this.size = opts.size;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;
  }
}

/**
 * AnimationConfig stores the geometry and other configuration information
 * needed when describing an animated image.
 */
export class AnimationConfig {
  /** Width of the animation */
  w: number;
  /** Height of the animation */
  h: number;
  /** Z index of the image */
  z: -2 | -1 | 0 | 1 | 2;
  /** Amount of rotation */
  rot: number;
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
   * Construct an AnimationConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             animation's configuration
   */
  constructor(opts: AniCfgOpts) {
    this.w = opts.width;
    this.h = opts.height;
    this.rot = opts.rotation ?? 0;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.animations = new Map();

    // The order is important here: if we have a "right" but not a "left", we
    // use the "right" as the "left".  We also fall back to the idle for any
    // animation that is missing.  By computing all of these animations here,
    // the code later on can be a lot simpler.
    //
    // Also note that we set up *all* of the animations, for *every entity*.  It
    // doesn't matter if a certain role can't be invincible, or can't jump, etc:
    // we'd have a lot more code and complexity if we tried to specialize the
    // animation transitions on a per-role basis, without any appreciable gain
    // in performance or maintainability.

    // TODO: Some of the combined states (*_idle_{left/right}) are not in use?
    this.animations.set(AnimationState.IDLE_RIGHT, opts.idle_right.clone());
    this.animations.set(AnimationState.IDLE_LEFT, opts.idle_left?.clone() ?? opts.idle_right.clone());

    this.animations.set(AnimationState.MOVE_RIGHT, opts.move_right?.clone() ?? this.animations.get(AnimationState.IDLE_RIGHT)!.clone());
    this.animations.set(AnimationState.MOVE_LEFT, opts.move_left?.clone() ?? opts.move_right?.clone() ?? this.animations.get(AnimationState.IDLE_LEFT)!.clone());

    this.animations.set(AnimationState.JUMP_RIGHT, opts.jump_right?.clone() ?? this.animations.get(AnimationState.IDLE_RIGHT)!.clone());
    this.animations.set(AnimationState.JUMP_LEFT, opts.jump_left?.clone() ?? opts.jump_right?.clone() ?? this.animations.get(AnimationState.IDLE_LEFT)!.clone());
    this.animations.set(AnimationState.JUMP_IDLE_RIGHT, this.animations.get(AnimationState.JUMP_RIGHT)!.clone());
    this.animations.set(AnimationState.JUMP_IDLE_LEFT, this.animations.get(AnimationState.JUMP_LEFT)!.clone());

    this.animations.set(AnimationState.CRAWL_RIGHT, opts.crawl_right?.clone() ?? this.animations.get(AnimationState.IDLE_RIGHT)!.clone());
    this.animations.set(AnimationState.CRAWL_LEFT, opts.crawl_left ?? opts.crawl_right?.clone() ?? this.animations.get(AnimationState.IDLE_LEFT)!.clone());
    this.animations.set(AnimationState.CRAWL_IDLE_RIGHT, this.animations.get(AnimationState.CRAWL_RIGHT)!.clone());
    this.animations.set(AnimationState.CRAWL_IDLE_LEFT, this.animations.get(AnimationState.CRAWL_LEFT)!.clone());

    this.animations.set(AnimationState.THROW_RIGHT, opts.throw_right?.clone() ?? this.animations.get(AnimationState.IDLE_RIGHT)!.clone());
    this.animations.set(AnimationState.THROW_LEFT, opts.throw_left?.clone() ?? opts.throw_right?.clone() ?? this.animations.get(AnimationState.IDLE_LEFT)!.clone());
    this.animations.set(AnimationState.THROW_IDLE_RIGHT, this.animations.get(AnimationState.THROW_RIGHT)!.clone());
    this.animations.set(AnimationState.THROW_IDLE_LEFT, this.animations.get(AnimationState.THROW_LEFT)!.clone());

    this.animations.set(AnimationState.INVINCIBLE_RIGHT, opts.invincible_right?.clone() ?? this.animations.get(AnimationState.IDLE_RIGHT)!.clone());
    this.animations.set(AnimationState.INVINCIBLE_LEFT, opts.invincible_left?.clone() ?? opts.invincible_right?.clone() ?? this.animations.get(AnimationState.IDLE_LEFT)!.clone());
    this.animations.set(AnimationState.INVINCIBLE_IDLE_LEFT, this.animations.get(AnimationState.INVINCIBLE_RIGHT)!.clone());
    this.animations.set(AnimationState.INVINCIBLE_IDLE_RIGHT, this.animations.get(AnimationState.INVINCIBLE_LEFT)!.clone());

    // Disappearance animations are special, because of their dimension and
    // offset properties.
    if (opts.disappear) {
      this.disappear = {
        animation: opts.disappear.clone(),
        dims: new b2Vec2(opts.disappearDims?.x ?? 0, opts.disappearDims?.y ?? 0),
        offset: new b2Vec2(opts.disappearOffset?.x ?? 0, opts.disappearOffset?.y ?? 0)
      };
    }
  }
}

/**
 * TextSprite describes any text object that can be drawn to the screen. The
 * text that is displayed is controlled by a callback, so that it can change
 * over time.
 */
export class TextSprite {
  /** The Actor to which this TextSprite is attached */
  public actor?: Actor;

  /** The low-level text object that we pass to the Renderer */
  private readonly text: Text;

  /** The configuration/geometry of this TextSprite */
  readonly props: TextConfig;

  /**
   * Build some text that can be rendered
   * 
   * @param cfgOpts  The configuration options for this TextSprite
   * @param producer A function that creates the text to display
   */
  constructor(cfgOpts: TxtConfigOpts, public producer: () => string) {
    this.props = new TextConfig(cfgOpts);
    this.text = game.imageLibrary.makeText("", { fontFamily: this.props.face, fontSize: this.props.size, fill: this.props.rgb });
    this.props.w = this.text.getRenderObject().width;
    this.props.h = this.text.getRenderObject().height;
  }

  clone() {
    return new TextSprite({
      z: this.props.z, rotation: this.props.rot, center: this.props.c, face: this.props.face, color: this.props.rgb,
      size: this.props.size
    }, this.producer);
  }

  /**
   * Render the text
   *
   * @param camera    The camera that defines the bounds for the Scene where
   *                  this image should be drawn
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    // Set the world position and the text, then let the renderer decide
    // where to put it...
    this.text.setText(this.producer());
    this.text.setPosition(this.actor?.rigidBody.getCenter().x ?? 0, this.actor?.rigidBody.getCenter().y ?? 0);
    game.renderer.addTextToFrame(this.text, camera, this.props.c);
  }

  /**
   * Render the text when it does not have a rigidBody. This is only used for
   * Parallax
   *
   * @param anchor    The center x/y at which to draw the image
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  renderAt(anchor: { cx: number, cy: number }, camera: CameraSystem, _elapsedMs: number) {
    // Set the world position and the text, then let the renderer decide
    // where to put it...
    this.text.setText(this.producer());
    this.text.setPosition(anchor.cx, anchor.cy);
    game.renderer.addTextToFrame(this.text, camera, this.props.c);
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
  dims(camera: CameraSystem, sampleText: string) { return this.text.getDims(camera, sampleText); }
}

/**
 * ImageSprite describes any object whose visual representation is a single
 * image that is not animated.
 */
export class ImageSprite {
  /** The Actor to which this ImageSprite is attached */
  public actor?: Actor;

  /** The configuration/geometry of this ImageSprite */
  public props: ImageConfig;

  /** The image to display for this actor */
  public image: Sprite;

  /**
   * Build an image that can be rendered
   *
   * @param cfg  The configuration options for this ImageSprite
   */
  constructor(cfg: ImgConfigOpts) {
    this.props = new ImageConfig(cfg);
    this.image = game.imageLibrary.getSprite(cfg.img);
  }

  /** Make a clone of the provided ImageSprite */
  clone() {
    return new ImageSprite({ z: this.props.z, rotation: this.props.rot, width: this.props.w, height: this.props.h, img: this.image.imgName });
  }

  /**
   * Render the image
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    // TODO: This code is probably in the wrong place.  We're moving the
    //       image because the body position is centered, not top-left.
    // if (this.body) {
    //   this.props.x -= this.props.w / 2;
    //   this.props.y -= this.props.h / 2;
    // }
    if (this.actor?.rigidBody)
      game.renderer.addBodyToFrame(this, this.actor.rigidBody, this.image, camera);
  }

  /**
   * Render the image when it does not have a rigidBody. This is only used for
   * Parallax
   *
   * @param anchor    The center x/y at which to draw the image
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  renderAt(anchor: { cx: number, cy: number }, camera: CameraSystem, _elapsedMs: number) {
    game.renderer.addPictureToFrame(anchor, this, this.image, camera);
  }

  /**
   * Change the image being used to display the actor
   *
   * @param imgName The name of the new image file to use
   */
  public setImage(imgName: string) {
    this.image = game.imageLibrary.getSprite(imgName);
  }

  /** Perform any custom updates to the text before displaying it */
  prerender(_elapsedMs: number) { }
}

/**
 * AnimatedSprite describes any object whose visual representation is an
 * animation.  There can be many types of animations.  The "idle_right"
 * (right-facing) animation is the default.  AnimatedSprite can be notified when
 * an Entity's state changes, so that it can switch to the animation associated
 * with the new state.
 *
 * TODO:  Add a way to advance to a frame, and advance the elapsed time in that
 *        frame
 */
export class AnimatedSprite implements IStateObserver {
  /** The Actor to which this AnimatedSprite is attached */
  private _actor?: Actor;
  /** The Actor to which this AnimatedSprite is attached */
  get actor() { return this._actor; }
  /** The Actor to which this AnimatedSprite is attached */
  set actor(a: Actor | undefined) {
    this._actor = a;
    a?.state.registerObserver(this);
  }

  /** The configuration/geometry of this AnimatedSprite */
  public props: AnimationConfig;

  /** The currently running animation */
  private currAni: AnimationSequence;

  /** The frame of the currently running animation that is being displayed */
  private activeFrame = 0;

  /** The amount of time for which the current frame has been displayed */
  private elapsedTime = 0;

  /** The last state of the Entity; determines which animation is showing */
  private lastState = AnimationState.IDLE_RIGHT;

  /** The amount of time remaining in a throw animation, if one is active */
  private throwRemain = 0;

  /**
   * Build an animation that can be rendered
   *
   * @param cfgOpts The configuration options for this AnimatedSprite
   */
  constructor(cfgOpts: AniCfgOpts) {
    this.props = new AnimationConfig(cfgOpts);
    this.currAni = this.props.animations.get(AnimationState.IDLE_RIGHT)!;
  }

  /** Make a copy of this AnimatedSprite */
  clone() {
    return new AnimatedSprite({
      z: this.props.z,
      rotation: this.props.rot, width: this.props.w, height: this.props.h,
      idle_right: this.props.animations.get(AnimationState.IDLE_RIGHT)!.clone(),
      idle_left: this.props.animations.get(AnimationState.IDLE_LEFT)?.clone(),
      move_right: this.props.animations.get(AnimationState.MOVE_RIGHT)?.clone(),
      move_left: this.props.animations.get(AnimationState.MOVE_LEFT)?.clone(),
      jump_right: this.props.animations.get(AnimationState.JUMP_RIGHT)?.clone(),
      jump_left: this.props.animations.get(AnimationState.JUMP_LEFT)?.clone(),
      crawl_right: this.props.animations.get(AnimationState.CRAWL_RIGHT)?.clone(),
      crawl_left: this.props.animations.get(AnimationState.CRAWL_LEFT)?.clone(),
      throw_right: this.props.animations.get(AnimationState.THROW_RIGHT)?.clone(),
      throw_left: this.props.animations.get(AnimationState.THROW_LEFT)?.clone(),
      invincible_right: this.props.animations.get(AnimationState.INVINCIBLE_RIGHT)?.clone(),
      invincible_left: this.props.animations.get(AnimationState.INVINCIBLE_LEFT)?.clone(),
      disappear: this.props.disappear?.animation.clone(),
      disappearDims: this.props.disappear?.dims.Clone(),
      disappearOffset: this.props.disappear?.offset.Clone()
    });
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
    if (this.elapsedTime <= this.currAni.steps[this.activeFrame].duration) return;

    // are we on the last frame, with no loop? If so, stay where we are
    if (this.activeFrame == this.currAni.steps.length - 1 && !this.currAni.loop) return;

    // advance the animation and reset its timer to zero
    this.activeFrame = (this.activeFrame + 1) % this.currAni.steps.length;
    this.elapsedTime = 0;
  }

  /** Return the current image for the active animation. */
  public getCurrent() { return this.currAni.steps[this.activeFrame].cell; }

  /**
   * When the attached Entity's state changes, figure out if the animation needs to change
   *
   * @param entity The entity whose state is changing
   * @param event  The event that is causing the state change
   */
  onStateChange(entity: Actor, event: StateEvent) {
    let newState = transitions.get(this.lastState)!(event);
    if (newState == this.lastState) return;

    // Should we kick off a disappear animation?
    if (newState == AnimationState.DISAPPEARING) {
      this.lastState = newState;

      if (!this.props.disappear) return;

      let cx = (this.actor?.rigidBody.getCenter().x ?? 0) + this.props.disappear.offset.x;
      let cy = (this.actor?.rigidBody.getCenter().y ?? 0) + this.props.disappear.offset.y;
      let o = new Actor({
        scene: entity.scene,
        appearance: new AnimatedSprite({ idle_right: this.props.disappear.animation, width: this.props.disappear.dims.x, height: this.props.disappear.dims.y, z: this.props.z }),
        rigidBody: RigidBodyComponent.Box({ cx, cy, width: this.props.disappear.dims.x, height: this.props.disappear.dims.y, }, entity.scene, { collisionsEnabled: false }),
        // TODO: will we always want this to be inert, or might we sometimes want to animate it while letting it keep moving / bouncing / etc?
        movement: new InertMovement(),
        // TODO: will we always want this to have a Passive role?
        role: new Passive(),
      });
      entity.scene.camera.addEntity(o);
      return;
    }

    // Do a regular animation
    let newAni = this.props.animations.get(newState)!;
    if (newAni == this.currAni) return;
    this.currAni = newAni;
    this.activeFrame = 0;
    this.elapsedTime = 0;
    this.lastState = newState;
    this.currAni = newAni;

    // If it's a throw, then it's our responsibility to figure out when to stop
    // it
    //
    // TODO: What if the throw animation is long enough that you can get a
    //       second before the first is done?  Do we need a special case for
    //       THROW_START while in throwing, at the top?
    if (event == StateEvent.THROW_START)
      this.throwRemain = newAni.getDuration();
  }

  /**
   * Render the animated image's current cell
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    if (this.actor?.rigidBody)
      game.renderer.addBodyToFrame(this, this.actor.rigidBody, this.getCurrent(), camera);
  }

  /**
   * Render the animated image's current cell when it does not have a rigidBody.
   * This is only used for Parallax
   *
   * @param anchor    The center x/y at which to draw the image
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  renderAt(anchor: { cx: number, cy: number }, camera: CameraSystem, _elapsedMs: number) {
    game.renderer.addPictureToFrame(anchor, this, this.getCurrent(), camera);
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
        this._actor!.state.changeState(this._actor!, StateEvent.THROW_STOP);
        // THROW_STOP will put us in a new animation, so we don't want to
        // advance it
        elapsedMs = 0;
      }
    }

    // Now update the cell of the current animation
    this.advanceAnimation(elapsedMs);
  }
}

/**
 * FilledSprite describes any object whose visual representation is a filled
 * circle/box/polygon shape.
 *
 * TODO:  Why does any of this "filledsprite" stuff need cx/cy?  For that
 *        matter, why do any of the Configs need x/y?  Won't that always come
 *        from the body?
 */
export class FilledSprite {
  /** The Actor to which this ImageSprite is attached */
  public actor?: Actor;

  private graphics = new Graphics();

  /**
   * Build a filled-geometry sprite that can be rendered
   *
   * @param props  The configuration options for this FilledSprite
   */
  private constructor(public props: FilledBoxConfig | FilledCircleConfig | FilledPolyConfig) {
  }

  /**
   * Construct a FilledSprite as a Box
   *
   * @param cfg The configuration of this FilledBox
   */
  public static Box(cfg: FilledBoxConfigOpts) {
    return new FilledSprite(new FilledBoxConfig(cfg));
  }

  /**
   * Construct a FilledSprite as a Circle
   *
   * @param cfg The configuration of this FilledCircle
   */
  public static Circle(cfg: FilledCircleConfigOpts) {
    return new FilledSprite(new FilledCircleConfig(cfg));
  }

  /**
   * Construct a FilledSprite as a Polygon
   *
   * @param cfg The configuration of this FilledPolygon
   */
  public static Poly(cfg: FilledPolyConfigOpts) {
    return new FilledSprite(new FilledPolyConfig(cfg));
  }

  /** Make a clone of the provided FilledSprite */
  clone() {
    if (this.props instanceof FilledBoxConfig) {
      return new FilledSprite(new FilledBoxConfig({
        width: this.props.w, height: this.props.h,
        z: this.props.z, rotation: this.props.rot, lineWidth: this.props.lineWidth,
        lineColor: this.props.lineColor, fillColor: this.props.fillColor
      }));
    }
    else if (this.props instanceof FilledCircleConfig) {
      return new FilledSprite(new FilledCircleConfig({
        radius: this.props.radius, z: this.props.z, rotation: this.props.rot, lineWidth: this.props.lineWidth,
        lineColor: this.props.lineColor, fillColor: this.props.fillColor
      }));
    }
    else if (this.props instanceof FilledPolyConfig) {
      let vertices = [] as number[];
      for (let v of this.props.vertices) {
        vertices.push(v.x);
        vertices.push(v.y);
      }
      return new FilledSprite(new FilledPolyConfig({
        vertices, z: this.props.z, rotation: this.props.rot, lineWidth: this.props.lineWidth,
        lineColor: this.props.lineColor, fillColor: this.props.fillColor
      }));

    }
    else {
      throw "Unrecognized prop type";
    }
  }

  /**
   * Render the FilledSprite
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  render(camera: CameraSystem, _elapsedMs: number) {
    // TODO: This code is probably in the wrong place.  We're moving the
    //       image because the body position is centered, not top-left.
    // if (this.body) {
    //   this.props.x -= this.props.w / 2;
    //   this.props.y -= this.props.h / 2;
    // }
    if (this.actor) {
      this.graphics.clear();
      if (this.props instanceof FilledBoxConfig) {
        if (this.props.lineWidth)
          this.graphics.lineStyle(this.props.lineWidth, this.props.lineColor!);
        if (this.props.fillColor)
          this.graphics.beginFill(this.props.fillColor);
        let s = camera.getScale();
        let x = s * (this.actor.rigidBody.getCenter().x - camera.getOffsetX());
        let y = s * (this.actor.rigidBody.getCenter().y - camera.getOffsetY());
        let w = s * this.props.w;
        let h = s * this.props.h;
        this.graphics.drawRect(x, y, w, h);
        this.graphics.position.set(x, y);
        this.graphics.pivot.set(x + w / 2, y + h / 2);
        this.graphics.rotation = this.props.rot;
        game.renderer.addGraphic(this.graphics);
      }
      else if (this.props instanceof FilledCircleConfig) {
        if (this.props.lineWidth)
          this.graphics.lineStyle(this.props.lineWidth, this.props.lineColor!);
        if (this.props.fillColor)
          this.graphics.beginFill(this.props.fillColor);
        let s = camera.getScale();
        let x = s * (this.actor.rigidBody.getCenter().x - camera.getOffsetX());
        let y = s * (this.actor.rigidBody.getCenter().y - camera.getOffsetY());
        let radius = s * this.props.radius;
        this.graphics.drawCircle(x, y, radius);
        game.renderer.addGraphic(this.graphics);

      }
      else if (this.props instanceof FilledPolyConfig) {
        if (this.props.lineWidth)
          this.graphics.lineStyle(this.props.lineWidth, this.props.lineColor!);
        if (this.props.fillColor)
          this.graphics.beginFill(this.props.fillColor);
        let s = camera.getScale();
        let x = s * (this.actor.rigidBody.getCenter().x - camera.getOffsetX());
        let y = s * (this.actor.rigidBody.getCenter().y - camera.getOffsetY());
        // For polygons, we need to translate the points (they are 0-relative in
        // Box2d, we need them to be relative to (x,y))
        let pts: number[] = [];
        for (let pt of this.props.vertices) {
          pts.push(s * pt.x + x);
          pts.push(s * pt.y + y);
        }
        // NB: must repeat start point of polygon in PIXI
        pts.push(pts[0]);
        pts.push(pts[1]);
        this.graphics.drawPolygon(pts);
        // rotation
        this.graphics.position.set(x, y);
        this.graphics.pivot.set(x, y);
        this.graphics.rotation = this.props.rot;
        game.renderer.addGraphic(this.graphics);
      }
      else {
        throw "Error: unrecognized FilledSprite props type"
      }
    }
  }

  /**
   * Render the FilledSprite
   *
   * @param camera    The camera for the current stage
   * @param elapsedMs The time since the last render
   */
  renderAt(_anchor: { cx: number, cy: number }, _camera: CameraSystem, _elapsedMs: number) {
    throw "Cannot use FilledSprite as parallax background";
  }

  /** Perform any custom updates to the text before displaying it */
  prerender(_elapsedMs: number) { }
}

/**
 * AppearanceComponent is the type of anything that can be drawn to the screen.
 */
export type AppearanceComponent = TextSprite | ImageSprite | AnimatedSprite | FilledSprite;