import { Component } from "solid-js";

const VoteButtons: Component<{voteFact: any}> = (props) => {
    return (
        <div class="w-full flex flex-col md:flex-row items-center md:justify-center">
            <button onClick={() => props.voteFact(true)} class="w-2/5 md:w-1/4 lg:w-1/6 bg-factOrFable-light text-factOrFable-dark text-xl font-bold p-4 py-8 rounded-md m-8">VERDADEIRO</button>
            <button onClick={() => props.voteFact(false)} class="w-2/5 md:w-1/4 lg:w-1/6 bg-factOrFable-light text-factOrFable-dark text-xl font-bold p-4 py-8 rounded-md m-8">FALSO</button>
        </div>
    );
};

export default VoteButtons;