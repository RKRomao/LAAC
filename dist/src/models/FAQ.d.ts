import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';
export default class FAQ extends BaseModel {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    isActive: boolean;
    createdBy: string;
    updatedBy?: string;
    static tableName: string;
    static jsonSchema: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            question: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            answer: {
                type: string;
                minLength: number;
            };
            category: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            order: {
                type: string;
                minimum: number;
                default: number;
            };
            isActive: {
                type: string;
                default: boolean;
            };
            createdBy: {
                type: string;
            };
            updatedBy: {
                type: string[];
            };
            createdAt: {
                type: string;
            };
            updatedAt: {
                type: string;
            };
        };
    };
    static relationMappings: RelationMappings;
    static modifiers: {
        active(builder: any): any;
        ordered(builder: any): any;
        byCategory(builder: any, category: string): any;
    };
}
//# sourceMappingURL=FAQ.d.ts.map