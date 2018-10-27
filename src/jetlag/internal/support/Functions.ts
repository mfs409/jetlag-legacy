import { ActorConfig } from "../../api/ActorConfig"
import { TextConfig } from "../../api/TextConfig"
import { ImageConfig } from "../../api/ImageConfig"

/**
 * Check an ActorConfig object, and set default values for optional fields
 * 
 * @param c The ActorConfig object to check
 */
export function checkActorConfig(c: ActorConfig) {
    if (!c.img) c.img = "";
    if (!c.box) c.box = false;
    if (!c.verts) c.verts = null;
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
}

/**
 * Check an ImageConfig object, and set default values for optional fields
 * 
 * @param c The ImageConfig object to check
 */
export function checkImageConfig(c: ImageConfig) {
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
    if (!c.img) c.img = "";
}

/**
 * Check a TextConfig object, and set default values for optional fields
 * 
 * @param c The TextConfig object to check
 */
export function checkTextConfig(c: TextConfig) {
    if (!c.center) c.center = false;
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
}