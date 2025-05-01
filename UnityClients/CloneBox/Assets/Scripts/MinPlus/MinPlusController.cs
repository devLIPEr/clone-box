using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using TMPro;
using System;
using NativeWebSocket;
using Newtonsoft.Json;
using System.Threading.Tasks;

public class MinPlusController : GameController
{
    // Game instances
    [SerializeField]
    private GameObject userLoginPrefab;
    [SerializeField]
    private GameObject userPointPrefab;

    // Game Interfaces
    [SerializeField]
    private GameObject loginUsers;


    [SerializeField]
    private GameObject waitPlayPage;
    
    [SerializeField]
    private GameObject cardsWait;
    [SerializeField]
    private GameObject waitTimerObj;
    [SerializeField]
    private TMP_Text playerOrder;


    [SerializeField]
    private GameObject playPage;

    [SerializeField]
    private GameObject cardsPlay;
    [SerializeField]
    private GameObject userPlaying;

    [SerializeField]
    private GameObject cardPrefab;
    private TMP_Text connectionTimer;

    [SerializeField]
    private GameObject pointsPage;


    // Game Timers
    [SerializeField]
    private float waitTimer = 60.0f;
    private float resetWaitTimer;
    
    [SerializeField]
    private float playTimer = 30.0f;
    private float resetPlayTimer;
    
    [SerializeField]
    private float pointTimer = 15.0f;
    private float resetPointTimer;
    private float startTimer = 3.0f;
    private float revealCardTimer = 8.0f;
    private float revealCardTimerReset;
    private int revealCardTimerTimes = 0;
    private int revealCardTimerTimesReset = 2;


    // Game variables
    private MinPlusState gameState = MinPlusState.None;
    private int currentRound = 1;
    private int lastRound = 0;
    Dictionary<string, string> cardsPlayed;
    private int playing = 0;
    private bool playedCard = false;


    // User variables
    Dictionary<string, int> points = new Dictionary<string, int>();
    private Dictionary<string, GameUser> users = new Dictionary<string, GameUser>();
    private List<Transform> usersPos = new List<Transform>();
    private List<string> playOrder = new List<string>();
    Sprite[] sprites;


    public struct Point{
        public string id;
        public int points;
        public Point(string id, int points){
            this.id = id;
            this.points = points;
        }
    }


    // Start is called before the first frame update
    async void Start()
    {
        sprites = Resources.LoadAll<Sprite>("Sprites/UserIcons");
        int userPosIdx = 0;
        foreach(Transform user in loginUsers.transform){
            usersPos.Add(user);
            userPosIdx++;
        }
        connectionTimer = connectPage.transform.GetChild(0).GetComponent<TMP_Text>();

        wsDelegate = WSCommunication;
        resetWaitTimer = waitTimer;
        resetPlayTimer = playTimer;
        resetPointTimer = pointTimer;
        revealCardTimerReset = revealCardTimer;
        for(int i = 0; i < 10; i++){
            pictures[i] = String.Format("UserIcons_{0}", i);
        }
        ShufflePictures();

        Debug.Log(String.Format("{0}:{1}/createRoom", DotEnv.serverIp, DotEnv.serverPort));
        UnityWebRequest req = new UnityWebRequest(String.Format("{0}:{1}/createRoom", DotEnv.serverIp, DotEnv.serverPort), "POST");
        byte[] jsonToSend = System.Text.Encoding.UTF8.GetBytes("{\"game\": \"minplus\"}");
        req.uploadHandler = (UploadHandler)new UploadHandlerRaw(jsonToSend);
        req.downloadHandler = (DownloadHandler)new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        UnityWebRequestAsyncOperation operation = req.SendWebRequest();

        while(!operation.isDone){}

        if(req.result == UnityWebRequest.Result.ConnectionError){
            Debug.Log("Error while sending: " + req.error);
        }else{
            room = GameRoom.CreateFromJSON(req.downloadHandler.text);

            await createWS(String.Format("wss://{0}:{1}/unity", room._ip, room._port), wsDelegate);
        }
    }

    // Update is called once per frame
    void Update()
    {
        #if !UNITY_WEBGL || UNITY_EDITOR
            if(ws != null){
                ws.DispatchMessageQueue();
            }
        #endif
        if((gameState & MinPlusState.Started) != 0){ // game has started
            if(startTimer <= 0){
                if((gameState & MinPlusState.Waiting) != 0){
                    if(lastRound != currentRound){
                        Debug.Log("Draw cards");
                        SendWSMessage("2"); // Draw players hands
                        lastRound++;
                    }
                    waitTimer -= Time.deltaTime;
                    waitTimerObj.GetComponent<TMP_Text>().text = Math.Ceiling(waitTimer).ToString("0");
                    if(waitTimer <= 0){
                        // end playing phase
                        SendWSMessage("3");
                        ResetWaiting();
                    }
                }else if((gameState & MinPlusState.Playing) != 0){
                    if(revealCardTimer >= 8 && !playedCard){
                        playedCard = true;
                        Debug.Log(cardsPlayed[playOrder[playing]][revealCardTimerTimes]);
                        Sprite sprite = Resources.Load<Sprite>(String.Format("Sprites/MinPlus/Cards/{0}", cardsPlayed[playOrder[playing]][revealCardTimerTimes]));
                        cardsPlay.transform.GetChild(revealCardTimerTimes+1).GetComponent<RawImage>().texture = sprite.texture;
                        cardsPlay.transform.GetChild(revealCardTimerTimes+1).gameObject.SetActive(true);
                        SendWSMessage(String.Format("5{0}{1}", playOrder[playing], revealCardTimerTimes));
                    }
                    revealCardTimer -= Time.deltaTime;
                    if(revealCardTimer <= 0){
                        revealCardTimer = revealCardTimerReset;
                        revealCardTimerTimes++;
                        playedCard = false;
                    }
                    if(revealCardTimerTimes == revealCardTimerTimesReset){
                        cardsPlay.transform.GetChild(1).gameObject.SetActive(false);
                        cardsPlay.transform.GetChild(2).gameObject.SetActive(false);
                        revealCardTimerTimes = 0;
                        playing++;
                        if(playing == playOrder.Count){
                            SendWSMessage("5e-1");
                            ResetPlaying();
                        }else{
                            userPlaying.GetComponent<TMP_Text>().text = users[playOrder[playing]].username;
                        }
                    }
                }else if((gameState & MinPlusState.Points) != 0){
                    pointTimer -= Time.deltaTime;
                    if(pointTimer <= 0){
                        currentRound++;
                        if(currentRound == 7){
                            gameState &= ~MinPlusState.Started;
                            SendWSMessage("6");
                            finished = true;
                        }else{
                            ResetPointsPage();
                        }
                    }
                }
            }else{
                connectPage.SetActive(true);
                loginPage.SetActive(false);
                startTimer -= Time.deltaTime;
                connectionTimer.text = Math.Ceiling(startTimer).ToString("0");
                if(startTimer <= 0){
                    connectPage.SetActive(false);
                    waitPlayPage.SetActive(true);
                    gameState |= MinPlusState.Waiting;
                }
            }
        }
    }

    void ResetWaiting() {
        waitTimer = resetWaitTimer;
        gameState &= ~MinPlusState.Waiting;
        gameState |= MinPlusState.Playing;
        waitPlayPage.SetActive(false);
        playPage.SetActive(true);
        userPlaying.GetComponent<TMP_Text>().text = users[playOrder[0]].username;
        playing = 0;
        SendWSMessage("1hands");
    }

    void ResetPlaying() {
        playTimer = resetPlayTimer;
        gameState &= ~MinPlusState.Playing;
        gameState |= MinPlusState.Points;
        playPage.SetActive(false);
        pointsPage.SetActive(true);
        SendWSMessage("1played");
        SendWSMessage("4");
    }

    void ResetPointsPage() {
        pointTimer = resetPointTimer;
        gameState &= ~MinPlusState.Points;
        gameState |= MinPlusState.Waiting;
        pointsPage.SetActive(false);
        waitPlayPage.SetActive(true);
    }
    
    private async void OnApplicationQuit()
    {
        UnityWebRequest req = new UnityWebRequest(String.Format("{0}:{1}/room/{2}/end", DotEnv.serverIp, DotEnv.serverPort, room._code), "GET");

        UnityWebRequestAsyncOperation operation = req.SendWebRequest();

        while(!operation.isDone){}
        SendWSMessage("6");
        if(ws != null){
            await ws.Close();
        }
    }

    /*
		0 - started
		1 - getPlayed
		2 - username
		3 - points
		4 - finished
		5 - ping
    */
    void WSCommunication(byte[] bytes) {
        var msg = System.Text.Encoding.UTF8.GetString(bytes);
        Debug.Log(msg);
        string[] command = new string[3];
        command[0] = msg.Substring(0, 1);
        string order = "";
        switch(command[0]){
            case "0":
                gameState |= MinPlusState.Started;
                var rng = new System.Random();
                int n = playOrder.Count;
                while(n > 1){
                    int k = rng.Next(n--);
                    (playOrder[n], playOrder[k]) = (playOrder[k], playOrder[n]);
                }
                order = String.Format("01: {0}", users[playOrder[0]].username);
                for(int i = 1; i < playOrder.Count; i++){
                    order += String.Format("\n{0}: {1}", String.Format("{0}{1}", ((i > 8) ? "" : "0"), i+1), users[playOrder[i]].username);
                }
                playerOrder.text = order;
                UnityWebRequest req = new UnityWebRequest(String.Format("{0}:{1}/room/{2}/start", DotEnv.serverIp, DotEnv.serverPort, room._code), "GET");

                UnityWebRequestAsyncOperation operation = req.SendWebRequest();

                while(!operation.isDone){}
                room._started = true;
                break;
            case "1":
                command[1] = msg.Substring(1);
                cardsPlayed = JsonConvert.DeserializeObject<Dictionary<string, string>>(command[1]);
                break;
            case "2":
                command[1] = msg.Substring(1, msg.Length-2);
                command[2] = msg.Substring(msg.Length-1);
                Debug.Log(command[1]);
                Debug.Log(command[2]);
                Debug.Log(usersPos.Count);
                if(loginPage.activeSelf){
                    picturesIndex--;
                    users[command[2]] = new GameUser(command[2], command[1], pictures[picturesIndex]);
                    playOrder.Add(command[2]);
                
                    GameObject user = Instantiate(userLoginPrefab, usersPos[9-picturesIndex]) as GameObject;
                    Debug.Log(user.name);
                    int userIdx = int.Parse(pictures[picturesIndex].Split('_')[1]);
                    Sprite sprite = Resources.LoadAll<Sprite>("Sprites/UserIcons")[userIdx];
                    user.transform.GetChild(0).gameObject.GetComponent<RawImage>().texture = sprite.texture;
                    user.transform.GetChild(0).gameObject.GetComponent<RawImage>().uvRect = new Rect(
                        sprite.textureRect.x / sprite.texture.width,
                        sprite.textureRect.y / sprite.texture.height,
                        sprite.textureRect.width / sprite.texture.width,
                        sprite.textureRect.height / sprite.texture.height
                    );
                    user.transform.GetChild(1).gameObject.GetComponent<TMP_Text>().text = command[1];
                }
                break;
            case "3":
                command[1] = msg.Substring(1);
                points = JsonConvert.DeserializeObject<Dictionary<string, int>>(command[1]);
                
                int min = points["0"];
                int max = points["0"];
                int range = 0;

                foreach(KeyValuePair<string, int> pointPair in points){
                    if(pointPair.Value < min){
                        min = pointPair.Value;
                    }
                    if(pointPair.Value > max){
                        max = pointPair.Value;
                    }
                }
                range = max;

                List<Point> pointsList = new List<Point>();
                Dictionary<string, float> normalizedPoints = new Dictionary<string, float>();
                foreach(KeyValuePair<string, int> pointPair in points){
                    normalizedPoints[pointPair.Key] = (range > 0) ? (pointPair.Value)/(float)range : (pointPair.Value);
                    normalizedPoints[pointPair.Key] *= 20;
                    pointsList.Add(new Point(pointPair.Key, pointPair.Value));
                }
                pointsList.Sort((p1, p2) => p1.points.CompareTo(p2.points));
                pointsList.Reverse();
                for(int i = 0; i < Mathf.Min(pointsList.Count, playOrder.Count); i++){
                    playOrder[i] = pointsList[i].id;
                }
                order = String.Format("01: {0} ({1})", users[playOrder[0]].username, points[playOrder[0]]);
                for(int i = 1; i < playOrder.Count; i++){
                    order += String.Format("\n{0}: {1} ({2})", String.Format("{0}{1}", ((i > 8) ? "" : "0"), i+1), users[playOrder[i]].username, points[playOrder[i]]);
                }
                playerOrder.text = order;

                foreach(Transform child in pointsPage.transform){
                    Destroy(child.gameObject);
                }

                foreach(KeyValuePair<string, GameUser> userPair in users){
                    GameUser user = userPair.Value;
                    GameObject userObj = Instantiate(userPointPrefab, pointsPage.transform) as GameObject;
                    
                    int userIdx = int.Parse(user.picture.Split('_')[1]);
                    Sprite sprite = sprites[userIdx];
                    userObj.transform.GetChild(0).gameObject.GetComponent<RawImage>().texture = sprite.texture;
                    userObj.transform.GetChild(0).gameObject.GetComponent<RawImage>().uvRect = new Rect(
                        sprite.textureRect.x / sprite.texture.width,
                        sprite.textureRect.y / sprite.texture.height,
                        sprite.textureRect.width / sprite.texture.width,
                        sprite.textureRect.height / sprite.texture.height
                    );
                    userObj.transform.GetChild(1).gameObject.GetComponent<TMP_Text>().text = user.username;
                    
                    for(int i = 0; i < normalizedPoints[user.id]; i++){
                        Instantiate(cardPrefab, userObj.transform.GetChild(2).transform);
                    }
                }
                break;
            case "4":
                waitTimer = 0;
                break;
            case "5":
                Debug.Log("Ping");
                break;
            default:
                break;
        }
    }
}
