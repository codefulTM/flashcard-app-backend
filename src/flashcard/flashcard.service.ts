import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from '../entities/flashcard.entity';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(Flashcard)
    private flashcardsRepository: Repository<Flashcard>,
  ) {}

  async create(createFlashcardDto: CreateFlashcardDto): Promise<Flashcard> {
    const flashcard = this.flashcardsRepository.create(createFlashcardDto);
    return this.flashcardsRepository.save(flashcard);
  }

  async findAll(deckId?: string): Promise<Flashcard[]> {
    if (deckId) {
      return this.flashcardsRepository.find({ where: { deck_id: deckId } });
    }
    return this.flashcardsRepository.find();
  }

  async findOne(id: string): Promise<Flashcard> {
    const flashcard = await this.flashcardsRepository.findOne({
      where: { id },
    });
    if (!flashcard) {
      throw new NotFoundException(`Flashcard with ID "${id}" not found`);
    }
    return flashcard;
  }

  async update(
    id: string,
    updateFlashcardDto: UpdateFlashcardDto,
  ): Promise<Flashcard> {
    const flashcard = await this.findOne(id);
    Object.assign(flashcard, updateFlashcardDto);
    return this.flashcardsRepository.save(flashcard);
  }

  async remove(id: string): Promise<void> {
    const result = await this.flashcardsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Flashcard with ID "${id}" not found`);
    }
  }
}
