/**
 * Score tracks the progress of a player through a level of the game
 */
export class Score {
  /** This is the number of goodies that must be collected, if we're in GOODIECOUNT mode */
  mVictoryGoodieCount: number[] = [0, 0, 0, 0];

  /** Track the number of heroes that have been created */
  mHeroesCreated: number;

  /** Count of the goodies that have been collected in this level */
  mGoodiesCollected: Array<number>;

  /** Count the number of enemies that have been created */
  mEnemiesCreated: number;

  /** Count the enemies that have been defeated */
  mEnemiesDefeated: number;

  /** 
   * In levels that have a lose-on-timer feature, we store the timer here, so 
   * that we can extend the time left to complete a game 
   * 
   * NB: -1 indicates the timer is not active
   */
  mLoseCountDownRemaining: number;

  /** Time that must pass before the level ends in victory */
  mWinCountRemaining: number;

  /** This is a stopwatch, for levels where we count how long the game has been running */
  mStopWatchProgress: number;

  /** This is how far the hero has traveled */
  mDistance: number;

  /** Track the number of heroes that have been removed/defeated */
  mHeroesDefeated: number;

  /** Number of heroes who have arrived at any destination yet */
  mDestinationArrivals: number;

  /** This is the number of heroes who must reach destinations, if we're in DESTINATION mode */
  mVictoryHeroCount: number;

  /** The number of enemies that must be defeated, if we're in ENEMYCOUNT mode. -1 means "all" */
  mVictoryEnemyCount: number;

  /**
   * Reset all the scores at the beginning of a new level
   */
  reset() {
    this.mVictoryGoodieCount = [0, 0, 0, 0];
    this.mHeroesCreated = 0;
    this.mGoodiesCollected = [0, 0, 0, 0];
    this.mEnemiesCreated = 0;
    this.mEnemiesDefeated = 0;
    this.mLoseCountDownRemaining = -100;
    this.mWinCountRemaining = -100;
    this.mStopWatchProgress = -100;
    this.mDistance = 0;
    this.mHeroesDefeated = 0;
    this.mDestinationArrivals = 0;
  }
}