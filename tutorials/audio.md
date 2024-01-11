# Sound Effects

This tutorial introduces sound effects.  We won't get into background music in
this tutorial, since it is covered pretty well in the tutorial about
transitioning among stages.

## Sounds Versus Music

In JetLag, there is a distinction between sounds and music: Even though they are
both created from the same kinds of audio files (.mp3, .wav, .ogg), they play
different roles.  `Music` refers to audio files that are long, and that you want
to loop, so they can serve as background music for your game.  `Sound` refers to
things that are short, don't loop, and should play in response to certain
events.

Part of how we see this is in the way that the `Config` object treats them as
separate things:

```typescript
  musicNames = [];
  soundNames = ["flap_flap.ogg", "high_pitch.ogg", "low_pitch.ogg", "lose_sound.ogg", "slow_down.ogg", "win_sound.ogg"];
```

Since this tutorial focuses on sound effects (sounds), you'll need to put these six files into your `assets` folder:

- [flap_flap.ogg](audio/flap_flap.ogg)
- [high_pitch.ogg](audio/high_pitch.ogg)
- [low_pitch.ogg](audio/low_pitch.ogg)
- [lose_sound.ogg](audio/lose_sound.ogg)
- [slow_down.ogg](audio/slow_down.ogg)
- [win_sound.ogg](audio/win_sound.ogg)

As with images, you should avoid having spaces in the names of your sound files!

## HTML5 Issues

Since JetLag is based on web technologies (HTML5, JavaScript, CSS), it is
subject to some rules that relate to web browsers.  The most important of these
is that a web page can't start playing sounds until there is some gesture on the
page.

In addition, it's a good idea to have a way to let the person playing your game
mute and un-mute the game.  Putting both of these ideas together, it's going to
be useful to have a function like this, for drawing a button that mutes/unmutes.

```typescript
/**
 * Draw a mute button
 *
 * @param cfg         Configuration for how to draw the button
 * @param cfg.scene   The scene where the button should be drawn
 * @param cfg.cx      The center X coordinate of the button
 * @param cfg.cy      The center Y coordinate of the button
 * @param cfg.width   The width of the button
 * @param cfg.height  The height of the button
 */
function drawMuteButton(cfg: { cx: number, cy: number, width: number, height: number, scene: Scene }) {
  // Draw a mute button
  let getVolume = () => (stage.storage.getPersistent("volume") ?? "1") === "1";
  let mute = new Actor({
    appearance: new ImageSprite({ width: cfg.width, height: cfg.height, img: "audio_off.png" }),
    rigidBody: new BoxBody({ cx: cfg.cx, cy: cfg.cy, width: cfg.width, height: cfg.height }, { scene: cfg.scene }),
  });
  // If the game is not muted, switch the image
  if (getVolume())
    (mute.appearance[0] as ImageSprite).setImage("audio_on.png");
  // when the obstacle is touched, switch the mute state and update the picture
  mute.gestures = {
    tap: () => {
      // volume is either 1 or 0, switch it to the other and save it
      let volume = 1 - parseInt(stage.storage.getPersistent("volume") ?? "1");
      stage.storage.setPersistent("volume", "" + volume);
      // update all music
      stage.musicLibrary.resetMusicVolume(volume);

      if (getVolume()) (mute.appearance[0] as ImageSprite).setImage("audio_on.png");
      else (mute.appearance[0] as ImageSprite).setImage("audio_off.png");
      return true;
    }
  };
}
```

You'll definitely want to put `sprites.json` in your `imageNames`, so that the
two images are available (or better yet, you could make your own images, which
will probably look better than these!).  You'll also notice that this mute
button uses "persistent" storage.  We'll discuss that more in a later tutorial.
For now, just know that it means your mute button will preserve its state even
if you close and re-open the game.

## Sound Events

To use sound effects, we just add a sound component to an actor.  There are six
sounds.  Note that some of them only make sense for certain kinds of roles:

- Disappear: We assign this to any role, so it will make a sound when it
  disappears.
- Toss: We assign this to a projectile, so it will make a sound when it is
  tossed.
- Arrive: We assign this to a destination, so it will make a sound when a hero
  arrives at it.
- Defeat: We assign this to an enemy, so it will make a sound when it is
  defeated.
- Jump: We assign this to a hero, so it will make a sound when it jumps.
- Collide: We assign this to an obstacle, so it will make a sound when a hero
  collides with it.

Here's a mini-game that shows all of the behaviors:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "assets_audio_animations.html?15"
}
```

The remarkable thing about this mini-game is that the hardest part is not
configuring the sounds, but creating the kinds of actors who can have the sorts
of interactions that will lead to the sound effects happening:

```typescript
    boundingBox();
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);

    // First: you always need a gesture before a web page will play audio, so
    // let's put a mute/unmute button on the HUD:
    drawMuteButton({ cx: 15.5, cy: 0.5, width: 1, height: 1, scene: stage.hud });

    // disappear and collide sounds will both be attached to this obstacle
    let o = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Obstacle(),
      sounds: new SoundEffectComponent({ collide: "flap_flap.ogg", disappear: "high_pitch.ogg" }),
      gestures: { tap: () => { o.remove(); return true; } }
    });

    // The hero will have a jump sound
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      role: new Hero(),
      movement: new TiltMovement(),
      sounds: new SoundEffectComponent({ jump: "slow_down.ogg" }),
      gestures: {
        tap: () => {
          // These projectiles will have toss sounds
          let p = new Actor({
            appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
            rigidBody: new CircleBody({ cx: h.rigidBody.getCenter().x + .2, cy: h.rigidBody.getCenter().y, radius: .1 }),
            movement: new ProjectileMovement(),
            role: new Projectile(),
            sounds: new SoundEffectComponent({ toss: "low_pitch.ogg" })
          });
          // We can use "tossFrom" to throw in a specific direction, starting at
          // a point, such as the hero's center.
          (p.role as Projectile).tossFrom(h, .2, 0, 5, 0);
          return false;
        }
      }
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (h.role as Hero).jump(0, -7.5) });

    // Defeat the enemy to get a defeat sound
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
      sounds: new SoundEffectComponent({ defeat: "lose_sound.ogg" }),
    });

    // Reach the destination for an arrive sound
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: .5 }),
      role: new Destination(),
      sounds: new SoundEffectComponent({ arrive: "win_sound.ogg" }),
    });

    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
```

## Wrapping Up

Sounds are not especially hard to use, but it is difficult to create effective
sound effects.  For example, in this tutorial, you probably noticed that some
sounds were "too long", and kept playing long after they should have stopped.
If you find yourself in a situation like this, you might need to introduce some kind of timer delays, so that your sounds can play out before gameplay resumes.

```md-config
page-title = Sound Effects
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
