import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeckService } from './deck.service';
import { DeckController } from './deck.controller';
import { Deck } from '../entities/deck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deck])],
  providers: [DeckService],
  controllers: [DeckController],
})
export class DeckModule {}
