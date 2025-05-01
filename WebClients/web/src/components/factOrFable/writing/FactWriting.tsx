import { Component } from "solid-js";
import FactButtons from "./FactButtons";

const FactWriting: Component<{setAnswer: any, sendFact: any}> = (props) => {
    function removeExtraLines(e: any){
        let text = e.target.value;
        while(text.includes("\n\n")){
            text = text.replace("\n\n", "\n");
        }
        e.target.value = text;
    }

    function limitLineBreaks(e: any){
        const textareaInput = e.target;
        textareaInput.scrollTo(0, (textareaInput.scrollHeight - textareaInput.offsetHeight)/2);
        if(e.key === "Enter"){
            if(textareaInput.value.split('\n').length == 4){
                e.preventDefault();
            }
            removeExtraLines(e);
        }
    }
    
    return (
        <div class="w-full py-4 flex flex-col items-center">
            <textarea onKeyDown={limitLineBreaks} onBlur={removeExtraLines} class="uppercase resize-none outline-0 w-4/5 h-72 md:h-48 overflow-hidden box-border text-center px-2 py-32 md:py-20 font-bold text-xl text-factOrFable-dark bg-factOrFable-terciary rounded-md" name="fact" id="fact" maxlength="200"></textarea>
            <FactButtons setAnswer={props.setAnswer} sendFact={props.sendFact}/>
        </div>
    );
};

export default FactWriting;