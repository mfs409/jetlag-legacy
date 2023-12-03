import { b2Body, b2BodyType, b2CircleShape, b2DistanceJoint, b2DistanceJointDef, b2PolygonShape, b2RevoluteJoint, b2RevoluteJointDef, b2Transform, b2Vec2, b2WeldJointDef } from "@box2d/core";
import { stage } from "../Stage";
import { DebugSprite } from "../Services/ImageLibrary";
import { Actor } from "../Entities/Actor";
import { StateEvent } from "./StateManager";
import { Scene } from "../Entities/Scene";
import { PhysicsCfg, Sides } from "../Config";

/**
 * The base type for all rigid bodies in the game.  Rigid bodies can be Boxes,
 * Circles, and Polygons.
 */
abstract class RigidBodyBase {
  /** A debug context for drawing the "hit box" */
  readonly debug: DebugSprite | undefined;
  /** A definition for when we attach a revolute joint to this entity */
  revJointDef?: b2RevoluteJointDef;
  /** A joint that allows this entity to revolve around another */
  revJoint?: b2RevoluteJoint;
  /** Delay after something stops sticking, before it can stick again */
  stickyDelay?: number;
  /** Which sides of the body are sticky, if any? */
  stickySides: Sides[] = [];
  /** Entities with a matching nonzero Id don't collide with each other */
  passThroughId?: number;
  /** Are collisions only valid from one direction? */
  singleRigidSide?: Sides;
  /** A joint for fusing entities together when one is "sticky" */
  public distJoint?: b2DistanceJoint;

  /**
   * Create a rigid body
   *
   * @param scene       The physics world where this body exists
   * @param body        The physics body
   * @param radius      The radius of a circumscribed circle, for culling
   */
  protected constructor(readonly scene: Scene, readonly body: b2Body, public radius: number) {
    if (stage.config.hitBoxes) this.debug = new DebugSprite();
  }

  /**
   * Create a revolute joint between this entity and some other entity. Note that
   * both entities need to have some mass (density can't be 0) or else this won't
   * work.
   *
   * @param anchor       The entity around which this entity will rotate
   * @param anchorX      The X coordinate (relative to center) where joint fuses
   *                     to the anchor
   * @param anchorY      The Y coordinate (relative to center) where joint fuses
   *                     to the anchor
   * @param localAnchorX The X coordinate (relative to center) where joint fuses
   *                     to this entity
   * @param localAnchorY The Y coordinate (relative to center) where joint fuses
   *                     to this entity
   */
  public setRevoluteJoint(anchor: Actor, anchorX: number, anchorY: number, localAnchorX: number, localAnchorY: number) {
    // make the this body dynamic
    this.body.SetType(b2BodyType.b2_dynamicBody);
    // create joint, connect anchors
    this.revJointDef = new b2RevoluteJointDef();
    this.revJointDef.bodyA = anchor.rigidBody!.body;
    this.revJointDef.bodyB = this.body;
    this.revJointDef.localAnchorA.Set(anchorX, anchorY);
    this.revJointDef.localAnchorB.Set(localAnchorX, localAnchorY);
    // rotator and anchor don't collide
    this.revJointDef.collideConnected = false;
    this.revJointDef.referenceAngle = 0;
    this.revJointDef.enableLimit = false;
    this.revJoint = this.body.GetWorld().CreateJoint(this.revJointDef);
  }

  /**
   * Attach a motor to make a revolute joint turn
   *
   * @param motorSpeed  Speed in radians per second
   * @param motorTorque torque of the motor... when in doubt, go with something
   *                    huge, like positive infinity
   */
  public setRevoluteJointMotor(motorSpeed: number, motorTorque: number) {
    // destroy the previously created joint, change the definition, re-create
    // the joint
    if (this.revJoint) {
      this.body.GetWorld().DestroyJoint(this.revJoint);
      this.revJointDef!.enableMotor = true;
      this.revJointDef!.motorSpeed = motorSpeed;
      this.revJointDef!.maxMotorTorque = motorTorque;
    }
    this.revJoint = this.body.GetWorld().CreateJoint(this.revJointDef!);
  }

  /**
   * Set upper and lower bounds on the rotation of a revolute joint
   *
   * @param upper The upper bound in radians
   * @param lower The lower bound in radians
   */
  public setRevoluteJointLimits(upper: number, lower: number) {
    // destroy the previously created joint, change the definition, re-create
    // the joint
    this.body.GetWorld().DestroyJoint(this.revJoint!);
    this.revJointDef!.upperAngle = upper;
    this.revJointDef!.lowerAngle = lower;
    this.revJointDef!.enableLimit = true;
    this.revJoint = this.body.GetWorld().CreateJoint(this.revJointDef!);
  }

  /**
   * Create a weld joint between this entity and some other entity, to force the
   * entities to stick together.
   *
   * @param other  The entity that will be fused to this entity
   * @param otherX The X coordinate (relative to center) where joint fuses to
   *               the other entity
   * @param otherY The Y coordinate (relative to center) where joint fuses to
   *               the other entity
   * @param localX The X coordinate (relative to center) where joint fuses to
   *               this entity
   * @param localY The Y coordinate (relative to center) where joint fuses to
   *               this entity
   * @param angle  The angle between the entities
   */
  public setWeldJoint(other: Actor, otherX: number, otherY: number, localX: number, localY: number, angle: number) {
    let w = new b2WeldJointDef();
    w.bodyA = this.body;
    w.bodyB = other.rigidBody!.body;
    w.localAnchorA.Set(localX, localY);
    w.localAnchorB.Set(otherX, otherY);
    w.referenceAngle = angle;
    w.collideConnected = false;
    this.body.GetWorld().CreateJoint(w);
  }

  /**
   * Create a distance joint between this entity and some other entity
   *
   * @param anchor       The entity to which this entity is connected
   * @param anchorX      The X coordinate (relative to center) where joint fuses
   *                     to the anchor
   * @param anchorY      The Y coordinate (relative to center) where joint fuses
   *                     to the anchor
   * @param localAnchorX The X coordinate (relative to center) where joint fuses
   *                     to this entity
   * @param localAnchorY The Y coordinate (relative to center) where joint fuses
   *                     to this entity
   */
  public setDistanceJoint(anchor: Actor, anchorX: number, anchorY: number, localAnchorX: number, localAnchorY: number) {
    // make the body dynamic
    this.body.SetType(b2BodyType.b2_dynamicBody);

    // set up a joint so the entity can't move too far
    let mDistJointDef = new b2DistanceJointDef();
    mDistJointDef.bodyA = anchor.rigidBody!.body;
    mDistJointDef.bodyB = this.body;
    mDistJointDef.localAnchorA.Set(anchorX, anchorY);
    mDistJointDef.localAnchorB.Set(localAnchorX, localAnchorY);
    mDistJointDef.collideConnected = false;
    mDistJointDef.damping = 0.1;
    mDistJointDef.stiffness = 2;

    this.body.GetWorld().CreateJoint(mDistJointDef);
  }

  /** Break any implicit distance joints connecting this entity */
  public breakDistJoints() {
    // Clobber any joints, or this won't be able to move
    if (this.distJoint) {
      this.body.GetWorld().DestroyJoint(this.distJoint);
      this.distJoint = undefined;
    }
  }

  /**
   * Adjust the default physics settings (density, elasticity, friction) for
   * this entity
   *
   * @param density    New density of the entity
   * @param elasticity New elasticity of the entity
   * @param friction   New friction of the entity
   */
  public setPhysics(density: number, elasticity: number, friction: number) {
    for (let f = this.body.GetFixtureList(); f; f = f.GetNext()) {
      f.SetDensity(density);
      f.SetRestitution(elasticity);
      f.SetFriction(friction);
    }
    this.body.ResetMassData();
  }

  /**
   * Indicate whether this entity engages in physics collisions or not
   *
   * @param val True or false, depending on whether the entity will
   *            participate in physics collisions or not
   */
  public setCollisionsEnabled(val: boolean) {
    // The default is for all fixtures of a entity have the same sensor state
    for (let f = this.body.GetFixtureList(); f; f = f.GetNext())
      f.SetSensor(!val);
  }

  /**
   * Report if this entity causes transfer of momentum when it collides with
   * other entities (true) or not (false)
   */
  public getCollisionsEnabled() {
    for (let f = this.body.GetFixtureList(); f; f = f.GetNext())
      if (f.IsSensor()) return true;
    return false;
  }

  /** Return the center of the entity */
  public getCenter() { return this.body.GetPosition(); }

  /** Get the current rotation of the entity, in radians */
  public getRotation() { return this.body.GetAngle(); }

  /**
   * Call this on an entity to rotate it around its center
   *
   * @param rotation amount to rotate the entity clockwise (in radians)
   */
  public setRotation(rotation: number) {
    let transform = new b2Transform().SetPositionAngle(this.body.GetPosition(), rotation);
    this.body.SetTransform(transform);
  }

  /**
   * Change the position of an entity
   *
   * @param cx  The new X position, in meters
   * @param cy  The new Y position, in meters
   */
  public setCenter(cx: number, cy: number) {
    let transform = new b2Transform();
    transform.SetPositionAngle(new b2Vec2(cx, cy), this.body.GetAngle());
    this.body.SetTransform(transform);
  }

  /**
   * The prerender step will move the Entity's Appearance based on its RigidBody
   * 
   * @param elapsedMs The time since the last render
   * @param actor     The entity to which this RigidBody is attached
   */
  public prerender(_elapsedMs: number, actor: Actor) {
    // Broadcast the left/right movement of this entity
    let v = this.body.GetLinearVelocity();
    if (v.x > 0 && v.y > 0) actor.state.changeState(actor, StateEvent.MOVE_SE);
    else if (v.x > 0 && v.y < 0) actor.state.changeState(actor, StateEvent.MOVE_NE);
    else if (v.x > 0 && v.y == 0) actor.state.changeState(actor, StateEvent.MOVE_E);
    else if (v.x < 0 && v.y > 0) actor.state.changeState(actor, StateEvent.MOVE_SW);
    else if (v.x < 0 && v.y < 0) actor.state.changeState(actor, StateEvent.MOVE_NW);
    else if (v.x < 0 && v.y == 0) actor.state.changeState(actor, StateEvent.MOVE_W);
    else if (v.x == 0 && v.y > 0) actor.state.changeState(actor, StateEvent.MOVE_S);
    else if (v.x == 0 && v.y < 0) actor.state.changeState(actor, StateEvent.MOVE_N);
    else if (v.x == 0 && v.y == 0) actor.state.changeState(actor, StateEvent.STOP);
  }

  /**
   * Update physics properties
   *
   * @param physicsCfg  A description of which properties to change
   */
  protected updatePhysics(physicsCfg: PhysicsCfg) {
    // Update density/elasticity/friction?
    if (physicsCfg.density !== undefined && physicsCfg.density != 0)
      this.setPhysics(physicsCfg.density, this.body.GetFixtureList()?.GetRestitution() ?? 0, this.body.GetFixtureList()?.GetFriction() ?? 0)
    if (physicsCfg.elasticity !== undefined)
      this.setPhysics(this.body.GetFixtureList()?.GetDensity() ?? 1, physicsCfg.elasticity, this.body.GetFixtureList()?.GetFriction() ?? 0)
    if (physicsCfg.friction !== undefined)
      this.setPhysics(this.body.GetFixtureList()?.GetDensity() ?? 1, this.body.GetFixtureList()?.GetRestitution() ?? 0, physicsCfg.friction);

    // Enable.disable collisions?
    if (physicsCfg.collisionsEnabled !== undefined)
      this.setCollisionsEnabled(physicsCfg.collisionsEnabled);

    // Update sticky properties?
    if (physicsCfg.stickyDelay !== undefined)
      this.stickyDelay = physicsCfg.stickyDelay;
    if (physicsCfg.stickySides !== undefined) {
      this.stickySides = [];
      for (let side of physicsCfg.stickySides ?? []) this.stickySides.push(side);
    }

    // Pass-through?
    if (physicsCfg.passThroughId !== undefined)
      this.passThroughId = physicsCfg.passThroughId;

    // Rigidity?
    if (physicsCfg.singleRigidSide !== undefined)
      this.singleRigidSide = physicsCfg.singleRigidSide;

    // Make the entity continuously rotate?
    if (physicsCfg.rotationSpeed !== undefined) {
      if (this.body.GetType() == b2BodyType.b2_staticBody) this.body.SetType(b2BodyType.b2_kinematicBody);
      this.body.SetAngularVelocity(physicsCfg.rotationSpeed * 2 * Math.PI);
    }

    // No rotation, even after torque-inducing collisions?
    if (physicsCfg.disableRotation) this.body.SetFixedRotation(true);

    // Switch the body to dynamic?
    if (physicsCfg.dynamic) this.body.SetType(b2BodyType.b2_dynamicBody);
  }

  /** Make the entity stop rotating */
  public clearRotation() {
    if (this.body.GetType() != b2BodyType.b2_staticBody)
      this.body.SetAngularVelocity(0);
  }

  /** Report the current velocity of this body */
  public getVelocity() { return this.body.GetLinearVelocity().Clone(); }

  /** Change the velocity of this body */
  public setVelocity(v: b2Vec2) { return this.body.SetLinearVelocity(v); }
}

/** A rigid body whose underlying shape is a circle */
export class CircleBody extends RigidBodyBase {
  /** Radius */
  r: number;
  /** Width of the circle */
  w: number;
  /** Height of the circle */
  h: number;

  /**
   * Construct a CircleBody
   *
   * @param scene       The scene where the body should be created
   * @param body        The underlying Box2D body
   * @param circleCfg   Shape information for the circle
   */
  private constructor(scene: Scene, body: b2Body, circleCfg: { cx: number, cy: number, radius: number }) {
    super(scene, body, circleCfg.radius);
    this.w = 2 * circleCfg.radius;
    this.h = 2 * circleCfg.radius;
    this.r = circleCfg.radius;
  }

  /**
   * Construct a CircleBody
   *
   *
   * @param circleCfg                     The basic shape configuration for the
   *                                      circle
   * @param circleCfg.cx                  X coordinate of the center of the
   *                                      circle
   * @param circleCfg.cy                  Y coordinate of the center of the
   *                                      circle
   * @param circleCfg.radius              Radius of the circle
   * @param scene                         The scene (world or hud) where this
   *                                      circle should be created
   * @param physicsCfg                    A set of configuration options that
   *                                      can be applied while creating the
   *                                      circle
   * @param physicsCfg.density            The density of the body
   * @param physicsCfg.elasticity         The elasticity of the body
   * @param physicsCfg.friction           The friction of the body
   * @param physicsCfg.disableRotation    Should rotation be disabled?
   * @param physicsCfg.collisionsEnabled  Do collisions happen, or do other
   *                                      bodies glide through this?
   * @param physicsCfg.stickySides        Which sides of the body are sticky, if
   *                                      any?
   * @param physicsCfg.stickyDelay        Delay after something stops sticking,
   *                                      before it can stick again
   * @param physicsCfg.singleRigidSide    Are collisions only valid from one
   *                                      direction?
   * @param physicsCfg.passThroughId      Entities with a matching nonzero Id
   *                                      don't collide with each other
   * @param physicsCfg.rotationSpeed      The speed at which to rotate, in
   *                                      rotations per second
   * @param physicsCfg.dynamic            Should the body be forced to be
   *                                      dynamic?
   *
   * @returns A rigid body with a Circle shape
   */
  public static Circle(shapeCfg: { cx: number, cy: number, radius: number }, scene: Scene = stage.world, physicsCfg: PhysicsCfg = {}) {
    let body = scene.physics!.world.CreateBody({ type: b2BodyType.b2_staticBody, position: { x: shapeCfg.cx, y: shapeCfg.cy } });
    let rb = new CircleBody(scene, body, shapeCfg);
    let shape = new b2CircleShape();
    shape.m_radius = shapeCfg.radius;
    rb.body.CreateFixture({ shape });
    rb.setPhysics(1, 0, 0);
    rb.updatePhysics(physicsCfg);
    return rb;
  }

  /**
   * Resize and re-center a CircleBody
   *
   * @param cx      The new X position
   * @param cy      The new Y position
   * @param width   The new width
   * @param height  The new height
   */
  public resize(cx: number, cy: number, width: number, height: number) {
    // Get the current fixture, so we can preserve sensor state,
    // density/elasticity/friction, and vertices when we make a new fixture
    let oldFix = this.body.GetFixtureList()!;
    // Compute the transform
    let transform = new b2Transform();
    transform.SetPositionAngle({ x: cx, y: cy }, this.body.GetAngle());

    // make a new circle body
    this.radius = width > height ? width / 2 : height / 2;
    let shape = new b2CircleShape();
    shape.m_radius = this.radius;
    this.body.CreateFixture({ shape });

    // Update dimensions
    this.w = 2 * this.radius;
    this.h = 2 * this.radius;

    // Copy the old fixture's DEF and collision status to the new fixture before
    // destroying it
    this.setPhysics(oldFix.GetDensity(), oldFix.GetRestitution(), oldFix.GetFriction());
    if (oldFix.IsSensor()) this?.setCollisionsEnabled(false);
    this.body.DestroyFixture(oldFix)
    this.body.SetTransform(transform);
  }
};

/** A rigid body whose underlying shape is a rectangle */
export class BoxBody extends RigidBodyBase {
  /** Width of the box */
  w: number;
  /** Height of the box */
  h: number;

  /**
   * Construct a BoxBody
   *
   * @param scene       The scene where the body should be created
   * @param body        The underlying Box2D body
   * @param boxCfg      Shape information for the box
   * @param physicsCfg  Optional physics configuration
   */
  private constructor(scene: Scene, body: b2Body, boxCfg: { cx: number, cy: number, width: number, height: number }) {
    super(scene, body, Math.sqrt(Math.pow(boxCfg.height / 2, 2) + Math.pow(boxCfg.width / 2, 2)));
    this.w = boxCfg.width;
    this.h = boxCfg.height;
  }

  /**
   * Construct a BoxBody
   *
   *
   * @param boxCfg                        The basic shape configuration for the
   *                                      box
   * @param boxCfg.cx                     X coordinate of the center of the
   *                                      box
   * @param boxCfg.cy                     Y coordinate of the center of the
   *                                      box
   * @param boxCfg.width                  Width of the box
   * @param boxCfg.height                 Height of the box
   * @param scene                         The scene (world or hud) where this
   *                                      box should be created
   * @param physicsCfg                    A set of configuration options that
   *                                      can be applied while creating the
   *                                      box
   * @param physicsCfg.density            The density of the body
   * @param physicsCfg.elasticity         The elasticity of the body
   * @param physicsCfg.friction           The friction of the body
   * @param physicsCfg.disableRotation    Should rotation be disabled?
   * @param physicsCfg.collisionsEnabled  Do collisions happen, or do other
   *                                      bodies glide through this?
   * @param physicsCfg.stickySides        Which sides of the body are sticky, if
   *                                      any?
   * @param physicsCfg.stickyDelay        Delay after something stops sticking,
   *                                      before it can stick again
   * @param physicsCfg.singleRigidSide    Are collisions only valid from one
   *                                      direction?
   * @param physicsCfg.passThroughId      Entities with a matching nonzero Id
   *                                      don't collide with each other
   * @param physicsCfg.rotationSpeed      The speed at which to rotate, in
   *                                      rotations per second
   * @param physicsCfg.dynamic            Should the body be forced to be
   *                                      dynamic?
   *
   * @returns A rigid body with a Box shape
   */
  public static Box(boxCfg: { cx: number, cy: number, width: number, height: number }, scene: Scene = stage.world, physicsCfg: PhysicsCfg = {}) {
    let body = scene.physics!.world.CreateBody({ type: b2BodyType.b2_staticBody, position: { x: boxCfg.cx, y: boxCfg.cy } });
    let rb = new BoxBody(scene, body, boxCfg);
    let shape = new b2PolygonShape();
    shape.SetAsBox(rb.w / 2, rb.h / 2);
    rb.body.CreateFixture({ shape });
    rb.setPhysics(1, 0, 0);
    rb.updatePhysics(physicsCfg);
    return rb;
  }

  /**
   * Resize and re-center a BoxBody
   *
   * @param cx      The new X position
   * @param cy      The new Y position
   * @param width   The new width
   * @param height  The new height
   */
  public resize(cx: number, cy: number, width: number, height: number) {
    // Get the current fixture, so we can preserve sensor state,
    // density/elasticity/friction, and vertices when we make a new fixture
    let oldFix = this.body.GetFixtureList()!;
    // Compute the transform
    let transform = new b2Transform();
    transform.SetPositionAngle({ x: cx, y: cy }, this.body.GetAngle());

    // make a new box body
    this.radius = Math.sqrt(Math.pow(height / 2, 2) + Math.pow(width / 2, 2));
    let shape = new b2PolygonShape();
    shape.SetAsBox(width / 2, height / 2);
    this.body.CreateFixture({ shape });

    // Update dimensions
    this.w = width;
    this.h = height;

    // Copy the old fixture's DEF and collision status to the new fixture before
    // destroying it
    this.setPhysics(oldFix.GetDensity(), oldFix.GetRestitution(), oldFix.GetFriction());
    if (oldFix.IsSensor()) this?.setCollisionsEnabled(false);
    this.body.DestroyFixture(oldFix)
    this.body.SetTransform(transform);
  }
};

/** A rigid body whose underlying shape is a convex polygon */
export class PolygonBody extends RigidBodyBase {
  /** Vertices */
  public vertArray: b2Vec2[] = [];
  /** Width of the bounding box of the polygon */
  public w: number;
  /** Height of the bounding box of the polygon */
  public h: number;

  /**
   * Construct a PolygonBody
   *
   * @param scene       The scene where the body should be created
   * @param body        The underlying Box2D body
   * @param polyCfg     Shape information for the polygon
   * @param radius      The length of the circumscribing radius
   * @param physicsCfg  Optional physics configuration
   */
  private constructor(scene: Scene, body: b2Body, polyCfg: { cx: number, cy: number, vertices: number[], }, radius: number) {
    super(scene, body, radius)
    // Transform the vertices into Box2D points, and also compute the polygon's
    // maximum x and y distances, for computing the culling dimensions
    let absMaxX = 0, absMaxY = 0;
    for (let i = 0; i < polyCfg.vertices.length; i += 2) {
      this.vertArray[i / 2] = new b2Vec2(polyCfg.vertices[i], polyCfg.vertices[i + 1]);
      absMaxX = Math.max(absMaxX, Math.abs(this.vertArray[i / 2].x))
      absMaxY = Math.max(absMaxY, Math.abs(this.vertArray[i / 2].y))
    }
    this.w = 2 * absMaxX;
    this.h = 2 * absMaxY;
  }

  /**
   * Construct a PolygonBody
   *
   *
   * @param polygonCfg                    The basic shape configuration for the
   *                                      polygon
   * @param polygonCfg.cx                 X coordinate of the center of the
   *                                      polygon
   * @param polygonCfg.cy                 Y coordinate of the center of the
   *                                      polygon
   * @param polygonCfg.vertices           Vertices of the polygon, as a stream
   *                                      of alternating x and y values that are
   *                                      offsets relative to (cx, cy)
   * @param scene                         The scene (world or hud) where this
   *                                      polygon should be created
   * @param physicsCfg                    A set of configuration options that
   *                                      can be applied while creating the
   *                                      polygon
   * @param physicsCfg.density            The density of the body
   * @param physicsCfg.elasticity         The elasticity of the body
   * @param physicsCfg.friction           The friction of the body
   * @param physicsCfg.disableRotation    Should rotation be disabled?
   * @param physicsCfg.collisionsEnabled  Do collisions happen, or do other
   *                                      bodies glide through this?
   * @param physicsCfg.stickySides        Which sides of the body are sticky, if
   *                                      any?
   * @param physicsCfg.stickyDelay        Delay after something stops sticking,
   *                                      before it can stick again
   * @param physicsCfg.singleRigidSide    Are collisions only valid from one
   *                                      direction?
   * @param physicsCfg.passThroughId      Entities with a matching nonzero Id
   *                                      don't collide with each other
   * @param physicsCfg.rotationSpeed      The speed at which to rotate, in
   *                                      rotations per second
   * @param physicsCfg.dynamic            Should the body be forced to be
   *                                      dynamic?
   *
   * @returns A rigid body with a Polygon shape
   */
  public static Polygon(polygonCfg: { cx: number, cy: number, vertices: number[] }, scene: Scene = stage.world, physicsCfg: PhysicsCfg = {}) {
    let body = scene.physics!.world.CreateBody({ type: b2BodyType.b2_staticBody, position: { x: polygonCfg.cx, y: polygonCfg.cy } });
    // Compute the radius of the circumscribing circle
    let r = 0;
    for (let i = 0; i < polygonCfg.vertices.length; i += 2)
      r = Math.max(r, Math.pow(polygonCfg.vertices[i], 2), + Math.pow(polygonCfg.vertices[i + 1], 2));
    let rb = new PolygonBody(scene, body, polygonCfg, Math.sqrt(r));
    let shape = new b2PolygonShape();
    shape.Set(rb.vertArray);
    rb.body.CreateFixture({ shape });
    rb.setPhysics(1, 0, 0);
    rb.updatePhysics(physicsCfg);
    return rb;
  }

  /**
   * Resize and re-center a PolygonBody
   *
   * @param cx      The new X position
   * @param cy      The new Y position
   * @param width   The new width
   * @param height  The new height
   */
  public resize(cx: number, cy: number, width: number, height: number) {
    // Get the current fixture, so we can preserve sensor state,
    // density/elasticity/friction, and vertices when we make a new fixture
    let oldFix = this.body.GetFixtureList()!;
    // Compute the transform
    let transform = new b2Transform();
    transform.SetPositionAngle({ x: cx, y: cy }, this.body.GetAngle());

    // we need to manually scale all the vertices, based on the old verts
    let xScale = height / this.h;
    let yScale = width / this.w;
    let ps = oldFix.GetShape() as b2PolygonShape;
    let vertices: number[] = [];
    for (let i = 0; i < ps.m_vertices.length; ++i) {
      let mTempVector = ps.m_vertices[i];
      vertices.push(mTempVector.x * xScale);
      vertices.push(mTempVector.y * yScale);
    }
    let vertArray: b2Vec2[] = [];
    for (let i = 0; i < vertices.length; i += 2)
      vertArray[i / 2] = new b2Vec2(vertices[i], vertices[i + 1]);
    this.vertArray = vertArray;
    // Also re-compute the bounding radius
    let r = 0;
    for (let i = 0; i < vertices.length; i += 2)
      r = Math.max(r, Math.pow(vertices[i], 2), + Math.pow(vertices[i + 1], 2));
    this.radius = r;
    let shape = new b2PolygonShape();
    shape.Set(vertArray);
    this.body.CreateFixture({ shape });

    // Update new dimensions
    this.w = width;
    this.h = height;

    // Copy the old fixture's DEF and collision status to the new fixture before
    // destroying it
    this.setPhysics(oldFix.GetDensity(), oldFix.GetRestitution(), oldFix.GetFriction());
    if (oldFix.IsSensor()) this?.setCollisionsEnabled(false);
    this.body.DestroyFixture(oldFix);
    this.body.SetTransform(transform);
  }
};

/**
 * RigidBodyComponent is the type of any circle/box/polygon rigid body in JetLag
 */
export type RigidBodyComponent = CircleBody | BoxBody | PolygonBody;