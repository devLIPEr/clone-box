export default class RoomResponseDTO {
    private _id: number;
    private _username: string;
    private _game: string;
    private _code: string;
    private _ip: string;
    private _port: number;
    private _minPlayers: number;
    private _currPlayers: number = 0;
    private _maxPlayers: number;
    private _started: boolean;

    constructor(game: string, code: string, ip: string, port: number, minPlayers: number, maxPlayers: number, started: boolean, id?: number, username?: string){
        this._game = game;
        this._code = code;
        this._ip = ip;
        this._port = port;
        this._minPlayers = minPlayers;
        this._maxPlayers = maxPlayers;
        this._started = started;
        this._id = id!;
        this._username = username!;
    }

    /**
     * Getter id
     * @return {number}
     */
	public get id(): number {
		return this._id;
	}

    /**
     * Getter username
     * @return {string}
     */
	public get username(): string {
		return this._username;
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
     * Getter ip
     * @return {string}
     */
	public get ip(): string {
		return this._ip;
	}

    /**
     * Getter port
     * @return {number}
     */
	public get port(): number {
		return this._port;
	}

    /**
     * Getter minPlayers
     * @return {number}
     */
	public get minPlayers(): number {
		return this._minPlayers;
	}

    /**
     * Getter currPlayers
     * @return {number }
     */
	public get currPlayers(): number  {
		return this._currPlayers;
	}

    /**
     * Getter maxPlayers
     * @return {number}
     */
	public get maxPlayers(): number {
		return this._maxPlayers;
	}

    /**
     * Getter started
     * @return {boolean}
     */
	public get started(): boolean {
		return this._started;
	}

    /**
     * Setter id
     * @param {number} value
     */
	public set id(value: number) {
		this._id = value;
	}

    /**
     * Setter username
     * @param {string} value
     */
	public set username(value: string) {
		this._username = value;
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

    /**
     * Setter ip
     * @param {string} value
     */
	public set ip(value: string) {
		this._ip = value;
	}

    /**
     * Setter port
     * @param {number} value
     */
	public set port(value: number) {
		this._port = value;
	}

    /**
     * Setter minPlayers
     * @param {number} value
     */
	public set minPlayers(value: number) {
		this._minPlayers = value;
	}

    /**
     * Setter currPlayers
     * @param {number } value
     */
	public set currPlayers(value: number ) {
		this._currPlayers = value;
	}

    /**
     * Setter maxPlayers
     * @param {number} value
     */
	public set maxPlayers(value: number) {
		this._maxPlayers = value;
	}

    /**
     * Setter started
     * @param {boolean} value
     */
	public set started(value: boolean) {
		this._started = value;
	}
}