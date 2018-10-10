import { WorldActor as WorldActor } from "./World"
import { Hero } from "./Hero"
import { Obstacle } from "./Obstacle"
import { Projectile } from "./Projectile"
import { JetLagStage } from "../JetLagStage";

/**
 * Enemies are things to be avoided or defeated by the Hero. Enemies do damage
 * to heroes when they collide with heroes, and enemies can be defeated by
 * heroes, in a variety of ways.
 */
export class Enemy extends WorldActor {
    /** A callback to run when this enemy defeats a hero */
    private onDefeatHero: (e: Enemy, h: Hero) => void = null;

    /** A callback to run when an actor defeats this enemy */
    private onDefeated: (e: Enemy, a: WorldActor) => void = null;

    /** 
     * Amount of damage this enemy does to a hero on a collision. The default is
     * 2, so that an enemy will defeat a hero and not disappear.
     */
    private damage = 2

    /** Does a crawling hero automatically defeat this enemy? */
    private defeatByCrawl: boolean;

    /** Does an in-air hero automatically defeat this enemy */
    private defeatByJump: boolean;

    /** 
     * When the enemy collides with an invincible hero, does the enemy stay
     * alive? 
     */
    private immuneToInvincibility: boolean;

    /** 
     * When the enemy collides with an invincible hero, does it stay alive and
     * damage the hero? 
     */
    private alwaysDoesDamage: boolean;

    /**
     * Create a basic Enemy.  The enemy won't yet have any physics attached to
     * it.
     *
     * @param stage   The stage into which the enemy is being placed
     * @param width   Width of this enemy
     * @param height  Height of this enemy
     * @param imgName Image to display
     * @param z The z index for this enemy
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string, z: number) {
        super(stage, imgName, width, height, z);
    }

    /** Return the callback to run when this enemy defeats a hero */
    public getOnDefeatHero() { return this.onDefeatHero; }

    /**
     * Set the callback to run when this enemy defeats a hero
     * 
     * @param callback the callback to run
     */
    public setOnDefeatHero(callback: (e: Enemy, h: Hero) => void) {
        this.onDefeatHero = callback;
    }

    /** 
     * Set the code to run when this enemy is defeated
     * 
     * @param callback The code to run
     */
    public setOnDefeated(callback: (e: Enemy, a: WorldActor) => void) {
        this.onDefeated = callback;
    }

    /**
     * Return whether the enemy always does damage (even to invincible heroes)
     */
    public getAlwaysDoesDamage() { return this.alwaysDoesDamage; }

    /** Return whether the enemy is not defeated by invincibility */
    public getImmuneToInvincibility() { return this.immuneToInvincibility; }

    /** 
     * Return true if the enemy can be defeated by colliding with a crawling hero
     */
    public getDefeatByCrawl() { return this.defeatByCrawl; }

    /**
     * Return true if the enemy can be defeated by colliding with a jumping hero
     */
    public getDefeatByJump() { return this.defeatByJump; }

    /** Return the amount of damage this enemy does to heroes */
    public getDamage() { return this.damage; }

    /**
     * Code to run when an Enemy collides with a WorldActor.
     *
     * Based on our WorldActor numbering scheme, the only concerns are
     * collisions with Obstacles and Projectiles
     *
     * @param other   Other actor involved in this collision
     * @param contact A description of the collision
     */
    onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact) {
        // collision with obstacles
        if (other instanceof Obstacle)
            this.onCollideWithObstacle(other as Obstacle, contact);
        // collision with projectiles
        if (other instanceof Projectile)
            this.onCollideWithProjectile(other as Projectile);
    }

    /**
     * Set the amount of damage that this enemy does to a hero
     *
     * @param amount Amount of damage. The default is 2, since heroes have a
     *               default strength of 1, so that the enemy defeats the hero
     *               but does not disappear.
     */
    public setDamage(amount: number) { this.damage = amount; }

    /**
     * When an enemy is defeated, this this code figures out how gameplay should
     * change.
     *
     * @param increaseScore Indicate if we should increase the score when this
     *                      enemy is defeated
     * @param h The hero who defeated this enemy, if it was a hero defeat
     */
    public defeat(increaseScore: boolean, h: Hero) {
        if (this.onDefeated)
            this.onDefeated(this, h); // Note: h can be null

        // remove the enemy from the screen
        this.remove(false);

        // possibly update score
        if (increaseScore) {
            this.stage.score.onEnemyDefeated();
        }
    }

    /**
     * Dispatch method for handling Enemy collisions with Obstacles
     *
     * @param obstacle The obstacle with which this Enemy collided
     * @param contact A description of the collision
     */
    private onCollideWithObstacle(obstacle: Obstacle, contact: PhysicsType2d.Dynamics.Contacts.Contact) {
        // handle any callbacks the obstacle has
        if (obstacle.getEnemyCollisionCallback() != null)
            obstacle.getEnemyCollisionCallback()(obstacle, this, contact);
    }

    /**
     * Dispatch method for handling Enemy collisions with Projectiles
     *
     * @param projectile The projectile with which this Enemy collided
     */
    private onCollideWithProjectile(projectile: Projectile) {
        // ignore inactive projectiles
        if (!projectile.getEnabled())
            return;
        // compute damage to determine if the enemy is defeated
        this.damage -= projectile.getDamage();
        if (this.damage <= 0) {
            // hide the projectile quietly, so that the sound of the enemy can
            // be heard
            projectile.remove(true);
            // remove this enemy
            this.defeat(true, null);
        } else {
            // hide the projectile
            projectile.remove(false);
        }
    }

    /** Indicate that this enemy can be defeated by crawling into it */
    public setDefeatByCrawl() {
        this.defeatByCrawl = true;
        // make sure heroes don't ricochet off of this enemy when defeating it
        // via crawling
        this.setCollisionsEnabled(false);
    }

    /** Mark this enemy as one that can be defeated by jumping */
    public setDefeatByJump() { this.defeatByJump = true; }

    /** Make this enemy resist invincibility */
    public setResistInvincibility() {
        this.immuneToInvincibility = true;
    }

    /** Make this enemy damage the hero even when the hero is invincible */
    public setImmuneToInvincibility() { this.alwaysDoesDamage = true; }

    /**
     * Indicate that if the player touches this enemy, the enemy will be removed
     * from the game
     */
    public setDisappearOnTouch() {
        this.setTapCallback(() => {
            this.stage.device.getVibration().vibrate(100);
            this.defeat(true, null);
            this.setTapCallback(null);
            return true;
        });
    }
}