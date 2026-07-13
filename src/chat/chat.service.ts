import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { Response } from 'express';

@Injectable()
export class ChatService {
async processMessageStream(dto: SendMessageDto, res: Response): Promise<void> {        // 2. Mock response payload
        const replyWords = [
            'Welcome ', 'aboard, ', 'Engineer.. ',
            'I ', 'am ', 'your ', 'server, ', 'and ',
            'I ', 'am ', 'talking ', 'to ', 'you ', 'via ', 'Stream!'
        ];

        let index = 0;

        return new Promise<void>((resolve) => {
            const timer = setInterval(() => {
                if (index < replyWords.length) {

                    res.write(`data: ${JSON.stringify({ text: replyWords[index] })}\n\n`);
                    index++;
                } else {
                    res.end();
                    clearInterval(timer);
                    resolve();
                }
            }, 400);
        });
    }
}
