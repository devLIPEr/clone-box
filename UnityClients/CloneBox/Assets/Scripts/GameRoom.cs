using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class GameRoom
{
    public int _currPlayers;
    public string _game;
    public string _code;
    public string _ip;
    public int _port;
    public int _minPlayers;
    public int _maxPlayers;
    public bool _started;

    public static GameRoom CreateFromJSON(string jsonString)
    {
        return JsonUtility.FromJson<GameRoom>(jsonString);
    }
}
