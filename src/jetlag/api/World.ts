import { Renderable, JetLagKeys } from "../support/Interfaces";
import { Obstacle } from "../actor/Obstacle"
import { Hero } from "../actor/Hero"
import { Goodie } from "../actor/Goodie"
import { Enemy } from "../actor/Enemy"
import { Destination } from "../actor/Destination"
import { WorldActor as WorldActor } from "../actor/World";
import { TimedEvent } from "../support/TimedEvent";
import { ParallaxLayer } from "../support/ParallaxLayer";
import { Animation } from "../support/Animation";
import { Svg } from "../support/Svg";
import { JetLagStage } from "../JetLagStage";

/**
 * Draw a hero with an underlying polygon shape
 *
 * @param x       X coordinate of the top left corner
 * @param y       Y coordinate of the top left corner
 * @param width   Width of the obstacle
 * @param height  Height of the obstacle
 * @param imgName Name of image file to use
 * @param verts   Up to 16 coordinates representing the vertexes of this polygon, listed as
 *                x0,y0,x1,y1,x2,y2,...
 * @return The hero, so that it can be further modified
 */


export class ActorConfig {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    img?= "";
    box?= false;
    verts?: number[] = null;
    z?= 0;
}

export class ImageConfig {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    img = "";
    z?= 0;
}

export class TextConfig {
    x = 0;
    y = 0;
    center?= false;
    face = "Arial";
    color = "#FFFFFF";
    size = 22;
    producer: () => string = () => { return "" };
    z?= 0;
}

function checkActorConfig(c: ActorConfig) {
    if (!c.img) c.img = "";
    if (!c.box) c.box = false;
    if (!c.verts) c.verts = null;
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
}

function checkImageConfig(c: ImageConfig) {
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
}

function checkTextConfig(c: TextConfig) {
    if (!c.center) c.center = false;
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
}

/**
 * WorldApi provides the functionality needed for putting things into the world
 * (the main part of the game)
 */
export class WorldApi {
    /**
     * Construct a level.  Since Level is merely a facade, this method need only store references to
     * the actual game objects.
     *
     * @param manager the StageManager for the game
     */
    constructor(private stage: JetLagStage) { }

    /**
     * Set the background music for this level
     *
     * @param musicName Name of the music file to play.  Remember: this file must
     *                  have been registered as Music, not as a Sound
     */
    public setMusic(musicName: string): void {
        this.stage.setMusic(this.stage.device.getSpeaker().getMusic(musicName));
    }

    /**
     * Draw a picture on the current level
     *
     * Note: the order in which this is called relative to other actors will determine whether they
     * go under or over this picture (within the Z plane).
     *
     * @param x       X coordinate of top left corner, in meters
     * @param y       Y coordinate of top left corner, in meters
     * @param width   Width of the picture, in meters
     * @param height  Height of this picture, in meters
     * @param imgName Name of the picture to display
     * @param zIndex  The z index of the image. There are 5 planes: -2, -2, 0, 1, and 2. By default,
     *                everything goes to plane 0
     * @returns The picture, so that it can be shown and hidden in the future.
     */
    public drawPicture(cfg: ImageConfig) {
        checkImageConfig(cfg);
        return this.stage.getWorld().makePicture(cfg.x, cfg.y, cfg.width, cfg.height, cfg.img, cfg.z);
    }

    /**
     * This method lets us change the behavior of tilt, so that instead of applying a force, we
     * directly set the velocity of objects using the accelerometer data.
     *
     * @param toggle This should usually be false. Setting it to true means that tilt does not cause
     *               forces upon objects, but instead the tilt of the phone directly sets velocities
     */
    public setTiltAsVelocity(toggle: boolean) {
        this.stage.getWorld().setTiltVelocityOverride(toggle);
    }

    /**
     * Draw some text in the scene, centering it on a specific point
     *
     * @param centerX   The x coordinate of the center
     * @param centerY   The y coordinate of the center
     * @param fontName  The name of the font to use
     * @param fontColor The color of the font
     * @param fontSize  The size of the font
     * @param tp        A TextProducer that will generate the text to display
     * @param zIndex    The z index of the text
     * @return A Renderable of the text, so it can be enabled/disabled by program code
     */
    public addText(cfg: TextConfig): Renderable {
        checkTextConfig(cfg);
        if (cfg.center) {
            return this.stage.getWorld().addTextCentered(cfg.x, cfg.y, cfg.face, cfg.color, cfg.size, cfg.producer, cfg.z);
        }
        else {
            return this.stage.getWorld().addText(cfg.x, cfg.y, cfg.face, cfg.color, cfg.size, cfg.producer, cfg.z);
        }
    }

    /**
     * Draw an obstacle with an underlying circle shape
     *
     * @param x       X coordinate of the top left corner
     * @param y       Y coordinate of the top left corner
     * @param width   Width of the obstacle
     * @param height  Height of the obstacle
     * @param imgName Name of image file to use
     * @return The obstacle, so that it can be further modified
     */
    public makeObstacle(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let o: Obstacle;
        if (cfg.verts != null) {
            o = new Obstacle(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            o.setPolygonPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            o = new Obstacle(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            o.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y);
        }
        else {
            let radius: number = Math.max(cfg.width, cfg.height);
            o = new Obstacle(this.stage, radius, radius, cfg.img, cfg.z);
            o.setCirclePhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, radius / 2);
        }
        this.stage.getWorld().addActor(o, cfg.z);
        return o;
    }

    /**
     * Make a Hero with an underlying circular shape
     *
     * @param x       X coordinate of the hero
     * @param y       Y coordinate of the hero
     * @param width   width of the hero
     * @param height  height of the hero
     * @param imgName File name of the default image to display
     * @return The hero that was created
     */
    public makeHero(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let h: Hero;
        if (cfg.verts != null) {
            h = new Hero(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            h.setPolygonPhysics(PhysicsType2d.Dynamics.BodyType.DYNAMIC, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            h = new Hero(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            h.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.DYNAMIC, cfg.x, cfg.y);
        }
        else {
            let radius: number = Math.max(cfg.width, cfg.height);
            h = new Hero(this.stage, radius, radius, cfg.img, cfg.z);
            h.setCirclePhysics(PhysicsType2d.Dynamics.BodyType.DYNAMIC, cfg.x, cfg.y, radius / 2);
        }
        this.stage.score.onHeroCreated();
        this.stage.getWorld().addActor(h, 0);
        return h;
    }

    /**
     * Make an enemy that has an underlying circular shape.
     *
     * @param x       The X coordinate of the top left corner
     * @param y       The Y coordinate of the top right corner
     * @param width   The width of the enemy
     * @param height  The height of the enemy
     * @param imgName The name of the image to display
     * @return The enemy, so that it can be modified further
     */
    public makeEnemy(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let e: Enemy;
        if (cfg.verts != null) {
            e = new Enemy(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            e.setPolygonPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            e = new Enemy(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            e.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y);
        }
        else {
            let radius = Math.max(cfg.width, cfg.height);
            e = new Enemy(this.stage, radius, radius, cfg.img, cfg.z);
            e.setCirclePhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, radius / 2);
        }
        this.stage.score.onEnemyCreated();
        this.stage.getWorld().addActor(e, 0);
        return e;
    }

    /**
     * Make a destination that has an underlying circular shape.
     *
     * @param x       The X coordinate of the top left corner
     * @param y       The Y coordinate of the top right corner
     * @param width   The width of the destination
     * @param height  The height of the destination
     * @param imgName The name of the image to display
     * @return The destination, so that it can be modified further
     */
    public makeDestination(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let d: Destination;
        if (cfg.verts != null) {
            d = new Destination(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            d.setPolygonPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            d = new Destination(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            d.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y);
        }
        else {
            let radius = Math.max(cfg.width, cfg.height);
            d = new Destination(this.stage, radius, radius, cfg.img, cfg.z);
            d.setCirclePhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, radius / 2);
        }
        d.setCollisionsEnabled(false);
        this.stage.getWorld().addActor(d, 0);
        return d;
    }

    /**
     * Draw a goodie with an underlying circle shape, and a default score of [1,0,0,0]
     *
     * @param x       X coordinate of top left corner
     * @param y       Y coordinate of top left corner
     * @param width   Width of the image
     * @param height  Height of the image
     * @param imgName Name of image file to use
     * @return The goodie, so that it can be further modified
     */
    public makeGoodie(cfg: ActorConfig) {
        checkActorConfig(cfg);
        let g: Goodie;
        if (cfg.verts != null) {
            g = new Goodie(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            g.setPolygonPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, cfg.verts);
        }
        else if (cfg.box) {
            g = new Goodie(this.stage, cfg.width, cfg.height, cfg.img, cfg.z);
            g.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y);
        }
        else {
            let radius: number = Math.max(cfg.width, cfg.height);
            g = new Goodie(this.stage, radius, radius, cfg.img, cfg.z);
            g.setCirclePhysics(PhysicsType2d.Dynamics.BodyType.STATIC, cfg.x, cfg.y, radius / 2);
        }
        g.setCollisionsEnabled(false);
        this.stage.getWorld().addActor(g, 0);
        return g;
    }

    /**
     * Turn on accelerometer support so that tilt can control actors in this level
     *
     * @param xGravityMax Max X force that the accelerometer can produce
     * @param yGravityMax Max Y force that the accelerometer can produce
     */
    public enableTilt(xGravityMax: number, yGravityMax: number) {
        this.stage.getWorld().tiltMax.x = xGravityMax;
        this.stage.getWorld().tiltMax.y = yGravityMax;
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
     * Draw a box on the scene
     * 
     * Note: the box is actually four narrow rectangles
     *
     * @param x0         X coordinate of left side
     * @param y0         Y coordinate of top
     * @param x1         X coordinate of right side
     * @param y1         Y coordinate of bottom
     * @param imgName    name of the image file to use when drawing the rectangles
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
     * Configure the camera bounds for a level
     *
     * NB: we should set upper and lower bounds, instead of assuming a lower bound of (0, 0)
     *
     * @param width  width of the camera
     * @param height height of the camera
     */
    public setCameraBounds(width: number, height: number): void {
        this.stage.getWorld().camera.setBounds(width, height);
    }

    /**
     * Identify the actor that the camera should try to keep on screen at all times
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
    public setZoom(zoom: number): void {
        this.stage.getWorld().camera.setScale(zoom);
    }

    /**
     * Get the current zoom level of the game.  See setZoom() for more info
     * about the meaning of this number (it's a pixel/meter ratio)
     */
    public getZoom(): number {
        return this.stage.getWorld().camera.getScale();
    }

    /**
     * Indicate that some code should run after a fixed amount of time passes
     * 
     * @param interval The time until the event happens (or happens again)
     * @param repeat Should the event repeat?
     * @param action The action to perform when the timer expires
     */
    public addTimer(interval: number, repeat: boolean, action: () => void) {
        this.stage.getWorld().timer.addEvent(new TimedEvent(interval, repeat, action));
    }

    /**
     * Change the gravity in a running level
     *
     * @param newXGravity The new X gravity
     * @param newYGravity The new Y gravity
     */
    public resetGravity(newXGravity: number, newYGravity: number): void {
        this.stage.getWorld().setGravity(newXGravity, newYGravity);
    }

    /**
     * Add a background image that auto-repeats in X, and that moves in relation
     * to the hero movement
     *
     * @param x       The X of the top left corner of one instance of the image.
     *                The image will be tiled from that point onward, in all
     *                directions.
     * @param y       The Y of the top left corner of one instance of the image.
     *                The image will be tiled from that point onward, in all
     *                directions.
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param xSpeed  Speed that the picture seems to move in the X direction.
     *                "1" is the same speed as the camera; "0" is not at all;
     *                ".5f" is at half the camera's speed
     * @param imgName The name of the image file to use as the background
     */
    public addHorizontalBackgroundLayer(x: number, y: number, width: number, height: number, xSpeed: number, imgName: string) {
        let pl = new ParallaxLayer(x, y, width, height, xSpeed, true, false, imgName, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Add a background image that auto-repeats in Y, and that moves in relation to the hero
     * movement
     *
     * @param x       The X of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param y       The Y of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param ySpeed  Speed that the picture seems to move in the Y direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     * @param imgName The name of the image file to use as the background
     */
    public addVerticalBackgroundLayer(x: number, y: number, width: number, height: number, ySpeed: number, imgName: string) {
        let pl = new ParallaxLayer(x, y, width, height, ySpeed, false, false, imgName, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Add a foreground image that auto-repeats, and that moves in relation to the hero movement
     *
     * @param x       The X of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param y       The Y of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param xSpeed  Speed that the picture seems to move in the X direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     * @param imgName The name of the image file to use as the background
     */
    public addHorizontalForegroundLayer(x: number, y: number, width: number, height: number, xSpeed: number, imgName: string) {
        let pl = new ParallaxLayer(x, y, width, height, xSpeed, true, false, imgName, this.stage.config, this.stage.device);
        this.stage.getForeground().addLayer(pl);
    }

    /**
     * Add a background image that auto-repeats, and that moves at a fixed X velocity
     *
     * @param x       The X of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param y       The Y of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param xSpeed  Speed that the picture seems to move in the X direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     * @param imgName The name of the image file to use as the background
     */
    public addHorizontalAutoBackgroundLayer(x: number, y: number, width: number, height: number, xSpeed: number, imgName: string) {
        let pl = new ParallaxLayer(x, y, width, height, xSpeed / 1000, true, true, imgName, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Add a background image that auto-repeats, and that moves at a fixed Y velocity
     *
     * @param x       The X of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param y       The Y of the top left corner of one instance of the image.  The image will
     *                be tiled from that point onward, in all directions.
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param ySpeed  Speed that the picture seems to move in the Y direction. "1" is the same speed
     *                as the camera; "0" is not at all; ".5f" is at half the camera's speed
     * @param imgName The name of the image file to use as the background
     */
    public addVerticalAutoBackgroundLayer(x: number, y: number, width: number, height: number, ySpeed: number, imgName: string) {
        let pl = new ParallaxLayer(x, y, width, height, ySpeed / 1000, false, true, imgName, this.stage.config, this.stage.device);
        this.stage.getBackground().addLayer(pl);
    }

    /**
     * Generate a random number x in the range [0,max)
     *
     * @param max The largest number returned will be one less than max
     * @return a random integer
     */
    public getRandom(max: number) {
        return Math.floor(Math.random() * max);
    }

    /**
     * Create a new animation that can be populated via the "to" function
     *
     * @param sequenceCount The number of frames in the animation
     * @param repeat        True if the animation should repeat when it reaches the end
     * @return The animation
     */
    public makeComplexAnimation(repeat: boolean) {
        return new Animation(repeat, this.stage.device.getRenderer());
    }

    /**
     * Create a new animation that shows a set of images for the same amount of time
     *
     * @param timePerFrame The time to show each image
     * @param repeat       True if the animation should repeat when it reaches the end
     * @param imgNames     The names of the images that comprise the animation
     * @return The animation
     */
    public makeAnimation(timePerFrame: number, repeat: boolean, imgNames: string[]) {
        let a = new Animation(repeat, this.stage.device.getRenderer());
        for (let i of imgNames)
            a.to(i, timePerFrame);
        return a;
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