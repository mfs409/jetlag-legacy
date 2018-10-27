/**
 * ImageConfig wraps all of the basic configuration for a non-actor image.  It
 * consists of the following mandatory fields:
 * - x and y: for the coordinates of the top-left corner
 * - width and height: for the dimensions of the image
 * - img: the name of the image file to use for this image
 *
 * It also provides the following optional fields:
 * - z: the z index of the image (-2, -1, 0, 1, or 2).  If none is provided, 0
 *   will be used.
 */
export class ImageConfig {
    /** X coordinate of the top left corner */
    x = 0;
    /** Y coordinate of the top left corner */
    y = 0;
    /** Width of the image */
    width = 0;
    /** Height of the image */
    height = 0;
    /** The name of the image to use for this actor */
    img?= "";
    /** Z index of the image */
    z?= 0;
}