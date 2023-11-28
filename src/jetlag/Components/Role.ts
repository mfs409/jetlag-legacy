import { b2Vec2, b2Transform, b2BodyType } from "@box2d/core";
import { Actor } from "../Entities/Actor";
import { stage } from "../Stage";
import { StateEvent } from "./StateManager";

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

  /**
   * Track if the hero is in the air, so that it can't jump when it isn't
   * touching anything. This does not quite work as desired, but is good
   * enough for JetLag.
   */
  // TODO: Why do we need this when we have a state machine?
  private inAir = false;

  /** Indicate that the hero can jump while in the air */
  // TODO: also support "double jump"?
  // TODO: why is jump part of hero instead of part of movement?
  public allowMultiJump = false;

  /** Is the hero currently in crawl mode? */
  // TODO: why is crawl part of hero instead of part of movement
  private crawling = false;

  // TODO: where should duck and climb go?

  /** For tracking the current amount of rotation of the hero */
  private currentRotation = 0;

  /** 
   * Construct a Hero role
   *
   * @param cfg                   Configuration information for the hero
   * @param cfg.strength          The hero's strength (default 1)
   * @param cfg.allowMultiJump    True if the hero can jump when in mid-jump
   * @param cfg.onStrengthChange  Code to run on any change to the hero's
   *                              strength
   * @param cfg.mustSurvive       Does the level end immediately if this hero is
   *                              defeated?
   */
  constructor(cfg: { strength?: number, allowMultiJump?: boolean, onStrengthChange?: (h: Actor) => void, mustSurvive?: boolean } = {}) {
    super();

    // Heroes don't collide with goodies or destinations
    this.collisionRules.properties.push(CollisionExemptions.HERO);
    this.disableCollision(CollisionExemptions.GOODIE);
    this.disableCollision(CollisionExemptions.DESTINATION);

    stage.score.onHeroCreated();
    if (cfg.strength != undefined)
      this._strength = cfg.strength;
    this.allowMultiJump = !!cfg.allowMultiJump;
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
    else if (this.crawling && enemy.defeatByCrawl) {
      enemy.defeat(true, this._actor!);
    }
    // defeat by jumping only if the hero's bottom is above the enemy's
    // head
    else if (this.inAir && enemy.defeatByJump &&
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
    if (this.currentRotation != 0 && !sensor) this.increaseRotation(-this.currentRotation);

    // if there is code attached to the obstacle for modifying the hero's
    // behavior, run it
    if (obstacle.heroCollision) obstacle.heroCollision(o, this._actor!);

    // If this is a wall, then mark us not in the air so we can do more
    // jumps. Note that sensors should not enable jumps for the hero.
    if ((this.inAir || this.allowMultiJump) && !sensor && obstacle.jumpReEnable) {
      this.collisionRules.properties = this.collisionRules.properties.filter(value => value != CollisionExemptions.JUMP_HERO);
      this.inAir = false;
      this.collisionRules.ignores = this.collisionRules.ignores.filter(value => value != CollisionExemptions.JUMP_HERO)
      this._actor!.state.changeState(this._actor!, StateEvent.JUMP_N);
    }
  }

  /** Make the hero jump, unless it is in the air and not multi-jump */
  public jump(x: number, y: number) {
    // NB: multi-jump prevents us from ever setting mInAir, so this is safe:
    if (this.inAir) return;

    this.collisionRules.properties = this.collisionRules.properties.filter(v => v != CollisionExemptions.JUMP_HERO);
    this.collisionRules.properties.push(CollisionExemptions.JUMP_HERO);

    let v = this._actor!.rigidBody.body.GetLinearVelocity() ?? { x: 0, y: 0 };
    x += v.x;
    y += v.y;
    this._actor!.rigidBody.breakDistJoints();
    this._actor!.rigidBody.body.SetLinearVelocity(new b2Vec2(x, y));

    if (!this.allowMultiJump) this.inAir = true;
    this._actor!.state.changeState(this._actor!, StateEvent.JUMP_Y);
    this._actor?.sounds?.jump?.play();

    // suspend creation of sticky joints, so the hero can actually move
    this._actor!.rigidBody!.props.stickyDelay = window.performance.now() + 10;
  }

  /**
   * Put the hero in crawl mode.
   *
   * @param rotate The amount to rotate the actor when the crawl starts
   */
  crawlOn(rotate: number) {
    if (!this._actor!.rigidBody || this.crawling) return;
    let body = this._actor!.rigidBody.body;
    this.collisionRules.properties = this.collisionRules.properties.filter(v => v != CollisionExemptions.CRAWL_HERO);
    this.collisionRules.properties.push(CollisionExemptions.CRAWL_HERO);
    this.crawling = true;
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
    if (!this.crawling || !this._actor!.rigidBody) return;
    let body = this._actor!.rigidBody.body;
    this.collisionRules.properties = this.collisionRules.properties.filter(value => value != CollisionExemptions.CRAWL_HERO)
    this.crawling = false;
    let transform = new b2Transform();
    transform.SetPositionAngle(body.GetPosition(), body.GetAngle() - rotate);
    body.SetTransform(transform);
    this._actor!.state.changeState(this._actor!, StateEvent.CRAWL_N);
  }

  /**
   * Change the rotation of the hero if it is in the middle of a jump
   *
   * @param delta How much to add to the current rotation
   */
  // TODO: Why only if in the middle of a jump?
  public increaseRotation(delta: number) {
    let body = this._actor!.rigidBody.body;
    if (!body) return;
    if (this.inAir) {
      this.currentRotation += delta;
      body.SetAngularVelocity(0);
      let transform = new b2Transform();
      transform.SetPositionAngle(body.GetPosition(), this.currentRotation);
      body.SetTransform(transform);
    }
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
   * @param cfg.jumpReEnable          Does colliding with this obstacle mean the
   *                                  hero can jump again (default true)
   */
  constructor(cfg: { heroCollision?: (thisActor: Actor, collideActor: Actor) => void, enemyCollision?: (thisActor: Actor, collideActor: Actor) => void, disableHeroCollision?: boolean, jumpReEnable?: false } = {}) {
    super();

    this.collisionRules.properties.push(CollisionExemptions.OBSTACLE);

    this.heroCollision = cfg.heroCollision;
    this.enemyCollision = cfg.enemyCollision;
    if (cfg.disableHeroCollision) this.collisionRules.ignores.push(CollisionExemptions.HERO);
    this.jumpReEnable = (cfg.jumpReEnable == undefined) ? true : cfg.jumpReEnable;
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
  onProjectileCollision?: (thisActor: Actor, collideActor: Actor) => void;

  /** This is for when an enemy collides with an obstacle */
  enemyCollision?: (thisActor: Actor, collideActor: Actor) => void;

  /** Indicate that this obstacle counts as a "wall", and stops the current jump */
  public jumpReEnable = true;

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

  /** This is the initial point from which the projectile was thrown */
  readonly rangeFrom = new b2Vec2(0, 0);

  /**
   * We have to ensure that projectiles don't continue traveling off-screen
   * forever. This field lets us cap the distance away from the hero that a
   * projectile can travel before we make it disappear.
   */
  public range: number;

  /**
   * When projectiles collide, and they are not sensors, one will disappear.
   * We can keep both on screen by setting this false
   */
  public disappearOnCollide: boolean;

  /** How much damage does this projectile do? */
  public damage: number;

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
   */
  constructor(cfg: { damage?: number, range?: number, disappearOnCollide?: boolean } = {}) {
    super();
    this.collisionRules.properties.push(CollisionExemptions.PROJECTILE);
    this.damage = cfg.damage ?? 1;
    this.range = cfg.range ?? 40;
    this.disappearOnCollide = cfg.disappearOnCollide ?? true;
  }

  /**
   * Code to run when a Projectile collides with an Actor
   *
   * @param other   Other object involved in this collision
   */
  onCollide(other: Actor) {
    // if this is an obstacle, check if it has a projectile callback, and if so,
    // call it
    if (other.role instanceof Obstacle) {
      let o = other.role;
      if (o.onProjectileCollision) {
        o.onProjectileCollision(other, this._actor!);
        // return... don't remove the projectile... the obstacle will handle
        // that
        return true;
      }
      this._actor!.remove();
      return true;
    }
    if (other.role instanceof Projectile) {
      if (!this.disappearOnCollide) return true;
      // only disappear if other is not a sensor
      if (!other.rigidBody.getCollisionsEnabled()) {
        this._actor!.remove();
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
      return true;
    }
    return false;
  }

  /**
   * Draw a projectile.  When drawing a projectile, we first check if it is
   * too far from its starting point.  We only draw it if it is not.
   *
   * @param elapsedMs The number of milliseconds since the last render
   */
  // TODO: Is this too coupled with the ActorPool?
  public prerender(_elapsedMs: number) {
    let body = this._actor!.rigidBody.body;
    if (!body || !body.IsEnabled()) return;
    // eliminate the projectile quietly if it has traveled too far
    let dx = Math.abs(body.GetPosition().x - this.rangeFrom.x);
    let dy = Math.abs(body.GetPosition().y - this.rangeFrom.y);
    if (dx * dx + dy * dy > this.range * this.range)
      this._actor!.remove();
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
