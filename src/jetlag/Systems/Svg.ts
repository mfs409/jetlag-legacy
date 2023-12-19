import { b2Vec2 } from "@box2d/core";
import { stage } from "../Stage";

/**
 * The Svg System is for loading SVG line drawings into a game.  SVG line
 * drawings can be made in InkScape. In JetLag, we do not use line drawings to
 * their full potential. We only use them to define a set of lines for a simple,
 * stationary Actor. You should draw a picture on top of your line drawing, so
 * that the player knows that there is an actor on the screen.
 *
 * Note that SVG supports *curves*, but JetLag does not.  You can instruct
 * InkScape not to make curves.  If you forget, JetLag will turn your curves
 * into straight lines.
 */
export class SvgSystem {
  /** Coordinate of the last point we drew */
  private last = new b2Vec2(0, 0);

  /** Coordinate of the first point we drew */
  private first = new b2Vec2(0, 0);

  /** Coordinate of the current point being drawn */
  private curr = new b2Vec2(0, 0);

  /** The computed top and left boundaries of the SVG, in pixels */
  private top_left?: b2Vec2;

  /**
   * The parser is essentially a finite state machine. The states are 0 for
   * "read next x", 1 for "read next y", -2 for "read first x", and -1 for
   * "read first y"
   */
  private state = 0;

  /**
   * We can't actually draw curves. When we encounter a curve, we use this
   * field to swallow a fixed number of values, so that the curve definition
   * becomes a line definition
   */
  private swallow?: number;

  /**
   * Track if we're parsing a curve or a line. Valid values are 0 for
   * "uninitialized", 1 for "starting to read", 2 for "parsing curve", and 3
   * for "parsing line"
   */
  private mode = 0;

  /**
   * Construct an object for drawing entities based on an SVG.  The arguments to
   * actorMaker define a box via its center x, center y, width, and rotation.
   * You'll probably want a very narrow height.
   *
   * @param translate   The user-specified top left corner
   * @param stretch     The requested stretch factors
   * @param actorMaker  A function for building an actor for each line of the
   *                    SVG
   */
  private constructor(private translate: b2Vec2, private userStretch: b2Vec2, private actorMaker: (cx: number, cy: number, width: number, rotation: number) => void) { }

  /**
   * Process an SVG file and go through all of the "path" elements in the
   * file.  For each path, create a thin obstacle, and then run the provided
   * callback on the obstacle.
   *
   * Note that we ignore SVG /translate/ directives... we let the programmer
   * translate the drawing instead.
   *
   * @param file     The name of the file to load
   * @param x        The X coordinate of the top left corner of the bounding
   *                 box for the SVG
   * @param y        The Y coordinate of the top left corner of the bounding
   *                 box for the SVG
   * @param stretchX The factor by which to stretch in the X dimension
   * @param stretchY The factor by which to stretch in the Y dimension
   * @param appearanceMaker A callback for making each line's Appearance
   * @param roleMaker A callback for making each line's Role
   * @param cb       A callback to run on each line segment (Obstacle) that we
   *                 make
   */
  public static processFile(file: string, x: number, y: number, stretchX: number, stretchY: number, actorMaker: (cx: number, cy: number, width: number, rotation: number) => void) {
    let svg = new SvgSystem(new b2Vec2(x, y), new b2Vec2(stretchX, stretchY), actorMaker);
    // send the request.  On completion, we'll be in onFileLoaded
    //
    // TODO:  Capacitor and Electron might require a different way of getting
    //        the SVG file...
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", (aa: ProgressEvent) => svg.onFileLoaded(aa));
    xhr.open("GET", stage.config.resourcePrefix + file, true);
    xhr.send();
  }

  /**
   * When the SVG file is fetched from the server, it will run this to parse
   * the result. The job of this code is to find all of the "g" elements in
   * the received file, and operate on them
   *
   * @param event The XHR event that fetched the file
   */
  private onFileLoaded(event: ProgressEvent) {
    let file_contents = (event.currentTarget as XMLHttpRequest).response;
    let dp = new DOMParser();
    // TODO: consider "image/svg+xml" to get an SVGDocument instead
    let doc = dp.parseFromString(file_contents, "text/xml");
    let gs = doc.getElementsByTagName("g");
    for (let i = 0; i < gs.length; ++i) {
      let g = gs[i];
      let paths = g.getElementsByTagName("path");
      for (let j = 0; j < paths.length; ++j) {
        let d = paths[j].getAttribute("d");
        if (d) {
          // We process it twice: first time is to get the top and
          // left, second time is to actually draw it
          this.processD(d, true);
          this.processD(d, false);
        }
      }
    }
  }

  /**
   * The root of an SVG drawing will have a g element, which will have some
   * number of path elements. Each path will have a "d=" attribute, which stores
   * the points and information about how to connect them. The "d" is a single
   * string, which we parse in this function.
   *
   * @param d            The string that describes the path
   * @param readonlyMode Are we in read-only mode (true), where we are computing
   *                     the top/left pixel bound, or are we in draw mode
   *                     (false), where we actually draw the lines
   */
  private processD(d: string, readonlyMode: boolean) {
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
          this.state = -2;
          absolute = false;
          break;
        // start of the path, absolute mode
        case "M":
          this.state = -2;
          absolute = true;
          break;
        // beginning of a (set of) curve definitions, relative mode
        //
        // NB: we coerce curves into lines by ignoring the first four
        // parameters... this leaves us with just the endpoints
        case "c":
          this.mode = 2;
          this.swallow = 4;
          break;
        // end of path, relative mode
        case "z":
          // draw a connecting line to complete the shape
          if (readonlyMode) this.updateTL(this.last, this.first);
          else this.addLine(this.last, this.first);
          break;
        // beginning of a (set of) line definitions, relative mode
        case "l":
          this.mode = 3;
          absolute = false;
          this.swallow = 0;
          break;
        // beginning of a (set of) line definitions, absolute mode
        case "L":
          this.mode = 3;
          absolute = true;
          this.swallow = 0;
          break;
        // floating point data that defines an endpoint of a line or
        // curve
        default:
          // if it's a curve, we might need to swallow this value
          if (this.swallow && this.swallow > 0) {
            this.swallow--;
          }
          // get the next point
          else {
            // convert next point to float
            let val = parseFloat(s);
            // if it's the initial x, save it
            if (this.state == -2) {
              this.state = -1;
              this.last.x = val;
              this.first.x = val;
            }
            // if it's the initial y, save it... can't draw a line
            // yet, because we have one endpoint
            else if (this.state == -1) {
              this.state = 0;
              this.last.y = val;
              this.first.y = val;
            }
            // if it's an X value, save it
            else if (this.state == 0) {
              if (absolute) this.curr.x = val;
              else this.curr.x = this.last.x + val;
              this.state = 1;
            }
            // if it's a Y value, save it and draw a line
            else if (this.state == 1) {
              this.state = 0;
              if (absolute) this.curr.y = val;
              else this.curr.y = this.last.y - val;
              // draw the line
              if (readonlyMode) this.updateTL(this.last, this.first);
              else this.addLine(this.last, this.curr);
              this.last.x = this.curr.x;
              this.last.y = this.curr.y;
              // if we are in curve mode, reinitialize the swallower
              if (this.mode == 2) this.swallow = 4;
            }
          }
          break;
      }
    }
  }

  /**
   * This is a convenience method to separate the transformation and stretch
   * logic from the logic for actually drawing lines
   *
   * There are two challenges. The first is that an SVG deals with pixels,
   * whereas we like to draw actors in meters. This matters because user
   * translations will be in meters, but SVG points and SVG translations will
   * be in pixels.
   *
   * The second challenge is that SVGs appear to have a "down is minus" Y
   * axis, whereas our system has a "down is plus" Y axis. To get around this,
   * we reflect every Y coordinate over the horizontal line that intersects
   * with the first point drawn.
   *
   * @param start The point from which the line originates
   * @param stop  The point to which the line extends
   */
  private addLine(start: b2Vec2, stop: b2Vec2) {
    // Get the pixel coordinates of the SVG line
    let x1 = start.x,
      x2 = stop.x,
      y1 = start.y,
      y2 = stop.y;

    // reflect through first.y
    y1 = this.first.y - y1;
    y2 = this.first.y - y2;

    // multiply the coordinates by the stretch
    x1 *= this.userStretch.x;
    y1 *= this.userStretch.y;
    x2 *= this.userStretch.x;
    y2 *= this.userStretch.y;

    // normalize by top left pixels (0,0)
    x1 -= this.top_left!.x;
    x2 -= this.top_left!.x;
    y1 -= this.top_left!.y;
    y2 -= this.top_left!.y;

    // convert the coordinates to meters
    x1 /= stage.pixelMeterRatio;
    y1 /= stage.pixelMeterRatio;
    x2 /= stage.pixelMeterRatio;
    y2 /= stage.pixelMeterRatio;

    // add in the user transform in meters and draw it
    x1 += this.translate.x;
    y1 += this.translate.y;
    x2 += this.translate.x;
    y2 += this.translate.y;
    this.drawLine(x1, y1, x2, y2);
  }

  /**
   * Internal method used by the SVG parser to draw a line. We actually just
   * draw a really skinny Actor and rotate it
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
    let rot = Math.atan2(y2 - y1, x2 - x1);
    this.actorMaker(centerX, centerY, len, rot);
  }

  /**
   * During the first pass through a d element, we don't draw, we just compute
   * the smallest X and Y values, so we know the top left of the bounding box.
   * This is the code that takes each line that we would draw, and uses its
   * endpoints to update the top/left estimates.
   *
   * @param start The point from which the line originates
   * @param stop  The point to which the line extends
   */
  private updateTL(start: b2Vec2, stop: b2Vec2) {
    // Get the pixel coordinates of the SVG line
    let x1 = start.x, x2 = stop.x, y1 = start.y, y2 = stop.y;

    // reflect through first.y
    y1 = this.first.y - y1;
    y2 = this.first.y - y2;

    // multiply the coordinates by the stretch
    x1 *= this.userStretch.x;
    y1 *= this.userStretch.y;
    x2 *= this.userStretch.x;
    y2 *= this.userStretch.y;

    // If this is the first line, we need to initialize our top/left storage
    if (!this.top_left) this.top_left = new b2Vec2(x1, y1);

    // Update our estimates of top/left
    if (x1 < this.top_left.x) this.top_left.x = x1;
    if (y1 < this.top_left.y) this.top_left.y = y1;
    if (x2 < this.top_left.x) this.top_left.x = x2;
    if (y2 < this.top_left.y) this.top_left.y = y2;
  }
}
