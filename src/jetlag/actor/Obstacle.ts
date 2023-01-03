import { WorldActor } from "./WorldActor"
import { Enemy } from "./Enemy"
import { Hero } from "./Hero"
import { TimedEvent } from "../internal/support/TimedEvent"
import { JetLagStage } from "../internal/JetLagStage";
import { Projectile } from "./Projectile";
import { Goodie } from "./Goodie";
import { b2Contact } from "@box2d/core";
import { Howl } from "howler";

/**
 * Obstacles are usually walls, except they can move, and can be used to run all
 * sorts of arbitrary code that changes the game, or the behavior of the things
 * that collide with them. It's best to think of them as being both "a wall" and
 * "a catch-all for any behavior that we don't have anywhere else".
 */
export class Obstacle extends WorldActor {
    /**
     * One of the main uses of obstacles is to use hero/obstacle collisions as a
     * way to run custom code. This callback defines what code to run when a
     * hero collides with this obstacle. 
     */
    private heroCollision?: (thisActor: Obstacle, collideActor: Hero, contact: b2Contact) => void;

    /** This callback is for when a projectile collides with an obstacle */
    private projectileCollision?: (thisActor: Obstacle, collideActor: Projectile, contact: b2Contact) => void;

    /** This callback is for when an enemy collides with an obstacle */
    private enemyCollision?: (thisActor: Obstacle, collideActor: Enemy, contact: b2Contact) => void;

    /** This callback is for when a goodie collides with an obstacle */
    private goodieCollision?: (thisActor: Obstacle, collideActor: Goodie, contact: b2Contact) => void;

    /** Indicate that this obstacle does not re-enable jumping for the hero */
    private noJumpReenable = false;

    /** a sound to play when the obstacle is hit by a hero */
    private collideSound?: Howl;

    /** 
     * how long to delay (in nanoseconds) between attempts to play the collide
     * sound 
     */
    private collideSoundDelay = 0;

    /** Time of last collision sound */
    private lastCollideSoundTime = 0;

    /**
     * Build an obstacle, but do not give it any Physics body yet
     *
     * @param stage   The world into which the obstacle will be drawn
     * @param width   width of this Obstacle
     * @param height  height of this Obstacle
     * @param imgName Name of the image file to use
     * @param z The z index of the obstacle
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string, z: number) {
        super(stage, imgName, width, height, z);
    }

    /** Return the code to run when a hero collides with this obstacle */
    getHeroCollisionCallback() { return this.heroCollision; }

    /**
     * Set the callback to run when heros collide with this obstacle
     * 
     * @param callback The callback to run on a collision with a hero
     */
    setHeroCollisionCallback(callback: (thisActor: Obstacle, collideActor: Hero, contact: b2Contact) => void) {
        this.heroCollision = callback;
    }

    /** Return the code to run when this obstacle collides with a projectile */
    getProjectileCollisionCallback() { return this.projectileCollision; }

    /** Return the code to run when this obstacle collides with an enemy */
    getEnemyCollisionCallback() { return this.enemyCollision; }

    /**
     * Set the callback to run when this obstacle collides with an enemy
     * 
     * @param callback The code to run
     */
    setEnemyCollisionCallback(callback: (thisActor: Obstacle, collideActor: Enemy, contact: b2Contact) => void) {
        this.enemyCollision = callback;
    }

    /**
     * Set the callback to run when this obstacle collides with a goodie
     * 
     * @param callback The code to run
     */
    setGoodieCollisionCallback(callback: (thisActor: Obstacle, collideActor: Goodie, contact: b2Contact) => void) {
        this.goodieCollision = callback;
    }

    /**
     * Return true if this obstacle doesn't count for letting an in-air hero jump again
     */
    getNoJumpReenable() { return this.noJumpReenable; }

    /**
     * Code to run when an Obstacle collides with a WorldActor.
     *
     * The Obstacle always comes last in the collision hierarchy, so no code is
     * needed here
     *
     * @param other   Other object involved in this collision
     * @param contact A description of the contact that caused this collision
     */
    onCollide(other: WorldActor, contact: b2Contact) {
        if (other instanceof Goodie && this.goodieCollision)
            this.goodieCollision(this, other, contact);
    }

    /**
     * Make the Obstacle into a pad that changes the hero's speed when the hero
     * glides over it.
     *
     * These "pads" will multiply the hero's speed by the factor given as a
     * parameter. Factors can be negative to cause a reverse direction, less
     * than 1 to cause a slowdown (friction pads), or greater than 1 to serve as
     * zoom pads.
     *
     * @param factor Value to multiply the hero's velocity when it collides with
     *               this Obstacle
     */
    public setPad(factor: number) {
        // disable collisions on this obstacle
        this.setCollisionsEnabled(false);
        // register a callback to multiply the hero's speed by factor
        this.heroCollision = (_self: WorldActor, h: WorldActor, _c: b2Contact) => {
            let x = h.getXVelocity() * factor;
            let y = h.getYVelocity() * factor;
            h.updateVelocity(x, y);
        };
    }

    /**
     * Provide code to run when a projectile collides with this obstacle
     *
     * @param callback The code to run on a collision
     */
    public setProjectileCollisionCallback(callback: (self: Obstacle, h: Projectile, c: b2Contact) => void) {
        this.projectileCollision = callback;
    }

    /**
     * Internal method for playing a sound when a hero collides with this
     * obstacle
     */
    public playCollideSound() {
        if (!this.collideSound)
            return;

        // Make sure we have waited long enough since the last time we played the sound
        let now = (new Date()).getTime();
        if (now < this.lastCollideSoundTime + this.collideSoundDelay)
            return;
        this.lastCollideSoundTime = now;
        this.collideSound.play();
    }

    /**
     * Call this on an obstacle to make it behave like a "pad" obstacle, except
     * with a constant additive (or subtractive) effect on the hero's speed.
     *
     * @param boostAmountX  The amount to add to the hero's X velocity
     * @param boostAmountY  The amount to add to the hero's Y velocity
     * @param boostDuration How long should the speed boost last (use -1 to
     *                      indicate "forever")
     */
    public setSpeedBoost(boostAmountX: number, boostAmountY: number, boostDuration: number) {
        // disable collisions on this obstacle
        this.setCollisionsEnabled(false);
        // register a callback to change the hero's speed
        this.heroCollision = (_self: Obstacle, h: Hero, _c: b2Contact) => {
            // boost the speed
            let v = h.getBody().GetLinearVelocity();
            let x = v.x + boostAmountX;
            let y = v.y + boostAmountY;
            h.updateVelocity(x, y);
            // now set a timer to un-boost the speed
            if (boostDuration > 0) {
                this.stage.getWorld().getTimer().addEvent(new TimedEvent(boostDuration, false, () => {
                    let v = h.getBody().GetLinearVelocity();
                    let x = v.x - boostAmountX;
                    let y = v.y - boostAmountY;
                    h.updateVelocity(x, y);
                }));
            }
        }
    }

    /**
     * Control whether the hero can jump if it collides with this obstacle while
     * in the air
     *
     * @param enable true if the hero can jump again, false otherwise
     */
    public setReJump(enable: boolean) { this.noJumpReenable = !enable; }
}