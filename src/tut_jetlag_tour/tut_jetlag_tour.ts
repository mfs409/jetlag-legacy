import { initializeAndLaunch } from "../jetlag/Stage";
import { GameCfg } from "../jetlag/Config";
import { ErrorVerbosity } from "../jetlag/Services/Console";
import { FilledSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ExplicitMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { Actor } from "../jetlag/Entities/Actor";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { GridSystem } from "../jetlag/Systems/GridSystem";
import { Destination, Enemy, Hero, Obstacle } from "../jetlag/Components/Role";
import { game } from "../jetlag/Stage";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { ProjectileSystem } from "../jetlag/Systems/Projectiles";
import { TimedEvent } from "../jetlag/Systems/Timer";

// TODO: Stop needing this
import * as Helpers from "../demo_game/helpers";

/** Configuration information for the tut_jetlag_tour game */
export class GameConfig implements GameCfg {
    // Standard screen dimensions and scaling
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;

    // This is a tutorial game, intended for the browser, with no storage
    canVibrate = false;
    forceAccelerometerOff = true;
    storageKey = "--no-key--";
    verbosity = ErrorVerbosity.LOUD;
    hitBoxes = true;

    // This game has no assets
    resourcePrefix = "./assets/";
    musicNames = [];
    soundNames = [];
    imageNames = [];

    // The name of the function that builds the initial screen of the game
    gameBuilder = tut_jetlag_tour;
}

/**
 * Build the levels of the tutorial
 *
 * @param level Which level should be displayed
 */
function tut_jetlag_tour(level: number) {
    // A "clocked" game: turn and shoot
    if (level == 1) {
        // Draw a grid on the screen, covering the whole visible area
        GridSystem.makeGrid(game.world, { x: 0, y: 0 }, { x: 16, y: 9 });

        // Make a hero, let the camera follow it
        let h = Actor.Make({
            appearance: FilledSprite.Polygon({ vertices: [0, -1, .25, 0, -.25, 0], fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044", z: 1 }),
            // TODO: Why can't poly compute width/height
            rigidBody: RigidBodyComponent.Polygon({ cx: 8, cy: 4.5, vertices: [0, -1, .25, 0, -.25, 0], width: 1, height: 1 }, game.world, { collisionsEnabled: false }),
            role: new Hero({ strength: 1 }),
            movement: new ExplicitMovement(),
        });
        game.world.camera.setCameraFocus(h);

        // Set up arrow keys to control the hero
        game.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(-6); });
        game.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(0); });
        game.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(6); });
        game.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(0); });

        // Set up projectiles
        let projectiles = new ProjectileSystem();
        Helpers.populateProjectilePool(game.world, projectiles, {
            maxAtOnce: 20, strength: 1, body: { radius: 0.125, cx: -100, cy: -100 },
            appearance: FilledSprite.Circle({ radius: .125, fillColor: "#bbbbbb", z: 0 }), range: 10, immuneToCollisions: true,
        });

        // Shoot!
        game.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
            let dx = Math.cos(h.rigidBody.getRotation() - Math.PI / 2);
            let dy = Math.sin(h.rigidBody.getRotation() - Math.PI / 2);
            let x = h.rigidBody.getCenter().x;
            let y = h.rigidBody.getCenter().y;
            let scale = 8;
            (projectiles.get()?.movement as ProjectileMovement).throwAt(projectiles, x, y, x + scale * dx, y + scale * dy, h, 0, 0);
        });


        // Raining enemies
        game.world.timer.addEvent(new TimedEvent(2, true, () => {
            let angle = Math.random() * 2 * Math.PI;
            let hx = h.rigidBody.getCenter().x, hy = h.rigidBody.getCenter().y;
            let sx = 9 * Math.sin(angle) + hx, sy = 9 * Math.cos(angle) + hy;
            Actor.Make({
                appearance: FilledSprite.Circle({ radius: .5, fillColor: "#F01100" }),
                rigidBody: RigidBodyComponent.Circle({ cx: sx, cy: sy, radius: .5 }, game.world),
                role: new Enemy({ damage: 1 }),
                movement: new PathMovement(new Path().to(sx, sy).to(hx, hy), 3, false),
            });
        }));

        game.score.onWin = { level: level, builder: tut_jetlag_tour }
        game.score.onLose = { index: level, builder: tut_jetlag_tour }
        game.score.setVictoryEnemyCount(10);
    }
    // A "side scroller" game
    if (level == 2) {
        // Based on the values in the GameConfig object, we can expect to have a
        // screen that is a 16:9 ratio.  It will seem that the viewable area is
        // 16 meters by 9 meters.  We'll make the "world" twice as wide.  All
        // this really means is that the camera won't show anything outside of
        // the range (0,0):(32,9):
        game.world.camera.setBounds(32, 9);

        // This game will be a platformer/side scroller, so we want gravity
        // downward:
        game.world.setGravity(0, 9.8);

        // Draw a grid on the screen, covering the whole visible area
        GridSystem.makeGrid(game.world, { x: 0, y: 0 }, { x: 32, y: 9 });

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: FilledSprite.Box({ width: 32, height: .1, fillColor: "#ff0000" }),
            rigidBody: RigidBodyComponent.Box({ cx: 16, cy: .05, width: 32, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: FilledSprite.Box({ width: 32, height: .1, fillColor: "#ff0000" }),
            rigidBody: RigidBodyComponent.Box({ cx: 16, cy: 8.95, width: 32, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: FilledSprite.Box({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: RigidBodyComponent.Box({ cx: .05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: FilledSprite.Box({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: RigidBodyComponent.Box({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Make a hero, let the camera follow it
        let h = Actor.Make({
            appearance: FilledSprite.Circle({ radius: .75, fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044" }),
            rigidBody: RigidBodyComponent.Circle({ cx: 3, cy: 3, radius: .75 }),
            role: new Hero(),
            movement: new ExplicitMovement(),
            gestures: { tap: () => { (h.movement as ExplicitMovement).updateYVelocity(-8); return true; } },
        });
        game.world.camera.setCameraFocus(h);

        // Set up arrow keys to control the hero
        game.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ExplicitMovement).updateXVelocity(-5); });
        game.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ExplicitMovement).updateXVelocity(0); });
        game.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ExplicitMovement).updateXVelocity(5); });
        game.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ExplicitMovement).updateXVelocity(0); });

        // Make a destination
        Actor.Make({
            appearance: FilledSprite.Circle({ radius: .5, fillColor: "#00ff00", lineWidth: 3, lineColor: "#004400" }),
            rigidBody: RigidBodyComponent.Circle({ cx: 31, cy: 6, radius: .5 }),
            role: new Destination(),
            movement: new ExplicitMovement(),
        });

        // Draw a box, and write a timer on it.  Both go on the HUD
        Actor.Make({
            scene: game.hud,
            appearance: FilledSprite.Box({ width: .75, height: .75, fillColor: "#eeeeee", lineWidth: 3, lineColor: "#000000" }),
            rigidBody: RigidBodyComponent.Box({ cx: 8, cy: .75, width: .75, height: .75 }, game.hud),
        });
        Actor.Make({
            scene: game.hud,
            appearance: new TextSprite({ center: true, face: "Arial", color: "#444444", size: 48 }, () => (game.score.loseCountDownRemaining ?? 0).toFixed(0)),
            rigidBody: RigidBodyComponent.Box({ cx: 8, cy: .75, width: 1.8, height: 1 }, game.hud),
        });

        // Set up the score
        game.score.onWin = { level: level, builder: tut_jetlag_tour }
        game.score.onLose = { index: level, builder: tut_jetlag_tour }
        game.score.loseCountDownRemaining = 10;
        game.score.setVictoryDestination(1);
    }
}


// call the function that kicks off the game
initializeAndLaunch("game-player", new GameConfig());