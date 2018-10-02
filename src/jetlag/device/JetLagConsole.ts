import { JetLagConfig } from "../JetLagConfig";

/**
 * JetLagConsole abstracts away the differences between HTML5 (console.log) and
 * device-specific log mechanisms (i.e., Android's log.d()).  JetLagConsole adds
 * the ability to globally turn off certain classes of messages, since we often
 * want to limit logging during production.
 *
 * Note: JetLagConsole is a singleton... the only singleton in JetLag
 */
export class JetLagConsole {
    /**
     * Track the level of messages that is allowed
     * - 0: display nothing
     * - 1: display urgent messages
     * - 2: display urgent and informative messages
     */
    private static level = 2;

    /**
     * Configure the output console based on the game config object
     * 
     * @param cfg The game-wide configuration object
     */
    static config(cfg: JetLagConfig) { this.level = cfg.logLevel; }

    /**
     * Display an urgent message ot the console
     * 
     * @param msg The message to display
     */
    static urgent(msg: string) {
        if (this.level > 0)
            console.log(msg);
    }

    /**
     * Display an informational message to the console
     * 
     * @param msg The message to display
     */
    static info(msg: string) {
        if (this.level == 2)
            console.log(msg);
    }
}