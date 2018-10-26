import { JetLagStorage } from "../support/Interfaces";
import { HtmlConsole } from "./HtmlConsole";

/**
 * JetLagStorage provides an interface to three key/value stores
 * - Persistent: Things saved here will remain here, even after the player
 *               leaves the page.  This uses the HTML5 persistent storage API
 * - Session:    Things saved here will remain as the player moves among levels,
 *               but will be discarded when the player leaves the page.
 * - Level:      Things saved here will remain only until the player moves to
 *               another level
 */
export class HtmlStorage implements JetLagStorage {
    /**
     * Store string/object pairs that get reset whenever we navigate away from
     * the game, but which persist across levels 
     */
    private readonly sessionFacts: { [index: string]: any } = {};

    /** Store string/object pairs that get reset whenever we change levels */
    private levelFacts: { [index: string]: any } = {};

    /**
     * Construct an HtmlStorage object
     * 
     * @param console A console, for printing error messages
     */
    constructor(private console: HtmlConsole) { }

    /** Clear the level facts */
    public clearLevelFacts() { this.levelFacts = {}; }

    /**
     * Save some information as a key/value pair.  The information will be
     * lost upon any level change
     * 
     * @param key The key by which to remember the data being saved
     * @param value The value to store with the provided key
     */
    public setLevel(key: string, value: any) { this.levelFacts[key] = value; }

    /**
     * Read some information that was saved as a key/value pair.  This
     * information is specific to the current level
     * 
     * @param key The key with which the value was previously saved
     * @param defaultVal A value to return if the key is not valid
     */
    public getLevel(key: string, defaultVal: any): string {
        let res = this.levelFacts[key];
        if (res)
            return res;
        this.console.info("Error: Unable to find a value for level fact " + key);
        return defaultVal;
    }

    /**
     * Save some information as a key/value pair, so that we can access that
     * information even after the browser is closed
     * 
     * @param key The key by which to remember the data being saved
     * @param value The value to store with the provided key
     */
    public setSession(key: string, value: any) {
        this.sessionFacts[key] = value;
    }

    /**
     * Read some information that was saved as a key/value pair.  This
     * information should be safe to access even if the browser has been closed.
     * 
     * @param key The key with which the value was previously saved
     * @param defaultVal A value to return if the key is not valid
     */
    public getSession(key: string, defaultVal: any): string {
        let res = this.sessionFacts[key];
        if (res)
            return res;
        this.console.info("Error: Unable to find a value for session fact " + key)
        return defaultVal;
    }

    /**
     * Save some information as a key/value pair, so that we can access that
     * information even after the browser is closed
     * 
     * @param key The key by which to remember the data being saved
     * @param value The value to store with the provided key
     */
    public setPersistent(key: string, value: string) {
        localStorage.setItem(key, value);
    }

    /**
     * Read some information that was saved as a key/value pair.  This
     * information should be safe to access even if the browser has been closed.
     * 
     * @param key The key with which the value was previously saved
     * @param defaultVal A value to return if the key is not valid
     */
    public getPersistent(key: string, defaultVal: string): string {
        let res = localStorage.getItem(key);
        if (res)
            return res;
        this.console.info("Error: Unable to find a value for game fact " + key)
        return defaultVal;
    }
}