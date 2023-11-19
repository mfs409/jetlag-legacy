import { b2Vec2 } from "@box2d/core";
import { game } from "../Stage";

/**
 * We are probably going to need a way to re-interpret the meaning of
 * accelerometer values depending on the orientation of the device (at least
 * portrait vs. landscape).  Until we have a use case, we'll just anticipate as
 * best we can by having this enum to pass to the constructor.
 *
 * NB:  In 2015, Android accelerometer readings on tablets and phones were
 *      weirdly different, but maybe it's cleaner by now?
 */
export enum AccelerometerMode { LANDSCAPE, PORTRAIT }

/**
 * AccelerometerService provides access to device orientation and motion events
 * from a web browser. The support for orientation and motion varies among
 * browsers, but it seems that the "acceleration including gravity" component of
 * DeviceMotion events gives us roughly the data we need.
 *
 * DeviceMotion events happen whenever they want to happen, but JavaScript won't
 * let them happen in the middle of a render.  When the events happen, we copy
 * the event data, and then during render operations, other code can poll this
 * service for the most recent data.
 */
export class AccelerometerService {
  /** The most recent accelerometer reading */
  readonly accel = new b2Vec2(0, 0);

  /** Is tilt supported on this device? */
  readonly tiltSupported: boolean;

  /**
   * Create the service
   *
   * @param mode      portrait vs. landscape information, so we can interpret
   *                  x/y/z correctly
   * @param disable   To force the accelerometer to be off
   */
  constructor(mode: AccelerometerMode, disable: boolean) {
    // If there's a request to disable, don't use the accelerometer
    if (disable) {
      this.tiltSupported = false;
      return;
    }

    // If the service doesn't exist, disable the accelerometer
    if (!("DeviceMotionEvent" in window)) {
      game.console.urgent("DeviceMotion API not available... unable to use tilt to control entities");
      this.tiltSupported = false;
      return;
    }
    if (mode != AccelerometerMode.LANDSCAPE) {
      // TODO: start supporting PORTRAIT mode?
      game.console.urgent("Unsupported device orientation mode");
      this.tiltSupported = false;
      return;
    }

    // Tilt is supported, so install a listener.  It just reads the latest value
    // and makes it available to others.
    this.tiltSupported = true;
    window.addEventListener("devicemotion",
      (ev: DeviceMotionEvent) => {
        if (ev.accelerationIncludingGravity) {
          this.accel.x = -ev.accelerationIncludingGravity.x!;
          this.accel.y = ev.accelerationIncludingGravity.y!;
        }
      },
      false
    );
  }
}
