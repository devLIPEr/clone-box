import { IsString } from "class-validator";

export default class RoomRequestDTO {
    @IsString()
    private _game: string;
    @IsString()
    private _code: string;

    constructor(game: string, code: string){
        this._game = game;
        this._code = code;
    }

    /**
     * Getter game
     * @return {string}
     */
	public get game(): string {
		return this._game;
	}

    /**
     * Getter code
     * @return {string}
     */
	public get code(): string {
		return this._code;
	}

    /**
     * Setter game
     * @param {string} value
     */
	public set game(value: string) {
		this._game = value;
	}

    /**
     * Setter code
     * @param {string} value
     */
	public set code(value: string) {
		this._code = value;
	}

}