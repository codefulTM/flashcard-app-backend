import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class ReviewFlashcardDto {
  @IsInt()
  @Min(1)
  @Max(4)
  rating: number; // 1=Again, 2=Hard, 3=Good, 4=Easy

  @IsOptional()
  @IsInt()
  @Min(0)
  timeTakenMs?: number; // Time taken to answer in milliseconds
}
