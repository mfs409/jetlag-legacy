// Last review: 2023-02-20

import { DemoGameConfig } from "./GameConfig";
import { initializeAndLaunch } from "../jetlag/Stage";

// call the function that kicks off the game
initializeAndLaunch("game-player", new DemoGameConfig());