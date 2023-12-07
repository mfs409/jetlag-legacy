# JetLag Tutorials

This folder holds the markdown for each of the JetLag tutorials.

## Instructions for Making Tutorials

To make a new tutorial, please follow these steps:

1. Create a single markdown file for your tutorial.  File names should be
   lowercase, no spaces, begin with `tut_`, and end with `.md`.
2. Create a folder within this `tutorials/` folder for holding any assets
   (typically images) used by your tutorial.  The name of the folder should be
   the same as the name of your tutorial file, minus the `.md` extension.
3. Create a folder in `src/` for your tutorial's game code.  The folder name
   should be the same as the name of your asset folder from the previous step.
4. Create some game levels to demonstrate your tutorial.  Any assets must be in
   the top-level `assets/` folder.  You should minimize the number of assets you
   require.
5. Add your tutorial's path to the `tsconfig.json` file, so that `npm run check`
   can type-check it.
6. Add your tutorial to the `tutorials` array in `scripts/build_tuts.js`, so
   that it will get built and deployed with the other tutorials.
7. Then you can go ahead and actually write your tutorial.

## Tutorial Table of Contents

### Getting Started

This tutorial is not about what JetLag is or how JetLag works.  It is just about
how to get JetLag running on your computer.

### An Overview of JetLag

This tutorial gives a quick tour of the key ideas in JetLag.  It introduces the
key ideas: a physics simulator, a graphics engine, a camera, actors, and events.

### A Maze Game

This tutorial builds a game where the player must navigate a maze.  It makes
ideas like actor roles more concrete, and it introduces the idea of winning and
losing.

### Text and the HUD

This tutorial discusses how to make text in JetLag.  It introduces the idea of
win and lose scenes, and encourages thinking about "when things run".

### Assets, Audio, and Animations

This tutorial focuses on the key asset types in JetLag: images, sounds, and
sprite sheets.  It briefly discusses texture packing.  It also discusses the
`index.html` file and how to get different fonts into your game.

### Introduction to Simulation: Conway's Game of Life

This tutorial discusses Conway's Game of Life, as a prelude to the idea that a
game might need to create its own internal simulation (e.g., farming).

### Movement Styles and Physics Bodies

This tutorial focuses on the `Movement` field in the constructor for `Actors`.
It also discusses important issues related to rigid body types, physics
properties, gravity, shapes, and tilt.

### Collision Events

This tutorial discusses collision events, and how they are handled in JetLag.

### Storage

This tutorial discusses the different categories of storage in JetLag, and their
idiosyncrasies.  It also discusses the `extra` field, present in all actors.

### An Overhead Fighting/Farming Game

This tutorial builds a game where characters move around in an overhead-view
world, fighting, and farming.  It also introduces the projectile type.

### A Platformer Game

This tutorial builds a platformer-style game.  It introduces the idea of
invincibility, and the different ways a hero can defeat an enemy.

### Gestures and Projectiles

This tutorial focuses on gesture input.  It reinforces ideas about the heads-up
display, and uses projectiles as a way to explain how different gesture
receivers might be placed on the HUD.

### Endless Runner

This tutorial is a gateway into thinking about procedurally-generated content.
It builds an endless runner game.  Realizing that "random" is not always good,
it suggests a simple strategy for avoiding repetitive gameplay.

### Timers

This tutorial builds a survival-style game.  It uses the game to discuss some of
the more nuanced issues related to timers.

### Types of Stages

This tutorial discusses techniques for organizing code, especially with regard
to handling the parts of the game that don't have gameplay, like menus.

### Joints

This tutorial introduces ideas related to joints connecting rigid bodies.

### Miscellaneous Starter Games

This tutorial shows several different interesting behaviors that are possible in
JetLag.  Sometimes a unique game can arise just because of an interesting
behavior that a developer stumbles upon by accident.  This tutorial should cover
any outstanding ideas that are illustrated in a level of the demo game.

### Packaging for Mobile

This tutorial shows how to use Capacitor to package a game for mobile.  It also
discusses games with vertical (portrait) orientation.

### Packaging for Desktop

This tutorial shows how to use Electron to package a game for desktop play
(e.g., Steam).
