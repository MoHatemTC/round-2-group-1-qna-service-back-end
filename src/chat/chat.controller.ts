import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Response } from 'express';

@Controller('chat')// 1. Base route definition
export class ChatController {
    // 2.   link the (controller) with the (Service)

    constructor (private readonly chatService: ChatService){}

    @Post('send')
    async sendMessage(
    @Body() body: SendMessageDto,
    @Res() res: Response, ) {

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(HttpStatus.OK);

    await this.chatService.processMessageStream(body, res);
  }
}
