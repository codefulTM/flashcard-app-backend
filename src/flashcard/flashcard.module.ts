import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { Flashcard } from '../entities/flashcard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard])],
  providers: [FlashcardService],
  controllers: [FlashcardController],
})
export class FlashcardModule {}
