# Text and the Heads-Up Display

This tutorial discusses the ways that you can create text that appears in your
game.  It also introduces the heads-up display (HUD).

As you work through this tutorial, there are some important questions that
you'll want to get into the habit of asking yourself whenever you write code:

- When will this code run?
- Where will this actor be drawn?
- What should happen when the text size changes?

## Getting Started

This tutorial needs the following assets.  You should download them both to your
`assets` folder.

- [green_ball.png](text_hud/green_ball.png)
- [Roboto-Black.ttf](text_hud/Roboto-Black.ttf)

Then be sure to add `green_ball.png` to `imageNames` in your `Config` object.

Lastly, be sure to remove all code from your `builder()` function.

## Text Is Just Another Appearance

JetLag uses the "Entity-Component-System" pattern, which means that as much as
possible, the different components should be interchangeable.  Since
`appearance` is a component, we should expect that actors with a text appearance
should only differ from other actors in their `appearance` itself.  Here's a
mini-game to illustrate this point:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?1"
}
```

There are four actors in the mini-game, and when we make them, the only thing
that really makes them seem different from other actors is their appearance.
This does raise an interesting question though: how does the text relate to the
rigid body?  Let's look at our first actor, the red "JetLag" text in the top
left corner:

```typescript
    new Actor({
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: .01 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 22, color: "#FF0000" }, "JetLag")
    });
```

The rigid body is *tiny*, and the text is *centered* on the body.  This is
probably the easiest way to make text.

Every `TextSprite` must have a face, size, and color.  It can also have a
"stroke" (outline), described by the `strokeColor` and `strokeWidth`.  Colors
are usually 6-digit values (see [HTML Color
Codes](https://www.w3schools.com/html/html_colors.asp) for more information). We
can add a fourth pair of digits to the color to make it semi-transparent.

To show all of this, we'll make another text actor.  This time, we'll make the
color semi-transparent. Then we'll make a green ball, and use the "z" field of
its appearance to put it behind the text.  If you look carefully, you'll see
that the green ball is slightly visible through the text.  The value `FF` for
transparency actually means 255 (it's expressed as a number in base 16).  `00`
means 0. Bigger values mean "less transparent", and smaller values mean "more
transparent".

Regarding the Z value, JetLag supports five values: -2, -1, 0, 1, or 2.  This
lets us control how things stack on top of each other.  The default is 0.  If
two things have the same Z, the one we made second is the one on top.

```typescript
    new Actor({
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: .01 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "JetLag")
    });
    new Actor({
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, z: -1, img: "green_ball.png" })
    });
```

Since every actor has a body, we can make Text move, just like anything else.
The key thing is that the text's *body* is what is matters, not its appearance.
When we make a moving actor with text appearance, and we attach a tap gesture to
it, the tap will only be detected on the rigid body, not the whole text box.  In
this case, the green box inside of the "Tap Me" text is the only part that is
interactive.  Be sure to press `F12` and watch for output in the console to
convince yourself that only tapping the green box causes the `tap` code to run.

```typescript
    new Actor({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "Tap Me"),
      movement: new PathMovement(new Path().to(1, 1).to(15, 1).to(15, 8).to(1, 8).to(1, 1), 4, true),
      gestures: {tap: ()=> {console.log("Tapped"); return true;}}
    });
```

## Updating Text Values

In our previous example, the text that appeared on each actor did not change.
Let's try to make a button that announces how many times it has been tapped:

```typescript
    let tap_count = 0;
    new Actor({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite({ center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 }, "Taps: " + tap_count),
      gestures: { tap: () => { console.log("tap"); tap_count += 1; return true; } }
    });
```

Unfortunately, this does not work!  No matter how often we tap, the text always
says "Taps: 0":

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?3"
}
```

The problem here is that we weren't thinking about *when code runs*. `builder()`
is a function that runs *before* the level starts being playable. In our code
above, we explained how to put text on the screen by reading the value of
`tap_count`, combining it with the text "Taps: ", and then putting that text
into an actor on the screen.  So, in essence, we *read* `tap_count` once, while
it was zero, and used that value for the rest of time.

Instead of providing fixed text (indicated by `""`), we can provide a function
that can be run every time the screen updates.  This lets us re-compute the text
all the time, so that it will always show the latest value.  Let's try it out:

```typescript
    let tap_count = 0;
    new Actor({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite(
        { center: true, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 },
        () => "Taps: " + tap_count),
      gestures: { tap: () => { tap_count += 1; return true; } }
    });
```

With this change, the text should now update every time you tap its rigid body.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?4"
}
```

## Text Anchors

When making games (or writing any code), it's important not to just think about
what happens "when it works", but also "when it doesn't".  In games, this is a
more obvious point: sometimes the most important part of a game is what happens
when you lose... if you're not testing that, you're missing out on a key part of
the game!

Another example of this sort of detail-oriented thinking applies to our text
box.  How many times did you click it?  Did you notice what happened when you
clicked it 10 times?

Sometimes, we want our text to be in a fixed alignment on the screen.  That is,
we want the top left corner to stay the same, no matter how long the text gets.
We can achieve this by changing `center` to `false`.  Then JetLag will align the
center of the rigid body with the top-left corner of the text:

```typescript
    let tap_count = 0;
    new Actor({
      rigidBody: new BoxBody({ cx: 1, cy: 1, width: .5, height: .5 }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 64, color: "#FF0000aa", strokeColor: "#0000FF", strokeWidth: 2 },
        () => "Taps: " + tap_count),
      gestures: { tap: () => { tap_count += 1; return true; } }
    });
```

When we test this game, we see that we've solved one problem, but created
another.  Now the rigid body is in an inconvenient location.  The best way to
"fix" this problem is to have two actors: one for anchoring the text, one for
receiving taps.  The tap actor should probably be invisible (which you can
accomplish with a `FilledBox` whose color has an extra two digits for
transparency).

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?5"
}
```

## Reporting Game Information

When we use the "producer" form (`()=>{}`) to generate the text for a
`TextSprite`, we gain the power to report on the status and behavior of any
actor in the world.  Here's an example, where our text reports the hero's
coordinates:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?6"
}
```

We start this mini-game by creating a hero who moves via keyboard, and centering
the camera on it:

```typescript
    let hero = new Actor({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new ManualMovement({ rotateByDirection: true }),
    });

stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (hero.movement as ManualMovement).addVelocity(-1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (hero.movement as ManualMovement).addVelocity(1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (hero.movement as ManualMovement).addVelocity(0, -1))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (hero.movement as ManualMovement).addVelocity(0, 1))

    stage.world.camera.setCameraFocus(hero);
```

Then we can put a text box on the screen that reads the hero's position and
displays it.

```typescript
    new Actor({
      rigidBody: new CircleBody({ cx: .5, cy: .5, radius: .001 }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });
```

However, this brings up a new problem... the text is part of the `world`, and
the hero can move very far away from where we drew the text.  When that happens,
we can't see the text anymore.  (We'll ignore how, without a background, it
doesn't really look like the hero is moving.)

The solution to this problem is a very small bit of code, but a very big idea.
In JetLag, the `stage` actually has two independent physics simulations running
at all times.  One is the `stage.world`.  The other, which is slightly less
powerful, is the `stage.hud` (heads-up display).  The best way to think about
the hud is to think "sometimes, I don't want to draw an actor on the world,
instead I want to draw it *on the camera itself*".

We can put any actor on the HUD by adding some configuration to the rigid body:

```typescript
      rigidBody: new CircleBody({ cx: .5, cy: .5, radius: .001 }, { scene: stage.hud }),
```

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?7"
}
```

And with that tiny change, the text will stay right where we want it.  Be sure
to open the developer console (`F12`) and compare the "World Touch" and "Hud
Touch" values as you move around in the world.  You'll see that the HUD stays in
a fixed position.

## Using Custom Fonts

Up until now, this tutorial has only used the Arial font.  Arial is on pretty
much every device, so it's an easy choice.  However, you might want to use other
fonts, so let's look at two ways of doing so.

The first option is to let your game fetch a font from the web when it starts.
If you visit the [Google Fonts](https://fonts.googleapis.com) website, you'll
find lots of nice fonts that you can use (be sure to read the licensing rules).
Once you've found one, you can edit your `game.html` file to put a `<link>` into
the `<head>`.  This will cause your game to load that font:

```html
  <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
```

Once you've done that, you can use the font's name (in my example, "Lato") as
the `face` when you make a `TextSprite`.  Let's try it, by putting more text on
the last mini-game:

```typescript
    let hero = new Actor({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new ManualMovement({ rotateByDirection: true }),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (hero.movement as ManualMovement).addVelocity(-1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (hero.movement as ManualMovement).addVelocity(1, 0))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (hero.movement as ManualMovement).addVelocity(0, -1))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (hero.movement as ManualMovement).addVelocity(0, 1))
    stage.world.camera.setCameraFocus(hero);

    // Text with the Arial font
    new Actor({
      rigidBody: new CircleBody({ cx: .5, cy: .5, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Arial", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });

    // The same text, with the Lato font
    new Actor({
      rigidBody: new CircleBody({ cx: .5, cy: 1.5, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Lato", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });
```

Sometimes, you don't want to have to request files over the network.
Fortunately, we can also download fonts into our asset folder and add them to
`game.html`.  At the beginning of this tutorial, you should have copied a font
file called `Roboto-Black.ttf` into your assets folder.  This, too, was
downloaded from the Google Fonts website.  It's a little more complicated to get
this font into the game.  We need to put all of the following text into the
`<head>` tag of the `game.html` file:

```html
  <style>
    @font-face {
      font-family: 'Roboto';
      font-style: normal;
      font-weight: 400;
      src: url(assets/Roboto-Black.ttf);
    }
  </style>
```

Now we can use the name that we provided as `font-family` as the `face` for our
`TextSprite`:

```typescript
    new Actor({
      rigidBody: new CircleBody({ cx: .5, cy: 1, radius: .001 }, { scene: stage.hud }),
      appearance: new TextSprite(
        { center: false, face: "Roboto", size: 20, color: "#FF0000aa" },
        () => `${hero.rigidBody.getCenter().x.toFixed(2)}, ${hero.rigidBody.getCenter().y.toFixed(2)}, ${hero.rigidBody.getRotation().toFixed(2)}`),
    });
```

To wrap up this example, let's notice one more thing: since the HUD is a full physics simulation, we can put moving actors onto it.  This usually looks bad, but in the following example, I also added this line:

```typescript
    new Actor({
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .5 }, { scene: stage.hud }),
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      movement: new PathMovement(new Path().to(1, 1).to(15, 1).to(15, 8).to(1, 8).to(1, 1), 4, true)
    });
```

The result is that there is an actor moving on the HUD, text on the hud, and an
actor that can navigate the world:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "text_hud.html?8"
}
```

## Wrapping Up

Text is "just another appearance".  So far, we've used filled shapes, text, and
images.  In the next tutorial, we'll explore appearances in  even more detail.

```md-config
page-title = Text and the Heads-Up Display
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
