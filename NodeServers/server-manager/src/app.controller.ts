import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import RoomRequestDTO from './DTO/roomRequest.dto';
import JoinRequestDTO from './DTO/joinRequest.dto';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  @Get("/room/:code/start")
  startRoom(@Param('code') code: string, @Req() req, @Res() res){
    return this.appService.startRoom(code.toUpperCase(), req.headers['x-forwarded-for'] || req.socket.remoteAddress)
    .then((game) => {
      res.send(game);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }

  @Get("/room/:code/end")
  endRoom(@Param('code') code: string, @Req() req, @Res() res){
    return this.appService.endRoom(code.toUpperCase(), req.headers['x-forwarded-for'] || req.socket.remoteAddress)
    .then((ended) => {
      res.send(ended);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }

  @Post('/createRoom')
  allocateRoom(@Body() body: RoomRequestDTO, @Res() res){
    this.appService.allocateRoom(body.game.toUpperCase())
    .then((game) => {
      res.send(game);
    })
    .catch((err) => {
      res.status(err.status).send({error: err.response});
    });
  }

  @Post('/joinRoom')
  joinRoom(@Body() body: JoinRequestDTO, @Req() req, @Res() res: Response){
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
