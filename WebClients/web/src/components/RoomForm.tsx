import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For } from "solid-js";
import Alert from "./Alert";

const RoomForm: Component = () => {
    const [alerts, setAlerts] = createSignal<Record<string, string>>({});
    const [game, setGame] = createSignal("JOGO NÃO ENCONTRADO");
    const navigate = useNavigate();

    async function sendForm(e: any){
        e.preventDefault();
        const code: string = e.target.code.value;
        const username: string = e.target.username.value;
        const currGame = sessionStorage.getItem("currId");
        const currUsername = sessionStorage.getItem("username");

        let postURL = window.location.hostname + ":3000/joinRoom" + ((currGame && currUsername) ? `/${currGame}/${currUsername}` : "");
        console.log(postURL);
        fetch(postURL, { // Change ip to servers name
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: code,
                username: username
            })
        })
        .then(response => response.json())
        .then((data) => {
            console.log(data);
            if(data.username){
                sessionStorage.setItem("currId", data.id);
                sessionStorage.setItem("username", data.username);
                navigate(`${data.path}`, { state: {
                    id: data.id,
                    username: data.username,
                    ip: data._ip,
                    port: data._port,
                    gameState: data._started
                }});
            }else if(data.error){
                let d = { ...alerts() };
                d["Room"] = data.error;
                setAlerts(d);
                delete d["Room"];
                setAlerts(d);
            }
        })
        .catch((err) => {
            console.log(err);
        });
    }

    function getGame(value: string){
        return fetch(window.location.hostname + ":3000/room/"+value, { // Change ip to servers name
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then((data) => {
            return data;
        })
        .catch((err) => {
            let d = { ...alerts() };
            d["Room"] = `Couldn't find room with code :${value}`;
            setAlerts(d);
            delete d["Room"];
            setAlerts(d);
            console.log(err);
            return null;
        });
    }

    function getGameName(e: any){
        const value: string = e.target.value.toUpperCase();
        if(value.length == 4){
            fetch(window.location.hostname + ":3000/room/"+value, { // Change ip to servers name
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then((data) => {
                if("error" in data){
                    setGame(() => "JOGO NÃO ENCONTRADO");
                }else{
                    setGame(() => data['room']['_game']);
                }
            })
            .catch((err) => {
                console.log(err);
            });
        }else{
            setGame(g => "JOGO NÃO ENCONTRADO");
        }
    }
    return (
        <form onSubmit={sendForm} method="post" action="" class="flex flex-col items-center justify-evenly bg-factOrFable-secondary w-[90%] sm:w-[70%] md:w-1/2 xl:w-[30%] rounded-3xl p-4 py-12">
            <div class="w-full flex flex-col items-center">
                <div class="w-4/5">
                    <p class="text-factOrFable-dark text-3xl font-extrabold">CÓDIGO DA SALA</p>
                    <input onInput={getGameName} class="uppercase w-full outline-0 border-0 p-4 pl-2 my-1 text-2xl font-bold bg-factOrFable-light rounded-lg" type="text" name="code" id="code" maxlength="4"/>
                    <p class="text-factOrFable-dark text-md font-bold">{game()}</p>
                </div>
            </div>
            <div class="my-12 w-full flex flex-col items-center">
                <div class="w-4/5">
                    <p class="text-factOrFable-dark text-3xl font-extrabold">NOME DE USUÁRIO</p>
                    <input class="uppercase w-full outline-0 border-0 p-4 pl-2 my-1 text-2xl font-bold bg-factOrFable-light rounded-lg" type="text" name="username" id="username" maxlength="15"/>
                </div>
            </div>
            <div class="w-full flex flex-col items-center">
                <input type="submit" id="submit" class="bg-factOrFable-light text-factOrFable-dark font-extrabold py-4 px-8 text-2xl rounded-md cursor-pointer" value="ENTRAR"/>
            </div>
            <For each={Object.entries(alerts())}>
                {([key, value]) => (
                    <Alert message={value} title={key}></Alert>
                )}
            </For>
        </form>
    );
};

export default RoomForm;