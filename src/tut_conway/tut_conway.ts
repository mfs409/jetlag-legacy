import { initializeAndLaunch } from "../jetlag/Stage";
import { GameConfig } from "../jetlag/Config";
import { FilledBox, TextSprite } from "../jetlag/Components/Appearance";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { GridSystem } from "../jetlag/Systems/Grid";

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
  hitBoxes = false;

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

  level = 10;

  if (level != 10) {
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
        // Still Life: Block, Beehive, Loaf, Boat, Tub
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
          (cells[row][col].appearance as FilledBox).fillColor = "#757575";
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
            // Any live cell with fewer than two live neighbors dies, as if by under-population.
            // Any live cell with more than three live neighbors dies, as if by over-population.
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
            (cells[row][col].appearance as FilledBox).fillColor = "#757575";
          else
            (cells[row][col].appearance as FilledBox).fillColor = "#FFFFFF";
        }
      }
    }));

    // The follow-on exercise from here is to make it interactive: Put a button
    // on the hud to start the simulation, put a button on the hud to toggle
    // modular versus not, and let tapping on boxes set/unset them (all before
    // the simulation starts, of course!)
  }

  // Here's the solution :)
  if (level == 10) {
    GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 32, y: 16 }, 2, false);

    let sim_running = false;
    const SPEED_MAX = 5; // 0 is fast, 4 is slow
    let speed_limit = SPEED_MAX - 1; // start slow :)
    let mod_mode = true; // wrap mode
    let speed_ticks = 0;
    const ROWS = 16;
    const COLS = 32;

    // Make the UI
    Actor.Make({
      rigidBody: BoxBody.Box({ cx: 4, cy: 17, width: 8, height: 2 }, stage.hud),
      appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => sim_running ? "Running" : "Paused"),
      gestures: { tap: () => { sim_running = !sim_running; return true; } }
    });

    Actor.Make({
      rigidBody: BoxBody.Box({ cx: 16, cy: 17, width: 8, height: 2 }, stage.hud),
      appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => mod_mode ? "wrap: ON" : "wrap: OFF"),
      gestures: { tap: () => { if (!sim_running) mod_mode = !mod_mode; return true; } }
    });

    Actor.Make({
      rigidBody: BoxBody.Box({ cx: 28, cy: 17, width: 8, height: 2 }, stage.hud),
      appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => "Speed: " + (SPEED_MAX - speed_limit)),
      gestures: { tap: () => { speed_limit = (speed_limit + SPEED_MAX - 1) % SPEED_MAX; return true; } }
    });

    // Create the initial grid
    let cells = [] as Actor[][];
    for (let row = 0; row < ROWS; ++row) {
      let cols = [] as Actor[];
      for (let col = 0; col < COLS; ++col) {
        let cell = Actor.Make({
          rigidBody: BoxBody.Box({ cx: col + .5, cy: row + .5, width: 1, height: 1 }),
          appearance: new FilledBox({ width: 1, height: 1, fillColor: "#FFFFFF" }),
          gestures: {
            tap: () => {
              if (!sim_running) {
                cell.extra.live = !cell.extra.live;
                (cell.appearance as FilledBox).fillColor = cell.extra.live ? "#757575" : "#FFFFFF";
              }
              return true;
            }
          }
        });
        cell.extra.live = false;
        cell.extra.next = false;
        cols.push(cell);
      }
      cells.push(cols);
    }

    function get_count_crop(cells: Actor[][], row: number, col: number, max_row: number, max_col: number) {
      let sum = 0 - cells[row][col].extra.live;
      for (let r of [row - 1, row, row + 1]) {
        for (let c of [col - 1, col, col + 1]) {
          if (r > -1 && r < max_row && c > -1 && c < max_col)
            sum += (cells[r][c].extra.live ? 1 : 0);
        }
      }
      return sum;
    }

    function get_count_mod(cells: Actor[][], row: number, col: number, max_row: number, max_col: number) {
      let sum = 0 - cells[row][col].extra.live;
      for (let r of [-1, 0, 1]) {
        for (let c of [-1, 0, 1]) {
          sum += (cells[(row + max_row + r) % max_row][(col + max_col + c) % max_col].extra.live ? 1 : 0);
        }
      }
      return sum;
    }

    // Run the timer, do the update in two phases
    stage.world.timer.addEvent(new TimedEvent(.1, true, () => {
      // Don't simulate when it's disabled
      if (!sim_running) return;
      // Obey the speed limit
      speed_ticks = (speed_ticks + 1) % (speed_limit + 1);
      if (speed_ticks != 0) return;

      // Count at each cell to compute next state
      for (let row = 0; row < ROWS; ++row) {
        for (let col = 0; col < COLS; ++col) {
          let counter = mod_mode ? get_count_mod : get_count_crop;
          let count = counter(cells, row, col, ROWS, COLS);
          cells[row][col].extra.next = (cells[row][col].extra.live) ? (count == 2 || count == 3) : (count == 3);
        }
      }
      // Update current state from next state
      for (let row = 0; row < ROWS; ++row) {
        for (let col = 0; col < COLS; ++col) {
          cells[row][col].extra.live = cells[row][col].extra.next;
          (cells[row][col].appearance as FilledBox).fillColor =
            (cells[row][col].extra.live) ?
              "#757575" : "#FFFFFF";
        }
      }
    }));
  }
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