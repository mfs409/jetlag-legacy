# Drawing Actors From SVG Files

This tutorial presents a feature of JetLag that lets you use a line
drawing (in the SVG format) as a way to quickly make a bunch of Actors.

## Why SVG?

SVG files are a compact way to represent a shape as a series of lines.  In
truth, SVG files can be used for much more than just this, but in 2D games, they
are often used in a simple way: as a convenient way to represent a complex
shape.  Part of the reason SVG is so nice is that it represents the shape as
lines, so as you zoom in or out, there is never any blurring.  This is known as
a "vector" format, instead of a "pixel" format, like SVG.

There are some challenges when using SVGs, though.  For one, the SVG format
allows embedding images, which is not useful to us.  It also has its own notion
of shapes, including circles and curves.  Again, that's not going to be of much
use in our game.  When you use a tool like InkScape to make SVGs for your game,
you probably just want to limit yourself to drawing a single shape, using the
"straight line" tool.

This may seem like a huge simplification... what's the big deal?  If we make a
shape using SVG, it's easy to visualize it before writing any code.  If we ask
JetLag to make a bunch of rectangles, representing the lines of the shape, and
then we find that they don't work, we can just re-draw the shape (or edit it),
re-load it, and see if that makes things better.  As an example, imagine a
racing game with a side view.  By using svg files to represent the ground, you
could draw dozens of "levels", each with a different configuration of hills,
valleys, ramps, and straightaways.  This can save *lots* of time over drawing
the terrain by writing code.

## Getting Started

This tutorial will just draw an ugly SVG shape in the middle of the world.  It
will also put a hero on the screen who can move around and bounce into the
shape.  To get this to work, you'll need the `enableTilt()` and `boundingBox()`
functions, as well as the `sprites.json`/`sprites.png` sprite sheet.

You will also need an SVG file.  You can download this one, and put it in your
`assets` folder:

- [shape.svg](svg/shape.svg)

@@red Do *not* add `shape.svg` to your `imageNames`... it works a little bit
differently.@@

Lastly, VSCode might have trouble locating the `SvgSystem`, which we use to draw
shapes based on the lines in an SVG file.  If you are having trouble, try adding
this `import` statement:

```typescript
import { SvgSystem } from "../jetlag/Systems/Svg";
```

## Using the SvgSystem

Here is the game we are going to make.  It's really quite ugly, but hopefully it
is enough to get you thinking about how SVG can be useful for some kinds of
games.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "svg.html?1"
}
```

This level doesn't take much code to write: we just set up an actor, and then
use `SvgSystem.processFile()` to process the shape.

```typescript
    enableTilt(10, 10);
    boundingBox();

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // draw an obstacle from SVG.  We are stretching it in the X and Y
    // dimensions, and also moving it rightward and downward
    //
    // Notice that "shape.svg" is just a file in assets.  We didn't load it 
    // through the `Config` object.  Instead, it gets loaded right here, when we
    //  make the call to processFile.
    SvgSystem.processFile("shape.svg", 2, 2, 1.5, 1.5, (centerX: number, centerY: number, width: number, rotation: number) => {
      // Make an obstacle and rotate it
      let a = new Actor({
        appearance: new FilledBox({ width, height: 0.05, fillColor: "#FF0000" }),
        rigidBody: new BoxBody({ cx: centerX, cy: centerY, width, height: 0.05 }),
        role: new Obstacle(),
      });
      a.rigidBody.setRotation(rotation);
      a.rigidBody.setPhysics({ density: 1, elasticity: .2, friction: .4 });
    });
```

In the call to `processFile()`, we pass in  the name of the shape file.  JetLag
will download it on demand, in response to the call to `processFile()`.  The
other arguments to the function are x,y coordinates for the top left corner of
the shape, and then amounts to stretch the shape in the x and y dimensions.
Lastly, there's a function that actually makes actors.

When `processFile()` works through the line segments, it will transform any
curves into straight lines (you could, instead, ask InkScape not to make
curves).  Then, for each line, it calls the code you provide.  When it calls
this function, it indicates that the current line segment should be drawn as a
thin rectangle with the provided center coordinates, dimensions, and rotation.
In the code above, you can see how these are applied to the rigid body.

Since you provide the code for making the line segments, you have total control:
you can change the appearance, customize the physics properties of the rigid
body, assign a role, and so forth.

If we were making a real game, we'd probably want to put an actor on top of the
lines we just drew, so that things would look better.  What we draw, and how,
would most likely depend on what effect we were trying to achieve.  Similarly,
we might want our function to count how many times it was called... the lines
will always be drawn in the same order, so in some situations, your code will
know that it needs to do some kind of special configuration on the 14th actor,
or it needs to put the first 6 actors into an array so it can do more with them
later.

## Wrapping up

Most games won't need to use SVG, but for those that do, it can save thousands
of lines of code, and hours of development.  

```md-config
page-title = Drawing Actors From SVG Files
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
.red {color: red}
```
