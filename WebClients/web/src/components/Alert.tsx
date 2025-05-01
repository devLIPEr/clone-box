import { Component, createEffect } from "solid-js";

const Alert: Component<{title: string, message: string}> = (props) => {
    createEffect(() => {
        setTimeout(() => {
            if(document.getElementsByClassName("alert").length > 0){
                document.getElementsByClassName("alert")[0].remove();
            }
        }, 3000);
    });
    return (
        <div class="alert fadeout w-fit px-2 py-1 top-12 flex justify-center absolute bg-alertBg border-alertDark border-2 rounded-sm">
            <span class="text-alertDark text-2xl font-bold">{props.title}:</span>
            <span class="text-alertColor text-2xl font-semibold ml-2">{props.message}</span>
        </div>
    );
};

export default Alert;