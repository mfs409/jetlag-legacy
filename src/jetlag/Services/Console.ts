import { GameConfig } from "../Config";

/**
 * ConsoleService provides a clean and generic tool for printing debug messages.
 * The key benefit relative to using `console.log` directly is ConsoleService
 * disables all output when `cfg.hitBoxes` is false, which is nice when
 * releasing a game.
 */
export class ConsoleService {
  /** Create an output console based on the game config object */
  constructor(private cfg: GameConfig) { }

  /** Display a message to the console if we're not in debug mode */
  log(msg: string) { if (this.cfg.hitBoxes) console.log(msg); }
}
