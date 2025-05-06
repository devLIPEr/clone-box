using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class ExitGame : MonoBehaviour
{
    [SerializeField]
    private bool isMainScene;

    public void Exit(){
        if(isMainScene){
            Application.Quit();
        }else{
            SceneManager.LoadScene("GameChoose");
        }
    }
}
