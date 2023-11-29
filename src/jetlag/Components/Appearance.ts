import { b2Vec2 } from "@box2d/core";
import { Text, Sprite } from "../Services/ImageLibrary";
import { CameraSystem } from "../Systems/Camera";
import { Actor } from "../Entities/Actor";
import { AniCfgOpts, AnimationSequence, AnimationState, FilledBoxConfigOpts, FilledCircleConfigOpts, FilledPolygonConfigOpts, ImgConfigOpts, TxtConfigOpts } from "../Config";
import { StateEvent, IStateObserver, ActorState, DIRECTION } from "./StateManager";
import { stage } from "../Stage";
import { RigidBodyComponent } from "./RigidBody";
import { InertMovement } from "./Movement";
import { Passive } from "./Role";
import { Graphics } from "pixi.js";

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

  /**
   * Construct an ImageConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             image's configuration
   */
  constructor(opts: ImgConfigOpts) {
    this.w = opts.width;
    this.h = opts.height;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;
  }
}

/**
 * Validate a filledConfig object's line/fill information
 *
 * @param cfg     The config object to validate
 * @param cfgName The type of the object, for error messages
 */
function validateFilledConfig(cfg: FilledBoxConfig | FilledCircleConfig | FilledPolygonConfig, cfgName: string) {
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
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;

  /**
   * Construct a FilledBoxConfig object
   *
   * @param opts The configuration options that describe how to make this box's
   *             configuration
   */
  constructor(opts: FilledBoxConfigOpts) {
    this.w = opts.width;
    this.h = opts.height;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;

    validateFilledConfig(this, "FilledBox");
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
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;

  /**
   * Construct a FilledCircleConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             circle's configuration
   */
  constructor(opts: FilledCircleConfigOpts) {
    this.radius = opts.radius;
    this.w = this.h = 2 * this.radius;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;

    validateFilledConfig(this, "FilledCircle");
  }
}

/**
 * FilledPolygonConfig expresses the required and optional fields that a programmer
 * should provide to JetLag in order to create an entity whose visual
 * representation is a solid polygon.
 */
export class FilledPolygonConfig {
  /** Z index of the polygon: Must be in the range [-2, 2] */
  z: number;
  /** Width, to simplify some other code */
  w: number;
  /** Height, to simplify some other code */
  h: number;
  /** Vertices of the polygon */
  vertices: { x: number, y: number }[];
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;

  /**
   * Construct a FilledPolygonConfig object
   *
   * @param opts The configuration options that describe how to make this
   *             polygon's configuration
   */
  constructor(opts: FilledPolygonConfigOpts) {
    this.vertices = [];
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
    this.w = (Math.abs(maxX) > Math.abs(minX)) ? 2 * maxX : 2 * minX;
    this.h = (Math.abs(maxY) > Math.abs(minY)) ? 2 * maxY : 2 * minY;

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

    this.lineWidth = opts.lineWidth;
    this.lineColor = opts.lineColor;
    this.fillColor = opts.fillColor;

    validateFilledConfig(this, "FilledPolygon");
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

    let tmpZ = opts.z ?? 0;
    if (tmpZ < -2) tmpZ = -2;
    if (tmpZ > 2) tmpZ = 2;
    this.z = tmpZ as -2 | -1 | 0 | 1 | 2;

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
  }
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

  /** The configuration/geometry of this TextSprite */
  readonly props: TextConfig;

  /**
   * Build some text that can be rendered
   * 
   * @param cfgOpts  The configuration options for this TextSprite
   * @param producer A function that creates the text to display, or a String
   */
  constructor(cfgOpts: TxtConfigOpts, public producer: string | (() => string)) {
    this.props = new TextConfig(cfgOpts);
    this.text = Text.makeText("", { fontFamily: this.props.face, fontSize: this.props.size, fill: this.props.rgb });
    this.props.w = this.text.text.width;
    this.props.h = this.text.text.height;
  }

  /** Make another TextSprite that is identical to this one */
  clone() {
    return new TextSprite({
      z: this.props.z, center: this.props.c, face: this.props.face, color: this.props.rgb,
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
    if (this.actor) {
      // Update the text before passing to the renderer!
      this.text.text.text = (typeof this.producer == "string") ? this.producer : this.producer();
      stage.renderer.addTextToFrame(this.text, this.actor.rigidBody, camera, this.props.c);
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
    this.image = stage.imageLibrary.getSprite(cfg.img);
  }

  /** Make a clone of the provided ImageSprite */
  clone() {
    return new ImageSprite({ z: this.props.z, width: this.props.w, height: this.props.h, img: this.image.imgName });
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
  set actor(a: Actor | undefined) {
    this._actor = a;
    a?.state.registerObserver(this);
  }
  get actor() { return this._actor; }
  private _actor?: Actor;

  /** The configuration/geometry of this AnimatedSprite */
  public props: AnimationConfig;

  /** The currently running animation */
  private currAni: AnimationSequence;

  /** The frame of the currently running animation that is being displayed */
  private activeFrame = 0;

  /** The amount of time for which the current frame has been displayed */
  private elapsedTime = 0;

  /** The amount of time remaining in a throw animation, if one is active */
  private throwRemain = 0;

  /**
   * Build an animation that can be rendered
   *
   * @param cfgOpts The configuration options for this AnimatedSprite
   */
  constructor(cfgOpts: AniCfgOpts) {
    this.props = new AnimationConfig(cfgOpts);
    this.currAni = this.props.animations.get(AnimationState.IDLE_E)!;
  }

  /** Make a copy of this AnimatedSprite */
  clone() {
    let animations = new Map();
    for (let k of this.props.animations.keys()) {
      let v = this.props.animations.get(k);
      if (v)
        animations.set(k, v.clone())
    }

    return new AnimatedSprite({
      z: this.props.z, width: this.props.w, height: this.props.h, animations,
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
      if (!this.props.disappear) return; // Exit early... no animation

      let cx = (this.actor?.rigidBody.getCenter().x ?? 0) + this.props.disappear.offset.x;
      let cy = (this.actor?.rigidBody.getCenter().y ?? 0) + this.props.disappear.offset.y;
      let animations = new Map();
      animations.set(AnimationState.IDLE_E, this.props.disappear.animation);
      let o = Actor.Make({
        appearance: new AnimatedSprite({ animations, width: this.props.disappear.dims.x, height: this.props.disappear.dims.y, z: this.props.z }),
        rigidBody: RigidBodyComponent.Box({ cx, cy, width: this.props.disappear.dims.x, height: this.props.disappear.dims.y, }, actor.scene, { collisionsEnabled: false }),
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
    let newAni = this.props.animations.get(st);
    // [mfs] I suspect that this check rarely passes, because object equality != configOpts equality...
    if (newAni === this.currAni) return;
    if (newAni === undefined) { console.log("notfound", st); newAni = this.props.animations.get(AnimationState.IDLE_E)!; }
    this.currAni = newAni;
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
}

/**
 * FilledSprite describes any object whose visual representation is a filled
 * circle/box/polygon shape.
 */
export class FilledSprite {
  /** The Actor to which this ImageSprite is attached */
  public actor?: Actor;

  /** The low-level graphics object that we pass to the Renderer */
  readonly graphics = new Graphics();

  /**
   * Build a filled-geometry sprite that can be rendered
   *
   * @param props  The configuration options for this FilledSprite
   */
  private constructor(public props: FilledBoxConfig | FilledCircleConfig | FilledPolygonConfig) {
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
  public static Polygon(cfg: FilledPolygonConfigOpts) {
    return new FilledSprite(new FilledPolygonConfig(cfg));
  }

  /** Make a clone of the provided FilledSprite */
  clone() {
    if (this.props instanceof FilledBoxConfig) {
      return new FilledSprite(new FilledBoxConfig({
        width: this.props.w, height: this.props.h,
        z: this.props.z, lineWidth: this.props.lineWidth,
        lineColor: this.props.lineColor, fillColor: this.props.fillColor
      }));
    }
    else if (this.props instanceof FilledCircleConfig) {
      return new FilledSprite(new FilledCircleConfig({
        radius: this.props.radius, z: this.props.z, lineWidth: this.props.lineWidth,
        lineColor: this.props.lineColor, fillColor: this.props.fillColor
      }));
    }
    else if (this.props instanceof FilledPolygonConfig) {
      let vertices = [] as number[];
      for (let v of this.props.vertices) {
        vertices.push(v.x);
        vertices.push(v.y);
      }
      return new FilledSprite(new FilledPolygonConfig({
        vertices, z: this.props.z, lineWidth: this.props.lineWidth,
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
    if (this.actor)
      stage.renderer.addFilledSpriteToFrame(this, this.actor.rigidBody, this.graphics, camera);
  }

  /** Perform any custom updates to the text before displaying it */
  prerender(_elapsedMs: number) { }
}

/**
 * AppearanceComponent is the type of anything that can be drawn to the screen.
 */
export type AppearanceComponent = TextSprite | ImageSprite | AnimatedSprite | FilledSprite;
