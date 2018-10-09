import { Animation } from "../support/Animation";
import { JetLagStage } from "../JetLagStage";
import { ProjectilePool } from "../support/ProjectilePool";

export class ProjectileApi {
    /**
     * Construct a level.  Since Level is merely a facade, this method need only store references to
     * the actual game objects.
     *
     * @param manager the StageManager for the game
     */
    constructor(private stage: JetLagStage) { }

    /**
     * Describe the behavior of projectiles in a scene. You must call this if you intend to use
     * projectiles in your scene.
     *
     * @param size     number of projectiles that can be thrown at once
     * @param width    width of a projectile
     * @param height   height of a projectile
     * @param imgName  image to use for projectiles
     * @param strength specifies the amount of damage that a projectile does to an enemy
     * @param zIndex   The z plane on which the projectiles should be drawn
     * @param isCircle Should projectiles have an underlying circle or box shape?
     */
    public configureProjectiles(size: number, width: number, height: number, imgName: string,
        strength: number, zIndex: number, isCircle: boolean): void {
        this.stage.setProjectilePool(new ProjectilePool(this.stage,
            size, width, height, imgName, strength, zIndex, isCircle));
    }

    /**
     * Specify a limit on how far away from the Hero a projectile can go.  Without this, projectiles
     * could keep on traveling forever.
     *
     * @param distance Maximum distance from the hero that a projectile can travel
     */
    public setProjectileRange(distance: number): void {
        this.stage.getProjectilePool().setProjectileRange(distance);
    }

    /**
     * Indicate that projectiles should feel the effects of gravity. Otherwise, they will be (more
     * or less) immune to gravitational forces.
     */
    public setProjectileGravityOn(): void {
        this.stage.getProjectilePool().setProjectileGravityOn();
    }

    /**
    * The "directional projectile" mechanism might lead to the projectiles moving too fast. This
    * will cause the speed to be multiplied by a factor
    *
    * @param factor The value to multiply against the projectile speed.
    */
    public setProjectileVectorDampeningFactor(factor: number): void {
        this.stage.getProjectilePool().setProjectileVectorDampeningFactor(factor);
    }

    /**
     * Indicate that all projectiles should participate in collisions, rather than disappearing when
     * they collide with other actors
     */
    public enableCollisionsForProjectiles(): void {
        this.stage.getProjectilePool().enableCollisionsForProjectiles();
    }

    /**
     * Indicate that projectiles thrown with the "directional" mechanism should have a fixed
     * velocity
     *
     * @param velocity The magnitude of the velocity for projectiles
     */
    public setFixedVectorThrowVelocityForProjectiles(velocity: number): void {
        this.stage.getProjectilePool().setFixedVectorThrowVelocityForProjectiles(velocity);
    }

    /**
     * Indicate that projectiles thrown via the "directional" mechanism should be rotated to face in
     * their direction or movement
     */
    public setRotateVectorThrowForProjectiles(): void {
        this.stage.getProjectilePool().setRotateVectorThrowForProjectiles();
    }

    /**
     * Indicate that when two projectiles collide, they should both remain on screen
     */
    public setCollisionOkForProjectiles(): void {
        this.stage.getProjectilePool().setCollisionOkForProjectiles();
    }

    /**
     * The "directional projectile" mechanism might lead to the projectiles moving too fast or too
     * slow. This will cause the speed to be multiplied by a factor
     *
     * @param factor The value to multiply against the projectile speed.
     */
    public setProjectileMultiplier(factor: number) {
        this.stage.getProjectilePool().setProjectileMultiplier(factor);
    }

    /**
     * Set a limit on the total number of projectiles that can be thrown
     *
     * @param number How many projectiles are available
     */
    public setNumberOfProjectiles(num: number): void {
        this.stage.getProjectilePool().setNumberOfProjectiles(num);
    }

    /**
     * Specify a sound to play when the projectile is thrown
     *
     * @param soundName Name of the sound file to play
     */
    public setThrowSound(soundName: string): void {
        this.stage.getProjectilePool().setThrowSound(soundName);
    }

    /**
     * Specify the sound to play when a projectile disappears
     *
     * @param soundName the name of the sound file to play
     */
    public setProjectileDisappearSound(soundName: string): void {
        this.stage.getProjectilePool().setProjectileDisappearSound(soundName);
    }

    /**
     * Specify how projectiles should be animated
     *
     * @param animation The animation object to use for each projectile that is thrown
     */
    public setProjectileAnimation(animation: Animation) {
        this.stage.getProjectilePool().setProjectileAnimation(animation);
    }

    /**
     * Specify the image file from which to randomly choose projectile images
     *
     * @param imgName The file to use when picking images
     */
    public setProjectileImageSource(imgName: string) {
        this.stage.getProjectilePool().setProjectileImageSource(imgName);
    }
}