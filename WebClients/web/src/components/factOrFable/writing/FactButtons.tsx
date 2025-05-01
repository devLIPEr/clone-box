import { Component } from "solid-js";

const FactButtons: Component<{setAnswer: any, sendFact: any}> = (props) => {
    return (
        <div class="w-full flex flex-col md:flex-row items-center md:justify-center mt-12">
            <button id="optTrue" onClick={() => props.setAnswer(true)} class="w-2/5 md:w-1/4 lg:w-1/6 bg-factOrFable-light text-factOrFable-dark text-xl font-bold p-4 py-8 rounded-md m-3 border-factOrFable-dark border-2">VERDADEIRO</button>
            <button id="optFalse" onClick={() => props.setAnswer(false)} class="w-2/5 md:w-1/4 lg:w-1/6 bg-factOrFable-light text-factOrFable-dark text-xl font-bold p-4 py-8 rounded-md m-3 border-factOrFable-dark">FALSO</button>
            <button onClick={props.sendFact} class="w-2/5 md:w-1/4 lg:w-1/6 bg-factOrFable-light text-factOrFable-dark text-xl font-bold p-4 py-8 rounded-md m-3 mb-0 md:mb-3">ENVIAR</button>
        </div>
    );
};

export default FactButtons;