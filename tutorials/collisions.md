*** Collision Events (collisions; ready)
**** Overview
This tutorial discusses collision events, and how they are handled in JetLag.
**** What Goes In here?
- Not in it: Most things are when the collision starts
  - Automatic things: the code for when a hero and enemy collide.  But even
    these are customizable
    - Goodie: "OnCollect"
    - Destination: "OnAttemptArrival"
    - Enemy: OnDefeatHero, OnDefeated
    - Hero: OnStrengthChange, defaults for enemy, destination, goodie
    - Obstacle: heroCollision, enemyCollision, projectileCollision
    - Sensor: heroCollision
- Disabling collisions: onesided, passthrough
- addEndContactHandler (world method) is at the end of a collision
- Sticky

