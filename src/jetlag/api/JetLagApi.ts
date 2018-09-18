import { ScoreApi } from "./ScoreApi"
import { WorldApi } from "./WorldApi"
import { OverlayApi } from "./OverlayApi"
import { JetLagManager } from "../JetLagManager"
import { NavigationApi } from "./NavigationApi"

/**
 * JetLagApi provides a broad, public, declarative interface to the core
 * functionality of JetLag.
 *
 * Game designers will spend most of their time writing the functions for
 * creating the levels of the Chooser, Help, Levels, Splash, and Store screens.
 * Within those functions, a JetLagApi object is available.  It corresponds to a
 * pre-configured, blank, interactive portion of the game.  By calling functions
 * of the JetLagApi, a programmer can realize their game.
 * 
 * The functionality is divided into four parts:
 * - World: This is where the Actors of the game are drawn
 * - Hud: A heads-up display onto which text and input controls can be drawn
 * - Score: This tracks all of the scoring-related aspects of a level
 * - Nav: This is for navigating among levels and doing level-wide configuration
 * 
 * Note that there are other scenes, which are managed indirectly:
 * - PreScene: A quick scene to display before the level starts
 * - PauseScene: A scene to show when the game is paused
 * - WinScene: A scene to show when the game is won
 * - LoseScene: A scene to show when the game is lost
 */
export class JetLagApi {
    /** An interface to everything related to scores */
    readonly score: ScoreApi;

    /** An interface to everything related to putting things in the game world */
    readonly world: WorldApi;

    /** An interface to everything related to the heads-up display */
    readonly hud: OverlayApi;

    /** Everything else */
    readonly nav: NavigationApi;

    /** Construct the JetLag API from a manager object */
    constructor(manager: JetLagManager) {
        this.world = new WorldApi(manager);
        this.hud = new OverlayApi(manager.getCurrStage().hud);
        this.score = new ScoreApi(manager);
        this.nav = new NavigationApi(manager);
        this.world.setHud(this.hud);
    }
}