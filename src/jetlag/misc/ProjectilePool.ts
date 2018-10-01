import { WorldScene } from "../stage/WorldScene"
import { Projectile } from "../renderables/Projectile"
import { Hero } from "../renderables/Hero"
import { JetLagManager } from "../JetLagManager"

/**
* ProjectilePool stores a set of projectiles.  We can get into lots of
* trouble with Box2d if we make too many actors, so the projectile pool is a
* useful mechanism for re-using projectiles after they become defunct.
*/
export class ProjectilePool {
    /** A collection of all the available projectiles */
    readonly pool: Projectile[];

    /** The number of projectiles in the pool */
    private readonly poolSize: number;

    /** For limiting the number of projectiles that can be thrown */
    remaining: number;

    /** A dampening factor to apply to projectiles thrown via "directional" mechanism */
    directionalDamp: number;

    /** Indicates that projectiles should be sensors */
    sensor: boolean;

    /** Indicates that vector projectiles should have a fixed velocity */
    enableFixedVectorVelocity: boolean;

    /** The magnitude of the velocity for vector projectiles thrown with a fixed velocity */
    fixedVectorVelocity: number;

    /** Indicate that projectiles should face in the direction they are initially thrown */
    mRotateVectorThrow: boolean;

    /** Index of next available projectile in the pool */
    private nextIndex: number;

    /** Sound to play when projectiles are thrown */
    mThrowSound: Howl;

    /** The sound to play when a projectile disappears */
    mProjectileDisappearSound: Howl;

    /** For choosing random images for the projectiles */
    mRandomizeImages = false;

    /**
    * Create a pool of projectiles, and set the way they are thrown.
    *
    * @param game    The currently active game
    * @param size     number of projectiles that can be thrown at once
    * @param width    width of a projectile
    * @param height   height of a projectile
    * @param imgName  image to use for projectiles
    * @param strength specifies the amount of damage that a projectile does to an
    *                 enemy
    * @param zIndex   The z plane on which the projectiles should be drawn
    * @param isCircle Should projectiles have an underlying circle or box shape?
    */
    constructor(manager: JetLagManager, level: WorldScene, size: number, width: number, height: number,
        imgName: string, strength: number, zIndex: number, isCircle: boolean) {
        // set up the pool
        this.pool = [];
        // don't draw all projectiles in same place...
        for (let i = 0; i < size; ++i) {
            let p = new Projectile(manager, level, width, height, imgName, -100 - i * width, -100 - i * height, zIndex, isCircle);
            p.setEnabled(false);
            p.mBody.SetBullet(true);
            p.mBody.SetActive(false);
            p.mDamage = strength;
            this.pool.push(p);
        }
        this.nextIndex = 0;
        this.poolSize = size;
        // record vars that describe how the projectile behaves
        this.mThrowSound = null;
        this.mProjectileDisappearSound = null;
        this.remaining = -1;
        this.sensor = true;
    }

    /**
    * Throw a projectile. This is for throwing in a single, predetermined direction
    *
    * @param h         The hero who is performing the throw
    * @param offsetX   specifies the x distance between the top left of the
    *                  projectile and the top left of the hero throwing the
    *                  projectile
    * @param offsetY   specifies the y distance between the top left of the
    *                  projectile and the top left of the hero throwing the
    *                  projectile
    * @param velocityX The X velocity of the projectile when it is thrown
    * @param velocityY The Y velocity of the projectile when it is thrown
    */
    throwFixed(h: Hero, offsetX: number, offsetY: number, velocityX: number, velocityY: number): void {
        // have we reached our limit?
        if (this.remaining == 0)
            return;
        // do we need to decrease our limit?
        if (this.remaining != -1)
            this.remaining--;

        // is there an available projectile?
        if (this.pool[this.nextIndex].getEnabled())
            return;
        // get the next projectile, reset sensor, set image
        let b: Projectile = this.pool[this.nextIndex];
        this.nextIndex = (this.nextIndex + 1) % this.poolSize;
        b.setCollisionsEnabled(!this.sensor);
        b.mAnimator.resetCurrentAnimation();

        if (this.mRandomizeImages)
            b.mAnimator.updateIndex();

        // calculate offset for starting position of projectile, put it on screen
        b.mRangeFrom.x = h.getXPosition() + offsetX;
        b.mRangeFrom.y = h.getYPosition() + offsetY;
        b.mBody.SetActive(true);
        b.mBody.SetTransform(b.mRangeFrom, 0);

        // give the projectile velocity, show it, and play sound
        b.updateVelocity(velocityX, velocityY);
        b.setEnabled(true);
        if (this.mThrowSound)
            this.mThrowSound.play();
        b.mDisappearSound = this.mProjectileDisappearSound;
        h.doThrowAnimation();
    }

    /**
    * Throw a projectile. This is for throwing in the direction of a specified point
    *
    * @param heroX   x coordinate of the top left corner of the thrower
    * @param heroY   y coordinate of the top left corner of the thrower
    * @param toX     x coordinate of the point at which to throw
    * @param toY     y coordinate of the point at which to throw
    * @param h       The hero who is performing the throw
    * @param offsetX specifies the x distance between the top left of the
    *                projectile and the top left of the hero throwing the
    *                projectile
    * @param offsetY specifies the y distance between the top left of the
    *                projectile and the top left of the hero throwing the
    *                projectile
    */
    throwAt(heroX: number, heroY: number, toX: number, toY: number, h: Hero, offsetX: number, offsetY: number): void {
        // have we reached our limit?
        if (this.remaining == 0)
            return;
        // do we need to decrease our limit?
        if (this.remaining != -1)
            this.remaining--;

        // is there an available projectile?
        if (this.pool[this.nextIndex].getEnabled())
            return;
        // get the next projectile, set sensor, set image
        let b: Projectile = this.pool[this.nextIndex];
        this.nextIndex = (this.nextIndex + 1) % this.poolSize;
        b.setCollisionsEnabled(!this.sensor);
        b.mAnimator.resetCurrentAnimation();

        // calculate offset for starting position of projectile, put it on screen
        b.mRangeFrom.x = heroX + offsetX;
        b.mRangeFrom.y = heroY + offsetY;
        b.mBody.SetActive(true);
        b.mBody.SetTransform(b.mRangeFrom, 0);

        // give the projectile velocity
        if (this.enableFixedVectorVelocity) {
            // compute a unit vector
            let dX = toX - heroX - offsetX;
            let dY = toY - heroY - offsetY;
            let hypotenuse = Math.sqrt(dX * dX + dY * dY);
            let tmpX = dX / hypotenuse;
            let tmpY = dY / hypotenuse;
            // multiply by fixed velocity
            tmpX *= this.fixedVectorVelocity;
            tmpY *= this.fixedVectorVelocity;
            b.updateVelocity(tmpX, tmpY);
        } else {
            let dX = toX - heroX - offsetX;
            let dY = toY - heroY - offsetY;
            // compute absolute vector, multiply by dampening factor
            let tmpX = dX * this.directionalDamp;
            let tmpY = dY * this.directionalDamp;
            b.updateVelocity(tmpX, tmpY);
        }

        // rotate the projectile
        if (this.mRotateVectorThrow) {
            let angle = Math.atan2(toY - heroY - offsetY, toX - heroX - offsetX) - Math.atan2(-1, 0);
            b.mBody.SetTransform(b.mBody.GetPosition(), angle);
        }

        // show the projectile, play sound, and animate the hero
        b.setEnabled(true);
        if (this.mThrowSound)
            this.mThrowSound.play();
        b.mDisappearSound = this.mProjectileDisappearSound;
        h.doThrowAnimation();
    }
}