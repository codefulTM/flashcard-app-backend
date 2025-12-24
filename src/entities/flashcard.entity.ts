import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Deck } from './deck.entity';
import { FlashcardMedia } from './flashcard-media.entity';
import { ReviewLog } from './review-log.entity';

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  deck_id: string;

  @ManyToOne(() => Deck, (deck) => deck.flashcards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  deck: Deck;

  @Column('text')
  front_content: string;

  @Column('text')
  back_content: string;

  @Column('text', { nullable: true })
  hint: string;

  @Column('text', { nullable: true })
  mnemonic: string;

  @Column({ default: false })
  is_suspended: boolean;

  // Spaced Repetition Fields
  @Column({ type: 'timestamp', nullable: true })
  next_review_at: Date | null;

  @Column({ type: 'int', nullable: true })
  interval: number;

  @Column({ type: 'float', default: 2.5 })
  ease_factor: number;

  @Column({ default: 0 })
  repetitions: number;

  @Column({ default: 'new' })
  state: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => FlashcardMedia, (media) => media.flashcard)
  media: FlashcardMedia[];

  @OneToMany(() => ReviewLog, (log) => log.flashcard)
  reviewLogs: ReviewLog[];
}
