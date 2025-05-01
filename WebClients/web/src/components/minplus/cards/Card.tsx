import { Component, createSignal, Show } from "solid-js";

const Card: Component<{imgPath: string, rotation: boolean}> = (props) => {
    return (
        <img src={`/src/assets/imgs/cards/${props.imgPath}`} style={`transform: rotate(${props.rotation ? '-90deg' : '0'})`}/>
    );
}

export default Card