import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deck } from '../entities/deck.entity';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Injectable()
export class DeckService {
  constructor(
    @InjectRepository(Deck)
    private decksRepository: Repository<Deck>,
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
}
