import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';
export default class Location extends BaseModel {
    id: string;
    name: string;
    description: string;
    address: string;
    coordinates: any;
    category: string;
    imageUrl?: string;
    website?: string;
    phone?: string;
    email?: string;
    openingHours?: string;
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
            name: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            description: {
                type: string;
                minLength: number;
            };
            address: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            coordinates: {
                type: string;
            };
            category: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            imageUrl: {
                type: string[];
                maxLength: number;
            };
            website: {
                type: string[];
                maxLength: number;
            };
            phone: {
                type: string[];
                maxLength: number;
            };
            email: {
                type: string[];
                maxLength: number;
            };
            openingHours: {
                type: string[];
                maxLength: number;
            };
            is_active: {
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
        byCategory(builder: any, category: string): any;
        nearPoint(builder: any, lat: number, lng: number, radiusKm?: number): any;
        withinBoundingBox(builder: any, minLat: number, minLng: number, maxLat: number, maxLng: number): any;
    };
    get latitude(): number | null;
    get longitude(): number | null;
    get formattedCoordinates(): string;
    static findNearby(lat: number, lng: number, radiusKm?: number, category?: string): Promise<Location[]>;
    static findWithinBounds(minLat: number, minLng: number, maxLat: number, maxLng: number, category?: string): Promise<Location[]>;
    static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number>;
    static getCategories(): Promise<string[]>;
}
//# sourceMappingURL=Location.d.ts.map