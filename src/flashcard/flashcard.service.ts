import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Flashcard } from '../entities/flashcard.entity';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(Flashcard)
    private flashcardsRepository: Repository<Flashcard>,
    private configService: ConfigService,
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

  async generate(deckId: string, frontContent: string): Promise<Flashcard> {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY'),
    );
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });

    const prompt = `You are a flashcard generator. Your task is to create informative back content using simple language for a given front content.
The back content should primarily focus on providing dictionary definitions for the key term(s) or concept(s) presented in the front content.
If applicable, include a brief example or context to aid understanding.
Format the definitions clearly, perhaps using bullet points or numbered lists.
Reply with nothing more than the back content, ensuring it's ready for a flashcard.

Front: ${frontContent}
Back: `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const backContent = response.text();

    return this.create({
      deck_id: deckId,
      front_content: frontContent,
      back_content: backContent,
    });
  }
}
