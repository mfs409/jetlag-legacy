import { initializeAndLaunch } from "../jetlag/Stage";
import { GameConfig } from "../jetlag/Config";
import { ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { ExplicitMovement, InertMovement } from "../jetlag/Components/Movement";
import { Destination, Goodie, Hero, Obstacle, Passive } from "../jetlag/Components/Role";
import { Scene } from "../jetlag/Entities/Scene";
import { ImgConfigOpts, BoxCfgOpts, TxtConfigOpts } from "../jetlag/Config";
import { buildSplashScreen } from "../demo_game/Splash";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
class TutMazeGameConfig implements GameConfig {
    // It's very unlikely that you'll want to change these next four values.
    // Hover over them to see what they mean.
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;

    // When you deploy your game, you'll want to change all of these
    canVibrate = true;
    forceAccelerometerOff = true;
    storageKey = "com.me.my_jetlag_game.storage";
    hitBoxes = true;

    // Here's where we name all the images/sounds/background music files.  You'll
    // probably want to delete these files from the assets folder, remove them
    // from these lists, and add your own.
    resourcePrefix = "./assets/";
    musicNames = [];
    soundNames = [];
    imageNames = [
        // The non-animated actors in the game
        "green_ball.png", "mustard_ball.png", "red_ball.png", "blue_ball.png", "purple_ball.png", "grey_ball.png",

        // Some raw colors
        "black.png", "red.png", // TODO: stop needing these!

        // background noise, and buttons
        "noise.png", "pause.png",
    ];

    // The name of the function that builds the initial screen of the game
    gameBuilder = tut_maze_game;
}


/**
 * buildSplashScreen is used to draw the scene that we see when the game starts.
 * In our case, it's just a menu.  The splash screen is mostly just branding: it
 * usually just has a big logo and then buttons for going to the level chooser,
 * the store, and the help scenes.  On a phone, it should also have a button for
 * quitting the app.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is an index parameter.  In this code, we just ignore the index.
 *
 * @param level Which splash screen should be displayed
 */
function tut_maze_game(level: number) {
    if (level == 1) {  // Define the maze layout with walls, a hero, a destination, and a goodie
        const mazeLayout = [
            "####################",
            "#H                 #",
            "# # ### # # ## # # #",
            "# #  G  # #      # #",
            "# # ### ### #      #",
            "# #   #  G         #",
            "# # # # #####      #",
            "#   #     G        #",
            "####################",
        ];

        // Create a hero controlled explicitly via special touches
        let heroCfg = { cx: 1, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
        let h = Actor.Make({
            appearance: new ImageSprite(heroCfg),
            rigidBody: RigidBodyComponent.Circle(heroCfg, stage.world, { friction: 0.6 }),
            role: new Hero(),
            movement: new ExplicitMovement(),
        });

        // Create walls for the maze
        for (let row = 0; row < mazeLayout.length; row++) {
            for (let col = 0; col < mazeLayout[row].length; col++) {
                const cell = mazeLayout[row][col];
                if (cell === "#") {
                    let wallCfg = { cx: col + 0.5, cy: row + 0.5, width: 1, height: 1, img: "noise.png" };
                    Actor.Make({
                        rigidBody: RigidBodyComponent.Box(wallCfg, stage.world, { friction: 1 }),
                        appearance: new ImageSprite(wallCfg),
                        movement: new InertMovement(),
                        role: new Obstacle(),
                    });
                } else if (cell === "G") {
                    const goodieCfg = { cx: col + 0.5, cy: row + 0.5, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
                    Actor.Make({
                        appearance: new ImageSprite(goodieCfg),
                        rigidBody: RigidBodyComponent.Circle(goodieCfg, stage.world),
                        movement: new InertMovement(),
                        role: new Goodie(),
                    });
                }
            }
        }


        // Create a destination for the goodie
        let destCfg = { cx: 15, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
        Actor.Make({
            appearance: new ImageSprite(destCfg),
            rigidBody: RigidBodyComponent.Circle(destCfg, stage.world),
            role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) >= 1; } }),
            movement: new InertMovement(),
        });
        stage.score.setVictoryDestination(1);

        Actor.Make({
            appearance: new TextSprite({ center: false, face: "Arial", color: "#3C46FF", size: 20, z: 2 }, () => 3 - stage.score.getGoodieCount(0) + " Remaining Goodies"),
            role: new Passive(),
            movement: new InertMovement(),
            rigidBody: RigidBodyComponent.Box({ cx: 1, cy: 0.25, width: .1, height: .1 }, stage.hud),
        });

        // Draw a joystick on the HUD to control the hero
        addJoystickControl(stage.hud, { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: true });

        winMessage("Great Job");

        stage.score.onLose = { level: level, builder: buildSplashScreen };
        stage.score.onWin = { level: level, builder: buildSplashScreen };
    }
    else if (level == 2) {
        makeText(stage.world, { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#000000", size: 28, z: 0 }, () => "Nothing here yet...")
    }
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the win screen for the game
 *
 * @param message   The message to display in the middle of the screen
 * @param callback  Code to run when the win message first appears
 */
function winMessage(message: string, callback?: () => void) {
    stage.score.winSceneBuilder = (overlay: Scene) => {
        addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" }, () => {
            stage.clearOverlay();
            stage.switchTo(() => { }, 1);
            return true;
        });
        makeText(overlay, { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
        if (callback) callback();
    };
}

/**
 * Draw a touchable region of the screen that acts as a joystick.  As the
 * user performs Pan actions within the region, the actor's velocity should
 * change accordingly.
 *
 * @param scene     Where to draw the joystick
 * @param cfgOpts   An ImgConfig object, for the appearance of the joystick
 * @param actor     The actor to move with this joystick
 * @param scale     A value to use to scale the velocity produced by the
 *                  joystick
 * @param stopOnUp  Should the actor stop when the joystick is released?
 */
function addJoystickControl(scene: Scene, cfgOpts: ImgConfigOpts & BoxCfgOpts, cfg: { actor: Actor, scale?: number, stopOnUp?: boolean }) {
    let moving = false;
    function doMove(hudCoords: { x: number; y: number }) {
        moving = true;
        (cfg.actor.movement as ExplicitMovement).setAbsoluteVelocity(
            (cfg.scale ?? 1) * (hudCoords.x - cfgOpts.cx),
            (cfg.scale ?? 1) * (hudCoords.y - cfgOpts.cy));
        return true;
    }
    function doStop() {
        if (!moving) return true;
        moving = false;
        if (!!cfg.stopOnUp) {
            (cfg.actor.movement as ExplicitMovement).setAbsoluteVelocity(0, 0);
            cfg.actor.rigidBody?.clearRotation();
        }
        return true;
    }
    return addPanCallbackControl(scene, cfgOpts, doMove, doMove, doStop);
}

/**
 * Add a control that runs custom code when pressed, on any finger movement, and
 * when released
 *
 * @param scene     The scene where the control should be drawn
 * @param cfg       Configuration for an image and a box
 * @param panStart  The action to perform when the pan event starts
 * @param panMove   The action to perform when the finger moves
 * @param panStop   The action to perform when the pan event stops
 */
function addPanCallbackControl(scene: Scene, cfg: ImgConfigOpts & BoxCfgOpts, panStart: (coords: { x: number; y: number }) => boolean, panMove: (coords: { x: number; y: number }) => boolean, panStop: (coords: { x: number; y: number }) => boolean) {
    // TODO: it's probably not worth having this helper function
    let c = Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: RigidBodyComponent.Box(cfg, scene),
        movement: new InertMovement(),
        role: new Passive(),
    });
    c.gestures = { panStart, panMove, panStop };
    return c;
}

/**
 * Add a button that performs an action when clicked.
 *
 * @param scene The scene where the button should go
 * @param cfg   Configuration for an image and a box
 * @param tap   The code to run in response to a tap
 */
function addTapControl(scene: Scene, cfg: ImgConfigOpts & BoxCfgOpts, tap: (coords: { x: number; y: number }) => boolean) {
    // TODO: we'd have more flexibility if we passed in an appearance, or just got
    // rid of this, but we use it too much for that refactor to be worthwhile.
    let c = Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: RigidBodyComponent.Box(cfg, scene),
        movement: new InertMovement(),
        role: new Passive(),
    });
    c.gestures = { tap };
    return c;
}

/**
 * Create an Actor whose appearance is text.  Since every Actor needs to have a
 * body, this will create a simple body to accompany the actor.
 *
 * @param scene     The scene where the Text should be made
 * @param cfgOpts   Text configuration options
 * @param producer  A callback for making the text for this Actor
 *
 * @returns An actor whose appearance is a TextSprite based on `cfgOpts`
 */
function makeText(scene: Scene, cfgOpts: TxtConfigOpts & BoxCfgOpts, producer: () => string): Actor {
    return Actor.Make({
        appearance: new TextSprite(cfgOpts, producer),
        // TODO: the ".1" options are somewhat arbitrary
        rigidBody: RigidBodyComponent.Box({ cx: cfgOpts.cx, cy: cfgOpts.cy, width: .1, height: .1 }, scene),
        movement: new InertMovement(),
        role: new Passive(),
    });
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new TutMazeGameConfig());
