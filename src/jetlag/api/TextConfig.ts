/**
 * TextConfig wraps all of the basic configuration for text on the screen.  It
 * consists of the following mandatory fields:
 * - x and y: for the coordinates of either the top-left corner (default), or
 *   the center of the image (when the optional 'center' field is true)
 * - face, color, and size: for configuring the font to use.  Note that color
 *   should be an HTML hex code, e.g., "#FF0000"
 *
 * It also provides the following optional fields:
 * - z: the z index of the text (-2, -1, 0, 1, or 2).  If none is provided, 0
 *   will be used
 * - center: true if the X and Y coordinates should be for the center of the
 *   text, false (or not provided) if the X and Y coordinates should be for the
 *   top left corner of the text.
 */
export class TextConfig {
    /** X coordinate of the top left corner or center*/
    x = 0;
    /** Y coordinate of the top left corner or center */
    y = 0;
    /** Should the text be centered at X,Y (true) or is (X,Y) top-left (false) */
    center?= false;
    /** Font to use */
    face = "Arial";
    /** Color for the text */
    color = "#FFFFFF";
    /** Font size */
    size = 22;
    /** Z index of the text */
    z?= 0;
}