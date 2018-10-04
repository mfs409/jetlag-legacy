import { WorldActor } from "./WorldActor"
import { WorldScene } from "../stage/WorldScene"
import { Hero } from "./Hero"
import { Obstacle } from "./Obstacle"
import { Projectile } from "./Projectile"
import { JetLagConfig } from "../JetLagConfig";
import { JetLagDevice } from "../misc/JetLagDevice";
import { Score } from "../misc/Score";

/**
 * Enemies are things to be avoided or defeated by the Hero. Enemies do damage to heroes when they
 * collide with heroes, and enemies can be defeated by heroes, in a variety of ways.
 */
export class Enemy extends WorldActor {
    /** A callback to run when this enemy defeats a hero */
    onDefeatHero: (e: Enemy, h: Hero) => void = null;

    /** A callback to run when an actor defeats this enemy */
    onDefeated: (e: Enemy, a: WorldActor) => void = null;

    /** 
     * Amount of damage this enemy does to a hero on a collision. The default is
     * 2, so that an enemy will defeat a hero and not disappear.
     */
    damage: number;

    /** Does a crawling hero automatically defeat this enemy? */
    defeatByCrawl: boolean;

    /** Does an in-air hero automatically defeat this enemy */
    defeatByJump: boolean;

    /** When the enemy collides with an invincible hero, does the enemy stay alive? */
    immuneToInvincibility: boolean;

    /** When the enemy collides with an invincible hero, does it stay alive and damage the hero? */
    alwaysDoesDamage: boolean;

    /**
     * Create a basic Enemy.  The enemy won't yet have any physics attached to it.
     *
     * @param game    The currently active game
     * @param scene   The scene into which the destination is being placed
     * @param width   Width of this enemy
     * @param height  Height of this enemy
     * @param imgName Image to display
     */
    constructor(scene: WorldScene, device: JetLagDevice, config: JetLagConfig, private score: Score, width: number, height: number, imgName: string) {
        super(scene, device, config, imgName, width, height);
        this.damage = 2;
    }

    /**
     * Code to run when an Enemy collides with a WorldActor.
     * 
     * Based on our WorldActor numbering scheme, the only concerns are collisions with Obstacles
     * and Projectiles
     *
     * @param other   Other actor involved in this collision
     * @param contact A description of the collision
     */
    onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
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
     * @param amount Amount of damage. The default is 2, since heroes have a default strength of 1,
     *               so that the enemy defeats the hero but does not disappear.
     */
    public setDamage(amount: number): void {
        this.damage = amount;
    }

    /**
     * When an enemy is defeated, this this code figures out how gameplay should change.
     *
     * @param increaseScore Indicate if we should increase the score when this enemy is defeated
     * @param h The hero who defeated this enemy, if it was a hero defeat
     */
    public defeat(increaseScore: boolean, h: Hero): void {
        if (this.onDefeated && h)
            this.onDefeated(this, h);

        // remove the enemy from the screen
        this.remove(false);

        // possibly update score
        if (increaseScore) {
            this.score.onEnemyDefeated();
        }
    }

    /**
     * Dispatch method for handling Enemy collisions with Obstacles
     *
     * @param obstacle The obstacle with which this Enemy collided
     * @param contact A description of the collision
     */
    private onCollideWithObstacle(obstacle: Obstacle, contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
        // handle any callbacks the obstacle has
        if (obstacle.enemyCollision != null)
            obstacle.enemyCollision(obstacle, this, contact);
    }

    /**
     * Dispatch method for handling Enemy collisions with Projectiles
     *
     * @param projectile The projectile with which this Enemy collided
     */
    private onCollideWithProjectile(projectile: Projectile): void {
        // ignore inactive projectiles
        if (!projectile.getEnabled())
            return;
        // compute damage to determine if the enemy is defeated
        this.damage -= projectile.damage;
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

    /**
     * Indicate that this enemy can be defeated by crawling into it
     */
    public setDefeatByCrawl() {
        this.defeatByCrawl = true;
        // make sure heroes don't ricochet off of this enemy when defeating it via crawling
        this.setCollisionsEnabled(false);
    }

    /**
     * Mark this enemy as one that can be defeated by jumping
     */
    public setDefeatByJump(): void {
        this.defeatByJump = true;
    }

    /**
     * Make this enemy resist invincibility
     */
    public setResistInvincibility(): void {
        this.immuneToInvincibility = true;
    }

    /**
     * Make this enemy damage the hero even when the hero is invincible
     */
    public setImmuneToInvincibility(): void {
        this.alwaysDoesDamage = true;
    }

    /**
     * Indicate that if the player touches this enemy, the enemy will be removed from the game
     */
    public setDisappearOnTouch() {
        this.setTapCallback(() => {
            this.device.getVibration().vibrate(100);
            this.defeat(true, null);
            this.setTapCallback(null);
            return true;
        });
    }
}