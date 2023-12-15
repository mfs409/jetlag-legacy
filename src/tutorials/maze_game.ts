import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { ManualMovement, Path, PathMovement } from "../jetlag/Components/Movement";
import { Destination, Enemy, Goodie, Hero, Obstacle } from "../jetlag/Components/Role";
import { Scene } from "../jetlag/Entities/Scene";
import { KeyCodes } from "../jetlag/Services/Keyboard";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
    // We want a landscape game.  The reference layout is 1600x900 pixels, with
    // 100 pixels representing a meter
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true; // Resize to fill the screen

    // This game does not use vibration or accelerometer
    canVibrate = false;
    forceAccelerometerOff = true;
    // This game does not use any local persistent storage
    storageKey = "--no-key--";
    // For now, we're in debug mode, so print console messages and show hitboxes
    hitBoxes = true;

    // Asset configuration
    resourcePrefix = "./assets/";
    musicNames = [];
    soundNames = [];
    imageNames = ["sprites.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
    // Level 1 is the final game, without hitboxes, suitable for the start of
    // the tutorial
    if (level == 1) {
        stage.renderer.suppressHitBoxes = true;

        // Define the maze layout with walls, a hero, a destination, and a goodie
        const mazeLayout = [
            "H#G             ",
            " ####### ##### #",
            " #     # #G#   #",
            " # ### # # # # #",
            " #   #   # # #  ",
            " #G#G# #   #G# #",
            " ##### ## ####  ",
            " #   #   #   ## ",
            "   #   #   #G#D ",
        ];

        stage.backgroundColor = "#b3cde0";

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));

        // Create walls and goodies from the `mazeLayout`
        for (let row = 0; row < mazeLayout.length; row++) {
            for (let col = 0; col < mazeLayout[row].length; col++) {
                if (mazeLayout[row][col] === "#") {
                    Actor.Make({
                        rigidBody: new BoxBody({ cx: col + 0.5, cy: row + 0.5, width: 1, height: 1 }),
                        appearance: new FilledBox({ width: 1, height: 1, fillColor: "#6497b1" }),
                        role: new Obstacle(),
                    });
                }
                else if (mazeLayout[row][col] === "G") {
                    Actor.Make({
                        appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
                        rigidBody: new CircleBody({ cx: col + 0.5, cy: row + 0.5, radius: 0.25 }),
                        role: new Goodie(),
                    });
                }
            }
        }

        // Create a destination that requires 6 goodies before it works
        Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
            rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: 0.4 }),
            role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) == 6; } }),
        });
        stage.score.setVictoryDestination(1);

        // Put a message on the screen to help the player along
        Actor.Make({
            appearance: new TextSprite({ center: false, face: "Arial", color: "#005b96", size: 20, z: 2 }, () => "You need " + (6 - stage.score.getGoodieCount(0)) + " more Goodies"),
            rigidBody: new BoxBody({ cx: 13.6, cy: 0.05, width: .1, height: .1 }, { scene: stage.hud }),
        });

        // Add an enemy
        Actor.Make({
            appearance: new ImageSprite({ width: .8, height: .8, img: "red_ball.png" }),
            rigidBody: new CircleBody({ radius: .4, cx: 8.5, cy: .5 }),
            role: new Enemy(),
            movement: new PathMovement(new Path().to(8.5, .5).to(8.5, 5.5).to(10.5, 5.5).to(10.5, 2.5).to(10.5, 5.5).to(8.5, 5.5).to(8.5, .5), 3, true)
        });

        // When the level is won, put some white text on a black background.
        // Clicking restarts the level.
        stage.score.winSceneBuilder = (overlay: Scene) => {
            Actor.Make({
                appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
                gestures: {
                    tap: () => {
                        stage.clearOverlay();
                        stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
                        return true;
                    }
                }
            });
            Actor.Make({
                appearance: new TextSprite({ center: true, face: "Arial", color: " #FFFFFF", size: 28 }, "You Won!"),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay })
            });
        };

        // When the level is lost, put some white text on a black background.
        // Clicking restarts the level.
        stage.score.loseSceneBuilder = (overlay: Scene) => {
            Actor.Make({
                appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
                gestures: {
                    tap: () => {
                        stage.clearOverlay();
                        stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
                        return true;
                    }
                }
            });
            Actor.Make({
                appearance: new TextSprite({ center: true, face: "Arial", color: " #FFFFFF", size: 28 }, "Try Again..."),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay })
            });
        };

        stage.score.onLose = { level, builder };
        stage.score.onWin = { level, builder };
    }

    // Don't forget: before diving into the code, present the configuration
    // object, the imports, and the call to the launcher.

    // Level 2 is where we get started, by just having a hero we can move
    else if (level == 2) {
        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));
    }
    // Level 3 adds a destination and a background color
    else if (level == 3) {
        stage.backgroundColor = "#b3cde0";

        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));

        // Create a destination
        Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
            rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: 0.4 }),
            role: new Destination(),
        });
        stage.score.setVictoryDestination(1);

        // Win/Lose transitions
        stage.score.onLose = { level, builder };
        stage.score.onWin = { level, builder };
    }
    // Level 4 adds a wall and a goodie, plus borders
    else if (level == 4) {
        stage.backgroundColor = "#b3cde0";

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));

        Actor.Make({
            rigidBody: new BoxBody({ cx: 4.5, cy: 4.5, width: 1, height: 1 }),
            appearance: new FilledBox({ width: 1, height: 1, fillColor: "#6497b1" }),
            role: new Obstacle(),
        });

        Actor.Make({
            appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
            rigidBody: new CircleBody({ cx: 6.5, cy: 6.5, radius: 0.25 }),
            role: new Goodie(),
        });

        // Create a destination
        Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
            rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: 0.4 }),
            role: new Destination(),
        });
        stage.score.setVictoryDestination(1);

        stage.score.onLose = { level, builder };
        stage.score.onWin = { level, builder };
    }
    // Level 5 adds a fancy way to make walls and goodies
    else if (level == 5) {
        // Define the maze layout with walls, a hero, a destination, and a goodie
        const mazeLayout = [
            "H#G             ",
            " ####### ##### #",
            " #     # #G#   #",
            " # ### # # # # #",
            " #   #   # # #  ",
            " #G#G# #   #G# #",
            " ##### ## ####  ",
            " #   #   #   ## ",
            "   #   #   #G#D ",
        ];

        stage.backgroundColor = "#b3cde0";

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));

        // Create walls and goodies from the `mazeLayout`
        for (let row = 0; row < mazeLayout.length; row++) {
            for (let col = 0; col < mazeLayout[row].length; col++) {
                if (mazeLayout[row][col] === "#") {
                    Actor.Make({
                        rigidBody: new BoxBody({ cx: col + 0.5, cy: row + 0.5, width: 1, height: 1 }),
                        appearance: new FilledBox({ width: 1, height: 1, fillColor: "#6497b1" }),
                        role: new Obstacle(),
                    });
                }
                else if (mazeLayout[row][col] === "G") {
                    Actor.Make({
                        appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
                        rigidBody: new CircleBody({ cx: col + 0.5, cy: row + 0.5, radius: 0.25 }),
                        role: new Goodie(),
                    });
                }
            }
        }

        // Create a destination
        Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
            rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: 0.4 }),
            role: new Destination(),
        });
        stage.score.setVictoryDestination(1);

        stage.score.onLose = { level, builder };
        stage.score.onWin = { level, builder };
    }
    // Level 6 "Activates" the destination and adds some helpful text
    else if (level == 6) {
        // Define the maze layout with walls, a hero, a destination, and a goodie
        const mazeLayout = [
            "H#G             ",
            " ####### ##### #",
            " #     # #G#   #",
            " # ### # # # # #",
            " #   #   # # #  ",
            " #G#G# #   #G# #",
            " ##### ## ####  ",
            " #   #   #   ## ",
            "   #   #   #G#D ",
        ];

        stage.backgroundColor = "#b3cde0";

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));

        // Create walls and goodies from the `mazeLayout`
        for (let row = 0; row < mazeLayout.length; row++) {
            for (let col = 0; col < mazeLayout[row].length; col++) {
                if (mazeLayout[row][col] === "#") {
                    Actor.Make({
                        rigidBody: new BoxBody({ cx: col + 0.5, cy: row + 0.5, width: 1, height: 1 }),
                        appearance: new FilledBox({ width: 1, height: 1, fillColor: "#6497b1" }),
                        role: new Obstacle(),
                    });
                }
                else if (mazeLayout[row][col] === "G") {
                    Actor.Make({
                        appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
                        rigidBody: new CircleBody({ cx: col + 0.5, cy: row + 0.5, radius: 0.25 }),
                        role: new Goodie(),
                    });
                }
            }
        }

        // Create a destination that requires 6 goodies before it works
        Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
            rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: 0.4 }),
            role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) == 6; } }),
        });
        stage.score.setVictoryDestination(1);

        // Put a message on the screen to help the player along
        Actor.Make({
            appearance: new TextSprite({ center: false, face: "Arial", color: "#005b96", size: 20, z: 2 }, () => "You need " + (6 - stage.score.getGoodieCount(0)) + " more Goodies"),
            rigidBody: new BoxBody({ cx: 13.6, cy: 0.05, width: .1, height: .1 }, { scene: stage.hud }),
        });

        stage.score.onLose = { level, builder };
        stage.score.onWin = { level, builder };
    }
    // Level 7 finishes by adding an enemy and win/lose builders (but leaves on
    // the hitboxes)
    else if (level == 7) {
        // Define the maze layout with walls, a hero, a destination, and a goodie
        const mazeLayout = [
            "H#G             ",
            " ####### ##### #",
            " #     # #G#   #",
            " # ### # # # # #",
            " #   #   # # #  ",
            " #G#G# #   #G# #",
            " ##### ## ####  ",
            " #   #   #   ## ",
            "   #   #   #G#D ",
        ];

        stage.backgroundColor = "#b3cde0";

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Create a hero whose movement we can control "explicitly"
        let h = Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png", z: 1 }),
            rigidBody: new CircleBody({ cx: .5, cy: .5, radius: 0.4, }),
            role: new Hero(),
            movement: new ManualMovement(),
        });

        // Set up the keyboard for controlling the hero
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (h.movement as ManualMovement).updateYVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (h.movement as ManualMovement).updateYVelocity(5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-5));
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(5));

        // Create walls and goodies from the `mazeLayout`
        for (let row = 0; row < mazeLayout.length; row++) {
            for (let col = 0; col < mazeLayout[row].length; col++) {
                if (mazeLayout[row][col] === "#") {
                    Actor.Make({
                        rigidBody: new BoxBody({ cx: col + 0.5, cy: row + 0.5, width: 1, height: 1 }),
                        appearance: new FilledBox({ width: 1, height: 1, fillColor: "#6497b1" }),
                        role: new Obstacle(),
                    });
                }
                else if (mazeLayout[row][col] === "G") {
                    Actor.Make({
                        appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
                        rigidBody: new CircleBody({ cx: col + 0.5, cy: row + 0.5, radius: 0.25 }),
                        role: new Goodie(),
                    });
                }
            }
        }

        // Create a destination that requires 6 goodies before it works
        Actor.Make({
            appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
            rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: 0.4 }),
            role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) == 6; } }),
        });
        stage.score.setVictoryDestination(1);

        // Put a message on the screen to help the player along
        Actor.Make({
            appearance: new TextSprite({ center: false, face: "Arial", color: "#005b96", size: 20, z: 2 }, () => "You need " + (6 - stage.score.getGoodieCount(0)) + " more Goodies"),
            rigidBody: new BoxBody({ cx: 13.6, cy: 0.05, width: .1, height: .1 }, { scene: stage.hud }),
        });

        // Add an enemy
        Actor.Make({
            appearance: new ImageSprite({ width: .8, height: .8, img: "red_ball.png" }),
            rigidBody: new CircleBody({ radius: .4, cx: 8.5, cy: .5 }),
            role: new Enemy(),
            movement: new PathMovement(new Path().to(8.5, .5).to(8.5, 5.5).to(10.5, 5.5).to(10.5, 2.5).to(10.5, 5.5).to(8.5, 5.5).to(8.5, .5), 3, true)
        });

        // When the level is won, put some white text on a black background.
        // Clicking restarts the level.
        stage.score.winSceneBuilder = (overlay: Scene) => {
            Actor.Make({
                appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
                gestures: {
                    tap: () => { stage.clearOverlay(); stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level); return true; }
                }
            });
            Actor.Make({
                appearance: new TextSprite({ center: true, face: "Arial", color: " #FFFFFF", size: 28 }, "You Won!"),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay })
            });
        };

        // When the level is lost, put some white text on a black background.
        // Clicking restarts the level.
        stage.score.loseSceneBuilder = (overlay: Scene) => {
            Actor.Make({
                appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
                gestures: {
                    tap: () => {
                        stage.clearOverlay();
                        stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
                        return true;
                    }
                }
            });
            Actor.Make({
                appearance: new TextSprite({ center: true, face: "Arial", color: " #FFFFFF", size: 28 }, "Try Again..."),
                rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay })
            });
        };

        stage.score.onLose = { level, builder };
        stage.score.onWin = { level, builder };
    }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
