import { BaseActor } from "../renderables/BaseActor"
import { JetLagConsole } from "../device/JetLagConsole"
/**
 * Route specifies a set of points that an actor will move between at a fixed speed.
 */
export class Route {
  /** The X coordinates of the points in the route */
  points: { x: number, y: number }[] = [];

  /**
   * Add a new point to a path by giving (coordinates for where the center of the actor goes next
   *
   * @param x X value of the new coordinate
   * @param y Y value of the new coordinate
   */
  public to(x: number, y: number): Route {
    this.points.push({ x: x, y: y });
    return this;
  }
}

/**
 * RouteDriver is an internal class, used to determine placement for a BaseActor
 * whose motion is controlled by a Route
 */
export class RouteDriver {
  /** The route that is being applied */
  private readonly route: Route;

  /** The actor to which the route is being applied */
  private readonly actor: BaseActor;

  /** The speed at which the actor moves along the route */
  private readonly velocity: number;

  /** When the actor reaches the end of the route, should it start again? */
  private readonly loop: boolean;

  /** A temp for computing positions */
  private mRouteVec = new PhysicsType2d.Vector2(0, 0);

  /** Is the route still running? */
  private done = false;

  /** Index of the next point in the route */
  private nextIndex: number;

  /**
   * Constructing a route driver also starts the route
   *
   * @param route    The route to apply
   * @param velocity The speed at which the actor moves
   * @param loop     Should the route repeat when it completes?
   * @param actor    The actor to which the route should be applied
   */
  constructor(route: Route, velocity: number, loop: boolean, actor: BaseActor) {
    this.route = route;
    this.velocity = velocity;
    this.loop = loop;
    this.actor = actor;
    if (route.points.length < 2) {
      JetLagConsole.urgent("Error: route must have at least two points");
      this.haltRoute();
    }
    else {
      this.startRoute();
    }
  }

  /**
   * Stop a route, and stop the actor too
   */
  haltRoute(): void {
    this.done = true;
    this.actor.setAbsoluteVelocity(0, 0);
  }

  /**
   * Begin running a route
   */
  private startRoute(): void {
    // move to the starting point
    this.actor.body.SetTransform(new PhysicsType2d.Vector2(this.route.points[0].x + this.actor.size.x / 2, this.route.points[0].y + this.actor.size.y / 2), 0);
    // set up our next goal, start moving toward it
    this.nextIndex = 1;
    this.mRouteVec.x = this.route.points[this.nextIndex].x - this.actor.getXPosition();
    this.mRouteVec.y = this.route.points[this.nextIndex].y - this.actor.getYPosition();
    // normalize and scale the vector, then apply the velocity
    this.mRouteVec.Normalize();
    this.mRouteVec = this.mRouteVec.Multiply(this.velocity);
    this.actor.body.SetLinearVelocity(this.mRouteVec);
  }

  /**
   * Figure out where we need to go next when driving a route
   */
  drive(): void {
    // quit if we're done and we don't loop
    if (this.done) {
      return;
    }

    // if we haven't passed the goal, keep going. we tell if we've passed the goal by
    // comparing the magnitudes of the vectors from source (s) to here and from goal (g) to
    // here
    let sourceX = this.route.points[this.nextIndex - 1].x - this.actor.getXPosition();
    let sourceY = this.route.points[this.nextIndex - 1].y - this.actor.getYPosition();
    let goalX = this.route.points[this.nextIndex].x - this.actor.getXPosition();
    let goalY = this.route.points[this.nextIndex].y - this.actor.getYPosition();
    let sameXSign = (goalX >= 0 && sourceX >= 0) || (goalX <= 0 && sourceX <= 0);
    let sameYSign = (goalY >= 0 && sourceY >= 0) || (goalY <= 0 && sourceY <= 0);

    if (((goalX == goalY) && (goalX == 0)) || (sameXSign && sameYSign)) {
      this.nextIndex++;
      if (this.nextIndex == this.route.points.length) {
        // reset if it's a loop, else terminate Route
        if (this.loop) {
          this.startRoute();
        } else {
          this.done = true;
          this.actor.body.SetLinearVelocity(new PhysicsType2d.Vector2(0, 0));
        }
      } else {
        // advance to next point
        this.mRouteVec.x = this.route.points[this.nextIndex].x - this.actor.getXPosition();
        this.mRouteVec.y = this.route.points[this.nextIndex].y - this.actor.getYPosition();
        this.mRouteVec.Normalize();
        this.mRouteVec = this.mRouteVec.Multiply(this.velocity);
        this.actor.body.SetLinearVelocity(this.mRouteVec);
      }
    }
    // NB: 'else keep going at current velocity'
  }
}