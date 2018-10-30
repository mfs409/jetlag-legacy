import { Goodie } from "../../actor/Goodie";
import { JetLagStage } from "../JetLagStage";
import { Enemy } from "../../actor/Enemy";
import { Hero } from "../../actor/Hero";

/**
 * These are the ways a level can be won: by enough heroes reaching a
 * destination, by collecting enough goodies, or defeating enough enemies.
 *
 * Technically, there's also 'survive for x seconds', but that doesn't need
 * special support... just use DESTINATION and then don't make a destination :)  
 */
enum VictoryType {
  DESTINATION, GOODIECOUNT, ENEMYCOUNT
}

/** Score tracks the progress of a player through a level of the game */
export class Score {
  /** Describes how a level is won. */
  private victoryType: VictoryType;

  /** The number of heroes who must reach destinations to win by DESTINATION */
  private victoryHeroCount = 0;

  /** The number of goodies that must be collected to win by GOODIECOUNT */
  private victoryGoodieCount = [0, 0, 0, 0];

  /** The number of enemies to defeat to win by ENEMYCOUNT. -1 means "all" */
  private victoryEnemyCount = 0;

  /** Number of heroes who have arrived at any destination yet */
  private destinationArrivals = 0;

  /** The number of heroes that have been created */
  private heroesCreated = 0;

  /** The number of heroes that have been removed/defeated */
  private heroesDefeated = 0;

  /** The goodies that have been collected in this level */
  private goodiesCollected = [0, 0, 0, 0];

  /** The number of enemies that have been created */
  private enemiesCreated = 0;

  /** The enemies that have been defeated */
  private enemiesDefeated = 0;

  /** Time remaining before the level is lost.  -100 means "disabled" */
  private loseCountDownRemaining = -100;

  /** Time remaining before the level is won.  -100 means "disabled" */
  private winCountRemaining = -100;

  /** A stopwatch, in case it's useful to have.  -100 means "disabled" */
  private stopWatchProgress = -100;

  /**
   * Create a score object by setting its stage
   * 
   * @param stage The game-wide Stage object
   */
  constructor(private stage: JetLagStage) { }

  /** Reset all the scores at the beginning of a new level */
  public reset() {
    this.victoryType = VictoryType.DESTINATION;
    this.victoryHeroCount = 0;
    this.victoryGoodieCount = [0, 0, 0, 0];
    this.victoryEnemyCount = 0;
    this.destinationArrivals = 0;
    this.heroesCreated = 0;
    this.heroesDefeated = 0;
    this.goodiesCollected = [0, 0, 0, 0];
    this.enemiesCreated = 0;
    this.enemiesDefeated = 0;
    this.loseCountDownRemaining = -100;
    this.winCountRemaining = -100;
    this.stopWatchProgress = -100;
  }

  /**
   * When a hero arrives at a destination, decide whether it means it is time
   * for the game to be won.
   */
  public onDestinationArrive() {
    // check if the level is complete
    this.destinationArrivals++;
    if ((this.victoryType == VictoryType.DESTINATION)
      && (this.destinationArrivals >= this.victoryHeroCount)) {
      this.stage.endLevel(true);
    }
  }

  /**
   * Record that a goodie was collected, and possibly end the level
   *
   * @param goodie The goodie that was collected
   */
  public onGoodieCollected(goodie: Goodie) {
    // Update goodie counts
    for (let i = 0; i < 4; i++) {
      this.goodiesCollected[i] += goodie.getScore(i);
    }
    // possibly win the level, but only if we win on goodie count and all
    // four counts are high enough
    if (this.victoryType != VictoryType.GOODIECOUNT) {
      return;
    }
    for (let i = 0; i < 4; ++i) {
      if (this.victoryGoodieCount[i] > this.goodiesCollected[i]) {
        return;
      }
    }
    this.stage.endLevel(true);
  }

  /** 
   * Return the number of goodies collected
   * 
   * @param which The type of goodie to report (0-3)
   */
  public getGoodieCount(which: number) { return this.goodiesCollected[which]; }

  /**
   * Increment the goodie count
   * 
   * @param which The type of goodie to increment (0-3)
   */
  public incGoodieCount(which: number) { this.goodiesCollected[which]++; }

  /**
   * Set the number of goodies collected
   * @param which The type of goodie to set
   * @param val   The new value for that type of goodie
   */
  public setGoodieCount(which: number, val: number) {
    this.goodiesCollected[which] = val;
  }

  /** Report the time left in the lose countdown */
  public getLoseCountdown() { return this.loseCountDownRemaining; }

  /**
   * Set the amount of time left for a lose countdown
   * 
   * @param timeout The time until the level is lost
   */
  public setLoseCountdown(timeout: number) { this.loseCountDownRemaining = timeout; }

  /**
   * Add some time to the lose countdown
   * 
   * @param delta The amount of time to add
   */
  public extendLoseCountdown(delta: number) { this.loseCountDownRemaining += delta; }

  /** Report the time left in the win countdown */
  public getWinCountdown() { return this.winCountRemaining; }

  /**
   * Set the amount of time left for a win countdown
   * 
   * @param timeout The time until the level is won
   */
  public setWinCountdown(timeout: number) { this.winCountRemaining = timeout; }

  /** Report the time that has elapsed in the stopwatch */
  public getStopwatch() { let r = this.stopWatchProgress; return r == -100 ? 0 : r; }

  /** 
   * Set the amount of time in the stopwatch
   * 
   * @param val The amount of time that will be reported as having elapsed
   */
  public setStopwatch(val: number) { this.stopWatchProgress = val; }

  /** Register that a new hero has been created */
  public onHeroCreated() { this.heroesCreated++; }

  /** Register that a new enemy has been created */
  public onEnemyCreated() { this.enemiesCreated++; }

  /** 
   * On every clock tick, this is called to update the countdowns and stopwatch.
   * It may lead to the level needing to be won or lost, which is indicated by
   * the return value.
   *
   * @param elapsedMillis The milliseconds that have passed
   * 
   * @returns -1 to lose, 1 to win, 0 otherwise 
   */
  public onClockTick(elapsedMillis: number) {
    if (this.loseCountDownRemaining != -100) {
      this.loseCountDownRemaining -= elapsedMillis / 1000;
      if (this.loseCountDownRemaining < 0) {
        return -1;
      }
    }
    if (this.winCountRemaining != -100) {
      this.winCountRemaining -= elapsedMillis / 1000;
      if (this.winCountRemaining < 0) {
        return 1;
      }
    }
    if (this.stopWatchProgress != -100) {
      this.stopWatchProgress += elapsedMillis / 1000;
    }
    return 0;
  }

  /**
   * Indicate that a hero has been defeated.  This may cause the level to be
   * lost
   *
   * @param enemy The enemy who defeated the hero
   * @param hero  The hero who was defeated
   */
  public onDefeatHero(enemy: Enemy, hero: Hero) {
    // Lose if all enemies defeated, or if this hero had to survive
    this.heroesDefeated++;
    if (enemy.getOnDefeatHero()) {
      enemy.getOnDefeatHero()(enemy, hero);
    }
    if (hero.getMustSurvive()) {
      this.stage.endLevel(false);
    }
    if (this.heroesDefeated == this.heroesCreated) {
      this.stage.endLevel(false);
    }
  }

  /**
   * Indicate that an enemy was defeated.  This may cause the level to be won
   */
  public onEnemyDefeated() {
    // if we win by defeating enemies, see if we've defeated enough of them:
    this.enemiesDefeated++;
    if (this.victoryType != VictoryType.ENEMYCOUNT) {
      return;
    }
    // -1 means "defeat all enemies"
    if (this.victoryEnemyCount == -1
      && this.enemiesDefeated == this.enemiesCreated) {
      this.stage.endLevel(true);
    }
    // not -1 means "a specific number of enemies"
    if (this.victoryEnemyCount != -1
      && this.enemiesDefeated >= this.victoryEnemyCount) {
      this.stage.endLevel(true);
    }
  }

  /** Returns the number of enemies defeated */
  public getEnemiesDefeated() { return this.enemiesDefeated; }

  /**
   * Indicate that the level should be won by some number of heroes reaching the
   * destination
   * 
   * @param howmany The number of heroes that must reach the destination
   */
  public setWinDestination(howmany: number) {
    this.victoryType = VictoryType.DESTINATION;
    this.victoryHeroCount = howmany;
  }

  /**
   * Indicate that the level is won by defeating a certain number of enemies or
   * by defeating all of the enemies, if not given an argument.
   *
   * @param howMany The number of enemies that must be defeated to win the
   *                level.  Leave blank if the answer is "all"
   */
  public setVictoryEnemyCount(howMany?: number) {
    this.victoryType = VictoryType.ENEMYCOUNT;
    if (howMany) {
      this.victoryEnemyCount = howMany;
    } else {
      this.victoryEnemyCount = -1;
    }
  }

  /**
   * Indicate that the level is won by collecting enough goodies.  To win, all
   * four goodie counts must be equal or greater than the values given to this
   * function.
   *
   * @param v1 Number of type-1 goodies that must be collected to win the level
   * @param v2 Number of type-2 goodies that must be collected to win the level
   * @param v3 Number of type-3 goodies that must be collected to win the level
   * @param v4 Number of type-4 goodies that must be collected to win the level
   */
  public setVictoryGoodies(v1: number, v2: number, v3: number, v4: number) {
    this.victoryType = VictoryType.GOODIECOUNT;
    this.victoryGoodieCount = [v1, v2, v3, v4];
  }
}