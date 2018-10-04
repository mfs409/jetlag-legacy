import { WorldActor } from "../renderables/WorldActor";
import { WorldApi } from "../api/WorldApi";
import { JetLagConfig } from "../JetLagConfig";

// TODO: need to make the placement of the SVG a little bit nicer...  Consider a
// TOPLEFT strategy to the placement, instead of translation.

/**
 * The Svg infrastructure allows the game designer to load SVG line drawings
 * into a game. SVG line drawings can be made in InkScape. In JetLag, we do not
 * use line drawings to their full potential. We only use them to define a set
 * of invisible lines for a simple, stationary obstacle. You should draw a
 * picture on top of your line drawing, so that the player knows that there is
 * an actor on the screen.
 */
export class Svg {
    /** A copy of the configuration object for the game */
    private config: JetLagConfig;

    /** The requested translation of the SVG */
    private translate = { x: 0, y: 0 };

    /** The callback to run on each line once it is created */
    private callback: (actor: WorldActor) => void;

    /** The world object... we need it */
    world: WorldApi;

    /** Coordinate of the last point we drew */
    private mLast = new PhysicsType2d.Vector2(0, 0);

    /** Coordinate of the first point we drew */
    private mFirst = new PhysicsType2d.Vector2(0, 0);

    /** Coordinate of the current point being drawn */
    private mCurr = new PhysicsType2d.Vector2(0, 0);

    /** The requested stretch factor */
    private mUserStretch = { x: 1, y: 1 };

    /**
     * The parser is essentially a finite state machine. The states are 0 for 
     * "read next x", 1 for "read next y", -2 for "read first x", and -1 for 
     * "read first y" 
     */
    private mState = 0;

    /** The SVG transform */
    private transform = { x: 0, y: 0 };

    /**
     * We can't actually draw curves. When we encounter a curve, we use this
     * field to swallow a fixed number of values, so that the curve definition
     * becomes a line definition
     */
    private mSwallow: number;

    /**
     * Track if we're parsing a curve or a line. Valid values are 0 for 
     * "uninitialized", 1 for "starting to read", 2 for "parsing curve", and 3 
     * for "parsing line"
     */
    private mMode = 0;

    /**
     * Process an SVG file and go through all of the "path" elements in the
     * file.  For each path, create a thin obstacle, and then run the provided 
     * callback on the obstacle.
     */
    public processFile(file: string, dx: number, dy: number, sx: number, sy: number, world: WorldApi, cfg: JetLagConfig, cb: (actor: WorldActor) => void) {
        this.translate.x = dx;
        this.translate.y = dy;
        this.callback = cb;
        this.world = world;
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", (aa: ProgressEvent) => this.onFileLoaded(aa));
        xhr.open("GET", cfg.resourcePrefix + file, true);
        xhr.send();
        this.config = cfg;
        this.mUserStretch.x = sx;
        this.mUserStretch.y = sy;
    }

    /**
     * When processFile receives the file back, this runs.  Its job is to find
     * all of the "g" elements in the received file, and operate on them
     */
    private onFileLoaded(aa: ProgressEvent) {
        let filecontents = (aa.currentTarget as XMLHttpRequest).response;
        let dp = new DOMParser();
        let doc = dp.parseFromString(filecontents, "text/xml"); // consider "image/svg+xml" to get an SVGDocument instead
        let gs = doc.getElementsByTagName("g");
        for (let i = 0; i < gs.length; ++i) {
            let g = gs[i];
            // Get the g's transform attribute
            let transform = g.getAttribute("transform");
            if (transform)
                this.processTransform(transform);
            let paths = g.getElementsByTagName("path");
            for (let j = 0; j < paths.length; ++j) {
                let d = paths[j].getAttribute("d");
                if (d) {
                    this.processD(d);
                }
            }
        }
    }

    /**
     * When we encounter a "transform" attribute, we use this code to parse it, in case it has a
     * "translate" directive that we should go
     *
     * @param attribute The attribute being processed... we hope it's a valid translate directive
     */
    private processTransform(attribute: string) {
        // if we get a valid "translate" attribute, split it into two floats and save them
        let start = attribute.indexOf("translate(");
        if (start == -1)
            return;
        let end = attribute.indexOf(")", start);
        let xlate = attribute.slice(start + "translate(".length, end).split(",");
        this.transform.x = parseFloat(xlate[0]);
        this.transform.y = parseFloat(xlate[1]);
    }

    /**
     * The root of an SVG drawing will have a g element, which will have some number of path
     * elements. Each path will have a "d=" attribute, which stores the points and information about
     * how to connect them. The "d" is a single string, which we parse in this function.
     *
     * @param d The string that describes the path
     */
    private processD(d: string) {
        // split the string into characters and floating point values
        // Note: we need to split on ' ' and ',', so we'll do a replace first
        let z = d.replace(/,/g, " ");
        let points = z.split(" ");
        // SVG can give point coordinates in absolute or relative terms
        let absolute = false;
        for (let s0 of points) {
            let s = s0.trim();
            switch (s) {
                // start of the path, relative mode
                case "m":
                    this.mState = -2;
                    absolute = false;
                    break;
                // start of the path, absolute mode
                case "M":
                    this.mState = -2;
                    absolute = true;
                    break;
                // beginning of a (set of) curve definitions, relative mode
                //
                // NB: we coerce curves into lines by ignoring the first four
                // parameters... this leaves us with just the endpoints
                case "c":
                    this.mMode = 2;
                    this.mSwallow = 4;
                    break;
                // end of path, relative mode
                case "z":
                    // draw a connecting line to complete the shape
                    this.addLine(this.mLast, this.mFirst);
                    break;
                // beginning of a (set of) line definitions, relative mode
                case "l":
                    this.mMode = 3;
                    absolute = false;
                    this.mSwallow = 0;
                    break;
                // beginning of a (set of) line definitions, absolute mode
                case "L":
                    this.mMode = 3;
                    absolute = true;
                    this.mSwallow = 0;
                    break;
                // floating point data that defines an endpoint of a line or curve
                default:
                    // if it's a curve, we might need to swallow this value
                    if (this.mSwallow > 0) {
                        this.mSwallow--;
                    }
                    // get the next point
                    else {
                        // convert next point to float
                        let val = parseFloat(s);
                        // if it's the initial x, save it
                        if (this.mState == -2) {
                            this.mState = -1;
                            this.mLast.x = val;
                            this.mFirst.x = val;
                        }
                        // if it's the initial y, save it... can't draw a line yet, because we
                        // have one endpoint
                        else if (this.mState == -1) {
                            this.mState = 0;
                            this.mLast.y = val;
                            this.mFirst.y = val;
                        }
                        // if it's an X value, save it
                        else if (this.mState == 0) {
                            if (absolute)
                                this.mCurr.x = val;
                            else
                                this.mCurr.x = this.mLast.x + val;
                            this.mState = 1;
                        }
                        // if it's a Y value, save it and draw a line
                        else if (this.mState == 1) {
                            this.mState = 0;
                            if (absolute)
                                this.mCurr.y = val;
                            else
                                this.mCurr.y = this.mLast.y - val;
                            // draw the line
                            this.addLine(this.mLast, this.mCurr);
                            this.mLast.x = this.mCurr.x;
                            this.mLast.y = this.mCurr.y;
                            // if we are in curve mode, reinitialize the swallower
                            if (this.mMode == 2)
                                this.mSwallow = 4;
                        }
                    }
                    break;
            }
        }
    }

    /**
     * This is a convenience method to separate the transformation and stretch logic from the logic
     * for actually drawing lines
     * <p>
     * There are two challenges. The first is that an SVG deals with pixels, whereas we like to draw
     * actors in meters. This matters because user translations will be in meters, but SVG points
     * and SVG translations will be in pixels.
     * <p>
     * The second challenge is that SVGs appear to have a "down is plus" Y axis, whereas our system
     * has a "down is minus" Y axis. To getLoseScene around this, we reflect every Y coordinate over
     * the horizontal line that intersects with the first point drawn.
     *
     * @param start The point from which the line originates
     * @param stop  The point to which the line extends
     */
    private addLine(start: PhysicsType2d.Vector2, stop: PhysicsType2d.Vector2) {
        // Get the pixel coordinates of the SVG line
        let x1 = start.x, x2 = stop.x, y1 = start.y, y2 = stop.y;

        // apply svg translation, since it is in pixels
        x1 += this.transform.x;
        x2 += this.transform.x;
        y1 += this.transform.y;
        y2 += this.transform.y;
        // reflect through mFirst.y
        y1 = this.mFirst.y - y1;
        y2 = this.mFirst.y - y2;
        // convert the coordinates to meters
        x1 /= this.config.pixelMeterRatio;
        y1 /= this.config.pixelMeterRatio;
        x2 /= this.config.pixelMeterRatio;
        y2 /= this.config.pixelMeterRatio;
        // add in the user transform in meters
        x1 += this.translate.x;
        y1 += this.translate.y;
        x2 += this.translate.x;
        y2 += this.translate.y;
        // multiply the coordinates by the stretch
        x1 *= this.mUserStretch.x;
        y1 *= this.mUserStretch.y;
        x2 *= this.mUserStretch.x;
        y2 *= this.mUserStretch.y;
        this.drawLine(x1, y1, x2, y2);
    }

    /**
     * Internal method used by the SVG parser to draw a line. We actually just draw a really skinny
     * Obstacle and rotate it
     *
     * @param x1 X coordinate of first endpoint
     * @param y1 Y coordinate of first endpoint
     * @param x2 X coordinate of second endpoint
     * @param y2 Y coordinate of second endpoint
     */
    private drawLine(x1: number, y1: number, x2: number, y2: number) {
        // compute center and length
        let centerX = (x1 + x2) / 2;
        let centerY = (y1 + y2) / 2;
        let len = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        // Make an obstacle and rotate it
        let o = this.world.makeObstacleAsBox(x1, y1, len, .05, "");
        o.body.SetTransform(new PhysicsType2d.Vector2(centerX, centerY), Math.atan2(y2 - y1, x2 - x1));
        // let the game code modify this line segment
        this.callback(o);
    }
};