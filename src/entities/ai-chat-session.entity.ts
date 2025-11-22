import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Column } from 'typeorm';
import { User } from './user.entity';
import { AiChatMessage } from './ai-chat-message.entity';

@Entity('ai_chat_sessions')
export class AiChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, (user) => user.aiChatSessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => AiChatMessage, (message) => message.session)
  messages: AiChatMessage[];
}
