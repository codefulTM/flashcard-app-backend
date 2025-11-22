import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, ManyToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Deck } from './deck.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, (user) => user.tags)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @ManyToMany(() => Deck, (deck) => deck.tags)
  decks: Deck[];
}
