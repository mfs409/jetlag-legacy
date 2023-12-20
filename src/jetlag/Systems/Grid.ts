import { FilledBox } from "../Components/Appearance";
import { BoxBody } from "../Components/RigidBody";
import { Actor } from "../Entities/Actor";
import { Scene } from "../Entities/Scene";

/**
 * GridSystem is a lightweight system for drawing grids on the screen.  Grids
 * can be helpful during the initial steps of developing a game.
 *
 * In reality, this isn't useful enough to be an official part of JetLag, but it
 * is convenient for the tutorials, so we're keeping it.
 */
export class GridSystem {
  /**
   * Draw a grid with meter and (optionally) half-meter lines
   *
   * @param scene         The scene where the grid should be drawn
   * @param top_left      The x/y coordinates of the top-left corner
   * @param bottom_right  The x/y coordinates of the bottom-right corner
   * @param z             The Z index of the grid
   * @param halves        True to print half-meter lines
   */
  public static makeGrid(scene: Scene, top_left: { x: number, y: number }, bottom_right: { x: number, y: number }, z?: -2 | -1 | 0 | 1 | 2, halves: boolean = true) {
    let width = bottom_right.x - top_left.x;
    let height = bottom_right.y - top_left.y;
    if (z === undefined) z = -2;
    for (let x = top_left.x; x <= bottom_right.x; x += 1) {
      new Actor({
        rigidBody: new BoxBody({ cx: x, cy: top_left.y + height / 2, width: 0.01, height }, { scene }),
        appearance: new FilledBox({ width: 0.01, height: height, lineWidth: 1, lineColor: "#000000", fillColor: "#00000000", z })
      });

      if (halves && x < bottom_right.x)
        new Actor({
          rigidBody: new BoxBody({ cx: x + .5, cy: top_left.y + height / 2, width: 0.01, height }, { scene }),
          appearance: new FilledBox({ width: 0.01, height: height, lineWidth: 0.5, lineColor: "#1100dc", fillColor: "#00000000", z })
        });
    }

    for (let y = top_left.y; y <= bottom_right.y; y += 1) {
      new Actor({
        rigidBody: new BoxBody({ cx: top_left.x + width / 2, cy: y, width, height: 0.01 }, { scene }),
        appearance: new FilledBox({ width: width, height: 0.01, lineWidth: 1, lineColor: "#000000", fillColor: "#00000000", z })
      });

      if (halves && y < bottom_right.y)
        new Actor({
          rigidBody: new BoxBody({ cx: top_left.x + width / 2, cy: y + .5, width, height: 0.01 }, { scene }),
          appearance: new FilledBox({ width: width, height: 0.01, lineWidth: 0.5, lineColor: "#1100dc", fillColor: "#00000000", z })
        });
    }
  }
}
