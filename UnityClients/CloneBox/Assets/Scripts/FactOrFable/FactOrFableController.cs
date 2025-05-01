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

public class FactOrFableController : GameController
{
    // Game instances
    [SerializeField]
    private GameObject userLoginPrefab;
    [SerializeField]
    private GameObject userPointPrefab;

    // Game interfaces
    [SerializeField]
    private GameObject loginUsers;

    [SerializeField]
    private GameObject writePage;
    [SerializeField]
    private GameObject writeTimer;

    [SerializeField]
    private GameObject votePage;
    [SerializeField]
    private GameObject factText;
    [SerializeField]
    private GameObject votesObj;
    [SerializeField]
    private GameObject voteTimer;

    [SerializeField]
    private GameObject pointsPage;
    [SerializeField]
    private GameObject pointsUsers;
    
    // Game timers
    [SerializeField]
    private float writeTime = 45.0f;
    private float resetWriteTime;
    [SerializeField]
    private float voteTime = 30.0f;
    private float resetVoteTime;
    [SerializeField]
    private float answerTime = 5.0f;
    private float resetAnswerTime;
    [SerializeField]
    private float pointTime = 10.0f;
    private float resetPointTime;

    // Game variables
    private FactOrFableState gameState = FactOrFableState.None;
    private int currentRound = 1;
    private Stack<string> facts = new Stack<string>();

    // User variables
    private Dictionary<string, GameUser> users = new Dictionary<string, GameUser>();

    // Start is called before the first frame update
    async void Start()
    {
        wsDelegate = WSCommunication;
        resetWriteTime = writeTime;
        resetVoteTime = voteTime;
        resetAnswerTime = answerTime;
        resetPointTime = pointTime;
        for(int i = 0; i < 10; i++){
            pictures[i] = String.Format("UserIcons_{0}", i);
        }
        ShufflePictures();

        UnityWebRequest req = new UnityWebRequest(String.Format("{0}:{1}/createRoom", DotEnv.serverIp, DotEnv.serverPort), "POST");
        byte[] jsonToSend = System.Text.Encoding.UTF8.GetBytes("{\"game\": \"factorfable\"}");
        req.uploadHandler = (UploadHandler)new UploadHandlerRaw(jsonToSend);
        req.downloadHandler = (DownloadHandler)new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        UnityWebRequestAsyncOperation operation = req.SendWebRequest();

        while(!operation.isDone){}

        if(req.result == UnityWebRequest.Result.ConnectionError){
            Debug.Log("Error while sending: " + req.error);
        }else{
            room = GameRoom.CreateFromJSON(req.downloadHandler.text);

            ws = await createWS(String.Format("wss://{0}:{1}/unity", room._ip, room._port), wsDelegate);
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
        // game logic (timers)
        if((gameState & FactOrFableState.Started) != 0){ // game has started
            if((gameState & FactOrFableState.Writing) != 0){ // users are writing
                if(writeTime >= resetWriteTime){
                    SendWSMessage("0fact"); //"toggle-fact"
                }
                writeTime -= Time.deltaTime;
                writeTimer.GetComponent<TMP_Text>().text = Math.Ceiling(writeTime).ToString("0");
                if(writeTime <= 0){
                    SendWSMessage("0fact");
                    ResetWriting();
                }
            }else if((gameState & FactOrFableState.Voting) != 0){ // users are voting
                if(voteTime >= resetVoteTime){
                    SendWSMessage("1vote"); //"clear-vote"
                    SendWSMessage("0vote");
                    if(currentRound == 3){
                        SendWSMessage("42");
                    }
                    var currentFact = "";
                    if(facts.Count > 0){
                        currentFact = facts.Pop();
                    }
                    SendWSMessage("2"+currentFact);
                    SendWSMessage("3fact");
                }
                voteTime -= Time.deltaTime;
                voteTimer.GetComponent<TMP_Text>().text = Math.Ceiling(Math.Max(voteTime, 0)).ToString("0");
                if(voteTime <= 0){
                    if(answerTime >= resetAnswerTime){
                        SendWSMessage("6");
                        SendWSMessage("0vote");
                    }
                    answerTime -= Time.deltaTime;
                    if(answerTime <= 0){
                        ResetVoting(facts.Count == 0);
                    }
                }
            }else if((gameState & FactOrFableState.Points) != 0){ // showing points to users
                if(pointTime >= resetPointTime){
                    SendWSMessage("1fact");
                    SendWSMessage("5");
                }
                pointTime -= Time.deltaTime;
                if(pointTime <= 0){
                    if(currentRound == 3){
                        gameState &= ~FactOrFableState.Started; // end game
                    }
                    NextRound();
                }
            }
        }
    }

    private async void OnApplicationQuit()
    {
        SendWSMessage("8");
        if(ws != null){
            await ws.Close();
        }
    }

    void ResetWriting(){
        writeTime = resetWriteTime;
        gameState &= ~FactOrFableState.Writing; // remove writing flag
        gameState |= FactOrFableState.Voting; // add voting flag
        writePage.SetActive(false);
        votePage.SetActive(true);
    }

    void ResetVoting(bool isAllVoted){
        votesObj.SetActive(false);
        voteTime = resetVoteTime;
        answerTime = resetAnswerTime;
        if(isAllVoted){
            gameState &= ~FactOrFableState.Voting; // remove voting flag
            gameState |= FactOrFableState.Points; // add points flag
            votePage.SetActive(false);
            pointsPage.SetActive(true);
        }
    }

    void NextRound(){
        pointTime = resetPointTime;
        gameState &= ~FactOrFableState.Points; // remove point flag
        gameState |= FactOrFableState.Writing; // add writing flag
        if(currentRound < 3){
            pointsPage.SetActive(false);
            writePage.SetActive(true);
            currentRound++; // next round
        }
    }

    void WSCommunication(byte[] bytes){
        var msg = System.Text.Encoding.UTF8.GetString(bytes);
        Debug.Log(msg);
        // string[] command = msg.Split("-");
        string[] command = new string[3];
        command[0] = msg.Substring(0, 1);
        if(command[0] == "1" || command[0] == "2"){
            command[1] = msg.Substring(1, msg.Length-2);
            command[2] = msg.Substring(msg.Length-1);
        }else{
            command[1] = msg.Substring(1);
            command[2] = "";
        }
        switch(command[0]){
            case "0": //"wrote":
                facts.Push(command[1]);
                break;
            case "1": //"fact":
                if(command[1].Length > 0){
                    resetWriteTime = 45;
                    if(votePage.activeSelf){
                        factText.GetComponent<TMP_Text>().text = command[1];
                    }
                    if(command[2] == "1"){
                        votesObj.transform.GetChild(1).transform.GetChild(0).GetComponent<TMP_Text>().color = new Color(46/255f, 38/255f, 34/255f, 1);
                        votesObj.transform.GetChild(0).transform.GetChild(0).GetComponent<TMP_Text>().color = new Color(255/255f, 85/255f, 0, 1);
                    }else if(command[2] == "0"){
                        votesObj.transform.GetChild(1).transform.GetChild(0).GetComponent<TMP_Text>().color = new Color(255/255f, 85/255f, 0, 1);
                        votesObj.transform.GetChild(0).transform.GetChild(0).GetComponent<TMP_Text>().color = new Color(46/255f, 38/255f, 34/255f, 1);
                    }
                }else{
                    factText.GetComponent<TMP_Text>().text = "Parece que alguém aqui não quer brincar. Vamos tentar novamente, desta vez com 60 segundos.";
                    currentRound--;
                    resetWriteTime = 60;
                    writeTime = 60;
                    voteTime = 0;
                }

                break;
            case "2": //"username":
                if(loginPage.activeSelf){
                    picturesIndex--;
                    users[command[2]] = new GameUser(command[2], command[1], pictures[picturesIndex]);
                
                    GameObject user = Instantiate(userLoginPrefab, loginUsers.transform) as GameObject;
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
            case "3": //"points":
                if(pointsPage.activeSelf){
                    foreach(Transform child in pointsUsers.transform){
                        GameObject.Destroy(child.gameObject);
                    }

                    Dictionary<string, int> points = JsonConvert.DeserializeObject<Dictionary<string, int>>(command[1]);
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

                    range = max-min;

                    Dictionary<string, float> normalizedPoints = new Dictionary<string, float>();
                    foreach(KeyValuePair<string, int> pointPair in points){
                        normalizedPoints[pointPair.Key] = (range > 0) ? (pointPair.Value-min)/(float)range : (pointPair.Value-min);
                    }

                    foreach(KeyValuePair<string, GameUser> userPair in users){
                        GameUser user = userPair.Value;
                        GameObject userObj = Instantiate(userPointPrefab, pointsUsers.transform) as GameObject;
                        
                        int userIdx = int.Parse(user.picture.Split('_')[1]);
                        Sprite sprite = Resources.LoadAll<Sprite>("Sprites/UserIcons")[userIdx];
                        userObj.transform.GetChild(0).gameObject.GetComponent<RawImage>().texture = sprite.texture;
                        userObj.transform.GetChild(0).gameObject.GetComponent<RawImage>().uvRect = new Rect(
                            sprite.textureRect.x / sprite.texture.width,
                            sprite.textureRect.y / sprite.texture.height,
                            sprite.textureRect.width / sprite.texture.width,
                            sprite.textureRect.height / sprite.texture.height
                        );
                        userObj.transform.GetChild(1).gameObject.GetComponent<TMP_Text>().text = user.username;
                        
                        GameObject slider = userObj.transform.GetChild(2).gameObject;
                        slider.GetComponent<Slider>().value = normalizedPoints[user.id]+0.25f;
                        slider.transform.GetChild(0).transform.GetChild(0).transform.GetChild(0).gameObject.GetComponent<TMP_Text>().text = points[user.id].ToString();
                    }
                }
                break;
            case "4"://"votes":
                if(votePage.activeSelf && resetWriteTime < 59){
                    foreach(Transform child in votesObj.transform.GetChild(0).transform.GetChild(1).transform){
                        GameObject.Destroy(child.gameObject);
                    }
                    foreach(Transform child in votesObj.transform.GetChild(1).transform.GetChild(1).transform){
                        GameObject.Destroy(child.gameObject);
                    }

                    votesObj.SetActive(true);
                    Dictionary<int, bool> votes = JsonConvert.DeserializeObject<Dictionary<int, bool>>(command[1]);

                    foreach(KeyValuePair<int, bool> vote in votes){
                        GameObject voteImg = new GameObject(String.Format("User{0}", vote.Key), typeof(RawImage));
                        int userIdx = int.Parse(users[vote.Key.ToString()].picture.Split('_')[1]);
                        Sprite sprite = Resources.LoadAll<Sprite>("Sprites/UserIcons")[userIdx];
                        voteImg.GetComponent<RawImage>().texture = sprite.texture;
                        voteImg.GetComponent<RawImage>().uvRect = new Rect(
                            sprite.textureRect.x / sprite.texture.width,
                            sprite.textureRect.y / sprite.texture.height,
                            sprite.textureRect.width / sprite.texture.width,
                            sprite.textureRect.height / sprite.texture.height
                        );
                        int child = (vote.Value) ? 0 : 1;
                        voteImg.transform.SetParent(votesObj.transform.GetChild(child).transform.GetChild(1).transform);
                    }
                }
                break;
            case "5": //"started":
                gameState |= FactOrFableState.Started; // set started flag
                gameState |= FactOrFableState.Writing; // set writing flag
                loginPage.SetActive(false);
                writePage.SetActive(true);
                break;
            case "6": //"finished":
                switch(command[1]){
                    case "write":
                        writeTime = 0;
                        break;
                    case "vote":
                        voteTime = 0;
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }
}
