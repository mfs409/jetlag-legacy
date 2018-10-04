import { Goodie } from "../renderables/Goodie";

/**
 * These are the ways you can complete a level: you can reach the destination,
 * you can collect enough stuff, or you can reach a certain number of enemies
 * defeated.
 *
 * Technically, there's also 'survive for x seconds', but that doesn't need
 * special support
 */
enum VictoryType {
  DESTINATION, GOODIECOUNT, ENEMYCOUNT
}

/**
 * Score tracks the progress of a player through a level of the game
 */
export class Score {
  /** This is the number of goodies that must be collected, if we're in GOODIECOUNT mode */
  private victoryGoodieCount: number[] = [0, 0, 0, 0];

  /** Track the number of heroes that have been created */
  heroesCreated: number;

  /** Count of the goodies that have been collected in this level */
  goodiesCollected: Array<number>;

  /** Count the number of enemies that have been created */
  enemiesCreated: number;

  /** Count the enemies that have been defeated */
  enemiesDefeated: number;

  /** Describes how a level is won. */
  private victoryType: VictoryType;

  /** 
   * In levels that have a lose-on-timer feature, we store the timer here, so 
   * that we can extend the time left to complete a game 
   * 
   * NB: -1 indicates the timer is not active
   */
  loseCountDownRemaining: number;

  /** Time that must pass before the level ends in victory */
  winCountRemaining: number;

  /** This is a stopwatch, for levels where we count how long the game has been running */
  stopWatchProgress: number;

  /** This is how far the hero has traveled */
  distance: number;

  /** Track the number of heroes that have been removed/defeated */
  heroesDefeated: number;

  /** Number of heroes who have arrived at any destination yet */
  destinationArrivals: number;

  /** This is the number of heroes who must reach destinations, if we're in DESTINATION mode */
  victoryHeroCount: number;

  /** The number of enemies that must be defeated, if we're in ENEMYCOUNT mode. -1 means "all" */
  private victoryEnemyCount: number;

  /**
   * Reset all the scores at the beginning of a new level
   */
  reset() {
    this.victoryGoodieCount = [0, 0, 0, 0];
    this.heroesCreated = 0;
    this.goodiesCollected = [0, 0, 0, 0];
    this.enemiesCreated = 0;
    this.enemiesDefeated = 0;
    this.loseCountDownRemaining = -100;
    this.winCountRemaining = -100;
    this.stopWatchProgress = -100;
    this.distance = 0;
    this.heroesDefeated = 0;
    this.destinationArrivals = 0;
    this.victoryType = VictoryType.DESTINATION;
  }

  /**
   * When a hero arrives at a destination, decide whether it means it is time
   * for the game to be won.
   */
  onDestinationArrive() {
    // check if the level is complete
    this.destinationArrivals++;
    return ((this.victoryType == VictoryType.DESTINATION) && (this.destinationArrivals >= this.victoryHeroCount));
  }

  /**
   * Record that a goodie was collected, and possibly end the level
   *
   * @param goodie The goodie that was collected
   */
  onGoodieCollected(goodie: Goodie): boolean {
    // Update goodie counts
    for (let i = 0; i < 4; i++) {
      this.goodiesCollected[i] += goodie.score[i];
    }
    // possibly win the level, but only if we win on goodie count and all
    // four counts are high enough
    if (this.victoryType != VictoryType.GOODIECOUNT) {
      return false;
    }
    let match: boolean = true;
    for (let i = 0; i < 4; ++i) {
      match = match && (this.victoryGoodieCount[i] <= this.goodiesCollected[i]);
    }
    return match;
  }

  /**
   * Record that an enemy was defeated, and possibly end the level in victory
   */
  onEnemyDefeated(): boolean {
    // update the count of defeated enemies
    this.enemiesDefeated++;
    // if we win by defeating enemies, see if we've defeated enough of them:
    let win: boolean = false;
    if (this.victoryType == VictoryType.ENEMYCOUNT) {
      // -1 means "defeat all enemies"
      if (this.victoryEnemyCount == -1) {
        win = this.enemiesDefeated == this.enemiesCreated;
      } else {
        win = this.enemiesDefeated >= this.victoryEnemyCount;
      }
    }
    return win;
  }

  /**
   * Indicate that the level should be won by some number of heroes reaching the
   * destination
   */
  setWinDestination() {
    this.victoryType = VictoryType.DESTINATION;
  }

  /**
   * Indicate that the level is won by defeating a certain number of enemies or
   * by defeating all of the enemies, if not given an argument.
   *
   * @param howMany The number of enemies that must be defeated to win the
   *                level.  Leave blank if the answer is "all"
   */
  setVictoryEnemyCount(howMany?: number): void {
    this.victoryType = VictoryType.ENEMYCOUNT;
    if (howMany) {
      this.victoryEnemyCount = howMany;
    } else {
      this.victoryEnemyCount = -1;
    }
  }

  /**
   * Indicate that the level is won by collecting enough goodies
   *
   * @param v1 Number of type-1 goodies that must be collected to win the level
   * @param v2 Number of type-2 goodies that must be collected to win the level
   * @param v3 Number of type-3 goodies that must be collected to win the level
   * @param v4 Number of type-4 goodies that must be collected to win the level
   */
  public setVictoryGoodies(v1: number, v2: number, v3: number, v4: number): void {
    this.victoryType = VictoryType.GOODIECOUNT;
    this.victoryGoodieCount[0] = v1;
    this.victoryGoodieCount[1] = v2;
    this.victoryGoodieCount[2] = v3;
    this.victoryGoodieCount[3] = v4;
  }
}