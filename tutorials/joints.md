# Getting Started With Joints

This tutorial introduces the idea of joints.  Box2D provides a powerful joint
system, which is accessible from your JetLag-based game.

## Getting Started

This tutorial uses the `enableTilt()` and `boundingBox()` functions.  It also
uses the `sprites.json`/`sprites.png` sprite sheet.  Please follow the
instructions from previous tutorials to get these set up and ready to use.

## About Joints

Joints are a physics-based concept for connecting rigid bodies together.  Box2D
provides many kinds of joints.  We actually saw one already: our "sticky" actors
achieved their stickiness by creating joints.  In that case, JetLag used a
`distanceJoint`, to keep the two actors an exact distance apart from each other.

Joints can be hard to understand, and there really isn't much of a way for
JetLag to hide the joint infrastructure provided by Box2D.  If you are hoping to
do anything advanced with joints, you'll probably want to start by visiting
online Box2D documentation, such as this [Box2D Joint
Overview](https://www.iforce2d.net/b2dtut/joints-overview).  Then you should
look at how the JetLag code uses joints (that is, look at the parts of JetLag
that are used by the code in this tutorial).  Hopefully that will be enough of a
starting point.

## A Simple Revolute Joint

Our first example will create a "revolute" joint.  As you probably guessed, this
joint lets one actor revolve (not rotate!) around another actor.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "joints.html?1"
}
```

In the code, you'll see two actors, one of which is being called `anchor`.  This
is an essential concept: the anchor defines the pivot point around which the
other actor will revolve.

```typescript
    // In this level, a joint relates the rectangle to the circle.  The circle
    // is the pivot point, and the rectangle rotates around it
    let revolving = new Actor({
      appearance: new FilledBox({ width: 5, height: 1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 1.5, cy: 4, width: 5, height: 1, }),
      role: new Obstacle(),
    });

    let anchor = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 7.5, cy: 4, radius: 0.5 }),
      role: new Obstacle(),
    });
```

Next, we connect the two actors by creating a joint between their rigid bodies.
The joint takes two x,y pairs.  These are offsets: we add the first to the
anchor's center, and the second to the revolving actor's center.  The joint will
actually be between those points.  Then we set limits (in radians) on the joint,
so that it can only move so far in either direction, and we attach a motor.  In
this case, the motor runs at half a radian per second, with infinite torque.

```typescript
    revolving.rigidBody.setRevoluteJoint(anchor, 0, 0, 0, 2);
    // Add some limits and give some speed to make it move
    revolving.rigidBody.setRevoluteJointLimits(1.7, -1.7);
    revolving.rigidBody.setRevoluteJointMotor(0.5, Number.POSITIVE_INFINITY);
```

Code like that could serve as a flipper in a pinball-style game, if we didn't
attach a motor until some event happened.  But we'd need a way to re-set the
flipper later.  Let's add a timer, so that after 5 seconds, we can change the
motor properties and move in the opposite direction:

```typescript
    // Notice that we can change the motor at any time...
    stage.world.timer.addEvent(new TimedEvent(5, false, () => {
      // The order in which we do these changes doesn't matter :)
      revolving.rigidBody.setRevoluteJointMotor(-.5, Number.POSITIVE_INFINITY);
      revolving.rigidBody.setRevoluteJointLimits(1.7, -.5);
    }));
```

## Weld Joints

Another type of joint can be used to "weld" two actors' bodies together.  This
can provide a "power up" to an item, or could be a way to show that an actor
needs to "pick up" an item and carry it, as in the example below:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "joints.html?2"
}
```

Let's start by making a world with some gravity, a border and a hero who moves
via tilt:

```typescript
    enableTilt(10, 10);
    stage.world.setGravity(0, 10);
    boundingBox();

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 8.5, radius: 0.4 }, { disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

The "box" will just be an obstacle.  We'll give the obstacle a `heroCollision`
that uses `setWeldJoint()` to weld the box to the hero.  This function takes 6
arguments.  The first is the actor to weld, followed by two x,y pairs,
representing the offsets from the two actors' centers.  The last argument is an
angle (in radians), in case we want some rotation between the welded actors.

```typescript
    new Actor({
      appearance: new FilledBox({ width: .5, height: .5, fillColor: "#FF0000" }),
      // Note that for the weld joint to work, you probably want the obstacle to
      // have a dynamic body.
      rigidBody: new BoxBody({ width: .5, height: .5, cx: 7, cy: 8.5 }, { dynamic: true }),
      role: new Obstacle({
        heroCollision: (o: Actor, h: Actor) => {
          h.rigidBody.setWeldJoint(o, -.25, 0, .4, 0, 0);
        }
      }),
    });
```

## Using Revolute Joints To Drive Vehicles

In the following example, Box2D is doing a lot of work.  The wheels of the car
are not just spinning as a visual effect.  They are actually propelling the car
forward.  This requires friction, careful consideration about the weights of
things, and two revolute joints with motors.  Note that since JetLag only
supports one revolute joint per actor, we put the joints on the wheels, not on
the body of the car.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "joints.html?3"
}
```

In terms of how we get this behavior, all that really matters is that we don't
put any limits on the revolute joints.  That means they can keep spinning, just
like real tires, instead of halting when they reach some angle.

In the code for this example, we'll start by setting up gravity and a border.
We'll add friction to the bottom of the border:

```typescript
    stage.world.setGravity(0, 10);
    let sides = boundingBox();
    sides.b.rigidBody.setPhysics({ friction: 1 });
```

Next, we make the car as two wheels and a rectangle:

```typescript
    let car = new Actor({
      appearance: new FilledBox({ width: 2, height: 0.5, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 1, cy: 8, width: 2, height: 0.5 }),
      role: new Hero(),
    });

    // Connect a back wheel... heavy tires make for good traction
    let backWheel = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 8.5, radius: 0.25 }, { density: 3, friction: 1 }),
      role: new Obstacle(),
    });

    // Connect a front wheel... it'll be all-wheel drive :)
    let frontWheel = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.75, cy: 8.5, radius: 0.25 }, { density: 3, friction: 1 }),
      role: new Obstacle(),
    });
```

All that remains is to set up joints that connect the wheels to the body of the
car.  This car has all-wheel drive, because both wheels have motors.  You should
try different motor speeds, different torques, and front or rear-wheel drive (by
only giving one wheel or the other a motor).

```typescript
    backWheel.rigidBody.setRevoluteJoint(car, -1, 0.5, 0, 0);
    backWheel.rigidBody.setRevoluteJointMotor(10, 10);

    frontWheel.rigidBody.setRevoluteJoint(car, 1, 0.5, 0, 0);
    frontWheel.rigidBody.setRevoluteJointMotor(10, 10);
```

## Wrapping Up

Joints can provide simple visual effects or be a significant aspect of the
physics of your game.  As an example of the former, using JetLag's support for
revolute joints, it is possible to make "rag doll" bodies that flop around.  For
the latter, Box2D provides many more types of joints.  So moving beyond welding
and flippers/wheels, you could potentially make swords, or use a prismatic joint
as a slider (a forklift?).  There are also pulley joints, gear joints, wheel
joints, rope joints, and friction joints.  There are also motor joints and wheel
joints, for situations where the kind of revolute joints in this tutorial aren't
sufficient.  More information can be found in the [Box2D Joint
Documentation](https://box2d.org/documentation/md__d_1__git_hub_box2d_docs_dynamics.html#autotoc_md81).

```md-config
page-title = Getting Started With Joints
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
