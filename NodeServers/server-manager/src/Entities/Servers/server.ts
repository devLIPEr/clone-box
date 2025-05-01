import * as fs from 'fs';
import Heap from 'heap-js';
import * as path from 'path';
const serversJson = path.join(__dirname, 'servers.json');

export class Server {
    private _ipAddress: string;
    private _port: number;
    private _numberGames: number;

    constructor(ipAddress: string, port: number, numberGames: number) {
        this._ipAddress = ipAddress;
        this._port = port;
        this._numberGames = numberGames;
    }

    /**
     * Getter ipAddress
     * @return {string}
     */
	public get ipAddress(): string {
		return this._ipAddress;
	}

    /**
     * Getter port
     * @return {number}
     */
	public get port(): number {
		return this._port;
	}

    /**
     * Getter numberGames
     * @return {number}
     */
	public get numberGames(): number {
		return this._numberGames;
	}

    /**
     * Setter ipAddress
     * @param {string} value
     */
	public set ipAddress(value: string) {
		this._ipAddress = value;
	}

    /**
     * Setter port
     * @param {number} value
     */
	public set port(value: number) {
		this._port = value;
	}

    /**
     * Setter numberGames
     * @param {number} value
     */
	public set numberGames(value: number) {
		this._numberGames = value;
	}
}

export var serversHeap = new Heap((a: Server, b: Server) => a.numberGames - b.numberGames);

export function loadServers(){
    try{
        const file = fs.readFileSync(serversJson, 'utf-8');
        const jsonFile = JSON.parse(file);
        const updatedServerHeap = new Heap((a: Server, b: Server) => a.numberGames - b.numberGames);
        for(const [key, value] of Object.entries(jsonFile)){
            serversHeap.add(new Server(key, Number(value), 0));
        }
        console.log("Servers file was changed, loaded new servers from file");
    }catch(err){
        console.log(err);
    }
}