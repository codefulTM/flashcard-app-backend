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
import { FlashcardService } from './flashcard.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Controller('flashcards')
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Post()
  create(@Body() createFlashcardDto: CreateFlashcardDto) {
    return this.flashcardService.create(createFlashcardDto);
  }

  @Post('generate')
  generate(@Body() body: { deck_id: string; front_content: string }) {
    return this.flashcardService.generate(body.deck_id, body.front_content);
  }

  @Get()
  findAll(
    @Query('deckId') deckId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.flashcardService.findAll(deckId, page, limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashcardService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFlashcardDto: UpdateFlashcardDto,
  ) {
    return this.flashcardService.update(id, updateFlashcardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashcardService.remove(id);
  }
}
