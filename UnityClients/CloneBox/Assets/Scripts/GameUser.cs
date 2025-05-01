using System.Collections;
using System.Collections.Generic;

[System.Serializable]
public class GameUser
{
    public string id;
    public string username;
    public string picture;

    public GameUser(string id, string username, string picture){
        this.id = id;
        this.username = username;
        this.picture = picture;
    }
}
