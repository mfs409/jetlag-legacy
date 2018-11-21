import { BaseActor } from "../../actor/BaseActor"
import { JetLagConsole } from "./Interfaces";
import { Path } from "../../support/Path";
import { XY } from "./XY";

/**
 * PathDriver is an internal class, used to determine placement for an actor
 * whose motion is controlled by a Path
 */
export class PathDriver {
    /** Is the path still running? */
    private done = false;

    /** Index of the next point in the path */
    private nextIndex: number;

    /**
     * Constructing a path driver also starts the path
     *
     * @param path    The path to apply
     * @param velocity The speed at which the actor moves
     * @param loop     Should the path repeat when it completes?
     * @param actor    The actor to which the path should be applied
     */
    constructor(private path: Path, private readonly velocity: number, private readonly loop: boolean, private actor: BaseActor, logger: JetLagConsole) {
        if (path.getNumPoints() < 2) {
            logger.urgent("Error: path must have at least two points");
            this.haltPath();
        }
        else {
            this.startPath();
        }
    }

    /** Stop processing a path, and stop the actor too */
    private haltPath() {
        this.done = true;
        this.actor.setAbsoluteVelocity(0, 0);
    }

    /** Begin running a path */
    private startPath() {
        // move to the starting point
        let r = this.path.getPoint(0);
        // convert start point from topleft to center, move actor to it
        this.actor.getBody().SetTransform(new XY(r.x + this.actor.getWidth() / 2, r.y + this.actor.getHeight() / 2), 0);
        // set up our next goal, start moving toward it
        this.nextIndex = 1;
        let p = this.path.getPoint(this.nextIndex)
        // convert from the point to a unit vector, then set velocity
        p.x -= this.actor.getXPosition();
        p.y -= this.actor.getYPosition();
        p.Normalize();
        p = p.Multiply(this.velocity);
        console.log(p);
        this.actor.updateVelocity(p.x, p.y);
    }

    /** Figure out where we need to go next when driving a path */
    public drive() {
        // quit if we're done and we don't loop
        if (this.done) {
            return;
        }

        // if we haven't passed the goal, keep going
        let source = this.path.getPoint(this.nextIndex - 1);
        let goal = this.path.getPoint(this.nextIndex)
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
        if (this.nextIndex == this.path.getNumPoints()) {
            // reset if it's a loop, else terminate path
            if (this.loop) {
                this.startPath();
            } else {
                this.done = true;
                this.actor.updateVelocity(0, 0);
            }
        }
        else {
            // advance to next point
            let p = this.path.getPoint(this.nextIndex)
            p.x -= this.actor.getXPosition();
            p.y -= this.actor.getYPosition();
            p.Normalize();
            p = p.Multiply(this.velocity);
            this.actor.updateVelocity(p.x, p.y);
        }
    }
}