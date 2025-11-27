import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DeckService } from './deck.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Controller('decks')
export class DeckController {
  constructor(private readonly deckService: DeckService) {}

  @Post()
  create(@Body() createDeckDto: CreateDeckDto, @Body('userId') userId: string) {
    return this.deckService.create(createDeckDto, userId);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.deckService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deckService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeckDto: UpdateDeckDto) {
    return this.deckService.update(id, updateDeckDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deckService.remove(id);
  }

  @Post(':id/custom-study')
  createCustomStudy(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('days') days: number,
  ) {
    return this.deckService.createCustomStudyDeck(id, userId, days);
  }
}
