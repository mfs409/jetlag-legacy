import { Animation } from "../support/Animation";
import { Projectile } from "../actor/Projectile"
import { Hero } from "../actor/Hero"
import { JetLagSound } from "./Interfaces";
import { JetLagStage } from "../JetLagStage";

/**
* ProjectilePool stores a set of projectiles.  We can get into lots of
* trouble with Box2d if we make too many actors, so the projectile pool is a
* useful mechanism for re-using projectiles after they become defunct.
*/
export class ProjectilePool {
    /** A collection of all the available projectiles */
    private readonly pool: Projectile[];

    /** The number of projectiles in the pool */
    private readonly poolSize: number;

    /** For limiting the number of projectiles that can be thrown */
    private remaining: number;

    /** A dampening factor to apply to projectiles thrown via "directional" mechanism */
    private directionalDamp: number;

    /** Indicates that projectiles should be sensors */
    private sensor: boolean;

    /** Indicates that vector projectiles should have a fixed velocity */
    private enableFixedVectorVelocity: boolean;

    /** The magnitude of the velocity for vector projectiles thrown with a fixed velocity */
    private fixedVectorVelocity: number;

    /** Indicate that projectiles should face in the direction they are initially thrown */
    private rotateVectorThrow: boolean;

    /** Index of next available projectile in the pool */
    private nextIndex: number;

    /** Sound to play when projectiles are thrown */
    private throwSound: JetLagSound;

    /** The sound to play when a projectile disappears */
    private projectileDisappearSound: string;

    /** For choosing random images for the projectiles */
    private randomizeImages = false;

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
    constructor(private stage: JetLagStage, size: number, width: number, height: number, imgName: string, strength: number, zIndex: number, isCircle: boolean) {
        // set up the pool
        this.pool = [];
        // don't draw all projectiles in same place...
        for (let i = 0; i < size; ++i) {
            let p = new Projectile(stage, width, height, imgName, -100 - i * width, -100 - i * height, zIndex, isCircle);
            p.setEnabled(false);
            p.damage = strength;
            this.pool.push(p);
        }
        this.nextIndex = 0;
        this.poolSize = size;
        // record vars that describe how the projectile behaves
        this.throwSound = null;
        this.projectileDisappearSound = null;
        this.remaining = -1;
        this.sensor = true;
    }

    /** Return the number of projectiles remaining */
    public getRemaining() { return this.remaining; }

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
        b.getAnimator().resetCurrentAnimation();

        if (this.randomizeImages)
            b.getAnimator().switchToRandomIndex();

        // calculate offset for starting position of projectile, put it on screen
        b.rangeFrom.x = h.getXPosition() + offsetX;
        b.rangeFrom.y = h.getYPosition() + offsetY;
        b.getBody().SetTransform(b.rangeFrom, 0);

        // give the projectile velocity, show it, and play sound
        b.updateVelocity(velocityX, velocityY);
        b.setEnabled(true);
        if (this.throwSound)
            this.throwSound.play();
        b.setDisappearSound(this.projectileDisappearSound);
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
        b.getAnimator().resetCurrentAnimation();

        // calculate offset for starting position of projectile, put it on screen
        b.rangeFrom.x = heroX + offsetX;
        b.rangeFrom.y = heroY + offsetY;
        b.getBody().SetTransform(b.rangeFrom, 0);

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
        if (this.rotateVectorThrow) {
            let angle = Math.atan2(toY - heroY - offsetY, toX - heroX - offsetX) - Math.atan2(-1, 0);
            b.setRotation(angle);
        }

        // show the projectile, play sound, and animate the hero
        b.setEnabled(true);
        if (this.throwSound)
            this.throwSound.play();
        b.setDisappearSound(this.projectileDisappearSound);
        h.doThrowAnimation();
    }

    /**
     * Specify a limit on how far away from the Hero a projectile can go.  Without this, projectiles
     * could keep on traveling forever.
     *
     * @param distance Maximum distance from the hero that a projectile can travel
     */
    public setProjectileRange(distance: number): void {
        for (let p of this.pool)
            p.range = distance;
    }

    /**
     * Indicate that projectiles should feel the effects of gravity. Otherwise, they will be (more
     * or less) immune to gravitational forces.
     */
    public setProjectileGravityOn(): void {
        for (let p of this.pool)
            p.setGravityScale(1);
    }

    /**
    * The "directional projectile" mechanism might lead to the projectiles moving too fast. This
    * will cause the speed to be multiplied by a factor
    *
    * @param factor The value to multiply against the projectile speed.
    */
    public setProjectileVectorDampeningFactor(factor: number): void {
        this.directionalDamp = factor;
    }

    /**
     * Indicate that all projectiles should participate in collisions, rather than disappearing when
     * they collide with other actors
     */
    public enableCollisionsForProjectiles(): void {
        this.sensor = false;
    }

    /**
     * Indicate that projectiles thrown with the "directional" mechanism should have a fixed
     * velocity
     *
     * @param velocity The magnitude of the velocity for projectiles
     */
    public setFixedVectorThrowVelocityForProjectiles(velocity: number): void {
        this.enableFixedVectorVelocity = true;
        this.fixedVectorVelocity = velocity;
    }

    /**
     * Indicate that projectiles thrown via the "directional" mechanism should be rotated to face in
     * their direction or movement
     */
    public setRotateVectorThrowForProjectiles(): void {
        this.rotateVectorThrow = true;
    }

    /**
     * Indicate that when two projectiles collide, they should both remain on screen
     */
    public setCollisionOkForProjectiles(): void {
        for (let p of this.pool)
            p.disappearOnCollide = false;
    }

    /**
     * The "directional projectile" mechanism might lead to the projectiles moving too fast or too
     * slow. This will cause the speed to be multiplied by a factor
     *
     * @param factor The value to multiply against the projectile speed.
     */
    public setProjectileMultiplier(factor: number) {
        this.directionalDamp = factor;
    }

    /**
     * Set a limit on the total number of projectiles that can be thrown
     *
     * @param number How many projectiles are available
     */
    public setNumberOfProjectiles(number: number): void {
        this.remaining = number;
    }

    /**
     * Specify a sound to play when the projectile is thrown
     *
     * @param soundName Name of the sound file to play
     */
    public setThrowSound(soundName: string): void {
        this.throwSound = this.stage.device.getSpeaker().getSound(soundName);
    }

    /**
     * Specify the sound to play when a projectile disappears
     *
     * @param soundName the name of the sound file to play
     */
    public setProjectileDisappearSound(soundName: string): void {
        this.projectileDisappearSound = soundName;
    }

    /**
     * Specify how projectiles should be animated
     *
     * @param animation The animation object to use for each projectile that is thrown
     */
    public setProjectileAnimation(animation: Animation) {
        for (let p of this.pool)
            p.setDefaultAnimation(animation.clone());
    }

    /**
     * Specify the image file from which to randomly choose projectile images
     *
     * @param imgName The file to use when picking images
     */
    public setProjectileImageSource(imgName: string) {
        for (let p of this.pool)
            p.getAnimator().updateImage(this.stage.device.getRenderer(), imgName);
        this.randomizeImages = true;
    }
}