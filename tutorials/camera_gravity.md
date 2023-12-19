*** Thinking about the Camera and Gravity (overview.ts; ready)
**** Overview
In this tutorial, we will explore ideas related to the camera and the physics
simulator.  This will let us think about how we can use Box2D and Pixi.js to
make games that seem like they are happening "in front of us" or where we're
watching from above.
**** An overhead game
- The default is no physical forces
- In this game, we won't have any movement in the x/y, but we will rotate
- New things
  - Timer for the enemies (an event)!
  - New role: projectiles!
  - Emphasize that this is a *bad* way to do projectiles (no limit, no
    range), but for this tutorial, it's good enough.
  - Winning and losing, win on enemy count
  - New role: enemies
  - PathMovement, ProjectileMovement
- Talk about default strength for heroes and enemies
**** Another overhead game, with a bigger map
- Just to show that we can do it
- Adds some zooming, but talks about how it's a tad janky
**** A Side Scroller
- Camera follows the hero
- Gravity
- Border Obstacles
- Jumping isn't really jumping, we'll get to that later on
- Tap gesture on the hero
- Destination win condition
- Time limit
- Putting stuff on the HUD
**** A Vertical Scroller
- Elasticity
- Pass-through
- Vertical parallax
- Actual jumping

