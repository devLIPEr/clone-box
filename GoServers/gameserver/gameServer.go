package gameserver

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
)

type WebsocketCallback func(string, *GameServer, map[string]any)

// websocket upgrader
var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type GameServer struct {
	// Game variables
	MinPlayers int
	MaxPlayers int
	NumPlayers int

	// Server variables
	RouteMap    map[string]bool
	UsernameMap map[string]string
	PointsMap   map[string]int
	Server      *http.Server
	Mux         *http.ServeMux

	// Users connections
	UnityWS   *websocket.Conn
	UnityIP   string
	UnityFunc WebsocketCallback

	UsersWS   map[string]*websocket.Conn
	UsersIP   map[string]string
	UsersFunc WebsocketCallback
}

func (server *GameServer) UnityWebSocket(w http.ResponseWriter, r *http.Request) {
	if server.RouteMap["unity"] {
		ws, err := Upgrader.Upgrade(w, r, nil)
		// if unityWS == nil {
		server.UnityWS = ws
		// }
		if err != nil {
			log.Print("Unity ")
			log.Print(err)
			return
		}
		defer server.UnityWS.Close()
		for {
			_, message, err := server.UnityWS.ReadMessage()
			if err != nil {
				log.Print("Unity Message ")
				log.Print(err)
				break
			}

			// command := strings.Split(string(message), "-")
			msg := string(message)
			params := make(map[string]any)
			server.UnityFunc(msg, server, params)
		}
	}
}

func (server *GameServer) UserWebSocket(w http.ResponseWriter, r *http.Request) {
	if server.RouteMap["user"] {
		id := r.URL.Query().Get("id")
		username := r.URL.Query().Get("username")
		intId, _ := strconv.Atoi(id)
		if id != "" && intId < server.MaxPlayers {
			ws, err := Upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Print("User ")
				log.Print(err)
				return
			}

			_, exists := server.UsersWS[id]
			server.UsersWS[id] = ws
			if !exists {
				server.NumPlayers++
				server.UsernameMap[id] = username
				err = server.UnityWS.WriteMessage(websocket.TextMessage, []byte("2"+username+id))
				if err != nil {
					log.Print("Send to Unity Message ")
					log.Print(err)
				}
				var reqPlayers = server.MinPlayers - server.NumPlayers
				var message = "1"
				if reqPlayers > 0 {
					if reqPlayers == 1 {
						message += "Mais 1 jogador necessário"
					} else {
						message += fmt.Sprintf("Mais %d jogadores necessários", reqPlayers)
					}
				}
				server.UsersWS["0"].WriteMessage(websocket.TextMessage, []byte(message))
				server.PointsMap[id] = 0
			}

			defer server.UsersWS[id].Close()
			for {
				_, message, err := server.UsersWS[id].ReadMessage()
				if err != nil {
					log.Print("User Message ")
					log.Print(err)
					break
				}

				// command := strings.Split(string(message), "-")
				msg := string(message)
				params := make(map[string]any)
				params["id"] = id
				server.UsersFunc(msg, server, params)
			}
		}
	}
}

func (server *GameServer) ToggleRoute(route string) {
	server.RouteMap[route] = !server.RouteMap[route]
}

func (server *GameServer) AddRoute(route string, function func(http.ResponseWriter, *http.Request)) {
	_, exists := server.RouteMap[route]
	if !exists {
		server.Mux.HandleFunc("/"+route, function)
		server.RouteMap[route] = false
	}
}

func (server *GameServer) PingPong(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if server.RouteMap["ping"] {
		// Allow only get methods
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		w.Write([]byte("pong"))
	}
}
