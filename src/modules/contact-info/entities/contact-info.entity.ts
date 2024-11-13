import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/modules/user/entities/user.entity';

@Entity()
export class ContactInfo {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @ManyToOne(() => User, (user) => user.contactInfos, { onDelete: 'CASCADE' })
  @JoinColumn()
  owner: User;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ default: '' })
  firstName: string;

  @ApiProperty()
  @Column({ default: '' })
  midName: string;

  @ApiProperty()
  @Column({ default: '' })
  lastName: string;

  @ApiProperty()
  @Column({ default: '' })
  street: string;

  @ApiProperty()
  @Column({ default: '' })
  city: string;

  @ApiProperty()
  @Column({ default: '' })
  postalCode: string;

  @ApiProperty()
  @Column({ default: '' })
  country: string;

  @ApiProperty()
  @Column({ default: '' })
  email: string;

  @ApiProperty()
  @Column({ default: '' })
  phoneNumber: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @ApiProperty()
  deletedAt?: Date;
}
