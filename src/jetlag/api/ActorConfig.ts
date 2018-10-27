/**
 * ActorConfig wraps all of the basic configuration for an actor.  It consists
 * of the following mandatory fields:
 * - x and y: for the coordinates of the top-left corner
 * - width and height: for the dimensions of the actor
 *
 * It also provides the following optional fields
 * - img: the name of the image file to use for this actor.  If none is
 *   provided, the actor will be invisible.
 * - z: the z index of the actor (-2, -1, 0, 1, or 2).  If none is provided, 0
 *   will be used.
 *
 * Finally, the ActorConfig describes if the actor should be a circle, a
 * rectangle, or a polygon.  
 * - To make a polygon, set the 'verts' to an array with up to 16 coordinates,
 *   representing the vertices of a polygon as [x0, y0, x1, y1, x2, y2, ...].
 *   Note that these points should be relative to the center of the actor, not
 *   its top-left corner.
 * - To make a rectangle, don't set 'verts', and set 'box' to true
 * - To make a circle, don't set 'verts' or 'box'
 *
 * Note: a circle will have radius equal to the larger of width and height.
 */
export class ActorConfig {
    /** X coordinate of the top left corner */
    x = 0;
    /** Y coordinate of the top left corner */
    y = 0;
    /** Width of the actor */
    width = 0;
    /** Height of the actor */
    height = 0;
    /** The name of the image file to use for this actor */
    img?= "";
    /** Is the actor a box? */
    box?= false;
    /** Vertices of the actor, if the actor is a polygon */
    verts?: number[] = null;
    /** Z index of the actor */
    z?= 0;
}