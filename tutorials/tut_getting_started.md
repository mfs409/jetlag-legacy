# Getting Started

In this tutorial, we will discuss how to get started using JetLag.  This
tutorial doesn't involve much programming.  It only focuses on getting your
computer set up to start writing games.

## Required Software

You will need the following programs in order to work with JetLag.  Please note
that we do not currently support development on phones or ChromeBooks.:

- A terminal and `git`
    - Every major operating system has at least one terminal program (some even
      have more than one).  It should not matter which terminal you use, but you
      will need to have the `git` program installed.  Briefly, `git` is a
      *source control* tool.  At a minimum, you'll use it to get a copy of the
      starter code.  In most cases, you'll want to use `git` to manage your code
      as you develop it.
- Node.js (`node`) and the Node Package Manager (`npm`)
    - JetLag uses `node` and `npm` to transform your code into a format that can
      be tested inside a browser.
- A web browser
    - Any modern browser should suffice.  JetLag has been tested on Chrome,
      Edge, and Firefox.
- An editor
    - Strictly speaking, any program that can edit text will suffice.  However,
      since JetLag uses TypeScript, you will probably find that Visual Studio
      Code offers many benefits and makes your experience much nicer.

### Installation Instructions for Windows

Be sure to include screenshots

### Installation Instructions for MacOS

Be sure to include screenshots

### Installation Instructions for Linux

Be sure to include screenshots

## Software Config

- There's the git stuff, like your name and merge strategy
- VSCode extensions
- Run `npx http-server` maybe?

## Getting the JetLag Code

Need to decide: fork or degit?

## Installing and Running

`npm install` -- one time only!

`npm start` and opening firefox

End result: you should see the "empty" game, which is just a grid and some other
simple stuff.

## Making It Yours

What are the files and paths that need to be changed right away?

- Stuff in GameConfig.ts
- Stuff in index.html

## Out-of-Date

Setting Up Liblol
In order to make games using liblol, there are two programs you will need.  The first, Android Studio, provides an integrated development environment (IDE) for developing Android programs.  Android Studio lets you edit code, compile code, and debug running code.  The second, git, is a tool for managing source code.  Git allows you to track multiple versions of your code, so that you don't lose anything important.  It also lets you access code stored in public code repositories, such as github.  We'll need git in order to download liblol.

Setting up Android Studio
To set up Android Studio, visit the Android Studio page.  Make sure to download the appropriate installer for your platform.  The installation will take a long time, and use a lot of space.  When everything is installed, you should be able to run Android Studio, and see a window similar to the following:

A **screenshot goes here**

Just close it for now... we need to install git and download the liblol code first.

Setting up Git
Many machines already have git installed.  We'll assume that you're on a Windows machine that doesn't.  If that's the case, visit the git homepage to install Git for windows.  Git for windows will provide a command line interface that is very powerful.

Once you have git installed, go to a command prompt ("git bash" in Windows), navigate to the folder where you want to store your code, and then type this:

    git clone https://github.com/mfs409/liblol.git

This will create a folder called 'liblol', in which you can find the starting point for your new game.

Importing Code into Android Studio
Now it's time to get the code into Android Studio.  Start Android Studio and choose "Import Non-Android Studio project".  Navigate to the liblol folder that you just created, and choose the build.gradle file.  Android Studio will take a little while, and then it will present you with the main Android Studio interface.  If you are asked to restart or install anything, choose "yes".

We need to do a few things before everything will work the way we want it to.  

First, turn on tooltips by going to the "File" menu and choosing "Settings".  On the left, choose "Editor", and then on the right, under the "Other" heading, choose "Show quick doc on mouse move".  This will cause Android Studio to provide helpful documentation about liblol when you hover your mouse over functions and classes in the code.

Second, we need to set up a "Desktop" run target.  This will make it possible to test your code without installing it onto a phone.  Go to the "Run" menu and choose "Edit Configurations".  From there, click the green "+" symbol in the top left corner, and choose "Application".  Then set the following fields of the screen that appears:

Name: enter the text "Desktop"
Main Class: enter the text "com.me.mylolgame.desktop.DesktopLauncher"
Working Directory: navigate to your android/assets folder
Use classpath of mod...: select "desktop"
In the menu bar, to the left of the green "run" triangle, you should now be able to choose between "android" and "Desktop".  Choose "Desktop" and then click the run triangle.  If everything is configured correctly, you should see your game start running after a few seconds.  It should look like this:

A **screenshot goes here**

Going Farther
This setup will enable you to target Android, and to run your code on the desktop without connecting to a phone.  If you wish to add iOS support, you will need to do set up your project from scratch, using the LibGDX project setup guide.

Did it Work?
Hopefully I got everything right, and this tutorial will enable you to get started with liblol.  Please post a comment to report any errors you encounter.
