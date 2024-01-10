import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, TextSprite } from "../jetlag/Components/Appearance";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { GridSystem } from "../jetlag/Systems/Grid";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  pixelMeterRatio = 20;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = false;
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // NB: 21 levels, and then there's our "builder level" as 22
  // see https://en.wikipedia.org/wiki/Conway's_Game_of_Life
  let blank = [" "];
  let block = ["xx", "xx"];
  let beehive = [" xx ", "x  x", " xx "];
  let loaf = [" xx ", "x  x", " x x", "  x "];
  let boat = ["xx ", "x x", " x "];
  let tub = [" x ", "x x", " x "];
  let blinker = ["   ", "xxx", "   "];
  let toad = [" xxx", "xxx "];
  let beacon = ["xx  ", "xx  ", "  xx", "  xx"];
  let pulsar = [
    "  xxx   xxx  ", "             ", "x    x x    x", "x    x x    x",
    "x    x x    x", "  xxx   xxx  ", "             ", "  xxx   xxx  ",
    "x    x x    x", "x    x x    x", "x    x x    x", "             ",
    "  xxx   xxx  "];
  let penta_decathlon = [
    "   x   ", "  xxx  ", " xx xx ", "xxx xxx", "xxx xxx",
    "xxx xxx", "xxx xxx", " xx xx ", "  xxx  ", "   x   "];
  let glider = [" x x", "  xx", "  x "];
  let lwss = ["  xx ", "xx xx", "xxxx ", " xx  "];
  let mwss = [" xxx  ", "xxxxx ", "xxx xx", "   xx "];
  let hwss = [" xxxx  ", "xxxxxx ", "xxxx xx", "    xx "];
  let r_pentomino = [" xx", "xx ", " x "];
  let diehard = ["      x ", "xx      ", " x   xxx"];
  let acorn = [" x     ", "   x   ", "xx  xxx"];
  let gosper = [
    "                        x           ",
    "                      x x           ",
    "            xx      xx            xx",
    "           x   x    xx            xx",
    "xx        x     x   xx              ",
    "xx        x   x xx    x x           ",
    "          x     x       x           ",
    "           x   x                    ",
    "            xx                      ",
  ];
  let switch_engine_1 = ["      x ", "    x xx", "    x x ", "    x   ", "  x     ", "x x     "];
  let switch_engine_2 = ["xxx x", "x    ", "   xx", " xx x", "x x x"]
  let switch_engine_3 = ["xxxxxxxx xxxxx   xxx      xxxxxxx xxxxx"]

  let options = [blank, block, beehive, loaf, boat, tub, blinker, toad, beacon, pulsar, penta_decathlon, glider, lwss, mwss, hwss, r_pentomino, diehard, acorn, gosper, switch_engine_1, switch_engine_2, switch_engine_3];
  let names = ["blank", "block", "beehive", "loaf", "boat", "tub", "blinker",
    "toad", "beacon", "pulsar", "penta_decathlon", "glider", "lwss", "mwss", "hwss",
    "r_pentomino", "diehard", "acorn", "gosper", "switch_1", "switch_2", "switch_3"];

  let sim_running = false;
  const SPEED_MAX = 5; // 0 is fast, 4 is slow
  let speed_limit = SPEED_MAX - 1; // start slow :)
  let mod_mode = true; // wrap mode
  let speed_ticks = 0;
  const ROWS = 40;
  const COLS = 80;

  GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: COLS, y: ROWS }, 2, false);

  let next_level = level + 1;
  if (next_level > (options.length)) next_level = 1;

  // Make the UI
  new Actor({
    rigidBody: new BoxBody({ cx: 6, cy: 42.5, width: 10, height: 4 }, { scene: stage.hud }),
    appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => sim_running ? "Running" : "Paused"),
    gestures: { tap: () => { sim_running = !sim_running; return true; } }
  });

  new Actor({
    rigidBody: new BoxBody({ cx: 18, cy: 42.5, width: 10, height: 4 }, { scene: stage.hud }),
    appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => mod_mode ? "wrap: ON" : "wrap: OFF"),
    gestures: { tap: () => { if (!sim_running) mod_mode = !mod_mode; return true; } }
  });

  new Actor({
    rigidBody: new BoxBody({ cx: 30, cy: 42.5, width: 10, height: 4 }, { scene: stage.hud }),
    appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => "Speed: " + (SPEED_MAX - speed_limit)),
    gestures: { tap: () => { speed_limit = (speed_limit + SPEED_MAX - 1) % SPEED_MAX; return true; } }
  });

  new Actor({
    rigidBody: new BoxBody({ cx: 42, cy: 42.5, width: 10, height: 4 }, { scene: stage.hud }),
    appearance: new TextSprite({ center: true, face: "Arial", size: 36, color: "#000000" }, () => "Level: " + level),
    gestures: { tap: () => { stage.switchTo(builder, next_level); return true; } }
  });

  new Actor({
    rigidBody: new BoxBody({ cx: 49, cy: 41.6, width: .1, height: .1 }, { scene: stage.hud }),
    appearance: new TextSprite({ center: false, face: "Arial", size: 36, color: "#000000" }, () => names[level - 1]),
  });

  function toggle(cell: Actor) {
    cell.extra.live = !cell.extra.live;
    (cell.appearance[0] as FilledBox).fillColor = cell.extra.live ? "#757575" : "#FFFFFF";
  }

  // Create the initial grid
  let cells = [] as Actor[][];
  for (let row = 0; row < ROWS; ++row) {
    let cols = [] as Actor[];
    for (let col = 0; col < COLS; ++col) {
      let cell = new Actor({
        rigidBody: new BoxBody({ cx: col + .5, cy: row + .5, width: 1, height: 1 }),
        appearance: new FilledBox({ width: 1, height: 1, fillColor: "#FFFFFF" }),
        gestures: {
          tap: () => {
            if (!sim_running)
              toggle(cell);
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

  let opt = options[level - 1];
  if (opt) {
    let w = opt[0].length;
    let h = opt.length;
    let sx = Math.floor((COLS - w) / 2);
    let sy = Math.floor((ROWS - h) / 2);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        if (opt[y].charAt(x) === 'x')
          toggle(cells[sy + y][sx + x]);
      }
    }
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
        (cells[row][col].appearance[0] as FilledBox).fillColor =
          (cells[row][col].extra.live) ?
            "#757575" : "#FFFFFF";
      }
    }
  }));
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
