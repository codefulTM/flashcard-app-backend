import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Deck } from './deck.entity';
import { UserSetting } from './user-setting.entity';
import { ReviewLog } from './review-log.entity';
import { AiChatSession } from './ai-chat-session.entity';
import { Tag } from './tag.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Deck, (deck) => deck.user)
  decks: Deck[];

  @OneToOne(() => UserSetting, (setting) => setting.user)
  settings: UserSetting;

  @OneToMany(() => ReviewLog, (log) => log.user)
  reviewLogs: ReviewLog[];

  @OneToMany(() => AiChatSession, (session) => session.user)
  aiChatSessions: AiChatSession[];

  @OneToMany(() => Tag, (tag) => tag.user)
  tags: Tag[];
}
