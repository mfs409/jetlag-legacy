import { BaseActor } from "./BaseActor"
import { Hero } from "./Hero"
import { WorldScene } from "../stage/WorldScene"
import { JetLagDevice } from "../misc/JetLagDevice";
import { JetLagConfig } from "../JetLagConfig";

/**
 * WorldActor is the base class upon which every actor in the main game is
 * built. Every actor has a physics representation (rectangle, circle, or
 * convex polygon). Actors typically have an image associated with them, too,
 * so that they have a visual appearance during gameplay.
 *
 * A game should rarely deal with WorldActor objects directly, instead using
 * Hero, Goodie, Destination, Enemy, Obstacle, and Projectile objects.
 */
export abstract class WorldActor extends BaseActor {
  /** When the camera follows the actor without centering on it, this gives us the difference between the actor and camera */
  mCameraOffset: PhysicsType2d.Vector2 = new PhysicsType2d.Vector2(0, 0);

  /** By default, actors can't be dragged on screen */
  draggable = false;

  /**
   * Create a new actor that does not yet have physics, but that has a renderable picture
   *
   * @param game    The currently active game
   * @param scene   The scene into which the actor is being placed
   * @param imgName The image to display
   * @param width   The width
   * @param height  The height
   */
  constructor(scene: WorldScene, device: JetLagDevice, protected config: JetLagConfig, imgName: string, width: number, height: number) {
    super(scene, device, imgName, width, height);
  }

  /**
   * Each descendant defines this to address any custom logic that we need to deal with on a
   * collision
   *
   * @param other   Other object involved in this collision
   * @param contact A description of the contact that caused this collision
   */
  abstract onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact): void;

  /**
   * Make the camera follow the actor, but without centering the actor on the screen
   *
   * @param x Amount of x distance between actor and center
   * @param y Amount of y distance between actor and center
   */
  public setCameraOffset(x: number, y: number): void {
    this.mCameraOffset.x = x;
    this.mCameraOffset.y = y;
  }

  /**
   * Indicate that the actor should move with the tilt of the phone
   */
  public setMoveByTilting(): void {
    // If we've already added this to the set of tiltable objects, don't do it again
    if ((this.scene as WorldScene).tiltActors.indexOf(this) >= 0) {
      return;
    }
    // make sure it is moveable, add it to the list of tilt actors
    if (this.body.GetType() != PhysicsType2d.Dynamics.BodyType.DYNAMIC) {
      this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
    }
    (this.scene as WorldScene).tiltActors.push(this);
    // turn off sensor behavior, so this collides with stuff...
    this.setCollisionsEnabled(true);
  }

  /**
   * Call this on an actor to make it draggable. Be careful when dragging things. If they are
   * small, they will be hard to touch.
   *
   * @param immuneToPhysics Indicate whether the actor should pass through other objects or
   *                        collide with them
   */
  public setDraggable(immuneToPhysics: boolean) {
    // If the current body is static, we must change it!
    if (immuneToPhysics)
      this.body.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
    else
      this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
    this.draggable = true;
  }

  /**
   * Specify that this actor is supposed to chase another actor
   *
   * @param speed    The speed with which it chases the other actor
   * @param target   The actor to chase
   * @param chaseInX Should the actor change its x velocity?
   * @param chaseInY Should the actor change its y velocity?
   */
  public setChaseSpeed(speed: number, target: WorldActor, chaseInX: boolean, chaseInY: boolean) {
    this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
    this.scene.repeatEvents.push(() => {
      // don't chase something that isn't visible
      if (!target.getEnabled())
        return;
      // don't run if this actor isn't visible
      if (!this.getEnabled())
        return;
      // compute vector between actors, and normalize it
      let x = target.body.GetPosition().x - this.body.GetPosition().x;
      let y = target.body.GetPosition().y - this.body.GetPosition().y;
      let denom = Math.sqrt(x * x + y * y);
      x /= denom;
      y /= denom;
      // multiply by speed
      x *= speed;
      y *= speed;
      // remove changes for disabled directions, and boost the other
      // dimension a little bit
      if (!chaseInX) {
        x = this.body.GetLinearVelocity().x;
        y *= 2;
      }
      if (!chaseInY) {
        y = this.body.GetLinearVelocity().y;
        x *= 2;
      }
      // apply velocity
      this.updateVelocity(x, y);
    });
  }

  /**
   * Specify that this actor is supposed to chase another actor, but using fixed X/Y velocities
   *
   * @param target     The actor to chase
   * @param xMagnitude The magnitude in the x direction, if ignoreX is false
   * @param yMagnitude The magnitude in the y direction, if ignoreY is false
   * @param ignoreX    False if we should apply xMagnitude, true if we should keep the hero's
   *                   existing X velocity
   * @param ignoreY    False if we should apply yMagnitude, true if we should keep the hero's
   *                   existing Y velocity
   */
  public setChaseFixedMagnitude(target: WorldActor, xMagnitude: number, yMagnitude: number, ignoreX: boolean, ignoreY: boolean): void {
    this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
    let out_this = this;
    this.scene.repeatEvents.push(() => {
      // don't chase something that isn't visible
      if (!target.getEnabled())
        return;
      // don't run if this actor isn't visible
      if (!out_this.getEnabled())
        return;
      // determine directions for X and Y
      let xDir = (target.getXPosition() > out_this.getXPosition()) ? 1 : -1;
      let yDir = (target.getYPosition() > out_this.getYPosition()) ? 1 : -1;
      let x = (ignoreX) ? out_this.getXVelocity() : xDir * xMagnitude;
      let y = (ignoreY) ? out_this.getYVelocity() : yDir * yMagnitude;
      // apply velocity
      out_this.updateVelocity(x, y);
    });
  }

  /**
   * Indicate that touching this actor should make a hero throw a projectile
   *
   * @param h         The hero who should throw a projectile when this is touched
   * @param offsetX   specifies the x distance between the bottom left of the projectile and the
   *                  bottom left of the hero throwing the projectile
   * @param offsetY   specifies the y distance between the bottom left of the projectile and the
   *                  bottom left of the hero throwing the projectile
   * @param velocityX The X velocity of the projectile when it is thrown
   * @param velocityY The Y velocity of the projectile when it is thrown
   */
  public setTouchToThrow(h: Hero, offsetX: number, offsetY: number, velocityX: number, velocityY: number) {
    this.setTapCallback((worldX: number, worldY: number) => {
      (this.scene as WorldScene).projectilePool.throwFixed(h, offsetX, offsetY, velocityX, velocityY);
      return true;
    });
  }

  /** A vector for computing hover placement */
  mHover: PhysicsType2d.Vector2 | null;

  /** 
   * Disable 3 of 4 sides of a Actors, to allow walking through walls. The value
   * reflects the side that remains active. 0 is top, 1 is right, 2 is bottom, 3
   * is left
   */
  mIsOneSided: number = -1;

  /** Actors with a matching nonzero Id don't collide with each other */
  mPassThroughId: number = 0;

  /** A definition for when we attach a revolute joint to this actor */
  private mRevJointDef: PhysicsType2d.Dynamics.Joints.RevoluteJointDefinition;

  /** A joint that allows this actor to revolve around another */
  private mRevJoint: PhysicsType2d.Dynamics.Joints.Joint;

  /** Sometimes an actor collides with another actor, and should stick to it. In that case, we create two joints to connect the two actors. This is the Distance joint that connects them */
  mDJoint: PhysicsType2d.Dynamics.Joints.DistanceJoint;

  /** Sometimes an actor collides with another actor, and should stick to it.  In that case, we create two joints to connect the two actors. This is the Weld joint that connects them */
  mWJoint: PhysicsType2d.Dynamics.Joints.WeldJoint;

  /** When we have actors stuck together, we might want to set a brief delay before they can re-join. This field represents that delay time, in milliseconds. */
  mStickyDelay: number;

  /** Track if Heros stick to this WorldActor. The array has 4 positions, corresponding to top, right, bottom, left */
  mIsSticky: boolean[] = [false, false, false, false];

  /**
   * Indicate that touching this object will cause some special code to run
   *
   * @param activationGoodies1 Number of type-1 goodies that must be collected before it works
   * @param activationGoodies2 Number of type-2 goodies that must be collected before it works
   * @param activationGoodies3 Number of type-3 goodies that must be collected before it works
   * @param activationGoodies4 Number of type-4 goodies that must be collected before it works
   * @param disappear          True if the actor should disappear when the callback runs
   * @param callback           The callback to run when the actor is touched
   */
  public setTouchCallback(activation: () => boolean, disappear: boolean, callback: (actor: WorldActor) => void) {
    // set the code to run on touch
    this.setTapCallback((worldX: number, worldY: number) => {
      if (!activation())
        return false;
      if (disappear)
        this.remove(false);
      callback(this);
      return true;
    });
  }

  /**
   * Indicate that this obstacle only registers collisions on one side.
   *
   * @param side The side that registers collisions. 0 is bottom, 1 is right, 2 is top, 3 is left,
   *             -1 means "none"
   */
  public setOneSided(side: number): void {
    this.mIsOneSided = side;
  }

  /**
   * Indicate that this actor should not have collisions with any other actor that has the same ID
   *
   * @param id The number for this class of non-interacting actors
   */
  public setPassThrough(id: number): void {
    this.mPassThroughId = id;
  }


  /** A multiplier for flicking, to control how fast it goes */
  flickMultiplier: number = 0;

  /**
   * Indicate that this actor can be flicked on the screen
   *
   * @param dampFactor A value that is multiplied by the vector for the flick, to affect speed
   */
  public setFlickable(dampFactor: number) {
    // make sure the body is a dynamic body
    this.setCanFall();
    // Save the multiplier.  If it's not zero, this can be flicked by a swipe pad
    this.flickMultiplier = dampFactor;
  }

  /**
   * Indicate that this actor should hover at a specific location on the screen, rather than being
   * placed at some point on the level itself. Note that the coordinates to this command are the
   * center position of the hovering actor. Also, be careful about using hover with zoom... hover
   * is relative to screen coordinates (pixels), not world coordinates, so it's going to look
   * funny to use this with zoom
   *
   * @param x the X coordinate (in pixels) where the actor should appear
   * @param y the Y coordinate (in pixels) where the actor should appear
   */
  public setHover(x: number, y: number) {
    let pmr = this.config.pixelMeterRatio;
    this.mHover = new PhysicsType2d.Vector2(x * pmr, y * pmr);
    this.scene.repeatEvents.push(() => {
      if (this.mHover == null)
        return;
      this.mHover.Set(x * pmr, y * pmr);
      let a = this.scene.camera.screenToMeters(this.mHover.x, this.mHover.y);
      this.mHover.Set(a.x, a.y);
      this.body.SetTransform(this.mHover, this.body.GetAngle());
    });
  }

  /**
   * Make this actor sticky, so that another actor will stick to it
   *
   * @param top    Is the top sticky?
   * @param right  Is the right side sticky?
   * @param bottom Is the bottom sticky?
   * @param left   Is the left side sticky?
   */
  public setSticky(top: boolean, right: boolean, bottom: boolean, left: boolean) {
    this.mIsSticky = [bottom, right, top, left];
  }

  /**
   * Create a revolute joint between this actor and some other actor. Note that both actors need
   * to have some mass (density can't be 0) or else this won't work.
   *
   * @param anchor       The actor around which this actor will rotate
   * @param anchorX      The X coordinate (relative to center) where joint fuses to the anchor
   * @param anchorY      The Y coordinate (relative to center) where joint fuses to the anchor
   * @param localAnchorX The X coordinate (relative to center) where joint fuses to this actor
   * @param localAnchorY The Y coordinate (relative to center) where joint fuses to this actor
   */
  public setRevoluteJoint(anchor: WorldActor, anchorX: number, anchorY: number, localAnchorX: number, localAnchorY: number) {
    // make the body dynamic
    this.setCanFall();
    // create joint, connect anchors
    this.mRevJointDef = new PhysicsType2d.Dynamics.Joints.RevoluteJointDefinition();
    this.mRevJointDef.bodyA = anchor.body;
    this.mRevJointDef.bodyB = this.body;
    this.mRevJointDef.localAnchorA.Set(anchorX, anchorY);
    this.mRevJointDef.localAnchorB.Set(localAnchorX, localAnchorY);
    // rotator and anchor don't collide
    this.mRevJointDef.collideConnected = false;
    this.mRevJointDef.referenceAngle = 0;
    this.mRevJointDef.enableLimit = false;
    this.mRevJoint = this.scene.world.CreateJoint(this.mRevJointDef);
  }

  /**
   * Attach a motor to make a joint turn
   *
   * @param motorSpeed  Speed in radians per second
   * @param motorTorque torque of the motor... when in doubt, go with Float.POSITIVE_INFINITY
   */
  public setRevoluteJointMotor(motorSpeed: number, motorTorque: number) {
    // destroy the previously created joint, change the definition, re-create the joint
    this.scene.world.DestroyJoint(this.mRevJoint);
    this.mRevJointDef.enableMotor = true;
    this.mRevJointDef.motorSpeed = motorSpeed;
    this.mRevJointDef.maxMotorTorque = motorTorque;
    this.mRevJoint = this.scene.world.CreateJoint(this.mRevJointDef);
  }

  /**
   * Set upper and lower bounds on the rotation of the joint
   *
   * @param upper The upper bound in radians
   * @param lower The lower bound in radians
   */
  public setRevoluteJointLimits(upper: number, lower: number) {
    // destroy the previously created joint, change the definition, re-create the joint
    this.scene.world.DestroyJoint(this.mRevJoint);
    this.mRevJointDef.upperAngle = upper;
    this.mRevJointDef.lowerAngle = lower;
    this.mRevJointDef.enableLimit = true;
    this.mRevJoint = this.scene.world.CreateJoint(this.mRevJointDef);
  }

  /**
   * Create a weld joint between this actor and some other actor, to force the actors to stick
   * together.
   *
   * @param other  The actor that will be fused to this actor
   * @param otherX The X coordinate (relative to center) where joint fuses to the other actor
   * @param otherY The Y coordinate (relative to center) where joint fuses to the other actor
   * @param localX The X coordinate (relative to center) where joint fuses to this actor
   * @param localY The Y coordinate (relative to center) where joint fuses to this actor
   * @param angle  The angle between the actors
   */
  public setWeldJoint(other: WorldActor, otherX: number, otherY: number, localX: number,
    localY: number, angle: number) {
    let w = new PhysicsType2d.Dynamics.Joints.WeldJointDefinition();
    w.bodyA = this.body;
    w.bodyB = other.body;
    w.localAnchorA.Set(localX, localY);
    w.localAnchorB.Set(otherX, otherY);
    w.referenceAngle = angle;
    w.collideConnected = false;
    this.scene.world.CreateJoint(w);
  }

  /**
   * Create a distance joint between this actor and some other actor
   *
   * @param anchor       The actor to which this actor is connected
   * @param anchorX      The X coordinate (relative to center) where joint fuses to the anchor
   * @param anchorY      The Y coordinate (relative to center) where joint fuses to the anchor
   * @param localAnchorX The X coordinate (relative to center) where joint fuses to this actor
   * @param localAnchorY The Y coordinate (relative to center) where joint fuses to this actor
   */
  public setDistanceJoint(anchor: WorldActor, anchorX: number, anchorY: number, localAnchorX: number, localAnchorY: number) {
    // make the body dynamic
    this.setCanFall();

    // set up a joint so the head can't move too far
    let mDistJointDef = new PhysicsType2d.Dynamics.Joints.DistanceJointDefinition();
    mDistJointDef.bodyA = anchor.body;
    mDistJointDef.bodyB = this.body;
    mDistJointDef.localAnchorA.Set(anchorX, anchorY);
    mDistJointDef.localAnchorB.Set(localAnchorX, localAnchorY);
    mDistJointDef.collideConnected = false;
    mDistJointDef.dampingRatio = 0.1;
    mDistJointDef.frequencyHz = 2;

    this.scene.world.CreateJoint(mDistJointDef);
  }

  /**
   * Break any implicit joints connecting this actor
   */
  breakJoints() {
    // Clobber any joints, or this won't be able to move
    if (this.mDJoint != null) {
      this.scene.world.DestroyJoint(this.mDJoint);
      this.mDJoint = null;
      this.scene.world.DestroyJoint(this.mWJoint);
      this.mWJoint = null;
    }
  }
}