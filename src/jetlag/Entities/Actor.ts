// Last review: 08-10-2023

import { RigidBodyComponent } from "../Components/RigidBody";
import { AppearanceComponent } from "../Components/Appearance";
import { StateEvent, StateManagerComponent } from "../Components/StateManager";
import { SoundEffectComponent } from "../Components/SoundEffect";
import { RoleComponent } from "../Components/Role";
import { Scene } from "./Scene";
import { MovementComponent } from "../Components/Movement";
import { game } from "../Stage";
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
  set rigidBody(b: RigidBodyComponent | undefined) {
    this._rigidBody = b;
    b?.body.SetUserData(this);
    if (this._movement) this._movement.rigidBody = b;
    // TODO: The role should know about the body directly
    if (this._role) this._role.actor = this;
  }
  get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** A set of functions describing how the Actor should respond to gestures. */
  public set gestures(gestures: GestureHandlers | undefined) {
    this._gestures = gestures;
    if (!this.rigidBody)
      game.console.urgent("Error: no RigidBody on Actor when attaching Gestures");
  }
  public get gestures() { return this._gestures; }
  private _gestures?: GestureHandlers;

  /** The rules for how this Actor should move */
  public set movement(movement: MovementComponent | undefined) {
    this._movement = movement;
    if (this._movement && this._rigidBody) this._movement.rigidBody = this._rigidBody;
  }
  public get movement() { return this._movement; }
  private _movement?: MovementComponent;

  /** The packet of information describing the audio aspects of this Actor */
  public sounds?: SoundEffectComponent;

  /** The behavioral role that this Actor plays within the game */
  public set role(val: RoleComponent | undefined) {
    this._role = val;
    if (this._role) this._role.actor = this;
  }
  public get role() { return this._role; }
  private _role?: RoleComponent;

  /** The visual representation of this Actor within the game */
  public set appearance(appearance: AppearanceComponent | undefined) {
    // On a change, remove the old one, then install the new one
    if (this._appearance)
      this.scene.camera.removeEntity(this);
    this._appearance = appearance;
    if (this._appearance)
      this.scene.camera.addEntity(this);
    if (this._appearance) this._appearance.actor = this;
  }
  public get appearance() { return this._appearance; }
  private _appearance?: AppearanceComponent;

  /** Extra data for the game designer to attach to the Actor */
  readonly extra: any = {};

  /** The current state of this Actor */
  readonly state = new StateManagerComponent();

  /**
   * Construct an empty Actor
   *
   * @param scene The scene where the Actor goes
   */
  constructor(public scene: Scene) { }

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
    this._appearance?.prerender(elapsedMs);
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
    if (this._appearance) {
      this._appearance.props.w = width;
      this._appearance.props.h = height;
    }
    this.rigidBody = this.rigidBody?.resize(x, y, width, height);
  }
}