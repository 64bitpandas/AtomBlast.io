# AtomBlast.io
A proof-of-concept multiplayer arena game where players battle at the atomic level, crafting elements to devastate opponents and capture their nucleus!

## Important Note
Due to the unsustainably large scope of this project, the massive amount of existing bugs/quirks/performance issues, and a lack of focus in regards to design, the AtomBlast project has been **discontinued indefinitely** with no plans to resume development in the future.

**With that being said, however, I believe that what we achieved with this existing proof-of-concept is far from trivial, and we hope the code base can be used by other developers (maybe you??) to continue this game or use its code to create something altogether different.** Some dev-related features we achieved with AtomBlast include:
 - A client-server game system written in pure Javascript with Socket.io working together with PixiJS for a seamless websocket send/request callback system,
 - A simple matchmmaking system for creating and populating an arbitrary amount of server rooms,
 - A custom tiling manager that allows easy map generation given a simple 2D array of strings,
 - A chat system with custom commands,
 - An object abstraction in PixiJS for handling interactions, movement inputs, and inheritance structures,
 - A webapp runnable by anyone to self-host game servers,
 - And many more small but not insignificant features that are outlined in the document below.

[Click here](https://docs.google.com/document/d/1ZGnYwhiIQsNdGobX5avQVrTenKA4hU-TRgqMUDB4ums/edit) to view our developer doc that describes the code design of the game.

## Setting up and joining your own AtomBlast server
Since the project has been discontinued, we are no longer offering a demo server, so if you want to try the game for yourself we recommend you self-host. (It's actually really easy!)

1. [Download and extract the game files](https://github.com/64bitpandas/AtomBlast.io/archive/master.zip) or run `git clone https://github.com/64bitpandas/AtomBlast.io.git`.
2. [Download Node.js](https://nodejs.org/en/) if you haven't already.
3. Using your terminal of choice, run `npm i` to install dependencies.
4. Run `npm start`. You should see a message that the server has started on port 12002. (Customize this port in `src/server/config.json`.)
5. Open your browser of choice and type `localhost:12002`.
6. If you want to play with friends in the local network, run `ip addr` on Linux or `ipconfig` in Windows to see your local IP (should start with `192.168...`) and ask them to connect to `192.168.x.xxx:12002` replacing the x's with the numbers in your local IP.
7. If you want to host an online server, look up how to port forward or host on a webserver. 

## Game Features in this Proof-Of-Concept

Although the game is not complete, it is fully playable and has the following features implemented:
 - Matchmmaking and multiplayer: autojoin a room/team, or make your own custom room/team!
 - Chat: Send messages to the room, or view announcements for events such as tile captures.
 - Atom spawning/collection/inventory: Head over to spawners to collect atoms for crafting!
 - Tile capturing: Reduce a tile's HP to capture it for your own team!
 - Customizable loadouts: Choose which compounds you want to play with!
 - Crafting: Compounds require a certain number of compounds to craft!
 - Compound types: Flammable, Health, Speed, Stream, Barrier. View the compound selection menu to learn more!

## How to Play

 - WASD to move
 - Left click or Space to shoot/craft
 - 1,2,3,4 to select compound to craft
 - Esc for menu

## Documentation

Coverage: [![Inline docs](https://inch-ci.org/github/BananiumLabs/AtomBlast.io.svg?branch=pixi)](https://inch-ci.org/github/BananiumLabs/AtomBlast.io)

[Click here](https://docs.google.com/document/d/1WfPeLDOq0typScXC974l0_CQz-JU2uzMb1uliLe71E4/edit#) to view our concept doc. 

[Click here](https://docs.google.com/document/d/1ZGnYwhiIQsNdGobX5avQVrTenKA4hU-TRgqMUDB4ums/edit) to view our developer doc that describes the code design of the game.

[Click here](https://64bitpandas.github.io/AtomBlast.io/) to view the API reference.


**If when running nodemon it gives an error `EADDRINUSE`, run this: `kill -9 $(lsof -t -i:12002)`**

## Contact

If you would like additional information about AtomBlast, have any questions/comments, or just would like to get in touch, shoot an email to hello@bencuan.me.