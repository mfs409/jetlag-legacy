import { b2Contact, b2Vec2, b2Transform, b2BodyType } from "@box2d/core";
import { Actor } from "../Entities/Actor";
import { game } from "../Stage";
import { ISound } from "../Services/AudioService";
import { StateEvent } from "./StateManager";

/**
 * These are the different reasons why two entities might pass through each
 * other, even when the collide with everything else
 *
 * TODO: We could gain some efficiency by switching to a bitmask
 */
export enum CollisionExemptions {
  CRAWL_HERO = 0,
  JUMP_HERO = 1,
  DESTINATION = 2,
  GOODIE = 3,
  HERO = 4,
  PROJECTILE = 5,
  ENEMY = 6,
  SENSOR = 7,
  OBSTACLE = 8,
  // TODO: Does PASSIVE need a different role than SENSOR?
}

/** Role is the base class for all of the roles that an actor can play */
class Role {
  /**
   * collisionRules lets us say which behaviors this actor has, and which
   * behaviors of other actors it might not want to collide with
   */
  collisionRules = {
    role: [] as CollisionExemptions[],
    ignore: [] as CollisionExemptions[]
  }

  /**
   * Indicate that when this actor collides with a hero, it should not pass
   * through
   */
  public enableHeroCollision() { this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.HERO); }

  /**
   * Indicate that when this actor collides with a hero, it should pass through
   */
  public disableHeroCollision() { this.collisionRules.ignore.push(CollisionExemptions.HERO); }

  /**
   * Indicate that when this actor collides with a goodie, it should not pass
   * through
   */
  public enableGoodieCollision() { this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.GOODIE); }

  /**
   * Indicate that when this actor collides with a goodie, it should pass
   * through
   */
  public disableGoodieCollision() { this.collisionRules.ignore.push(CollisionExemptions.GOODIE); }

  /**
   * Indicate that when this actor collides with a destination, it should not
   * pass through
   */
  public enableDestinationCollision() { this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.DESTINATION); }

  /**
   * Indicate that when this actor collides with a destination, it should pass
   * through
   */
  public disableDestinationCollision() { this.collisionRules.ignore.push(CollisionExemptions.DESTINATION); }

  /**
   * Indicate that when this actor collides with an enemy, it should not pass
   * through
   */
  public enableEnemyCollision() { this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.ENEMY); }

  /**
   * Indicate that when this actor collides with an enemy, it should pass
   * through
   */
  public disableEnemyCollision() { this.collisionRules.ignore.push(CollisionExemptions.ENEMY); }

  /**
   * Indicate that when this actor collides with a projectile, it should not
   * pass through
   */
  public enableProjectileCollision() { this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.PROJECTILE); }

  /**
   * Indicate that when this actor collides with a projectile, it should pass
   * through
   */
  public disableProjectileCollision() { this.collisionRules.ignore.push(CollisionExemptions.PROJECTILE); }

  /**
   * Indicate that when this actor collides with an obstacle, it should not
   * pass through
   */
  public enableObstacleCollision() { this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.OBSTACLE); }

  /**
   * Indicate that when this actor collides with an obstacle, it should pass
   * through
   */
  public disableObstacleCollision() { this.collisionRules.ignore.push(CollisionExemptions.OBSTACLE); }
}

/**
 * The goodie role is most easily thought of as a coin.  When the hero collides
 * with the coin, the coin disappears, and the score increases by 1.  This means
 * we need a small edit to the Goodie's Actor: we don't want the hero to bounce
 * off of a coin when collecting it!
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
  /** The Actor to which this Goodie role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // Turn off collisions
    actor?.rigidBody?.setCollisionsEnabled(false);
  }
  public get actor() { return this._actor; }
  private _actor?: Actor;

  /** The code to run when the hero collects this goodie */
  onCollect: (g: Actor, h: Actor) => boolean;

  /**
   * Construct a Goodie role
   *
   * @param onCollect Code to run when a hero collides with this goodie
   */
  constructor(cfg: { onCollect?: (g: Actor, h: Actor) => boolean } = {}) {
    super();

    // Goodies don't collide with Goodies
    this.collisionRules.role.push(CollisionExemptions.GOODIE);
    this.disableGoodieCollision();

    // Provide a default onCollect handler
    this.onCollect = (cfg.onCollect) ? cfg.onCollect : (_g: Actor, _h: Actor) => { game.score.goodieCount[0]++; return true; };
  }

  /**
   * Code to run when there is a collision involving this role's Actor.
   *
   * NB: The Hero role will handle the collision, so the Goodie doesn't have to
   * do anything.
   */
  onCollide(_other: Actor, _contact: b2Contact) { return false; }

  /** Code to run immediately before rendering this role's Actor */
  prerender(_elapsedMs: number) { }
}


/**
 * The destination role is useful for indicating that when a hero reaches a
 * certain point, it means the level has been won.
 */
export class Destination extends Role {
  /** The Actor to which this Destination role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    actor?.rigidBody?.setCollisionsEnabled(false);
  }
  public get actor() { return this._actor }
  private _actor?: Actor;

  /** the number of Heroes already in this Destination */
  private holding = 0;

  /** The sound to play when a hero arrives at this destination */
  private arrivalSound?: ISound;

  /** The number of Heroes that this Destination can hold */
  private capacity: number;

  /** A custom, optional check before accepting a Hero */
  private onAttemptArrival?: (h: Actor) => boolean;

  /**
   * Construct a Destination role
   *
   * @param capacity          The number of Heroes that this Destination can
   *                          hold
   * @param arrivalSound      The sound to play when a hero arrives at this
   *                          destination
   * @param onAttemptArrival  A custom, optional check to decide if the
   *                          Destination is "ready" to accept a Hero
   */
  constructor(cfg: { capacity?: number, arrivalSound?: string, onAttemptArrival?: (h: Actor) => boolean } = {}) {
    super();

    this.collisionRules.role.push(CollisionExemptions.DESTINATION);

    if (cfg.arrivalSound) this.arrivalSound = game.musicLibrary.getSound(cfg.arrivalSound);
    this.capacity = cfg.capacity ?? 1;
    this.onAttemptArrival = cfg.onAttemptArrival;
  }

  /**
   * Code to run when there is a collision involving this role's Actor.
   *
   * NB: The Hero role will handle the collision, so the Destination doesn't
   *     have to do anything.
   */
  onCollide(_other: Actor, _contact: b2Contact) { return false; }

  /** Code to run immediately before rendering this role's Actor */
  prerender(_elapsedMs: number) { }

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
    // it's allowed in... play a sound
    this.holding++;
    if (this.arrivalSound) this.arrivalSound.play();
    return true;
  }
}

/**
 * Enemies are things to be avoided or defeated by the Hero. Enemies do damage
 * to heroes when they collide with heroes, and enemies can be defeated by other
 * Entities in a variety of ways.
 */
export class Enemy extends Role {
  /** The Actor to which this Enemy role is attached */
  public actor?: Actor | undefined;

  /** A callback to run when this enemy defeats a hero */
  onDefeatHero?: (e: Actor, h: Actor) => void;

  /**
   * A callback to run when this enemy is defeated.  If an actor caused the
   * defeat, then `a` will be that actor
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
    if (val)
      this.collisionRules.ignore.push(CollisionExemptions.CRAWL_HERO)
    else
      this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.CRAWL_HERO)
  }
  public get defeatByCrawl() { return this._defeatByCrawl; }
  private _defeatByCrawl = false;

  /** Does an in-air hero automatically defeat this enemy */
  public set defeatByJump(val: boolean) {
    this._defeatByJump = val;
    // make sure heroes don't ricochet off of this enemy when defeating it
    // via jumping
    if (val)
      this.collisionRules.ignore.push(CollisionExemptions.JUMP_HERO)
    else
      this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.JUMP_HERO)
  }
  public get defeatByJump() { return this._defeatByJump; }
  private _defeatByJump = false;


  /** When the enemy collides with an invincible hero, does the enemy survive */
  immuneToInvincibility = false;

  /**
   * When the enemy collides with an invincible hero, does it instantly defeat
   * the hero?
   */
  instantDefeat = false;

  /**
   * Construct an Enemy role
   *
   * @param damage                The amount of damage the enemy does (default
   *                              2)
   * @param onDefeatHero          Code to run when defeating a hero
   * @param onDefeated            Code to run when this enemy is defeated
   * @param defeatByCrawl         Can the enemy be defeated by crawling
   * @param defeatByJump          Can the enemy be defeated by jumping?
   * @param immuneToInvincibility Does invincibility defeat the enemy?
   * @param instantDefeat         Should the enemy always defeat the hero on a
   *                              collision
   */
  constructor(cfg: { damage?: number, onDefeatHero?: (e: Actor, h: Actor) => void, onDefeated?: (e: Actor, a?: Actor) => void, defeatByCrawl?: boolean, disableHeroCollision?: boolean, instantDefeat?: boolean, immuneToInvincibility?: boolean, defeatByJump?: boolean } = {}) {
    super();

    // Enemies don't collide with goodies or destinations
    this.collisionRules.role.push(CollisionExemptions.ENEMY);
    this.disableGoodieCollision();
    this.disableDestinationCollision();

    game.score.enemiesCreated++;
    if (cfg.damage != undefined)
      this.damage = cfg.damage;
    this.onDefeatHero = cfg.onDefeatHero;
    this.onDefeated = cfg.onDefeated;
    this.defeatByCrawl = !!cfg.defeatByCrawl;
    this.defeatByJump = !!cfg.defeatByJump;
    if (!!cfg.disableHeroCollision)
      this.collisionRules.ignore.push(CollisionExemptions.HERO);
    this.immuneToInvincibility = !!cfg.immuneToInvincibility;
    this.instantDefeat = !!cfg.instantDefeat;
  }

  /** Code to run immediately before rendering this role's Actor */
  prerender(_elapsedMs: number) { }

  /**
   * Code to run when there is a collision involving this role's Actor.
   *
   * NB: The Hero / Obstacle / Projectile role will handle the collision, so the
   *     Enemy doesn't have to do anything.
   */
  onCollide(_other: Actor, _contact: b2Contact) { return false; }

  /**
   * When an enemy is defeated, this this code figures out how game play should
   * change.
   *
   * @param increaseScore Indicate if we should increase the score when this
   *                      enemy is defeated
   * @param h The hero who defeated this enemy, if it was a hero defeat
   */
  public defeat(increaseScore: boolean, h?: Actor) {
    if (this.onDefeated) this.onDefeated(this.actor!, h);

    // remove the enemy from the screen
    this.actor!.remove(false);

    // possibly update score
    if (increaseScore) game.score.onEnemyDefeated();
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
    actor?.rigidBody?.body.SetType(b2BodyType.b2_dynamicBody);
  }
  public get actor() { return this._actor; }
  private _actor?: Actor | undefined;

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
    if (old != amount && this.strengthChangeCallback)
      this.strengthChangeCallback(this.actor!);
  }
  private _strength = 1;


  /** Time until the hero's invincibility runs out */
  get invincibleRemaining() { return Math.max(0, this._invincibleRemaining / 1000); }
  set invincibleRemaining(amount: number) {
    this._invincibleRemaining = amount * 1000;
    this.actor!.state.changeState(this.actor!, StateEvent.INVINCIBLE_START);
  }
  private _invincibleRemaining = 0;

  /**
   * For tracking if the game should end immediately when this hero is
   * defeated
   */
  public mustSurvive = false;

  /** Code to run when the hero's strength changes */
  public strengthChangeCallback?: (h: Actor) => void;

  /**
   * Track if the hero is in the air, so that it can't jump when it isn't
   * touching anything. This does not quite work as desired, but is good
   * enough for JetLag.
   */
  private inAir = false;

  /** Indicate that the hero can jump while in the air */
  public allowMultiJump = false;

  /** Sound to play when a jump occurs */
  private jumpSound?: ISound;

  /** Is the hero currently in crawl mode? */
  private crawling = false;

  /** For tracking the current amount of rotation of the hero */
  private currentRotation = 0;

  /** 
   * Construct a Hero role
   *
   * @param strength                The hero's strength (default 1)
   * @param jumpSound               A sound to play when jumping
   * @param allowMultiJump          True if the hero can jump when in mid-jump
   * @param strengthChangeCallback  Code to run on any change to the hero's
   *                                strength
   * @param mustSurvive             Does the level end immediately if this hero
   *                                is defeated?
   */
  constructor(cfg: { strength?: number, jumpSound?: string, allowMultiJump?: boolean, strengthChangeCallback?: (h: Actor) => void, mustSurvive?: boolean } = {}) {
    super();

    // Heroes don't collide with goodies or destinations
    this.collisionRules.role.push(CollisionExemptions.HERO);
    this.disableGoodieCollision();
    this.disableDestinationCollision();

    game.score.heroesCreated++;
    if (cfg.strength != undefined)
      this._strength = cfg.strength;
    if (cfg.jumpSound)
      this.jumpSound = game.musicLibrary.getSound(cfg.jumpSound);
    this.allowMultiJump = !!cfg.allowMultiJump;
    this.strengthChangeCallback = cfg.strengthChangeCallback;
    this.mustSurvive = !!cfg.mustSurvive;
  }

  /** Code to run immediately before rendering a Hero's Actor */
  prerender(elapsedMs: number) {
    // determine when to turn off invincibility
    if (this._invincibleRemaining > 0) {
      this._invincibleRemaining -= elapsedMs;
      if (this._invincibleRemaining <= 0) {
        this._invincibleRemaining = 0;
        this.actor!.state.changeState(this.actor!, StateEvent.INVINCIBLE_STOP);
      }
    }
  }

  /**
   * Code to run when a Hero collides with another Actor
   *
   * The Hero is the dominant participant in all collisions. Whenever the hero
   * collides with something, we need to figure out what to do
   *
   * @param other   Other object involved in this collision
   * @param contact A description of the contact that caused this collision
   */
  onCollide(other: Actor, contact: b2Contact) {
    // NB: we currently ignore Hero-Projectile and Hero-Hero collisions
    // Enemy collisions are complex, so we have that code in a separate function
    if (other.role instanceof Enemy) {
      this.onCollideWithEnemy(other.role);
      return true;
    }
    // Obstacle collisions are also complex, so they have a separate function
    // too
    else if (other.role instanceof Obstacle) {
      this.onCollideWithObstacle(other, contact);
      return true;
    }
    // Destinations try to receive the hero
    else if (other.role instanceof Destination) {
      if (other.role.receive(this.actor!)) {
        game.score.onDestinationArrive();
        // hide the hero quietly, since the destination might make a sound
        this.actor!.remove(true);
      }
      return true;
    }
    // Sensors try to change the hero's behavior
    else if (other.role instanceof Sensor) {
      if (other.role.heroCollision)
        other.role.heroCollision(other, this.actor!, contact);
      return true;
    }
    // Goodies get collected
    else if (other.role instanceof Goodie) {
      if (!other.role.onCollect(other, this.actor!)) return true;
      other.remove(false);
      game.score.onGoodieCollected();
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
      this.actor!.remove(false);
      game.score.onDefeatHero(enemy.actor!, this.actor!);
      return;
    }
    // handle hero invincibility
    if (this._invincibleRemaining > 0) {
      // if the enemy is immune to invincibility, do nothing
      if (enemy.immuneToInvincibility) return;
      enemy.defeat(true, this.actor!);
    }
    // defeat by crawling?
    else if (this.crawling && enemy.defeatByCrawl) {
      enemy.defeat(true, this.actor!);
    }
    // defeat by jumping only if the hero's bottom is above the enemy's
    // head
    else if (this.inAir && enemy.defeatByJump &&
      ((this.actor!.rigidBody?.getCenter().y ?? 0) <=
        (enemy.actor!.rigidBody?.getCenter().y ?? 0))) {
      enemy.defeat(true, this.actor!);
    }
    // when we can't defeat it by losing strength, remove the hero
    else if (enemy.damage >= this._strength) {
      this.actor!.remove(false);
      game.score.onDefeatHero(enemy.actor!, this.actor!);
    }
    // when we can defeat it by losing strength
    else {
      this.strength = this.strength - enemy.damage;
      enemy.defeat(true, this.actor!);
    }
  }

  /**
   * Dispatch method for handling Hero collisions with Obstacles
   *
   * @param o The obstacle with which this hero collided
   */
  private onCollideWithObstacle(o: Actor, contact: b2Contact) {
    // do we need to play a sound?
    (o.role as Obstacle).playCollideSound();

    // Did we collide with a sensor?
    let sensor = true;
    // The default is for all fixtures of a actor have the same sensor state
    let fixtures = this.actor!.rigidBody?.body.GetFixtureList();
    if (fixtures)
      sensor = sensor && fixtures.IsSensor();

    // reset rotation of hero if this obstacle is not a sensor
    if (this.currentRotation != 0 && !sensor) this.increaseRotation(-this.currentRotation);

    // if there is code attached to the obstacle for modifying the hero's
    // behavior, run it
    if ((o.role as Obstacle).heroCollision)
      (o.role as Obstacle).heroCollision!(o, this.actor!, contact);


    // If this is a wall, then mark us not in the air so we can do more
    // jumps. Note that sensors should not enable jumps for the hero.
    if ((this.inAir || this.allowMultiJump) && !sensor && (o.role as Obstacle).jumpReEnable) {
      this.collisionRules.role = this.collisionRules.role.filter(value => value != CollisionExemptions.JUMP_HERO);
      this.inAir = false;
      this.collisionRules.ignore = this.collisionRules.ignore.filter(value => value != CollisionExemptions.JUMP_HERO)
      this.actor!.state.changeState(this.actor!, StateEvent.JUMP_STOP);
    }
  }

  /** Make the hero jump, unless it is in the air and not multi-jump */
  jump(x: number, y: number) {
    // NB: multi-jump prevents us from ever setting mInAir, so this is safe:
    if (this.inAir) return;

    this.collisionRules.role = this.collisionRules.role.filter(v => v != CollisionExemptions.JUMP_HERO);
    this.collisionRules.role.push(CollisionExemptions.JUMP_HERO);

    let v = this.actor!.rigidBody?.body.GetLinearVelocity() ?? { x: 0, y: 0 };
    x += v.x;
    y += v.y;
    this.actor!.rigidBody?.breakJoints();
    this.actor!.rigidBody?.body.SetLinearVelocity(new b2Vec2(x, y));

    if (!this.allowMultiJump) this.inAir = true;
    this.actor!.state.changeState(this.actor!, StateEvent.JUMP_START);
    if (this.jumpSound) this.jumpSound.play();

    // suspend creation of sticky joints, so the hero can actually move
    this.actor!.rigidBody!.props.stickyDelay = window.performance.now() + 10;
  }

  /**
   * Put the hero in crawl mode.
   *
   * @param rotate The amount to rotate the actor when the crawl starts
   */
  crawlOn(rotate: number) {
    if (!this.actor!.rigidBody || this.crawling) return;
    let body = this.actor!.rigidBody?.body;
    this.collisionRules.role = this.collisionRules.role.filter(v => v != CollisionExemptions.CRAWL_HERO);
    this.collisionRules.role.push(CollisionExemptions.CRAWL_HERO);
    this.crawling = true;
    let transform = new b2Transform();
    transform.SetPositionAngle(body.GetPosition(), body.GetAngle() + rotate);
    body.SetTransform(transform);
    this.actor!.state.changeState(this.actor!, StateEvent.CRAWL_START);
  }

  /**
   * Take the hero out of crawl mode
   *
   * @param rotate The amount to rotate the actor when the crawl ends
   */
  public crawlOff(rotate: number) {
    if (!this.crawling || !this.actor!.rigidBody) return;
    let body = this.actor!.rigidBody?.body;
    this.collisionRules.role = this.collisionRules.role.filter(value => value != CollisionExemptions.CRAWL_HERO)
    this.crawling = false;
    let transform = new b2Transform();
    transform.SetPositionAngle(body.GetPosition(), body.GetAngle() - rotate);
    body.SetTransform(transform);
    this.actor!.state.changeState(this.actor!, StateEvent.CRAWL_STOP);
  }

  /**
   * Change the rotation of the hero if it is in the middle of a jump
   *
   * @param delta How much to add to the current rotation
   */
  public increaseRotation(delta: number) {
    let body = this.actor!.rigidBody?.body;
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
 * Obstacles are usually walls, except they can move, and can be used to run all
 * sorts of arbitrary code that changes the game, or the behavior of the things
 * that collide with them.
 */
export class Obstacle extends Role {
  /** The Actor to which this Hero role is attached */
  public actor?: Actor | undefined;

  /**
   * Construct an Obstacle role
   *
   * @param heroCollision         Code to run when this obstacle collides with a
   *                              hero
   * @param enemyCollision        Code to run when this obstacle collides with
   *                              an enemy
   * @param disableHeroCollision  Should the hero bounce off of this obstacle?
   * @param jumpReEnable          Does colliding with this obstacle mean the
   *                              hero can jump again (default true)
   */
  constructor(cfg: { heroCollision?: (thisActor: Actor, collideActor: Actor, contact: b2Contact) => void, enemyCollision?: (thisActor: Actor, collideActor: Actor, contact: b2Contact) => void, disableHeroCollision?: boolean, jumpReEnable?: false } = {}) {
    super();

    this.collisionRules.role.push(CollisionExemptions.OBSTACLE);

    this.heroCollision = cfg.heroCollision;
    this.enemyCollision = cfg.enemyCollision;
    if (cfg.disableHeroCollision) this.collisionRules.ignore.push(CollisionExemptions.HERO);
    this.jumpReEnable = (cfg.jumpReEnable == undefined) ? true : cfg.jumpReEnable;
  }

  /**
   * Code to run when there is a collision involving this role's Actor.
   *
   * NB: We only need to handle Obstacle-Enemy collisions
   */
  onCollide(other: Actor, contact: b2Contact) {
    if (other.role instanceof Enemy) {
      if (this.enemyCollision) this.enemyCollision(this.actor!, other, contact);
      return true;
    }
    return false;
  }

  /** Code to run immediately before rendering this role's Actor */
  prerender(_elapsedMs: number) { }

  /** Code to run when a hero collides with this obstacle */
  heroCollision?: (thisActor: Actor, collideActor: Actor, contact: b2Contact) => void;

  /** This callback is for when a projectile collides with an obstacle */
  projectileCollision?: (thisActor: Actor, collideActor: Actor, contact: b2Contact) => void;

  /** This callback is for when an enemy collides with an obstacle */
  enemyCollision?: (thisActor: Actor, collideActor: Actor, contact: b2Contact) => void;

  /** Indicate that this obstacle counts as a "wall", and stops the current jump */
  public jumpReEnable = true;

  /**
   * A sound to play when the obstacle is hit by a hero
   *
   * TODO: It's not clear we still use this
   */
  private collideSound?: ISound;

  /** how long to delay (in ms) between attempts to play the collide sound */
  private collideSoundDelay = 0;

  /** Time of last collision sound */
  private lastCollideSoundTime = 0;

  /**
   * Internal method for playing a sound when a hero collides with this
   * obstacle
   */
  public playCollideSound() {
    if (!this.collideSound) return;

    // Make sure we have waited long enough since the last time we played the sound
    let now = new Date().getTime();
    if (now < this.lastCollideSoundTime + this.collideSoundDelay) return;
    this.lastCollideSoundTime = now;
    this.collideSound.play();
  }
}

/**
 * A sensor is something that an Actor can "pass through", which causes some
 * code to run.
 */
export class Sensor extends Role {
  /** The Actor to which this Hero role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // Turn off collisions
    actor?.rigidBody?.setCollisionsEnabled(false);
  }
  public get actor() { return this._actor; }
  private _actor?: Actor | undefined;

  /** Code to run when there is a collision involving this role's Actor. */
  onCollide(_other: Actor, _contact: b2Contact) { return false; }

  /** Code to run immediately before rendering this role's Actor */
  prerender(_elapsedMs: number) { }

  /** 
   * Construct a Sensor by providing some code to run when a hero passes over
   * this sensor 
   *
   * @param heroCollision The code to run when the hero crosses the Sensor
   */
  constructor(public heroCollision?: (thisActor: Actor, collideActor: Actor, contact: b2Contact) => void) {
    super();

    this.collisionRules.role.push(CollisionExemptions.SENSOR);
  }
}

/** Projectiles are actors that can be thrown from an actor's location */
export class Projectile extends Role {
  /** The Actor to which this role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // We need a dynamic body here:
    actor?.rigidBody?.body.SetType(b2BodyType.b2_dynamicBody);
  }
  public get actor() { return this._actor; }
  private _actor?: Actor | undefined;

  /** This is the initial point from which the projectile was thrown */
  readonly rangeFrom = new b2Vec2(0, 0);

  /**
   * We have to be careful in side-scrolling games, or else projectiles can
   * continue traveling off-screen forever. This field lets us cap the
   * distance away from the hero that a projectile can travel before we make
   * it disappear.
   */
  public range;

  /**
   * When projectiles collide, and they are not sensors, one will disappear.
   * We can keep both on screen by setting this false
   */
  public disappearOnCollide;

  /** How much damage does this projectile do? */
  public damage;

  /**
   * Construct a Projectile role
   *
   * @param damage  How much damage should the projectile do?
   */
  constructor(cfg: { damage?: number, range?: number, disappearOnCollide?: boolean } = {}) {
    super();

    this.collisionRules.role.push(CollisionExemptions.PROJECTILE);
    this.damage = cfg.damage ?? 1;
    // TODO: Is it OK to have a default cap on the range?
    this.range = cfg.range ?? 40;
    this.disappearOnCollide = cfg.disappearOnCollide ?? true;
  }

  /**
   * Code to run when a Projectile collides with an Actor
   *
   * @param other   Other object involved in this collision
   * @param contact A description of the contact that caused this collision
   */
  onCollide(other: Actor, contact: b2Contact) {
    // if this is an obstacle, check if it is a projectile callback, and if
    // so, do the callback
    if (other.role instanceof Obstacle) {
      let o = other.role;
      if (o.projectileCollision) {
        o.projectileCollision(other, this.actor!, contact);
        // return... don't remove the projectile
        return true;
      }
      this.actor!.remove(false);
      return true;
    }
    if (other.role instanceof Projectile) {
      if (!this.disappearOnCollide) return true;
      // only disappear if other is not a sensor
      if (!other.rigidBody?.getCollisionsEnabled()) {
        this.actor!.remove(false);
      }
      return true;
    }
    if (other.role instanceof Enemy) {
      // compute damage to determine if the enemy is defeated
      other.role.damage -= this.damage;
      if (other.role.damage <= 0) {
        // remove this enemy
        other.role.defeat(true, this.actor);
        // hide the projectile quietly, so that the sound of the enemy can
        // be heard
        this.actor?.remove(true);
      } else {
        // hide the projectile
        this.actor?.remove(false);
      }
      return true;
    }
    return false;
  }

  /**
   * Draw a projectile.  When drawing a projectile, we first check if it is
   * too far from its starting point. We only draw it if it is not.
   *
   * @param elapsedMs The number of milliseconds since the last render
   */
  public prerender(_elapsedMs: number) {
    let body = this.actor!.rigidBody?.body;
    if (!body || !body.IsEnabled()) return;
    // eliminate the projectile quietly if it has traveled too far
    let dx = Math.abs(body.GetPosition().x - this.rangeFrom.x);
    let dy = Math.abs(body.GetPosition().y - this.rangeFrom.y);
    if (dx * dx + dy * dy > this.range * this.range)
      this.actor!.remove(true);
  }
}

/**
 * A Passive role is for things that barely even count as being part of the
 * game, like background images, HUD text, etc.
 */
export class Passive extends Role {
  /** The Actor to which this Hero role is attached */
  public set actor(actor: Actor | undefined) {
    this._actor = actor;
    // Turn off collisions
    actor?.rigidBody?.setCollisionsEnabled(false);
  }
  public get actor() { return this._actor; }
  private _actor?: Actor | undefined;

  /**
   * Code to run when there is a collision involving this role's Actor.
   *
   * NB: The Hero role will handle the collision, so the Goodie doesn't have to
   * do anything.
   */
  onCollide(_other: Actor, _contact: b2Contact) { return false; }

  /** Code to run immediately before rendering this role's Actor */
  prerender(_elapsedMs: number) { }

  /** Construct a Passive role */
  constructor() {
    super();
    this.collisionRules.role.push(CollisionExemptions.SENSOR);
  }
}

/** RoleComponent is the type of any role that an Actor can have */
export type RoleComponent = Hero | Goodie | Destination | Enemy | Obstacle | Sensor | Projectile | Passive;
