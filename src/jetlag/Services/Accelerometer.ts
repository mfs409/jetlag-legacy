import { b2Vec2 } from "@box2d/core";
import { stage } from "../Stage";

/**
 * We are probably going to need a way to re-interpret the meaning of
 * accelerometer values depending on the orientation of the device (at least
 * portrait vs. landscape).  Until we have a use case, we'll just anticipate as
 * best we can by having this enum to pass to the constructor.
 *
 * TODO: This is only tested on Android phones, not tablets.  iOS is not tested.
 */
export enum AccelerometerMode {
  ANDROID_LANDSCAPE, ANDROID_PORTRAIT, IOS_LANDSCAPE, IOS_PORTRAIT, DISABLED
}

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
   */
  constructor(mode: AccelerometerMode) {
    // If there's a request to disable, don't use the accelerometer
    if (mode == AccelerometerMode.DISABLED) {
      this.tiltSupported = false;
      return;
    }

    // If the service doesn't exist, disable the accelerometer
    if (!("DeviceMotionEvent" in window)) {
      stage.console.log("DeviceMotion API not available... unable to use tilt to control entities");
      this.tiltSupported = false;
      return;
    }

    if (mode == AccelerometerMode.IOS_LANDSCAPE || mode == AccelerometerMode.IOS_PORTRAIT) {
      stage.console.log("Unsupported device orientation mode");
      this.tiltSupported = false;
      return;
    }

    // Tilt is supported, so install a listener.  It just reads the latest value
    // and makes it available to others.
    this.tiltSupported = true;
    window.addEventListener("devicemotion",
      (ev: DeviceMotionEvent) => {
        if (ev.accelerationIncludingGravity) {
          if (mode == AccelerometerMode.ANDROID_PORTRAIT) {
            this.accel.x = -ev.accelerationIncludingGravity.x!;
            this.accel.y = ev.accelerationIncludingGravity.y!;
          }
          else if (mode == AccelerometerMode.ANDROID_LANDSCAPE) {
            this.accel.x = ev.accelerationIncludingGravity.y!;
            this.accel.y = ev.accelerationIncludingGravity.x!;
          }
        }
      },
      false
    );
  }
}
