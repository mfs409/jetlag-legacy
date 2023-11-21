// TODO: Code Review

import { RigidBodyComponent } from "../Components/RigidBody";
import { AppearanceComponent, TextSprite } from "../Components/Appearance";
import { StateEvent, StateManagerComponent } from "../Components/StateManager";
import { SoundEffectComponent } from "../Components/SoundEffect";
import { Passive, RoleComponent } from "../Components/Role";
import { Scene } from "./Scene";
import { InertMovement, MovementComponent } from "../Components/Movement";
import { GestureHandlers } from "../Config";

/**
 * Actor is the core entity of the game.  Pretty much everything on the stage is
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
  public sounds?: SoundEffectComponent;

  /** The behavioral role that this Actor plays within the game */
  readonly role: RoleComponent;

  /** The visual representation of this Actor within the game */
  readonly appearance: AppearanceComponent;

  /** Extra data for the game designer to attach to the Actor */
  readonly extra: any = {};

  /** The current state of this Actor */
  readonly state = new StateManagerComponent();

  /** The scene where the Actor exists */
  public scene: Scene;

  /**
   * Create an Actor
   *
   * TODO:  Update the documentation after adding more components to the config
   *        arg
   *
   * @param scene The scene where the Actor goes (defaults to game.world)
   */
  static Make(config: { rigidBody: RigidBodyComponent, appearance: AppearanceComponent, movement?: MovementComponent, role?: RoleComponent, gestures?: GestureHandlers }) {
    return new Actor(config);
  }

  /**
   * Construct an Actor
   *
   * TODO:  Update the documentation after adding more components to the config
   *        arg
   *
   * @param scene The scene where the Actor goes (defaults to game.world)
   */
  private constructor(config: { rigidBody: RigidBodyComponent, appearance: AppearanceComponent, movement?: MovementComponent, role?: RoleComponent, gestures?: GestureHandlers }) {
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
  }

  /**
   * Prerender is called on an Actor immediately before it is rendered.  This
   * lets us do any last-minute adjustments before putting it on the screen.
   *
   * @param elapsedMs The time since the last render
   *
   * @returns True if the Actor should be rendered, false otherwise
   */
  public prerender(elapsedMs: number) {
    if (!this.enabled) return false;
    this.movement?.prerender(elapsedMs, this.scene.camera);
    this.rigidBody?.prerender(elapsedMs, this);
    this.role?.prerender(elapsedMs);
    this.appearance.prerender(elapsedMs);
    return true;
  }

  /**
   * Make an Actor disappear
   *
   * @param quiet True if the disappear sound should not be played
   */
  public remove(quiet: boolean) {
    // set it invisible immediately, so that future calls know to ignore
    // this Actor.  This also disables the rigidBody.
    this.enabled = false;

    // play a sound when we remove this Actor?
    if (this.sounds?.disappearSound && !quiet)
      this.sounds.disappearSound.play();

    // Send a message to subscribers, e.g., in case one of them wants to run a
    // Disappear animation
    this.state.changeState(this, StateEvent.DISAPPEAR);
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
    //
    // TODO: This won't work for resizing text.  How should we handle that?
    if (!(this.appearance instanceof TextSprite)) {
      this.appearance.props.w = width;
      this.appearance.props.h = height;
    }
    this.rigidBody.resize(x, y, width, height);
  }
}
