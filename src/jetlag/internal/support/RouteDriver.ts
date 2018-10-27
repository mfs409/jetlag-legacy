import { BaseActor as BaseActor } from "../../actor/Base"
import { JetLagConsole } from "./Interfaces";
import { Route } from "../../support/Route";
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
        // convert start point from topleft to center, move actor to it
        this.actor.getBody().SetTransform(new XY(r.x + this.actor.getWidth() / 2, r.y + this.actor.getHeight() / 2), 0);
        // set up our next goal, start moving toward it
        this.nextIndex = 1;
        let p = this.route.getPoint(this.nextIndex)
        // convert from the point to a unit vector, then set velocity
        p.x -= this.actor.getXPosition();
        p.y -= this.actor.getYPosition();
        p.Normalize();
        p = p.Multiply(this.velocity);
        console.log(p);
        this.actor.updateVelocity(p.x, p.y);
    }

    /** Figure out where we need to go next when driving a route */
    public drive() {
        // quit if we're done and we don't loop
        if (this.done) {
            return;
        }

        // if we haven't passed the goal, keep going
        let source = this.route.getPoint(this.nextIndex - 1);
        let goal = this.route.getPoint(this.nextIndex)
        let goalDx = source.x - goal.x;
        let goalDy = source.y - goal.y;
        let actorDx = source.x - this.actor.getXPosition();
        let actorDy = source.y - this.actor.getYPosition();
        // if goal left of source and actor right of goal, keep going
        if ((goalDx > 0) && (goalDx > actorDx))
            return;
        // if goal right of source and actor left of goal, keep going
        else if ((goalDx < 0) && (goalDx < actorDx))
            return;
        // if goal above source and actor below goal, keep going
        if ((goalDy > 0) && (goalDy > actorDy))
            return;
        // if goal below source and actor above goal, keep going
        else if ((goalDy < 0) && (goalDy < actorDy))
            return;

        // Update the goal, and restart, stop, or start moving toward it
        this.nextIndex++;
        if (this.nextIndex == this.route.getNumPoints()) {
            // reset if it's a loop, else terminate Route
            if (this.loop) {
                this.startRoute();
            } else {
                this.done = true;
                this.actor.updateVelocity(0, 0);
            }
        }
        else {
            // advance to next point
            let p = this.route.getPoint(this.nextIndex)
            p.x -= this.actor.getXPosition();
            p.y -= this.actor.getYPosition();
            p.Normalize();
            p = p.Multiply(this.velocity);
            this.actor.updateVelocity(p.x, p.y);
        }
    }
}