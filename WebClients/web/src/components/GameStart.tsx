import { Component } from "solid-js";

const Start: Component<{ws: any, dark: string, secondary: string}> = (props) => {
    const ws = props.ws;
    function startGame() {
        ws.send("0"); // "start"
    }
    
    return (
        <div class="w-full flex justify-center">
            <div class="m-8 w-[85%] lg:w-[45%] rounded-md text-center py-2 px-1" style={`background-color: ${props.secondary}`}>
                <p id="numPlayers" class="text-xl font-bold uppercase" style={`color: ${props.dark}`}>JOGADORES</p>
            </div>
            <div onClick={startGame} class="hidden m-8 w-[85%] lg:w-[45%] cursor-pointer rounded-md text-center py-2 px-1" style={`background-color: ${props.secondary}`}>
                <p id="startGame" class="text-xl font-bold uppercase" style={`color: ${props.dark}`}>Todos os jogadores entraram</p>
            </div>
        </div>
    );
};

export default Start;