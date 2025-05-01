import * as fs from 'fs';
import * as path from 'path';
const gamesJson = path.join(__dirname, 'games.json');

export class Game{
    private _name: string;
    private _process: string;
    private _minPlayers: number;
    private _maxPlayers: number;

    constructor(name: string, process: string, minPlayers: number, maxPlayers: number){
        this._name = name;
        this._process = process;
        this._minPlayers = minPlayers;
        this._maxPlayers = maxPlayers;
    }

    static fromJSON(json): Game{
        return new Game(
            json['name'],
            json['process'],
            json['minPlayers'],
            json['maxPlayers']
        );
    }

    /**
     * Getter name
     * @return {string}
     */
	public get name(): string {
		return this._name;
	}

    /**
     * Getter process
     * @return {string}
     */
	public get process(): string {
		return this._process;
	}

    /**
     * Getter minPlayers
     * @return {number}
     */
	public get minPlayers(): number {
		return this._minPlayers;
	}

    /**
     * Getter maxPlayers
     * @return {number}
     */
	public get maxPlayers(): number {
		return this._maxPlayers;
	}

    /**
     * Setter name
     * @param {string} value
     */
	public set name(value: string) {
		this._name = value;
	}

    /**
     * Setter process
     * @param {string} value
     */
	public set process(value: string) {
		this._process = value;
	}

    /**
     * Setter minPlayers
     * @param {number} value
     */
	public set minPlayers(value: number) {
		this._minPlayers = value;
	}

    /**
     * Setter maxPlayers
     * @param {number} value
     */
	public set maxPlayers(value: number) {
		this._maxPlayers = value;
	}
}

export function reloadGames(){
    fs.watchFile(gamesJson, (curr, prev) => {
        if(curr.mtime != prev.mtime){
            loadGames();
        }
    });
}

export function loadGames(){
    try{
        const file = fs.readFileSync(gamesJson, 'utf-8');
        const jsonFile = JSON.parse(file);
        for(const key of Object.keys(games)){
            delete games[key];
        }
        for(const [key, value] of Object.entries(jsonFile)){
            games[key] = Game.fromJSON(value);
        }
        console.log("Games file was changed, loaded new games from file.");
    }catch(err){
        console.log(err);
    }
}

export var games = {
}