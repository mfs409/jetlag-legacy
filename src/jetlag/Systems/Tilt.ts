import { game } from "../Stage";
import { b2Vec2 } from "@box2d/core";
import { TiltMovement } from "../Components/Movement";

export class TiltSystem {
  /** All actors whose behavior should change due to tilt */
  private readonly tiltActors: TiltMovement[] = [];

  /** Magnitude of the maximum gravity the accelerometer can create */
  readonly tiltMax = new b2Vec2(0, 0);

  /*** Should tilt act as a velocity instead of a force? */
  public tiltVelocityOverride = false;

  /** A multiplier to apply to tilt (accelerometer) readings */
  public tiltMultiplier: number = 1;

  /**
   * Indicate that an actor should be controlled by tilt.
   *
   * @param actor  The TiltMovement component of the actor to start controlling
   *               via tilt
   */
  public addTiltActor(actor: TiltMovement) {
    // Don't add things more than once
    if (this.tiltActors.indexOf(actor) < 0) this.tiltActors.push(actor);
  }

  /**
   * The main render loop calls this to determine what to do when there is a
   * phone tilt
   */
  public handleTilt() {
    // Get accelerometer reading
    let gravity = game.accelerometer.accel.Clone();
    // Scale it by the multiplier, then clip it to the GravityMax.x/y range
    gravity.Scale(this.tiltMultiplier);
    gravity.x = gravity.x > this.tiltMax.x ? this.tiltMax.x : gravity.x;
    gravity.x = gravity.x < -this.tiltMax.x ? -this.tiltMax.x : gravity.x;
    gravity.y = gravity.y > this.tiltMax.y ? this.tiltMax.y : gravity.y;
    gravity.y = gravity.y < -this.tiltMax.y ? -this.tiltMax.y : gravity.y;

    // If we're in 'velocity' mode, apply the accelerometer reading to each
    // actor as a fixed velocity
    if (this.tiltVelocityOverride) {
      // if X is clipped to zero, only set Y velocity
      if (this.tiltMax.x == 0) {
        for (let gfo of this.tiltActors)
          gfo.updateYVelocity(gravity.y);
      }
      // if Y is clipped to zero, only set X velocity
      else if (this.tiltMax.y == 0) {
        for (let gfo of this.tiltActors)
          gfo.updateXVelocity(gravity.x);
      }
      // otherwise we set X and Y velocity
      else {
        for (let gfo of this.tiltActors)
          gfo.updateVelocity(gravity);
      }
    }
    // when not in velocity mode, apply the accelerometer reading to each
    // actor as a force
    else {
      for (let gfo of this.tiltActors)
        gfo.updateForce(gravity);
    }
  }
}
