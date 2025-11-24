import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Flashcard } from '../entities/flashcard.entity';
import { ReviewLog } from '../entities/review-log.entity';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ReviewFlashcardDto } from './dto/review-flashcard.dto';
import { calculateSM2, ratingToQuality } from '../utils/sm2.algorithm';

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(Flashcard)
    private flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(ReviewLog)
    private reviewLogsRepository: Repository<ReviewLog>,
    private configService: ConfigService,
  ) {}

  async create(createFlashcardDto: CreateFlashcardDto): Promise<Flashcard> {
    const flashcard = this.flashcardsRepository.create(createFlashcardDto);
    return this.flashcardsRepository.save(flashcard);
  }

  async findAll(
    deckId?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: Flashcard[]; total: number }> {
    const skip = (page - 1) * limit;
    const { ILike } = require('typeorm');

    const where: any = {};
    if (deckId) {
      where.deck_id = deckId;
    }
    if (search) {
      where.front_content = ILike(`%${search}%`);
    }

    const [data, total] = await this.flashcardsRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total };
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

  async review(
    id: string,
    userId: string,
    reviewDto: ReviewFlashcardDto,
  ): Promise<Flashcard> {
    const flashcard = await this.findOne(id);

    // Convert rating (1-4) to SM-2 quality (0-5)
    const quality = ratingToQuality(reviewDto.rating);

    // Calculate new values using SM-2 algorithm
    const sm2Result = calculateSM2({
      quality,
      repetitions: flashcard.repetitions,
      easeFactor: flashcard.ease_factor,
      interval: flashcard.interval || 0,
    });

    // Update flashcard with new values
    flashcard.interval = sm2Result.interval;
    flashcard.repetitions = sm2Result.repetitions;
    flashcard.ease_factor = sm2Result.easeFactor;
    flashcard.next_review_at = sm2Result.nextReviewDate;
    flashcard.state = sm2Result.state;

    // Save review log
    const reviewLog = this.reviewLogsRepository.create({
      user_id: userId,
      flashcard_id: id,
      rating: reviewDto.rating,
      time_taken_ms: reviewDto.timeTakenMs || 0,
    });
    await this.reviewLogsRepository.save(reviewLog);

    // Save and return updated flashcard
    return this.flashcardsRepository.save(flashcard);
  }

  async getDueFlashcards(
    deckId: string,
    limit: number = 20,
  ): Promise<Flashcard[]> {
    const now = new Date();
    // now.setHours(0, 0, 0, 0); // Removed to support intraday reviews

    return this.flashcardsRepository
      .createQueryBuilder('flashcard')
      .where('flashcard.deck_id = :deckId', { deckId })
      .andWhere('flashcard.is_suspended = :isSuspended', { isSuspended: false })
      .andWhere(
        '(flashcard.next_review_at IS NULL OR flashcard.next_review_at <= :now)',
        { now },
      )
      .orderBy('flashcard.next_review_at', 'ASC', 'NULLS FIRST')
      .addOrderBy('flashcard.created_at', 'ASC')
      .limit(limit)
      .getMany();
  }
}
