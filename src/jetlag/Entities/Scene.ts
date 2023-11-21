import { TimerSystem } from "../Systems/Timer"
import { TiltSystem } from "../Systems/Tilt";
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
 *   robust collision system.  It is also likely to have a projectile system and
 *   a tilt system.
 * - Hud: This is the heads-up display that sits on top of the World scene, and
 *   provides a user interface.
 * - Overlay: We use short-lived scenes that obscure the world for situations
 *   like starting a level, winning/losing a level, and pausing a level.
 */
export class Scene {
  /** The optional tilt system for the scene */
  public tilt?: TiltSystem;

  /** The physics system for the scene */
  // TODO: Why would this ever not exist?
  public physics?: AdvancedCollisionSystem | BasicCollisionSystem;

  /** A camera, for making sure important actors are on screen */
  public readonly camera: CameraSystem;

  /** A timer, for creating time-based events */
  public readonly timer: TimerSystem = new TimerSystem();

  /**
   * Construct a new scene
   *
   * @param pixelMeterRatio The pixel-to-meter ratio, possibly adjusted for zoom
   */
  constructor(pixelMeterRatio: number) {
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
