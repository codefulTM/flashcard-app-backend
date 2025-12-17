import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Flashcard } from '../entities/flashcard.entity';
import { Deck } from '../entities/deck.entity';
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
    @InjectRepository(Deck)
    private decksRepository: Repository<Deck>,
    @InjectRepository(ReviewLog)
    private reviewLogsRepository: Repository<ReviewLog>,
    private configService: ConfigService,
  ) { }

  async create(createFlashcardDto: CreateFlashcardDto): Promise<Flashcard> {
    const flashcard = this.flashcardsRepository.create({
      ...createFlashcardDto,
      next_review_at: new Date(), // Set to current time so it's immediately available for review
    });
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

  async generate(
    deckId: string,
    frontContent: string,
    customPrompt?: string,
  ): Promise<Flashcard> {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY'),
    );
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });

    const defaultPrompt = `You are an expert flashcard content creator. Your task is to generate concise, informative, and easy-to-understand back content for a flashcard, based on the provided front content.

Instructions:
1.  **Primary Focus**: Provide clear dictionary definitions for the key term(s) or concept(s) presented in the front content.
2.  **Language**: Use simple language suitable for learning.
3.  **Vietnamese Translation**: For each defined term or concept, include its Vietnamese translation.
4.  **Context/Example**: If applicable and helpful, include a brief, straightforward example or additional context to enhance understanding.
5.  **Formatting**:
    *   Use Markdown for clear formatting (e.g., bullet points for definitions, bolding for key terms).
    *   Ensure definitions are distinct and easy to read.
6.  **Output**: Reply with nothing more than the back content of the flashcard. Do not include any introductory phrases, conversational text, or concluding remarks. The output should be ready to be displayed directly on a flashcard.

Front: ${frontContent}
Back: `;

    const finalPrompt = customPrompt
      ? `${customPrompt}\n\nFront: ${frontContent}\nBack: `
      : defaultPrompt;

    const result = await model.generateContent(finalPrompt);
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
    limit?: number,
  ): Promise<Flashcard[]> {
    // Get deck configuration
    const deck = await this.decksRepository.findOne({
      where: { id: deckId },
    });
    console.log(deck?.id);

    if (!deck) {
      throw new NotFoundException(`Deck with ID "${deckId}" not found`);
    }

    // Use deck settings or fallback to provided limit or defaults
    const reviewLimit = limit ?? deck.review_cards_per_session ?? 20;
    console.log(reviewLimit);
    const learnLimit = limit ?? deck.learn_cards_per_session ?? 10;
    console.log(learnLimit);
    const now = new Date();
    // Calculate cutoff date based on deck settings
    // If custom study deck, use custom_study_days (default to 1 if not set)
    // If regular deck, use 1 day (24 hours)
    const lookaheadDays = deck.is_custom_study
      ? deck.custom_study_days || 1
      : 1;

    const nextDue = new Date(now.getTime() + lookaheadDays * 24 * 60 * 60 * 1000);
    // Fetch review cards (cards that have been studied before, repetitions > 0)
    const reviewQuery = this.flashcardsRepository
      .createQueryBuilder('flashcard')
      .where('flashcard.deck_id = :deckId', { deckId })
      .andWhere('flashcard.is_suspended = :isSuspended', { isSuspended: false })
      .andWhere('flashcard.repetitions > :repetitions', { repetitions: 0 })
      .andWhere(
        '(flashcard.next_review_at IS NULL OR flashcard.next_review_at <= :nextDue)',
        { nextDue },
      )
      .orderBy('flashcard.next_review_at', 'ASC', 'NULLS FIRST')
      .addOrderBy('flashcard.created_at', 'ASC')
      .limit(reviewLimit);

    console.log('Review Cards Query:', reviewQuery.getSql());
    console.log('Review Cards Query Parameters:', reviewQuery.getParameters());

    const reviewCards = await reviewQuery.getMany();



    // Fetch learn cards (new cards that haven't been studied, repetitions = 0)
    const learnCards = await this.flashcardsRepository
      .createQueryBuilder('flashcard')
      .where('flashcard.deck_id = :deckId', { deckId })
      .andWhere('flashcard.is_suspended = :isSuspended', { isSuspended: false })
      .andWhere('flashcard.repetitions = :repetitions', { repetitions: 0 })
      .andWhere(
        '(flashcard.next_review_at IS NULL OR flashcard.next_review_at <= :nextDue)',
        { nextDue },
      )
      .orderBy('flashcard.created_at', 'ASC')
      .limit(learnLimit)
      .getMany();

    // Combine review cards and learn cards
    // Review cards first, then learn cards (this mimics Anki's behavior)
    return [...reviewCards, ...learnCards];
  }
}
