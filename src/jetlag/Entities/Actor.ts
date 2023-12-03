import { RigidBodyComponent } from "../Components/RigidBody";
import { AppearanceComponent } from "../Components/Appearance";
import { StateEvent, StateManagerComponent } from "../Components/StateManager";
import { SoundEffectComponent } from "../Components/SoundEffect";
import { Passive, RoleComponent } from "../Components/Role";
import { Scene } from "./Scene";
import { InertMovement, MovementComponent } from "../Components/Movement";
import { GestureHandlers } from "../Config";

/**
 * Actor is the main entity of the game.  Pretty much everything on the stage is
 * an actor.
 */
export class Actor {
  /** Is this Actor visible and able to interact with the world? */
  public set enabled(val: boolean) { this._active = val; this.rigidBody?.body.SetEnabled(val); }
  public get enabled() { return this._active; }
  private _active = true;

  /**
   * A physical context for the Actor.  This is necessary if the Actor will
   * move, participate in collisions, or receive gesture inputs.
   */
  readonly rigidBody: RigidBodyComponent;

  /** A set of functions describing how the Actor should respond to gestures. */
  public gestures?: GestureHandlers;
  /** The rules for how this Actor should move */
  readonly movement: MovementComponent;
  /** The packet of information describing the audio aspects of this Actor */
  readonly sounds: SoundEffectComponent;
  /** The behavioral role that this Actor plays within the game */
  readonly role: RoleComponent;
  /** The visual representation of this Actor within the game */
  readonly appearance: AppearanceComponent;
  /** Extra data that the game designer can attach to the Actor */
  readonly extra: any = {};
  /** The current state of this Actor */
  readonly state = new StateManagerComponent();
  /** The scene where the Actor exists */
  public scene: Scene;
  /** Code to run when the actor disappears */
  readonly onDisappear: undefined | ((a: Actor) => void);

  /**
   * Create an Actor
   *
   * @param config  Actor configuration, consisting of `rigidBody`,
   *                `appearance`, and optional `movement`, `role`, `gestures`,
   *                and `sounds`
   * @param config.rigidBody See {@link RigidBodyComponent}
   */
  static Make(config: { rigidBody: RigidBodyComponent, appearance: AppearanceComponent, movement?: MovementComponent, role?: RoleComponent, gestures?: GestureHandlers, sounds?: SoundEffectComponent, onDisappear?: (a: Actor) => void }) {
    return new Actor(config);
  }

  /**
   * Construct an Actor
   *
   * @param config  Actor configuration, consisting of `rigidBody`,
   *                `appearance`, and optional `movement`, `role`, `gestures`,
   *                and `sounds`
   */
  private constructor(config: { rigidBody: RigidBodyComponent, appearance: AppearanceComponent, movement?: MovementComponent, role?: RoleComponent, gestures?: GestureHandlers, sounds?: SoundEffectComponent, onDisappear?: (a: Actor) => void }) {
    this.scene = config.rigidBody.scene;

    this.appearance = config.appearance;
    this.scene.camera.addEntity(this);
    this.appearance.actor = this;

    this.rigidBody = config.rigidBody;
    this.rigidBody.body.SetUserData(this);

    this.movement = config.movement ?? new InertMovement();
    this.movement.rigidBody = this.rigidBody;

    this.role = config.role ?? new Passive();
    this.role.actor = this;

    if (config.gestures)
      this.gestures = config.gestures;

    this.sounds = config.sounds ?? new SoundEffectComponent({});
    this.onDisappear = config.onDisappear;
  }

  /**
   * Prerender is called on an Actor immediately before it is rendered.  This
   * lets us do any last-minute adjustments before putting it on the screen.
   *
   * @param elapsedMs The time since the last render
   *
   * @returns True if the Actor is enabled, false otherwise
   */
  public prerender(elapsedMs: number) {
    if (!this.enabled) return false;
    this.movement?.prerender(elapsedMs, this.scene.camera);
    this.rigidBody?.prerender(elapsedMs, this);
    this.role?.prerender(elapsedMs);
    this.appearance.prerender(elapsedMs);
    return true;
  }

  /** Make an Actor disappear */
  public remove() {
    // set it invisible immediately, so that future calls know to ignore this
    // Actor.  This also disables the rigidBody.
    //
    // NB: We disable instead of actually removing from the physics world
    this.enabled = false;

    // play a sound when we remove this Actor?
    this.sounds?.disappear?.play();

    // Send a message to subscribers, e.g., in case one of them wants to run a
    // Disappear animation
    this.state.changeState(this, StateEvent.DISAPPEAR);
    if (this.onDisappear) this.onDisappear(this);
  }

  /**
   * Change the size of an Actor, and/or change its position
   *
   * @param x      The new X coordinate of its top left corner, in pixels
   * @param y      The new Y coordinate of its top left corner, in pixels
   * @param width  The new width of the Actor, in pixels
   * @param height The new height of the Actor, in pixels
   */
  public resize(x: number, y: number, width: number, height: number) {
    // set new height and width of the Render context
    this.appearance.resize(width, height);
    this.rigidBody.resize(x, y, width, height);
  }
}
