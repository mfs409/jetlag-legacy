import { MyConfig } from "./myconfig";
import { JetLagGame } from "../jetlag/JetLagGame"

/** The purpose of this file is to call the function that kicks off the game */
JetLagGame.runGameAsHtml('game-player', new MyConfig());