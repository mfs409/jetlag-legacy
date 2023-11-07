// Last review: 08-11-2023

import { b2AABB, b2Contact, b2ContactImpulse, b2ContactListener, b2DistanceJoint, b2DistanceJointDef, b2Fixture, b2Manifold, b2Vec2, b2World, b2WorldManifold } from "@box2d/core";
import { Actor } from "../Entities/Actor";
import { Scene } from "../Entities/Scene";
import { CameraSystem } from "../Systems/Camera";

/**
 * PointToActorCallback queries the world to find the actor at a given
 * coordinate
 */
class PointToActorCallback {
  /** If we found an actor, we'll put it here */
  foundEntities: Actor[] = [];

  /** A helper vector for tracking the location that is being queried */
  private readonly touchVector = new b2Vec2(0, 0);

  /** The tolerance (in meters) when looking in a region around a point */
  private readonly tolerance = 0.1;

  /** The bounding box around the point that is being tested */
  private readonly aabb = new b2AABB();

  /**
   * When query() finds a rigidBody, we may not want to return it.  This makes a
   * more refined decision by seeing if the found body is Active
   *
   * @param fixture The fixture that was found, and which needs to be tested
   *
   * @returns True if the fixture isn't satisfactory, and the search should
   *          continue
   */
  private checkIfActive(fixture: b2Fixture) {
    // Make sure the fixture's Entity is active
    let b = fixture.GetBody().GetUserData() as Actor;
    if (!b.enabled) return true;
    // It's active, so save the Entity
    this.foundEntities.push(b);
    return true;
  }

  /**
   * See if there is an Entity at point (x, y)
   *
   * @param pt    The point that is being checked
   * @param world The world in which the check is happening
   */
  query(pt: { x: number, y: number }, world: b2World) {
    this.foundEntities.length = 0;
    this.touchVector.Set(pt.x, pt.y);
    this.aabb.lowerBound.Set(pt.x - this.tolerance, pt.y - this.tolerance);
    this.aabb.upperBound.Set(pt.x + this.tolerance, pt.y + this.tolerance);
    world.QueryAABB(this.aabb, (fix: b2Fixture) => this.checkIfActive(fix));
  }
}

/**
 * BasicCollisionSystem is a physics system that is suitable for the HUD and
 * overlays.  It lacks a few complex/expensive features that might be desired in
 * a playable level of a game.
 */
export class BasicCollisionSystem {
  /** The physics world in which all actors interact */
  public readonly world: b2World;

  /** For querying the point that was touched */
  protected readonly pointQuerier = new PointToActorCallback();

  /** Create a world with no default gravitational forces */
  constructor() {
    this.world = b2World.Create(new b2Vec2(0, 0));
  }

  /**
   * Query to find the actors at a screen coordinate
   *
   * @param screenX The X coordinate to look up
   * @param screenY The Y coordinate to look up
   */
  public actorsAt(camera: CameraSystem, screenX: number, screenY: number) {
    this.pointQuerier.query(camera.screenToMeters(screenX, screenY), this.world);
    return this.pointQuerier.foundEntities;
  }
}

/**
 * AdvancedCollisionSystem is a physics system that provides the ability to run
 * code in response to collisions.
 */
export class AdvancedCollisionSystem extends BasicCollisionSystem {
  /** Create an AdvancedCollisionSystem */
  constructor(scene: Scene) {
    super();
    this.configureCollisionHandlers(scene);
  }

  /** Configure collision handling for the current level */
  private configureCollisionHandlers(scene: Scene) {
    this.world.SetContactListener(
      new (class myContactListener extends b2ContactListener {
        /** 
         * Create a contact listener by saving the scene and collision system
         */
        constructor(private scene: Scene, private collisionSystem: AdvancedCollisionSystem) { super(); }

        /**
         * Figure out what to do when two bodies start to collide
         *
         * @param contact A description of the contact event
         */
        public BeginContact(contact: b2Contact) {
          // Get the bodies, make sure both are actors
          let a = contact.GetFixtureA().GetBody().GetUserData();
          let b = contact.GetFixtureB().GetBody().GetUserData();
          if (!(a instanceof Actor) || !(b instanceof Actor)) return;

          // The world is in mid-render, so we can't really change anything, so
          // defer handling the event until after the next render.
          this.scene.timer.oneTimeEvents.push(() => {
            // NB: if `a` handles the collision, don't ask `b` to handle it
            if (!a.role?.onCollide(b, contact)) b.role?.onCollide(a, contact);
          });
        }

        /**
         * Figure out what to do when two bodies stop being in contact with each
         * other
         *
         * @param contact A description of the contact event
         */
        public EndContact(_contact: b2Contact) {
          // NB: For now, we don't do anything here
        }

        /**
         * Before handling a collision, PreSolve runs.  We can use it to disable
         * certain contacts
         *
         * @param contact     A description of the contact event
         * @param oldManifold The manifold from the previous world step
         */
        public PreSolve(contact: b2Contact, _oldManifold: b2Manifold) {
          // get the bodies, make sure both are actors
          let a = contact.GetFixtureA().GetBody().GetUserData();
          let b = contact.GetFixtureB().GetBody().GetUserData();
          if (!(a instanceof Actor) || !(b instanceof Actor) || !a.rigidBody || !b.rigidBody) return;
          let ap = a.rigidBody.props, bp = b.rigidBody.props;

          // is either one-sided?
          let oneSided: Actor | undefined = undefined;
          let other: Actor | undefined = undefined;
          if (ap.bottomRigidOnly || ap.topRigidOnly || ap.leftRigidOnly || ap.rightRigidOnly) {
            oneSided = a; other = b;
          } else if (bp.bottomRigidOnly || bp.topRigidOnly || bp.leftRigidOnly || bp.rightRigidOnly) {
            oneSided = b; other = a;
          }
          // Should we disable a one-sided collision?
          if (oneSided && other && !oneSided.rigidBody!.distJoint && !other.rigidBody!.distJoint) {
            let worldManiFold = new b2WorldManifold();
            contact.GetWorldManifold(worldManiFold);
            let numPoints = worldManiFold.points.length;
            for (let i = 0; i < numPoints; i++) {
              let xy = new b2Vec2(0, 0);
              other.rigidBody?.body.GetLinearVelocityFromWorldPoint(worldManiFold.points[i], xy);
              // disable based on the value of isOneSided and the vector between
              // the entities
              if (oneSided.rigidBody!.props.topRigidOnly && xy.y < 0) contact.SetEnabled(false);
              else if (oneSided.rigidBody!.props.leftRigidOnly && xy.y > 0) contact.SetEnabled(false);
              else if (oneSided.rigidBody!.props.rightRigidOnly && xy.x > 0) contact.SetEnabled(false);
              else if (oneSided.rigidBody!.props.bottomRigidOnly && xy.x < 0) contact.SetEnabled(false);
            }
            return;
          }

          // If at least one entity is sticky, then see about making them stick
          if (ap.bottomSticky || ap.topSticky || ap.leftSticky || ap.rightSticky) {
            this.collisionSystem.handleSticky(a, b, contact);
            return;
          } else if (bp.bottomSticky || bp.topSticky || bp.leftSticky || bp.rightSticky) {
            this.collisionSystem.handleSticky(b, a, contact);
            return;
          }

          // if the entities have the same passthrough ID, and it's not
          // zero, then disable the contact
          if (ap.passThroughId && ap.passThroughId == bp.passThroughId) {
            contact.SetEnabled(false);
            return;
          }

          // if the entities have a special exemption to keep them from
          // interacting, then disable the contact
          let exA = a.role?.collisionRules;
          let exB = b.role?.collisionRules;
          if (exA && exB) {
            for (let a of exA.ignore)
              for (let b of exB.role)
                if (a == b) {
                  contact.SetEnabled(false);
                  return;
                }
            for (let b of exB.ignore)
              for (let a of exA.role)
                if (b == a) {
                  contact.SetEnabled(false);
                  return;
                }
          }
          // If we get here, it's a real collision
        }

        /**
         * This runs after handling the collision.  Right now we don't use it.
         *
         * @param contact A description of the contact event
         * @param impulse The impulse of the contact
         */
        public PostSolve(_contact: b2Contact, _impulse: b2ContactImpulse) { }
      })(scene, this)
    );
  }

  /**
   * When an actor collides with a "sticky" actor, this figures out what to do
   *
   * @param sticky  The sticky actor 
   * @param other   The other actor
   * @param contact A description of the contact event
   */
  private handleSticky(sticky: Actor, other: Actor, contact: b2Contact) {
    // don't create a joint if we've already got one
    if (other.rigidBody?.distJoint) return;
    // don't create a joint if we're supposed to wait
    if (window.performance.now() < (other.rigidBody?.props.stickyDelay ?? 0)) return;
    // only do something if we're hitting the actor from the correct direction
    let sBody = sticky.rigidBody!;
    let oBody = other.rigidBody!;
    let oy = oBody.getCenter().y, ox = oBody.getCenter().x, ow = oBody.props.w, oh = oBody.props.h;
    let sy = sBody.getCenter().y, sx = sBody.getCenter().x, sw = sBody.props.w, sh = sBody.props.h;
    if ((sBody.props.topSticky && ((oy + oh / 2) <= (sy - sh / 2))) ||
      (sBody.props.bottomSticky && ((oy - oh / 2) >= (sy + sh / 2))) ||
      (sBody.props.rightSticky && ((ox - ow / 2) >= (sx + sw / 2))) ||
      (sBody.props.leftSticky && ((ox + ow / 2) <= (sx - sw / 2)))) {
      // create a distance joint. Note that we need to make the joint in a
      // callback that runs later
      let m = new b2WorldManifold();
      contact.GetWorldManifold(m);
      let v = m.points[0];
      sticky.scene.timer.oneTimeEvents.push(() => {
        let sb = sticky.rigidBody?.body;
        let ob = other.rigidBody?.body;
        if (!sb || !ob) return;
        ob?.SetLinearVelocity(new b2Vec2(0, 0));
        let d = new b2DistanceJointDef();
        d.Initialize(sb, ob, v, v);
        d.collideConnected = true;
        other.rigidBody!.distJoint = this.world.CreateJoint(d) as b2DistanceJoint;
      });
    }
  }
}