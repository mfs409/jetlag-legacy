// Last review: 08-11-2023

import { b2Body, b2BodyType, b2CircleShape, b2DistanceJoint, b2DistanceJointDef, b2PolygonShape, b2RevoluteJoint, b2RevoluteJointDef, b2Transform, b2Vec2, b2WeldJointDef } from "@box2d/core";
import { BoxCfgOpts, CircleCfgOpts, PolygonCfgOpts, AdvancedRigidBodyCfgOpts } from "../Config";
import { game } from "../Stage";
import { DebugSprite } from "../Services/ImageService";
import { Actor } from "../Entities/Actor";
import { StateEvent } from "./StateManager";
import { Scene } from "../Entities/Scene";

/**
 * AdvancedRigidBodyCfg checks and reifies an AdvancedRigidBodyCfgOpts object,
 * so it can be used to build a RigidBody
 */
class AdvancedRigidBodyCfg {
  /** When entities touch the top of this, do they stick? */
  topSticky: boolean;
  /** When entities touch the bottom of this, do they stick? */
  bottomSticky: boolean;
  /** When entities touch the left side of this, do they stick? */
  leftSticky: boolean;
  /** When entities touch the right side of this, do they stick? */
  rightSticky: boolean;
  /** 
   * When an entity *stops* sticking to this, how long before it can stick
   * again? 
   */
  stickyDelay?: number;
  /** Should rotation be disabled? */
  disableRotation: boolean;
  /** Is the top the only hard surface of this body */
  topRigidOnly: boolean;
  /** Is the bottom the only hard surface of this body */
  bottomRigidOnly: boolean;
  /** Is the left side the only hard surface of this body */
  leftRigidOnly: boolean;
  /** Is the right side the only hard surface of this body */
  rightRigidOnly: boolean;
  /** Entities with a matching nonzero Id don't collide with each other */
  passThroughId?: number;
  /** Speed at which to rotation, in rotations per second */
  rotationSpeed: number;
  /** Force the body to be dynamic? */
  dynamic: boolean;

  /**
   * Construct a common body configuration object from a packet of config
   * information
   */
  constructor(cfg: AdvancedRigidBodyCfgOpts) {
    this.topSticky = !!cfg.topSticky;
    this.bottomSticky = !!cfg.bottomSticky;
    this.leftSticky = !!cfg.leftSticky;
    this.rightSticky = !!cfg.rightSticky;
    this.stickyDelay = cfg.stickyDelay;
    this.topRigidOnly = !!cfg.topRigidOnly;
    this.bottomRigidOnly = !!cfg.bottomRigidOnly;
    this.leftRigidOnly = !!cfg.leftRigidOnly;
    this.rightRigidOnly = !!cfg.rightRigidOnly;
    this.passThroughId = cfg.passThroughId;
    this.rotationSpeed = cfg.rotationSpeed ?? 0;
    this.disableRotation = !!cfg.disableRotation;
    this.dynamic = !!cfg.dynamic;
  }
}

/**
 * BoxCfg checks and reifies the union of BoxCfgOpts and
 * AdvancedRigidBodyCfgOpts, making it easy to configure a RigidBody as a box.
 */
export class BoxCfg extends AdvancedRigidBodyCfg {
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
  /** Width of the box */
  w: number;
  /** Height of the box */
  h: number;

  /** Construct a Box configuration from a BoxCfgOpts */
  constructor(boxCfg: BoxCfgOpts, commonCfg: AdvancedRigidBodyCfgOpts) {
    super(commonCfg);
    this.cx = boxCfg.cx;
    this.cy = boxCfg.cy;
    this.w = boxCfg.width;
    this.h = boxCfg.height;
  }
}

/**
 * CircleCfg checks and reifies the union of CircleCfgOpts and
 * AdvancedRigidBodyCfgOpts, making it easy to configure a RigidBody as a
 * circle.
 */
export class CircleCfg extends AdvancedRigidBodyCfg {
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
  /** Radius */
  r: number;
  /** Width of the circle */
  w: number;
  /** Height of the circle */
  h: number;

  /** Construct a Circle configuration from a CircleCfgOpts */
  constructor(circleCfg: CircleCfgOpts, commonCfg: AdvancedRigidBodyCfgOpts) {
    super(commonCfg);
    this.cx = circleCfg.cx;
    this.cy = circleCfg.cy;
    this.w = 2 * circleCfg.radius;
    this.h = 2 * circleCfg.radius;
    this.r = circleCfg.radius;
  }
}

/**
 * PolygonCfg checks and reifies the union of PolygonCfgOpts and
 * AdvancedRigidBodyCfgOpts, making it easy to configure a RigidBody as a
 * polygon.
 */
export class PolygonCfg extends AdvancedRigidBodyCfg {
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
  /** Vertices */
  public vertArray: b2Vec2[] = []; // TODO: is this really needed?
  // TODO: Why does a polygon have width and height?
  /** Width of the polygon */
  w: number;
  /** Height of the polygon */
  h: number;

  /** Construct a Polygon configuration from a PolygonCfgOpts */
  constructor(polyCfg: PolygonCfgOpts, commonCfg: AdvancedRigidBodyCfgOpts) {
    super(commonCfg);
    this.cx = polyCfg.cx;
    this.cy = polyCfg.cy;
    for (let i = 0; i < polyCfg.vertices.length; i += 2)
      this.vertArray[i / 2] = new b2Vec2(polyCfg.vertices[i], polyCfg.vertices[i + 1]);
    this.w = polyCfg.width;
    this.h = polyCfg.height;
  }
}

/** The different shape types that Box2D supports */
enum ShapeType { CIRCLE, BOX, POLYGON };

/**
 * All rigid bodies in a game will be of this type.  Internally, they can be
 * Boxes, Circles, or Polygons.
 */
export class RigidBodyComponent {
  /** The physics body */
  readonly body: b2Body;

  /** It's useful to have a debug context for drawing the "hit box" */
  readonly debug: DebugSprite;

  /** A definition for when we attach a revolute joint to this entity */
  revJointDef?: b2RevoluteJointDef;

  /** A joint that allows this entity to revolve around another */
  revJoint?: b2RevoluteJoint;

  /**
   * Sometimes an entity collides with another entity, and should stick to it. In
   * that case, we use this distance joint to make the entities stick together
   */
  public distJoint?: b2DistanceJoint;

  /**
   * Create a rigid body for an Entity
   *
   * @param scene     The physics world where this body exists
   * @param props     A description of the shape of this body
   * @param radius    The radius of a circumscribed circle, for culling
   * @param shapeType The shape type, for quick disambiguation
   */
  private constructor(protected scene: Scene, public props: BoxCfg | CircleCfg | PolygonCfg, readonly radius: number, private shapeType: ShapeType) {
    this.debug = game.imageLibrary.makeDebugContext();
    this.body = scene.physics!.world.CreateBody({ type: b2BodyType.b2_staticBody, position: { x: this.props.cx, y: this.props.cy } });
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
    this.revJoint = this.scene.physics!.world.CreateJoint(this.revJointDef);
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
      this.scene.physics!.world.DestroyJoint(this.revJoint);
      this.revJointDef!.enableMotor = true;
      this.revJointDef!.motorSpeed = motorSpeed;
      this.revJointDef!.maxMotorTorque = motorTorque;
    }
    this.revJoint = this.scene.physics!.world.CreateJoint(this.revJointDef!);
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
    this.scene.physics!.world.DestroyJoint(this.revJoint!);
    this.revJointDef!.upperAngle = upper;
    this.revJointDef!.lowerAngle = lower;
    this.revJointDef!.enableLimit = true;
    this.revJoint = this.scene.physics!.world.CreateJoint(this.revJointDef!);
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
    this.scene.physics!.world.CreateJoint(w);
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

    this.scene.physics!.world.CreateJoint(mDistJointDef);
  }

  /** Break any implicit joints connecting this entity */
  public breakJoints() {
    // Clobber any joints, or this won't be able to move
    if (this.distJoint) {
      this.scene.physics!.world.DestroyJoint(this.distJoint);
      this.distJoint = undefined;
    }
    // TODO: should we break weldJoints too?
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
   * @param entity    The entity to which this RigidBody is attached
   */
  public prerender(_elapsedMs: number, entity: Actor) {
    // Broadcast the left/right movement of this entity
    let v = this.body.GetLinearVelocity();
    if (v.x < 0) entity.state.changeState(entity, StateEvent.MOVE_L);
    else if (v.x > 0) entity.state.changeState(entity, StateEvent.MOVE_R);
    else entity.state.changeState(entity, StateEvent.MOVE_STOP);

    // Now adjust the image position based on the body position
    if (entity.appearance) {
      entity.appearance.props.cx = this.body.GetPosition().x;
      entity.appearance.props.cy = this.body.GetPosition().y;
      entity.appearance.props.rot = this.body.GetAngle();
    }
  }

  /**
   * Resize and move a RigidBody
   *
   * @param cx       The new X position
   * @param cy       The new Y position
   * @param width   The new width
   * @param height  The new height
   * @returns 
   */
  public resize(cx: number, cy: number, width: number, height: number) {
    // TODO: this code is losing the information about props, instead passing {}
    // to the constructors.  Can we avoid making new bodies, instead?

    // read old body information
    let oldBody = this.body;
    // The default is for all fixtures of a entity have the same sensor state
    let oldFix = oldBody.GetFixtureList()!;
    // make a new body
    let newBody: RigidBodyComponent;
    if (this.shapeType == ShapeType.CIRCLE) {
      newBody = RigidBodyComponent.Circle({ cx, cy, radius: width > height ? width / 2 : height / 2 }, this.scene);
    } else if (this.shapeType == ShapeType.BOX) {
      newBody = RigidBodyComponent.Box({ cx, cy, width, height }, this.scene);
    } else {
      // we need to manually scale all the vertices
      // TODO: this isn't tested
      let xScale = height / this.props!.h;
      let yScale = width / this.props!.w;
      let ps = oldFix.GetShape() as b2PolygonShape;
      let vertices: number[] = [];
      for (let i = 0; i < ps.m_vertices.length; ++i) {
        let mTempVector = ps.m_vertices[i];
        vertices.push(mTempVector.x * xScale);
        vertices.push(mTempVector.y * yScale);
      }
      newBody = RigidBodyComponent.Polygon({ cx, cy, width, height, vertices }, this.scene);
    }
    newBody.body.SetType(oldBody.GetType());
    // Update the user-visible physics values
    this.setPhysics(oldFix.GetDensity(), oldFix.GetRestitution(), oldFix.GetFriction());
    this.body.SetBullet(oldBody.IsBullet());
    // clone forces
    this.body.SetAngularVelocity(oldBody.GetAngularVelocity());
    let transform = new b2Transform();
    transform.SetPositionAngle(this.body.GetPosition(), oldBody.GetAngle());
    this.body.SetTransform(transform);
    this.body.SetGravityScale(oldBody.GetGravityScale());
    this.body.SetLinearDamping(oldBody.GetLinearDamping());
    this.body.SetLinearVelocity(oldBody.GetLinearVelocity());
    if (oldFix.IsSensor()) this?.setCollisionsEnabled(false);
    // disable the old body
    oldBody.SetEnabled(false);
    return newBody;
  }

  /** Report if this body is a circle */
  public isCircle() { return this.shapeType == ShapeType.CIRCLE; }

  /** Report if this body is a box */
  public isBox() { return this.shapeType == ShapeType.BOX; }

  /** Report if this body is a polygon */
  public isPolygon() { return this.shapeType == ShapeType.POLYGON; }

  /**
   * Construct a RigidBody as a Circle
   *
   * @param circleCfg The configuration of this CircleBody
   * @param scene     The world in which to create the body
   * @param commonCfg Additional configuration
   */
  public static Circle(circleCfg: CircleCfgOpts, scene: Scene, commonCfg: AdvancedRigidBodyCfgOpts = {}) {
    let rb = new RigidBodyComponent(scene, new CircleCfg(circleCfg, commonCfg), circleCfg.radius, ShapeType.CIRCLE);
    let shape = new b2CircleShape();
    shape.m_radius = circleCfg.radius;
    rb.body.CreateFixture({ shape });
    rb.setPhysics(commonCfg.density ?? 1, commonCfg.elasticity ?? 0, commonCfg.friction ?? 0);
    // TODO:  commonCfg.collisionsEnabled isn't useful, because the Role
    //        overrides it
    rb.setCollisionsEnabled(commonCfg.collisionsEnabled ?? true);
    rb.bless();
    return rb;
  }

  /**
   * Construct a RigidBody as a Box
   *
   * @param boxCfg    The configuration of this BoxBody
   * @param scene     The world in which to create the body
   * @param commonCfg Additional configuration
   */
  public static Box(boxCfg: BoxCfgOpts, scene: Scene, commonCfg: AdvancedRigidBodyCfgOpts = {}) {
    let rb = new RigidBodyComponent(scene, new BoxCfg(boxCfg, commonCfg), Math.sqrt(Math.pow(boxCfg.height / 2, 2) + Math.pow(boxCfg.width / 2, 2)), ShapeType.BOX);
    let shape = new b2PolygonShape();
    shape.SetAsBox(rb.props.w / 2, rb.props.h / 2);
    rb.body.CreateFixture({ shape });
    rb.setPhysics(commonCfg.density ?? 1, commonCfg.elasticity ?? 0, commonCfg.friction ?? 0);
    rb.setCollisionsEnabled(commonCfg.collisionsEnabled ?? true);
    rb.bless();
    return rb;
  }

  /**
   * Construct a PolygonBody
   *
   * @param polygonCfg  The configuration of this PolygonBody
   * @param scene       The world in which to create the body
   * @param commonCfg   Additional configuration
   */
  public static Polygon(polygonCfg: PolygonCfgOpts, scene: Scene, commonCfg: AdvancedRigidBodyCfgOpts = {}) {
    let r = 0;
    for (let i = 0; i < polygonCfg.vertices.length; i += 2)
      r = Math.pow(polygonCfg.vertices[i], 2), + Math.pow(polygonCfg.vertices[i + 1], 2);
    let rb = new RigidBodyComponent(scene, new PolygonCfg(polygonCfg, commonCfg), Math.sqrt(r), ShapeType.POLYGON);
    let shape = new b2PolygonShape();
    shape.Set((rb.props as PolygonCfg).vertArray);
    rb.body.CreateFixture({ shape });
    rb.bless();
    rb.setPhysics(commonCfg.density ?? 1, commonCfg.elasticity ?? 0, commonCfg.friction ?? 0);
    rb.setCollisionsEnabled(commonCfg.collisionsEnabled ?? true);
    return rb;
  }

  /** Apply common properties based on the AdvancedRigidBodyConfig */
  private bless() {
    if (this.props.rotationSpeed != 0) {
      // Make the entity continuously rotate
      if (this.body.GetType() == b2BodyType.b2_staticBody) this.body.SetType(b2BodyType.b2_kinematicBody);
      this.body.SetAngularVelocity(this.props.rotationSpeed * 2 * Math.PI);
    }
    if (this.props.disableRotation)
      this.body.SetFixedRotation(true);
    if (this.props.dynamic)
      this.body.SetType(b2BodyType.b2_dynamicBody);
  }

  /** Make the entity stop rotating */
  public clearRotation() {
    if (this.body.GetType() != b2BodyType.b2_staticBody)
      this.body.SetAngularVelocity(0);
  }

  /** Report the current velocity of this body */
  public getVelocity() {
    return this.body.GetLinearVelocity().Clone();
  }

  /** Change the velocity of this body */
  public setVelocity(v: b2Vec2) {
    return this.body.SetLinearVelocity(v);
  }
}