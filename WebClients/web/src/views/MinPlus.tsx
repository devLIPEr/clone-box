import { Component, createEffect, createSignal, For, Show } from "solid-js";
import Header from "../components/GameHeader";
import Start from "../components/GameStart";
import { useLocation, useNavigate } from "@solidjs/router";
import { createWS } from "@solid-primitives/websocket";
import Deck from "../components/minplus/cards/Deck";
import Hand from "../components/minplus/cards/Hand";
import Alert from "../components/Alert";

const MinPlus: Component = () => {
    const rawCardImages = import.meta.glob('/src/assets/imgs/cards/*.png', {
        eager: true,
        query: '?url',
        import: 'default',
    });

    const cardImages: Record<string, string> = {};
    Object.entries(rawCardImages).forEach(([key, value]) => {
        const fileName = key.split('/').pop()?.replace('.png', '') || '';
        cardImages[fileName] = value as string;
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { id, username, ip, port, gameState }: any = location.state || {};

    const [windowWidth, setWindowWidth] = createSignal(0);
    const [windowHeight, setWindowHeight] = createSignal(0);
    createEffect(() => setWindowWidth(window.innerWidth))
    createEffect(() => setWindowHeight(window.innerHeight))

    const [started, setStarted] = createSignal(gameState);

    const [alerts, setAlerts] = createSignal<Record<string, string>>({});
    const [cards, setCards] = createSignal(["", "", ""]);
    const [cardsSelected, setCardsSelected] = createSignal(["", ""]);
    const [points, setPoints] = createSignal("");

    var currGameState = sessionStorage.getItem("gameState");
    var minPlayersLogged: boolean = false;
    var ws = createWS(`ws://${ip}:${port}/user?id=${id}&username=${username}`);
    
    function checkLoadState(){
        console.log(currGameState);
        console.log(`ws://${ip}/user?id=${id}&username=${username}`);
        let sesPoints = sessionStorage.getItem("points");
        sesPoints = (sesPoints == null) ? "0" : sesPoints;
        let sessionPoints = parseInt((sesPoints) ? sesPoints : "00");
        setPoints((sessionPoints >= 10) ? sesPoints : "0"+sesPoints);
        switch(currGameState){
            case "PLAY":
                document.getElementById("numPlayers")?.parentElement?.classList.toggle("hidden");
                setStarted(true);
                let sesCards = sessionStorage.getItem("hand");
                let sessionCards: string = sesCards ? sesCards : "000";
                setCards(sessionCards.split(""));
                break;
            case "WAIT":
            case "STARTED":
                document.getElementById("numPlayers")?.parentElement?.classList.toggle("hidden");
                setStarted(true);
                break;
            case "LOGIN":
                ws.send("5");
                break;
        }
    }

    ws.addEventListener('close', () => {
        if(!sessionStorage.getItem("gameState")){
            ws = createWS(`ws://${ip}/user?id=${id}&username=${username}`);
        }
    });

    ws.addEventListener('open', () => {
        ws.send("5");
    });

    ws.addEventListener('message', (e: any) => {
        let command: string[] = [e.data.substring(0, 1), "", ""];
        switch(command[0]){
            case "0": // started
                currGameState = "STARTED";
                sessionStorage.setItem("gameState", "STARTED");
                setStarted(true);
                break;
            case "1": // players
                command[1] = e.data.substring(1);
                if(!started()){
                    currGameState = "LOGIN";
                    sessionStorage.setItem("gameState", "LOGIN");
                }
                try{
                    var numPlayersDoc: any = document.getElementById("numPlayers");
                    var startGameDoc: any = document.getElementById("startGame");
                    if(command[1].length > 0){
                        numPlayersDoc.innerText = command[1];
                        sessionStorage.setItem("playersNeeded", command[1]);
                    }else{
                        if(!minPlayersLogged){
                            sessionStorage.removeItem("playersNeeded");
                            numPlayersDoc.parentElement.classList.toggle("hidden");
                            startGameDoc.parentElement.classList.toggle("hidden");
                            minPlayersLogged = !minPlayersLogged;
                        }
                    }
                }catch(error){
                    ws.send("5");
                }
                break;
            case "2": // getCards
                command[1] = e.data.substring(1);
                console.log(e.data);
                setCards([command[1][0], command[1][1], command[1][2]]);
                sessionStorage.setItem("hand", command[1]);
                currGameState = "PLAY";
                sessionStorage.setItem("gameState", "PLAY");
                break;
            case "3": // playCards
                command[1] = e.data.substring(1);
                if(command[1].length > 0){
                    let d = { ...alerts() };
                    d["Cards invalid"] = "Cards played are invalid";
                    setAlerts(d);
                    delete d["Cards invalid"];
                    setAlerts(d);
                }else{
                    setCards(["", "", ""]);
                    currGameState = "STARTED";
                    sessionStorage.setItem("gameState", "STARTED");
                }
                break;
            case "4": // points
                command[1] = e.data.substring(1);
                console.log(command[1]);
                sessionStorage.setItem("points", command[1]);
                setPoints((parseInt(command[1]) >= 10) ? command[1] : "0"+command[1]);
                break;
            case "5": // end
                sessionStorage.removeItem("gameState");
                sessionStorage.removeItem("points");
                sessionStorage.removeItem("hand");
                sessionStorage.removeItem("currId");
                sessionStorage.removeItem("username");
                ws.close();
                navigate("/");
                break;
            case "6": // playRandom
                command[1] = e.data.substring(1, 1);
                let d = { ...alerts() };
                d["Time"] = "Two random cards were played due to inactivity";
                setAlerts(d);
                delete d["Time"];
                setAlerts(d);
                setCards(["", "", ""]);
                break;
            case "7": // ping
                console.log("ping");
                break;
        default:
                break;
        }
    });

    function playCards(){
        let cardsPlayed = cardsSelected();
        ws.send(`2${cardsPlayed[0]}${cardsPlayed[1]}`);
    }

    createEffect(() => checkLoadState());

    return (
        <div class="h-[100svh] flex flex-col items-center bg-radial to-minPlus-dark from-minPlus-secondary">
            <For each={Object.entries(alerts())}>
                {([key, value]) => (
                    <Alert message={value} title={key}></Alert>
                )}
            </For>
            <Header username={username} dark="#233745" light="#FFB343"/>
            <Show when={id === 0 && !started()}>
                <Start ws={ws} dark="#233745" secondary="#3C6987"/>
            </Show>
            <div class="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-80%] prevent-select">
                <p class="text-minPlus-primary text-9xl font-extrabold inline absolute translate-x-[-70%] translate-y-[-25%]">+</p>
                <p class="text-minPlus-primary text-9xl font-extrabold inline">/</p>
                <p class="text-minPlus-primary text-[10rem] font-extrabold inline absolute translate-x-[-40%] translate-y-[-15%]">-</p>
            </div>
            <Show when={started() && windowWidth() > 600 && windowHeight() > 500}>
                <div class="hover:cursor-default flex w-full justify-between items-center absolute top-[50%] translate-y-[-80%]">
                    <p id="points" class="text-customWhite text-9xl font-extrabold ml-[5%] translate-y-[-0.5rem]">{points()}</p>
                </div>
            </Show>
            
            <Show when={started() && windowWidth() <= 600 || windowHeight() <= 500}>
                <div class="hover:cursor-default flex w-full justify-between items-center absolute top-[10%]">
                    <p id="points" class="text-customWhite text-8xl font-extrabold ml-[5%] translate-y-[-0.5rem]">{points()}</p>
                </div>
            </Show>
            <Show when={cards()[0].length > 0}>
                <Show when={windowWidth() > 600 && windowHeight() > 500}>
                    <div class="flex w-[98%] lg:w-[90%] justify-between items-center absolute bottom-16">
                        <div onClick={() => playCards()} class="ml-[-2.5%] md:ml-0 scale-[50%] md:scale-[100%] z-10 transition duration-200 ease-in-out hover:scale-[60%] md:hover:scale-[110%] hover:cursor-pointer bg-customWhite rounded-[100%] w-36 h-36 flex justify-center items-center">
                            <div class="bg-minPlus-terciary rounded-[100%] w-30 h-30 flex justify-center items-center">
                                <h1 class="text-customWhite font-bold text-6xl translate-[-0.25rem] rotate-[-29deg]">OK</h1>
                            </div>
                        </div>
                        <div onClick={() => playCards()} class="mr-[-2.5%] md:mr-0 scale-[50%] md:scale-[100%] z-10 transition duration-200 ease-in-out hover:scale-[60%] md:hover:scale-[110%] hover:cursor-pointer bg-customWhite rounded-[100%] w-36 h-36 flex justify-center items-center">
                            <div class="bg-minPlus-terciary rounded-[100%] w-30 h-30 flex justify-center items-center">
                                <h1 class="text-customWhite font-bold text-6xl translate-[-0.25rem] rotate-[29deg]">OK</h1>
                            </div>
                        </div>
                    </div>
                    <Deck cardImages={cardImages} rotation={true}></Deck>
                    <Hand cardImages={cardImages} cards={cards()} computerUI={windowWidth() > 600} setCards={setCardsSelected}></Hand>
                </Show>
                <Show when={windowWidth() <= 600 || windowHeight() <= 500}>
                    <div class="flex w-full justify-between items-center absolute bottom-48 md:bottom-12">
                        <div onClick={() => playCards()} class="scale-[75%] translate-x-[-0.75rem] md:scale-[100%] md:translate-x-0 z-10 transition duration-200 ease-in-out hover:scale-[60%] md:hover:scale-[110%] hover:cursor-pointer bg-customWhite w-27 h-52 flex justify-left items-center">
                            <div class="bg-minPlus-terciary w-24 h-46 flex justify-center items-center">
                                <h1 class="text-customWhite font-bold text-6xl translate-[-0.25rem] rotate-[-90deg]">OK</h1>
                            </div>
                        </div>
                        <div onClick={() => playCards()} class="scale-[75%] translate-x-[0.75rem] md:scale-[100%] md:translate-x-0 z-10 transition duration-200 ease-in-out hover:scale-[60%] md:hover:scale-[110%] hover:cursor-pointer bg-customWhite w-27 h-52 flex justify-end items-center">
                            <div class="bg-minPlus-terciary w-24 h-46 flex justify-center items-center">
                                <h1 class="text-customWhite font-bold text-6xl translate-y-[-0.25rem] translate-x-[0.25rem] rotate-[90deg]">OK</h1>
                            </div>
                        </div>
                    </div>
                    <Hand cardImages={cardImages} cards={cards()} computerUI={windowWidth() > 600} setCards={setCardsSelected}></Hand>
                </Show>
            </Show>
        </div>
    );
}

export default MinPlus;