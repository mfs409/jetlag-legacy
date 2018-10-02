import { XY } from "../misc/XY"
import { JetLagConsole } from "./JetLagConsole"

/**
 * We are probably going to need a way to re-interpret the meaning of
 * accelerometer values depending on the orientation of the device (at least
 * portrait vs. landscape).  Until we have a use case, we'll just anticipate as
 * best we can by having this enum to pass to the constructor.
 */
export enum AccelerometerMode {
  DEFAULT_LANDSCAPE,
}

/**
 * Accelerometer provides access to device orientation and motion events.  The
 * support for orientation and motion varies among browsers, but it seems that
 * the "acceleration including gravity" component of DeviceMotion events gives
 * us roughly the data we need.
 * 
 * DeviceMotion events happen whenever they want to happen, but JavaScript won't
 * let them happen in the middle of a render.  When the events happen, we copy
 * the event data, and then during render operations we can poll for the most
 * recent data.
 */
export class JetLagAccelerometer {
  /** The most recent accelerometer reading */
  private accel = new XY(0, 0);

  /** Is tilt supported on this device? */
  supported = false;

  /**
   * Create an Accelerometer object that is capable of receiving 
   * DeviceOrientation information and turning it into pollable X/Y acceleration
   * data.
   * 
   * @param mode portrait vs. landscape information, so we can interpret x/y/z correctly
   * @param disable To force the accelerometer to be off
   */
  constructor(mode: AccelerometerMode, disable: boolean) {
    if (disable)
      return;
    // There's a weird typescript complaint if we don't copy window...
    let w = window;
    if (!('DeviceMotionEvent' in window)) {
      JetLagConsole.urgent("DeviceMotion API not available... unable to use tilt to control entities");
      return;
    }
    if (mode != AccelerometerMode.DEFAULT_LANDSCAPE) {
      JetLagConsole.urgent("Unsupported device orientation mode");
      return;
    }
    this.supported = true;
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
  setX(x: number) {
    this.accel.x = x;
  }

  /**
   * Override to set the Y acceleration manually
   * 
   * @param y The new Y value
   */
  setY(y: number) {
    this.accel.y = y;
  }
}
