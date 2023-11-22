// TODO: Code Review

import { Sprite } from "./Services/ImageLibrary";
import { stage } from "./Stage";

/**
 * ImgConfigOpts expresses the required and optional fields that a programmer
 * should provide to JetLag in order to create an entity whose visual
 * representation is a single image.
 */
export interface ImgConfigOpts {
  /** Z index of the image: Must be in the range [-2, 2] */
  z?: number;
  /** Width of the image */
  width: number;
  /** Height of the image */
  height: number;
  /** The name of the image to use for this actor. */
  img: string;
}

/**
 * FilledBoxConfigOpts expresses the required and optional fields that a
 * programmer should provide to JetLag in order to create an entity whose visual
 * representation is a solid rectangle.
 *
 * TODO: Support gradients?
 */
export interface FilledBoxConfigOpts {
  /** Z index of the box: Must be in the range [-2, 2] */
  z?: number;
  /** Width of the box */
  width: number;
  /** Height of the box */
  height: number;
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;
}

/**
 * FilledCircleConfigOpts expresses the required and optional fields that a
 * programmer should provide to JetLag in order to create an entity whose visual
 * representation is a solid circle.
 */
export interface FilledCircleConfigOpts {
  /** Z index of the circle: Must be in the range [-2, 2] */
  z?: number;
  /** Radius of the circle */
  radius: number;
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;
}

/**
 * FilledPolygonConfigOpts expresses the required and optional fields that a
 * programmer should provide to JetLag in order to create an entity whose visual
 * representation is a solid polygon.
 */
export interface FilledPolygonConfigOpts {
  /** Z index of the polygon: Must be in the range [-2, 2] */
  z?: number;
  /** Vertices of the polygon */
  vertices: number[];
  /** Line width */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Fill color */
  fillColor?: string;
}

/**
 * TxtConfigOpts expresses the required and optional fields that a programmer
 * should provide to JetLag in order to create an entity whose visual
 * representation is some text.
 */
export interface TxtConfigOpts {
  /** Z index of the image: Must be in the range [-2, 2] */
  z?: number;
  /** Should the text be centered at (cx,cy) (true) or is (cx,cy) top-left (false) */
  center: boolean;
  /** Font to use */
  face: string;
  /** Color for the text */
  color: string;
  /** Font size */
  size: number;
}

/**
 * AniCfgOpts expresses the required and optional fields that a programmer
 * should provide to JetLag in order to create an entity whose visual
 * representation uses flipbook-style animation.
 */
export interface AniCfgOpts {
  /** Z index of the image: Must be in the range [-2, 2] */
  z?: number;
  /** Width of the animation */
  width: number;
  /** Height of the animation */
  height: number;
  /** The default animation */
  idle_right: AnimationSequence;
  /* The flipped default */
  idle_left?: AnimationSequence;
  /** The default moving animation */
  move_right?: AnimationSequence;
  /** The flipped moving animation */
  move_left?: AnimationSequence;
  /** The default jumping animation */
  jump_right?: AnimationSequence;
  /** The flipped jumping animation */
  jump_left?: AnimationSequence;
  /** The default crawling animation */
  crawl_right?: AnimationSequence;
  /** The flipped crawling animation */
  crawl_left?: AnimationSequence;
  /** The default throwing animation */
  throw_right?: AnimationSequence;
  /** The flipped throwing animation */
  throw_left?: AnimationSequence;
  /** The default invincible animation */
  invincible_right?: AnimationSequence;
  /** The flipped invincible animation */
  invincible_left?: AnimationSequence;
  /** The disappearance animation */
  disappear?: AnimationSequence;
  /** Dimensions for the disappearance animation */
  disappearDims?: { x: number, y: number };
  /** Offset of the disappearance animation relative to the actor */
  disappearOffset?: { x: number, y: number };
}

/**
 * BoxCfgOpts expresses the required fields that a programmer should provide to
 * JetLag in order to create an entity with a rigid Box body.
 */
export interface BoxCfgOpts {
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
  /** Width of the box */
  width: number;
  /** Height of the box */
  height: number;
}

/**
 * CircleCfgOpts expresses the required fields that a programmer should provide
 * to JetLag in order to create an entity with a rigid Circle body.
 */
export interface CircleCfgOpts {
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
  /** Radius of the circle */
  radius: number;
}

/**
 * PolygonCfgOpts expresses the required fields that a programmer should provide
 * to JetLag in order to create an entity with a rigid Polygon body.
 */
export interface PolygonCfgOpts {
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
  /** Width of the box */
  width: number;
  /** Height of the box */
  height: number;
  /**
   * Vertices of the body, as a stream of alternating x and y values that are
   * offsets relative to (cx, cy)
   */
  vertices: number[];
}

/**
 * AnimationSequence describes a set of images that can be cycled through, in
 * order to achieve an animation effect.  We associate a time (in milliseconds)
 * with each image, and also allow the animation to loop.
 */
export class AnimationSequence {
  /**
   * A set of images that can be used as frames of an animation, along with
   * their durations
   */
  public steps: { cell: Sprite, duration: number }[] = [];

  /**
   * Create the shell of an animation.  Once the shell is created, use "to()" to
   * add steps to the animation.
   *
   * @param loop  Should the animation repeat?
   */
  constructor(readonly loop: boolean) {
  }

  /** Return the duration of the entire animation sequence */
  getDuration(): number {
    let result = 0;
    for (let l of this.steps) result += l.duration;
    return result;
  }

  /** Make a clone of this animation */
  public clone() {
    let a = new AnimationSequence(this.loop);
    for (let s of this.steps)
      a.steps.push({
        cell: stage.imageLibrary.getSprite(s.cell.imgName),
        duration: s.duration
      });
    return a;
  }

  /**
   * Add a step to an animation
   *
   * @param imgName  The name of the image to add to the animation
   * @param duration The time in milliseconds that this image should be shown
   *
   * @return         The Animation, so that we can chain calls to "to()"
   */
  public to(imgName: string, duration: number): AnimationSequence {
    this.steps.push({ cell: stage.imageLibrary.getSprite(imgName), duration });
    return this;
  }
}

/**
 * GestureHandlers is the means by which a programmer can attach to an Entity
 * code to run in response to each of the gestures that JetLag supports.
 */
export class GestureHandlers {
  /**
   * Construct a set of GestureHandlers
   *
   * @param tap       code to run when this actor is tapped
   * @param panStart  code to run on a pan start event
   * @param panMove   code to run on a pan move event
   * @param panStop   code to run on a pan stop event
   * @param touchDown code to run on a down press event
   * @param touchUp   code to run on a release event
   * @param swipe     code to run on a swipe event
   */
  constructor(
    public tap?: (worldCoords: { x: number, y: number }) => boolean,
    public panStart?: (worldCoords: { x: number, y: number }) => boolean,
    public panMove?: (worldCoords: { x: number, y: number }) => boolean,
    public panStop?: (worldCoords: { x: number, y: number }) => boolean,
    public touchDown?: (worldCoords: { x: number, y: number }) => boolean,
    public touchUp?: (worldCoords: { x: number, y: number }) => boolean,
    public swipe?: (point1: { x: number, y: number }, point2: { x: number, y: number }, time: number) => boolean
  ) { }
}

/**
 * AdvancedRigidBodyCfgOpts describes advanced, optional configuration
 * properties for any rigid body
 *
 * TODO: Consider using arrays for the rigid/sticky stuff?
 */
export interface AdvancedRigidBodyCfgOpts {
  /** The density of the body */
  density?: number;
  /** The elasticity of the body */
  elasticity?: number;
  /** The friction of the body */
  friction?: number;

  /** Should rotation be disabled? */
  disableRotation?: boolean;

  /** Do collisions happen, or do other bodies glide through this? */
  collisionsEnabled?: boolean;

  /** When entities touch the top of this, do they stick? */
  topSticky?: boolean;
  /** When entities touch the bottom of this, do they stick? */
  bottomSticky?: boolean;
  /** When entities touch the left side of this, do they stick? */
  leftSticky?: boolean;
  /** When entities touch the right side of this, do they stick? */
  rightSticky?: boolean;
  /** 
   * When an entity *stops* sticking to this, how long before it can stick
   * again? 
   */
  stickyDelay?: number;

  /** Is the top the only hard surface of this body */
  topRigidOnly?: boolean;
  /** Is the bottom the only hard surface of this body */
  bottomRigidOnly?: boolean;
  /** Is the left side the only hard surface of this body */
  leftRigidOnly?: boolean;
  /** Is the right side the only hard surface of this body */
  rightRigidOnly?: boolean;

  /** Entities with a matching nonzero Id don't collide with each other */
  passThroughId?: number;

  /** The speed at which to rotate, in rotations per second */
  rotationSpeed?: number;

  /** Should the body be forced to be dynamic? */
  dynamic?: boolean;
}

/**
 * Config stores game-specific configuration values.  The programmer makes one
 * of these to tell JetLag how to run their game.
 */
export interface Config {
  /** How many pixels are equivalent to a meter in the game? */
  readonly pixelMeterRatio: number;

  /** The default game screen width, in pixels */
  readonly screenDimensions: { width: number, height: number };

  /** Should we adapt the game size based on the size of the browser window? */
  readonly adaptToScreenSize: boolean;

  /** Should the phone vibrate on certain events? */
  readonly canVibrate: boolean;

  /** Should JetLag print an outline around each actor in the game? */
  readonly hitBoxes: boolean;

  /** Key for accessing persistent storage */
  readonly storageKey: string;

  /** The list of image files that can be used by the game */
  readonly imageNames: string[];

  /** The list of audio files that can be used as sound effects by the game */
  readonly soundNames: string[];

  /** The list of audio files that can be used as (looping) background music */
  readonly musicNames: string[];

  /** The prefix for all resources */
  readonly resourcePrefix: string;

  /**
   * Should we force the accelerometer to be off? 
   *
   * This is useful when developing on a laptop that actually *has* an
   * accelerometer, because you probably don't want it in that case.
   */
  readonly forceAccelerometerOff: boolean;

  /** The code that starts drawing levels of the game */
  readonly gameBuilder: (level: number) => void;
}
