import { Component, createSignal, Show } from "solid-js";

const Deck: Component<{rotation: boolean, cardImages: Record<string, string>}> = (props) => {
    return (
        <div class="absolute top-[24px] w-full">
            <img class="w-[20%] xl:w-[12%] absolute top-[24px] left-[50%] translate-x-[-50%]" src={props.cardImages['8']} style={`transform: rotate(${props.rotation ? '-90deg' : '0'})`}/>
            <img class="w-[20%] xl:w-[12%] absolute top-[12px] left-[calc(50%+12px)] translate-x-[-50%]" src={props.cardImages['8']} style={`transform: rotate(${props.rotation ? '-90deg' : '0'})`}/>
            <img class="w-[20%] xl:w-[12%] absolute top-[0px] left-[calc(50%+24px)] translate-x-[-50%]" src={props.cardImages['8']} style={`transform: rotate(${props.rotation ? '-90deg' : '0'})`}/>
        </div>
    );
}

export default Deck