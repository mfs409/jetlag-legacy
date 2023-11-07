// Last review: Needs Review

import { b2BodyType, b2Transform, b2Vec2 } from "@box2d/core";
import { Actor } from "../Entities/Actor";
import { game } from "../Stage";
import { RigidBodyComponent } from "./RigidBody";
import { CameraSystem } from "../Systems/Camera";

/**
 * Path specifies a set of points that an actor will move among, in order, at a
 * fixed speed.
 */
export class Path {
  /** The X/Y coordinates of the points in the path */
  private points: b2Vec2[] = [];

  /**
   * Add a new point to a path by giving the coordinates for where the center of
   * the actor goes next.  This returns the path, so that calls to `to` can be
   * chained.
   *
   * @param x X value of the new coordinate
   * @param y Y value of the new coordinate
   */
  public to(x: number, y: number): Path {
    this.points.push(new b2Vec2(x, y));
    return this;
  }

  /**
   * Return a copy of the ith point in the path.  We return a copy, so that the
   * caller can use the point
   *
   * @param i The index of the point to return (0-based)
   */
  public getPoint(i: number) {
    while (i < 0) i += this.points.length;
    return new b2Vec2(this.points[i].x, this.points[i].y);
  }

  /** Return the number of points in this path */
  public getNumPoints() { return this.points.length; }
}

/**
 * A rule for moving along a fixed path
 *
 * TODO: we should have a way to advance the actor along the path "as if" it had
 * been going for x milliseconds
 */
export class PathMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // This cannot be a static body
    if (this.rigidBody?.body.GetType() == b2BodyType.b2_staticBody)
      this.rigidBody.body.SetType(b2BodyType.b2_kinematicBody);
    // A path with <2 points doesn't make sense...
    if (this.path.getNumPoints() < 2) this.haltPath();
    else this.startPath();
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Is the path still running? */
  private done = false;

  /** Index of the next point in the path */
  private nextIndex = -1;

  /** Stop processing a path, and stop the actor too */
  private haltPath() {
    if (!this.rigidBody) return;
    this.done = true;
    // Stop the movement
    this.rigidBody.breakJoints();
    this.rigidBody.body.SetLinearVelocity({ x: 0, y: 0 });
  }

  /** Update the actor to start moving to the next point in the path */
  private goToNext() {
    let p = this.path.getPoint(this.nextIndex);
    // convert from the point to a unit vector, then set velocity
    p.Subtract(this.rigidBody!.getCenter()).Normalize();
    p.Scale(this.velocity);
    this.rigidBody!.breakJoints();
    this.rigidBody!.body.SetLinearVelocity(p);
  }

  /** Begin running a path */
  private startPath() {
    if (!this.rigidBody) return;
    // move to the starting point
    let transform = new b2Transform().SetPositionAngle(this.path.getPoint(0), this._rigidBody!.body.GetAngle());
    this.rigidBody.body.SetTransform(transform);
    // set up our next goal, start moving toward it
    this.nextIndex = 1;
    this.goToNext();
  }

  /**
   * Create a policy for moving an actor along a fixed path
   *
   * TODO: Consider having a callback for when the path stops?
   *
   * @param path      The path on which to move
   * @param velocity  The speed at which the actor should move 
   * @param loop      Should the path repeat infinitely, or just run once?
   */
  constructor(private path: Path, private velocity: number, private loop: boolean) {
    if (path.getNumPoints() < 2) {
      game.console.urgent("Error: path must have at least two points");
      this.haltPath();
    } else {
      this.startPath();
    }
  }

  /**
   * Assign a new path to an Actor
   *
   * @param path      The new path to follow
   * @param velocity  The velocity while travelling the path
   * @param loop      Should it loop?
   */
  public resetPath(path: Path, velocity: number, loop: boolean) {
    this.haltPath();
    this.nextIndex = -1;
    this.done = false;
    this.path = path;
    this.velocity = velocity;
    this.loop = loop;
    if (this.path.getNumPoints() < 2) {
      game.console.urgent("Error: path must have at least two points");
    } else {
      this.startPath();
    }
  }

  /** Figure out where we need to go next when driving a path */
  prerender(_elapsedMs: number, _camera: CameraSystem) {
    // quit if we're done and we don't loop
    if (this.done || !this.rigidBody) return;

    // if we haven't passed the next goal, don't set up a new goal
    let total = this.path.getPoint(this.nextIndex - 1).Subtract(this.path.getPoint(this.nextIndex));
    let sofar = this.path.getPoint(this.nextIndex - 1).Subtract(this.rigidBody.getCenter())
    if (total.x > 0 && total.x > sofar.x) return; // actor right of right goal
    else if (total.x < 0 && total.x < sofar.x) return; // actor left of left goal
    if (total.y > 0 && total.y > sofar.y) return; // actor above down goal
    else if (total.y < 0 && total.y < sofar.y) return; // actor below up goal

    // Update the goal, and restart, stop, or start moving toward it
    this.nextIndex++;
    if (this.nextIndex == this.path.getNumPoints()) {
      if (this.loop) this.startPath(); // start over for the looping case
      else this.haltPath(); // halt the path for the non-looping case
      return;
    }
    this.goToNext(); // Not at end, so move to next
  }
}

/** 
 * A rule for moving based on Tilt / Accelerometer 
 *
 * TODO:  The aggressive use of tilt in the demo game tends to confuse more than
 *        it helps.  Consider adding a "KeyboardMovement", perhaps based on
 *        ExplicitMovement?
 */
export class TiltMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // this must be a dynamic body, so that forces will work on it
    if (this.rigidBody?.body.GetType() != b2BodyType.b2_dynamicBody)
      this.rigidBody?.body.SetType(b2BodyType.b2_dynamicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Construct a policy for moving an actor via tilt */
  constructor() { game.world.tilt?.addTiltActor(this); }

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) { }

  /** Update the Y velocity, without affecting the X velocity */
  updateYVelocity(v: number) {
    if (!this.rigidBody?.body.IsEnabled()) return;
    this.rigidBody.breakJoints();
    this.rigidBody.body.SetLinearVelocity({ x: this.rigidBody?.body.GetLinearVelocity().x ?? 0, y: v });
  }

  /** Update the X velocity, without affecting the Y velocity */
  updateXVelocity(v: number) {
    if (!this.rigidBody?.body.IsEnabled()) return;
    this.rigidBody.breakJoints();
    this.rigidBody.body.SetLinearVelocity({ x: v, y: this.rigidBody?.body.GetLinearVelocity().y ?? 0 });
  }

  /** Update the X and Y velocity */
  updateVelocity(v: b2Vec2) {
    if (this.rigidBody?.body.IsEnabled()) this.rigidBody.body.SetLinearVelocity(v);
  }

  /** Apply a force to the actor */
  updateForce(v: b2Vec2) {
    if (this.rigidBody?.body.IsEnabled()) this.rigidBody.body.ApplyForceToCenter(v);
  }
}

/** A rule for moving based on dragging the actor */
export class Draggable {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // The body needs to be able to move
    if (this.rigidBody)
      this.rigidBody.body.SetType((this.kinematic) ? b2BodyType.b2_kinematicBody : b2BodyType.b2_dynamicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) { }

  /**
   * Construct a policy for moving via drag
   *
   * @param kinematic True to use a kinematic body (not affected by forces),
   *                  false for a dynamic body (affected by forces)
   */
  constructor(private kinematic: boolean) { }
}

/** A rule for moving by chasing some other actor */
export class BasicChase {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // This cannot be a static body
    if (this.rigidBody?.body.GetType() == b2BodyType.b2_staticBody)
      this.rigidBody.body.SetType(b2BodyType.b2_kinematicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) {
    // This code only works if we've got a body, the target has a body, and both
    // are enabled
    if (!this.rigidBody || !this.target.rigidBody) return;
    if (!this.target.enabled) return;

    // compute vector between actors, and normalize it
    let x = this.target.rigidBody!.body.GetPosition().x - this.rigidBody.body.GetPosition().x;
    let y = this.target.rigidBody!.body.GetPosition().y - this.rigidBody.body.GetPosition().y;
    let denom = Math.sqrt(x * x + y * y);
    x /= denom;
    y /= denom;

    // multiply by speed
    x *= this.speed;
    y *= this.speed;

    // remove changes for disabled directions, and boost the other
    // dimension a little bit
    //
    // TODO: These "multiply by 2" features should be part of the configuration
    if (!this.chaseInX) {
      x = this.rigidBody.body.GetLinearVelocity().x;
      y *= 2;
    }
    if (!this.chaseInY) {
      y = this.rigidBody.body.GetLinearVelocity().y;
      x *= 2;
    }
    // apply velocity
    this.rigidBody?.breakJoints();
    this.rigidBody?.body.SetLinearVelocity({ x, y });
  }

  /**
   * Specify that this actor is supposed to chase another actor
   *
   * @param speed    The speed with which it chases the other actor
   * @param target   The actor to chase
   * @param chaseInX Should the actor change its x velocity?
   * @param chaseInY Should the actor change its y velocity?
   */
  constructor(private speed: number, private target: Actor, private chaseInX: boolean, private chaseInY: boolean) {
  }
}

/** A rule for moving by chasing, but with a fixed velocity */
export class ChaseFixed {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // This cannot be a static body
    if (this.rigidBody?.body.GetType() == b2BodyType.b2_staticBody)
      this.rigidBody.body.SetType(b2BodyType.b2_kinematicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) {
    // This code only works if we've got a body, the target has a body, and both
    // are enabled
    if (!this.rigidBody || !this.target.rigidBody) return;
    if (!this.target.enabled) return;

    // determine directions for X and Y
    let xDir = this.target.rigidBody.getCenter().x > this.rigidBody.getCenter().x ? 1 : -1;
    let yDir = this.target.rigidBody.getCenter().x > this.rigidBody.getCenter().x ? 1 : -1;

    // Compute and apply velocity
    let x = this.ignoreX ? this.rigidBody.body.GetLinearVelocity().x : xDir * this.xMagnitude;
    let y = this.ignoreY ? this.rigidBody.body.GetLinearVelocity().y : yDir * this.yMagnitude;
    this.rigidBody.body.SetLinearVelocity({ x, y });
  }

  /**
   * Specify that this actor is supposed to chase another actor, but using fixed
   * X/Y velocities
   *
   * TODO: We can probably get rid of ignoreX and ignoreY, and instead use
   * undefined?
   *
   * @param target     The actor to chase
   * @param xMagnitude The magnitude in the x direction, if ignoreX is false
   * @param yMagnitude The magnitude in the y direction, if ignoreY is false
   * @param ignoreX    False if we should apply xMagnitude, true if we should
   *                   keep the hero's existing X velocity
   * @param ignoreY    False if we should apply yMagnitude, true if we should
   *                   keep the hero's existing Y velocity
   */
  constructor(private target: Actor, private xMagnitude: number, private yMagnitude: number, private ignoreX: boolean, private ignoreY: boolean) { }
}

/** A rule for moving via flick */
export class FlickMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // This must be a dynamic body
    if (this.rigidBody?.body.GetType() == b2BodyType.b2_staticBody)
      this.rigidBody.body.SetType(b2BodyType.b2_dynamicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) { }

  /**
   * Indicate that this actor can be flicked on the screen
   *
   * @param multiplier A value that is multiplied by the vector for the flick,
   *                   to affect speed
   */
  constructor(public multiplier: number) { }

  /**
   * Set a new velocity for the actor
   *
   * @param x The new X velocity
   * @param y The new Y velocity
   */
  updateVelocity(x: number, y: number) {
    this.rigidBody?.body.SetLinearVelocity({ x, y });
  }
}

/** A rule for hovering at a fixed camera position */
export class HoverMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) { this._rigidBody = body; }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, camera: CameraSystem) {
    if (!this.rigidBody) return;
    // TODO: is it better to get the PMR here, or just in the constructor?
    let pmr = game.pixelMeterRatio;
    this.hover.Set(this.hoverX * pmr, this.hoverY * pmr);
    let a = camera.screenToMeters(this.hover.x, this.hover.y);
    this.hover.Set(a.x, a.y);
    let transform = this.rigidBody.body.GetTransform().Clone();
    transform.SetPositionAngle(this.hover, this.rigidBody.body.GetAngle());
    this.rigidBody.body.SetTransform(transform);
  }

  /**
   * Indicate that this actor should hover at a specific location on the screen,
   * rather than being placed at some point on the level itself. Note that the
   * coordinates to this command are the center position of the hovering actor.
   * Also, be careful about using hover with zoom... hover is relative to screen
   * coordinates (pixels), not world coordinates, so it's going to look funny to
   * use this with zoom
   *
   * @param hoverX the X coordinate (in pixels) where the actor should appear
   * @param hoverY the Y coordinate (in pixels) where the actor should appear
   */
  constructor(private hoverX: number, private hoverY: number) {
    let pmr = game.pixelMeterRatio;
    this.hover = new b2Vec2(hoverX * pmr, hoverY * pmr);
  }

  /** A vector for computing hover placement */
  private hover: b2Vec2;
}

/** A rule for hovering until a flick, then moving by flick */
export class HoverFlick {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // This must be a moveable body
    if (this.rigidBody?.body.GetType() == b2BodyType.b2_staticBody)
      this.rigidBody.body.SetType(b2BodyType.b2_dynamicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, camera: CameraSystem) {
    if (!this.hover) return;
    if (!this.rigidBody) return;

    let pmr = game.pixelMeterRatio;
    this.hover.Set(this.hoverX * pmr, this.hoverY * pmr);
    let a = camera.screenToMeters(this.hover.x, this.hover.y);
    this.hover.Set(a.x, a.y);
    let transform = this.rigidBody!.body.GetTransform().Clone();
    transform.SetPositionAngle(this.hover, this.rigidBody!.body.GetAngle());
    this.rigidBody!.body.SetTransform(transform);
  }

  /**
   * Indicate that this actor should hover at a specific location on the screen,
   * rather than being placed at some point on the level itself. Note that the
   * coordinates to this command are the center position of the hovering actor.
   * Also, be careful about using hover with zoom... hover is relative to screen
   * coordinates (pixels), not world coordinates, so it's going to look funny to
   * use this with zoom
   *
   * @param hoverX      the X coordinate (in pixels) where the actor should
   *                    appear
   * @param hoverY      the Y coordinate (in pixels) where the actor should
   *                    appear
   * @param multiplier  A value that is multiplied by the vector for the flick,
   *                    to affect speed
   */
  constructor(private hoverX: number, private hoverY: number, public multiplier: number) {
    let pmr = game.pixelMeterRatio;
    this.hover = new b2Vec2(this.hoverX * pmr, this.hoverY * pmr);
  }

  /** A vector for computing hover placement */
  private hover?: b2Vec2;

  /** Set a new velocity for the actor, and stop hovering */
  updateVelocity(x: number, y: number) {
    this.hover = undefined;
    this.rigidBody?.body.SetLinearVelocity({ x, y });
  }
}

/** A rule for how projectiles move */
export class ProjectileMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // this can't be a static body
    if (!this.rigidBody) return;
    if (this.rigidBody.body.GetType() == b2BodyType.b2_staticBody)
      this.rigidBody?.body.SetType(b2BodyType.b2_kinematicBody);
    this.rigidBody.body.SetBullet(true);
    // TODO: We might want to move these to the ProjectileSystem
    this.rigidBody.body.SetGravityScale(0);
    this.rigidBody.setCollisionsEnabled(false);
    this.rigidBody.body.SetFixedRotation(true); // disable rotation...
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) { }

  /** Set a new velocity for the actor */
  updateVelocity(x: number, y: number) {
    this.rigidBody?.breakJoints();
    this.rigidBody?.body.SetLinearVelocity({ x, y });
  }
}

/** A rule for moving based on gravitational forces */
export class GravityMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // this must be a dynamic body
    this.rigidBody?.body.SetType(b2BodyType.b2_dynamicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) { }
}

/**
 * A rule for moving based on explicit input from the programmer, timers, or
 * on-screen controls 
 */
export class ExplicitMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
    // this can't have a static body
    if (this.rigidBody?.body.GetType() != b2BodyType.b2_dynamicBody)
      this.rigidBody?.body.SetType(this.gravityAffectsIt ? b2BodyType.b2_dynamicBody : b2BodyType.b2_kinematicBody);
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Does gravity affect this Actor? */
  private gravityAffectsIt: boolean;

  /** Does the actor rotate based on the direction it is moving? */
  private rotationByDirection: boolean;

  /**
   * Construct a rule for moving based on explicit input
   *
   * @param gravityAffectsIt  Does gravity affect this actor?
   * @param rotateByDirection Should the actor rotate based on its direction of
   *                          movement?
   */
  constructor(cfg: { gravityAffectsIt?: boolean, rotateByDirection?: boolean } = {}) {
    this.gravityAffectsIt = !!cfg.gravityAffectsIt;
    this.rotationByDirection = !!cfg.rotateByDirection;
  }

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) {
    if (this.rotationByDirection)
      this.rotateByMovement();
  }

  /**
   * Update the velocity
   *
   * @param x The new x velocity
   * @param y The new y velocity
   */
  updateVelocity(x: number, y: number) {
    this.rigidBody?.breakJoints();
    this.rigidBody?.body.SetLinearVelocity({ x, y });
  }

  /**
   * Update the X velocity
   *
   * @param x The new x velocity
   */
  updateXVelocity(x: number) {
    this.rigidBody?.breakJoints();
    this.rigidBody?.body.SetLinearVelocity({ x, y: this.rigidBody.body.GetLinearVelocity().y });
  }

  /**
   * Update the Y velocity
   *
   * @param y The new x velocity
   */
  updateYVelocity(y: number) {
    this.rigidBody?.breakJoints();
    this.rigidBody?.body.SetLinearVelocity({ x: this.rigidBody.body.GetLinearVelocity().x, y });
  }

  /** Return the X velocity of of this actor */
  public getXVelocity() {
    return this.rigidBody?.body.GetLinearVelocity().x;
  }

  /** Return the Y velocity of of this actor */
  public getYVelocity() {
    return this.rigidBody?.body.GetLinearVelocity().y;
  }

  /**
   * Set the absolute velocity of this actor
   *
   * @param x Velocity in X dimension
   * @param y Velocity in Y dimension
   */
  public setAbsoluteVelocity(x: number, y: number) {
    // change its velocity
    this.updateVelocity(x, y);
  }

  /** Indicate that this actor should rotate based on its direction of movement */
  private rotateByMovement() {
    if (!this.rigidBody) return;
    let x = -this.rigidBody.body.GetLinearVelocity().x ?? 0;
    let y = -this.rigidBody.body.GetLinearVelocity().y ?? 0;
    let angle = Math.atan2(y, x) + Math.atan2(-1, 0);
    let transform = new b2Transform();
    transform.SetPositionAngle(this.rigidBody.body.GetPosition(), angle);
    this.rigidBody.body.SetTransform(transform);
  }

  /**
   * Set a dampening factor to cause a moving body to slow down without
   * colliding with anything
   *
   * @param amount The amount of damping to apply
   */
  public setDamping(amount: number) {
    this.rigidBody?.body.SetLinearDamping(amount);
  }

  /**
   * Set a dampening factor to cause a spinning body to decrease its rate of
   * spin
   *
   * @param amount The amount of damping to apply
   */
  public setAngularDamping(amount: number) {
    this.rigidBody?.body.SetAngularDamping(amount);
  }

  /** Indicate that this actor should be immune to the force of gravity */
  public setGravityDefy() {
    this.rigidBody?.body.SetGravityScale(0);
  }

  /**
   * Add velocity to this actor
   *
   * @param x Velocity in X dimension
   * @param y Velocity in Y dimension
   */
  public addVelocity(x: number, y: number) {
    if (!this.rigidBody) return;
    // Add to the velocity of the actor
    let v = this.rigidBody.body.GetLinearVelocity();
    let x2 = v.x + x;
    let y2 = v.y + y;
    this.updateVelocity(x2, y2);
  }
}

/** A rule for things that don't actually move */
export class InertMovement {
  /** The Actor to which this movement is attached */
  public set rigidBody(body: RigidBodyComponent | undefined) {
    this._rigidBody = body;
  }
  public get rigidBody() { return this._rigidBody; }
  private _rigidBody?: RigidBodyComponent;

  /** Do any last-minute adjustments related to the movement */
  prerender(_elapsedMs: number, _camera: CameraSystem) { }
}

/** MovementComponent is the type of any movement rules that an Actor can have */
export type MovementComponent = PathMovement | TiltMovement | Draggable | BasicChase | ChaseFixed | FlickMovement | HoverMovement | HoverFlick | ProjectileMovement | GravityMovement | ExplicitMovement | InertMovement;
