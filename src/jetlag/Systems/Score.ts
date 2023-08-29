// Last review: 08-10-2023

import { Enemy, Hero } from "../Components/Role";
import { Actor } from "../Entities/Actor";
import { Scene } from "../Entities/Scene";
import { game } from "../Stage";

/** Types of stages in the game */
export enum StageTypes { SPLASH = 0, HELP = 1, CHOOSER = 2, STORE = 3, PLAY = 4 }

/**
 * These are the ways a level can be won: by enough heroes reaching a
 * destination, by collecting enough goodies, or defeating enough enemies.
 *
 * Technically, there's also 'survive for x seconds', but that doesn't need
 * special support... just use DESTINATION and then don't make a destination :)
 */
enum VictoryType { DESTINATION, GOODIE_COUNT, ENEMY_COUNT }

/** Score tracks the progress of a player through a level of the game */
export class ScoreSystem {
  /** The level to go to if the current level ends in failure */
  public levelOnFail = { index: 0, which: StageTypes.PLAY };

  /** The level to go to if the current level ends in success */
  public levelOnWin = { index: 0, which: StageTypes.PLAY };

  /** Describes how a level is won. */
  private victoryType = VictoryType.DESTINATION;

  /** The number of heroes who must reach destinations to win by DESTINATION */
  private victoryHeroCount = 0;

  /** The number of goodies that must be collected to win by GOODIE_COUNT */
  private victoryGoodieCount = [0, 0, 0, 0];

  /** The number of enemies to defeat to win by ENEMY_COUNT. -1 means "all" */
  private victoryEnemyCount = 0;

  /** Number of heroes who have arrived at any destination yet */
  private destinationArrivals = 0;

  /** The number of heroes that have been created */
  public heroesCreated = 0;

  /** The number of heroes that have been removed/defeated */
  private heroesDefeated = 0;

  /** The goodies that have been collected in this level */
  public goodieCount = [0, 0, 0, 0];

  /** The number of enemies that have been created */
  public enemiesCreated = 0;

  /** The enemies that have been defeated */
  private enemiesDefeated = 0;

  /** Time remaining before the level is lost */
  public loseCountDownRemaining?: number;

  /** Time remaining before the level is won */
  public winCountRemaining?: number;

  /** A stopwatch, in case it's useful to have */
  public stopWatchProgress?: number;

  /** Code for building the scene to show when the current level is won */
  public winSceneBuilder?: (overlay: Scene) => void;

  /** Code for building the scene to show when the current level is lost */
  public loseSceneBuilder?: (overlay: Scene) => void;

  /** Reset all the scores at the beginning of a new level */
  public reset() {
    this.victoryType = VictoryType.DESTINATION;
    this.victoryHeroCount = 0;
    this.victoryGoodieCount = [0, 0, 0, 0];
    this.victoryEnemyCount = 0;
    this.destinationArrivals = 0;
    this.heroesCreated = 0;
    this.heroesDefeated = 0;
    this.goodieCount = [0, 0, 0, 0];
    this.enemiesCreated = 0;
    this.enemiesDefeated = 0;
    this.loseCountDownRemaining = undefined;
    this.winCountRemaining = undefined;
    this.stopWatchProgress = undefined;
  }

  /**
   * When a hero arrives at a destination, decide whether it means it is time
   * for the game to be won.
   */
  public onDestinationArrive() {
    // check if the level is complete
    this.destinationArrivals++;
    if (this.victoryType == VictoryType.DESTINATION && this.destinationArrivals >= this.victoryHeroCount)
      this.endLevel(true);
  }

  /**
   * Record that a goodie was collected, and possibly end the level
   *
   * @param goodie The goodie that was collected
   */
  public onGoodieCollected() {
    // possibly win the level, but only if we win on goodie count and all
    // four counts are high enough
    if (this.victoryType != VictoryType.GOODIE_COUNT) return;
    for (let i = 0; i < 4; ++i)
      if (this.victoryGoodieCount[i] > this.goodieCount[i]) return;
    this.endLevel(true);
  }

  /**
   * On every clock tick, this is called to update the countdowns and stopwatch.
   * It may lead to the level needing to be won or lost, which is indicated by
   * the return value.
   *
   * @param elapsedMs The milliseconds that have passed
   *
   * @returns -1 to lose, 1 to win, 0 otherwise
   *
   * TODO: It would be better to return an enum
   */
  public onClockTick(elapsedMs: number) {
    if (this.loseCountDownRemaining) {
      this.loseCountDownRemaining -= elapsedMs / 1000;
      if (this.loseCountDownRemaining < 0) return -1;
    }
    if (this.winCountRemaining) {
      this.winCountRemaining -= elapsedMs / 1000;
      if (this.winCountRemaining < 0) return 1;
    }
    if (this.stopWatchProgress != undefined) {
      this.stopWatchProgress += elapsedMs / 1000;
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
  public onDefeatHero(enemy: Actor, hero: Actor) {
    if (!(enemy.role instanceof Enemy) || !(hero.role instanceof Hero)) return;
    // Lose if all enemies defeated, or if this hero had to survive
    this.heroesDefeated++;
    if (enemy.role.onDefeatHero)
      enemy.role.onDefeatHero(enemy, hero);
    if (hero.role.mustSurvive)
      this.endLevel(false);
    else if (this.heroesDefeated == this.heroesCreated)
      this.endLevel(false);
  }

  /**
   * Indicate that an enemy was defeated.  This may cause the level to be won
   */
  public onEnemyDefeated() {
    // if we win by defeating enemies, see if we've defeated enough of them:
    this.enemiesDefeated++;
    if (this.victoryType != VictoryType.ENEMY_COUNT)
      return;
    // -1 means "defeat all enemies"
    if (this.victoryEnemyCount == -1 && this.enemiesDefeated == this.enemiesCreated)
      this.endLevel(true);
    // not -1 means "a specific number of enemies"
    if (this.victoryEnemyCount != -1 && this.enemiesDefeated >= this.victoryEnemyCount)
      this.endLevel(true);
  }

  /** Returns the number of enemies defeated */
  public getEnemiesDefeated() { return this.enemiesDefeated; }

  /**
   * Indicate that the level should be won by some number of heroes reaching the
   * destination
   *
   * @param how_many The number of heroes that must reach the destination
   */
  public setVictoryDestination(how_many: number) {
    this.victoryType = VictoryType.DESTINATION;
    this.victoryHeroCount = how_many;
  }

  /**
   * Indicate that the level is won by defeating a certain number of enemies or
   * by defeating all of the enemies, if not given an argument.
   *
   * @param how_many The number of enemies that must be defeated to win the
   *                level.  Leave blank if the answer is "all"
   */
  public setVictoryEnemyCount(how_many?: number) {
    this.victoryType = VictoryType.ENEMY_COUNT;
    this.victoryEnemyCount = how_many ?? -1;
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
    this.victoryType = VictoryType.GOODIE_COUNT;
    this.victoryGoodieCount = [v1, v2, v3, v4];
  }

  /** Return the number of heroes that have been defeated so far */
  public getHeroesDefeated() { return this.heroesDefeated; }

  /** Return the number of heroes that have arrived at a destination so far */
  public getDestinationArrivals() { return this.destinationArrivals; }

  /**
   * When a playable level ends, we run this code to shut it down, show an
   * overlay, and then invoke the JetLagManager to choose the next stage
   *
   * @param win true if the level was won, false otherwise
   */
  public endLevel(win: boolean) {
    if (win) {
      if (this.winSceneBuilder) {
        game.installOverlay(this.winSceneBuilder);
      } else {
        if (this.levelOnWin.which == StageTypes.PLAY) game.switchTo(game.config.levelBuilder, this.levelOnWin.index);
        else if (this.levelOnWin.which == StageTypes.CHOOSER) game.switchTo(game.config.chooserBuilder, this.levelOnWin.index);
        else game.switchTo(game.config.splashBuilder, this.levelOnWin.index);
      }
    } else {
      if (this.loseSceneBuilder) {
        game.installOverlay(this.loseSceneBuilder);
      } else {
        if (this.levelOnFail.which == StageTypes.PLAY) game.switchTo(game.config.levelBuilder, this.levelOnFail.index);
        else if (this.levelOnFail.which == StageTypes.CHOOSER) game.switchTo(game.config.chooserBuilder, this.levelOnFail.index);
        else game.switchTo(game.config.splashBuilder, this.levelOnFail.index);
      }
    }
  }

  /** Quit the game.  Stop the music before quitting. */
  public doQuit() {
    game.stageMusic.stopMusic();
    game.exit();
  }
}
