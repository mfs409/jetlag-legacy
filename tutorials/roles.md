*** Roles (roles.ts; ready)
**** Overview
This tutorial discusses the "automatic" collision behaviors that come from
the roles that JetLag supports
**** What goes in here?
- Let's just announce right up front that we won't talk about the projectile
  role
- Passive role also skipped.  All it does is turn off collisions and ensure
  passives pass through each other
- Each role has certain things it passes through.  Some turn off collisions
  globally and/or with themselves.
- That leaves Hero, Enemy, Destination, Goodie, Obstacle, and Sensor?
-- Goodie: Defaults to no collisions, just has a hero collision callback
   "onCollect"
-- Hero: Default to dynamic; strength; invincibility via duration;
   mustSurvive; onStrengthChange; allowMultiJump; numJumpsAllowed.  Can jump
   and crawl.  JumpReenable stuff
-- Enemy: Have damage, have onDefeated, have onDefeatHero.  defeatByCrawl,
   and defeatByJump.  immuneToInvincibility and instantDefeat.
   disableHeroCollision.  Can always manually defeat, too.
-- Destination: Have a capacity, and have a test to run before accepting
-- Obstacle: has hero, projectile, and enemy collisions.  jumpreenablesides.
   disableHeroCollision to let hero pass through, but not others
-- Sensor: just has a hero collision
- Most things are when the collision starts
  - Automatic things: the code for when a hero and enemy collide.  But even
    these are customizable
    - Goodie: "OnCollect"
    - Destination: "OnAttemptArrival"
    - Enemy: OnDefeatHero, OnDefeated
    - Hero: OnStrengthChange, defaults for enemy, destination, goodie
    - Obstacle: heroCollision, enemyCollision, projectileCollision
    - Sensor: heroCollision

