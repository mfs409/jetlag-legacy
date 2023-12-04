import { initializeAndLaunch } from "../jetlag/Stage";
import { GameConfig } from "../jetlag/Config";
import { FilledBox } from "../jetlag/Components/Appearance";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class TutConwayConfig implements GameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 50;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "com.me.my_jetlag_game.storage";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  Make
  // sure names don't have spaces or other funny characters, and make sure you
  // put the corresponding files in the folder identified by `resourcePrefix`.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [];

  // The name of the function that builds the initial screen of the game
  gameBuilder = tut_conway;
}

/**
 * build the first "level" of a game.  Remember that opening scenes, cut scenes,
 * level choosers, the store, etc., are all "levels".  You might want to use
 * different functions to group different functionalities, with multiple
 * "levels" in each function.
 *
 * @param level Which level should be displayed
 */
export function tut_conway(level: number) {
  // see https://en.wikipedia.org/wiki/Conway's_Game_of_Life

  // Create the initial grid
  let cells = [] as Actor[][];
  for (let row = 0; row < 18; ++row) {
    let cols = [] as Actor[];
    for (let col = 0; col < 32; ++col)
      cols.push(Actor.Make({ rigidBody: BoxBody.Box({ cx: col + .5, cy: row + .5, width: 1, height: 1 }), appearance: new FilledBox({ width: 1, height: 1, fillColor: "#FFFFFF" }) }));
    cells.push(cols);
  }

  let cfg = [] as string[];

  if (level == 1) {
    cfg = [
      // Still Lifes: Block, Behive, Loaf, Boat, Tub
      "                                ",
      "       xx     xx    xx    x     ",
      " xx   x  x   x  x   x x  x x    ",
      " xx    xx     x x    x    x     ",
      "               x                ",
      "                                ",
      "                                ",
      // Oscillators: Blinker, Toad, Beacon
      "   x         xx                 ",
      "   x    xxx  xx                 ",
      "   x   xxx     xx               ",
      "               xx               ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
    ];
  }
  else if (level == 2) {
    // Period-2 Beacon
    cfg = [
      "                                ",
      "                                ",
      "    xxx   xxx                   ",
      "                                ",
      "  x    x x    x                 ",
      "  x    x x    x                 ",
      "  x    x x    x                 ",
      "    xxx   xxx                   ",
      "                                ",
      "    xxx   xxx                   ",
      "  x    x x    x                 ",
      "  x    x x    x                 ",
      "  x    x x    x                 ",
      "                                ",
      "    xxx   xxx                   ",
      "                                ",
      "                                ",
      "                                ",
    ];
  }
  else if (level == 3) {
    // Period-15 Penta-Decathlon
    cfg = [
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "     x                          ",
      "    xxx                         ",
      "   xx xx                        ",
      "  xxx xxx                       ",
      "  xxx xxx                       ",
      "  xxx xxx                       ",
      "  xxx xxx                       ",
      "   xx xx                        ",
      "    xxx                         ",
      "     x                          ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
    ];
  }
  else if (level == 4) {
    // The "Glider" spaceship, to demonstrate wrap-around
    // Also a "light-weight space ship"
    cfg = [
      "                                ",
      "            xx                  ",
      " x x      xx xx                 ",
      "  xx      xxxx                  ",
      "  x        xx                   ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
    ];
  }

  // Initialize it
  for (let row = 0; row < 18; ++row) {
    for (let col = 0; col < 32; ++col)
      if (cfg[row].charAt(col) === 'x') {
        cells[row][col].extra.live = true;
        (cells[row][col].appearance as FilledBox).fillColor = "#000000";
      }
      else {
        cells[row][col].extra.live = false;
      }
  }

  // Run the timer, do the update in two phases
  // NB: This is an update based on modular arithmetic... it wraps around
  stage.world.timer.addEvent(new TimedEvent(.01, true, () => {
    for (let row = 0; row < 18; ++row) {
      for (let col = 0; col < 32; ++col) {
        // Is this a live cell?
        let count = count_neighbors(cells, row, col);
        if (cells[row][col].extra.live) {
          // Any live cell with fewer than two live neighbors dies, as if by underpopulation.
          // Any live cell with more than three live neighbors dies, as if by overpopulation.
          if (count < 2 || count > 3)
            cells[row][col].extra.next = false;
          // Any live cell with two or three live neighbors lives on to the next generation.
          else
            cells[row][col].extra.next = true;
        }
        else {
          // Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
          cells[row][col].extra.next = (count == 3);
        }
      }
    }
    for (let row = 0; row < 18; ++row) {
      for (let col = 0; col < 32; ++col) {
        cells[row][col].extra.live = cells[row][col].extra.next;
        if (cells[row][col].extra.live)
          (cells[row][col].appearance as FilledBox).fillColor = "#000000";
        else
          (cells[row][col].appearance as FilledBox).fillColor = "#FFFFFF";
      }
    }
  }));

  // The follow-on exercise from here is to make it interactive: Put a button on
  // the hud to start the simulation, put a button on the hud to toggle modular
  // versus not, and let tapping on boxes set/unset them (all before the
  // simulation starts, of course!)
}

function checkNW(cells: Actor[][], row: number, col: number) {
  if (row == 0) row = 17; else row = row - 1;
  if (col == 0) col = 31; else col = col - 1;
  if (cells[row][col].extra.live) return 1; else return 0;
}
function checkN(cells: Actor[][], row: number, col: number) {
  return (cells[(row == 0) ? 17 : (row - 1)][col]).extra.live ? 1 : 0;
}
function checkNE(cells: Actor[][], row: number, col: number) {
  return (cells[(row + 18 - 1) % 18][(col + 32 + 1) % 32]).extra.live ? 1 : 0;
}
function checkW(cells: Actor[][], row: number, col: number) {
  return (cells[(row + 18 - 0) % 18][(col + 32 - 1) % 32]).extra.live ? 1 : 0;
}
function checkE(cells: Actor[][], row: number, col: number) {
  return (cells[(row + 18 - 0) % 18][(col + 32 + 1) % 32]).extra.live ? 1 : 0;
}
function checkSW(cells: Actor[][], row: number, col: number) {
  return (cells[(row + 18 + 1) % 18][(col + 32 - 1) % 32]).extra.live ? 1 : 0;
}
function checkS(cells: Actor[][], row: number, col: number) {
  return (cells[(row + 18 + 1) % 18][(col + 32 + 0) % 32]).extra.live ? 1 : 0;
}
function checkSE(cells: Actor[][], row: number, col: number) {
  return (cells[(row + 18 + 1) % 18][(col + 32 + 1) % 32]).extra.live ? 1 : 0;
}
function count_neighbors(cells: Actor[][], row: number, col: number) {
  return checkNW(cells, row, col) + checkN(cells, row, col) +
    checkNE(cells, row, col) + checkW(cells, row, col) +
    checkE(cells, row, col) + checkSW(cells, row, col) +
    checkS(cells, row, col) + checkSE(cells, row, col);
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new TutConwayConfig());