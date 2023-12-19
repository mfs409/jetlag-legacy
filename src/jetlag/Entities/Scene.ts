import { TimerSystem } from "../Systems/Timer"
import { AdvancedCollisionSystem, BasicCollisionSystem } from "../Systems/Collisions";
import { CameraSystem } from "../Systems/Camera";
import { b2Vec2 } from "@box2d/core";

/**
 * A Scene is a container that represents an interactive, dynamic, visible
 * portion of a game. Every scene has actors inside of it, via its physics
 * world, and also has a timer and a camera.
 *
 * There are three primary uses of Scenes:
 *
 * - World: This is the scene in which all of the action takes place during
 *   gameplay.  It is likely to use an advanced physics world, with a more
 *   robust collision system.
 * - Hud: This is the heads-up display that sits on top of the World scene, and
 *   provides a user interface.
 * - Overlay: We use short-lived scenes that obscure the world for situations
 *   like starting a level, winning/losing a level, and pausing a level.
 */
export class Scene {
  /** A camera, for making sure important actors are on screen */
  readonly camera: CameraSystem;

  /** A timer, for creating time-based events */
  readonly timer: TimerSystem = new TimerSystem();

  /** Events that get processed on the next render, then discarded */
  readonly oneTimeEvents: (() => void)[] = [];

  /** Events that get processed on every render */
  readonly repeatEvents: (() => void)[] = [];

  /** Run any pending events that should happen during a render */
  public runRendertimeEvents() {
    for (let e of this.oneTimeEvents) e();
    this.oneTimeEvents.length = 0;
    for (let e of this.repeatEvents) e();
  }

  /**
   * Construct a new scene
   *
   * @param pixelMeterRatio The pixel-to-meter ratio, possibly adjusted for zoom
   * @param physics         The physics system for the scene
   */
  constructor(pixelMeterRatio: number, public physics: AdvancedCollisionSystem | BasicCollisionSystem) {
    this.camera = new CameraSystem(pixelMeterRatio);
  }

  /**
   * Set (or reset) the gravity in this world
   *
   * @param x The gravitational force in the x dimension
   * @param y The gravitational force in the y dimension (remember up is
   *          negative!)
   */
  public setGravity(x: number, y: number) {
    this.physics?.world.SetGravity(new b2Vec2(x, y));
  }
}
