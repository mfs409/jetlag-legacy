import { b2Transform } from "@box2d/core";
import { game } from "../Stage";
import { ISound } from "../Services/AudioService";
import { AnimatedSprite, AppearanceComponent, ImageSprite } from "../Components/Appearance";
import { Actor } from "../Entities/Actor";
import { Projectile } from "../Components/Role";
import { BoxCfgOpts, CircleCfgOpts } from "../Config";
import { Scene } from "../Entities/Scene";
import { StateEvent } from "../Components/StateManager";
import { ProjectileMovement } from "../Components/Movement";
import { RigidBodyComponent } from "../Components/RigidBody";
import { SoundEffectComponent } from "../Components/SoundEffect";

/**
 * ProjectileSystemConfigOpts describes the mandatory and optional arguments
 * when configuring a Projectile System
 */
export interface ProjectileSystemConfigOpts {
  /** The number of projectiles that can ever be on screen at once */
  maxAtOnce: number,
  /** Configuration for the shape of projectiles' rigid bodies */
  body: CircleCfgOpts | BoxCfgOpts,
  /** Configuration for the appearance of projectiles */
  // TODO: Why not text?
  appearance: AppearanceComponent,
  /** The amount of damage a projectile can do to enemies */
  strength: number,
  /* A multiplier on projectile speed */
  multiplier?: number,
  /** Should projectiles pass through walls */
  immuneToCollisions?: boolean,
  /** Should projectiles be subject to gravity */
  gravityAffectsProjectiles?: boolean,
  /** A fixed velocity for all projectiles */
  fixedVectorVelocity?: number,
  /** Should projectiles be rotated in the direction they are thrown? */
  rotateVectorThrow?: boolean,
  /** A sound to play when throwing a projectile */
  throwSound?: string,
  /** A sound to play when a projectile disappears */
  soundEffects?: SoundEffectComponent,
  /** A set of image names to randomly assign to projectiles' appearance */
  randomImageSources?: string[],
  /** Limit the range that projectiles can travel? */
  range?: number,
  /** Should projectiles disappear when they collide with each other? */
  disappearOnCollide?: boolean,
}

/**
 * ProjectileSystemConfig stores all of the verified-and-usable configuration
 * state for projectiles.
 */
class ProjectileSystemConfig {
  /** The number of projectiles that can ever be on screen at once */
  size: number;
  /** Configuration for the shape of projectiles' rigid bodies */
  body: CircleCfgOpts | BoxCfgOpts;
  /** Configuration for the appearance of projectiles */
  appearance: AppearanceComponent;
  /** The amount of damage a projectile can do to enemies */
  strength: number;
  /* A multiplier on projectile speed */
  multiplier: number;
  /** Should projectiles pass through walls */
  immuneToCollisions: boolean;
  /** Should projectiles be subject to gravity */
  gravityAffectsProjectiles: boolean;
  /** A fixed velocity for all projectiles */
  fixedVectorVelocity?: number;
  /** Should projectiles be rotated in the direction they are thrown? */
  rotateVectorThrow?: boolean;
  /** A sound to play when throwing a projectile */
  throwSound?: ISound;
  /** A sound to play when a projectile disappears */
  soundEffects?: SoundEffectComponent;
  /** A set of image names to randomly assign to projectiles' appearance */
  randomImageSources?: string[];
  /** Limit the range that projectiles can travel? */
  range?: number;
  /** Should projectiles disappear when they collide with each other */
  disappearOnCollide: boolean;

  /** Construct a ProjectileSystemConfig object from its interface */
  constructor(opts: ProjectileSystemConfigOpts) {
    this.size = opts.maxAtOnce;
    this.body = opts.body;
    this.appearance = opts.appearance;
    this.strength = opts.strength;
    // TODO: re-work this based on the new collision code
    this.immuneToCollisions = !!opts.immuneToCollisions;
    this.gravityAffectsProjectiles = !!opts.gravityAffectsProjectiles;
    if (opts.throwSound)
      this.throwSound = game.musicLibrary.getSound(opts.throwSound);
    this.multiplier = opts.multiplier ?? 1;
    this.fixedVectorVelocity = opts.fixedVectorVelocity;
    this.rotateVectorThrow = opts.rotateVectorThrow;
    this.soundEffects = opts.soundEffects;
    this.randomImageSources = opts.randomImageSources;
    this.range = opts.range;
    this.disappearOnCollide = opts.disappearOnCollide == undefined ? true : opts.disappearOnCollide;
  }
}

/**
 * ProjectileSystem stores a set of projectiles.  We can get into lots of trouble
 * with Box2d if we make too many actors, so the projectile system is a useful
 * mechanism for recycling / reusing projectiles.
 */
export class ProjectileSystem {
  /** A collection of all the available projectiles */
  private pool = [] as Actor[];

  /** All of the configuration properties of the Projectile System */
  private readonly props: ProjectileSystemConfig;

  /** For limiting the number of projectiles that can be thrown */
  private remaining?: number;

  /** Index of next available projectile */
  private nextIndex = 0;

  /** Return the number of projectiles remaining */
  public getRemaining() { return this.remaining ?? 0; }

  /**
   * Set a limit on the total number of projectiles that can be thrown
   *
   * @param number How many projectiles are available
   */
  public setNumberOfProjectiles(number: number) { this.remaining = number; }

  /**
   * Create the projectile system, and set the way projectiles are thrown.
   *
   * @param scene Where the projectiles will be used
   * @param cfg   Configuration options for the projectiles
   */
  constructor(scene: Scene, cfg: ProjectileSystemConfigOpts) {
    this.props = new ProjectileSystemConfig(cfg);

    // set up the pool of projectiles
    for (let i = 0; i < this.props.size; ++i) {
      let appearance = this.props.appearance.clone();
      let rigidBody = (this.props.body.hasOwnProperty("radius")) ?
        RigidBodyComponent.Circle(this.props.body as CircleCfgOpts, scene) :
        RigidBodyComponent.Box(this.props.body as BoxCfgOpts, scene, {});
      let role = new Projectile({ damage: this.props.strength });
      if (this.props.range)
        role.range = this.props.range;
      role.disappearOnCollide = this.props.disappearOnCollide;
      let p = Actor.Make({ scene, appearance, rigidBody, movement: new ProjectileMovement(), role });
      if (this.props.gravityAffectsProjectiles)
        p.rigidBody.body.SetGravityScale(1);
      p.sounds = this.props.soundEffects;
      if (!this.props.immuneToCollisions) { role.disappearOnCollide = false; p.rigidBody.setCollisionsEnabled(true); }
      else p.rigidBody.setCollisionsEnabled(true);
      p.enabled = false;
      this.pool.push(p);
    }
  }

  /**
   * Throw a projectile. This is for throwing in a single, predetermined
   * direction
   *
   * @param actor     The actor who is performing the throw
   * @param offsetX   The x distance between the top left of the projectile and
   *                  the top left of the actor throwing the projectile
   * @param offsetY   The y distance between the top left of the projectile and
   *                  the top left of the actor throwing the projectile
   * @param velocityX The X velocity of the projectile when it is thrown
   * @param velocityY The Y velocity of the projectile when it is thrown
   */
  // TODO: can we combine the throwing methods?
  throwFixed(actor: Actor, offsetX: number, offsetY: number, velocityX: number, velocityY: number) {
    // have we reached our limit?
    if (this.remaining == 0) return;
    // do we need to decrease our limit?
    if (this.remaining != undefined) this.remaining--;

    // is there an available projectile?
    if (this.pool[this.nextIndex].enabled) return;
    // get the next projectile, reset sensor, set image
    let b = this.pool[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.props.size;
    b.rigidBody?.setCollisionsEnabled(!this.props.immuneToCollisions);
    if (b.appearance instanceof AnimatedSprite) b.appearance.restartCurrentAnimation();

    if (this.props.randomImageSources) {
      let idx = Math.floor(Math.random() * this.props.randomImageSources!.length);
      (b.appearance as ImageSprite).setImage(this.props.randomImageSources![idx]);
    }

    // calculate offset for starting position of projectile, put it on
    // screen
    (b.role as Projectile).rangeFrom.Set(
      (actor.rigidBody?.getCenter().x ?? 0) + offsetX,
      (actor.rigidBody?.getCenter().y ?? 0) + offsetY
    );
    let transform = new b2Transform();
    transform.SetPositionAngle((b.role as Projectile).rangeFrom, 0);
    b.rigidBody?.body.SetTransform(transform);

    // give the projectile velocity, show it, and play sound
    (b.movement as ProjectileMovement).updateVelocity(velocityX, velocityY);
    b.enabled = true;
    this.props.throwSound?.play();
    actor.state.changeState(actor, StateEvent.THROW_START);
  }

  /**
   * Throw a projectile. This is for throwing in the direction of a specified
   * point
   *
   * @param fromX   X coordinate of the center of the actor doing the throw
   * @param fromY   Y coordinate of the center of the actor doing the throw
   * @param toX     X coordinate of the point at which to throw
   * @param toY     Y coordinate of the point at which to throw
   * @param actor   The actor who is performing the throw
   * @param offsetX The x distance between the top left of the projectile and
   *                the top left of the actor throwing the projectile
   * @param offsetY The y distance between the top left of the projectile and
   *                the top left of the actor throwing the projectile
   */
  throwAt(fromX: number, fromY: number, toX: number, toY: number, actor: Actor, offsetX: number, offsetY: number) {
    // have we reached our limit?
    if (this.remaining == 0) return;
    // do we need to decrease our limit?
    if (this.remaining != undefined) this.remaining--;

    // is there an available projectile?
    if (this.pool[this.nextIndex].enabled) return;
    // get the next projectile, set sensor, set image
    let b = this.pool[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.props.size;
    b.rigidBody?.setCollisionsEnabled(!this.props.immuneToCollisions);
    if (b.appearance instanceof AnimatedSprite) b.appearance.restartCurrentAnimation();

    // calculate offset for starting position of projectile, put it on
    // screen
    (b.role as Projectile).rangeFrom.Set(fromX + offsetX, fromY + offsetY);
    let transform = new b2Transform();
    transform.SetPositionAngle((b.role as Projectile).rangeFrom, 0);
    b.rigidBody?.body.SetTransform(transform);

    // give the projectile velocity
    if (this.props.fixedVectorVelocity) {
      // compute a unit vector
      let dX = toX - fromX - offsetX;
      let dY = toY - fromY - offsetY;
      let hypotenuse = Math.sqrt(dX * dX + dY * dY);
      let tmpX = dX / hypotenuse;
      let tmpY = dY / hypotenuse;
      // multiply by fixed velocity
      tmpX *= this.props.fixedVectorVelocity;
      tmpY *= this.props.fixedVectorVelocity;
      (b.movement as ProjectileMovement).updateVelocity(tmpX, tmpY);
    }
    else {
      let dX = toX - fromX - offsetX;
      let dY = toY - fromY - offsetY;
      // compute absolute vector, multiply by dampening factor
      let tmpX = dX * this.props.multiplier;
      let tmpY = dY * this.props.multiplier;
      (b.movement as ProjectileMovement).updateVelocity(tmpX, tmpY);
    }

    // rotate the projectile
    if (this.props.rotateVectorThrow) {
      let angle = Math.atan2(toY - fromY - offsetY, toX - fromX - offsetX) - Math.atan2(-1, 0);
      b.rigidBody?.setRotation(angle);
    }

    // show the projectile, play sound, and animate the hero
    b.enabled = true;
    this.props.throwSound?.play();
    actor.state.changeState(actor, StateEvent.THROW_START);
  }
}
