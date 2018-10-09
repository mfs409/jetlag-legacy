/// <reference path="../../../typings/PhysicsType2d.v0_9.d.ts" />

import { Renderable } from "../support/Interfaces"
import { BaseScene as BaseScene } from "../scene/Base"
import { Route } from "../support/Route"
import { RouteDriver } from "../support/RouteDriver"
import { AnimationDriver } from "../support/AnimationDriver"
import { Animation } from "../support/Animation"
import { JetLagRenderer, JetLagSound, JetLagDebugSprite, JetLagDevice } from "../support/Interfaces"
import { TimedEvent } from "../support/TimedEvent"
import { Camera } from "../support/Camera"
import { XY } from "../support/XY"

/**
 * BodyStyles makes it easier for us to figure out how to clone, resize, and
 * render actors, by letting us know the underlying PhysicsType2d body type
 */
enum BodyStyle { CIRCLE, RECTANGLE, POLYGON }

/**
 * BaseActor is the parent of all Actor types.
 *
 * We use BaseActor as parent of both WorldActor (MainScene) and SceneActor 
 * (all other scenes), so that core functionality (physics, animation) can be in 
 * one place, even though many of the features of an WorldActor (MainScene) 
 * require a Score object, and are thus incompatible with non-Main scenes.
 */
export class BaseActor implements Renderable {
    /**
     * Track if the object is currently allowed to be rendered.  When it is
     * false, we don't run any updates on the object's physics body
     */
    private enabled: boolean = true;

    /**
     * Specify whether this actor is enabled or disabled.  When it is disabled,
     * it effectively does not exist in the game: it won't be drawn, and its
     * physics body will not be active.
     *
     * @param val The new state (true for enabled, false for disabled)
     */
    public setEnabled(val: boolean) {
        this.enabled = val;
        this.body.SetActive(val);
    }

    /**
     * Return the current enabled/disabled state of this Renderable
     *
     * @return The state of the renderable
     */
    public getEnabled() { return this.enabled; }

    /** Physics body for this WorldActor */
    protected body: PhysicsType2d.Dynamics.Body;

    /** The type of body for this actor */
    private bodyStyle: BodyStyle;

    /** The dimensions of the WorldActor... x is width, y is height */
    private size: { w: number, h: number };

    /** The vertices, if this is a polygon */
    private verts: XY[];

    public getNumVerts() { return this.verts.length; }
    public getVert(index: number) { return this.verts[index].Clone(); }

    /** The z index of this actor. Valid range is [-2, 2] */
    private zIndex: number;

    /** 
     * Does this WorldActor follow a route? If so, the Driver will be used to
     * advance the  actor along its route.
     */
    private route: RouteDriver = null;

    /** Sound to play when the actor disappears */
    private disappearSound: JetLagSound;

    /** A debug render context */
    private debug: JetLagDebugSprite;
    public getDebug() { return this.debug; }

    /** Code to run when this actor is tapped */
    private tapHandler: (worldX: number, worldY: number) => boolean = null;
    public getTapHandler() { return this.tapHandler; }
    public setTapHandler(handler: (worldX: number, worldY: number) => boolean) { this.tapHandler = handler; }

    /** handler for pan start event */
    private panStartHandler: (worldX: number, worldY: number) => boolean = null;
    public getPanStartHandler() { return this.panStartHandler; }
    public setPanStartHandler(handler: (worldX: number, worldY: number) => boolean) { this.panStartHandler = handler; }

    /** handler for pan move event */
    private panMoveHandler: (worldX: number, worldY: number) => boolean = null;
    public getPanMoveHandler() { return this.panMoveHandler; }
    public setPanMoveHandler(handler: (worldX: number, worldY: number) => boolean) { this.panMoveHandler = handler; }

    /** handler for pan stop event */
    private panStopHandler: (worldX: number, worldY: number) => boolean = null;
    public getPanStopHandler() { return this.panStopHandler; }
    public setPanStopHandler(handler: (worldX: number, worldY: number) => boolean) { this.panStopHandler = handler; }

    /** handler for downpress event */
    private touchDownHandler: (worldX: number, worldY: number) => boolean = null;
    public getTouchDownHandler() { return this.touchDownHandler; }
    public setTouchDownHandler(handler: (worldX: number, worldY: number) => boolean) { this.touchDownHandler = handler; }

    /** handler for release event */
    private touchUpHandler: (worldX: number, worldY: number) => boolean = null;
    public getTouchUpHandler() { return this.touchUpHandler; }
    public setTouchUpHandler(handler: (worldX: number, worldY: number) => boolean) { this.touchUpHandler = handler; }

    /** handler for swipe event */
    private swipeHandler: (worldX0: number, worldY0: number, worldX1: number, worldY1: number, time: number) => boolean = null;
    public getSwipeHandler() { return this.swipeHandler; }
    public setSwipeHandler(handler: (worldX0: number, worldY0: number, worldX1: number, worldY1: number, time: number) => boolean) { this.swipeHandler = handler; }

    /** Animation support: this tracks the current state of the active animation (if any) */
    protected animator: AnimationDriver;
    public getAnimator() { return this.animator; }

    /** Animation support: the cells of the default animation */
    protected defaultAnimation: Animation;

    /** Animation support: the cells of the animation to use when moving backwards */
    protected defaultReverseAnimation: Animation;

    /** Animation support: the cells of the disappearance animation */
    private disapperAnimation: Animation;

    /** Animation support: the dimensions of the disappearance animation */
    private disappearAnimateSize: XY;

    /** Animation support: the offset for placing the disappearance animation relative to the disappearing actor */
    private disappearAnimateOffset: XY;

    /** Extra data for the game designer to attach to the actor */
    private extra: any = {};

    public isPoly() { return this.bodyStyle === BodyStyle.POLYGON; }
    public isBox() { return this.bodyStyle == BodyStyle.RECTANGLE; }
    public isCircle() { return this.bodyStyle == BodyStyle.CIRCLE; }

    public getBody() { return this.body; }

    /**
     * Create a new BaseActor by creating an image that can be rendered to the screen
     *
     * @param scene   The scene into which this actor should be placed
     * @param imgName The image to show for this actor
     * @param width   The width of the actor's image and body, in meters
     * @param height  The height of the actor's image and body, in meters
     */
    constructor(private scene: BaseScene, private device: JetLagDevice, imgName: string, width: number, height: number, z: number) {
        this.animator = new AnimationDriver(device.getRenderer(), imgName);
        this.debug = device.getRenderer().makeDebugContext();
        this.disappearAnimateSize = new XY(0, 0);
        this.disappearAnimateOffset = new XY(0, 0);
        this.scene = scene;
        this.size = { w: width, h: height };
        this.zIndex = z;
    }

    /**
     * Specify that this actor should have a rectangular physics shape
     *
     * @param type Is the actor's body static or dynamic?
     * @param x    The X coordinate of the top left corner
     * @param y    The Y coordinate of the top left corner
     */
    setBoxPhysics(type: PhysicsType2d.Dynamics.BodyType, x: number, y: number): void {
        let shape = new PhysicsType2d.Collision.Shapes.PolygonShape();
        shape.SetAsBoxAtOrigin(this.size.w / 2, this.size.h / 2);
        let boxBodyDef = new PhysicsType2d.Dynamics.BodyDefinition();
        boxBodyDef.type = type;
        boxBodyDef.position.x = x + this.size.w / 2;
        boxBodyDef.position.y = y + this.size.h / 2;
        this.body = this.scene.createBody(boxBodyDef);

        let fd = new PhysicsType2d.Dynamics.FixtureDefinition();
        fd.shape = shape;
        this.body.CreateFixtureFromDefinition(fd);
        this.setPhysics(0, 0, 0);

        this.body.SetUserData(this);

        // remember this is a box
        this.bodyStyle = BodyStyle.RECTANGLE;
    }

    /**
     * Specify that this actor should have a polygon physics shape.
     *
     * You must take extreme care when using this method. Polygon vertices must be given in
     * CLOCKWISE order, and they must describe a convex shape.
     * COORDINATES ARE RELATIVE TO THE MIDDLE OF THE OBJECT
     *
     * @param type     Is the actor's body static or dynamic?
     * @param x        The X coordinate of the top left corner
     * @param y        The Y coordinate of the top left corner
     * @param vertices Up to 16 coordinates representing the vertexes of this polygon, listed as
     *                 x0,y0,x1,y1,x2,y2,...
     */
    setPolygonPhysics(type: PhysicsType2d.Dynamics.BodyType, x: number, y: number, vertices: number[]): void {
        let shape = new PhysicsType2d.Collision.Shapes.PolygonShape();
        this.verts = [];
        for (let i = 0; i < vertices.length; i += 2)
            this.verts[i / 2] = new XY(vertices[i], vertices[i + 1]);
        // print some debug info, since vertices are tricky
        for (let vert of this.verts)
            this.device.getConsole().info("vert at " + vert.x + "," + vert.y);
        shape.Set(this.verts);
        let boxBodyDef = new PhysicsType2d.Dynamics.BodyDefinition();
        boxBodyDef.type = type;
        boxBodyDef.position.x = x + this.size.w / 2;
        boxBodyDef.position.y = y + this.size.h / 2;
        this.body = this.scene.createBody(boxBodyDef);

        let fd = new PhysicsType2d.Dynamics.FixtureDefinition();
        fd.shape = shape;
        this.body.CreateFixtureFromDefinition(fd);
        this.setPhysics(0, 0, 0);

        // link the body to the actor
        this.body.SetUserData(this);

        // remember this is a polygon
        this.bodyStyle = BodyStyle.POLYGON;
    }

    /**
     * Specify that this actor should have a circular physics shape
     *
     * @param type   Is the actor's body static or dynamic?
     * @param x      The X coordinate of the top left corner
     * @param y      The Y coordinate of the top left corner
     * @param radius The radius of the underlying circle
     */
    setCirclePhysics(type: PhysicsType2d.Dynamics.BodyType, x: number, y: number, radius: number): void {
        let shape = new PhysicsType2d.Collision.Shapes.CircleShape();
        shape.m_radius = radius;

        let boxBodyDef = new PhysicsType2d.Dynamics.BodyDefinition();
        boxBodyDef.type = type;
        boxBodyDef.position.x = x + this.size.w / 2;
        boxBodyDef.position.y = y + this.size.h / 2;
        this.body = this.scene.createBody(boxBodyDef);

        let fd = new PhysicsType2d.Dynamics.FixtureDefinition();
        fd.shape = shape;
        this.body.CreateFixtureFromDefinition(fd);
        this.setPhysics(0, 0, 0);

        // link the body to the actor
        this.body.SetUserData(this);

        // remember this is a circle
        this.bodyStyle = BodyStyle.CIRCLE;
    }

    /**
     * Internal method for updating an actor's velocity
     *
     * We use this because we need to be careful about possibly breaking joints when we make the
     * actor move
     *
     * @param x The new x velocity
     * @param y The new y velocity
     */
    updateVelocity(x: number, y: number) {
        // make sure it is not static... heroes are already Dynamic, let's just set everything else
        // that is static to kinematic... that's probably safest.
        if (this.body.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC) {
            this.body.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
        }
        this.breakJoints();
        this.body.SetLinearVelocity(new XY(x, y));
    }

    /**
     * Break any joints that involve this actor, so that it can move freely.
     *
     * NB: BaseActors don't have any joints to break, but classes that derive from BaseActor do
     */
    breakJoints(): void { }

    /**
     * Every time the world advances by a timestep, we call this code to update the actor route and
     * animation, and then draw the actor
     */
    render(renderer: JetLagRenderer, camera: Camera, elapsedMillis: number) {
        if (!this.getEnabled())
            return;
        if (this.route) this.route.drive();

        // choose the default TextureRegion to show... this is how we animate
        this.animator.advanceAnimation(elapsedMillis);

        // Flip the animation?
        if (this.defaultReverseAnimation != null && this.body.GetLinearVelocity().x < 0) {
            if (this.animator.getCurrentAnimation() != this.defaultReverseAnimation)
                this.animator.setCurrentAnimation(this.defaultReverseAnimation);
        } else if (this.defaultReverseAnimation != null && this.body.GetLinearVelocity().x > 0) {
            if (this.animator.getCurrentAnimation() == this.defaultReverseAnimation)
                if (this.defaultAnimation != null)
                    this.animator.setCurrentAnimation(this.defaultAnimation);
        }

        renderer.addActorToFrame(this, camera);
    }

    /**
     * Indicate whether this actor engages in physics collisions or not
     *
     * @param state True or false, depending on whether the actor will participate in physics
     *              collisions or not
     */
    setCollisionsEnabled(state: boolean): void {
        // The default is for all fixtures of a actor have the same sensor state
        let fixtures = this.body.GetFixtures();
        while (fixtures.MoveNext())
            fixtures.Current().SetSensor(!state);
        fixtures.Reset();
    }

    getCollisionsEnabled() {
        let f = this.body.GetFixtures();
        while (f.MoveNext()) {
            if (f.Current().IsSensor()) {
                f.Reset();
                return true;
            }
        }
        f.Reset();
        return false;
    }

    /**
     * Adjust the default physics settings (density, elasticity, friction) for this actor
     *
     * @param density    New density of the actor
     * @param elasticity New elasticity of the actor
     * @param friction   New friction of the actor
     */
    setPhysics(density: number, elasticity: number, friction: number) {
        let fixtures = this.body.GetFixtures();
        while (fixtures.MoveNext()) {
            let f = fixtures.Current();
            f.SetDensity(density);
            f.SetRestitution(elasticity);
            f.SetFriction(friction);
        }
        fixtures.Reset();
        this.body.ResetMassData();
    }

    /**
     * Returns the X coordinate of this actor
     *
     * @return x coordinate of top left corner, in pixels
     */
    public getXPosition() {
        return this.body.GetPosition().x - this.size.w / 2;
    }

    /**
     * Returns the Y coordinate of this actor
     *
     * @return y coordinate of top left corner, in pixels
     */
    public getYPosition() { return this.body.GetPosition().y - this.size.h / 2; }

    public getCenterX() { return this.body.GetPosition().x; }
    public getCenterY() { return this.body.GetPosition().y; }

    /**
     * Returns the width of this actor
     *
     * @return the actor's width, in pixels
     */
    public getWidth() { return this.size.w; }

    /**
     * Return the height of this actor
     *
     * @return the actor's height, in pixels
     */
    public getHeight() { return this.size.h; }

    /**
     * Use this to find the current rotation of an actor
     *
     * @return The rotation, in radians
     */
    public getRotation() { return this.body.GetAngle(); }

    /**
     * Call this on an actor to rotate it. Note that this works best on boxes.
     *
     * @param rotation amount to rotate the actor clockwise (in radians)
     */
    public setRotation(rotation: number) {
        this.body.SetTransform(this.body.GetPosition(), rotation);
    }

    /**
     * Make the actor continuously rotate. This is usually only useful for fixed objects.
     *
     * @param duration Time it takes to complete one rotation
     */
    public setRotationSpeed(duration: number): void {
        if (this.body.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC)
            this.body.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
        this.body.SetAngularVelocity(duration);
    }

    /**
     * Make an actor disappear
     *
     * @param quiet True if the disappear sound should not be played
     */
    public remove(quiet: boolean): void {
        // set it invisible immediately, so that future calls know to ignore this actor
        this.setEnabled(false);

        // play a sound when we remove this actor?
        if (this.disappearSound && !quiet)
            this.disappearSound.play();
        // To do a disappear animation after we've removed the actor, we draw an actor, so that
        // we have a clean hook into the animation system, but we disable its physics
        if (this.disapperAnimation != null) {
            let x = this.getXPosition() + this.disappearAnimateOffset.x;
            let y = this.getYPosition() + this.disappearAnimateOffset.y;
            let o = new BaseActor(this.scene, this.device, "", this.disappearAnimateSize.x, this.disappearAnimateSize.y, this.zIndex);
            o.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
            this.scene.addActor(o, 0);
            o.setCollisionsEnabled(false);
            o.setDefaultAnimation(this.disapperAnimation);
        }
    }

    /**
     * Returns the X velocity of of this actor
     *
     * @return Velocity in X dimension, in pixels per second
     */
    public getXVelocity() { return this.body.GetLinearVelocity().x; }

    /**
     * Returns the Y velocity of of this actor
     *
     * @return Velocity in Y dimension, in pixels per second
     */
    public getYVelocity() { return this.body.GetLinearVelocity().y; }

    /**
     * Set the absolute velocity of this actor
     *
     * @param x Velocity in X dimension
     * @param y Velocity in Y dimension
     */
    public setAbsoluteVelocity(x: number, y: number): void {
        // ensure this is a moveable actor
        if (this.body.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC)
            this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
        // change its velocity
        this.updateVelocity(x, y);
        // Disable sensor, or else this actor will go right through walls
        this.setCollisionsEnabled(true);
    }


    /**
     * Specify some code to run when this actor is tapped
     *
     * @param handler The TouchEventHandler to run in response to the tap
     */
    public setTapCallback(handler: (x: number, y: number) => boolean) {
        this.tapHandler = handler;
    }


    /**
     * Request that this actor moves according to a fixed route
     *
     * @param route    The route to follow
     * @param velocity speed at which to travel along the route
     * @param loop     When the route completes, should we start it over again?
     */
    public setRoute(route: Route, velocity: number, loop: boolean): void {
        // This must be a KinematicBody or a Dynamic Body!
        if (this.body.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC) {
            this.body.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
        }

        // Create a Driver to advance the actor's position according to the route
        this.route = new RouteDriver(route, velocity, loop, this, this.device.getConsole());
    }

    /**
     * Change the image being used to display the actor
     *
     * @param imgName The name of the new image file to use
     */
    public setImage(imgName: string) {
        this.animator.updateImage(this.device.getRenderer(), imgName);
    }

    /**
     * Change the position of an actor
     *
     * @param x The new X position, in pixels
     * @param y The new Y position, in pixels
     */
    public setPosition(x: number, y: number): void {
        this.body.SetTransform(new XY(x + this.size.w / 2, y + this.size.h / 2), this.body.GetAngle());
    }

    /**
     * Set the z plane for this actor
     *
     * @param zIndex The z plane. Values range from -2 to 2. The default is 0.
     */
    public setZIndex(zIndex: number): void {
        // Coerce index into legal range, then move it
        zIndex = (zIndex < -2) ? -2 : zIndex;
        zIndex = (zIndex > 2) ? 2 : zIndex;
        this.scene.removeActor(this, this.zIndex);
        this.zIndex = zIndex;
        this.scene.addActor(this, this.zIndex);
    }

    /**
     * Add velocity to this actor
     *
     * @param x Velocity in X dimension
     * @param y Velocity in Y dimension
     */
    public addVelocity(x: number, y: number): void {
        // ensure this is a moveable actor
        if (this.body.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC)
            this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
        // Add to the velocity of the actor
        let v = this.body.GetLinearVelocity();
        v.x += x;
        v.y += y;
        this.updateVelocity(v.x, v.y);
        // Disable sensor, or else this actor will go right through walls
        this.setCollisionsEnabled(true);
    }

    /**
     * Indicate that this actor's rotation should change in response to its direction of motion
     */
    public setRotationByDirection(): void {
        this.scene.repeatEvents.push(() => {
            if (this.getEnabled()) {
                let x = -this.body.GetLinearVelocity().x;
                let y = -this.body.GetLinearVelocity().y;
                let angle = Math.atan2(y, x) + Math.atan2(-1, 0);
                this.body.SetTransform(this.body.GetPosition(), angle);
            }
        });
    }

    /**
     * Ensure that an actor is subject to gravitational forces.
     *
     * By default, non-hero actors are not subject to gravity or forces until
     * they are given a path, velocity, or other form of motion. This lets an
     * actor be subject to forces.  In practice, using this in a side-scroller
     * means the actor will fall to the ground.
     */
    public setCanFall(): void {
        this.body.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
    }

    /**
     * Request that this actor disappear after a specified amount of time
     *
     * @param delay How long to wait before hiding the actor, in milliseconds
     * @param quiet Should the item should disappear quietly, or play its disappear sound?
     */
    public setDisappearDelay(delay: number, quiet: boolean): void {
        this.scene.timer.addEvent(new TimedEvent(delay, false, () => this.remove(quiet)));
    }

    /**
     * Set a time that should pass before this actor appears on the screen
     *
     * @param delay How long to wait before displaying the actor, in milliseconds
     */
    public setAppearDelay(delay: number): void {
        this.setEnabled(false);
        this.scene.timer.addEvent(new TimedEvent(delay, false, () => {
            this.setEnabled(true);
        }));
    }

    /**
     * Indicate that this actor should not rotate due to torque
     */
    public disableRotation(): void {
        this.body.SetFixedRotation(true);
    }

    /**
     * Request that a sound plays whenever this actor disappears
     *
     * @param soundName The name of the sound file to play
     */
    public setDisappearSound(soundName: string): void {
        this.disappearSound = this.device.getSpeaker().getSound(soundName);
    }


    /**
     * Set the default animation sequence for this actor, and start playing it
     *
     * @param animation The animation to display
     */
    public setDefaultAnimation(animation: Animation) {
        this.defaultAnimation = animation;
        this.animator.setCurrentAnimation(this.defaultAnimation);
    }

    /**
     * Set the animation sequence to use when the actor is moving in the negative X direction
     *
     * @param animation The animation to display
     */
    public setDefaultReverseAnimation(animation: Animation) {
        this.defaultReverseAnimation = animation;
    }

    /**
     * Set the animation sequence to use when the actor is removed from the world
     *
     * @param animation The animation to display
     * @param offsetX   Distance between the animation and the left side of the actor
     * @param offsetY   Distance between the animation and the top of the actor
     * @param width     The width of the animation, in case it's not the same as the actor width
     * @param height    The height of the animation, in case it's not the same as the actor height
     */
    public setDisappearAnimation(animation: Animation, offsetX: number, offsetY: number, width: number, height: number) {
        this.disapperAnimation = animation;
        this.disappearAnimateOffset.Set(offsetX, offsetY);
        this.disappearAnimateSize.Set(width, height);
    }

    /**
     * Indicate that this actor should shrink over time.  Note that using negative values will lead
     * to growing instead of shrinking.
     *
     * @param shrinkX      The number of meters by which the X dimension should shrink each second
     * @param shrinkY      The number of meters by which the Y dimension should shrink each second
     * @param keepCentered Should the actor's center point stay the same as it shrinks, or should
     *                     its top left corner stay in the same position
     */
    public setShrinkOverTime(shrinkX: number, shrinkY: number, keepCentered: boolean) {
        let done = false;
        let te = new TimedEvent(.05, true, () => {
            if (done)
                return;
            // NB: we shrink 20 times per second
            let x = 0, y = 0;
            if (keepCentered) {
                x = this.getXPosition() + shrinkX / 20 / 2;
                y = this.getYPosition() + shrinkY / 20 / 2;
            } else {
                x = this.getXPosition();
                y = this.getYPosition();
            }
            let w = this.size.w - shrinkX / 20;
            let h = this.size.h - shrinkY / 20;
            // if the area remains >0, resize it and schedule a timer to run again
            if ((w > 0.05) && (h > 0.05)) {
                this.resize(x, y, w, h);
            } else {
                this.remove(false);
                done = true;
            }
        });
        this.scene.timer.addEvent(te);
    }

    /**
     * Set a dampening factor to cause a moving body to slow down without colliding with anything
     *
     * @param amount The amount of damping to apply
     */
    public setDamping(amount: number): void {
        this.body.SetLinearDamping(amount);
    }

    /**
     * Set a dampening factor to cause a spinning body to decrease its rate of spin
     *
     * @param amount The amount of damping to apply
     */
    public setAngularDamping(amount: number): void {
        this.body.SetAngularDamping(amount);
    }

    /**
     * Indicate that this actor should be immune to the force of gravity
     */
    public setGravityDefy() {
        this.body.SetGravityScale(0);
    }

    /**
     * Force an actor to have a Kinematic body type.  Kinematic bodies can move, but are not subject
     * to forces in the same way as Dynamic bodies.
     */
    public setKinematic() {
        if (this.body.GetType() != PhysicsType2d.Dynamics.BodyType.KINEMATIC)
            this.body.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
    }

    /**
     * Retrieve any additional information for this actor
     *
     * @return The object that the programmer provided
     */
    public getExtra() { return this.extra; }

    /**
     * Set additional information for this actor
     *
     * @param text Object to attach to the actor
     */
    public setExtra(x: any) { this.extra = x; }

    /**
     * Change the size of an actor, and/or change its position
     *
     * @param x      The new X coordinate of its top left corner, in pixels
     * @param y      The new Y coordinate of its top left corner, in pixels
     * @param width  The new width of the actor, in pixels
     * @param height The new height of the actor, in pixels
     */
    public resize(x: number, y: number, width: number, height: number): void {
        // read old body information
        let oldBody = this.body;
        // The default is for all fixtures of a actor have the same sensor state
        let fixtures = oldBody.GetFixtures();
        fixtures.MoveNext();
        let oldFix = fixtures.Current();
        // make a new body
        if (this.bodyStyle === BodyStyle.CIRCLE) {
            this.setCirclePhysics(oldBody.GetType(), x, y, (width > height) ? width / 2 : height / 2);
        } else if (this.bodyStyle === BodyStyle.RECTANGLE) {
            this.setBoxPhysics(oldBody.GetType(), x, y);
        } else if (this.bodyStyle === BodyStyle.POLYGON) {
            // we need to manually scale all the vertices
            let xScale = height / this.size.h;
            let yScale = width / this.size.w;
            let ps = oldFix.GetShape() as PhysicsType2d.Collision.Shapes.PolygonShape;
            let verts: number[] = [];
            for (let i = 0; i < ps.m_vertices.length; ++i) {
                let mTempVector = ps.m_vertices[i];
                verts.push(mTempVector.x * xScale);
                verts.push(mTempVector.y * yScale);
            }
            this.setPolygonPhysics(oldBody.GetType(), x, y, verts);
        }
        // set new height and width of the image
        this.size.w = width;
        this.size.h = height;
        // Update the user-visible physics values
        this.setPhysics(oldFix.GetDensity(), oldFix.GetRestitution(), oldFix.GetFriction());
        this.setFastMoving(oldBody.IsBullet());
        // clone forces
        this.body.SetAngularVelocity(oldBody.GetAngularVelocity());
        this.body.SetTransform(this.body.GetPosition(), oldBody.GetAngle());
        this.body.SetGravityScale(oldBody.GetGravityScale());
        this.body.SetLinearDamping(oldBody.GetLinearDamping());
        this.body.SetLinearVelocity(oldBody.GetLinearVelocity());
        // disable the old body
        oldBody.SetActive(false);
        // TODO: did we forget sensor?
    }

    /**
     * Indicate whether this actor is fast-moving, so that the physics simulator can do a better job
     * dealing with tunneling effects.
     *
     * @param state True or false, depending on whether it is fast-moving or not
     */
    setFastMoving(state: boolean): void {
        this.body.SetBullet(state);
    }
}