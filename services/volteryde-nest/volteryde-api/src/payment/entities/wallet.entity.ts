import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
} from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('wallets')
export class Wallet {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'user_id', unique: true })
	userId: string; // Firebase UID

	@Column('decimal', { precision: 15, scale: 2, default: 0 })
	balance: number;

	@Column({ default: 'GHS' })
	currency: string;

	@OneToMany(() => Transaction, (transaction) => transaction.wallet)
	transactions: Transaction[];

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
