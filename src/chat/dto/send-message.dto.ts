import { IsString, IsNotEmpty, IsOptional } from "class-validator";
export class SendMessageDto{
    // Field 1 validation: Message
    @IsString({message: 'The message must be a string'})
    @IsNotEmpty({message:"Message can't be Embty"})
    message: string;

    // Field 2 validation: Session ID
    @IsString({message:'The session ID must be a string'})
    @IsOptional()
    sessionId?: string;

}