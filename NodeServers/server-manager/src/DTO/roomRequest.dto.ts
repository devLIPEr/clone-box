import { IsString } from "class-validator";

export default class RoomRequestDTO {
    @IsString()
    private _game: string;

    constructor(game: string){
        this._game = game;
    }

    /**
     * Getter game
     * @return {string}
     */
	public get game(): string {
		return this._game;
	}

    /**
     * Setter game
     * @param {string} value
     */
	public set game(value: string) {
		this._game = value;
	}
}