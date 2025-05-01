## How it is organized

There is a basic Game Server in the "gameserver" folder, this just implements the basics features of any game.

The main functionalities of this Game Server are:

* Creating a websocket connection to the unity/web clients;
* Adding a handler to a custom route in this serber;
* Toggling a route so it accepts or rejects requests.

The server is responsible to receive and send the messages through websockets or http requests from the Unity and Web clients.

## Creating a new game

You need to create a new folder and a file inside it with the same name.

In this file you need to create a function to handle the messages received via websocket from unity and another from web.

There is a need to define how it will communicate with the clients, however there are 2 default commands that are reserved to login. This server will send a 2 followed by the username and id of the user to unity every time a new user enter the room, it also sends a 1 followed by either a message or a blank to the first users to login (aka the host) so it knows it can start the game or how many more players are needed. Other than these cases you can define your protocol however you want.

## Running the game

After you code the game, compile it using `go build` and create an entry for it in the room-manager "games.json" this will enable that the game can be created by that server.
