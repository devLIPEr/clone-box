package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const POINTS_AWARDED = 500

var minPlayers = 0
var numPlayers = 0
var maxPlayers = 0

// websocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Struct for a Fact
type FactRequest struct {
	Id     int    `json:"id"`
	Fact   string `json:"fact"`
	Answer bool   `json:"answer"`
}

// Struct for a Vote
type VoteRequest struct {
	Id     int  `json:"id"`
	Answer bool `json:"answer"`
}

// Global route map
var routeMap = make(map[string]bool)

// Toggle map value for given route
func toggleRoute(route string) {
	routeMap[route] = !routeMap[route]
}

// Add a handler function to a route in sever and add it to a map
// which takes cares of blocking/accepting requests to given route
func addRoute(route string, function func(w http.ResponseWriter, r *http.Request)) {
	_, exists := routeMap[route]
	if !exists {
		http.HandleFunc("/"+route, function)
		routeMap[route] = false
	}
}

// User facts
var userFactsMap = make(map[int]FactRequest)
var currFact int = -1
var pointsMultiplier = 1

// User votes
var votingMap = make(map[int]bool)

// User points
var pointsMap = make(map[string]int)

// User names
var usernameMap = make(map[string]string)

// Function to reset userFactsMap
func resetUserFactsMap() {
	userFactsMap = make(map[int]FactRequest)
}

// Function to reset votingMap
func resetVotingMap() {
	votingMap = make(map[int]bool)
}

// Test function
func pingPong(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if routeMap["ping"] {
		// Allow only get methods
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		w.Write([]byte("pong"))
	}
}

// Based on https://stackoverflow.com/questions/15672556/handling-json-post-request-in-go
// Function to process player's facts.
// fact POST handler
func receiveFacts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if routeMap["fact"] {
		// Allow only post methods
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var req FactRequest
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		err := decoder.Decode(&req)
		if err != nil {
			log.Print("Could not decode request body!")
		}

		// Check if user already sent an answer
		_, exists := userFactsMap[req.Id]
		if !exists {
			userFactsMap[req.Id] = req
			w.WriteHeader(http.StatusOK)
			err = unityWS.WriteMessage(websocket.TextMessage, []byte("0"+strconv.Itoa(req.Id)))
			if err != nil {
				log.Print(err)
			}
			if len(userFactsMap) == numPlayers {
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("6write"))
				if err != nil {
					log.Print(err)
				}
			}
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
	}
}

// Function to process player's votes to current fact.
// vote POST handler
func voteFact(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if routeMap["vote"] {
		// Allow only post methods
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var req VoteRequest
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		err := decoder.Decode(&req)
		if err != nil {
			log.Print("Could not decode request body!")
		}

		_, existsVote := votingMap[req.Id]
		_, existsUser := usernameMap[strconv.Itoa(req.Id)] // limits only to players logged in
		if !existsVote && existsUser && req.Id != currFact {
			fmt.Printf("User: %d voted %t\n", req.Id, req.Answer)
			votingMap[req.Id] = req.Answer
			if req.Answer == userFactsMap[currFact].Answer {
				pointsMap[strconv.Itoa(req.Id)] += POINTS_AWARDED * pointsMultiplier
			} else {
				pointsMap[strconv.Itoa(currFact)] += POINTS_AWARDED * pointsMultiplier
			}
			w.WriteHeader(http.StatusOK)
			if len(votingMap)+1 == numPlayers {
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("6vote"))
				if err != nil {
					log.Print(err)
				}
			}
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
	}
}

// unity websocket
var unityWS *websocket.Conn = nil

// user's websocket
var usersWS = make(map[string]*websocket.Conn)

// Function to send fact to all users
func sendFactsToUsers() {
	for key, ws := range usersWS {
		intKey, _ := strconv.Atoi(key)
		if intKey != currFact {
			err := ws.WriteMessage(websocket.TextMessage, []byte("0"+userFactsMap[currFact].Fact))
			if err != nil {
				log.Print(err)
			}
		}
	}
}

/*
	 unity websocket handler
	 	 client
			0 - wrote
			1 - fact
			2 - username
			3 - points
			4 - votes
			5 - started
			6 - finished
			7 - names
			8 - pong
		 server
			0 - toggle
			1 - clear
			2 - fact
			3 - send
			4 - multiplier
			5 - point
			6 - votes
			7 - name
			8 - finished
			9 - ping
*/
func unityWebSocket(w http.ResponseWriter, r *http.Request) {
	if routeMap["unity"] {
		ws, err := upgrader.Upgrade(w, r, nil)
		// if unityWS == nil {
		unityWS = ws
		// }
		if err != nil {
			log.Print("Unity ")
			log.Print(err)
			return
		}
		defer unityWS.Close()
		for {
			_, message, err := unityWS.ReadMessage()
			if err != nil {
				log.Print("Unity Message ")
				log.Print(err)
				break
			}

			// command := strings.Split(string(message), "-")
			msg := string(message)
			var command [2]string
			command[0] = msg[0:1]
			command[1] = msg[1:]

			switch command[0] {
			case "0": //"toggle":
				toggleRoute(command[1])
				if command[1] == "fact" {
					var enabled = "0"
					if routeMap["fact"] {
						enabled = "1"
					}
					for _, ws := range usersWS {
						err := ws.WriteMessage(websocket.TextMessage, []byte("2"+enabled))
						if err != nil {
							log.Print(err)
						}
					}
				}
			case "1": //"clear":
				switch command[1] {
				case "fact":
					resetUserFactsMap()
				case "vote":
					resetVotingMap()
				}
			case "2": //"fact":
				x, _ := strconv.Atoi(command[1])
				currFact = x
				var answer = "0"
				if userFactsMap[currFact].Answer {
					answer = "1"
				}
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("1"+userFactsMap[currFact].Fact+answer))
				if err != nil {
					log.Print(err)
				}
			case "3": //"send":
				switch command[1] {
				case "fact":
					sendFactsToUsers()
				}
			case "4": //"multiplier":
				multiplier, _ := strconv.Atoi(command[1])
				pointsMultiplier = multiplier
			case "5": //"point":
				jsonString, err := json.Marshal(pointsMap)
				if err != nil {
					log.Print(err)
				}
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("3"+string(jsonString)))
				if err != nil {
					log.Print(err)
				}
			case "6": //"votes":
				jsonString, err := json.Marshal(votingMap)
				if err != nil {
					log.Print(err)
				}
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("4"+string(jsonString)))
				if err != nil {
					log.Print(err)
				}
			case "7": //"name":
				jsonString, err := json.Marshal(usernameMap)
				if err != nil {
					log.Print(err)
				}
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("7"+string(jsonString)))
				if err != nil {
					log.Print(err)
				}
			case "8": //"finished":
				for _, ws := range usersWS {
					err = ws.WriteMessage(websocket.TextMessage, []byte("4"))
					if err != nil {
						log.Print(err)
					}
				}
				time.Sleep(2 * time.Second)
				if err := server.Shutdown(context.Background()); err != nil {
					panic(err) // failure/timeout shutting down the server gracefully
				}
			case "9": //"ping":
				fmt.Print("pong")
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("8"))
				if err != nil {
					log.Print(err)
				}
			}
		}
	}
}

/*
	 users websocket handler
	 	 client
			0 - fact
			1 - players
			2 - write
			3 - started
			4 - end
		 server
		 	0 - start
*/
func userWebSocket(w http.ResponseWriter, r *http.Request) {
	if routeMap["user"] {
		id := r.URL.Query().Get("id")
		username := r.URL.Query().Get("username")
		intId, _ := strconv.Atoi(id)
		if id != "" && intId < maxPlayers {
			ws, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Print("User ")
				log.Print(err)
				return
			}

			_, exists := usersWS[id]
			usersWS[id] = ws
			if !exists {
				numPlayers++
				usernameMap[id] = username
				err = unityWS.WriteMessage(websocket.TextMessage, []byte("2"+username+id))
				if err != nil {
					log.Print("Send to Unity Message ")
					log.Print(err)
				}
				var reqPlayers = minPlayers - numPlayers
				var message = "1"
				if reqPlayers > 0 {
					if reqPlayers == 1 {
						message += "Mais 1 jogador necessário"
					} else {
						message += fmt.Sprintf("Mais %d jogadores necessários", reqPlayers)
					}
				}
				usersWS["0"].WriteMessage(websocket.TextMessage, []byte(message))
			}
			pointsMap[id] = 0

			defer usersWS[id].Close()
			for {
				_, message, err := usersWS[id].ReadMessage()
				if err != nil {
					log.Print("User Message ")
					log.Print(err)
					break
				}

				// command := strings.Split(string(message), "-")
				msg := string(message[0:1])
				var command [2]string
				command[0] = msg[0:1]
				command[1] = msg[1:]

				switch command[0] {
				case "0": //"start":
					if id == "0" && numPlayers >= minPlayers { // only the host player can start the game and needs at least minPlayers
						fmt.Println("Game started")
						err := unityWS.WriteMessage(websocket.TextMessage, []byte("5"))
						if err != nil {
							log.Print("Send to Unity Message ")
							log.Print(err)
						}
						for _, ws := range usersWS {
							err = ws.WriteMessage(websocket.TextMessage, []byte("3"))
							if err != nil {
								log.Print("Send to User Message ")
								log.Print(err)
							}
						}
					}
				}
			}
		}
	}
}

var server http.Server

// main function
func main() {
	var port string = ":" + os.Args[1]

	minPlayersArg, _ := strconv.Atoi(os.Args[2])
	minPlayers = minPlayersArg

	maxPlayersArg, _ := strconv.Atoi(os.Args[3])
	maxPlayers = maxPlayersArg
	fmt.Printf("FactOrFable running on port %s\n", port)

	httpServerExitDone := &sync.WaitGroup{}

	httpServerExitDone.Add(1)

	server = http.Server{
		Addr: port,
	}

	// http post routes
	addRoute("fact", receiveFacts)
	addRoute("vote", voteFact)

	// websockets routes
	addRoute("unity", unityWebSocket)
	toggleRoute("unity")

	addRoute("user", userWebSocket)
	toggleRoute("user")

	addRoute("ping", pingPong)
	toggleRoute("ping")

	log.Fatalln(server.ListenAndServe())

	// wait for goroutine started in startHttpServer() to stop
	httpServerExitDone.Wait()

	fmt.Print("Game Finished")
}
