import { OverlayScene as OverlayScene } from "../scene/Overlay"
import { WorldActor as WorldActor } from "../actor/World"
import { TimedEvent } from "../support/TimedEvent"
import { Renderable } from "../support/Interfaces"
import { Hero } from "../actor/Hero"
import { Route } from "../support/Route";
import { BaseActor as BaseActor } from "../actor/Base";
import { JetLagStage } from "../JetLagStage";

/**
 * OverlayApi provides a way of drawing to the simple screens of a game: the
 * HUD, the win and lose screens, the pause screen, and the welcome screen.
 */
export class OverlayApi {
    /**
     * Construct a level.  Since Level is merely a facade, this method need only store references to
     * the actual game objects.
     *
     * @param overlay the StageManager for the game
     */
    constructor(private stage: JetLagStage, private overlay: OverlayScene) { }

    /**
     * Convert coordinates on the overlay to coordinates in the world
     * 
     * @param x The x coordinate, in meters, on the overlay
     * @param y The y coordinate, in meters, on the overlay
     * 
     * @returns a pair {x,y} that represents the world coordinates, in meters
     */
    public overlayToMeters(x: number, y: number) {
        let pixels1 = this.overlay.camera.metersToScreen(x, y);
        let pixels2 = this.stage.getWorld().camera.screenToMeters(pixels1.x, pixels1.y);
        return pixels2;
    }

    /**
     * Add a button that performs an action when clicked.
     *
     * @param x       The X coordinate of the top left corner (in pixels)
     * @param y       The Y coordinate of the top left corner (in pixels)
     * @param width   The width of the image
     * @param height  The height of the image
     * @param imgName The name of the image to display. Use "" for an invisible button
     * @param action  The action to run in response to a tap
     */
    public addTapControl(x: number, y: number, width: number, height: number, imgName: string, action: (hudX: number, hudY: number) => boolean): BaseActor {
        let c = new BaseActor(this.overlay, this.stage.device, imgName, width, height);
        c.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
        c.tapHandler = action;
        this.overlay.addActor(c, 0);
        return c;
    }

    /**
     * Add a control that runs custom code when depressed, on any finger
     * movement, and when released
     * 
     * @param x The X coordinate of the bottom left corner (in meters)
     * @param y The Y coordinate of the bototm left corner (in meters)
     * @param width The width of the image to display (in meters)
     * @param height The height of the image to display (in meters)
     * @param imgName The name of the image to display
     * @param panStart The action to perform when the pan event starts
     * @param panMove The action to perform when the finger moves
     * @param panStop The action to perform when the pan event stops
     */
    public addPanCallbackControl(x: number, y: number, width: number, height: number, imgName: string, panStart: (hudX: number, hudY: number) => boolean, panMove: (hudX: number, hudY: number) => boolean, panStop: (hudX: number, hudY: number) => boolean): BaseActor {
        let c = new BaseActor(this.overlay, this.stage.device, imgName, width, height);
        c.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
        c.panStartHandler = panStart;
        c.panMoveHandler = panMove;
        c.panStopHandler = panStop;
        this.overlay.addActor(c, 0);
        return c;
    }

    /**
     * Create a region on screen, such that any Actor inside of that region that
     * has been marked draggable can be dragged anywhere within that region.
     * 
     * @param x The X coordinate (in meters) of the top left of the zone
     * @param y The Y coordinate (in meters) of the top left of the zone
     * @param width The width of the zone
     * @param height The height of the zone
     * @param imgName The image to display for this zone (typically "")
     */
    public createDragZone(x: number, y: number, width: number, height: number, imgName: string) {
        let foundActor: WorldActor = null;
        // pan start behavior is to update foundActor if there is an actor where the touch began
        let panstart = (hudX: number, hudY: number) => {
            // Need to turn the meters of the hud into screen pixels, so that world can convert to its meters
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            // If worldactor with draggable, we're good
            let actor = this.stage.getWorld().actorAt(pixels.x, pixels.y);
            if (actor == null)
                return false;
            if (!(actor instanceof WorldActor))
                return false;
            if (!actor.draggable)
                return false;
            foundActor = actor;
            return true;
        }
        // pan move behavior is to change the actor position based on the new coord
        let panmove = (hudX: number, hudY: number) => {
            // need an actor, and need coords in pixels
            if (foundActor == null)
                return false;
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let meters = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            foundActor.setPosition(meters.x - foundActor.getWidth() / 2, meters.y - foundActor.getHeight() / 2);
            return true;
        }
        // pan stop behavior is to stop tracking this actor
        let panstop = (hudX: number, hudY: number) => {
            foundActor = null; return false;
        }
        this.addPanCallbackControl(x, y, width, height, imgName, panstart, panmove, panstop);
    }

    /**
     * Create a region on screen that is able to receive swipe gestures
     * 
     * @param x The X coordinate (in meters) of the top left of the zone
     * @param y The Y coordinate (in meters) of the top left of the zone
     * @param width The width of the zone
     * @param height The height of the zone
     * @param imgName The image to display for this zone (typically "")
     */
    public createSwipeZone(x: number, y: number, width: number, height: number, imgName: string) {
        let c = new BaseActor(this.overlay, this.stage.device, imgName, width, height);
        c.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
        this.overlay.addActor(c, 0);
        c.swipeHandler = (hudX0: number, hudY0: number, hudX1: number, hudY1: number, time: number) => {
            // Need to turn the meters of the hud into screen pixels, so that world can convert to its meters
            let pixels = this.overlay.camera.metersToScreen(hudX0, hudY0);
            // If worldactor with flickMultiplier, we're good
            let actor = this.stage.getWorld().actorAt(pixels.x, pixels.y);
            if (actor == null)
                return false;
            if (!(actor instanceof WorldActor))
                return false;
            if (actor.flickMultiplier === 0)
                return false;
            // Figure out the velocity to apply
            let p2 = this.overlay.camera.metersToScreen(hudX1, hudY1);
            let w = this.stage.getWorld().camera.screenToMeters(p2.x, p2.y);
            let dx = (w.x - actor.getXPosition()) * actor.flickMultiplier * 1000 / time;
            let dy = w.y - actor.getYPosition() * actor.flickMultiplier * 1000 / time;
            // prep the actor and flick it
            actor.hover = null;
            actor.updateVelocity(dx, dy);
            return true;
        };
        return c;
    }

    /**
     * keep track of the "active" actor, if any
     */
    activeActor: WorldActor = null;

    /**
     * Create a region on an overlay, such that touching the region will cause
     * the current active actor to immediately relocate to that place.
     * 
     * @param x The top left X of the region
     * @param y The top left Y of the region
     * @param width The width of the region
     * @param height The height of the region
     * @param imgName The background image for the region, if any
     */
    public createPokeToPlaceZone(x: number, y: number, width: number, height: number, imgName: string) {
        this.stage.setGestureHudFirst(false);
        this.addTapControl(x, y, width, height, imgName, (hudX: number, hudY: number) => {
            if (this.activeActor == null)
                return false;
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let meters = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            this.activeActor.setPosition(meters.x - this.activeActor.getWidth() / 2, meters.y - this.activeActor.getHeight() / 2);
            this.activeActor = null;
            return true;
        })
    }

    /**
     * Create a region on an overlay, such that touching the region will cause
     * the current active actor to move to that place.
     * 
     * @param x The top left X of the region
     * @param y The top left Y of the region
     * @param width The width of the region
     * @param height The height of the region
     * @param velocity The speed at which the actor should move
     * @param imgName The background image for the region, if any
     * @param clear Should the active actor be cleared (so that subsequent touches won't change its trajectory)
     */
    public createPokeToMoveZone(x: number, y: number, width: number, height: number, velocity: number, imgName: string, clear: boolean) {
        this.stage.setGestureHudFirst(false);
        this.addTapControl(x, y, width, height, imgName, (hudX: number, hudY: number) => {
            if (this.activeActor == null)
                return false;
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let meters = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            let r = new Route().to(this.activeActor.getXPosition(), this.activeActor.getYPosition()).to(meters.x - this.activeActor.getWidth() / 2, meters.y - this.activeActor.getHeight() / 2);
            this.activeActor.setAbsoluteVelocity(0, 0);
            this.activeActor.setRotationSpeed(0);
            this.activeActor.setRoute(r, velocity, false);
            if (clear)
                this.activeActor = null;
            return true;
        })
    }

    /**
     * Create a region on an overlay, such that touching the region will cause
     * the current active actor to move toward that place (but not stop when it gets there).
     * 
     * @param x The top left X of the region
     * @param y The top left Y of the region
     * @param width The width of the region
     * @param height The height of the region
     * @param velocity The speed at which the actor should move
     * @param imgName The background image for the region, if any
     * @param clear Should the active actor be cleared (so that subsequent touches won't change its trajectory)
     */
    public createPokeToRunZone(x: number, y: number, width: number, height: number, velocity: number, imgName: string, clear: boolean) {
        this.stage.setGestureHudFirst(false);
        this.addTapControl(x, y, width, height, imgName, (hudX: number, hudY: number) => {
            if (this.activeActor == null)
                return false;
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let meters = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            let dx = this.activeActor.getXPosition() - (meters.x - this.activeActor.getWidth() / 2);
            let dy = this.activeActor.getYPosition() - (meters.y - this.activeActor.getHeight() / 2);
            let hy = Math.sqrt(dx * dx + dy * dy) / velocity;
            let v = new PhysicsType2d.Vector2(dx / hy, dy / hy);
            this.activeActor.setRotationSpeed(0);
            this.activeActor.setAbsoluteVelocity(-v.x, -v.y);
            if (clear)
                this.activeActor = null;
            return true;
        })
    }

    /**
     * Draw a touchable region of the screen that acts as a joystick.  As the user performs Pan
     * actions within the region, the actor's velocity should change accordingly.
     *
     * @param x The X coordinate of the bottom left corner (in meters)
     * @param y The Y coordinate of the bototm left corner (in meters)
     * @param width The width of the image to display (in meters)
     * @param height The height of the image to display (in meters)
     * @param imgName The name of the image to display
     * @param actor    The actor to move with this joystick
     * @param scale    A value to use to scale the velocity produced by the joystick
     * @param stopOnUp Should the actor stop when the joystick is released?
     * @return The control, so it can be modified further.
     */
    public addJoystickControl(x: number, y: number, width: number, height: number, imgName: string, actor: WorldActor, scale: number, stopOnUp: boolean): BaseActor {
        let moving = false;
        function doMove(hudX: number, hudY: number) {
            moving = true;
            actor.setAbsoluteVelocity(scale * (hudX - (x + width / 2)), scale * (hudY - (y + height / 2)));
        }
        function doStop() {
            if (!moving)
                return;
            moving = false;
            if (stopOnUp) {
                actor.setAbsoluteVelocity(0, 0);
                actor.setRotationSpeed(0);
            }
        }
        return this.addPanCallbackControl(x, y, width, height, imgName,
            (hudX: number, hudY: number): boolean => { doMove(hudX, hudY); return true; },
            (hudX: number, hudY: number): boolean => { doMove(hudX, hudY); return true; },
            (hudX: number, hudY: number): boolean => { doStop(); return true; }
        );
    }

    /**
     * Add an image to the heads-up display. Touching the image has no effect.
     * Note that the image is represented by an "Actor", which means we are able
     * to animate it, move it, etc.
     *
     * @param x       The X coordinate of the top left corner (in pixels)
     * @param y       The Y coordinate of the top left corner (in pixels)
     * @param width   The width of the image
     * @param height  The height of the image
     * @param imgName The name of the image to display. Use "" for an invisible button
     * @return The image that was created
     */
    public addImage(x: number, y: number, width: number, height: number, imgName: string): BaseActor {
        let c = new BaseActor(this.overlay, this.stage.device, imgName, width, height);
        c.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
        this.overlay.addActor(c, 0);
        return c;
    }

    /**
     * Place some text on the screen.  The text will be generated by tp, which is called on every
     * screen render
     *
     * @param x         The X coordinate of the bottom left corner (in pixels)
     * @param y         The Y coordinate of the bottom left corner (in pixels)
     * @param fontName  The name of the font to use
     * @param fontColor The color to use for the text
     * @param size      The font size
     * @param tp        The TextProducer
     * @param zIndex    The z index where the text should go
     * @return The display, so that it can be controlled further if needed
     */
    public addText(x: number, y: number, fontName: string, fontColor: string, size: number, tp: () => string, zIndex: number): Renderable {
        return this.overlay.addText(x, y, fontName, fontColor, size, tp, zIndex);
    }

    /**
     * Place some text on the screen.  The text will be generated by tp, which is called on every
     * screen render
     *
     * @param x         The X coordinate of the bottom left corner (in pixels)
     * @param y         The Y coordinate of the bottom left corner (in pixels)
     * @param fontName  The name of the font to use
     * @param fontColor The color to use for the text
     * @param size      The font size
     * @param tp        The TextProducer
     * @param zIndex    The z index where the text should go
     * @return The display, so that it can be controlled further if needed
     */
    public addTextCentered(x: number, y: number, fontName: string, fontColor: string, size: number, tp: () => string, zIndex: number): Renderable {
        return this.overlay.addTextCentered(x, y, fontName, fontColor, size, tp, zIndex);
    }

    /**
     * Specify that an action should happen after a delay
     * 
     * @param interval How long to wait between executions of the action
     * @param repeat Should the action repeat
     * @param action The action to perform
     */
    public addTimer(interval: number, repeat: boolean, action: () => void) {
        this.overlay.timer.addEvent(new TimedEvent(interval, repeat, action));
    }

    /**
     * Add a button that has one behavior while it is being pressed, and another when it is released
     *
     * @param x               The X coordinate of the bottom left corner
     * @param y               The Y coordinate of the bottom left corner
     * @param width           The width of the image
     * @param height          The height of the image
     * @param imgName         The name of the image to display.  Use "" for an invisible button
     * @param whileDownAction The action to execute, repeatedly, whenever the button is pressed
     * @param onUpAction      The action to execute once any time the button is released
     * @return The control, so we can do more with it as needed.
     */
    public addToggleButton(x: number, y: number, width: number, height: number, imgName: string, whileDownAction: () => void, onUpAction: (hudX: number, hudY: number) => void) {
        let c = new BaseActor(this.stage.getHud(), this.stage.device, imgName, width, height);
        c.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
        let active = false; // will be captured by lambdas below
        c.touchDownHandler = (hudX: number, hudY: number) => {
            active = true;
            return true;
        }
        c.touchUpHandler = (hudX: number, hudY: number) => {
            if (!active)
                return false;
            active = false;
            if (onUpAction)
                onUpAction(hudX, hudY);
            return true;
        }
        // Put the control and events in the appropriate lists
        this.stage.getHud().addActor(c, 0);
        this.stage.getWorld().repeatEvents.push(() => { if (active) whileDownAction(); });
        return c;
    }

    /**
     * Create an action that makes a hero throw a projectile
     *
     * @param hero      The hero who should throw the projectile
     * @param offsetX   specifies the x distance between the top left of the projectile and the
     *                  top left of the hero throwing the projectile
     * @param offsetY   specifies the y distance between the top left of the projectile and the
     *                  top left of the hero throwing the projectile
     * @param velocityX The X velocity of the projectile when it is thrown
     * @param velocityY The Y velocity of the projectile when it is thrown
     * @return The action object
     */
    public ThrowFixedAction(hero: Hero, offsetX: number, offsetY: number, velocityX: number, velocityY: number): (hudX: number, hudY: number) => boolean {
        return (hudX: number, hudY: number) => {
            this.stage.getProjectilePool().throwFixed(hero, offsetX, offsetY, velocityX, velocityY);
            return true;
        }
    }

    /**
     * Create an action for moving an actor in the Y direction.  This action can be used by a Control.
     *
     * @param actor The actor to move
     * @param yRate The rate at which the actor should move in the Y direction (negative values are allowed)
     * @return The action
     */
    public makeYMotionAction(actor: WorldActor, yRate: number) {
        return () => { actor.updateVelocity(actor.body.GetLinearVelocity().x, yRate); };
    }

    /**
     * Create an action for moving an actor in the X and Y directions.  This action can be used by a Control.
     *
     * @param actor The actor to move
     * @param xRate The rate at which the actor should move in the X direction (negative values are allowed)
     * @param yRate The rate at which the actor should move in the Y direction (negative values are allowed)
     * @return The action
     */
    public makeXYMotionAction(actor: WorldActor, xRate: number, yRate: number) {
        return () => { actor.updateVelocity(xRate, yRate); };
    }

    /**
    * Create an action for moving an actor in the X direction.  This action can be used by a
    * Control.
    *
    * @param actor The actor to move
    * @param xRate The rate at which the actor should move in the X direction (negative values are
    *              allowed)
    * @return The action
    */
    public makeXMotionAction(actor: WorldActor, xRate: number) {
        return () => { actor.updateVelocity(xRate, actor.body.GetLinearVelocity().y); };
    }

    /**
     * Create an action for moving an actor in the X and Y directions, with dampening on release.
     * This action can be used by a Control.
     *
     * @param actor     The actor to move
     * @param xRate     The rate at which the actor should move in the X direction (negative values
     *                  are allowed)
     * @param yRate     The rate at which the actor should move in the Y direction (negative values
     *                  are allowed)
     * @param dampening The dampening factor
     * @return The action
     */
    public makeXYDampenedMotionAction(actor: WorldActor, xRate: number, yRate: number, dampening: number) {
        return () => { actor.updateVelocity(xRate, yRate); actor.body.SetLinearDamping(dampening); }
    }

    /**
     * The default behavior for throwing is to throw in a straight line. If we instead desire that
     * the projectiles have some sort of aiming to them, we need to use this method, which throws
     * toward where the screen was pressed
     * <p>
     * Note: you probably want to use an invisible button that covers the screen...
     *
     * @param x          The X coordinate of the bottom left corner (in pixels)
     * @param y          The Y coordinate of the bottom left corner (in pixels)
     * @param width      The width of the image
     * @param height     The height of the image
     * @param imgName    The name of the image to display. Use "" for an invisible button
     * @param h          The hero who should throw the projectile
     * @param milliDelay A delay between throws, so that holding doesn't lead to too many throws at
     *                   once
     * @param offsetX    specifies the x distance between the bottom left of the projectile and the
     *                   bottom left of the hero throwing the projectile
     * @param offsetY    specifies the y distance between the bottom left of the projectile and the
     *                   bottom left of the hero throwing the projectile
     * @return The button that was created
     */
    public addDirectionalThrowButton(x: number, y: number, width: number, height: number, imgName: string, h: Hero, milliDelay: number, offsetX: number, offsetY: number) {
        let c = new BaseActor(this.stage.getHud(), this.stage.device, imgName, width, height);
        c.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
        let v = new PhysicsType2d.Vector2(0, 0);
        let isHolding = false;
        c.touchDownHandler = (hudX: number, hudY: number) => {
            isHolding = true;
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let world = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            v.x = world.x;
            v.y = world.y;
            return true;
        };
        c.touchUpHandler = (hudX: number, hudY: number) => {
            isHolding = false;
            return true;
        }
        c.panMoveHandler = (hudX: number, hudY: number) => {
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let world = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            v.x = world.x;
            v.y = world.y;
            return isHolding;
        }
        this.stage.getHud().addActor(c, 0);

        let mLastThrow = 0;
        this.stage.getWorld().repeatEvents.push(() => {
            if (isHolding) {
                let now = new Date().getTime();
                if (mLastThrow + milliDelay < now) {
                    mLastThrow = now;
                    this.stage.getProjectilePool().throwAt(h.body.GetPosition().x,
                        h.body.GetPosition().y, v.x, v.y, h, offsetX, offsetY);
                }
            }
        });
        return c;
    }

    /**
     * Create an action that makes a hero throw a projectile in a direction that relates to how the
     * screen was touched
     *
     * @param hero    The hero who should throw the projectile
     * @param offsetX specifies the x distance between the bottom left of the projectile and the
     *                bottom left of the hero throwing the projectile
     * @param offsetY specifies the y distance between the bottom left of the projectile and the
     *                bottom left of the hero throwing the projectile
     * @return The action object
     */
    public ThrowDirectionalAction(hero: Hero, offsetX: number, offsetY: number) {
        return (hudX: number, hudY: number) => {
            let pixels = this.overlay.camera.metersToScreen(hudX, hudY);
            let world = this.stage.getWorld().camera.screenToMeters(pixels.x, pixels.y);
            this.stage.getProjectilePool().throwAt(hero.body.GetPosition().x, hero.body.GetPosition().y, world.x, world.y, hero, offsetX, offsetY);
            return true;
        };
    }

    /**
     * Create an action for making a hero rotate
     *
     * @param hero The hero to rotate
     * @param rate Amount of rotation to apply to the hero on each press
     * @return The action
     */
    public makeRotator(hero: Hero, rate: number) {
        return () => {
            hero.increaseRotation(rate);
        }
    }

    /**
    * Create an action for making a hero throw a projectile
    *
    * @param hero       The hero who should throw the projectile
    * @param milliDelay A delay between throws, so that holding doesn't lead to too many throws at
    *                   once
    * @param offsetX    specifies the x distance between the top left of the projectile and the
    *                   top left of the hero throwing the projectile
    * @param offsetY    specifies the y distance between the top left of the projectile and the
    *                   top left of the hero throwing the projectile
    * @param velocityX  The X velocity of the projectile when it is thrown
    * @param velocityY  The Y velocity of the projectile when it is thrown
    * @return The action object
    */
    public makeRepeatThrow(hero: Hero, milliDelay: number, offsetX: number, offsetY: number, velocityX: number, velocityY: number): () => void {
        let mLastThrow = 0; // captured by lambda
        return () => {
            let now = new Date().getTime();
            if (mLastThrow + milliDelay < now) {
                mLastThrow = now;
                this.stage.getProjectilePool().throwFixed(hero, offsetX, offsetY, velocityX, velocityY);
            }
        }
    }

    /**
     * Create an action that makes a hero jump.
     *
     * @param hero The hero who we want to jump
     * @param milliDelay If there should be time between being allowed to jump
     * @return The action object
     */
    public jumpAction(hero: Hero, milliDelay: number): (x: number, y: number) => boolean {
        let mLastJump = 0;
        return () => {
            let now = new Date().getTime();
            if (mLastJump + milliDelay < now) {
                mLastJump = now;
                hero.jump();
                return true;
            }
            return false;
        };
    }

    /**
     * Create an action for making a hero either start or stop crawling
     *
     * @param hero       The hero to control
     * @param crawlState True to start crawling, false to stop
     * @param rotate     The amount (in radians) to rotate the hero when crawling
     * @return The action
     */
    public makeCrawlToggle(hero: Hero, crawlState: boolean, rotate: number) {
        return () => {
            if (crawlState)
                hero.crawlOn(rotate);
            else
                hero.crawlOff(rotate);
        };
    }
}