import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSetting {
  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, (user) => user.settings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'light' })
  theme: string;

  @Column('json', { nullable: true })
  card_appearance: any;

  @Column({ default: 20 })
  daily_card_goal: number;

  @UpdateDateColumn()
  updated_at: Date;
}
