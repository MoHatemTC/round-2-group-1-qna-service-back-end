import { IsOptional, IsInt, IsObject, Min, Max } from 'class-validator';

export class SubmitAttemptDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsObject()
  tabActivity?: {
    totalLeaves: number;
    totalLeaveDuration: number;
    activityLog: Array<{
      type: string;
      time: string;
    }>;
  };
}
