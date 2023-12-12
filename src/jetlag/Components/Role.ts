import { b2Vec2, b2Transform, b2BodyType, b2DistanceJointDef } from "@box2d/core";
import { Actor } from "../Entities/Actor";
import { stage } from "../Stage";
import { DIRECTION, StateEvent } from "./StateManager";
import { AnimatedSprite, ImageSprite } from "./Appearance";
import { ProjectileMovement } from "./Movement";
import { TimedEvent } from "../Systems/Timer";

/**
 * These are the different reasons why two entities might pass through each
 * other, even when the collide with everything else
 */
export enum CollisionExemptions {
  CRAWL_HERO = 0,
  JUMP_HERO = 1,
  DESTINATION = 2,
  GOODIE = 3,
  HERO = 4,
  PROJECTILE = 5,
  ENEMY = 6,
  SENSOR = 7, // NB: Sensor collisions are always disabled
  OBSTACLE = 8,
  PASSIVE = 9, // NB: Passive collisions are never ignored
}

/** Role is the base class for all of the roles that an actor can play */
class Role {
  /** The actor associated with this Role */
  protected _actor?: Actor;

  /** Tasks to run before every render */
  readonly prerenderTasks: ((elapsedMs: number, actor?: Actor) => void)[] = [];

  /**
   * collisionRules lets us turn off collisions based on the roles of two
   * actors.  We do this with two sets.  If A's second set contains an entry in
   * B's first set, then we disable the collision.  We also do this
   * symmetrically with B and A.  In essence, this means that the first set lets
   * a Role say "here are special things about me", and the second set lets a
   * Role say "I don't collide with things that are special in these ways."
   */
  collisionRules = {
    /** The first set: properties of this role */
    properties: [] as CollisionExemptions[],
    /** The second set: properties that this role won't collide with */
    ignores: [] as CollisionExemptions[]
  }

  /**
   * Indicate that the current Role should not ignore collisions with some other
   * role
   *
   * @param which The role that should not be ignored
   */
  public enableCollision(which: CollisionExemptions) { this.collisionRules.ignores = this.collisionRules.ignores.filter(value => value != which); }

  /**
   * Indicate that the current Role should ignore collisions with some other
   * role
   *
   * @param which The role that should be ignored
   */

  /** This actor ignores collisions with Heroes */
  public disableCollision(which: CollisionExemptions) { this.collisionRules.ignores.push(which); }

  /** Code to run when there is a collision involving this role's Actor */
  onCollide(_other: Actor) {
    // The default is to do nothing, because most Roles are never the "dominant"
    // role in a collision, so they defer to the other Role.
    return false;
  }

  /** Code to run immediately before rendering this role's Actor */
  prerender(elapsedMs: number) {
    for (let task of this.prerenderTasks)
      task(elapsedMs, this._actor);
  }
}

/**
 * The goodie role is most easily thought of as a coin.  When the hero collides
 * with the coin, the default behavior is that the coin disappears and the score
 * increases by 1.
 *
 * Note that in reality, goodies are more powerful than the above description:
 * when the hero collides with them, they disappear, and we can run whatever
 * code we want.  It's just that the default is for the score to increase.  It's
 * fine to make the score decrease, or make it increase by some unexpected
 * amount.  You could even make the hero's color change, or make the hero grow,
 * or whatever else you want.  The important points are just that the goodie
 * disappears, and some code runs.
 */
export class Goodie extends Role {
  /** The actor associated with this Role */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // The default is that Goodies don't collide with anything
    actor?.rigidBody.setCollisionsEnabled(false);
  }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /** The code to run when the hero collects this goodie */
  onCollect: (g: Actor, h: Actor) => boolean;

  /**
   * Construct a Goodie role
   *
   * @param cfg           A description of how to configure the Goodie.
   * @param cfg.onCollect Code to run when a hero collects the goodie.  If you
   *                      do not provide a value, the default is that score[0]
   *                      will increase by one.
   */
  constructor(cfg: { onCollect?: (g: Actor, h: Actor) => boolean } = {}) {
    super();

    // Goodies don't collide with Goodies
    this.collisionRules.properties.push(CollisionExemptions.GOODIE);
    this.disableCollision(CollisionExemptions.GOODIE);

    // Provide a default onCollect handler
    this.onCollect = (cfg.onCollect) ? cfg.onCollect : () => { stage.score.addToGoodieCount(0, 1); return true; };
  }
}

/**
 * The destination role is most easily thought of in the context of a maze game:
 * when all heroes reach destinations, the level is won.
 */
export class Destination extends Role {
  /** The actor associated with this Role */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // The default is that Destinations don't collide with anything
    actor?.rigidBody.setCollisionsEnabled(false);
  }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /** the number of Heroes already in this Destination */
  private holding = 0;

  /** The number of Heroes that this Destination can hold */
  private capacity: number;

  /**
   * A custom, optional check before accepting a Hero.  Returns false if the
   * destination isn't ready to accept `h`.
   */
  private onAttemptArrival?: (h: Actor) => boolean;

  /**
   * Construct a Destination role
   *
   * @param cfg                   A description of how to configure the
   *                              Destination.
   * @param cfg.capacity          The number of Heroes this Destination can hold
   *                              (default 1)
   * @param cfg.onAttemptArrival  A custom, optional check to decide if the
   *                              Destination is "ready" to accept a Hero.
   */
  constructor(cfg: { capacity?: number, onAttemptArrival?: (h: Actor) => boolean } = {}) {
    super();

    this.collisionRules.properties.push(CollisionExemptions.DESTINATION);

    this.capacity = cfg.capacity ?? 1;
    this.onAttemptArrival = cfg.onAttemptArrival;
  }

  /**
   * Decide if a hero can be received by the destination, and if so, receive it
   *
   * @param h The hero who may be received by this destination
   *
   * @return True if the hero was accepted, false otherwise
   */
  public receive(h: Actor) {
    // capacity check
    if (this.holding >= this.capacity) return false;
    // custom test?
    if (this.onAttemptArrival && !this.onAttemptArrival(h)) return false;
    // it's allowed in... play a sound?
    this._actor?.sounds?.arrive?.play();
    this.holding++;
    return true;
  }
}

/**
 * Enemies are things to be avoided or defeated by the Hero. Enemies do damage
 * to heroes when they collide with heroes, and enemies can be defeated by other
 * Entities in a variety of ways.
 */
export class Enemy extends Role {
  /** The actor associated with this Role */
  public set actor(actor: Actor | undefined) { this._actor = actor; }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /** Code to run when this enemy (`e`) defeats a hero (`h`) */
  onDefeatHero?: (e: Actor, h: Actor) => void;

  /**
   * Code to run when this enemy (`e`) is defeated.  If an actor defeats `e`,
   * `a` will be defined
   */
  onDefeated?: (e: Actor, a?: Actor) => void;

  /**
   * Amount of damage this enemy does to a hero on a collision. The default is
   * 2, so that an enemy will defeat a hero and not disappear.
   */
  damage = 2;

  /** Does a crawling hero automatically defeat this enemy? */
  private set defeatByCrawl(val: boolean) {
    this._defeatByCrawl = val;
    // make sure heroes don't ricochet off of this enemy when defeating it
    // via crawling
    if (val) this.disableCollision(CollisionExemptions.CRAWL_HERO)
    else this.enableCollision(CollisionExemptions.CRAWL_HERO)
  }
  public get defeatByCrawl() { return this._defeatByCrawl; }
  private _defeatByCrawl = false;

  /** Does an in-air hero automatically defeat this enemy */
  public set defeatByJump(val: boolean) {
    this._defeatByJump = val;
    // make sure heroes don't ricochet off of this enemy when defeating it
    // via jumping
    if (val)
      this.disableCollision(CollisionExemptions.JUMP_HERO)
    else
      this.enableCollision(CollisionExemptions.JUMP_HERO)
  }
  public get defeatByJump() { return this._defeatByJump; }
  private _defeatByJump = false;

  /** When the enemy collides with an invincible hero, does the enemy survive */
  immuneToInvincibility: boolean;

  /**
   * When the enemy collides with an invincible hero, does it instantly defeat
   * the hero?
   */
  instantDefeat: boolean;

  /**
   * Construct an Enemy role
   *
   * @param cfg                       A description of how to configure the
   *                                  Enemy.
   * @param cfg.damage                The amount of damage the enemy does
   *                                  (default 2)
   * @param cfg.onDefeatHero          Code to run when defeating a hero
   * @param cfg.onDefeated            Code to run when this enemy is defeated
   * @param cfg.defeatByCrawl         Can the enemy be defeated by crawling
   * @param cfg.defeatByJump          Can the enemy be defeated by jumping?
   * @param cfg.disableHeroCollision  When the enemy collides with a hero,
   *                                  should they pass through each other?
   * @param cfg.immuneToInvincibility Does invincibility defeat the enemy?
   * @param cfg.instantDefeat         Should the enemy always defeat the hero on
   *                                  a collision
   */
  constructor(cfg: { damage?: number, onDefeatHero?: (e: Actor, h: Actor) => void, onDefeated?: (e: Actor, a?: Actor) => void, defeatByCrawl?: boolean, disableHeroCollision?: boolean, instantDefeat?: boolean, immuneToInvincibility?: boolean, defeatByJump?: boolean } = {}) {
    super();

    // Enemies don't collide with goodies or destinations
    this.collisionRules.properties.push(CollisionExemptions.ENEMY);
    this.disableCollision(CollisionExemptions.GOODIE);
    this.disableCollision(CollisionExemptions.DESTINATION);
    if (!!cfg.disableHeroCollision)
      this.disableCollision(CollisionExemptions.HERO);

    this.damage = cfg.damage ?? this.damage;
    this.onDefeatHero = cfg.onDefeatHero;
    this.onDefeated = cfg.onDefeated;
    this.defeatByCrawl = !!cfg.defeatByCrawl;
    this.defeatByJump = !!cfg.defeatByJump;
    this.immuneToInvincibility = !!cfg.immuneToInvincibility;
    this.instantDefeat = !!cfg.instantDefeat;

    stage.score.onEnemyCreated();
  }

  /**
   * When an enemy is defeated, this this code figures out how game play should
   * change.
   *
   * @param increaseScore Indicate if we should increase the score when this
   *                      enemy is defeated
   * @param h             The actor who defeated this enemy, if any
   */
  public defeat(increaseScore: boolean, h?: Actor) {
    if (this.onDefeated) this.onDefeated(this._actor!, h);

    // remove the enemy from the screen
    this._actor?.sounds.defeat?.play();
    this._actor!.remove();

    // possibly update score
    if (increaseScore) stage.score.onEnemyDefeated();
  }
}

/**
 * The Hero is the focal point of a game. While it is technically possible to
 * have many heroes, or invisible heroes that exist just so that the player has
 * to keep bad things from happening to the hero, it is usually the case that a
 * game has one hero who moves around on the screen, possibly with jumping and
 * crawling.
 */
export class Hero extends Role {
  /** The Actor to which this role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    actor?.rigidBody.body.SetType(b2BodyType.b2_dynamicBody);
  }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /**
   * Strength of the hero. This determines how many collisions with enemies
   * the hero can sustain before it is defeated. The default is 1, and the
   * default enemy damage amount is 2, so that the default behavior is for the
   * hero to be defeated on any collision with an enemy, with the enemy *not*
   * disappearing
   */
  public get strength() { return this._strength; }
  public set strength(amount: number) {
    let old = this._strength;
    this._strength = amount;
    if (old != amount && this.onStrengthChange)
      this.onStrengthChange(this._actor!);
  }
  private _strength = 1;

  /** Time until the hero's invincibility runs out */
  get invincibleRemaining() { return Math.max(0, this._invincibleRemaining / 1000); }
  set invincibleRemaining(amount: number) {
    this._invincibleRemaining = amount * 1000;
    if (amount != 0)
      this._actor!.state.changeState(this._actor!, StateEvent.INV_Y);
  }
  private _invincibleRemaining = 0;

  /**
   * For tracking if the game should end immediately when this hero is
   * defeated
   */
  public mustSurvive = false;

  /** Code to run when the hero's strength changes */
  public onStrengthChange?: (h: Actor) => void;

  /** Indicate that the hero can jump infinitely often while in the air */
  private allowMultiJump = false;

  /** Allow the hero to do > but not infinite jumps while in the air */
  private numJumpsAllowed = 1;

  /** Count how many jumps we have */
  private currJumps = 0;

  /** 
   * Construct a Hero role
   *
   * @param cfg                   Configuration information for the hero
   * @param cfg.strength          The hero's strength (default 1)
   * @param cfg.allowMultiJump    True if the hero can jump infinitely often
   *                              when in mid-jump
   * @param cfg.onStrengthChange  Code to run on any change to the hero's
   *                              strength
   * @param cfg.mustSurvive       Does the level end immediately if this hero is
   *                              defeated?
   * @param cfg.numJumpsAllowed   Use 2 to enable double-jumps, etc.
   */
  constructor(cfg: { strength?: number, allowMultiJump?: boolean, onStrengthChange?: (h: Actor) => void, mustSurvive?: boolean, numJumpsAllowed?: number } = {}) {
    super();

    // Heroes don't collide with goodies or destinations
    this.collisionRules.properties.push(CollisionExemptions.HERO);
    this.disableCollision(CollisionExemptions.GOODIE);
    this.disableCollision(CollisionExemptions.DESTINATION);

    stage.score.onHeroCreated();
    if (cfg.strength != undefined)
      this._strength = cfg.strength;
    this.allowMultiJump = !!cfg.allowMultiJump;
    this.numJumpsAllowed = Math.max(1, cfg.numJumpsAllowed ?? 0);
    this.onStrengthChange = cfg.onStrengthChange;
    this.mustSurvive = !!cfg.mustSurvive;

    this.prerenderTasks.push((elapsedMs: number) => {
      // determine when to turn off invincibility
      if (this._invincibleRemaining > 0) {
        this._invincibleRemaining -= elapsedMs;
        if (this._invincibleRemaining <= 0) {
          this._invincibleRemaining = 0;
          this._actor!.state.changeState(this._actor!, StateEvent.INV_N);
        }
      }

    })
  }

  /** Code to run immediately before rendering a Hero's Actor */
  prerender() {
  }

  /**
   * Code to run when a Hero collides with another Actor
   *
   * The Hero is the dominant participant in all collisions. Whenever the hero
   * collides with something, we need to figure out what to do
   *
   * @param other   Other object involved in this collision
   */
  onCollide(other: Actor) {
    // NB: we currently ignore Hero-Projectile and Hero-Hero collisions
    // Enemy collisions are complex, so we have that code in a separate function
    if (other.role instanceof Enemy) {
      this.onCollideWithEnemy(other.role);
      return true;
    }
    // Obstacle collisions are also complex, so they have a separate function
    // too
    else if (other.role instanceof Obstacle) {
      this.onCollideWithObstacle(other);
      return true;
    }
    // Destinations try to receive the hero
    else if (other.role instanceof Destination) {
      if (other.role.receive(this._actor!)) {
        stage.score.onDestinationArrive();
        this._actor!.remove();
      }
      return true;
    }
    // Sensors try to change the hero's behavior
    else if (other.role instanceof Sensor) {
      if (other.role.heroCollision)
        other.role.heroCollision(other, this._actor!);
      return true;
    }
    // Goodies get collected
    else if (other.role instanceof Goodie) {
      if (!other.role.onCollect(other, this._actor!)) return true;
      other.remove();
      stage.score.onGoodieCollected();
    }
    return false;
  }

  /**
   * Dispatch method for handling Hero collisions with Enemies
   *
   * @param enemy The enemy with which this hero collided
   */
  private onCollideWithEnemy(enemy: Enemy) {
    // if the enemy always defeats the hero, no matter what, then defeat the
    // hero
    if (enemy.instantDefeat) {
      this._actor!.remove();
      if (enemy.onDefeatHero) enemy.onDefeatHero(enemy.actor!, this._actor!);

      if (this.mustSurvive) stage.score.loseLevel();
      else stage.score.onDefeatHero();
      return;
    }
    // handle hero invincibility
    if (this._invincibleRemaining > 0) {
      // if the enemy is immune to invincibility, do nothing
      if (enemy.immuneToInvincibility) return;
      enemy.defeat(true, this._actor!);
    }
    // defeat by crawling?
    else if (this.actor?.state.current.crawling && enemy.defeatByCrawl) {
      enemy.defeat(true, this._actor!);
    }
    // defeat by jumping only if the hero's bottom is above the enemy's
    // head
    else if (this.actor?.state.current.jumping && enemy.defeatByJump &&
      ((this._actor!.rigidBody.getCenter().y) <= (enemy.actor!.rigidBody.getCenter().y))) {
      enemy.defeat(true, this._actor!);
    }
    // when we can't defeat it by losing strength, remove the hero
    else if (enemy.damage >= this._strength) {
      this._actor!.remove();
      if (enemy.onDefeatHero)
        enemy.onDefeatHero(enemy.actor!, this._actor!);

      if (this.mustSurvive) stage.score.loseLevel();
      else stage.score.onDefeatHero();
    }
    // when we can defeat it by losing strength
    else {
      this.strength = this.strength - enemy.damage;
      enemy.defeat(true, this._actor!);
    }
  }

  /**
   * Dispatch method for handling Hero collisions with Obstacles
   *
   * @param o The obstacle with which this hero collided
   */
  private onCollideWithObstacle(o: Actor) {
    let obstacle = o.role as Obstacle;
    // do we need to play a sound?
    obstacle.playCollideSound();

    // Did we collide with a sensor?
    let sensor = true;
    // The default is for all fixtures of a actor have the same sensor state
    let fixtures = this._actor!.rigidBody.body.GetFixtureList();
    if (fixtures != null)
      sensor = sensor && fixtures.IsSensor();

    // reset rotation of hero if this obstacle is not a sensor
    // if (this.currentRotation != 0 && !sensor) this.increaseRotation(-this.currentRotation);

    // if there is code attached to the obstacle for modifying the hero's
    // behavior, run it
    if (obstacle.heroCollision) obstacle.heroCollision(o, this._actor!);

    // If this is a wall with a suitable jumpReEnable side, then mark us not in
    // the air so we can do more jumps
    if (this.actor?.state.current.jumping || this.allowMultiJump) {
      let reenable = false;
      let h_t = this.actor!.rigidBody.getCenter().y - this.actor!.rigidBody.h / 2;
      let h_b = this.actor!.rigidBody.getCenter().y + this.actor!.rigidBody.h / 2;
      let h_l = this.actor!.rigidBody.getCenter().x - this.actor!.rigidBody.w / 2;
      let h_r = this.actor!.rigidBody.getCenter().x + this.actor!.rigidBody.w / 2;
      let o_t = obstacle.actor!.rigidBody.getCenter().y - obstacle.actor!.rigidBody.h / 2;
      let o_b = obstacle.actor!.rigidBody.getCenter().y + obstacle.actor!.rigidBody.h / 2;
      let o_l = obstacle.actor!.rigidBody.getCenter().x - obstacle.actor!.rigidBody.w / 2;
      let o_r = obstacle.actor!.rigidBody.getCenter().x + obstacle.actor!.rigidBody.w / 2;
      if (obstacle.jumpReEnableSides.indexOf(DIRECTION.N) > -1) reenable = reenable || (h_b <= o_t);
      if (obstacle.jumpReEnableSides.indexOf(DIRECTION.S) > -1) reenable = reenable || (h_t >= o_b);
      if (obstacle.jumpReEnableSides.indexOf(DIRECTION.E) > -1) reenable = reenable || (h_l <= o_r);
      if (obstacle.jumpReEnableSides.indexOf(DIRECTION.W) > -1) reenable = reenable || (h_r >= o_l);
      if (reenable) {
        this.collisionRules.properties = this.collisionRules.properties.filter(value => value != CollisionExemptions.JUMP_HERO);
        this.collisionRules.ignores = this.collisionRules.ignores.filter(value => value != CollisionExemptions.JUMP_HERO)
        this._actor!.state.changeState(this._actor!, StateEvent.JUMP_N);
      }
    }
  }

  /** Make the hero jump, unless it is in the air and not multi-jump */
  public jump(x: number, y: number) {
    if (!this.actor?.state.current.jumping) this.currJumps = 0;
    if (!this.allowMultiJump && this.currJumps >= this.numJumpsAllowed) return;
    this.currJumps += 1;

    this.collisionRules.properties = this.collisionRules.properties.filter(v => v != CollisionExemptions.JUMP_HERO);
    this.collisionRules.properties.push(CollisionExemptions.JUMP_HERO);

    let v = this._actor!.rigidBody.body.GetLinearVelocity() ?? { x: 0, y: 0 };
    x += v.x;
    y += v.y;
    this._actor!.rigidBody.breakDistJoints();
    this._actor!.rigidBody.body.SetLinearVelocity(new b2Vec2(x, y));

    this._actor!.state.changeState(this._actor!, StateEvent.JUMP_Y);
    this._actor?.sounds?.jump?.play();

    // suspend creation of sticky joints, so the hero can actually move
    this._actor!.rigidBody!.stickyDelay = window.performance.now() + 10;
  }

  /**
   * Put the hero in crawl mode.
   *
   * @param rotate The amount to rotate the actor when the crawl starts
   */
  public crawlOn(rotate: number) {
    if (!this._actor!.rigidBody || this.actor?.state.current.crawling) return;
    let body = this._actor!.rigidBody.body;
    this.collisionRules.properties = this.collisionRules.properties.filter(v => v != CollisionExemptions.CRAWL_HERO);
    this.collisionRules.properties.push(CollisionExemptions.CRAWL_HERO);
    let transform = new b2Transform();
    transform.SetPositionAngle(body.GetPosition(), body.GetAngle() + rotate);
    body.SetTransform(transform);
    this._actor!.state.changeState(this._actor!, StateEvent.CRAWL_Y);
  }

  /**
   * Take the hero out of crawl mode
   *
   * @param rotate The amount to rotate the actor when the crawl ends
   */
  public crawlOff(rotate: number) {
    if (!this.actor?.state.current.crawling || !this._actor!.rigidBody) return;
    let body = this._actor!.rigidBody.body;
    this.collisionRules.properties = this.collisionRules.properties.filter(value => value != CollisionExemptions.CRAWL_HERO)
    let transform = new b2Transform();
    transform.SetPositionAngle(body.GetPosition(), body.GetAngle() - rotate);
    body.SetTransform(transform);
    this._actor!.state.changeState(this._actor!, StateEvent.CRAWL_N);
  }

  /**
   * Change the rotation of the hero
   *
   * @param delta How much to add to the current rotation
   */
  public increaseRotation(delta: number) {
    let body = this._actor!.rigidBody.body;
    if (!body) return;
    let rot = body.GetAngle() + delta;
    body.SetAngularVelocity(0);
    let transform = new b2Transform();
    transform.SetPositionAngle(body.GetPosition(), rot);
    body.SetTransform(transform);
  }
}

/**
 * Obstacles are usually walls, except they can also move, and can be used in
 * all sorts of other ways.
 */
export class Obstacle extends Role {
  /** The actor associated with this Role */
  public set actor(actor: Actor | undefined) { this._actor = actor; }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /**
   * Construct an Obstacle role
   *
   * @param cfg                       Configuration information for the obstacle
   * @param cfg.heroCollision         Code to run when this obstacle collides
   *                                  with a hero
   * @param cfg.enemyCollision        Code to run when this obstacle collides
   *                                  with an enemy
   * @param cfg.disableHeroCollision  Should the hero bounce off of this
   *                                  obstacle?
   * @param cfg.jumpReEnableSides     Which sides "count" for letting a jumping
   *                                  hero jump again?
   */
  constructor(cfg: { heroCollision?: (thisActor: Actor, collideActor: Actor) => void, enemyCollision?: (thisActor: Actor, collideActor: Actor) => void, disableHeroCollision?: boolean, jumpReEnableSides?: DIRECTION[] } = {}) {
    super();

    this.collisionRules.properties.push(CollisionExemptions.OBSTACLE);

    this.heroCollision = cfg.heroCollision;
    this.enemyCollision = cfg.enemyCollision;
    if (cfg.disableHeroCollision) this.collisionRules.ignores.push(CollisionExemptions.HERO);
    // Switch from default jump-reenable sides (all) to just the specified ones
    if (cfg.jumpReEnableSides) {
      this.jumpReEnableSides = [];
      for (let s of cfg.jumpReEnableSides)
        this.jumpReEnableSides.push(s);
    }
  }

  /** Code to run when there is a collision involving this role's Actor */
  onCollide(other: Actor) {
    // NB: Hero and Projectile handle their collisions with obstacles for us :)
    if (other.role instanceof Enemy) {
      if (this.enemyCollision) this.enemyCollision(this._actor!, other);
      return true;
    }
    return false;
  }

  /** Code to run when a hero collides with this obstacle */
  heroCollision?: (thisActor: Actor, collideActor: Actor) => void;

  /** This is for when a projectile collides with an obstacle */
  onProjectileCollision?: (thisActor: Actor, collideActor: Actor) => boolean;

  /** This is for when an enemy collides with an obstacle */
  enemyCollision?: (thisActor: Actor, collideActor: Actor) => void;

  /** Which sides of this obstacle count as a "wall" to stop the current jump */
  public jumpReEnableSides = [DIRECTION.N, DIRECTION.S, DIRECTION.E, DIRECTION.W];

  /**
   * Internal method for playing a sound when a hero collides with this
   * obstacle.  Since collisions can repeat with high frequency, we use this to
   * avoid re-playing the sound before it even finishes.
   */
  public playCollideSound() {
    if (!this._actor?.sounds?.collide) return;
    if (!this._actor.sounds.collide.playing())
      this._actor.sounds.collide.play();
  }
}

/**
 * A sensor is something that a Hero can "pass through", which causes some code
 * to run.
 */
export class Sensor extends Role {
  /** The actor associated with this Role */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // Turn off collisions
    actor?.rigidBody.setCollisionsEnabled(false);
  }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /** 
   * Construct a Sensor by providing some code to run when a hero passes over
   * this sensor 
   *
   * @param heroCollision The code to run when the hero crosses the Sensor
   */
  constructor(public heroCollision?: (thisActor: Actor, collideActor: Actor) => void) {
    super();
    this.collisionRules.properties.push(CollisionExemptions.SENSOR);
  }
}

/**
 * Projectiles are actors that can be tossed from an actor's location, in order
 * to damage enemies
 */
export class Projectile extends Role {
  /** The Actor to which this role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // We need a dynamic body here:
    actor?.rigidBody.body.SetType(b2BodyType.b2_dynamicBody);
  }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /**
   * We have to ensure that projectiles don't continue traveling off screen
   * forever. This field lets us cap the distance away from the hero that a
   * projectile can travel before we make it disappear.
   */
  public range: number;

  /** This is the initial point from which the projectile was thrown */
  readonly rangeFrom = new b2Vec2(0, 0);

  /**
   * When projectiles collide, and they are not sensors, one will disappear.
   * We can keep both on screen by setting this false
   */
  public disappearOnCollide: boolean;

  /** How much damage does this projectile do? */
  public damage: number;

  /** Code to run when the projectile is reclaimed due to a collision */
  readonly reclaimer?: (actor: Actor) => void;

  /** A set of image names to randomly assign to projectiles' appearance */
  randomImageSources?: string[];

  /**
   * Construct a Projectile role
   *
   * @param cfg
   * @param cfg.damage              How much damage should the projectile do?
   *                                (default 1)
   * @param cfg.range               How far can the projectile travel before we
   *                                reclaim it (default 40 meters)
   * @param cfg.disappearOnCollide  Should the projectile disappear when it
   *                                collides with another projectile? (default
   *                                true)
   * @param cfg.reclaimer           Code to run when the projectile is reclaimed
   *                                due to a collision.
   * @param cfg.randomImageSources  An array of image names to use for the
   *                                appearance (assumes the appearance is an
   *                                ImageSprite)
   */
  constructor(cfg: { damage?: number, range?: number, disappearOnCollide?: boolean, reclaimer?: (actor: Actor) => void, randomImageSources?: string[] } = {}) {
    super();
    this.collisionRules.properties.push(CollisionExemptions.PROJECTILE);
    this.damage = cfg.damage ?? 1;
    this.range = cfg.range ?? 40;
    this.disappearOnCollide = cfg.disappearOnCollide ?? true;
    this.reclaimer = cfg.reclaimer;
    this.randomImageSources = cfg.randomImageSources;
  }

  /**
   * Code to run when a Projectile collides with an Actor
   *
   * @param other Other actor involved in this collision
   */
  onCollide(other: Actor) {
    // if this is an obstacle, check if it has a projectile callback, and if so,
    // call it
    if (other.role instanceof Obstacle) {
      let o = other.role;
      if (o.onProjectileCollision) {
        // Only disappear if it returns true
        if (o.onProjectileCollision(other, this._actor!)) {
          this._actor!.remove();
          if (this.reclaimer) this.reclaimer(this._actor!);
        }
        return true;
      }
      this._actor!.remove();
      if (this.reclaimer) this.reclaimer(this._actor!);
      return true;
    }
    if (other.role instanceof Projectile) {
      if (!this.disappearOnCollide) return true;
      // only disappear if other is not a sensor
      if (!other.rigidBody.getCollisionsEnabled()) {
        this._actor!.remove();
        if (this.reclaimer) this.reclaimer(this._actor!);
      }
      return true;
    }
    if (other.role instanceof Enemy) {
      // compute damage to determine if the enemy is defeated
      other.role.damage -= this.damage;
      if (other.role.damage <= 0) {
        // remove this enemy
        other.role.defeat(true, this._actor);
      }
      this._actor?.remove();
      if (this.reclaimer) this.reclaimer(this._actor!);
      return true;
    }
    return false;
  }

  /**
   * Toss a projectile. This is for tossing in a single, predetermined
   * direction
   *
   * @param actor     The actor who is performing the toss
   * @param offsetX   The x distance between the top left of the projectile and
   *                  the top left of the actor tossing the projectile
   * @param offsetY   The y distance between the top left of the projectile and
   *                  the top left of the actor tossing the projectile
   * @param velocityX The X velocity of the projectile when it is tossed
   * @param velocityY The Y velocity of the projectile when it is tossed
   */
  public tossFrom(actor: Actor, offsetX: number, offsetY: number, velocityX: number, velocityY: number) {
    // Get the actor, set its appearance, enable it
    let b = this.actor;
    if (!b) return;
    if (b.appearance instanceof AnimatedSprite) b.appearance.restartCurrentAnimation();
    if (this.randomImageSources) {
      let idx = Math.floor(Math.random() * this.randomImageSources!.length);
      (b.appearance as ImageSprite).setImage(this.randomImageSources![idx]);
    }
    b.enabled = true;

    // Compute the starting point, then toss it
    this.rangeFrom.Set(actor.rigidBody.getCenter().x + offsetX, actor.rigidBody.getCenter().y + offsetY);
    (b.movement as ProjectileMovement).tossFrom(this.rangeFrom, velocityX, velocityY);

    // Play a sound?  Animate the tossing actor?
    b.sounds?.toss?.play();
    actor.state.changeState(b, StateEvent.TOSS_Y);
  }

  /**
   * Toss a projectile. This is for tossing in the direction of a specified
   * point.
   *
   * @param fromX   X coordinate of the center of the actor doing the toss
   * @param fromY   Y coordinate of the center of the actor doing the toss
   * @param toX     X coordinate of the point at which to toss
   * @param toY     Y coordinate of the point at which to toss
   * @param actor   The actor who is performing the toss
   * @param offsetX The x distance between the top left of the projectile and
   *                the top left of the actor tossing the projectile
   * @param offsetY The y distance between the top left of the projectile and
   *                the top left of the actor tossing the projectile
   */
  public tossAt(fromX: number, fromY: number, toX: number, toY: number, actor: Actor, offsetX: number, offsetY: number) {
    // Get the actor, set its appearance, enable it
    let b = this.actor;
    if (!b) return;
    if (b.appearance instanceof AnimatedSprite) b.appearance.restartCurrentAnimation();
    if (this.randomImageSources) {
      let idx = Math.floor(Math.random() * this.randomImageSources!.length);
      (b.appearance as ImageSprite).setImage(this.randomImageSources![idx]);
    }
    b.enabled = true;

    // Compute the starting point, then toss it
    this.rangeFrom.Set(fromX + offsetX, fromY + offsetY);
    (b.movement as ProjectileMovement).tossAt(this.rangeFrom, fromX, fromY, toX, toY, offsetX, offsetY);

    // Play a sound?  Animate the tossing actor?
    b.sounds?.toss?.play();
    actor.state.changeState(b, StateEvent.TOSS_Y);
  }

  /**
   * Perform a "punch" using projectiles
   *
   * @param dx        The X distance between the actor's center and the punch
   *                  hitbox center
   * @param dy        The Y distance between the actor's center and the punch 
   *                  hitbox center
   * @param actor     The actor performing the punch
   * @param duration  How long should the punch last (in seconds)?
   */
  public punch(dx: number, dy: number, actor: Actor, duration: number) {
    const b = this.actor;
    if (!b) return;
    if (b.appearance instanceof AnimatedSprite) b.appearance.restartCurrentAnimation();
    b.enabled = true;
    // place it where we want it to be
    let axy = actor.rigidBody.getCenter();
    b.rigidBody.setCenter(axy.x + dx, axy.y + dy);
    // Weld it to the actor
    // set up a joint so the entity can't move too far
    let mDistJointDef = new b2DistanceJointDef();
    mDistJointDef.bodyA = b.rigidBody.body;
    mDistJointDef.bodyB = actor.rigidBody.body;
    mDistJointDef.localAnchorA.Set(0, 0);
    mDistJointDef.localAnchorB.Set(0, 0);
    mDistJointDef.collideConnected = false;
    mDistJointDef.damping = 0.1;
    mDistJointDef.stiffness = 2;
    mDistJointDef.length = Math.sqrt(dx * dx + dy * dy)

    let joint = b.rigidBody.body.GetWorld().CreateJoint(mDistJointDef);

    b.sounds?.toss?.play();
    actor.state.changeState(b, StateEvent.TOSS_Y);
    stage.world.timer.addEvent(new TimedEvent(duration, false, () => {
      b.enabled = false;
      b.rigidBody.body.GetWorld().DestroyJoint(joint);
      actor.state.changeState(b, StateEvent.TOSS_N);
      b.rigidBody.setVelocity(new b2Vec2(0, 0));
      if (this.reclaimer) this.reclaimer(b);
    }));
  }
}

/**
 * A Passive role is for things that barely even count as being part of the
 * game, like background images, HUD text, etc.
 */
export class Passive extends Role {
  /** The actor associated with this Role */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // Turn off collisions
    actor?.rigidBody.setCollisionsEnabled(false);
  }
  /** The actor associated with this Role */
  public get actor() { return this._actor; }

  /** Construct a Passive role */
  constructor() {
    super();
    this.collisionRules.properties.push(CollisionExemptions.PASSIVE);
  }
}

/** RoleComponent is the type of any role that an Actor can have */
export type RoleComponent = Hero | Goodie | Destination | Enemy | Obstacle | Sensor | Projectile | Passive;
