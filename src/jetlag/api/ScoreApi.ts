import { JetLagStage } from "../internal/JetLagStage";

/**
 * ScoreApi provides an interface for configuring everything related to keeping
 * track of the score of the game.  This includes a "fact" interface for holding
 * information about the current level, session, and game, setting the
 * conditions for how a level is won or lost, tracking hero progress, managing
 * timers, and interfacing with the counters for the number of goodies that have
 * been collected.
 */
export class ScoreApi {
    /**
     * Construct the ScoreApi
     *
     * @param manager the JetLagManager for the game
     */
    constructor(private stage: JetLagStage) { }

    /**
     * Look up a fact that was stored on the device, and which will persist from
     * one run of the game to the next.  If no such fact exists, defaultVal will
     * be returned.
     *
     * @param factName   The name used to store the fact
     * @param defaultVal The value to return if the fact does not exist
     * @return The most recently stored value for the provided factName
     */
    public getGameFact(factName: string, defaultVal: string) {
        return this.stage.device.getStorage().getPersistent(factName, defaultVal);
    }

    /**
     * Look up a fact that was stored for the current level, and which will
     * reset as soon as the level is won or lost. If no such fact exists,
     * defaultVal will be returned.
     *
     * @param factName   The name used to store the fact
     * @param defaultVal The value to return if the fact does not exist
     * @return The most recently stored value for the provided factName
     */
    public getLevelFact(factName: string, defaultVal: string) {
        return this.stage.device.getStorage().getLevel(factName, defaultVal);
    }

    /**
     * Look up a fact that was stored for the current game session, and which
     * will not get erased until the game is closed/exited. If no such fact
     * exists, defaultVal will be returned.
     *
     * @param factName   The name used to store the fact
     * @param defaultVal The value to return if the fact does not exist
     * @return The most recently stored value for the provided factName
     */
    public getSessionFact(factName: string, defaultVal: string) {
        return this.stage.device.getStorage().getSession(factName, defaultVal);
    }

    /**
     * Save a fact about the current level. If the factName has already been
     * used for this level, the new value will overwrite the old.
     *
     * @param factName  The name for the fact being saved
     * @param factValue The value to save
     */
    public setLevelFact(factName: string, factValue: string) {
        this.stage.device.getStorage().setLevel(factName, factValue);
    }

    /**
     * Save a fact about the current game session. If the factName has already
     * been used for this game session, the new value will overwrite the old.
     *
     * @param factName  The name for the fact being saved
     * @param factValue The value to save
     */
    public setSessionFact(factName: string, factValue: string) {
        this.stage.device.getStorage().setSession(factName, factValue);
    }

    /**
     * Save a fact about the current game session. If the factName has already
     * been used for this game session, the new value will overwrite the old.
     *
     * @param factName  The name for the fact being saved
     * @param factValue The value to save
     */
    public setGameFact(factName: string, factValue: string) {
        this.stage.device.getStorage().setPersistent(factName, factValue);
    }

    /**
     * Indicate that the level is won by having a certain number of heroes reach
     * destinations
     *
     * @param num Number of heroes that must reach destinations in order to win
     */
    public setVictoryDestination(num: number) {
        this.stage.score.setWinDestination(num);
    }

    /**
     * Indicate that the level is won by defeating a certain number of enemies
     * or by defeating all of the enemies. 
     *
     * @param howMany The number of enemies that must be defeated to win the
     *                level.  Leave blank to mean "all of them" in cases where
     *                the actual number of enemies isn't known.
     */
    public setVictoryEnemyCount(howMany?: number) {
        this.stage.score.setVictoryEnemyCount(howMany);
    }

    /** Return the total number of enemies that have been defeated so far */
    public getEnemiesDefeated() {
        return this.stage.score.getEnemiesDefeated();
    }

    /**
     * Indicate that the level is won by collecting enough goodies
     *
     * @param v1 Number of type-1 goodies that must be collected
     * @param v2 Number of type-2 goodies that must be collected
     * @param v3 Number of type-3 goodies that must be collected
     * @param v4 Number of type-4 goodies that must be collected
     */
    public setVictoryGoodies(v1: number, v2: number, v3: number, v4: number) {
        this.stage.score.setVictoryGoodies(v1, v2, v3, v4);
    }

    /**
     * Return the number of type-1 goodies that have been collected in the
     * current level
     */
    public getGoodies1() { return this.stage.score.getGoodieCount(0); }

    /**
     * Return the number of type-2 goodies that have been collected in the
     * current level
     */
    public getGoodies2() { return this.stage.score.getGoodieCount(1); }

    /**
     * Return the number of type-3 goodies that have been collected in the
     * current level
     */
    public getGoodies3() { return this.stage.score.getGoodieCount(2); }

    /**
     * Return the number of type-4 goodies that have been collected in the
     * current level
     */
    public getGoodies4() { return this.stage.score.getGoodieCount(3); }

    /** Increment the number of goodies of type 1 that have been collected. */
    public incrementGoodies1() { this.stage.score.incGoodieCount(0); }

    /** Increment the number of goodies of type 2 that have been collected. */
    public incrementGoodies2() { this.stage.score.incGoodieCount(1); }

    /** Increment the number of goodies of type 3 that have been collected. */
    public incrementGoodies3() { this.stage.score.incGoodieCount(2); }

    /** Increment the number of goodies of type 4 that have been collected. */
    public incrementGoodies4() { this.stage.score.incGoodieCount(3); }

    /**
     * Set the number of goodies of type 1 that have been collected.
     *
     * @param value The new value
     */
    public setGoodies1(value: number) {
        this.stage.score.setGoodieCount(0, value);
    }

    /**
     * Set the number of goodies of type 2 that have been collected.
     *
     * @param value The new value
     */
    public setGoodies2(value: number) {
        this.stage.score.setGoodieCount(1, value);
    }

    /**
     * Set the number of goodies of type 3 that have been collected.
     *
     * @param value The new value
     */
    public setGoodies3(value: number) {
        this.stage.score.setGoodieCount(2, value);
    }

    /**
     * Set the number of goodies of type 4 that have been collected.
     *
     * @param value The new value
     */
    public setGoodies4(value: number) {
        this.stage.score.setGoodieCount(3, value);
    }

    /**
     * Indicate that the level will end in defeat if it is not completed in a
     * given amount of time.
     *
     * @param timeout The amount of time until the level will end in defeat
     */
    public setLoseCountdown(timeout: number) {
        this.stage.score.setLoseCountdown(timeout);
    }

    /** Return the remaining time until the level is lost */
    public getLoseCountdown() { return this.stage.score.getLoseCountdown() }

    /**
     * Change the amount of time left in a countdown timer
     *
     * @param delta The amount of time to add before the timer expires
     */
    public updateTimerExpiration(delta: number) {
        this.stage.score.extendLoseCountdown(delta);
    }

    /**
     * Indicate that the level will end in victory if the hero survives for a
     * given amount of time
     *
     * @param timeout The amount of time until the level will end in victory
     */
    public setWinCountdown(timeout: number) {
        this.stage.score.setWinCountdown(timeout);
    }

    /** Return the remaining time until the level is won */
    public getWinCountdown() { return this.stage.score.getWinCountdown(); }

    /**
     * Set the current value of the stopwatch.  Use -100 to disable the
     * stopwatch, otherwise it will start counting immediately.
     *
     * @param val The new value of the stopwatch
     */
    public setStopwatch(val: number) { this.stage.score.setStopwatch(val); }

    /** Report the stopwatch value */
    public getStopwatch() { return this.stage.score.getStopwatch(); }

    /**
     * Force the level to end in victory.  This is useful in callbacks, where we
     * might want to immediately end the game
     */
    public winLevel() { this.stage.endLevel(true); }

    /**
     * Force the level to end in defeat.  This is useful in callbacks, where we
     * might want to immediately end the game
     */
    public loseLevel() { this.stage.endLevel(false); }

    /** Return the number of heroes that have been defeated so far */
    public getHeroesDefeated() { return this.stage.score.getHeroesDefeated(); }

    /** Return the number of heroes that have arrived at a destination so far */
    public getDestinationArrivals() { return this.stage.score.getDestinationArrivals(); }
}