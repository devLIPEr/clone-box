import * as fs from 'fs';
import Heap from 'heap-js';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
const serversJson = path.join(__dirname, 'servers.json');
const httpService: HttpService = new HttpService();

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

export var gameCount: number = 0;

export function modifyGameCount(count: number){
    gameCount += count;
}

export var serversHeap = new Heap((a: Server, b: Server) => a.numberGames - b.numberGames);

export function reloadServers(){
    fs.watchFile(serversJson, (curr, prev) => {
        if(curr.mtime != prev.mtime){
            loadServers();
        }
    });
}

export async function loadServers(){
    try{
        gameCount = 0;
        const file = fs.readFileSync(serversJson, 'utf-8');
        const jsonFile = JSON.parse(file);
        const updatedServerHeap = new Heap((a: Server, b: Server) => a.numberGames - b.numberGames);
        for(const [key, value] of Object.entries(jsonFile)){
            let numGames = 0;
            console.log(`${key}:${value}/rooms`)
            const response = await firstValueFrom(
                httpService.get(
                  `${key}:${value}/rooms`,
                )
            );
            if(response){
                numGames = response.data['rooms'];
                gameCount += numGames;
            }
            updatedServerHeap.add(new Server(key, Number(value), numGames));
        }
        serversHeap = updatedServerHeap;

        console.log("Servers file was changed, loaded new servers from file");
    }catch(err){
        console.log(err);
    }
}