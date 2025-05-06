import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import RoomResponseDTO from './DTO/roomResponse.dto';
import { reloadServers, loadServers, Server, serversHeap, gameCount, modifyGameCount } from './Entities/Servers/server';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom  } from 'rxjs';

@Injectable()
export class AppService {
  private games = {};
  private letters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private httpService: HttpService = new HttpService();
  private maxGames: number = Math.pow(26, 4);

  constructor(){
    reloadServers();
    loadServers();
  }

  getRoom(code: string): Promise<RoomResponseDTO> {
    return new Promise<RoomResponseDTO>((resolve, reject) => {
      if(code in this.games){
        resolve(this.games[code]);
      }else{
        reject(new HttpException(`No room with code ${code} found.`, HttpStatus.NOT_FOUND));
      }
    });
  }

  startRoom(code: string, ip: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      if(code in this.games){
        if (this.games[code].room["_currPlayers"] < this.games[code].room["_minPlayers"]){
          reject(new HttpException("Not enough players connected", HttpStatus.PARTIAL_CONTENT));
        }else if(ip.indexOf(this.games[code].server.ipAddress) >= 0){
          this.games[code].room['_started'] = true;
          resolve(true);
        }else{
          reject(new HttpException("Requisition made by someone else other than the server.", HttpStatus.FORBIDDEN));
        }
      }else{
        reject(new HttpException(`No room with code ${code} found.`, HttpStatus.NOT_FOUND));
      }
    });
  }

  endRoom(code: string, ip: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if(code in this.games){
        if(!this.games[code].room['_started']){
          reject(new HttpException(`Can't end room that hasn't started yet.`, HttpStatus.BAD_REQUEST));
        }else if(ip.indexOf(this.games[code].server.ipAddress) >= 0){
          this.games[code].server.numberGames--;
          this.fixHeap();
          delete this.games[code];
          resolve(true);
          modifyGameCount(-1);
        }else{
          reject(new HttpException("Requisition made by someone else other than the server.", HttpStatus.FORBIDDEN));
        }
      }else{
        reject(new HttpException(`No room with code ${code} found.`, HttpStatus.NOT_FOUND));
      }
    });
  }

  fixHeap(): void{
    if(serversHeap.check() !== undefined){
      serversHeap.push(serversHeap.pop()!);
    }
  }

  async allocateRoom(game: string): Promise<RoomResponseDTO> {
    try{
      let leastUsedServer: Server = serversHeap.pop()!;
      if(gameCount >= this.maxGames){
        return new Promise<RoomResponseDTO>((resolve, reject) => {
          reject(new HttpException("No more room to allocate games, try again later", HttpStatus.INTERNAL_SERVER_ERROR));
        })
      }
      let code = this.generateCode()
      while(code in this.games){
        code = this.generateCode();
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${leastUsedServer.ipAddress}:${leastUsedServer.port}/createRoom`, 
          {"game": game, "code": code}
        )
      );

      leastUsedServer.numberGames++;
      serversHeap.push(leastUsedServer);
      
      let room = response.data;
      this.games[room._code] = {"room": room, "server": leastUsedServer};
      modifyGameCount(1);

      return new Promise<RoomResponseDTO>((resolve, reject) => {
        resolve(room);
      });
    }catch(error){
      return new Promise<RoomResponseDTO>((resolve, reject) => {
        reject(new HttpException("Could not connect to a game server, try again later", HttpStatus.BAD_REQUEST));
      });
    }
  }

  async joinRoom(code: string, username: string, id?: number, user?: string): Promise<RoomResponseDTO> {
    try{
      if(code in this.games){
        let game = this.games[code];
        const response = await firstValueFrom(
          this.httpService.post(
            `${game.server.ipAddress}:${game.server.port}/joinRoom`,
            {"code": code, "username": username, "id": id, "user": user}
          )
        );
        return new Promise<RoomResponseDTO>((resolve, reject) => {
          game.room["_currPlayers"]++;
          response.data["_currPlayers"]++;
          resolve(response.data);
        });
      }else{
        return new Promise<RoomResponseDTO>((resolve, reject) => {
          reject(new HttpException(`Room with code: ${code} not found`, HttpStatus.BAD_GATEWAY));
        });
      }
    }catch(erro){
      return new Promise<RoomResponseDTO>((resolve, reject) => {
        reject(new HttpException(`Could not join room with code ${code}`, HttpStatus.INTERNAL_SERVER_ERROR));
      });
    }
  }

  randomInt(min: number, max: number){
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  generateCode(): string{
    let code: string = "";
    for(let i = 0; i < 4; i++){ // Number of letters on code
      code += this.letters[this.randomInt(0, 25)]; // random letter from alphabet
    }
    return code;
  }
}
