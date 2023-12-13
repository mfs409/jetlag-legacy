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
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
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

        stage.score.onWin = { level: level, builder: builder }
        stage.score.onLose = { level: level, builder: builder }
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
        stage.score.onWin = { level: level, builder: builder }
        stage.score.onLose = { level: level, builder: builder }
        stage.score.setLoseCountdownRemaining(10);
        stage.score.setVictoryDestination(1);
    }

    // This shows that it is possible to make a level that is larger than a
    // screen.
    //
    // This level also introduces the "heads up display" (the "HUD").  We can put
    // information on the HUD, and we can also draw actors on the hud who we can
    // touch in order to achieve new behaviors.  In this case, we'll put zoom-in
    // and zoom-out buttons on the HUD.
    else if (level == 11) {
        // make the level really big, and set up tilt
        stage.world.camera.setBounds(0, 0, 64, 36);
        drawBoundingBox(0, 0, 64, 36, .1, { density: 1, elasticity: .3, friction: .4 });
        enableTilt(10, 10);

        // put the hero and destination far apart
        let cfg = { cx: 1, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
        let h = Actor.Make({
            appearance: new ImageSprite(cfg),
            rigidBody: new CircleBody(cfg, stage.world, { friction: 0.6 }),
            movement: new TiltMovement(),
            role: new Hero(),
        });

        cfg = { cx: 63, cy: 35, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
        Actor.Make({
            appearance: new ImageSprite(cfg),
            rigidBody: new CircleBody(cfg, stage.world),
            role: new Destination(),
        });

        stage.score.setVictoryDestination(1);

        // By default, the camera is centered on the point 8, 4.5f.  We can instead
        // have the camera stay centered on the hero, so that we can keep seeing the
        // hero as it moves around the world.  Note that this is the most
        // rudimentary way to follow the hero's movement, and it's not going to look
        // good when the hero is close to the level's boundaries.
        stage.world.camera.setCameraFocus(h);

        // add zoom buttons. We are using blank images, which means that the buttons
        // will be invisible... that's nice, because we can make the buttons big
        // (covering the left and right halves of the screen).  When debug rendering
        // is turned on, we'll be able to see an outline of the two rectangles. You
        // could also use images, but if you did, you'd probably want to use some
        // transparency so that they don't cover up the gameplay.
        addTapControl(stage.hud, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, () => {
            if (stage.world.camera.getScale() > 50) stage.world.camera.setScale(stage.world.camera.getScale() - 10);
            return true;
        });
        addTapControl(stage.hud, { cx: 12, cy: 4.5, width: 8, height: 9, img: "" }, () => {
            if (stage.world.camera.getScale() < 200) stage.world.camera.setScale(stage.world.camera.getScale() + 20);
            return true;
        });
        // Did you notice "game.hud" instead of "game.world"?  If you looked at the
        // bottom of this file, you'd find a spot where we write the level umber to
        // the top right corner of the HUD.

        // As the hero moves around, it's going to be hard to see that it's really
        // moving.  Draw some "noise" in the background.  Note that we're changing
        // the Z index.
        //
        // This code uses "for loops".  The outer loop will run 4 times (0, 16, 32,
        // 48).  Each time, the inner loop will run 4 times (0, 9, 18, 27), drawing
        // a total of 16 images.
        for (let x = 0; x < 64; x += 16) {
            for (let y = 0; y < 36; y += 9) {
                // This is kind of neat: a picture is just an actor without a role or rigidBody
                Actor.Make({
                    appearance: new ImageSprite({ width: 16, height: 9, img: "noise.png", z: -1 }),
                    rigidBody: new BoxBody({ cx: x + 8, cy: y + 4.5, width: 16, height: 9 }, stage.world, { collisionsEnabled: false }),
                });
            }
        }

        welcomeMessage("Press left to zoom out\nright to zoom in");
        winMessage("Great Job");
    }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
