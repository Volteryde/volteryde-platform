import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionStatus {
	PENDING = 'PENDING',
	SUCCESS = 'SUCCESS',
	FAILED = 'FAILED',
	ABANDONED = 'ABANDONED',
}

export enum TransactionType {
	CREDIT = 'CREDIT',
	DEBIT = 'DEBIT',
}

@Entity('transactions')
export class Transaction {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Wallet, (wallet) => wallet.transactions)
	@JoinColumn({ name: 'wallet_id' })
	wallet: Wallet;

	@Column('decimal', { precision: 15, scale: 2 })
	amount: number;

	@Index({ unique: true })
	@Column({ unique: true })
	reference: string;

	@Column({ name: 'external_reference', nullable: true })
	externalReference: string; // Paystack reference

	@Column({
		type: 'enum',
		enum: TransactionStatus,
		default: TransactionStatus.PENDING,
	})
	status: TransactionStatus;

	@Column({
		type: 'enum',
		enum: TransactionType,
	})
	type: TransactionType;

	@Column('jsonb', { nullable: true })
	metadata: any;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
