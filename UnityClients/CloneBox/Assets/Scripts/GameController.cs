using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using NativeWebSocket;
using System.Threading.Tasks;
using TMPro;
using System;

public class GameController : MonoBehaviour
{
    protected bool finished = false;

    // Game interfaces
    [SerializeField]
    protected GameObject connectPage;

    [SerializeField]
    protected GameObject loginPage;
    [SerializeField]
    protected RawImage QRCodeImg;
    [SerializeField]
    protected GameObject codeText;


    // User variables
    protected string[] pictures = new string[10];
    protected int picturesIndex = 10;
    

    // Room
    protected GameRoom room;


    // Communication variables
    public WebSocket ws;
    public delegate void WSDelegate(byte[] bytes);
    public WSDelegate wsDelegate;

    // shuffle user pictures
    protected void ShufflePictures(){
        var rng = new System.Random();
        int n = pictures.Length;
        while(n > 1){
            int k = rng.Next(n--);
            (pictures[n], pictures[k]) = (pictures[k], pictures[n]);
        }
    }

    protected async Task<WebSocket> createWS(string url, WSDelegate onMessage){
        Debug.Log(url);
        // setup websocket with _ip, _port
        ws = new WebSocket(url);

        ws.OnOpen += () => {
            Debug.Log("Connection open!");

            if(ws != null && !room._started){
                QRCodeImg.GetComponent<RawImage>().texture = QRCodeGenerator.GenerateBarcode(DotEnv.serverIp, 200, 200);
                codeText.GetComponent<TMP_Text>().text = room._code;

                connectPage.SetActive(false);
                loginPage.SetActive(true);
            }
        };

        ws.OnError += (e) => {
            Debug.Log("Error! " + e);
        };

        ws.OnClose += async (e) => {
            Debug.Log("Connection closed!");
            if(!finished){
                await Reconnect(); // reconnect WS
            }
        };

        ws.OnMessage += (bytes) => onMessage(bytes);

        await ws.Connect();
        return ws;
    }

    protected async void SendWSMessage(string msg){
        if(ws != null && ws.State == WebSocketState.Open){
            await ws.SendText(msg);
        }
    }

    async Task Reconnect(){
        await Task.Delay(500); // wait 500ms to try and reconnect
        await ws.Connect(); // reconnect
    }
}
