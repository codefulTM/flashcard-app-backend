import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FlashcardService } from './flashcard.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ReviewFlashcardDto } from './dto/review-flashcard.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('flashcards')
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Post()
  create(@Body() createFlashcardDto: CreateFlashcardDto) {
    return this.flashcardService.create(createFlashcardDto);
  }

  @Post('generate')
  generate(
    @Body() body: { deck_id: string; front_content: string; prompt?: string },
  ) {
    return this.flashcardService.generate(
      body.deck_id,
      body.front_content,
      body.prompt,
    );
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

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewFlashcardDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    console.log(user);
    return this.flashcardService.review(id, user.userId, reviewDto);
  }

  @Get('deck/:deckId/due')
  @UseGuards(JwtAuthGuard)
  getDueFlashcards(
    @Param('deckId') deckId: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.flashcardService.getDueFlashcards(deckId, limit);
  }
}
