import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { Flashcard } from '../entities/flashcard.entity';
import { Deck } from '../entities/deck.entity';
import { ReviewLog } from '../entities/review-log.entity';
import { AuthModule } from '../auth/auth.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard, Deck, ReviewLog]), AuthModule, LlmModule],
  providers: [FlashcardService],
  controllers: [FlashcardController],
})
export class FlashcardModule { }
