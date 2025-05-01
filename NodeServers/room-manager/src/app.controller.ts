import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import RoomRequestDTO from './DTO/roomRequest.dto';
import { games, loadGames, reloadGames } from './Games/game';
import JoinRequestDTO from './DTO/joinRequest.dto';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    reloadGames();
    loadGames();
  }

  @Get("/room/:code")
  getRoom(@Param('code') code: string, @Res() res){
    return this.appService.getRoom(code.toUpperCase())
    .then((game) => {
      res.send(game);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }

  @Post('/createRoom')
  allocateRoom(@Body() body: RoomRequestDTO, @Req() req, @Res() res){
    this.appService.allocateRoom(games[body.game.toUpperCase()], body.code, req.headers['x-forwarded-for'] || req.socket.remoteAddress)
    .then((game) => {
      res.send(game);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }

  @Post('/joinRoom')
  joinRoom(@Body() body: JoinRequestDTO, @Res() res: Response){
    this.appService.joinRoom(body.code.toUpperCase(), body.username.toUpperCase())
    .then((game) => {
      res.send(game);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }
  @Post('/joinRoom/:id/:username')
  joinRoomWithID(@Param('id') id: string, @Param('username') username: string, @Body() body: JoinRequestDTO, @Req() req, @Res() res: Response){
    this.appService.joinRoom(body.code.toUpperCase(), body.username.toUpperCase(), parseInt(id), username)
    .then((game) => {
      res.send(game);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }
}
