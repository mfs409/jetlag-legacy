import { WorldActor } from "./WorldActor"
import { Enemy } from "./Enemy"
import { Destination } from "./Destination"
import { Goodie } from "./Goodie"
import { Obstacle } from "./Obstacle"
import { Animation } from "../support/Animation"
import { Camera } from "../internal/support/Camera"
import { JetLagRenderer, JetLagSound } from "../internal/support/Interfaces";
import { JetLagStage } from "../internal/JetLagStage";
import { XY } from "../internal/support/XY";

/**
  * The Hero is the focal point of a game. While it is technically possible to
  * have many heroes, or invisible heroes that exist just so that the player has
  * to keep bad things from happening to the hero, it is usually the case that a
  * game has one hero who moves around on the screen, possibly jumping and
  * crawling.
 */
export class Hero extends WorldActor {
    /**
     * Strength of the hero. This determines how many collisions with enemies
     * the hero can sustain before it is defeated. The default is 1, and the
     * default enemy damage amount is 2, so that the default behavior is for the
     * hero to be defeated on any collision with an enemy, with the enemy *not*
     * disappearing
     */
    private strength = 1;

    /** Time until the hero's invincibility runs out */
    private invincibleRemaining: number = 0;

    /** 
     * When the hero jumps, this specifies the amount of velocity to add to
     * simulate a jump 
     */
    private jumpImpulses: { x: number, y: number } = null;

    /** 
     * For tracking if the game should end immediately when this hero is
     * defeated 
     */
    private mustSurvive: boolean;

    /** Code to run when the hero's strength changes */
    private strengthChangeCallback: (h: Hero) => void;

    /** cells involved in animation for invincibility */
    private invincibleAnimation: Animation = null;

    /** cells involved in animation for throwing */
    private throwAnimation: Animation = null;

    /** seconds that constitute a throw action */
    private throwAnimateTotalLength: number;

    /** how long until we stop showing the throw animation */
    private throwAnimationTimeRemaining: number;

    /** 
     * Track if the hero is in the air, so that it can't jump when it isn't
     * touching anything. This does not quite work as desired, but is good
     * enough for JetLag.
     */
    private inAir = false;

    /** Indicate that the hero can jump while in the air */
    private allowMultiJump: boolean;

    /** Sound to play when a jump occurs */
    private jumpSound: JetLagSound;

    /** cells involved in animation for jumping */
    private jumpAnimation: Animation;

    /** Is the hero currently in crawl mode? */
    private crawling: boolean;

    /** cells involved in animation for crawling */
    private crawlAnimation: Animation;

    /** For tracking the current amount of rotation of the hero */
    private currentRotation = 0;

    /**
     * Construct a Hero, but don't give it any physics yet
     *
     * @param stage   The stage into which the Hero is being placed
     * @param width   The width of the hero
     * @param height  The height of the hero
     * @param imgName The name of the file that has the default image for this
     *                hero
     * @param z       The z index of the hero
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string, z: number) {
        super(stage, imgName, width, height, z);
    }

    /** Report the time until the hero's invincibility runs out */
    getInvincibleRemaining() {
        return Math.max(0, this.invincibleRemaining / 1000);
    }

    /** 
     * Return true if the level should be lost immediately when this hero is
     * defeated (for games with multiple heroes) 
     */
    getMustSurvive() { return this.mustSurvive; }

    /** 
     * Set the time until the hero's invincibility runs out.  If this is making
     * a zero value positive, it makes the hero invincible. 
     * 
     * @param amount The number of seconds of invincibility to add
     */
    setInvincibleRemaining(amount: number) {
        this.invincibleRemaining = amount * 1000;
        if (this.invincibleAnimation != null && amount > 0)
            this.animator.setCurrentAnimation(this.invincibleAnimation);
    }

    /**
     * Code to run when rendering the Hero.
     */
    render(renderer: JetLagRenderer, camera: Camera, elapsedMillis: number) {
        // NB:  We can't just use the basic renderer, because we might need to
        //      adjust a one-off animation (invincibility or throw) first

        // determine when to turn off throw animations
        if (this.throwAnimationTimeRemaining > 0) {
            this.throwAnimationTimeRemaining -= elapsedMillis;
            if (this.throwAnimationTimeRemaining <= 0) {
                this.throwAnimationTimeRemaining = 0;
                this.animator.setCurrentAnimation(this.defaultAnimation);
            }
        }

        // determine when to turn off invincibility and cease invincibility
        // animation
        if (this.invincibleRemaining > 0) {
            this.invincibleRemaining -= elapsedMillis;
            if (this.invincibleRemaining <= 0) {
                this.invincibleRemaining = 0;
                if (this.invincibleAnimation != null)
                    this.animator.setCurrentAnimation(this.defaultAnimation);
            }
        }
        super.render(renderer, camera, elapsedMillis);
    }

    /**
     * Code to run when a Hero collides with a WorldActor.
     *
     * The Hero is the dominant participant in all collisions. Whenever the hero
     * collides with something, we need to figure out what to do
     *
     * @param other   Other object involved in this collision
     * @param contact A description of the contact that caused this collision
     */
    onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact) {
        // NB: we currently ignore Projectile and Hero
        if (other instanceof Enemy) {
            this.onCollideWithEnemy(other as Enemy);
        } else if (other instanceof Destination) {
            this.onCollideWithDestination(other as Destination);
        } else if (other instanceof Obstacle) {
            this.onCollideWithObstacle(other as Obstacle, contact);
        } else if (other instanceof Goodie) {
            this.onCollideWithGoodie(other as Goodie);
        }
    }

    /**
     * Dispatch method for handling Hero collisions with Destinations
     *
     * @param destination The destination with which this hero collided
     */
    private onCollideWithDestination(destination: Destination) {
        if (!this.getEnabled() || !destination.getEnabled())
            return;
        if (destination.receive(this)) {
            this.stage.score.onDestinationArrive();
            // hide the hero quietly, since the destination might make a sound
            this.remove(true);
        }
    }

    /**
     * Dispatch method for handling Hero collisions with Enemies
     *
     * @param enemy The enemy with which this hero collided
     */
    private onCollideWithEnemy(enemy: Enemy) {
        // if the enemy always defeats the hero, no matter what, then defeat the
        // hero
        if (enemy.getAlwaysDoesDamage()) {
            this.remove(false);
            this.stage.score.onDefeatHero(enemy, this);
            return;
        }
        // handle hero invincibility
        if (this.invincibleRemaining > 0) {
            // if the enemy is immune to invincibility, do nothing
            if (enemy.getImmuneToInvincibility()) {
                return;
            }
            enemy.defeat(true, this);
        }
        // defeat by crawling?
        else if (this.crawling && enemy.getDefeatByCrawl()) {
            enemy.defeat(true, this);
        }
        // defeat by jumping only if the hero's bottom is above the enemy's
        // head
        else if (this.inAir && enemy.getDefeatByJump() && this.getYPosition() + this.getHeight() < enemy.getYPosition()) {
            enemy.defeat(true, this);
        }
        // when we can't defeat it by losing strength, remove the hero
        else if (enemy.getDamage() >= this.strength) {
            this.remove(false);
            this.stage.score.onDefeatHero(enemy, this);
        }
        // when we can defeat it by losing strength
        else {
            this.addStrength(-enemy.getDamage());
            enemy.defeat(true, this);
        }
    }

    /**
      * Update the hero's strength, and then run the strength change callback
      * (if any)
      *
      * @param amount The amount to add (use a negative value to subtract)
      */
    private addStrength(amount: number) {
        this.strength += amount;
        if (this.strengthChangeCallback != null) {
            this.strengthChangeCallback(this);
        }
    }

    /**
     * Dispatch method for handling Hero collisions with Obstacles
     *
     * @param o The obstacle with which this hero collided
     */
    private onCollideWithObstacle(o: Obstacle, contact: PhysicsType2d.Dynamics.Contacts.Contact) {
        // do we need to play a sound?
        o.playCollideSound();

        // Did we collide with a sensor?
        let sensor = true;
        // The default is for all fixtures of a actor have the same sensor state
        let fixtures = this.body.GetFixtures();
        if (fixtures.MoveNext()) {
            sensor = sensor && fixtures.Current().IsSensor();
        }

        // reset rotation of hero if this obstacle is not a sensor
        if (this.currentRotation != 0 && !sensor)
            this.increaseRotation(-this.currentRotation);

        // if there is code attached to the obstacle for modifying the hero's
        // behavior, run it
        if (o.getHeroCollisionCallback() != null)
            o.getHeroCollisionCallback()(o, this, contact);

        // If this is a wall, then mark us not in the air so we can do more
        // jumps. Note that sensors should not enable jumps for the hero.
        if ((this.inAir || this.allowMultiJump) && !sensor
            && !o.getNoNumpReenable()) {
            this.stopJump();
        }
    }

    /**
     * Dispatch method for handling Hero collisions with Goodies
     *
     * @param g The goodie with which this hero collided
     */
    private onCollideWithGoodie(g: Goodie) {
        // hide the goodie, count it, and update strength
        g.remove(false);
        if (g.getCollectCallback())
            g.getCollectCallback()(g, this);
        this.stage.score.onGoodieCollected(g);
    }

    /** Return the hero's strength */
    public getStrength() { return this.strength; }

    /**
     * Change the hero's strength.
     *
     * NB: calling this will not run any strength change callbacks... they only
     *     run in conjunction with collisions with goodies or enemies.
     *
     * @param amount The new strength of the hero
     */
    public setStrength(amount: number) {
        let old = this.strength;
        this.strength = amount;
        if (old != amount && this.strengthChangeCallback != null) {
            this.strengthChangeCallback(this);
        }
    }

    /**
     * Specify the X and Y velocity to give to the hero whenever it is
     * instructed to jump
     *
     * @param x Velocity in X direction
     * @param y Velocity in Y direction
     */
    public setJumpImpulses(x: number, y: number) {
        this.jumpImpulses = new XY(x, -y);
    }

    /**
     * Make the hero jump, unless it is in the air and not multi-jump
     */
    jump() {
        // NB: multi-jump prevents us from ever setting mInAir, so this is safe:
        if (this.inAir) {
            return;
        }
        let v = this.body.GetLinearVelocity();
        v.x = v.x + this.jumpImpulses.x;
        v.y = v.y + this.jumpImpulses.y;
        this.updateVelocity(v.x, v.y);
        if (!this.allowMultiJump) {
            this.inAir = true;
        }
        if (this.jumpAnimation != null)
            this.animator.setCurrentAnimation(this.jumpAnimation);

        if (this.jumpSound != null) {
            this.jumpSound.play();
        }
        // suspend creation of sticky joints, so the hero can actually move
        this.setStickyDelay(window.performance.now() + 10);
    }

    /**
     * Stop the jump animation for a hero, and make it eligible to jump again
     */
    private stopJump() {
        if (this.inAir || this.allowMultiJump) {
            this.inAir = false;
            this.animator.setCurrentAnimation(this.defaultAnimation);
        }
    }

    /**
     * Make the hero's throw animation play while it is throwing a projectile
     */
    public doThrowAnimation() {
        if (this.throwAnimation != null) {
            this.animator.setCurrentAnimation(this.throwAnimation);
            this.throwAnimationTimeRemaining = this.throwAnimateTotalLength * 1000;
        }
    }

    /**
     * Put the hero in crawl mode. 
     * 
     * @param rotate The amount to rotate the actor when the crawl starts
     */
    crawlOn(rotate: number) {
        if (this.crawling) {
            return;
        }
        this.crawling = true;
        this.body.SetTransform(this.body.GetPosition(), this.body.GetAngle() + rotate);
        if (this.crawlAnimation != null)
            this.animator.setCurrentAnimation(this.crawlAnimation);
    }

    /**
     * Take the hero out of crawl mode
     * 
     * @param rotate The amount to rotate the actor when the crawl ends
     */
    public crawlOff(rotate: number) {
        if (!this.crawling) {
            return;
        }
        this.crawling = false;
        this.body.SetTransform(this.body.GetPosition(), this.body.GetAngle() - rotate);
        this.animator.setCurrentAnimation(this.defaultAnimation);
    }

    /**
     * Change the rotation of the hero
     *
     * @param delta How much to add to the current rotation
     */
    public increaseRotation(delta: number) {
        if (this.inAir) {
            this.currentRotation += delta;
            this.body.SetAngularVelocity(0);
            this.body.SetTransform(this.body.GetPosition(), this.currentRotation);
        }
    }

    /**
     * Indicate that upon a touch, this hero should begin moving with a specific
     * velocity
     *
     * @param x Velocity in X dimension
     * @param y Velocity in Y dimension
     */
    public setTouchAndGo(x: number, y: number) {
        this.setTapHandler((worldX: number, worldY: number) => {
            // if it was hovering, its body type won't be Dynamic
            if (this.body.GetType() != PhysicsType2d.Dynamics.BodyType.DYNAMIC)
                this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
            this.setAbsoluteVelocity(x, y);
            // turn off isTouchAndGo, so we can't double-touch
            this.setTapHandler(null);
            return true;
        });
    }

    /** Indicate that this hero can jump while it is in the air */
    public setMultiJumpOn() { this.allowMultiJump = true; }

    /** Indicate that touching this hero should make it jump */
    public setTouchToJump() {
        this.setTapHandler((worldX: number, worldY: number) => {
            this.jump();
            return true;
        });
    }

    /**
     * Register an animation sequence for when the hero is jumping
     *
     * @param animation The animation to display
     */
    public setJumpAnimation(animation: Animation) {
        this.jumpAnimation = animation;
    }

    /**
     * Set the sound to play when a jump occurs
     *
     * @param soundName The name of the sound file to use
     */
    public setJumpSound(soundName: string) {
        this.jumpSound = this.stage.device.getSpeaker().getSound(soundName);
    }

    /**
     * Register an animation sequence for when the hero is throwing a projectile
     *
     * @param animation The animation to display
     */
    public setThrowAnimation(animation: Animation) {
        this.throwAnimation = animation;
        // compute the length of the throw sequence, so that we can get our
        // timer right for restoring the default animation
        this.throwAnimateTotalLength = animation.getDuration() / 1000;
    }

    /**
     * Register an animation sequence for when the hero is crawling
     *
     * @param animation The animation to display
     */
    public setCrawlAnimation(animation: Animation) {
        this.crawlAnimation = animation;
    }

    /**
     * Register an animation sequence for when the hero is invincible
     *
     * @param a The animation to display
     */
    public setInvincibleAnimation(a: Animation) {
        this.invincibleAnimation = a;
    }

    /**
     * Indicate that the level should end immediately if this hero is defeated
     */
    public setMustSurvive() { this.mustSurvive = true; }

    /**
     * Provide some code to run any time this hero's strength changes
     * 
     * @param callback The code to run
     */
    public setStrengthChangeCallback(callback: (h: Hero) => void) {
        this.strengthChangeCallback = callback;
    }
}