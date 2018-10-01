/// <reference path="../../../typings/PhysicsType2d.v0_9.d.ts" />

import { Renderable } from "./Renderable"
import { Scene } from "../stage/Scene"
import { RouteDriver } from "../misc/Route"
import { Route } from "../misc/Route"
import { AnimationDriver } from "./AnimationDriver"
import { Animation } from "./Animation"
import { Renderer, Camera } from "../device/Renderer"
import { TimedEvent } from "../misc/Timer"

/**
 * BodyStyles makes it easier for us to figure out how to clone, resize, and
 * render actors, by letting us know the underlying PhysicsType2d body type
 */
export enum BodyStyle { CIRCLE, RECTANGLE, POLYGON }

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
     * false, we don't run any updates on the object
     */
    private mEnabled: boolean = true;

    /**
     * Specify whether this Renderable object is enabled or disabled.  When it is disabled, it
     * effectively does not exist in the game.
     *
     * @param val The new state (true for enabled, false for disabled)
     */
    public setEnabled(val: boolean) {
        this.mEnabled = val;
    }

    /**
     * Return the current enabled/disabled state of this Renderable
     *
     * @return The state of the renderable
     */
    public getEnabled() {
        return this.mEnabled;
    }

    /** The level in which this Actor exists */
    readonly mScene: Scene;

    /** Physics body for this WorldActor */
    mBody: PhysicsType2d.Dynamics.Body;

    /** The type of body for this actor */
    bodyStyle: BodyStyle;

    /** The dimensions of the WorldActor... x is width, y is height */
    mSize: { x: number, y: number };

    /** The vertices, if this is a polygon */
    verts: PhysicsType2d.Vector2[];

    /** A temp vector to help us avoid allocation */
    tmp = new PhysicsType2d.Vector2(0, 0);

    /** For debug rendering of the shape */
    dbg = new PIXI.Graphics();

    /** For debug rendering of the radius, if this is a circle */
    dbg2 = new PIXI.Graphics();

    /** The z index of this actor. Valid range is [-2, 2] */
    private mZIndex: number;

    /** 
     * Does this WorldActor follow a route? If so, the Driver will be used to
     * advance the  actor along its route.
     */
    mRoute: RouteDriver = null;

    /** Sound to play when the actor disappears */
    mDisappearSound: Howl;

    /** Code to run when this actor is tapped */
    tapHandler: (hudX: number, hudY: number) => boolean = null;

    /** handler for pan start event */
    panStartHandler: (worldX: number, worldY: number) => boolean = null;

    /** handler for pan move event */
    panMoveHandler: (worldX: number, worldY: number) => boolean = null;

    /** handler for pan stop event */
    panStopHandler: (worldX: number, worldY: number) => boolean = null;

    /** handler for downpress event */
    touchDownHandler: (worldX: number, worldY: number) => boolean = null;

    /** handler for release event */
    touchUpHandler: (worldX: number, worldY: number) => boolean = null;

    /** handler for swipe event */
    swipeHandler: (worldX0: number, worldY0: number, worldX1: number, worldY1: number, time: number) => boolean = null;

    /**
     * Create a new BaseActor by creating an image that can be rendered to the screen
     *
     * @param scene   The scene into which this actor should be placed
     * @param imgName The image to show for this actor
     * @param width   The width of the actor's image and body, in meters
     * @param height  The height of the actor's image and body, in meters
     */
    constructor(scene: Scene, imgName: string, width: number, height: number) {
        this.mAnimator = new AnimationDriver(scene.stageManager, imgName);
        this.mDisappearAnimateSize = new PhysicsType2d.Vector2(0, 0);
        this.mDisappearAnimateOffset = new PhysicsType2d.Vector2(0, 0);
        this.mScene = scene;
        this.mSize = new PhysicsType2d.Vector2(width, height);
        this.mZIndex = 0;
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
        shape.SetAsBoxAtOrigin(this.mSize.x / 2, this.mSize.y / 2);
        let boxBodyDef = new PhysicsType2d.Dynamics.BodyDefinition();
        boxBodyDef.type = type;
        boxBodyDef.position.x = x + this.mSize.x / 2;
        boxBodyDef.position.y = y + this.mSize.y / 2;
        this.mBody = this.mScene.world.CreateBody(boxBodyDef);

        let fd = new PhysicsType2d.Dynamics.FixtureDefinition();
        fd.shape = shape;
        this.mBody.CreateFixtureFromDefinition(fd);
        this.setPhysics(0, 0, 0);

        this.mBody.SetUserData(this);

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
            this.verts[i / 2] = new PhysicsType2d.Vector2(vertices[i], vertices[i + 1]);
        // print some debug info, since vertices are tricky
        for (let vert of this.verts)
            console.log("vert", "at " + vert.x + "," + vert.y);
        shape.Set(this.verts);
        let boxBodyDef = new PhysicsType2d.Dynamics.BodyDefinition();
        boxBodyDef.type = type;
        boxBodyDef.position.x = x + this.mSize.x / 2;
        boxBodyDef.position.y = y + this.mSize.y / 2;
        this.mBody = this.mScene.world.CreateBody(boxBodyDef);

        let fd = new PhysicsType2d.Dynamics.FixtureDefinition();
        fd.shape = shape;
        this.mBody.CreateFixtureFromDefinition(fd);
        this.setPhysics(0, 0, 0);

        // link the body to the actor
        this.mBody.SetUserData(this);

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
        boxBodyDef.position.x = x + this.mSize.x / 2;
        boxBodyDef.position.y = y + this.mSize.y / 2;
        this.mBody = this.mScene.world.CreateBody(boxBodyDef);

        let fd = new PhysicsType2d.Dynamics.FixtureDefinition();
        fd.shape = shape;
        this.mBody.CreateFixtureFromDefinition(fd);
        this.setPhysics(0, 0, 0);

        // link the body to the actor
        this.mBody.SetUserData(this);

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
        if (this.mBody.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC) {
            this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
        }
        this.breakJoints();
        this.mBody.SetLinearVelocity(new PhysicsType2d.Vector2(x, y));
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
    render(renderer: Renderer, camera: Camera, elapsedMillis: number) {
        if (!this.getEnabled())
            return;
        if (this.mRoute) this.mRoute.drive();

        // choose the default TextureRegion to show... this is how we animate
        this.mAnimator.advanceAnimation(elapsedMillis);

        // Flip the animation?
        if (this.mDefaultReverseAnimation != null && this.mBody.GetLinearVelocity().x < 0) {
            if (this.mAnimator.mCurrentAnimation != this.mDefaultReverseAnimation)
                this.mAnimator.setCurrentAnimation(this.mDefaultReverseAnimation);
        } else if (this.mDefaultReverseAnimation != null && this.mBody.GetLinearVelocity().x > 0) {
            if (this.mAnimator.mCurrentAnimation == this.mDefaultReverseAnimation)
                if (this.mDefaultAnimation != null)
                    this.mAnimator.setCurrentAnimation(this.mDefaultAnimation);
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
        let fixtures = this.mBody.GetFixtures();
        while (fixtures.MoveNext())
            fixtures.Current().SetSensor(!state);
        fixtures.Reset();
    }


    /**
    * Adjust the default physics settings (density, elasticity, friction) for this actor
    *
    * @param density    New density of the actor
    * @param elasticity New elasticity of the actor
    * @param friction   New friction of the actor
    */
    setPhysics(density: number, elasticity: number, friction: number): void {
        let fixtures = this.mBody.GetFixtures();
        while (fixtures.MoveNext()) {
            let f = fixtures.Current();
            f.SetDensity(density);
            f.SetRestitution(elasticity);
            f.SetFriction(friction);
        }
        fixtures.Reset();
        this.mBody.ResetMassData();
    }

    /**
    * Returns the X coordinate of this actor
    *
    * @return x coordinate of top left corner, in pixels
    */
    public getXPosition(): number {
        return this.mBody.GetPosition().x - this.mSize.x / 2;
    }

    /**
    * Returns the Y coordinate of this actor
    *
    * @return y coordinate of top left corner, in pixels
    */
    public getYPosition(): number {
        return this.mBody.GetPosition().y - this.mSize.y / 2;
    }

    /**
     * Returns the width of this actor
     *
     * @return the actor's width, in pixels
     */
    public getWidth(): number {
        return this.mSize.x;
    }

    /**
     * Return the height of this actor
     *
     * @return the actor's height, in pixels
     */
    public getHeight(): number {
        return this.mSize.y;
    }

    /**
     * Use this to find the current rotation of an actor
     *
     * @return The rotation, in radians
     */
    public getRotation(): number {
        return this.mBody.GetAngle();
    }

    /**
     * Call this on an actor to rotate it. Note that this works best on boxes.
     *
     * @param rotation amount to rotate the actor clockwise (in radians)
     */
    public setRotation(rotation: number): void {
        this.mBody.SetTransform(this.mBody.GetPosition(), rotation);
    }

    /**
     * Make the actor continuously rotate. This is usually only useful for fixed objects.
     *
     * @param duration Time it takes to complete one rotation
     */
    public setRotationSpeed(duration: number): void {
        if (this.mBody.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC)
            this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
        this.mBody.SetAngularVelocity(duration);
    }

    /**
    * Make an actor disappear
    *
    * @param quiet True if the disappear sound should not be played
    */
    public remove(quiet: boolean): void {
        // set it invisible immediately, so that future calls know to ignore this actor
        this.setEnabled(false);
        this.mBody.SetActive(false);

        // play a sound when we remove this actor?
        if (this.mDisappearSound && !quiet)
            this.mDisappearSound.play();
        // To do a disappear animation after we've removed the actor, we draw an actor, so that
        // we have a clean hook into the animation system, but we disable its physics
        if (this.mDisappearAnimation != null) {
            let x = this.getXPosition() + this.mDisappearAnimateOffset.x;
            let y = this.getYPosition() + this.mDisappearAnimateOffset.y;
            let o = new BaseActor(this.mScene, "", this.mDisappearAnimateSize.x, this.mDisappearAnimateSize.y);
            o.setBoxPhysics(PhysicsType2d.Dynamics.BodyType.STATIC, x, y);
            this.mScene.addActor(o, 0);
            o.mBody.SetActive(false);
            o.setDefaultAnimation(this.mDisappearAnimation);
        }
    }

    /**
    * Returns the X velocity of of this actor
    *
    * @return Velocity in X dimension, in pixels per second
    */
    public getXVelocity(): number {
        return this.mBody.GetLinearVelocity().x;
    }

    /**
    * Returns the Y velocity of of this actor
    *
    * @return Velocity in Y dimension, in pixels per second
    */
    public getYVelocity(): number {
        return this.mBody.GetLinearVelocity().y;
    }

    /**
    * Set the absolute velocity of this actor
    *
    * @param x Velocity in X dimension
    * @param y Velocity in Y dimension
    */
    public setAbsoluteVelocity(x: number, y: number): void {
        // ensure this is a moveable actor
        if (this.mBody.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC)
            this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
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
        if (this.mBody.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC) {
            this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
        }

        // Create a Driver to advance the actor's position according to the route
        this.mRoute = new RouteDriver(route, velocity, loop, this);
    }

    /**
     * Change the image being used to display the actor
     *
     * @param imgName The name of the new image file to use
     */
    public setImage(imgName: string) {
        this.mAnimator.updateImage(this.mScene.stageManager, imgName);
    }

    /**
     * Change the position of an actor
     *
     * @param x The new X position, in pixels
     * @param y The new Y position, in pixels
     */
    public setPosition(x: number, y: number): void {
        this.tmp.Set(x + this.mSize.x / 2, y + this.mSize.y / 2);
        this.mBody.SetTransform(this.tmp, this.mBody.GetAngle());
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
        this.mScene.removeActor(this, this.mZIndex);
        this.mZIndex = zIndex;
        this.mScene.addActor(this, this.mZIndex);
    }

    /**
     * Add velocity to this actor
     *
     * @param x Velocity in X dimension
     * @param y Velocity in Y dimension
     */
    public addVelocity(x: number, y: number): void {
        // ensure this is a moveable actor
        if (this.mBody.GetType() == PhysicsType2d.Dynamics.BodyType.STATIC)
            this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
        // Add to the velocity of the actor
        let v = this.mBody.GetLinearVelocity();
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
        this.mScene.mRepeatEvents.push(() => {
            if (this.getEnabled()) {
                let x = -this.mBody.GetLinearVelocity().x;
                let y = -this.mBody.GetLinearVelocity().y;
                let angle = Math.atan2(y, x) + Math.atan2(-1, 0);
                this.mBody.SetTransform(this.mBody.GetPosition(), angle);
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
        this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.DYNAMIC);
    }

    /**
     * Request that this actor disappear after a specified amount of time
     *
     * @param delay How long to wait before hiding the actor, in milliseconds
     * @param quiet Should the item should disappear quietly, or play its disappear sound?
     */
    public setDisappearDelay(delay: number, quiet: boolean): void {
        this.mScene.stageManager.getCurrStage().world.timer.addEvent(new TimedEvent(delay, false, () => this.remove(quiet)));
    }

    /**
     * Set a time that should pass before this actor appears on the screen
     *
     * @param delay How long to wait before displaying the actor, in milliseconds
     */
    public setAppearDelay(delay: number): void {
        this.setEnabled(false);
        this.mBody.SetActive(false);
        this.mScene.stageManager.getCurrStage().world.timer.addEvent(new TimedEvent(delay, false, () => {
            this.setEnabled(true);
            this.mBody.SetActive(true);
        }));
    }

    /**
     * Indicate that this actor should not rotate due to torque
     */
    public disableRotation(): void {
        this.mBody.SetFixedRotation(true);
    }

    /**
     * Request that a sound plays whenever this actor disappears
     *
     * @param soundName The name of the sound file to play
     */
    public setDisappearSound(soundName: string): void {
        this.mDisappearSound = this.mScene.stageManager.device.speaker.getSound(soundName);
    }


    /**
     * Set the default animation sequence for this actor, and start playing it
     *
     * @param animation The animation to display
     */
    public setDefaultAnimation(animation: Animation) {
        this.mDefaultAnimation = animation;
        this.mAnimator.setCurrentAnimation(this.mDefaultAnimation);
    }

    /**
     * Set the animation sequence to use when the actor is moving in the negative X direction
     *
     * @param animation The animation to display
     */
    public setDefaultReverseAnimation(animation: Animation) {
        this.mDefaultReverseAnimation = animation;
    }

    /**
     * Set the animation sequence to use when the actor is removed from the world
     *
     * @param animation The animation to display
     * @param offsetX   Distance between the animation and the left side of the actor
     * @param offsetY   Distance between the animation and the bottom of the actor
     * @param width     The width of the animation, in case it's not the same as the actor width
     * @param height    The height of the animation, in case it's not the same as the actor height
     */
    public setDisappearAnimation(animation: Animation, offsetX: number, offsetY: number, width: number, height: number) {
        this.mDisappearAnimation = animation;
        this.mDisappearAnimateOffset.Set(offsetX, offsetY);
        this.mDisappearAnimateSize.Set(width, height);
    }

    /**
     * Indicate that this actor should shrink over time.  Note that using negative values will lead
     * to growing instead of shrinking.
     *
     * @param shrinkX      The number of meters by which the X dimension should shrink each second
     * @param shrinkY      The number of meters by which the Y dimension should shrink each second
     * @param keepCentered Should the actor's center point stay the same as it shrinks, or should
     *                     its bottom left corner stay in the same position
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
            let w = this.mSize.x - shrinkX / 20;
            let h = this.mSize.y - shrinkY / 20;
            // if the area remains >0, resize it and schedule a timer to run again
            if ((w > 0.05) && (h > 0.05)) {
                this.resize(x, y, w, h);
            } else {
                this.remove(false);
                done = true;
            }
        });
        this.mScene.stageManager.getCurrStage().world.timer.addEvent(te);
    }

    /**
     * Set a dampening factor to cause a moving body to slow down without colliding with anything
     *
     * @param amount The amount of damping to apply
     */
    public setDamping(amount: number): void {
        this.mBody.SetLinearDamping(amount);
    }

    /**
     * Set a dampening factor to cause a spinning body to decrease its rate of spin
     *
     * @param amount The amount of damping to apply
     */
    public setAngularDamping(amount: number): void {
        this.mBody.SetAngularDamping(amount);
    }

    /** Animation support: this tracks the current state of the active animation (if any) */
    mAnimator: AnimationDriver;

    /** Animation support: the cells of the default animation */
    mDefaultAnimation: Animation;

    /** Animation support: the cells of the animation to use when moving backwards */
    mDefaultReverseAnimation: Animation;

    /** Animation support: the cells of the disappearance animation */
    private mDisappearAnimation: Animation;

    /** Animation support: the dimensions of the disappearance animation */
    private mDisappearAnimateSize: PhysicsType2d.Vector2;

    /** Animation support: the offset for placing the disappearance animation relative to the disappearing actor */
    private mDisappearAnimateOffset: PhysicsType2d.Vector2;

    /** Extra data for the game designer to attach to the actor */
    private extra: any = {};

    /**
     * Indicate that this actor should be immune to the force of gravity
     */
    public setGravityDefy() {
        this.mBody.SetGravityScale(0);
    }

    /**
     * Force an actor to have a Kinematic body type.  Kinematic bodies can move, but are not subject
     * to forces in the same way as Dynamic bodies.
     */
    public setKinematic() {
        if (this.mBody.GetType() != PhysicsType2d.Dynamics.BodyType.KINEMATIC)
            this.mBody.SetType(PhysicsType2d.Dynamics.BodyType.KINEMATIC);
    }

    /**
     * Retrieve any additional information for this actor
     *
     * @return The object that the programmer provided
     */
    public getExtra(): any {
        return this.extra;
    }

    /**
     * Set additional information for this actor
     *
     * @param text Object to attach to the actor
     */
    public setExtra(x: any) {
        this.extra = x;
    }

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
        let oldBody = this.mBody;
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
            let xScale = height / this.mSize.y;
            let yScale = width / this.mSize.x;
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
        this.mSize.x = width;
        this.mSize.y = height;
        // Update the user-visible physics values
        this.setPhysics(oldFix.GetDensity(), oldFix.GetRestitution(), oldFix.GetFriction());
        this.setFastMoving(oldBody.IsBullet());
        // clone forces
        this.mBody.SetAngularVelocity(oldBody.GetAngularVelocity());
        this.mBody.SetTransform(this.mBody.GetPosition(), oldBody.GetAngle());
        this.mBody.SetGravityScale(oldBody.GetGravityScale());
        this.mBody.SetLinearDamping(oldBody.GetLinearDamping());
        this.mBody.SetLinearVelocity(oldBody.GetLinearVelocity());
        // disable the old body
        oldBody.SetActive(false);
    }

    /**
     * Indicate whether this actor is fast-moving, so that the physics simulator can do a better job
     * dealing with tunneling effects.
     *
     * @param state True or false, depending on whether it is fast-moving or not
     */
    setFastMoving(state: boolean): void {
        this.mBody.SetBullet(state);
    }
}