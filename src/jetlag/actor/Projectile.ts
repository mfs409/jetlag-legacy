import { WorldActor as WorldActor } from "./World"
import { Obstacle } from "./Obstacle"
import { Camera } from "../support/Camera"
import { JetLagRenderer } from "../support/Interfaces";
import { XY } from "../support/XY";
import { JetLagStage } from "../JetLagStage";

/**
 * Projectiles are actors that can be thrown from the hero's location in order to remove enemies.
 */
export class Projectile extends WorldActor {
    /** This is the initial point of the throw */
    readonly rangeFrom = new XY(0, 0);

    /** 
     * We have to be careful in side-scrolling games, or else projectiles can
     * continue traveling off-screen forever. This field lets us cap the
     * distance away from the hero that a projectile can travel before we make
     * it disappear.
     */
    range: number;

    /**
     * When projectiles collide, and they are not sensors, one will disappear.
     * We can keep both on screen by setting this false
     */
    disappearOnCollide: boolean;

    /** How much damage does this projectile do? */
    damage: number;

    /**
     * Create a projectile, and give it a physics body
     *
     * @param width    width of the projectile
     * @param height   height of the projectile
     * @param imgName  Name of the image file to use for this projectile
     * @param x        initial x position of the projectile
     * @param y        initial y position of the projectile
     * @param zIndex   The z plane of the projectile
     * @param isCircle True if it is a circle, false if it is a box
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string, x: number, y: number, zIndex: number, isCircle: boolean) {
        super(stage, imgName, width, height);
        if (isCircle) {
            let radius = Math.max(width, height);
            this.setCirclePhysics(PhysicsType2d.Dynamics.BodyType.DYNAMIC, x, y, radius / 2);
        } else {
            this.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.DYNAMIC, x, y);
        }
        this.setFastMoving(true);
        this.body.SetGravityScale(0);
        this.setCollisionsEnabled(false);
        this.disableRotation();
        this.stage.getWorld().addActor(this, zIndex);
        this.disappearOnCollide = true;
    }

    /**
     * Code to run when a Projectile collides with a WorldActor.
     *
     * The only collision where Projectile is dominant is a collision with an Obstacle or another
     * Projectile.  On most collisions, a projectile will disappear.
     *
     * @param other   Other object involved in this collision
     * @param contact A description of the contact that caused this collision
     */
    onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
        // if this is an obstacle, check if it is a projectile callback, and if so, do the callback
        if (other instanceof Obstacle) {
            let o: Obstacle = other as Obstacle;
            if (o.getProjectileCollisionCallback()) {
                o.getProjectileCollisionCallback()(o, this, contact);
                // return... don't remove the projectile
                return;
            }
        }
        if (other instanceof Projectile) {
            if (!this.disappearOnCollide)
                return;
        }
        // only disappear if other is not a sensor
        if (!other.getCollisionsEnabled()) {
            this.remove(false);
        }
    }

    /**
     * When drawing a projectile, we first check if it is too far from its starting point. We only
     * draw it if it is not.
     */
    public render(renderer: JetLagRenderer, camera: Camera, elapsedMillis: number): void {
        if (!this.body.IsActive())
            return;
        // eliminate the projectile quietly if it has traveled too far
        let dx = Math.abs(this.body.GetPosition().x - this.rangeFrom.x);
        let dy = Math.abs(this.body.GetPosition().y - this.rangeFrom.y);
        if (dx * dx + dy * dy > this.range * this.range) {
            this.remove(true);
            return;
        }
        super.render(renderer, camera, elapsedMillis);
    }

    public setGravityScale(val: number) {
        this.body.SetGravityScale(val);
    }
}