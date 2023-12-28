# Graphical Assets

This tutorial starts our in-depth discussion of the different ways that you can
control the appearance of an Actor.  We've already looked at `TextSprite`, so
now we'll focus on the different "filled" shapes, as well as the `ImageSprite`.

- About color codes for those filledsprites (include transparency)
- No spaces in names!
- Changing images/animations without making new components
- Z index!

## Exploring Appearance Concepts With Filled Sprites

JetLag draws some connections between an actor's appearance and its rigid body.
When the rigid body moves, the appearance moves with it, so that the centers of
the two are the same.  Similarly, when an actor's rigid body rotates, the
appearance rotates too.  Beyond that, there isn't much of a link.  We've already
seen this a bit... The rigid body shape does not need to match the shape of the
appearance component, and the rigid body size does not need to match the size of
the appearance component.  We can see this in the following mini-game, where the
box and circle don't have the same dimensions as their rigid bodies:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?1"
}
```

The code for this level should not be too much of a surprise... we make three
actors, give each a rigid body, and give each an appearance:

```typescript
    // A circle.  It is filled red.  It has a green outline.  The body has a
    // bigger radius
    new Actor({
      appearance: new FilledCircle({ radius: .5, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    })

    // A rectangle.  It is filled blue.  It has no outline.  The body has a
    // smaller perimeter and different shape
    new Actor({
      rigidBody: new BoxBody({ cx: 3, cy: 4, width: 2, height: 2 }),
      appearance: new FilledBox({ width: 1, height: .5, fillColor: "#0000ff" }),
    })

    // A polygon.  The fourth color channel is "alpha", and 00 means
    // "transparent", even though it looks like it should be red.
    new Actor({
      rigidBody: new PolygonBody({ cx: 10, cy: 5, vertices: [0, -.5, .5, 0, 0, .5, -1, 0] }),
      appearance: new FilledPolygon({ vertices: [0, -.5, .5, 0, 0, .5, -1, 0], fillColor: "#ff000000", lineWidth: 4, lineColor: "#00ff00" }),
    })
```

It's good to just review a few things.  First, pretty much everything in JetLag
is an Actor, and every actor has an "appearance" component.  There are three
kinds of appearance components: ImageSprite, AnimatedSprite, and filled shapes.
There are three kinds of filled shapes, which we see here.

Filled shapes (and all colors in JetLag, for that matter) are described in terms
of red, green, and blue.  Each part is two characters, with each character being
in the range [0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F]. Capitalization doesn't matter.
So the color #DECC02 has a red of DE, a green of CC, and a blue of 02.  You can
learn more at [w3 schools](https://www.w3schools.com/colors/colors_picker.asp).
Also, note that a fourth pair of numbers is optional, representing transparency
(an "alpha" channel).  00 means fully transparent, FF means not at all
transparent, and anything in between is partly transparent.  Transparent circles
and boxes are the least expensive appearances for JetLag to manage, so if you're
not sure what to use, these are a good choice.

Also, notice that since "transparent" is a possibility, every filled shape must
have a color.  Assigning an outline is optional, so if you want an outline, with
no fill, just use transparency.

## Using Graphics

Since JetLag uses Pixi.js to draw to the screen, you can use any image format
that Pixi.js understands.  This includes .png, .jpg, .webp, and many other
formats.  However, not all formats are equally beneficial.  In particular, .png
tends to be among the most useful, because it has support for transparency, and
it does not use "lossy" compression.  That means your .png images won't be
blurry, unless you stretch them too much.

Below are links to two images:

- [green_ball.png](graphic_assets/green_ball.png)
- [noise.png](graphic_assets/noise.png)

Every image is a rectangle, but the green ball uses transparency to *seem* like
it's a circle.  This is a key idea in games... your image assets need to use
transparency if you don't want them to be rectangles.

For now, only add `noise.png` to your `Config`'s `imageNames` array.  Then
replace `builder()`'s code with the following:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 2, height: 2, img: "noise.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    });
```

You should see something like this:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?2"
}
```

Next, add `green_ball.png` to your `imageNames`, and then change `noise.png` to
`green_ball.png`.  Since the rigid body is a circle, the green ball is a much
better choice.

Also, remember that right now, `hitBoxes` is `true`.  If you set it `false`, the
outline of the rigid body will no longer show... you'll want to do that when you
release your game, but during development, it's probably a good idea to keep the
hit boxes turned on.

## Dealing With Errors

If you enter a name incorrectly, JetLag should print an error to the console and
stop running.  For example, try replacing `noise.png` with `bird.png`:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 2, height: 2, img: "bird.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    });
```

You should see an error message in your developer console, probably something
like "Uncaught (in promise) Unable to find graphics asset 'bird.png'.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?3"
}
```

If you type a name incorrectly in your `imageNames` array, you'll get a
different (and less helpful) error message.  Be sure to try it before moving
forward in this tutorial.  @@red Also, please note that spaces in asset names
are almost always a bad idea.  The same is true for special characters like `(`
and `)`.  You should try to only use letters, numbers, and underscore in asset
file names. @@

## Sprite Sheets

Typing all your file names into the `imageNames` array is tedious and error
prone.  It also happens to be slow.  The problem is that JetLag needs to fetch
these images one at a time.  Fortunately, there are tools like
[TexturePacker](https://www.codeandweb.com/texturepacker).  With TexturePacker,
you can turn a bunch of small images into a single big image.  TexturePacker
also will give you a `.json` file that JetLag (via Pixi.js) can use to decipher
that big image into all of its parts.  Let's try it out.  Remove
`green_ball.png` from your `imageNames`.  Then download these two files into
your `assets`` folder:

- [sprites.png](graphic_assets/sprites.png)
- [sprites.json](graphic_assets/sprites.json)

Be sure to open both files to see what they look like.  The .png file has a
bunch of images packed together.  The .json file tells Pixi.js (and hence
JetLag) how to extract those images from the file.

We load spritesheets just like we load other images in our `Config` object:

```typescript
imageNames = ["sprites.json"];
```

Then our code can use the image names, just like before:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 2, height: 2, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    });
```

And the result is exactly what we'd expect:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?4"
}
```

## Using The Z Index

Every appearance component in JetLag has an optional "z" argument.  Z lets us
control how things overlap.  There are 5 Z levels: -2, -1, 0, 1, and 2. By
default, everything goes in Z=0.  Also, by default, things within a Z index
appear on top of things that were made before them in the same block of code.

To test this out, start by copying the `enableTilt` and `boundingBox` functions
from the Camera tutorial.  Then put this code into your `builder()`:

```typescript
    enableTilt(10, 10);
    boundingBox();

    // This actor will go "under" everything else in Z=0, since it was drawn first
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 8, cy: 1 }),
      role: new Hero(),
      movement: new TiltMovement()
    });

    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "left_arrow.png" }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: 15, cy: 1 })
    });

    // But the actor will go *over* this, since its Z is -1
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "right_arrow.png", z: -1 }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: 1, cy: 1 })
    });
```

As you test the mini-game below, be sure to try to make the hero collide with
both arrows.  Since they have no role, they both get the `Passive` role, which
means the hero won't collide with them.  Because of the rules about Z, the hero
will seem to go over one, and under the other.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?5"
}
```

## Changing Images On The Fly

We can change the ImageSprite's underlying image on the fly.  This is not the
same as animation, but it can be useful.  In this example, we'll change the
hero's image according to its strength.  We'll do this by having goodies that
increase the hero strength.  Here's the mini-game:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?6"
}
```

We'll start by setting up the gravity and making a hero who can move via tilt:

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);

    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 1 })
    });
```

Since we're going to make several goodies that all have the same `onCollect`
behavior, we will make the `onCollect` function first.  We don't use the goodie
that is passed to it, so we give it a name that starts with an underscore.  As
for the hero, we'll change its appearance by calling `setImage()`.  Note that we
can't give it a `new ImageSprite()`... JetLag doesn't allow that.  Instead, we
change the image used by its existing `ImageSprite`.  Also, notice that I am
computing the name of the image based n the hero's strength.  The different
`color_star_X.png` images are part of our `sprites.json` file.

```typescript
    let onCollect = (_g: Actor, h: Actor) => {
      let s = ++(h.role as Hero).strength;
      (h.appearance as ImageSprite).setImage("color_star_" + s + ".png");
      return true;
    }
```

Finally, we'll add four goodies, each of which uses this `onCollect` function.
There's a nice simplification when writing this code.  If we had named the
function `changeHeroImageBasedOnStrength`, then our role would need to be `new
Goodie({onCollect: changeHeroImageBasedOnStrength})`.  But when the name of the
field on the right side of the `:` and the name of the value on the left side
are the same, we can just write it once:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 6.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 6.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
```

(Note: if you absolutely must have an "invisible" image at some point, you can use `""` as the `img` value.  This is the one situation in which JetLag won't complain that an image name cannot be found.)

## Parallax Backgrounds and Foregrounds

Parallax backgrounds and foregrounds are the only situations in which that an
appearance is not associated with a rigid body.  They are also the only times
that a filled shape or `TextSprite` cannot be used in place of an `ImageSprite`.

These backgrounds and foregrounds give the appearance of depth, by scrolling at
different speeds.  Begin by downloading these two files and adding them to your
game's `imageNames`:

- [back.png](graphic_assets/back.png)
- [mid.png](graphic_assets/mid.png)

In our example, we'll only use background layers.  Foreground layers work in
exactly the same way.  Also, we'll only use `ImageSprite`, but once you complete
the tutorial on Animations, you'll be able to use `AnimatedSprite` as well.  Here's the mini-game we'll make:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?7"
}
```

Let's begin by making a new function for drawing "wide" bounding boxes:

```typescript
/** Draw a bounding box that surrounds an extended (32m) world viewport */
function wideBoundingBox() {
  // Draw a box around the world
  new Actor({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: -.05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: 9.05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 32.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
}
```

Now we can start putting code in our `builder()`.  To begin, let's set up the shape of the world:

```typescript
    wideBoundingBox();
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, 32, 9);
```

Then we can add an actor who moves via tilt.  The camera will follow this actor:

```typescript
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.world.camera.setCameraFocus(h, 5, 0);
```

Since our layers use transparency, we'll put a color in the background:

```typescript
    stage.backgroundColor = "#4050D0";
```

Then we can make our layers.  They will be displayed in the order they are made,
and we control their speed.  A speed of 0 means "same as the hero".  You can
think of this as the layer that is closest to the camera.  A speed of 1 means
"seems not to move".  This is usually the most distant background layer.  In
general, you'll probably want your background layers to be drawn in reverse
order of their speed... 0, then .8, then .5, then .2, then .1.  Our example only
has two layers, so this isn't too hard:

```typescript
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5 }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 })

    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5 }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 })
```

Under the hood, JetLag will use the `imageMaker` to make as many copies of the
image as it needs, and it will stretch them according to their width/height.  It
uses the `anchor` as a reference point for where to draw the first image, and
then it makes more, to the left and right, as needed.

There are other options for backgrounds (and foregrounds), including those that
scroll vertically and those that scroll "automatically", even when the actors
aren't moving.  You may have seen some of these in other tutorials, so hopefully now they make more sense!

## Wrapping Up

Once you're comfortable with the ideas in this tutorial, you'll be ready to move
on to the Animations tutorial.  An animation in JetLag are built from a a series
of images, not from an "animated" image (such as a .gif), so you will need to
understand `ImageSprite` well before trying to make animations.

```md-config
page-title = Graphical Assets
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
