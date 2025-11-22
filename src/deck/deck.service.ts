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

  async findAll(userId: string): Promise<Deck[]> {
    return this.decksRepository.find({ where: { user_id: userId } });
  }

  async findOne(id: string): Promise<Deck> {
    const deck = await this.decksRepository.findOne({ where: { id } });
    if (!deck) {
      throw new NotFoundException(`Deck with ID "${id}" not found`);
    }
    return deck;
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
