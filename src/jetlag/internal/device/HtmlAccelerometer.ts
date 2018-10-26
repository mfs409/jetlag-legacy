import { XY } from "../support/XY"
import { JetLagAccelerometer, JetLagAccelerometerMode } from "../support/Interfaces";
import { HtmlConsole } from "./HtmlConsole";

/**
 * HtmlAccelerometer provides access to device orientation and motion events
 * from a web browser. The support for orientation and motion varies among
 * browsers, but it seems that the "acceleration including gravity" component of
 * DeviceMotion events gives us roughly the data we need.
 *
 * DeviceMotion events happen whenever they want to happen, but JavaScript won't
 * let them happen in the middle of a render.  When the events happen, we copy
 * the event data, and then during render operations we can poll for the most
 * recent data.
 */
export class HtmlAccelerometer implements JetLagAccelerometer {
  /** The most recent accelerometer reading */
  private accel = new XY(0, 0);

  /** Is tilt supported on this device? */
  private tiltSupported = false;

  /** Report if tilt is supported */
  getSupported() { return this.tiltSupported; }

  /**
   * Create an Accelerometer object that is capable of receiving
   * DeviceOrientation information and turning it into pollable X/Y acceleration
   * data.
   *
   * @param mode    portrait vs. landscape information, so we can interpret
   *                x/y/z correctly
   * @param disable To force the accelerometer to be off
   * @param console For outputting debug messages
   */
  constructor(mode: JetLagAccelerometerMode, disable: boolean, private console: HtmlConsole) {
    if (disable)
      return;
    // There's a weird typescript complaint if we don't copy window...
    let w = window;
    if (!('DeviceMotionEvent' in window)) {
      this.console.urgent("DeviceMotion API not available... unable to use tilt to control entities");
      return;
    }
    if (mode != JetLagAccelerometerMode.DEFAULT_LANDSCAPE) {
      this.console.urgent("Unsupported device orientation mode");
      return;
    }
    // Tilt is supported, so install a listener
    this.tiltSupported = true;
    w.addEventListener('devicemotion', (ev: DeviceMotionEvent) => {
      this.accel.x = - ev.accelerationIncludingGravity.x;
      this.accel.y = ev.accelerationIncludingGravity.y;
    }, false);
  }

  /** Getter for the most recent acceleration value */
  get() { return this.accel; }

  /**
   * Override to set the X acceleration manually
   * 
   * @param x The new X value
   */
  setX(x: number) { this.accel.x = x; }

  /**
   * Override to set the Y acceleration manually
   * 
   * @param y The new Y value
   */
  setY(y: number) { this.accel.y = y; }
}
