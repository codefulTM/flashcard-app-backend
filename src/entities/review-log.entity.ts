import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Flashcard } from './flashcard.entity';

@Entity('review_logs')
export class ReviewLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, (user) => user.reviewLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  flashcard_id: string;

  @ManyToOne(() => Flashcard, (flashcard) => flashcard.reviewLogs)
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;

  @Column()
  rating: number; // 1=Again, 2=Hard, 3=Good, 4=Easy

  @Column()
  time_taken_ms: number;

  @CreateDateColumn()
  reviewed_at: Date;
}
