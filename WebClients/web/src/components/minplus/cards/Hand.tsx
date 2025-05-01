import { Component, createSignal, Show } from "solid-js";

const Hand: Component<{cards: string[], computerUI: boolean, setCards: Function, cardImages: Record<string, string>}> = (props) => {
    let cardsClicked: number[] = [];
    let cardsSelected: string[] = [];
    function selectCard(card: number, removed: boolean = false){
        let cardIdx: number = cardsClicked.indexOf(card);
        if(cardIdx == -1){
            if(cardsClicked.length == 2){
                let lastCard: number = cardsClicked[0];
                cardsClicked.shift();
                cardsSelected.shift();
                selectCard(lastCard, true);
                cardsClicked.push(card);
                cardsSelected.push(props.cards[card]);
            }else if(!removed){
                cardsClicked.push(card);
                cardsSelected.push(props.cards[card]);
            }
        }else if(cardIdx != -1){
            cardsClicked.splice(cardIdx, 1);
            cardsSelected.splice(cardIdx, 1);
        }
        if(cardsSelected.length == 2){
            props.setCards(cardsSelected);
        }else{
            props.setCards(["", ""]);
        }
        document.getElementById(`handCard-${card}`)?.classList.toggle('card-clicked');
        document.getElementById(`handCard-${card}`)?.classList.toggle('hover:scale-[110%]');
        document.getElementById(`handCard-${card}`)?.classList.toggle('hover:translate-y-[-24px]');
    }

    return (
        <div class="flex w-full justify-center">
            <Show when={props.computerUI}>
                <div class="absolute bottom-[24px] flex w-full justify-center">
                    <img id="handCard-0" onClick={() => selectCard(0)} class="hover:cursor-pointer transition duration-300 ease-in-out hover:scale-[110%] hover:translate-y-[-24px] w-[20%] md:w-[15%] xl:w-[13%] mr-[32px]" src={props.cardImages[props.cards[0]]}/>
                    <img id="handCard-1" onClick={() => selectCard(1)} class="hover:cursor-pointer transition duration-300 ease-in-out hover:scale-[110%] hover:translate-y-[-24px] w-[20%] md:w-[15%] xl:w-[13%] mr-[32px]" src={props.cardImages[props.cards[1]]}/>
                    <img id="handCard-2" onClick={() => selectCard(2)} class="hover:cursor-pointer transition duration-300 ease-in-out hover:scale-[110%] hover:translate-y-[-24px] w-[20%] md:w-[15%] xl:w-[13%]" src={props.cardImages[props.cards[2]]}/>
                </div>
            </Show>
            <Show when={!props.computerUI}>
                <div class="absolute bottom-[24px] flex w-full justify-center">
                    <img id="handCard-0" onClick={() => selectCard(0)} class="hover:cursor-pointer transition duration-300 ease-in-out hover:scale-[110%] hover:translate-y-[-24px] w-[25%] md:w-[18%] mr-[32px]" src={props.cardImages[props.cards[0]]}/>
                    <img id="handCard-1" onClick={() => selectCard(1)} class="hover:cursor-pointer transition duration-300 ease-in-out hover:scale-[110%] hover:translate-y-[-24px] w-[25%] md:w-[18%] mr-[32px]" src={props.cardImages[props.cards[1]]}/>
                    <img id="handCard-2" onClick={() => selectCard(2)} class="hover:cursor-pointer transition duration-300 ease-in-out hover:scale-[110%] hover:translate-y-[-24px] w-[25%] md:w-[18%]" src={props.cardImages[props.cards[2]]}/>
                </div>
            </Show>
        </div>
    );
}

export default Hand