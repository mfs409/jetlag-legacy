import { MyConfig } from "./myconfig";
import { runGameAsHtml } from "../jetlag/launcher"

/** The purpose of this file is to call the function that kicks off the game */
runGameAsHtml('game-player', new MyConfig());