import { GameCfg } from "../Config";

/**
 * ConsoleService provides a clean and generic tool for printing debug messages.
 * The key benefit relative to just using `console.log` is that we can toggle
 * whether output happens or not, based on whether the game is in debug mode
 * (cfg.hitBoxes)
 */
export class ConsoleService {
  /** Create an output console based on the game config object */
  constructor(private cfg: GameCfg) { }

  /** Display a message to the console if we're not in debug mode */
  log(msg: string) { if (this.cfg.hitBoxes) console.log(msg); }
}
