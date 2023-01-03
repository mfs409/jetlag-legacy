import { Renderable } from "../internal/support/Interfaces";
import { Obstacle } from "../actor/Obstacle"
import { Hero } from "../actor/Hero"
import { Goodie } from "../actor/Goodie"
import { Enemy } from "../actor/Enemy"
import { Destination } from "../actor/Destination"
import { WorldActor } from "../actor/WorldActor";
import { ParallaxLayer } from "../internal/support/ParallaxLayer";
import { Svg } from "../internal/support/Svg";
import { JetLagStage } from "../internal/JetLagStage";
import { JetLagKeys } from "../support/JetLagKeys";
import { ActorConfig } from "./ActorConfig"
import { TextConfig } from "./TextConfig"
import { ImageConfig } from "./ImageConfig"
import { checkImageConfig, checkTextConfig, checkActorConfig } from "../internal/support/Functions"
import { b2BodyType } from "@box2d/core";

/**
 * WorldApi provides all of the features needed for creating actors and
 * backgrounds, and for manipulating gravity and tilt.
 */
export class WorldApi {
    /**
     * Construct the World API
     * 
     * @param stage   The JetLagStage, for interacting with a level
     */
    constructor(private stage: JetLagStage) { }

    /**
     * Draw a picture in the current level
     *
     * Note: the order in which this is called relative to other actors will
     * determine whether they go under or over this picture (within the Z
     * plane).
     *
     * @param cfg An ImageConfig object, which will specify how to draw the
     *            image
     *
     * @returns The picture, so that it can be shown and hidden in the future.
     */
    public drawPicture(cfg: ImageConfig) {
        checkImageConfig(cfg);
        return this.stage.getWorld().makePicture(cfg.x, cfg.y, cfg.width, cfg.height, cfg.img!, cfg.z!);
    }

    /**
     * Turn on accelerometer support, so that tilt can control actors in this
     * level.  Note that if the accelerometer is disabled, this code will set
     * the arrow keys to simulate tilt.
     *
     * @param xGravityMax Max X force that the accelerometer can produce
     * @param yGravityMax Max Y force that the accelerometer can produce
     */
    public enableTilt(xGravityMax: number, yGravityMax: number) {
        this.stage.getWorld().setTiltMax(xGravityMax, yGravityMax);
        if (!this.stage.device.getAccelerometer().getSupported()) {
            this.stage.device.getKeyboard().setKeyUpHandler(JetLagKeys.UP, () => { this.stage.device.getAccelerometer().setY(0); });
            this.stage.device.getKeyboard().setKeyUpHandler(JetLagKeys.DOWN, () => { this.stage.device.getAccelerometer().setY(0); });
            this.stage.device.getKeyboard().setKeyUpHandler(JetLagKeys.LEFT, () => { this.stage.device.getAccelerometer().setX(0); });
            this.stage.device.getKeyboard().setKeyUpHandler(JetLagKeys.RIGHT, () => { this.stage.device.getAccelerometer().setX(0); });

            this.stage.device.getKeyboard().setKeyDownHandler(JetLagKeys.UP, () => { this.stage.device.getAccelerometer().setY(-5); });
            this.stage.device.getKeyboard().setKeyDownHandler(JetLagKeys.DOWN, () => { this.stage.device.getAccelerometer().setY(5); });
            this.stage.device.getKeyboard().setKeyDownHandler(JetLagKeys.LEFT, () => { this.stage.device.getAccelerometer().setX(-5); });
            this.stage.device.getKeyboard().setKeyDownHandler(JetLagKeys.RIGHT, () => { this.stage.device.getAccelerometer().setX(5); });
        }
    }

    /**
     * This method lets us change the behavior of tilt, so that instead of
     * applying a force, we directly set the velocity of objects using the
     * accelerometer data.
     *
     * @param toggle This should usually be false. Setting it to true means that
     *               tilt does not cause forces upon objects, but instead the
     *               tilt of the phone directly sets velocities
     */
    public setTiltAsVelocity(toggle: boolean) {
        this.stage.getWorld().setTiltVelocityOverride(toggle);
    }

    /**
     * Change the gravity in a running level
     *
     * @param newXGravity The new X gravity
     * @param newYGravity The new Y gravity
     */
    public resetGravity(newXGravity: number, newYGravity: number) {
        this.stage.getWorld().setGravity(newXGravity, newYGravity);
    }

    /**
     * Draw some text in the scene, centering it on a specific point
     *
     * @param cfg A TextConfig object, which will specify how to draw the text
     * @param producer A function that produces the text to display
     * @return The text, so it can be shown and hidden in the future
     */
    public addText(cfg: TextConfig, producer: () => string): Renderable {
        checkTextConfig(cfg);
        if (cfg.center) {
            return this.stage.getWorld().addTextCentered(cfg.x, cfg.y, cfg.face, cfg.color, cfg.size, cfg.z!, producer);
        }
        else {
            return this.stage.getWorld().addText(cfg.x, cfg.y, cfg.face, cfg.color, cfg.size, cfg.z!, producer);
        }
    }

    /**
     * Draw an obstacle in the world
     *
     * @param cfg An ActorConfig object, which will specify how to draw the
     *            obstacle
     *
     * @return The obstacle, so that it can be further modified
     */
    public makeObstacle(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let o: Obstacle;
        if (cfg.verts) {
            o = new Obstacle(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            o.setPolygonPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            o = new Obstacle(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            o.setBoxPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y);
        }
        else {
            let radius: number = Math.max(cfg.width, cfg.height);
            o = new Obstacle(this.stage, radius, radius, cfg.img!, cfg.z!);
            o.setCirclePhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, radius / 2);
        }
        this.stage.getWorld().addActor(o, cfg.z!);
        return o;
    }

    /**
     * Draw a hero in the world
     *
     * @param cfg An ActorConfig object, which will specify how to draw the
     *            hero
     *
     * @return The hero, so that it can be further modified
     */
    public makeHero(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let h: Hero;
        if (cfg.verts) {
            h = new Hero(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            h.setPolygonPhysics(b2BodyType.b2_dynamicBody, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            h = new Hero(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            h.setBoxPhysics(b2BodyType.b2_dynamicBody, cfg.x, cfg.y);
        }
        else {
            let radius: number = Math.max(cfg.width, cfg.height);
            h = new Hero(this.stage, radius, radius, cfg.img!, cfg.z!);
            h.setCirclePhysics(b2BodyType.b2_dynamicBody, cfg.x, cfg.y, radius / 2);
        }
        this.stage.score.onHeroCreated();
        this.stage.getWorld().addActor(h, 0);
        return h;
    }

    /**
     * Draw an enemy in the world
     *
     * @param cfg An ActorConfig object, which will specify how to draw the
     *            enemy
     *
     * @return The enemy, so that it can be further modified
     */
    public makeEnemy(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let e: Enemy;
        if (cfg.verts) {
            e = new Enemy(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            e.setPolygonPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            e = new Enemy(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            e.setBoxPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y);
        }
        else {
            let radius = Math.max(cfg.width, cfg.height);
            e = new Enemy(this.stage, radius, radius, cfg.img!, cfg.z!);
            e.setCirclePhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, radius / 2);
        }
        this.stage.score.onEnemyCreated();
        this.stage.getWorld().addActor(e, 0);
        return e;
    }

    /**
     * Draw a destination in the world
     *
     * @param cfg An ActorConfig object, which will specify how to draw the
     *            destination
     *
     * @return The destination, so that it can be further modified
     */
    public makeDestination(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let d: Destination;
        if (cfg.verts) {
            d = new Destination(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            d.setPolygonPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            d = new Destination(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            d.setBoxPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y);
        }
        else {
            let radius = Math.max(cfg.width, cfg.height);
            d = new Destination(this.stage, radius, radius, cfg.img!, cfg.z!);
            d.setCirclePhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, radius / 2);
        }
        d.setCollisionsEnabled(false);
        this.stage.getWorld().addActor(d, 0);
        return d;
    }

    /**
     * Draw a goodie in the world
     *
     * @param cfg An ActorConfig object, which will specify how to draw the
     *            goodie
     *
     * @return The goodie, so that it can be further modified
     */
    public makeGoodie(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let g: Goodie;
        if (cfg.verts) {
            g = new Goodie(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            g.setPolygonPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            g = new Goodie(this.stage, cfg.width, cfg.height, cfg.img!, cfg.z!);
            g.setBoxPhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y);
        }
        else {
            let radius: number = Math.max(cfg.width, cfg.height);
            g = new Goodie(this.stage, radius, radius, cfg.img!, cfg.z!);
            g.setCirclePhysics(b2BodyType.b2_staticBody, cfg.x, cfg.y, radius / 2);
        }
        g.setCollisionsEnabled(false);
        this.stage.getWorld().addActor(g, 0);
        return g;
    }

    /**
     * Draw a box on the scene
     *
     * Note: the box is actually four narrow rectangles
     *
     * @param x0         X coordinate of left side
     * @param y0         Y coordinate of top
     * @param x1         X coordinate of right side
     * @param y1         Y coordinate of bottom
     * @param imgName    name of the image file to use when drawing the
     *                   rectangles
     * @param density    Density of the rectangle. When in doubt, use 1
     * @param elasticity Elasticity of the rectangle. When in doubt, use 0
     * @param friction   Friction of the rectangle. When in doubt, use 1
     */
    public drawBoundingBox(x0: number, y0: number, x1: number, y1: number, imgName: string, density: number, elasticity: number, friction: number): void {
        let bottom = this.makeObstacle({ box: true, x: x0 - 1, y: y1, width: Math.abs(x0 - x1) + 2, height: 1, img: imgName });
        bottom.setPhysics(density, elasticity, friction);

        let top = this.makeObstacle({ box: true, x: x0 - 1, y: y0 - 1, width: Math.abs(x0 - x1) + 2, height: 1, img: imgName });
        top.setPhysics(density, elasticity, friction);

        let left = this.makeObstacle({ box: true, x: x0 - 1, y: y0 - 1, width: 1, height: Math.abs(y0 - y1) + 2, img: imgName });
        left.setPhysics(density, elasticity, friction);

        let right = this.makeObstacle({ box: true, x: x1, y: y0 - 1, width: 1, height: Math.abs(y0 - y1) + 2, img: imgName });
        right.setPhysics(density, elasticity, friction);
    }

    /**
     * Configure the camera bounds for a level, starting from (0, 0)
     *
     * @param width  width of the camera
     * @param height height of the camera
     */
    public setCameraBounds(width: number, height: number): void {
        this.stage.getWorld().getCamera().setBounds(width, height);
    }

    /**
     * Identify the actor that the camera should try to keep on screen at all
     * times
     *
     * @param actor The actor the camera should chase
     */
    public setCameraChase(actor: WorldActor) {
        this.stage.getWorld().setCameraChaseActor(actor);
    }

    /**
     * Manually set the zoom level of the game.  A zoom is actually a
     * pixel/meter ratio, so bigger numbers mean zooming in, and smaller ones
     * mean zooming out.  The base value to consider is whatever you have set in
     * your game's configuration.
     *
     * @param zoom The new zoom level
     */
    public setZoom(zoom: number) {
        this.stage.getWorld().getCamera().setScale(zoom);
    }

    /**
     * Get the current zoom level of the game.  See setZoom() for more info
     * about the meaning of this number (it's a pixel/meter ratio)
     */
    public getZoom() { return this.stage.getWorld().getCamera().getScale(); }

    /**
     * Add a background image that auto-repeats in X, and that moves in relation
     * to the hero movement
     *
     * @param cfg     An ImageConfig object, which will specify how to draw the
     *                image 
     * @param xSpeed  Speed that the picture seems to move in the X direction.
     *                "1" is the same speed as the camera; "0" is not at all;
     *                ".5f" is at half the camera's speed
     */
    public addHorizontalBackgroundLayer(cfg: ImageConfig, xSpeed: number) {
        checkImageConfig(cfg);
        let pl = new ParallaxLayer(cfg.x, cfg.y, cfg.width, cfg.height, xSpeed, true, false, cfg.img!, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Add a background image that auto-repeats in Y, and that moves in relation
     * to the hero movement
     *
     * @param cfg     An ImageConfig object, which will specify how to draw the
     *                image 
     * @param ySpeed  Speed that the picture seems to move in the Y direction.
     *                "1" is the same speed as the camera; "0" is not at all;
     *                ".5f" is at half the camera's speed
     */
    public addVerticalBackgroundLayer(cfg: ImageConfig, ySpeed: number) {
        checkImageConfig(cfg);
        let pl = new ParallaxLayer(cfg.x, cfg.y, cfg.width, cfg.height, ySpeed, false, false, cfg.img!, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Add a foreground image that auto-repeats, and that moves in relation to the hero movement
     *
     * @param cfg     An ImageConfig object, which will specify how to draw the
     *                image 
     * @param xSpeed  Speed that the picture seems to move in the X direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     */
    public addHorizontalForegroundLayer(cfg: ImageConfig, xSpeed: number) {
        checkImageConfig(cfg);
        let pl = new ParallaxLayer(cfg.x, cfg.y, cfg.width, cfg.height, xSpeed, true, false, cfg.img!, this.stage.config, this.stage.device);
        this.stage.getForeground().addLayer(pl);
    }

    /**
     * Add a background image that auto-repeats, and that moves at a fixed X velocity
     *
     * @param cfg     An ImageConfig object, which will specify how to draw the
     *                image 
     * @param xSpeed  Speed that the picture seems to move in the X direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     */
    public addHorizontalAutoBackgroundLayer(cfg: ImageConfig, xSpeed: number) {
        checkImageConfig(cfg);
        let pl = new ParallaxLayer(cfg.x, cfg.y, cfg.width, cfg.height, xSpeed / 1000, true, true, cfg.img!, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Add a background image that auto-repeats, and that moves at a fixed Y velocity
     *
     * @param cfg     An ImageConfig object, which will specify how to draw the
     *                image 
     * @param ySpeed  Speed that the picture seems to move in the Y direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     */
    public addVerticalAutoBackgroundLayer(cfg: ImageConfig, ySpeed: number) {
        checkImageConfig(cfg);
        let pl = new ParallaxLayer(cfg.x, cfg.y, cfg.width, cfg.height, ySpeed / 1000, false, true, cfg.img!, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Set the background color for the current level
     *
     * @param color The color, formated as 0xRRGGBB
     */
    public setBackgroundColor(color: number) {
        this.stage.setBackgroundColor(color);
    }

    /**
     * From an SVG file that consists only of paths, produce a bunch of
     * obstacles that correspond to the line segments of those paths.
     *
     * @param filename The name of the SVG file to load
     * @param x        The X coordinate of the top left corner of the bounding
     *                 box for the SVG line
     * @param y        The Y coordinate of the top left corner of the bounding
     *                 box for the SVG line
     * @param xStretch Factor by which to horizontally stretch the SVG line
     * @param yStretch Factor by which to vertically stretch the SVG line
     * @param callback Code to run on each obstacle once it is made
     */
    public drawSVG(filename: string, x: number, y: number, xStretch: number, yStretch: number, callback: (actor: WorldActor) => void) {
        let s = new Svg();
        s.processFile(filename, x, y, xStretch, yStretch, this, this.stage.config, callback);
    }
}