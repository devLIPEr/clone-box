import { Component } from "solid-js";

const Header: Component<{username: string, dark: string, light: string}> = (props) => {
    return (
        <header class="flex h-fit w-full py-1 justify-center" style={`background-color: ${props.dark}`}>
            <p class="uppercase text-lg font-semibold" style={`color: ${props.light}`}>{props.username}</p>
        </header>
    );
};

export default Header;