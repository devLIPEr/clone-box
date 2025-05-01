import { Component } from "solid-js";

const Fact: Component<{fact: string}> = (props) => {
    return (
        <div class="bg-factOrFable-terciary m-8 w-4/5 xl:w-3/5 rounded-md text-center px-2 py-8">
            <p class="text-lg font-bold uppercase text-factOrFable-dark">{props.fact}</p>
        </div>
    );
};

export default Fact;