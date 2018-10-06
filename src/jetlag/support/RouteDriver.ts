import { BaseActor as BaseActor } from "../actor/Base"
import { JetLagConsole } from "./Interfaces";
import { Route } from "./Route";
import { XY } from "./XY";

/**
 * RouteDriver is an internal class, used to determine placement for an actor
 * whose motion is controlled by a Route
 */
export class RouteDriver {
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
    constructor(private route: Route, private readonly velocity: number, private readonly loop: boolean, private actor: BaseActor, logger: JetLagConsole) {
        if (route.getNumPoints() < 2) {
            logger.urgent("Error: route must have at least two points");
            this.haltRoute();
        }
        else {
            this.startRoute();
        }
    }

    /** Stop processing a route, and stop the actor too */
    private haltRoute() {
        this.done = true;
        this.actor.setAbsoluteVelocity(0, 0);
    }

    /** Begin running a route */
    private startRoute() {
        // move to the starting point
        let r = this.route.getPoint(0);
        this.actor.getBody().SetTransform(new XY(r.x + this.actor.getWidth() / 2, r.y + this.actor.getHeight() / 2), 0);
        // set up our next goal, start moving toward it
        this.nextIndex = 1;
        let p = this.route.getPoint(this.nextIndex)
        p.x -= this.actor.getXPosition();
        p.y -= this.actor.getYPosition();
        // normalize and scale the vector, then apply the velocity
        p.Normalize();
        p = p.Multiply(this.velocity);
        this.actor.updateVelocity(p.x, p.y);
    }

    /** Figure out where we need to go next when driving a route */
    public drive() {
        // quit if we're done and we don't loop
        if (this.done) {
            return;
        }

        // if we haven't passed the goal, keep going. we tell if we've passed
        // the goal by comparing the magnitudes of the vectors from source (s)
        // to here and from goal (g) to here
        let source = this.route.getPoint(this.nextIndex - 1);
        source.x -= this.actor.getXPosition();
        source.y -= this.actor.getYPosition();
        let goal = this.route.getPoint(this.nextIndex)
        goal.x -= this.actor.getXPosition();
        goal.y -= this.actor.getYPosition();
        let sameXSign = (goal.x >= 0 && source.x >= 0) || (goal.x <= 0 && source.x <= 0);
        let sameYSign = (goal.y >= 0 && source.y >= 0) || (goal.y <= 0 && source.y <= 0);

        if (((goal.x == goal.y) && (goal.x == 0)) || (sameXSign && sameYSign)) {
            this.nextIndex++;
            if (this.nextIndex == this.route.getNumPoints()) {
                // reset if it's a loop, else terminate Route
                if (this.loop) {
                    this.startRoute();
                } else {
                    this.done = true;
                    this.actor.updateVelocity(0, 0);
                }
            } else {
                // advance to next point
                let p = this.route.getPoint(this.nextIndex)
                p.x -= this.actor.getXPosition();
                p.y -= this.actor.getYPosition();
                p.Normalize();
                p = p.Multiply(this.velocity);
                this.actor.updateVelocity(p.x, p.y);
            }
        }
        // NB: 'else keep going at current velocity'
    }
}