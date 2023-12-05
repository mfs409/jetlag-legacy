import { ImageSprite } from "../Components/Appearance";
import { Scene } from "../Entities/Scene";
import { stage } from "../Stage";

/**
 * These are the ways a level can be won automatically: by enough heroes
 * reaching a destination, by collecting enough goodies, by defeating enough
 * enemies, or by surviving long enough.  Of course, you can always just call
 * winLevel() or loseLevel() directly, too, but JetLag checks these
 * conditions automatically.
 */
enum VictoryType { DESTINATION, GOODIE_COUNT, ENEMY_COUNT, SURVIVE }

/**
 * Score tracks the progress of a player through a level of the game.  It runs
 * code on clock events, goodie collections, enemy defeats, hero defeats, and
 * destination arrivals, to decide when to automatically win or lose a level.
 */
export class ScoreSystem {
  /** How to build the next level if the current level is lost */
  public onLose = { level: 0, builder: (_level: number) => { } };

  /** How to build the next level if the current level is won */
  public onWin = { level: 0, builder: (_level: number) => { } };

  /** Describes how a level is won.  We default to DESTINATION. */
  private victoryType = VictoryType.DESTINATION;

  /** Statistics for winning when victoryType == DESTINATION */
  private destinationWinStats = {
    /** The number of heroes who must reach the destination */
    required: 0,
    /** The number of heroes who have reached the destination */
    arrived: 0,
  };

  /** Statistics for winning when victoryType == ENEMY_COUNT */
  private enemyWinStats = {
    /** The number of enemies that must be defeated.  Undefined == all */
    required: 0 as number | undefined,
    /** The number of enemies created so far */
    created: 0,
    /** The number of enemies defeated so far */
    defeated: 0,
  }

  /** Statistics for winning when victoryType == GOODIE_COUNT */
  private goodieWinStats = {
    /** The minimum number of each type of goodie that must be collected */
    required: [0, 0, 0, 0],
    /** How many of each goodie have been collected so far */
    collected: [0, 0, 0, 0],
  }

  /** Statistics for winning when victoryType == SURVIVE */
  private surviveWinStats = {
    /** The amount of time remaining */
    remaining: undefined as number | undefined,
  };

  /** Statistics for losing when all heroes are defeated */
  private heroLoseStats = {
    /** The number of heroes created */
    created: 0,
    /** The number of heroes defeated */
    defeated: 0,
  }

  /** Statistics for losing when time runs out */
  private timerLoseStats = {
    /** The remaining time */
    remaining: undefined as number | undefined,
  }

  /** A stopwatch, in case it's useful to have */
  public stopWatch = 0;

  /** Code for building an overlay to announce that current level is won */
  public winSceneBuilder?: (overlay: Scene, screenshot: ImageSprite) => void;

  /** Code for building an overlay to announce that current level is lost */
  public loseSceneBuilder?: (overlay: Scene, screenshot: ImageSprite) => void;

  /** Reset all the scores at the beginning of a new level */
  public reset() {
    this.victoryType = VictoryType.DESTINATION;
    this.destinationWinStats = { arrived: 0, required: 0 };
    this.enemyWinStats = { required: 0, created: 0, defeated: 0 };
    this.goodieWinStats = { required: [0, 0, 0, 0], collected: [0, 0, 0, 0] };
    this.surviveWinStats = { remaining: undefined };
    this.heroLoseStats = { created: 0, defeated: 0 };
    this.timerLoseStats = { remaining: undefined };
    this.stopWatch = 0;
  }

  /**
   * When a hero arrives at a destination, decide whether it means it is time
   * for the game to be won.
   */
  public onDestinationArrive() {
    this.destinationWinStats.arrived++;
    if (this.victoryType != VictoryType.DESTINATION) return;
    if (this.destinationWinStats.arrived >= this.destinationWinStats.required)
      this.winLevel();
  }

  /** Record that a goodie was collected, and possibly end the level */
  public onGoodieCollected() {
    // possibly win the level, but only if we win on goodie count and all
    // four counts are high enough
    if (this.victoryType != VictoryType.GOODIE_COUNT) return;
    for (let i = 0; i < 4; ++i)
      if (this.goodieWinStats.required[i] > this.goodieWinStats.collected[i]) return;
    this.winLevel();
  }

  /**
   * On every clock tick, update the countdowns and stopwatch. It may lead to
   * the level being won or lost.
   *
   * @param elapsedMs The milliseconds that have passed
   */
  public onClockTick(elapsedMs: number) {
    this.stopWatch += elapsedMs / 1000;

    if (this.timerLoseStats.remaining != undefined) {
      this.timerLoseStats.remaining -= elapsedMs / 1000;
      if (this.timerLoseStats.remaining < 0) this.loseLevel();
    }
    if (this.surviveWinStats.remaining) {
      this.surviveWinStats.remaining -= elapsedMs / 1000;
      if (this.victoryType != VictoryType.SURVIVE) return;
      if (this.surviveWinStats.remaining < 0) this.winLevel();
    }
  }

  /**
   * Indicate that a hero has been defeated.  This may cause the level to be
   * lost.
   */
  public onDefeatHero() {
    this.heroLoseStats.defeated++;
    if (this.heroLoseStats.defeated >= this.heroLoseStats.created)
      this.loseLevel();
  }

  /**
   * Indicate that an enemy was defeated.  This may cause the level to be won
   */
  public onEnemyDefeated() {
    this.enemyWinStats.defeated++;
    if (this.victoryType != VictoryType.ENEMY_COUNT) return;
    // defeat all enemies?
    if (this.enemyWinStats.required == undefined && this.enemyWinStats.defeated == this.enemyWinStats.created)
      this.winLevel();
    // a specific number of enemies?
    else if (this.enemyWinStats.required != undefined && this.enemyWinStats.defeated >= this.enemyWinStats.required)
      this.winLevel();
  }

  /** Return the number of enemies defeated */
  public getEnemiesDefeated() { return this.enemyWinStats.defeated; }

  /**
   * Indicate that the level should be won by some number of heroes reaching the
   * destination
   *
   * @param count The number of heroes that must reach the destination
   */
  public setVictoryDestination(count: number) {
    this.victoryType = VictoryType.DESTINATION;
    this.destinationWinStats.required = count;
  }

  /**
   * Indicate that the level is won by defeating a certain number of enemies or
   * by defeating all of the enemies, if not given an argument.
   *
   * @param count The number of enemies that must be defeated to win the
   *                level.  Leave blank if the answer is "all"
   */
  public setVictoryEnemyCount(count?: number) {
    this.victoryType = VictoryType.ENEMY_COUNT;
    this.enemyWinStats.required = count;
  }

  /**
   * Indicate that the level is won by collecting enough goodies.  To win, all
   * four goodie counts must be equal or greater than the values given to this
   * function.
   *
   * @param v0 Number of type-0 goodies that must be collected to win the level
   * @param v1 Number of type-1 goodies that must be collected to win the level
   * @param v2 Number of type-2 goodies that must be collected to win the level
   * @param v3 Number of type-3 goodies that must be collected to win the level
   */
  public setVictoryGoodies(v0: number, v1: number, v2: number, v3: number) {
    this.victoryType = VictoryType.GOODIE_COUNT;
    this.goodieWinStats.required = [v0, v1, v2, v3];
  }

  /**
   * Update a goodie count by adding a number to it
   *
   * @param which   Which goodie counter (0, 1, 2, or 3)
   * @param amount  How much should be added to it (can be negative!)
   */
  public addToGoodieCount(which: 0 | 1 | 2 | 3, amount: number) {
    this.goodieWinStats.collected[which] += amount;
  }

  /**
   * Update a goodie count by overwriting its value
   *
   * @param which Which goodie counter (0, 1, 2, or 3)
   * @param value The new value
   */
  public setGoodieCount(which: 0 | 1 | 2 | 3, amount: number) {
    this.goodieWinStats.collected[which] = amount;
  }

  /**
   * Return a goodie counter's value
   *
   * @param which Which goodie counter (0, 1, 2, or 3)
   */
  public getGoodieCount(which: 0 | 1 | 2 | 3) {
    return this.goodieWinStats.collected[which];
  }

  /** Return the time left on the lose countdown */
  public getLoseCountdownRemaining() { return this.timerLoseStats.remaining; }

  /**
   * Change the amount of time left on the lose countdown
   *
   * @param amount  The new time remaining
   */
  public setLoseCountdownRemaining(amount: number) {
    this.timerLoseStats.remaining = amount;
  }

  /** Return the time left on the win countdown */
  public getWinCountdownRemaining() { return this.surviveWinStats.remaining; }

  /**
   * Change the amount of time left on the win countdown
   *
   * @param amount  The new time remaining
   */
  public setWinCountdownRemaining(amount: number) {
    this.surviveWinStats.remaining = amount;
  }

  /** Return the time on the stopwatch */
  public getStopwatch() { return this.stopWatch; }

  /**
   * Change the amount of time on the stopwatch
   *
   * @param amount  The new stopwatch value
   */
  public setStopwatch(amount: number) { this.stopWatch = amount; }

  /** Indicate that an enemy has been created */
  public onEnemyCreated() { this.enemyWinStats.created += 1; }

  /** Indicate that a hero has been created */
  public onHeroCreated() { this.heroLoseStats.created += 1; }

  /** Return the number of heroes that have been defeated so far */
  public getHeroesDefeated() { return this.heroLoseStats.defeated; }

  /** Return the number of heroes that have arrived at a destination so far */
  public getDestinationArrivals() { return this.destinationWinStats.arrived; }

  /**
   * When a playable level is won, we run this code to shut it down, show an
   * overlay, and then invoke the JetLagManager to choose the next stage
   */
  public winLevel() {
    if (this.winSceneBuilder) stage.requestOverlay(this.winSceneBuilder);
    else stage.switchTo(this.onWin.builder, this.onWin.level);
  }

  /**
   * When a playable level is lost, we run this code to shut it down, show an
   * overlay, and then invoke the JetLagManager to choose the next stage
   */
  public loseLevel() {
    if (this.loseSceneBuilder) stage.requestOverlay(this.loseSceneBuilder);
    else stage.switchTo(this.onLose.builder, this.onLose.level);
  }
}
