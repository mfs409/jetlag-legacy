// TODO: Code Review

import { FilledSprite } from "../Components/Appearance";
import { RigidBodyComponent } from "../Components/RigidBody";
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
   * Draw a grid with meter and half-meter lines
   *
   * @param scene         The scene where the grid should be drawn
   * @param top_left      The x/y coordinates of the top-left corner
   * @param bottom_right  The x/y coordinates of the bottom-right corner
   */
  public static makeGrid(scene: Scene, top_left: { x: number, y: number }, bottom_right: { x: number, y: number }) {
    let width = bottom_right.x - top_left.x;
    let height = bottom_right.y - top_left.y;
    for (let x = top_left.x; x <= bottom_right.x; x += 1) {
      Actor.Make({
        rigidBody: RigidBodyComponent.Box({ cx: x, cy: top_left.y + height / 2, width: 0.01, height }, scene),
        appearance: FilledSprite.Box({ width: 0.01, height, lineWidth: 1, lineColor: "#000000", z: -2 })
      });

      if (x < bottom_right.x)
        Actor.Make({
          rigidBody: RigidBodyComponent.Box({ cx: x + .5, cy: top_left.y + height / 2, width: 0.01, height }, scene),
          appearance: FilledSprite.Box({ width: 0.01, height, lineWidth: 0.5, lineColor: "#1100dc", z: -2 })
        });
    }

    for (let y = top_left.y; y <= bottom_right.y; y += 1) {
      Actor.Make({
        rigidBody: RigidBodyComponent.Box({ cx: top_left.x + width / 2, cy: y, width, height: 0.01 }, scene),
        appearance: FilledSprite.Box({ width, height: 0.01, lineWidth: 1, lineColor: "#000000", z: -2 })
      });

      if (y < bottom_right.y)
        Actor.Make({
          rigidBody: RigidBodyComponent.Box({ cx: top_left.x + width / 2, cy: y + .5, width, height: 0.01 }, scene),
          appearance: FilledSprite.Box({ width, height: 0.01, lineWidth: 0.5, lineColor: "#1100dc", z: -2 })
        });
    }
  }
}
