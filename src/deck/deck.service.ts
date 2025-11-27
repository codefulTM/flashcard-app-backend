import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deck } from '../entities/deck.entity';
import { Flashcard } from '../entities/flashcard.entity';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Injectable()
export class DeckService {
  constructor(
    @InjectRepository(Deck)
    private decksRepository: Repository<Deck>,
    @InjectRepository(Flashcard)
    private flashcardsRepository: Repository<Flashcard>,
  ) {}

  async create(createDeckDto: CreateDeckDto, userId: string): Promise<Deck> {
    const deck = this.decksRepository.create({
      ...createDeckDto,
      user_id: userId,
    });
    return this.decksRepository.save(deck);
  }

  async findAll(userId: string): Promise<any[]> {
    const decks = await this.decksRepository
      .createQueryBuilder('deck')
      .leftJoin('deck.flashcards', 'flashcard')
      .select('deck.*')
      .addSelect('MIN(flashcard.next_review_at)', 'next_review_at')
      .where('deck.user_id = :userId', { userId })
      .groupBy('deck.id')
      .getRawMany();

    // Map raw results to a cleaner structure if needed, or return as is.
    // getRawMany returns snake_case column names usually.
    return decks.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      is_public: d.is_public,
      cards_per_session: d.cards_per_session,
      user_id: d.user_id,
      created_at: d.created_at,
      updated_at: d.updated_at,
      next_review_at: d.next_review_at,
      is_custom_study: d.is_custom_study,
      source_deck_id: d.source_deck_id,
    }));
  }

  async findOne(id: string): Promise<any> {
    const deck = await this.decksRepository
      .createQueryBuilder('deck')
      .leftJoin('deck.flashcards', 'flashcard')
      .select('deck.*')
      .addSelect('MIN(flashcard.next_review_at)', 'next_review_at')
      .where('deck.id = :id', { id })
      .groupBy('deck.id')
      .getRawOne();

    if (!deck) {
      throw new NotFoundException(`Deck with ID "${id}" not found`);
    }

    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      is_public: deck.is_public,
      cards_per_session: deck.cards_per_session,
      user_id: deck.user_id,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
      next_review_at: deck.next_review_at,
      is_custom_study: deck.is_custom_study,
      source_deck_id: deck.source_deck_id,
    };
  }

  async update(id: string, updateDeckDto: UpdateDeckDto): Promise<Deck> {
    const deck = await this.findOne(id);
    Object.assign(deck, updateDeckDto);
    return this.decksRepository.save(deck);
  }

  async remove(id: string): Promise<void> {
    const result = await this.decksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Deck with ID "${id}" not found`);
    }
  }

  async createCustomStudyDeck(
    sourceDeckId: string,
    userId: string,
    days: number,
  ): Promise<Deck> {
    // Verify source deck exists and belongs to user
    const sourceDeck = await this.decksRepository.findOne({
      where: { id: sourceDeckId, user_id: userId },
    });

    if (!sourceDeck) {
      throw new NotFoundException(
        `Source deck with ID "${sourceDeckId}" not found`,
      );
    }

    // Calculate date range
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Find flashcards due within the date range
    const flashcards = await this.flashcardsRepository
      .createQueryBuilder('flashcard')
      .where('flashcard.deck_id = :deckId', { deckId: sourceDeckId })
      .andWhere('flashcard.is_suspended = :isSuspended', { isSuspended: false })
      .andWhere(
        '(flashcard.next_review_at IS NULL OR flashcard.next_review_at <= :endDate)',
        { endDate },
      )
      .orderBy('flashcard.next_review_at', 'ASC', 'NULLS FIRST')
      .getMany();

    if (flashcards.length === 0) {
      throw new NotFoundException(
        `No flashcards found for custom study in the next ${days} day(s)`,
      );
    }

    // Create custom study deck
    const customDeck = this.decksRepository.create({
      name: `Custom Study: ${sourceDeck.name} (${days}d)`,
      description: `Custom study session for ${sourceDeck.name} - cards due in next ${days} day(s)`,
      user_id: userId,
      is_custom_study: true,
      source_deck_id: sourceDeckId,
      cards_per_session: flashcards.length,
    });

    const savedDeck = await this.decksRepository.save(customDeck);

    // Copy flashcards to the new deck
    const copiedFlashcards = flashcards.map((fc) =>
      this.flashcardsRepository.create({
        deck_id: savedDeck.id,
        front_content: fc.front_content,
        back_content: fc.back_content,
        hint: fc.hint,
        mnemonic: fc.mnemonic,
        next_review_at: new Date(),
        interval: 1,
        ease_factor: 2.5,
        repetitions: 0,
        state: 'due',
      }),
    );

    await this.flashcardsRepository.save(copiedFlashcards);

    return savedDeck;
  }
}
