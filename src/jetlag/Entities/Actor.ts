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
  public gestures: GestureHandlers;
  /** The rules for how this Actor should move */
  readonly movement: MovementComponent;
  /** The packet of information describing the audio aspects of this Actor */
  readonly sounds: SoundEffectComponent;
  /** The behavioral role that this Actor plays within the game */
  readonly role: RoleComponent;
  /** The visual representation of this Actor within the game */
  readonly appearance: AppearanceComponent[];
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
   * @param config.rigidBody    The actor's body
   * @param config.appearance   The appearance of the actor
   * @param config.movement     The movement rules for this actor
   * @param config.role         The role for this actor
   * @param config.gestures     Any gestures to attach to this actor
   * @param config.sounds       The sounds for this actor
   * @param config.onDisappear  Code to run when the actor disappears
   * @param config.extra        An untyped object to store extra information
   */
  public constructor(config: { rigidBody: RigidBodyComponent, appearance: AppearanceComponent | AppearanceComponent[], movement?: MovementComponent, role?: RoleComponent, gestures?: GestureHandlers, sounds?: SoundEffectComponent, onDisappear?: (a: Actor) => void, extra?: any }) {
    this.scene = config.rigidBody.scene;

    let appearance = [] as AppearanceComponent[];
    if (Array.isArray(config.appearance)) {
      for (let a of config.appearance)
        appearance.push(a);
    }
    else {
      appearance.push(config.appearance)
    }
    if (appearance.length == 0)
      throw "Error: config.appearance cannot be an empty array";

    this.appearance = appearance;
    this.scene.camera.addEntity(this);
    for (let a of this.appearance)
      a.actor = this;

    this.rigidBody = config.rigidBody;
    this.rigidBody.body.SetUserData(this);

    this.movement = config.movement ?? new InertMovement();
    this.movement.rigidBody = this.rigidBody;

    this.role = config.role ?? new Passive();
    this.role.actor = this;

    if (config.gestures) this.gestures = config.gestures;
    else this.gestures = {};

    this.sounds = config.sounds ?? new SoundEffectComponent({});
    this.onDisappear = config.onDisappear;
    this.extra = config.extra ?? {};
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
    for (let a of this.appearance)
      a.prerender(elapsedMs);
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
   * Change the size of an Actor, keeping its center unchanged
   *
   * @param scale The factor by which to scale the actor's dimensions.  Must be
   *              >0.  1 means no change, a fraction means shrink, and a number
   *              >1 means grow.
   */
  public resize(scale: number) {
    if (scale <= 0)
      throw "Error: resize requires a positive, non-zero value";
    // set new height and width of the Render context
    for (let a of this.appearance)
      a.resize(scale);
    this.rigidBody.resize(scale);
  }
}
