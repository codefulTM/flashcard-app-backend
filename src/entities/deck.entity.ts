import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Flashcard } from './flashcard.entity';
import { Tag } from './tag.entity';

@Entity('decks')
export class Deck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, (user) => user.decks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: false })
  is_public: boolean;

  @Column({ default: 20 })
  cards_per_session: number;

  @Column({ default: false })
  is_custom_study: boolean;

  @Column('uuid', { nullable: true })
  source_deck_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Flashcard, (flashcard) => flashcard.deck)
  flashcards: Flashcard[];

  @ManyToMany(() => Tag, (tag) => tag.decks)
  @JoinTable({
    name: 'deck_tags',
    joinColumn: { name: 'deck_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
