import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Flashcard } from './flashcard.entity';

@Entity('flashcard_media')
export class FlashcardMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  flashcard_id: string;

  @ManyToOne(() => Flashcard, (flashcard) => flashcard.media)
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;

  @Column()
  type: string; // image/audio

  @Column()
  url: string;

  @Column()
  side: string; // front/back

  @CreateDateColumn()
  created_at: Date;
}
