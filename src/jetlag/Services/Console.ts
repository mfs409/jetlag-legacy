import { GameCfg } from "../Config";

/**
 * Verbosity levels, for controlling how much output is printed to the console
 * during game play
 */
export enum ErrorVerbosity { SILENT = 0, QUIET = 1, LOUD = 2 }

/**
 * ConsoleService provides a clean and generic tool for printing debug messages.
 * The key benefit relative to just using `console.log` is that we can change
 * the verbosity level through game-level config.  That means with one line of
 * editing, we can switch to a "release" mode that skips all messages.
 */
export class ConsoleService {
  /**
   * Track the level of messages that is allowed
   * - 0: display nothing
   * - 1: display urgent messages
   * - 2: display urgent and informative messages
   */
  private verbosity_level = ErrorVerbosity.LOUD;

  /** Create an output console based on the game config object */
  constructor(cfg: GameCfg) { this.verbosity_level = cfg.verbosity; }

  /** Display an urgent message to the console */
  urgent(msg: string) { if (this.verbosity_level != ErrorVerbosity.SILENT) console.log(msg); }

  /** Display an informational message to the console */
  info(msg: string) { if (this.verbosity_level == ErrorVerbosity.LOUD) console.log(msg); }
}
