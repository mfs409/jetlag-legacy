import { Animation } from "../support/Animation";
import { JetLagStage } from "../internal/JetLagStage";
import { ProjectilePool } from "../internal/support/ProjectilePool";

/**
 * ProjectileApi provides all of the features needed for setting up a pool of
 * projectiles that can be thrown by a hero
 */
export class ProjectileApi {
    /**
     * Construct the Projectile API
     *
     * @param manager the StageManager for the game
     */
    constructor(private stage: JetLagStage) { }

    /**
     * Describe the behavior of projectiles in a scene. You must call this if
     * you intend to use projectiles in your scene.
     *
     * @param size     number of projectiles that can be in the world at once
     * @param width    width of a projectile
     * @param height   height of a projectile
     * @param imgName  image to use for projectiles
     * @param strength specifies the amount of damage that a projectile does to
     *                 an enemy
     * @param zIndex   The z plane on which the projectiles should be drawn
     * @param isCircle Should projectiles have an underlying circle or box
     * shape?
     */
    public configure(size: number, width: number, height: number, imgName: string,
        strength: number, zIndex: number, isCircle: boolean) {
        this.stage.setProjectilePool(new ProjectilePool(this.stage,
            size, width, height, imgName, strength, zIndex, isCircle));
    }

    /**
     * Specify a limit on how far away from the Hero a projectile can go.
     * Without this, projectiles could keep on traveling forever.
     *
     * @param distance Maximum distance from the hero that a projectile can
     *                 travel
     */
    public setRange(distance: number) {
        this.stage.getProjectilePool().setProjectileRange(distance);
    }

    /**
     * Indicate that projectiles should feel the effects of gravity. Otherwise,
     * they will be (more or less) immune to gravitational forces.
     */
    public setGravityOn() {
        this.stage.getProjectilePool().setProjectileGravityOn();
    }

    /**
    * The "directional projectile" mechanism might lead to the projectiles
    * moving too fast. This will cause the speed to be multiplied by a factor
    *
    * @param factor The value to multiply against the projectile speed.
    */
    public setDampeningFactor(factor: number) {
        this.stage.getProjectilePool().setProjectileVectorDampeningFactor(factor);
    }

    /**
     * Indicate that all projectiles should participate in collisions, rather
     * than disappearing when they collide with other actors
     */
    public enableCollisions() {
        this.stage.getProjectilePool().enableCollisionsForProjectiles();
    }

    /**
     * Indicate that projectiles thrown with the "directional" mechanism should
     * have a fixed velocity
     *
     * @param velocity The magnitude of the velocity for projectiles
     */
    public setFixedVectorThrowVelocity(velocity: number) {
        this.stage.getProjectilePool().setFixedVectorThrowVelocityForProjectiles(velocity);
    }

    /**
     * Indicate that projectiles thrown via the "directional" mechanism should
     * be rotated to face in their direction or movement
     */
    public setRotateVectorThrow() {
        this.stage.getProjectilePool().setRotateVectorThrowForProjectiles();
    }

    /**
     * Indicate that when two projectiles collide, they should both remain on
     * screen
     */
    public setCollisionOk() {
        this.stage.getProjectilePool().setCollisionOkForProjectiles();
    }

    /**
     * The "directional projectile" mechanism might lead to the projectiles
     * moving too fast or too slow. This will cause the speed to be multiplied
     * by a factor
     *
     * @param factor The value to multiply against the projectile speed.
     */
    public setMultiplier(factor: number) {
        this.stage.getProjectilePool().setProjectileMultiplier(factor);
    }

    /**
     * Set a limit on the total number of projectiles that can be thrown
     *
     * @param num How many projectiles are available
     */
    public setLimitOnThrows(num: number) {
        this.stage.getProjectilePool().setNumberOfProjectiles(num);
    }

    /**
     * Specify a sound to play when the projectile is thrown
     *
     * @param soundName Name of the sound file to play
     */
    public setThrowSound(soundName: string) {
        this.stage.getProjectilePool().setThrowSound(soundName);
    }

    /**
     * Specify the sound to play when a projectile disappears
     *
     * @param soundName the name of the sound file to play
     */
    public setDisappearSound(soundName: string) {
        this.stage.getProjectilePool().setProjectileDisappearSound(soundName);
    }

    /**
     * Specify how projectiles should be animated
     *
     * @param animation The animation object to use for each projectile that is
     *                  thrown
     */
    public setAnimation(animation: Animation) {
        this.stage.getProjectilePool().setProjectileAnimation(animation);
    }

    /**
     * Specify the image file from which to randomly choose projectile images
     *
     * @param images An array of image names, from which to choose images at
     *               random
     */
    public setImageSource(images: string[]) {
        this.stage.getProjectilePool().setProjectileImageSource(images);
    }

    /** Return the number of remaining projectiles */
    public getRemaining() {
        return this.stage.getProjectilePool().getRemaining();
    }
}