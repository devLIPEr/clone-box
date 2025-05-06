## How it is organized

The main scene "GameChoose.unity" is responsible to show all games available and then load the correct scene for the game.

All possible interfaces are in the same scene and only the one that corresponds to the current state is shown.

The interfaces are:

* Loading: this is shown while the scene is requesting the room to a server;
* Login: this is shown while the players login to the game and show who is playing and a random user picture from the 10 in the "UserIcons.png" made by [Rafael Rech](https://github.com/Rafael-Rech), this interface also shows the game code and a QRCode for the site;
* Wait Playing: this interface is just a counter waiting for all players to decide what they play;
* Play: this interface reproduces the plays made by all players, updating their points accordingly;
* Points: this shows all players points, so they can keep track of theirs and theirs opponent's points.

In case you need more interfaces, it follows the same logic as these ones, create the interface, hide it from camera and make the logic to show it.

## Making new games

You will have to create a new scene and add the UI components from Unity, or duplicate a working scene.

After the scene is created you will need to create a Controller for your game, this extends the "GameController.cs" and is responsible of maintaining the pace of the game using timers for each interface and update the state of the game via websocket.

In case you need more than 10 players in your game, update the pictures variable to a new size and add images to the "UserIcons.png", or create a new file and modify the code to load from it.

After your game is done you will need to add a "GameOption.prefab" to the main scene, set its background image, name and its click function with the GoToScene from "GameChoose.cs".
