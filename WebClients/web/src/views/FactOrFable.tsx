import { createEffect, createSignal, Show, type Component } from 'solid-js';
import Header from '../components/GameHeader';
import Start from '../components/GameStart';
import { useLocation, useNavigate } from '@solidjs/router';
import { createWS } from '@solid-primitives/websocket';
import FactVote from '../components/factOrFable/voting/FactVote';
import FactWriting from '../components/factOrFable/writing/FactWriting';

const FactOrFable: Component = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id, username, ip, port, gameState }: any = location.state || {};
    const [started, setStarted] = createSignal(gameState);

    const [message, setMessage] = createSignal("");
    const [write, setWrite] = createSignal(false);
    const [answer, setAnswer] = createSignal(true);

    var minPlayersLogged: boolean = false;

    var currGameState = sessionStorage.getItem("gameState");

    var ws = createWS(`wss://${ip}/user?id=${id}&username=${username}`);
    
    function checkLoadState(){
        console.log(currGameState);
        console.log(`wss://${ip}/user?id=${id}&username=${username}`);
        switch(currGameState){
            case "VOTE":
                document.getElementById("numPlayers")?.parentElement?.classList.toggle("hidden");
                var fact = sessionStorage.getItem("fact");
                if(fact){
                    setMessage(fact);
                }
                setAnswer(true);
                break;
            case "LOGIN":
                var numPlayersDoc: any = document.getElementById("numPlayers");
                var startGameDoc: any = document.getElementById("startGame");
                if(sessionStorage.getItem("playersNeeded")){
                    numPlayersDoc.innerText = sessionStorage.getItem("playersNeeded");
                }else{
                    if(!minPlayersLogged){
                        numPlayersDoc.parentElement.classList.toggle("hidden");
                        startGameDoc.parentElement.classList.toggle("hidden");
                        minPlayersLogged = !minPlayersLogged;
                    }
                }
                break;
            case "WRITE":
                document.getElementById("numPlayers")?.parentElement?.classList.toggle("hidden");
                setWrite(true);
                setAnswer(true);
                break;
            case "STARTED":
                document.getElementById("numPlayers")?.parentElement?.classList.toggle("hidden");
                setStarted(true);
                break;
        }

        ws.addEventListener('close', () => {
            if(!sessionStorage.getItem("gameState")){
                ws = createWS(`wss://${ip}/user?id=${id}&username=${username}`);
            }
        })
    
        ws.addEventListener('message', (e: any) => {
            const command = [e.data.substring(0, 1), e.data.substring(1)];
            switch(command[0]){
                case '0': //'fact':
                    currGameState = "VOTE";
                    sessionStorage.setItem("gameState", "VOTE");
                    sessionStorage.setItem("fact", command[1]);
                    setMessage(command[1]);
                    setAnswer(true);
                    break;
                case '1': //'players':
                    currGameState = "LOGIN";
                    sessionStorage.setItem("gameState", "LOGIN");
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
                    break;
                case '2': //'write':
                    currGameState = "WRITE";
                    sessionStorage.setItem("gameState", "WRITE");
                    setAnswer(true);
                    if(command[1] == "1"){
                        setWrite(true);
                    }else{
                        setWrite(false);
                    }
                    break;
                case '3': //'started':
                    currGameState = "STARTED";
                    sessionStorage.setItem("gameState", "STARTED");
                    setStarted(true);
                    break;
                case '4': //'end':
                    sessionStorage.removeItem("gameState");
                    sessionStorage.removeItem("fact");
                    sessionStorage.removeItem("playersNeeded");
                    sessionStorage.removeItem("currId");
                    sessionStorage.removeItem("username");
                    ws.close();
                    navigate('/');
                    break;
                default:
                    break;
            }
        });
    }

    const sendFact = () => {
        const textareaInput: any = document.getElementById("fact");
        
        fetch(`http://${ip}/fact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                fact: textareaInput.value,
                answer: answer()
            })
        })
        .then((response) => {
            if(response.status == 200){
                setWrite(false);
            }
        })
        .catch((err) => {
            console.log(err);
        });
    }

    const voteFact = (answer: boolean) => {
        fetch(`http://${ip}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                answer: answer
            })
        })
        .then((response) => {
            if(response.status == 200){
                setMessage("");
            }
        })
        .catch((err) => {
            console.log(err);
        });
    }

    function selectAnswer(ans: boolean){
        if(ans != answer()){
            setAnswer(ans);
            document.getElementById("optTrue")?.classList.toggle("border-2");
            document.getElementById("optFalse")?.classList.toggle("border-2");
        }
    }

    createEffect(() => checkLoadState());

    return (
        <div class="h-[100svh] flex flex-col items-center bg-primaryFactOrFable">
            <Header username={username} dark="#2E2622" light="#D9D9D9"/>
            <Show when={id === 0 && !started()}>
                <Start ws={ws} dark="#2E2622" secondary="#A09F97"/>
            </Show>
            <Show when={message().length > 0}>
                <FactVote fact={message()} voteFact={voteFact}/>
            </Show>
            <Show when={write()}>
                <FactWriting setAnswer={selectAnswer} sendFact={sendFact}/>
            </Show>
        </div>
    );
};

export default FactOrFable;
