import { initializeAndLaunch } from "../jetlag/Stage";
import { GameConfig } from "../jetlag/Config";
import { AppearanceComponent, FilledBox, FilledCircle, FilledPolygon, TextSprite } from "../jetlag/Components/Appearance";
import { ExplicitMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { Actor } from "../jetlag/Entities/Actor";
import { BoxBody, CircleBody, PolygonBody, RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { GridSystem } from "../jetlag/Systems/Grid";
import { Destination, Enemy, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { stage } from "../jetlag/Stage";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";

/** Configuration information for the tut_jetlag_tour game */
export class TutJetlagTour implements GameConfig {
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
        GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 16, y: 9 });

        // Make a hero, let the camera follow it
        let h = Actor.Make({
            appearance: new FilledPolygon({ vertices: [0, -.5, .25, .5, -.25, .5], fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044", z: 1 }),
            rigidBody: PolygonBody.Polygon({ cx: 8, cy: 4.5, vertices: [0, -.5, .25, .5, -.25, .5] }, stage.world, { collisionsEnabled: false }),
            role: new Hero({ strength: 1 }),
            movement: new ExplicitMovement(),
        });
        stage.world.camera.setCameraFocus(h);

        // Set up arrow keys to control the hero
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(-6); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(0); });
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(6); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(0); });

        // Set up projectiles
        let projectiles = new ActorPoolSystem();
        populateProjectilePool(projectiles, {
            size: 20, strength: 1, disappearOnCollide: true, bodyMaker: () => CircleBody.Circle({ radius: 0.125, cx: -100, cy: -100 }, stage.world),
            appearanceMaker: () => new FilledCircle({ radius: .125, fillColor: "#bbbbbb", z: 0 }), range: 10, immuneToCollisions: true,
        });

        // Shoot!
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
            let dx = Math.cos(h.rigidBody.getRotation() - Math.PI / 2);
            let dy = Math.sin(h.rigidBody.getRotation() - Math.PI / 2);
            let x = h.rigidBody.getCenter().x;
            let y = h.rigidBody.getCenter().y;
            let scale = 8;
            (projectiles.get()?.role as Projectile | undefined)?.tossAt(x, y, x + scale * dx, y + scale * dy, h, 0, 0);
        });

        // Raining enemies
        stage.world.timer.addEvent(new TimedEvent(2, true, () => {
            let angle = Math.random() * 2 * Math.PI;
            let hx = h.rigidBody.getCenter().x, hy = h.rigidBody.getCenter().y;
            let sx = 9 * Math.sin(angle) + hx, sy = 9 * Math.cos(angle) + hy;
            Actor.Make({
                appearance: new FilledCircle({ radius: .5, fillColor: "#F01100" }),
                rigidBody: CircleBody.Circle({ cx: sx, cy: sy, radius: .5 }, stage.world),
                role: new Enemy({ damage: 1 }),
                movement: new PathMovement(new Path().to(sx, sy).to(hx, hy), 3, false),
            });
        }));

        stage.score.onWin = { level: level, builder: tut_jetlag_tour }
        stage.score.onLose = { level: level, builder: tut_jetlag_tour }
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
            rigidBody: BoxBody.Box({ cx: 16, cy: .05, width: 32, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
            rigidBody: BoxBody.Box({ cx: 16, cy: 8.95, width: 32, height: .1 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: BoxBody.Box({ cx: .05, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });
        Actor.Make({
            appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
            rigidBody: BoxBody.Box({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
            role: new Obstacle(),
        });

        // Make a hero, let the camera follow it
        let h = Actor.Make({
            appearance: new FilledCircle({ radius: .75, fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044" }),
            rigidBody: CircleBody.Circle({ cx: 3, cy: 3, radius: .75 }),
            role: new Hero(),
            movement: new ExplicitMovement(),
            gestures: { tap: () => { (h.movement as ExplicitMovement).updateYVelocity(-8); return true; } },
        });
        stage.world.camera.setCameraFocus(h);

        // Set up arrow keys to control the hero
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ExplicitMovement).updateXVelocity(-5); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ExplicitMovement).updateXVelocity(0); });
        stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ExplicitMovement).updateXVelocity(5); });
        stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ExplicitMovement).updateXVelocity(0); });

        // Make a destination
        Actor.Make({
            appearance: new FilledCircle({ radius: .5, fillColor: "#00ff00", lineWidth: 3, lineColor: "#004400" }),
            rigidBody: CircleBody.Circle({ cx: 31, cy: 6, radius: .5 }),
            role: new Destination(),
            movement: new ExplicitMovement(),
        });

        // Draw a box, and write a timer on it.  Both go on the HUD
        Actor.Make({
            appearance: new FilledBox({ width: .75, height: .75, fillColor: "#eeeeee", lineWidth: 3, lineColor: "#000000" }),
            rigidBody: BoxBody.Box({ cx: 8, cy: .75, width: .75, height: .75 }, stage.hud),
        });
        Actor.Make({
            appearance: new TextSprite({ center: true, face: "Arial", color: "#444444", size: 48 }, () => (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0)),
            rigidBody: BoxBody.Box({ cx: 8, cy: .75, width: 1.8, height: 1 }, stage.hud),
        });

        // Set up the score
        stage.score.onWin = { level: level, builder: tut_jetlag_tour }
        stage.score.onLose = { level: level, builder: tut_jetlag_tour }
        stage.score.setLoseCountdownRemaining(10);
        stage.score.setVictoryDestination(1);
    }
}

/**
 * Put some appropriately-configured projectiles into the projectile system
 *
 * @param cfg                           Configuration options for the
 *                                      projectiles
 * @param cfg.size                      The number of projectiles that can ever
 *                                      be on screen at once
 * @param cfg.bodyMaker                 Make each projectile's initial rigid
 *                                      body
 * @param cfg.appearanceMaker           Make each projectile's appearance
 * @param cfg.strength                  The amount of damage a projectile can do
 *                                      to enemies
 * @param cfg.multiplier                A multiplier on projectile speed
 * @param cfg.immuneToCollisions        Should projectiles pass through walls
 * @param cfg.gravityAffectsProjectiles Should projectiles be subject to gravity
 * @param cfg.fixedVectorVelocity       A fixed velocity for all projectiles
 * @param cfg.rotateVectorToss          Should projectiles be rotated in the
 *                                      direction they are tossed?
 * @param cfg.soundEffects              A sound to play when a projectile
 *                                      disappears
 * @param cfg.randomImageSources        A set of image names to randomly assign
 *                                      to projectiles' appearance
 * @param cfg.range                     Limit the range that projectiles can
 *                                      travel?
 * @param cfg.disappearOnCollide        Should projectiles disappear when they
 *                                      collide with each other?
 */
function populateProjectilePool(pool: ActorPoolSystem, cfg: { size: number, bodyMaker: () => RigidBodyComponent, appearanceMaker: () => AppearanceComponent, strength: number, multiplier?: number, immuneToCollisions: boolean, gravityAffectsProjectiles?: boolean, fixedVectorVelocity?: number, rotateVectorToss?: boolean, soundEffects?: SoundEffectComponent, randomImageSources?: string[], range: number, disappearOnCollide: boolean }) {
    // set up the pool of projectiles
    for (let i = 0; i < cfg.size; ++i) {
        let appearance = cfg.appearanceMaker();
        let rigidBody = cfg.bodyMaker();
        if (cfg.gravityAffectsProjectiles)
            rigidBody.body.SetGravityScale(1);
        rigidBody.setCollisionsEnabled(cfg.immuneToCollisions);
        let reclaimer = (actor: Actor) => {
            pool.put(actor);
            actor.enabled = false;
        }
        let role = new Projectile({ damage: cfg.strength, range: cfg.range, disappearOnCollide: cfg.disappearOnCollide, reclaimer, randomImageSources: cfg.randomImageSources });
        // Put in some code for eliminating the projectile quietly if it has
        // traveled too far
        role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
            if (!actor) return;
            if (!actor.enabled) return;
            let role = actor.role as Projectile;
            let body = actor.rigidBody.body;
            let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
            let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
            if ((dx * dx + dy * dy) > (role.range * role.range)) reclaimer(actor);
        });
        // TODO: Should we clone the soundEffects?
        let p = Actor.Make({ appearance, rigidBody, movement: new ProjectileMovement(cfg), role, sounds: cfg.soundEffects });
        pool.put(p);
    }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new TutJetlagTour());