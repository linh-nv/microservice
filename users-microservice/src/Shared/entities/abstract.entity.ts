import {BaseEntity, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn} from "typeorm";

/**
 * Represents an abstract entity that serves as the base class for other entities.
 * @extends BaseEntity
 */
export abstract class AbstractEntity extends BaseEntity {

    @Column({name: 'created_by', length: 64, type: "varchar", default: 'system'})
    createdBy?: string;

    @CreateDateColumn({name: 'created_at', type: "datetime"})
    createdAt?: Date;

    @Column({name: 'updated_by', length: 64, type: "varchar", default: 'system'})
    updatedBy?: string;

    @UpdateDateColumn({name: 'updated_at', type: "datetime"})
    updatedAt?: Date;

    @DeleteDateColumn({name: 'deleted_at', type: "datetime"})
    deletedAt?: Date;
}