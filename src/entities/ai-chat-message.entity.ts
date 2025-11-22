import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AiChatSession } from './ai-chat-session.entity';

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  session_id: string;

  @ManyToOne(() => AiChatSession, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: AiChatSession;

  @Column()
  role: string; // user/assistant

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
