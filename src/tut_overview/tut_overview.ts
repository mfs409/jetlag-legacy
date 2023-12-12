import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon, TextSprite } from "../jetlag/Components/Appearance";
import { StandardMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { Actor } from "../jetlag/Entities/Actor";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { GridSystem } from "../jetlag/Systems/Grid";
import { Destination, Enemy, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { stage } from "../jetlag/Stage";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { TimedEvent } from "../jetlag/Systems/Timer";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
    // Standard screen dimensions and scaling
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;

    // This is a tutorial game, intended for the browser, with no storage
    canVibrate = false;
    forceAccelerometerOff = true;
    storageKey = "--no-key--";
    hitBoxes = true;

    // This game has no assets
    resourcePrefix = "./assets/";
    musicNames = [];
    soundNames = [];
    imageNames = [];
}

/**
 * Build the levels of the tutorial
 *
 * @param level Which level should be displayed
 */
function game(level: number) {
    level = 1;
    // A "clocked" game: turn and shoot
    if (level == 1) {
        // Draw a grid on the screen, covering the whole visible area
        GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 16, y: 9 });

        // Make a hero
        let h = Actor.Make({
            appearance: new FilledPolygon({ vertices: [0, -.5, .25, .5, -.25, .5], fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044", z: 1 }),
            rigidBody: new PolygonBody({ cx: 8, cy: 4.5, vertices: [0, -.5, .25, .5, -.25, .5] }, stage.world, { collisionsEnabled: false }),
            role: new Hero(),
            movement: new StandardMovement(),
        });

        // Set up arrow keys to control the hero
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(-6); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(0); });
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(6); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(0); });

        // Shoot!
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
            let dx = Math.cos(h.rigidBody.getRotation() - Math.PI / 2);
            let dy = Math.sin(h.rigidBody.getRotation() - Math.PI / 2);
            let x = h.rigidBody.getCenter().x;
            let y = h.rigidBody.getCenter().y;
            let scale = 8;
            let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 });
            rigidBody.setCollisionsEnabled(true);
            let appearance = new FilledCircle({ radius: .125, fillColor: "#bbbbbb", z: 0 });
            let role = new Projectile({ damage: 1, disappearOnCollide: true });
            Actor.Make({ appearance, rigidBody, movement: new ProjectileMovement(), role });
            role.tossAt(x, y, x + scale * dx, y + scale * dy, h, 0, 0);
        });

        // Raining enemies
        stage.world.timer.addEvent(new TimedEvent(2, true, () => {
            let angle = Math.random() * 2 * Math.PI;
            let hx = h.rigidBody.getCenter().x, hy = h.rigidBody.getCenter().y;
            let sx = 9 * Math.sin(angle) + hx, sy = 9 * Math.cos(angle) + hy;
            Actor.Make({
                appearance: new FilledCircle({ radius: .5, fillColor: "#F01100" }),
                rigidBody: new CircleBody({ cx: sx, cy: sy, radius: .5 }, stage.world),
                role: new Enemy({ damage: 1 }),
                movement: new PathMovement(new Path().to(sx, sy).to(hx, hy), 3, false),
            });
        }));

        stage.score.onWin = { level: level, builder: game }
        stage.score.onLose = { level: level, builder: game }
        stage.score.setVictoryEnemyCount(10);
    }
    // A "side scroller" game
    if (level == 2) {
        // Based on the values in the GameConfig object, we can expect to have a
        // screen that is a 16:9 ratio.  It will seem that the viewable area is
        // 16 meters by 9 meters.  We'll make the "world" twice as wide.  All
        // this really means is that the camera won't show anything outside of
        // the range (0,0):(32,9):
        stage.world.camera.setBounds(0, 0, 32, 9);

        // This game will be a platformer/side scroller, so we want gravity
        // downward:
        stage.world.setGravity(0, 9.8);

        // Draw a grid on the screen, covering the whole visible area
        GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 32, y: 9 });

        // Draw four walls, covering the four borders of the world
        Actor.Make({
            appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16, cy: .05, width: 32, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 16, cy: 8.95, width: 32, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: .05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: new BoxBody({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Make a hero, let the camera follow it
        let h = Actor.Make({
            appearance: new FilledCircle({ radius: .75, fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044" }),
            rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .75 }),
            role: new Hero(),
            movement: new StandardMovement(),
            gestures: { tap: () => { (h.movement as StandardMovement).updateYVelocity(-8); return true; } },
        });
        stage.world.camera.setCameraFocus(h);

        // Set up arrow keys to control the hero
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (h.movement as StandardMovement).updateXVelocity(-5); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (h.movement as StandardMovement).updateXVelocity(0); });
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as StandardMovement).updateXVelocity(5); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as StandardMovement).updateXVelocity(0); });

        // Make a destination
        Actor.Make({
            appearance: new FilledCircle({ radius: .5, fillColor: "#00ff00", lineWidth: 3, lineColor: "#004400" }),
            rigidBody: new CircleBody({ cx: 31, cy: 6, radius: .5 }),
            role: new Destination(),
            movement: new StandardMovement(),
        });

        // Draw a box, and write a timer on it.  Both go on the HUD
        Actor.Make({
            appearance: new FilledBox({ width: .75, height: .75, fillColor: "#eeeeee", lineWidth: 3, lineColor: "#000000" }),
            rigidBody: new BoxBody({ cx: 8, cy: .75, width: .75, height: .75 }, stage.hud),
        });
        Actor.Make({
            appearance: new TextSprite({ center: true, face: "Arial", color: "#444444", size: 48 }, () => (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0)),
            rigidBody: new BoxBody({ cx: 8, cy: .75, width: 1.8, height: 1 }, stage.hud),
        });

        // Set up the score
        stage.score.onWin = { level: level, builder: game }
        stage.score.onLose = { level: level, builder: game }
        stage.score.setLoseCountdownRemaining(10);
        stage.score.setVictoryDestination(1);
    }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), game);
