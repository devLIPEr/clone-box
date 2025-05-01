package main

import (
	"GoServers/gameserver"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

var PlayedCards map[string]string = make(map[string]string)
var PlayersCards map[string][]string = make(map[string][]string)
var Deck []string
var DrawOrder []int

func searchArr[T comparable](arr []T, val T) bool {
	for _, a := range arr {
		if a == val {
			return true
		}
	}
	return false
}
func searchArrWithArr[T comparable](arr []T, val []T) bool {
	for _, b := range val {
		if !searchArr(arr, b) {
			return false
		}
	}
	return true
}

/*
	  client
		0 - started
		1 - getPlayed
		2 - username
		3 - points
		4 - finished
		5 - pong
	  server
		0 - toggleRoute(route)
		1 - clear(state)
		2 - drawHands
		3 - getPlayed
		4 - getPoints
		5 - updatePoint(id, card)
		6 - finished
		7 - ping
*/
func unityWebSocket(msg string, server *gameserver.GameServer, params map[string]any) {
	var command [3]string
	command[0] = msg[0:1] // first byte

	switch command[0] {
	case "0":
		command[1] = msg[1:]
		server.ToggleRoute(command[1])
	case "1":
		command[1] = msg[1:]
		switch command[1] {
		case "hands":
			resetPlayersHands()
		case "played":
			resetPlayersPlayed()
		}
	case "2":
		DrawOrder = rand.Perm(36)
		for i := 0; i < len(server.UsernameMap); i++ {
			idStr := fmt.Sprintf("%d", i)
			PlayersCards[idStr] = make([]string, 3)
			for j := 0; j < 3; j++ {
				PlayersCards[idStr][j] = Deck[DrawOrder[i*3+j]]
			}
		}
		for id, ws := range server.UsersWS {
			err := ws.WriteMessage(websocket.TextMessage, []byte(
				fmt.Sprintf("2%s%s%s", PlayersCards[id][0], PlayersCards[id][1], PlayersCards[id][2]),
			))
			if err != nil {
				log.Print(err)
			}
		}
	case "3":
		if len(PlayedCards) < len(server.UsernameMap) {
			for id, ws := range server.UsersWS {
				_, exists := PlayedCards[id]
				if !exists {
					r1 := rand.Intn(3)
					r2 := rand.Intn(3)
					for r1 == r2 {
						r2 = rand.Intn(3)
					}
					ntPoints := 0
					if PlayersCards[id][r1] == "2" {
						ntPoints++
					}
					if PlayersCards[id][r2] == "2" {
						ntPoints++
					}
					err := ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("6%d", ntPoints)))
					if err != nil {
						log.Print(err)
					}
					PlayedCards[id] = PlayersCards[id][r1] + PlayersCards[id][r2]
				}
			}
		}
		jsonString, err := json.Marshal(PlayedCards)
		if err != nil {
			log.Print(err)
		}
		err = server.UnityWS.WriteMessage(websocket.TextMessage, []byte("1"+string(jsonString)))
		if err != nil {
			log.Print(err)
		}
	case "4":
		jsonString, err := json.Marshal(server.PointsMap)
		if err != nil {
			log.Print(err)
		}
		err = server.UnityWS.WriteMessage(websocket.TextMessage, []byte("3"+string(jsonString)))
		if err != nil {
			log.Print(err)
		}
	case "5":
		command[1] = msg[1:2]
		command[2] = msg[2:]
		cardPlayed, _ := strconv.Atoi(command[2])
		fmt.Printf("User %s cards %d: %v\n", command[1], cardPlayed, PlayedCards[command[1]])
		if cardPlayed == -1 {
			cardsEffects("3", 0, "", server)
		} else if command[1] != "e" && searchArrWithArr(strings.Split(PlayedCards[command[1]], ""), []string{string(PlayedCards[command[1]][0]), string(PlayedCards[command[1]][1])}) {
			cardsEffects(string(PlayedCards[command[1]][cardPlayed]), 1, command[1], server)
		}
		if command[1] != "e" {
			err := server.UsersWS[command[1]].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[command[1]])))
			if err != nil {
				log.Print(err)
			}
		}
	case "6":
		for _, ws := range server.UsersWS {
			err := ws.WriteMessage(websocket.TextMessage, []byte("5"))
			if err != nil {
				log.Print(err)
			}
		}
	case "7":
		err := server.UnityWS.WriteMessage(websocket.TextMessage, []byte("5"))
		if err != nil {
			log.Print(err)
		}
	}
}

/*
	  client
		0 - started
		1 - players
		2 - getCards
		3 - playCards
		4 - points
		5 - end
		6 - playRandom
		7 - pong
	  server
		0 - start
		1 - getCards
		2 - playCards
		3 - getPoints
		4 - ping
		5 - getStart
*/
func usersWebSocket(msg string, server *gameserver.GameServer, params map[string]any) {
	var command [3]string
	command[0] = msg[0:1]
	idString := fmt.Sprintf("%v", params["id"])

	switch command[0] {
	case "0":
		if server.NumPlayers >= server.MinPlayers && idString == "0" {
			NextTurnPointsSub = []int{0, 0}
			fmt.Println("Game started")
			err := server.UnityWS.WriteMessage(websocket.TextMessage, []byte("0"))
			if err != nil {
				log.Print(("Send to Unity Message"))
				log.Print(err)
			}
			for _, ws := range server.UsersWS {
				err = ws.WriteMessage(websocket.TextMessage, []byte("0"))
				if err != nil {
					log.Print("Send to User Message")
					log.Print(err)
				}
			}
		}
	case "1":
		err := server.UsersWS[idString].WriteMessage(websocket.TextMessage, []byte(
			fmt.Sprintf("2%s%s%s", PlayersCards[idString][0], PlayersCards[idString][1], PlayersCards[idString][2]),
		))
		if err != nil {
			log.Print("Send to User Message")
			log.Print(err)
		}
	case "2":
		if len(msg) == 3 {
			command[1] = msg[1:2]
			command[2] = msg[2:3]
			if (command[1] >= "0" && command[1] < "8") && (command[2] >= "0" && command[2] < "8") {
				PlayedCards[idString] = msg[1:3]
				if len(PlayedCards) == len(server.UsernameMap) {
					err := server.UnityWS.WriteMessage(websocket.TextMessage, []byte("4"))
					if err != nil {
						log.Print("Send to User Message")
						log.Print(err)
					}
				}
				err := server.UsersWS[idString].WriteMessage(websocket.TextMessage, []byte("3"))
				if err != nil {
					log.Print("Send to User Message")
					log.Print(err)
				}
			} else {
				err := server.UsersWS[idString].WriteMessage(websocket.TextMessage, []byte("3Cards played are invalid"))
				if err != nil {
					log.Print("Send to User Message")
					log.Print(err)
				}
			}
		} else {
			err := server.UsersWS[idString].WriteMessage(websocket.TextMessage, []byte("3Tried to play not enough cards"))
			if err != nil {
				log.Print("Send to User Message")
				log.Print(err)
			}
		}
	case "3":
		err := server.UsersWS[idString].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[idString])))
		if err != nil {
			log.Print("Send to User Message")
			log.Print(err)
		}
	case "4":
		err := server.UsersWS[idString].WriteMessage(websocket.TextMessage, []byte("7"))
		if err != nil {
			log.Print("Send to User Message")
			log.Print(err)
		}
	case "5":
		var reqPlayers = server.MinPlayers - server.NumPlayers
		var message = "1"
		if reqPlayers > 0 {
			if reqPlayers == 1 {
				message += "Mais 1 jogador necessário"
			} else {
				message += fmt.Sprintf("Mais %d jogadores necessários", reqPlayers)
			}
		}
		err := server.UsersWS["0"].WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			log.Print("Send to User Message")
			log.Print(err)
		}
	}
}

func resetPlayersHands() {
	PlayersCards = make(map[string][]string)
}

func resetPlayersPlayed() {
	PlayedCards = make(map[string]string)
}

func fillDeck() {
	numCards := [8]int{10, 8, 2, 4, 3, 3, 3, 3}
	Deck = make([]string, 36)
	k := 0
	for i := 0; i < 8; i++ {
		for j := 0; j < numCards[i]; j++ {
			Deck[k] = fmt.Sprintf("%d", i)
			k++
		}
	}
}

var NextTurnPointsSub []int = []int{0, 0}

/*
	  cards
		0 - +1
		1 - +2
		2 - +3
		3 - -1 random next turn
		4 - +1 2 least
		5 - -1 2 most
		6 - swap your random
		7 - swap 2 randoms
*/
func cardsEffects(card string, timesPlayed int, playerId string, server *gameserver.GameServer) {
	switch card {
	case "0":
		server.PointsMap[playerId]++
	case "1":
		server.PointsMap[playerId] += 2
	case "2":
		server.PointsMap[playerId] += 3
	case "3":
		if timesPlayed > 0 {
			NextTurnPointsSub[1]++
		} else {
			for range NextTurnPointsSub[0] {
				randomPlayer := rand.Intn(len(server.UsernameMap))
				randomId := fmt.Sprintf("%d", randomPlayer)
				server.PointsMap[randomId]--
				server.PointsMap[randomId] = max(server.PointsMap[randomId], 0)
				err := server.UsersWS[randomId].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[randomId])))
				if err != nil {
					log.Print(err)
				}
			}
			NextTurnPointsSub[0] = NextTurnPointsSub[1]
			NextTurnPointsSub[1] = 0
		}
	case "4":
		minId1 := ""
		min1 := 100000
		minId2 := ""
		min2 := 100000
		for id, points := range server.PointsMap {
			if points < min1 {
				if min1 < min2 {
					min2 = min1
					minId2 = minId1
				}
				min1 = points
				minId1 = id
			} else if points < min2 {
				if min2 < min1 {
					min1 = min2
					minId1 = minId2
				}
				min2 = points
				minId2 = id
			}
		}
		server.PointsMap[minId1]++
		server.PointsMap[minId2]++

		err := server.UsersWS[minId1].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[minId1])))
		if err != nil {
			log.Print(err)
		}
		err = server.UsersWS[minId2].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[minId2])))
		if err != nil {
			log.Print(err)
		}
	case "5":
		maxId1 := ""
		max1 := 0
		maxId2 := ""
		max2 := 0
		for id, points := range server.PointsMap {
			if points > max1 {
				if max1 > max2 {
					max2 = max1
					maxId2 = maxId1
				}
				max1 = points
				maxId1 = id
			} else if points > max2 {
				if max2 > max1 {
					max1 = max2
					maxId1 = maxId2
				}
				max2 = points
				maxId2 = id
			}
		}
		server.PointsMap[maxId1]--
		server.PointsMap[maxId2]--
		server.PointsMap[maxId1] = max(server.PointsMap[maxId1], 0)
		server.PointsMap[maxId2] = max(server.PointsMap[maxId2], 0)

		err := server.UsersWS[maxId1].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[maxId1])))
		if err != nil {
			log.Print(err)
		}
		err = server.UsersWS[maxId2].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[maxId2])))
		if err != nil {
			log.Print(err)
		}
	case "6":
		p1 := playerId
		p2 := fmt.Sprintf("%d", rand.Intn(len(server.UsernameMap)))
		for {
			if p1 != p2 {
				break
			}
			p2 = fmt.Sprintf("%d", rand.Intn(len(server.UsernameMap)))
		}

		server.PointsMap[p1], server.PointsMap[p2] = server.PointsMap[p2], server.PointsMap[p1]
		err := server.UsersWS[p2].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[p2])))
		if err != nil {
			log.Print(err)
		}
	case "7":
		p1 := fmt.Sprintf("%d", rand.Intn(len(server.UsernameMap)))
		p2 := fmt.Sprintf("%d", rand.Intn(len(server.UsernameMap)))
		for {
			if p1 != p2 {
				break
			}
			p2 = fmt.Sprintf("%d", rand.Intn(len(server.UsernameMap)))
		}

		server.PointsMap[p1], server.PointsMap[p2] = server.PointsMap[p2], server.PointsMap[p1]
		err := server.UsersWS[p1].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[p1])))
		if err != nil {
			log.Print(err)
		}
		err = server.UsersWS[p2].WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("4%d", server.PointsMap[p2])))
		if err != nil {
			log.Print(err)
		}
	}
}

func main() {
	var unityWS gameserver.WebsocketCallback = unityWebSocket
	var usersWS gameserver.WebsocketCallback = usersWebSocket
	var port string = ":" + os.Args[1]
	var gameServer gameserver.GameServer = gameserver.GameServer{
		RouteMap:    make(map[string]bool),
		UsernameMap: make(map[string]string),
		PointsMap:   make(map[string]int),
		UnityWS:     nil,
		UnityIP:     "",
		UnityFunc:   unityWS,
		UsersWS:     make(map[string]*websocket.Conn),
		UsersIP:     make(map[string]string),
		UsersFunc:   usersWS,
	}

	minPlayersArg, _ := strconv.Atoi(os.Args[2])
	gameServer.MinPlayers = minPlayersArg

	maxPlayersArg, _ := strconv.Atoi(os.Args[3])
	gameServer.MaxPlayers = maxPlayersArg
	fmt.Printf("MinPlus running on port %s\n", port)

	httpServerExitDone := &sync.WaitGroup{}

	httpServerExitDone.Add(1)

	gameServer.Mux = http.NewServeMux()
	gameServer.Server = &http.Server{
		Addr:    port,
		Handler: gameServer.Mux,
	}

	// websockets routes
	gameServer.AddRoute("unity", func(w http.ResponseWriter, r *http.Request) {
		gameServer.UnityWebSocket(w, r)
	})
	gameServer.ToggleRoute("unity")

	gameServer.AddRoute("user", func(w http.ResponseWriter, r *http.Request) {
		gameServer.UserWebSocket(w, r)
	})
	gameServer.ToggleRoute("user")

	gameServer.AddRoute("ping", gameServer.PingPong)
	gameServer.ToggleRoute("ping")

	fillDeck()

	log.Fatalln(gameServer.Server.ListenAndServe())
	// log.Fatalln(server.ListenAndServeTLS(dir+"\\cert.pem", dir+"\\key.pem"))

	// wait for goroutine started in startHttpServer() to stop
	httpServerExitDone.Wait()

	fmt.Print("Game Finished")
}
