import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { Flashcard } from '../entities/flashcard.entity';
import { ReviewLog } from '../entities/review-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard, ReviewLog]), AuthModule],
  providers: [FlashcardService],
  controllers: [FlashcardController],
})
export class FlashcardModule {}
