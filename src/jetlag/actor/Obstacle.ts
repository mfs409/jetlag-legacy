import { WorldActor as WorldActor } from "./World"
import { Enemy } from "./Enemy"
import { Hero } from "./Hero"
import { TimedEvent } from "../support/TimedEvent"
import { JetLagStage } from "../JetLagStage";
import { Projectile } from "./Projectile";

/**
 * Obstacles are usually walls, except they can move, and can be used to run all sorts of arbitrary
 * code that changes the game, or the behavior of the things that collide with them. It's best to
 * think of them as being both "a wall" and "a catch-all for any behavior that we don't have
 * anywhere else".
 */
export class Obstacle extends WorldActor {
    /** One of the main uses of obstacles is to use hero/obstacle collisions as a way to run custom code. This callback defines what code to run when a hero collides with this obstacle. */
    private heroCollision: (thisActor: Obstacle, collideActor: Hero, contact: PhysicsType2d.Dynamics.Contacts.Contact) => void = null;
    getHeroCollisionCallback() { return this.heroCollision; }
    setHeroCollisionCallback(callback: (thisActor: Obstacle, collideActor: Hero, contact: PhysicsType2d.Dynamics.Contacts.Contact) => void) {
        this.heroCollision = callback;
    }

    /** This callback is for when a projectile collides with an obstacle */
    private projectileCollision: (thisActor: Obstacle, collideActor: Projectile, contact: PhysicsType2d.Dynamics.Contacts.Contact) => void = null
    getProjectileCollisionCallback() { return this.projectileCollision; }

    /** This callback is for when an enemy collides with an obstacle */
    private enemyCollision: (thisActor: Obstacle, collideActor: Enemy, contact: PhysicsType2d.Dynamics.Contacts.Contact) => void = null
    getEnemyCollisionCallback() { return this.enemyCollision; }
    setEnemyCollisionCallback(callback: (thisSctor: Obstacle, collideActor: Enemy, contact: PhysicsType2d.Dynamics.Contacts.Contact) => void) {
        this.enemyCollision = callback;
    }

    /** Indicate that this obstacle does not re-enableTilt jumping for the hero */
    private noJumpReenable = false;
    getNoNumpReenable() { return this.noJumpReenable; }

    /** a sound to play when the obstacle is hit by a hero */
    private collideSound: Howl;

    /** how long to delay (in nanoseconds) between attempts to play the collide sound */
    private collideSoundDelay: number; //long

    /** Time of last collision sound */
    private lastCollideSoundTime: number; //long

    /**
     * Build an obstacle, but do not give it any Physics body yet
     *
     * @param width   width of this Obstacle
     * @param height  height of this Obstacle
     * @param imgName Name of the image file to use
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string) {
        super(stage, imgName, width, height);
    }

    /**
     * Code to run when an Obstacle collides with a WorldActor.
     *
     * The Obstacle always comes last in the collision hierarchy, so no code is needed here
     *
     * @param other   Other object involved in this collision
     * @param contact A description of the contact that caused this collision
     */
    onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
    }

    /**
     * Make the Obstacle into a pad that changes the hero's speed when the hero glides over it.
     * <p>
     * These "pads" will multiply the hero's speed by the factor given as a parameter. Factors can
     * be negative to cause a reverse direction, less than 1 to cause a slowdown (friction pads), or
     * greater than 1 to serve as zoom pads.
     *
     * @param factor Value to multiply the hero's velocity when it collides with this Obstacle
     */
    public setPad(factor: number): void {
        // disable collisions on this obstacle
        this.setCollisionsEnabled(false);
        // register a callback to multiply the hero's speed by factor
        this.heroCollision = (self: WorldActor, h: WorldActor, c: PhysicsType2d.Dynamics.Contacts.Contact) => {
            let x = h.getXVelocity() * factor;
            let y = h.getYVelocity() * factor;
            h.updateVelocity(x, y);
        };
    }

    /**
     * Make the object a callback object, so custom code will run when a projectile collides with it
     *
     * @param callback The code to run on a collision
     */
    public setProjectileCollisionCallback(callback: (self: Obstacle, h: Projectile, c: PhysicsType2d.Dynamics.Contacts.Contact) => void): void {
        this.projectileCollision = callback;
    }

    /**
     * Internal method for playing a sound when a hero collides with this obstacle
     */
    playCollideSound(): void {
        if (this.collideSound == null)
            return;

        // Make sure we have waited long enough since the last time we played the sound
        let now = (new Date()).getTime();
        if (now < this.lastCollideSoundTime + this.collideSoundDelay)
            return;
        this.lastCollideSoundTime = now;
        this.collideSound.play();
    }

    /**
     * Call this on an obstacle to make it behave like a "pad" obstacle, except with a constant
     * additive (or subtractive) effect on the hero's speed.
     *
     * @param boostAmountX  The amount to add to the hero's X velocity
     * @param boostAmountY  The amount to add to the hero's Y velocity
     * @param boostDuration How long should the speed boost last (use -1 to indicate "forever")
     */
    public setSpeedBoost(boostAmountX: number, boostAmountY: number, boostDuration: number): void {
        // disable collisions on this obstacle
        this.setCollisionsEnabled(false);
        // register a callback to change the hero's speed
        this.heroCollision = (self: Obstacle, h: Hero, c: PhysicsType2d.Dynamics.Contacts.Contact) => {
            // boost the speed
            let v = h.getBody().GetLinearVelocity();
            v.x += boostAmountX;
            v.y += boostAmountY;
            h.updateVelocity(v.x, v.y);
            // now set a timer to un-boost the speed
            if (boostDuration > 0) {
                this.stage.getWorld().timer.addEvent(new TimedEvent(boostDuration, false, () => {
                    let v = h.getBody().GetLinearVelocity();
                    v.x -= boostAmountX;
                    v.y -= boostAmountY;
                    h.updateVelocity(v.x, v.y);
                }));
            }
        }
    }

    /**
     * Control whether the hero can jump if it collides with this obstacle while in the air
     *
     * @param enable true if the hero can jump again, false otherwise
     */
    public setReJump(enable: boolean): void {
        this.noJumpReenable = !enable;
    }
}