import { WorldActor } from "./WorldActor"
import { Obstacle } from "./Obstacle"
import { Camera } from "../internal/support/Camera"
import { JetLagRenderer } from "../internal/support/Interfaces";
import { JetLagStage } from "../internal/JetLagStage";
import { b2BodyType, b2Contact, b2Vec2 } from "@box2d/core";

/**
 * Projectiles are actors that can be thrown from the hero's location in order to remove enemies.
 */
export class Projectile extends WorldActor {
    /** This is the initial point from which the projectile was thrown */
    private rangeFrom = new b2Vec2(0, 0);

    /** 
     * We have to be careful in side-scrolling games, or else projectiles can
     * continue traveling off-screen forever. This field lets us cap the
     * distance away from the hero that a projectile can travel before we make
     * it disappear.
     */
    private range = 40;

    /**
     * When projectiles collide, and they are not sensors, one will disappear.
     * We can keep both on screen by setting this false
     */
    private disappearOnCollide: boolean;

    /** How much damage does this projectile do? */
    private damage = 1;

    /**
     * Create a projectile, and give it a physics body
     *
     * @param stage    The world in which this projectile will exist
     * @param width    width of the projectile
     * @param height   height of the projectile
     * @param imgName  Name of the image file to use for this projectile
     * @param x        initial x position of the projectile
     * @param y        initial y position of the projectile
     * @param zIndex   The z plane of the projectile
     * @param isCircle True if it is a circle, false if it is a box
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string, x: number, y: number, zIndex: number, isCircle: boolean) {
        super(stage, imgName, width, height, zIndex);
        if (isCircle) {
            let radius = Math.max(width, height);
            this.setCirclePhysics(b2BodyType.b2_dynamicBody, x, y, radius / 2);
        } else {
            this.setBoxPhysics(b2BodyType.b2_dynamicBody, x, y);
        }
        this.setFastMoving(true);
        this.body.SetGravityScale(0);
        this.setCollisionsEnabled(false);
        this.disableRotation();
        this.stage.getWorld().addActor(this, zIndex);
        this.disappearOnCollide = true;
    }

    /**
     * Set the amount of damage this projectile can do
     * 
     * @param amount The amount of damage this projectile should do
     */
    public setDamage(amount: number) { this.damage = amount; }

    /**
     * Set the RangeFrom vector, as part of throwing a projectile
     * 
     * @param x The x value of the vector
     * @param y The y value of the vector
     */
    public setRangeFrom(x: number, y: number) {
        this.rangeFrom.x = x;
        this.rangeFrom.y = y;
    }

    /**
     * Set the range for the projectile
     * 
     * @param distance The range for the projectile
     */
    public setRange(distance: number) { this.range = distance; }

    /**
     * Indicate if the projectile should disappear when it collides with other
     * projectiles
     *
     * @param val True if the projectile should disappear on collisions
     */
    public setDisappearOnCollide(val: boolean) {
        this.disappearOnCollide = val;
    }

    /** Return the RangeFrom vector for this projectile */
    public getRangeFrom() { return this.rangeFrom; }

    /** Return the amount of damage that this projectile does */
    public getDamage() { return this.damage; }

    /**
     * Code to run when a Projectile collides with a WorldActor.
     *
     * The only collision where Projectile is dominant is a collision with an
     * Obstacle or another Projectile.  On most collisions, a projectile will
     * disappear.
     *
     * @param other   Other object involved in this collision
     * @param contact A description of the contact that caused this collision
     */
    onCollide(other: WorldActor, contact: b2Contact) {
        // if this is an obstacle, check if it is a projectile callback, and if
        // so, do the callback
        if (other instanceof Obstacle) {
            let o: Obstacle = other as Obstacle;
            if (o.getProjectileCollisionCallback()) {
                o.getProjectileCollisionCallback()!(o, this, contact);
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
     * Draw a projectile.  When drawing a projectile, we first check if it is
     * too far from its starting point. We only draw it if it is not.
     * 
     * @param renderer  The renderer for the game
     * @param camera    The camera for the game
     * @param elapsedMs The number of milliseconds since the last render
     */
    public render(renderer: JetLagRenderer, camera: Camera, elapsedMs: number) {
        if (!this.body.IsEnabled())
            return;
        // eliminate the projectile quietly if it has traveled too far
        let dx = Math.abs(this.body.GetPosition().x - this.rangeFrom.x);
        let dy = Math.abs(this.body.GetPosition().y - this.rangeFrom.y);
        if (dx * dx + dy * dy > this.range * this.range) {
            this.remove(true);
            return;
        }
        super.render(renderer, camera, elapsedMs);
    }

    /**
     * Indicate that projectiles should feel the effect of gravity
     * 
     * @param val The new gravity scale for the projectile (probably 1)
     */
    public setGravityScale(val: number) {
        this.body.SetGravityScale(val);
    }
}