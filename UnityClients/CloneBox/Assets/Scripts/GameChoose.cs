using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameChoose : MonoBehaviour
{
    [SerializeField]
    public GameObject loadingObj;

    public void GoToScene(string sceneName){
        loadingObj.SetActive(true);
        SceneManager.LoadScene(sceneName);
    }
}
