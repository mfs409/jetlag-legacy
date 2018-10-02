import { Scene } from "./Scene"
import { WorldActor } from "../renderables/WorldActor"
import { ProjectilePool } from "../misc/ProjectilePool"
import { JetLagManager } from "../JetLagManager"
import { Hero } from "../renderables/Hero"
import { Enemy } from "../renderables/Enemy"
import { Projectile } from "../renderables/Projectile"
import { Renderer } from "../device/Renderer"
import { XY } from "../misc/XY"

/**
 * WorldScene manages everything related to the core gameplay of a level.  It
 * provides all of the interesting types of actors that JetLag supports, as well
 * as support for tilt and music.
 */
export class WorldScene extends Scene {
    /** All actors whose behavior should change due to tilt */
    readonly tiltActors: WorldActor[] = [];

    /** Magnitude of the maximum gravity the accelerometer can create */
    tiltMax = { x: 0, y: 0 };

    /** Track if we have an override for gravity to be translated into velocity */
    tiltVelocityOverride = false;

    /** A multiplier to make gravity change faster or slower than the accelerometer default */
    private tiltMultiplier: number = 1;

    /** This is the WorldActor that the camera chases, if any */
    cameraChaseActor: WorldActor = null;

    /** The music, if any */
    music: Howl = null;

    /** Whether the music is playing or not */
    private musicPlaying = false;

    /** A temp vector, to avoid allocation in the tilt code */
    private tiltVec = new XY(0, 0);

    /** A pool of projectiles for use by the hero */
    projectilePool: ProjectilePool;

    /**
     * Construct a World for the current level.  The World will have a camera,
     * a physics simulator, actors who exist within that physics simulator, and
     * the supporting infrastructure to make it all work.
     *
     * @param manager: The game-wide Jetlag manager
     */
    constructor(manager: JetLagManager) {
        super(manager);
        this.configureCollisionHandlers();
    }

    /**
     * The main render loop calls this to determine what to do when there is a
     * phone tilt
     */
    public handleTilt(x: number, y: number) {
        if (this.tiltMax == null)
            return;

        // store the accelerometer forces we measure
        let gravity = { x: x, y: y };

        // Apply the gravity multiplier
        gravity.x *= this.tiltMultiplier;
        gravity.y *= this.tiltMultiplier;

        // ensure x is within the -GravityMax.x : GravityMax.x range
        gravity.x = (gravity.x > this.tiltMax.x) ? this.tiltMax.x : gravity.x;
        gravity.x = (gravity.x < -this.tiltMax.x) ? -this.tiltMax.x : gravity.x;

        // ensure y is within the -GravityMax.y : GravityMax.y range
        gravity.y = (gravity.y > this.tiltMax.y) ? this.tiltMax.y : gravity.y;
        gravity.y = (gravity.y < -this.tiltMax.y) ? -this.tiltMax.y : gravity.y;

        // If we're in 'velocity' mode, apply the accelerometer reading to each
        // actor as a fixed velocity
        if (this.tiltVelocityOverride) {
            // if X is clipped to zero, set each actor's Y velocity, leave X
            // unchanged
            if (this.tiltMax.x == 0) {
                for (let gfo of this.tiltActors)
                    if (gfo.body.IsActive())
                        gfo.updateVelocity(gfo.body.GetLinearVelocity().x, gravity.y);
            }
            // if Y is clipped to zero, set each actor's X velocity, leave Y
            // unchanged
            else if (this.tiltMax.y == 0) {
                for (let gfo of this.tiltActors)
                    if (gfo.body.IsActive())
                        gfo.updateVelocity(gravity.x, gfo.body.GetLinearVelocity().y);
            }
            // otherwise we set X and Y velocity
            else {
                for (let gfo of this.tiltActors)
                    if (gfo.body.IsActive())
                        gfo.updateVelocity(gravity.x, gravity.y);
            }
        }
        // when not in velocity mode, apply the accelerometer reading to each
        // actor as a force
        else {
            this.tiltVec.Set(gravity.x, gravity.y);
            for (let gfo of this.tiltActors) {
                if (gfo.body.IsActive()) {
                    gfo.body.ApplyForceToCenter(this.tiltVec);
                }
            }
        }
    }

    /** Configure physics for the current level */
    private configureCollisionHandlers() {
        // set up the collision handlers
        this.world.SetContactListener(new (class myContactListener extends PhysicsType2d.Dynamics.ContactListener {
            scene: WorldScene;
            constructor(scene: WorldScene) {
                super();
                this.scene = scene;
            }

            /**
             * When two bodies start to collide, we can use this to forward to our onCollide methods
             *
             * @param contact A description of the contact event
             */
            public BeginContact(contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
                // Get the bodies, make sure both are actors
                let a = contact.GetFixtureA().GetBody().GetUserData(); //any type
                let b = contact.GetFixtureB().GetBody().GetUserData(); //any type
                if (!(a instanceof WorldActor) || !(b instanceof WorldActor)) {
                    return;
                }

                // the order is Hero, Enemy, Goodie, Projectile, Obstacle, Destination
                //
                // Of those, Hero, Enemy, and Projectile are the only ones with
                // a non-empty onCollide
                let c0: WorldActor;
                let c1: WorldActor;
                if (a instanceof Hero) {
                    c0 = a as WorldActor;
                    c1 = b as WorldActor;
                } else if (b instanceof Hero) {
                    c0 = b as WorldActor;
                    c1 = a as WorldActor;
                } else if (a instanceof Enemy) {
                    c0 = a as WorldActor;
                    c1 = b as WorldActor;
                } else if (b instanceof Enemy) {
                    c0 = b as WorldActor;
                    c1 = a as WorldActor;
                } else if (a instanceof Projectile) {
                    c0 = a as WorldActor;
                    c1 = b as WorldActor;
                } else if (b instanceof Projectile) {
                    c0 = b as WorldActor;
                    c1 = a as WorldActor;
                } else {
                    return;
                }

                // Schedule an event to run as soon as the physics world finishes its step.
                //
                // NB: this is called from render, while world is updating.  We can't modify the
                // world or its actors until the update finishes, so we have to schedule
                // collision-based updates to run after the world update.
                this.scene.oneTimeEvents.push(() => {
                    c0.onCollide(c1, contact);
                });
            }

            /**
             * We ignore endcontact
             *
             * @param contact A description of the contact event
             */
            public EndContact(contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
            }

            /**
             * Presolve is a hook for disabling certain collisions. We use it
             * for collision immunity, sticky obstacles, and one-way walls
             *
             * @param contact A description of the contact event
             * @param oldManifold The manifold from the previous world step
             */
            public PreSolve(contact: PhysicsType2d.Dynamics.Contacts.Contact, oldManifold: PhysicsType2d.Collision.Manifold): void {
                // get the bodies, make sure both are actors
                let a = contact.GetFixtureA().GetBody().GetUserData();
                let b = contact.GetFixtureB().GetBody().GetUserData();
                if (!(a instanceof WorldActor) || !(b instanceof WorldActor))
                    return;
                let gfoA = a as WorldActor;
                let gfoB = b as WorldActor;

                // is either one-sided?
                let oneSided: WorldActor = null;
                let other: WorldActor = null;
                if (gfoA.mIsOneSided > -1) {
                    oneSided = gfoA;
                    other = gfoB;
                } else if (gfoB.mIsOneSided > -1) {
                    oneSided = gfoB;
                    other = gfoA;
                }
                if (oneSided != null && other != null && !oneSided.mDJoint && !other.mDJoint) {
                    // if we're here, see if we should be disabling a one-sided obstacle collision
                    let worldManiFold = contact.GetWorldManifold();
                    let numPoints = worldManiFold.points.length;
                    for (let i = 0; i < numPoints; i++) {
                        let xy = other.body.GetLinearVelocityFromWorldPoint(worldManiFold.points[i]);
                        // disable based on the value of isOneSided and the vector between the actors
                        if (oneSided.mIsOneSided == 0 && xy.y < 0) {
                            contact.SetEnabled(false);
                        }
                        else if (oneSided.mIsOneSided == 2 && xy.y > 0) {
                            contact.SetEnabled(false);
                        }
                        else if (oneSided.mIsOneSided == 1 && xy.x > 0) {
                            contact.SetEnabled(false);
                        }
                        else if (oneSided.mIsOneSided == 3 && xy.x < 0) {
                            contact.SetEnabled(false);
                        }
                    }
                }

                // handle sticky obstacles... only do something if at least one actor is a sticky actor
                if (gfoA.mIsSticky[0] || gfoA.mIsSticky[1] || gfoA.mIsSticky[2] || gfoA.mIsSticky[3]) {
                    this.scene.handleSticky(gfoA, gfoB, contact);
                    return;
                } else if (gfoB.mIsSticky[0] || gfoB.mIsSticky[1] || gfoB.mIsSticky[2] || gfoB.mIsSticky[3]) {
                    this.scene.handleSticky(gfoB, gfoA, contact);
                    return;
                }

                // if the actors have the same passthrough ID, and it's not zero, then disable the
                // contact
                if (gfoA.mPassThroughId != 0 && gfoA.mPassThroughId == gfoB.mPassThroughId) {
                    contact.SetEnabled(false);
                    return;
                }
            }

            /**
             * We ignore postsolve
             *
             * @param contact A description of the contact event
             * @param impulse The impulse of the contact
             */
            public PostSolve(contact: PhysicsType2d.Dynamics.Contacts.Contact, impulse: PhysicsType2d.Dynamics.ContactImpulse): void {
            }
        })(this));
    }

    /** If the level has music attached to it, this starts playing it */
    playMusic(): void {
        if (!this.musicPlaying && this.music) {
            this.musicPlaying = true;
            this.music.play();
        }
    }

    /** If the level has music attached to it, this pauses it */
    pauseMusic(): void {
        if (this.musicPlaying) {
            this.musicPlaying = false;
            this.music.stop();
        }
    }

    /** If the level has music attached to it, this stops it */
    stopMusic(): void {
        if (this.musicPlaying) {
            this.musicPlaying = false;
            this.music.stop();
        }
    }

    /**
     * If the world's camera is supposed to follow an actor, this code will 
     * figure out the point on which the camera should center, and will request
     * that the camera center on that point.
     * 
     * NB: The camera may decide not to center on that point, depending on zoom
     *     and camera bounds.
     */
    adjustCamera() {
        if (!this.cameraChaseActor)
            return;

        // figure out the actor's position + the offset
        let a = this.cameraChaseActor;
        let x = a.body.GetWorldCenter().x + a.mCameraOffset.x;
        let y = a.body.GetWorldCenter().y + a.mCameraOffset.y;

        // request that the camera center on that point
        this.camera.setCenter(x, y);
    }

    /** Draw the actors in this world */
    render(renderer: Renderer, elapsedMillis: number): boolean {
        this.timer.advance(elapsedMillis);
        for (let zA of this.renderables) {
            for (let r of zA) {
                r.render(renderer, this.camera, elapsedMillis);
            }
        }
        return true;
    }

    /**
     * When a hero collides with a "sticky" obstacle, this figures out what to do
     *
     * @param sticky  The sticky actor... it should always be an obstacle for now
     * @param other   The other actor... it should always be a hero for now
     * @param contact A description of the contact event
     */
    private handleSticky(sticky: WorldActor, other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact) {
        // don't create a joint if we've already got one
        if (other.mDJoint != null)
            return;
        // don't create a joint if we're supposed to wait
        if (window.performance.now() < other.mStickyDelay)
            return;
        // handle sticky obstacles... only do something if we're hitting the
        // obstacle from the correct direction
        if ((sticky.mIsSticky[0] && other.getYPosition() >= sticky.getYPosition() + sticky.size.y)
            || (sticky.mIsSticky[1] && other.getXPosition() + other.size.x <= sticky.getXPosition())
            || (sticky.mIsSticky[3] && other.getXPosition() >= sticky.getXPosition() + sticky.size.x)
            || (sticky.mIsSticky[2] && other.getYPosition() + other.size.y <= sticky.getYPosition())) {
            // create distance and weld joints... somehow, the combination is needed to get this to
            // work. Note that this function runs during the box2d step, so we need to make the
            // joint in a callback that runs later
            let v = contact.GetWorldManifold().points[0];
            this.oneTimeEvents.push(() => {
                other.body.SetLinearVelocity(new XY(0, 0));
                let d = new PhysicsType2d.Dynamics.Joints.DistanceJointDefinition();
                d.Initialize(sticky.body, other.body, v, v);
                d.collideConnected = true;
                other.mDJoint = this.world.CreateJoint(d) as PhysicsType2d.Dynamics.Joints.DistanceJoint;
                let w = new PhysicsType2d.Dynamics.Joints.WeldJointDefinition();
                w.Initialize(sticky.body, other.body, v);
                w.collideConnected = true;
                other.mWJoint = this.world.CreateJoint(w) as PhysicsType2d.Dynamics.Joints.WeldJoint;
            });
        }
    }
}