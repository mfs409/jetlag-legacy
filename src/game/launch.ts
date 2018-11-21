import { GameConfig } from "./GameConfig";
import { runGameAsHtml } from "../jetlag/launcher"

// call the function that kicks off the game
runGameAsHtml('game-player', new GameConfig());