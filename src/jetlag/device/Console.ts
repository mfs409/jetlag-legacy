import { JetLagConfig } from "../JetLagConfig";

/**
 * Console is used in lieu of console.log, so that we can quickly and easily
 * enable/disable different sorts of error logging.
 */
export class Console {
    /**
     * Track the level of messages that is allowed
     * - 0 = display nothing
     * - 1 = only display urgent messages
     * - 2 = display everything
     */
    private level = 2;

    /** Create a logger based on the current configuration */
    constructor(cfg: JetLagConfig) {
        this.level = cfg.logLevel;
    }

    /**
     * Display an urgent message ot the console
     * 
     * @param msg The message to display
     */
    urgent(msg: string) {
        if (this.level > 0)
            console.log(msg);
    }

    /**
     * Display an informational message to the console
     * 
     * @param msg The message to display
     */
    info(msg: string) {
        if (this.level == 2)
            console.log(msg);
    }
}