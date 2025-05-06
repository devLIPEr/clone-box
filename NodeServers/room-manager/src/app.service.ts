import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import RoomResponseDTO from './DTO/roomResponse.dto';
import { Game, loadGames, reloadGames } from './Games/game';
import { HttpService } from '@nestjs/axios';
import { rejects } from 'assert';
const path = require('path');
require("dotenv").config();

@Injectable()
export class AppService {
  private startingPort: number = 1025; // 1024 is this server
  private maxPort: number = 49151;
  private games = {};
  private numGames = 0;
  private maxGames = this.maxPort-this.startingPort;
  private ports = new Array(this.maxPort).fill(false);
  private httpService: HttpService = new HttpService();

  constructor(){
    reloadGames();
    loadGames();
  }

  countRooms(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      resolve(Object.keys(this.games).length)
    });
  }

  getRoom(code: string): Promise<RoomResponseDTO> {
    return new Promise<RoomResponseDTO>((resolve, reject) => {
      if(code in this.games){
        resolve(this.games[code]);
      }else{
        reject(new HttpException(`Couldn't found room with code ${code}`, HttpStatus.BAD_REQUEST));
      }
    });
  }

  allocateRoom(game: Game, code: string, ip: string): Promise<RoomResponseDTO> {
    return new Promise<RoomResponseDTO>(async (resolve, reject) => {
      if(this.numGames == this.maxGames){
        reject(new HttpException("Can't create more rooms in this server", HttpStatus.SERVICE_UNAVAILABLE));
      }

      let currPort = this.startingPort;
      while(currPort <= this.maxPort && this.ports[currPort]){
        currPort++;
      }
      if(this.ports[currPort]){
        reject(new HttpException("Process port already in use", HttpStatus.INTERNAL_SERVER_ERROR));
      }
      
      const gameProcess = exec(`${path.join(__dirname, `${process.env.GO_SERVERS}/${game.process}/${game.process}.exe`)} ${currPort} ${game.minPlayers} ${game.maxPlayers}`);
      gameProcess.stdout.on('data', async (data) => {
        if(data.includes("running on port")){
          this.ports[currPort] = true;
          this.games[code] = {room: new RoomResponseDTO(game.name, code, process.env.SERVER_IP, currPort, game.minPlayers, game.maxPlayers, false), users: {}, path: game.process};
          this.numGames++;

          console.log(`Code for ${game.process} is ${code} with port ${currPort}`);
          resolve(this.games[code].room);
        }else if(data.includes("Game started")){
          this.games[code].room.started = true;
          this.httpService.get(`${process.env.MANAGER_IP}/room/${code}/start`);
        }
      });
      gameProcess.stderr.on('data', (data) => {
        console.log("Error: ", data);
        reject(new HttpException(`Error: ${data}`, HttpStatus.INTERNAL_SERVER_ERROR));
      });
      gameProcess.on('close', async () => {
        delete this.games[code];
        this.ports[currPort] = false;
        this.numGames--;
        console.log(`Game ${code} finished`);
        this.httpService.get(`${process.env.MANAGER_IP}/room/${code}/end`);
        reject(new HttpException("Game finished", HttpStatus.NOT_FOUND));
      });
    });
  }

  joinRoom(code: string, username: string, id?: number, user?: string): Promise<RoomResponseDTO> {
    return new Promise<RoomResponseDTO>((resolve, reject) => {
      if(code in this.games){ // room exists
        if(this.games[code].room.currPlayers < this.games[code].room.maxPlayers){ // room is not full
          let response = { ...this.games[code].room }; // make a copy of the room
          response["path"] = this.games[code].path;
          if(id && user && user in this.games[code].users && this.games[code].users[user] == id){ // relog user
            response.id = id;
            response.username = user;
            resolve(response);
          }else{
            if(!this.games[code].room.started){ // game hasnt started
              let i = 0;
              let name = username;
              while(name in this.games[code].users){ // verify duplicated names and get a new one
                name = `${username}${i+1}`;
                i++;
              }
              this.games[code].users[name] = this.games[code].room.currPlayers;
              response.id = this.games[code].room.currPlayers;
              response.username = name;
              this.games[code].room.currPlayers++;
              resolve(response);
            }else{
              reject(new HttpException("Game already started", HttpStatus.BAD_REQUEST));
            }
          }
        }else{
          reject(new HttpException("Room is full", HttpStatus.BAD_REQUEST));
        }
      }else{
        reject(new HttpException("Room does not exist", HttpStatus.BAD_REQUEST));
      }
    });
  }
}
