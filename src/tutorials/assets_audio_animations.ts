import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox, FilledCircle, FilledPolygon, ImageSprite } from "../jetlag/Components/Appearance";
import { ManualMovement, ProjectileMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";
import { Scene } from "../jetlag/Entities/Scene";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = ["flap_flap.ogg", "high_pitch.ogg", "low_pitch.ogg", "lose_sound.ogg", "slow_down.ogg", "win_sound.ogg"];
  imageNames = ["alien.json", "sprites.json", "noise.png", "mid.png", "back.png"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  if (level == 1) {
    // Pretty much everything in JetLag is an Actor, and every actor has an
    // "appearance" component.  There are three kinds of appearance components:
    // ImageSprite, AnimatedSprite, and filled shapes.  There are three kinds of
    // filled shapes, which we'll see here.  Notice that the filled shape does
    // not need to look anything like the underlying rigid body.

    // Filled shapes (and all colors in JetLag, for that matter) are described
    // in terms of red, green, and blue.  Each part is two characters, with each
    // character being in the range [0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F].
    // Capitalization doesn't matter.  So the color #DECC02 has a red of DE, a
    // green of CC, and a blue of 02.  You can learn more at
    // https://www.w3schools.com/colors/colors_picker.asp

    // A circle.  It is filled red.  It has a green outline.  The body has a
    // bigger radius
    Actor.Make({
      appearance: new FilledCircle({ radius: .5, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    })

    // A rectangle.  It is filled blue.  It has no outline.  The body has a
    // smaller perimeter and different shape
    Actor.Make({
      rigidBody: new BoxBody({ cx: 3, cy: 4, width: 2, height: 2 }),
      appearance: new FilledBox({ width: 1, height: .5, fillColor: "#0000ff" }),
    })

    // A polygon.  The fourth color channel is "alpha", and 00 means
    // "transparent", even though it looks like it should be red.
    Actor.Make({
      rigidBody: new PolygonBody({ cx: 10, cy: 5, vertices: [0, -.5, .5, 0, 0, .5, -1, 0] }),
      appearance: new FilledPolygon({ vertices: [0, -.5, .5, 0, 0, .5, -1, 0], fillColor: "#ff000000", lineWidth: 4, lineColor: "#00ff00" }),
    })
  }

  else if (level == 2) {
    // We can also use images.  In this case, there is an image called
    // "noise.png" in the "assets" folder.  Up above, "assets" is the folder
    // name in the config object, and "noise.png" is listed as an image.  That
    // means we can use the image:
    Actor.Make({
      appearance: new ImageSprite({ width: 2, height: 2, img: "noise.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    });
    // In almost all cases, you'll want to use PNG images, because they support
    // transparency.  Images are always squares, but transparency can make them
    // look like they have the same shape as their underlying rigidBody.

    // It's probably also a good idea not to put spaces in any of your file
    // names
  }

  else if (level == 3) {
    // Copying all your images into the "assets" folder and listing them all in
    // that array up above is tedious and error prone.  If you put in a bad
    // name, your developer console will give you an error.
    Actor.Make({
      appearance: new ImageSprite({ width: 2, height: 2, img: "bird.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    });
  }

  else if (level == 4) {
    // Things are much easier if you use a tool like TexturePacker
    // (https://www.codeandweb.com/texturepacker).  You can drop a bunch of
    // images into it, and it gives you back *one* png and *one* json file.  You
    // can put the two files into your assets folder, and then just put the json
    // file into the array up above.  Then you can use the names of the files,
    // just like before.
    Actor.Make({
      appearance: new ImageSprite({ width: 2, height: 2, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: 1 }),
    });
  }

  else if (level == 5) {
    enableTilt(10, 10);
    boundingBox();
    // Every appearance takes an optional "z" argument.  Z lets us control how
    // things overlap.  There are 5 Z levels: -2, -1, 0, 1, and 2.  By default,
    // everything goes in Z=0.  Also, by default, things within a Z index appear
    // on top of things that were made before them.  Let's try it out.

    // This actor will go "under" everything else in Z=0, since it was drawn first
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 8, cy: 1 }),
      role: new Hero(),
      movement: new TiltMovement()
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "left_arrow.png" }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: 15, cy: 1 })
    });

    // But the actor will go *over* this, since its Z is -1
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "right_arrow.png", z: -1 }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: 1, cy: 1 })
    });
  }

  else if (level == 6) {
    // We can change the ImageSprite's underlying image on the fly.  This is not
    // the same as animation, but it can be useful.  In this example, we'll
    // change the hero's image according to its strength
    boundingBox();
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);

    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 1 })
    });
    let onCollect = (_g: Actor, h: Actor) => {
      let s = ++(h.role as Hero).strength;
      (h.appearance as ImageSprite).setImage("color_star_" + s + ".png");
      return true;
    }
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 6.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 6.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect }),
    });

  }

  else if (level == 7) {
    // JetLag supports parallax backgrounds.  These can only be ImageSprite or
    // AnimatedSprite.
    boundingBox2();
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, 32, 9);
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.world.camera.setCameraFocus(h, 5, 0);
    stage.backgroundColor = "#4050D0";
    // These get layered in the order they are made.  You probably want them to
    // be layered from speed 1 down to speed 0.
    stage.background.addLayer({ cx: 8, cy: 4.5 }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 })
    // Speed 0 is "same as hero"; Speed 1 is "seems not to move".  In between
    // will seem like layers in the distance.
    stage.background.addLayer({ cx: 8, cy: 4.5 }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 })

    // JetLag also supports foregrounds.  They work in the same way :)
  }

  else if (level == 8) {
    // Next, let's look at animations.  They're a lot harder.  We start by
    // making an animation map:
    let animation_map = new Map();
    // The default animation is called "IDLE_E", representing when something
    // faces rightward/eastward.  You must provide it.  So in this case, we'll
    // make an animation based on 8 coin images, they'll show for the same
    // amount of time each:
    let coins = AnimationSequence.makeSimple({
      timePerFrame: 50,
      repeat: true,
      images: ["coin0.png", "coin1.png", "coin2.png", "coin3.png", "coin4.png", "coin5.png", "coin6.png", "coin7.png"]
    });
    animation_map.set(AnimationState.IDLE_E, coins);

    // Now we can use it:
    Actor.Make({
      appearance: new AnimatedSprite({ width: .5, height: .5, animations: animation_map }),
      rigidBody: new CircleBody({ cx: 5, cy: 2, radius: .25 }),
    });
  }

  else if (level == 9) {
    // We can "advance" an animation, so that things aren't overly synchronized
    let animation_map = new Map();
    // The default animation is called "IDLE_E", representing when something
    // faces rightward/eastward.  You must provide it.  So in this case, we'll
    // make an animation based on 8 coin images, they'll show for the same
    // amount of time each:
    let coins = AnimationSequence.makeSimple({
      timePerFrame: 50,
      repeat: true,
      images: ["coin0.png", "coin1.png", "coin2.png", "coin3.png", "coin4.png", "coin5.png", "coin6.png", "coin7.png"]
    });
    animation_map.set(AnimationState.IDLE_E, coins);

    // Now we can use it
    for (let i = 0; i < 16; ++i) {
      let coin = Actor.Make({
        appearance: new AnimatedSprite({ width: .5, height: .5, animations: animation_map }),
        rigidBody: new CircleBody({ cx: i + .5, cy: 2, radius: .25 }),
      });
      (coin.appearance as AnimatedSprite).skipTo(Math.trunc(i / 2), (i % 2) * .25);
    }
  }

  else if (level == 10) {
    // In the previous animation examples, every cell of the animation took the
    // same amount of time.  We can make different cells show for different
    // durations, if we're willing to do a little more work:
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

    // Note that I did not draw the Alien.  I used the "Universal Sprite Sheet
    // Creator" at
    // https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/.
    Actor.Make({
      rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 2 }),
      appearance: new AnimatedSprite({ width: 2, height: 2, animations }),
      role: new Hero(),
      movement: new ManualMovement(),
    });
  }

  else if (level == 11) {
    // The two most common kinds of 2D games are those with an overhead view,
    // and those with a side view.  In overhead mode, it makes sense to have
    // animations for 8 different directions: N, NE, E, SE, S, SW, W, and NW.
    // Let's try just doing 4... it's not going to work too well.
    boundingBox();

    let animations = new Map();
    animations.set(AnimationState.WALK_N, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_u_0.png", "alien_walk_u_1.png", "alien_walk_u_2.png", "alien_walk_u_3.png", "alien_walk_u_4.png", "alien_walk_u_5.png", "alien_walk_u_6.png", "alien_walk_u_7.png", "alien_walk_u_8.png"]
    }));
    animations.set(AnimationState.WALK_W, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_l_0.png", "alien_walk_l_1.png", "alien_walk_l_2.png", "alien_walk_l_3.png", "alien_walk_l_4.png", "alien_walk_l_5.png", "alien_walk_l_6.png", "alien_walk_l_7.png", "alien_walk_l_8.png"]
    }));
    animations.set(AnimationState.WALK_S, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_d_0.png", "alien_walk_d_1.png", "alien_walk_d_2.png", "alien_walk_d_3.png", "alien_walk_d_4.png", "alien_walk_d_5.png", "alien_walk_d_6.png", "alien_walk_d_7.png", "alien_walk_d_8.png"]
    }));
    animations.set(AnimationState.WALK_E, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"]
    }));

    animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("alien_thrust_u_0.png", 750).to("alien_thrust_u_1.png", 75));
    animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));
    animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("alien_thrust_d_0.png", 750).to("alien_thrust_d_1.png", 75));
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

    const hero = Actor.Make({
      rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 2 }),
      appearance: new AnimatedSprite({ width: 2, height: 2, animations }),
      role: new Hero(),
      movement: new ManualMovement(),
    });

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));
  }

  else if (level == 12) {
    // Let's look at a bad solution
    boundingBox();

    let animations = new Map();
    animations.set(AnimationState.WALK_N, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_u_0.png", "alien_walk_u_1.png", "alien_walk_u_2.png", "alien_walk_u_3.png", "alien_walk_u_4.png", "alien_walk_u_5.png", "alien_walk_u_6.png", "alien_walk_u_7.png", "alien_walk_u_8.png"]
    }));
    animations.set(AnimationState.WALK_W, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_l_0.png", "alien_walk_l_1.png", "alien_walk_l_2.png", "alien_walk_l_3.png", "alien_walk_l_4.png", "alien_walk_l_5.png", "alien_walk_l_6.png", "alien_walk_l_7.png", "alien_walk_l_8.png"]
    }));
    animations.set(AnimationState.WALK_S, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_d_0.png", "alien_walk_d_1.png", "alien_walk_d_2.png", "alien_walk_d_3.png", "alien_walk_d_4.png", "alien_walk_d_5.png", "alien_walk_d_6.png", "alien_walk_d_7.png", "alien_walk_d_8.png"]
    }));
    animations.set(AnimationState.WALK_E, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"]
    }));

    animations.set(AnimationState.WALK_NE, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"]
    }));
    animations.set(AnimationState.WALK_SE, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"]
    }));
    animations.set(AnimationState.WALK_NW, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_l_0.png", "alien_walk_l_1.png", "alien_walk_l_2.png", "alien_walk_l_3.png", "alien_walk_l_4.png", "alien_walk_l_5.png", "alien_walk_l_6.png", "alien_walk_l_7.png", "alien_walk_l_8.png"]
    }));
    animations.set(AnimationState.WALK_SW, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_l_0.png", "alien_walk_l_1.png", "alien_walk_l_2.png", "alien_walk_l_3.png", "alien_walk_l_4.png", "alien_walk_l_5.png", "alien_walk_l_6.png", "alien_walk_l_7.png", "alien_walk_l_8.png"]
    }));

    animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("alien_thrust_u_0.png", 750).to("alien_thrust_u_1.png", 75));
    animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));
    animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("alien_thrust_d_0.png", 750).to("alien_thrust_d_1.png", 75));
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

    const hero = Actor.Make({
      rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 2 }),
      appearance: new AnimatedSprite({ width: 2, height: 2, animations }),
      role: new Hero(),
      movement: new ManualMovement(),
    });

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));
  }

  else if (level == 13) {
    boundingBox();

    let animations = new Map();
    animations.set(AnimationState.WALK_N, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_u_0.png", "alien_walk_u_1.png", "alien_walk_u_2.png", "alien_walk_u_3.png", "alien_walk_u_4.png", "alien_walk_u_5.png", "alien_walk_u_6.png", "alien_walk_u_7.png", "alien_walk_u_8.png"]
    }));
    animations.set(AnimationState.WALK_W, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_l_0.png", "alien_walk_l_1.png", "alien_walk_l_2.png", "alien_walk_l_3.png", "alien_walk_l_4.png", "alien_walk_l_5.png", "alien_walk_l_6.png", "alien_walk_l_7.png", "alien_walk_l_8.png"]
    }));
    animations.set(AnimationState.WALK_S, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_d_0.png", "alien_walk_d_1.png", "alien_walk_d_2.png", "alien_walk_d_3.png", "alien_walk_d_4.png", "alien_walk_d_5.png", "alien_walk_d_6.png", "alien_walk_d_7.png", "alien_walk_d_8.png"]
    }));
    animations.set(AnimationState.WALK_E, AnimationSequence.makeSimple({
      timePerFrame: 75, repeat: true,
      images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"]
    }));

    animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("alien_thrust_u_0.png", 750).to("alien_thrust_u_1.png", 75));
    animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));
    animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("alien_thrust_d_0.png", 750).to("alien_thrust_d_1.png", 75));
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

    // A better solution is to re-map some states to others, so we don't
    // re-start the animations
    let remap = new Map();
    remap.set(AnimationState.WALK_NE, AnimationState.WALK_E);
    remap.set(AnimationState.WALK_SE, AnimationState.WALK_E);
    remap.set(AnimationState.WALK_NW, AnimationState.WALK_W);
    remap.set(AnimationState.WALK_SW, AnimationState.WALK_W);

    remap.set(AnimationState.IDLE_NE, AnimationState.IDLE_E);
    remap.set(AnimationState.IDLE_SE, AnimationState.IDLE_E);
    remap.set(AnimationState.IDLE_NW, AnimationState.IDLE_W);
    remap.set(AnimationState.IDLE_SW, AnimationState.IDLE_W);

    const hero = Actor.Make({
      rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 2 }),
      appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
      role: new Hero(),
      movement: new ManualMovement(),
    });

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    // Be sure to check out the platformer tutorial and the overhead fighting
    // and farming tutorial for more examples of animations
  }

  else if (level == 14) {
    // In this level, we will have tilt to move left/right, but there is so much
    // friction that tilt will only be effective when the hero is in the air.
    // This will let us watch how some of the animations work in side-view
    // games.  We'll also do a disappearance animation.
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    boundingBox()

    stage.backgroundColor = "#17b4ff";
    // Layers can be a nice way to make backgrounds even when there isn't scrolling :)
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // The hero has one animation when it is not in the air, another when it is
    // Note that "jump_right" will also be used when jumping to the left, if
    // there is no "jump_left"

    // We'll set up idle_right and jump_right 
    let idle_right = AnimationSequence.makeSimple({ timePerFrame: 150, repeat: true, images: ["color_star_1.png", "color_star_2.png"] })
    let jump_right = AnimationSequence.makeSimple({ timePerFrame: 150, repeat: true, images: ["color_star_4.png", "color_star_6.png"] });
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, idle_right);
    animations.set(AnimationState.JUMP_E, jump_right);
    // Remap JUMP_W to JUMP_E
    let remap = new Map();
    remap.set(AnimationState.JUMP_W, AnimationState.JUMP_E);

    let h_cfg = { cx: 0.25, cy: 7, width: 0.8, height: 0.8, radius: 0.4, animations, remap };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    // Instead of remapping JUMP_NE, JUMP_SE, JUMP_NW, JUMP_SW, we can tell the
    // AnimatedSprite that this is a side-scroll game, and it will do the work
    // for us.
    (h.appearance as AnimatedSprite).stateSelector = AnimatedSprite.sideViewAnimationTransitions;

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (h.role as Hero).jump(0, -5); });

    // We can make "disappear" animations by turning "repeat" to false when
    // putting an animation where an actor used to be:
    Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "star_burst_3.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 7.5, radius: 0.25 }),
      role: new Goodie(),
      onDisappear: (a: Actor) => {
        let animations = new Map();
        animations.set(AnimationState.IDLE_E, new AnimationSequence(false).to("star_burst_3.png", 200).to("star_burst_2.png", 200).to("star_burst_1.png", 200).to("star_burst_4.png", 200));
        Actor.Make({
          appearance: new AnimatedSprite({ animations, width: .5, height: .5 }),
          rigidBody: new BoxBody({ cx: a.rigidBody.getCenter().x, cy: a.rigidBody.getCenter().y, width: .5, height: .5 }, { collisionsEnabled: false }),
        })
      }
    });
  }

  else if (level == 15) {
    // We're not going to explore *music* in this tutorial, because the
    // stage_transitions tutorial does a pretty good job with it.  But we should
    // take a minute to look at sounds.  Sounds are for quick bursts of audio,
    // not looped background tracks (that's "music").  To use sounds, we just
    // add a sound component to an actor.  There are six sounds: toss,
    // disappear, arrive, defeat, jump, and collide.  Let's test them all:

    boundingBox();
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);

    // First: you always need a gesture before a web page will play audio, so
    // let's put a mute/unmute button on the HUD:
    drawMuteButton({ cx: 15.5, cy: 0.5, width: 1, height: 1, scene: stage.hud });

    // disappear and collide will both be attached to this obstacle
    let o = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Obstacle(),
      sounds: new SoundEffectComponent({ collide: "flap_flap.ogg", disappear: "high_pitch.ogg" }),
      gestures: { tap: () => { o.remove(); return true; } }
    });

    // The hero will have a jump sound, and its projectiles will make toss
    // sounds
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      role: new Hero(),
      movement: new TiltMovement(),
      sounds: new SoundEffectComponent({ jump: "slow_down.ogg" }),
      gestures: {
        tap: () => {
          let p = Actor.Make({
            appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
            rigidBody: new CircleBody({ cx: h.rigidBody.getCenter().x + .2, cy: h.rigidBody.getCenter().y, radius: .1 }),
            movement: new ProjectileMovement(),
            role: new Projectile(),
            sounds: new SoundEffectComponent({ toss: "low_pitch.ogg" })
          });
          // We can use "tossFrom" to throw in a specific direction, starting at a
          // point, such as the hero's center.
          (p.role as Projectile).tossFrom(h, .2, 0, 5, 0);
          return false;
        }
      }
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (h.role as Hero).jump(0, -7.5) });

    // Defeat the enemy to get a defeat sound
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
      sounds: new SoundEffectComponent({ defeat: "lose_sound.ogg" }),
    });

    // Reach the destination for an arrive sound
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 14.5, cy: 8.5, radius: .5 }),
      role: new Destination(),
      sounds: new SoundEffectComponent({ arrive: "win_sound.ogg" }),
    });

    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    // You'll notice that long sounds don't work very well.  It's up to you to
    // create delays as needed by your soundtrack.
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

/** Draw a bounding box that surrounds the default world viewport */
function boundingBox() {
  // Draw a box around the world
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
}

/**
 * Enable Tilt, and set up arrow keys to simulate it
 *
 * @param xMax  The maximum X force
 * @param yMax  The maximum Y force
 */
function enableTilt(xMax: number, yMax: number) {
  stage.tilt.tiltMax.Set(xMax, yMax);
  if (!stage.accelerometer.tiltSupported) {
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  }
}

/** Draw a bounding box that surrounds an extended world viewport */
function boundingBox2() {
  // Draw a box around the world
  Actor.Make({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: -.05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: 9.05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 32.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
}

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
  let mute = Actor.Make({
    appearance: new ImageSprite({ width: cfg.width, height: cfg.height, img: "audio_off.png" }),
    rigidBody: new BoxBody({ cx: cfg.cx, cy: cfg.cy, width: cfg.width, height: cfg.height }, { scene: cfg.scene }),
  });
  // If the game is not muted, switch the image
  if (getVolume())
    (mute.appearance as ImageSprite).setImage("audio_on.png");
  // when the obstacle is touched, switch the mute state and update the picture
  mute.gestures = {
    tap: () => {
      // volume is either 1 or 0, switch it to the other and save it
      let volume = 1 - parseInt(stage.storage.getPersistent("volume") ?? "1");
      stage.storage.setPersistent("volume", "" + volume);
      // update all music
      stage.musicLibrary.resetMusicVolume(volume);

      if (getVolume()) (mute.appearance as ImageSprite).setImage("audio_on.png");
      else (mute.appearance as ImageSprite).setImage("audio_off.png");
      return true;
    }
  };
}