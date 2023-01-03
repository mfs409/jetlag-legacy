import { JetLagVibration } from "../support/Interfaces";
import { HtmlConsole } from "./HtmlConsole";

/**
 * Vibration provides a thin wrapper around the HTML5 vibration API, so that we
 * can call a method that works even when the browser doesn't support vibration
 */
export class HtmlVibration implements JetLagVibration {
    /** Track whether the device supports vibration */
    private isSupported: boolean = false;

    /**
     * Construct a Vibration object by checking if the device supports the HTML5
     * vibration API.
     */
    constructor(private console: HtmlConsole) {
        if (!!navigator.vibrate) {
            this.isSupported = true;
        }
    }

    /**
     * Cause the device to vibrate for a fixed number of milliseconds, or print
     * a message if the device does not support vibration
     * 
     * @param millis The number of milliseconds for which to vibrate
     */
    vibrate(millis: number) {
        if (this.isSupported) {
            navigator.vibrate(millis);
        }
        else {
            this.console.info("Simulating " + millis + "ms of vibrate");
        }
    }
}