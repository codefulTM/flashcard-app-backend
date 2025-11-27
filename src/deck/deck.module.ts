import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeckService } from './deck.service';
import { DeckController } from './deck.controller';
import { Deck } from '../entities/deck.entity';
import { Flashcard } from '../entities/flashcard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deck, Flashcard])],
  providers: [DeckService],
  controllers: [DeckController],
})
export class DeckModule {}
