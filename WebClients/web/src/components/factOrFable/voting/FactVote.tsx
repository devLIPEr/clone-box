import { Component } from "solid-js";
import Fact from "./Fact";
import VoteButtons from "./VoteButtons";

const FactVote: Component<{fact: string, voteFact: any}> = (props) => {
    return (
        <div class="w-full py-4 flex flex-col items-center">
            <Fact fact={props.fact}/>
            <VoteButtons voteFact={props.voteFact}/>
        </div>
    );
};

export default FactVote;