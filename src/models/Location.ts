import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';

export default class Location extends BaseModel {
  id!: string;
  name!: string;
  description!: string;
  address!: string;
  coordinates!: any; // PostGIS geography point
  category!: string;
  imageUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  isActive!: boolean;
  createdBy!: string;
  updatedBy?: string;

  static tableName = 'locations';

  static jsonSchema = {
    type: 'object',
    required: ['name', 'description', 'address', 'coordinates', 'category'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 200 },
      description: { type: 'string', minLength: 10 },
      address: { type: 'string', minLength: 5, maxLength: 255 },
      coordinates: { type: 'object' }, // PostGIS geography
      category: { type: 'string', minLength: 2, maxLength: 100 },
      imageUrl: { type: ['string', 'null'], maxLength: 255 },
      website: { type: ['string', 'null'], maxLength: 255 },
      phone: { type: ['string', 'null'], maxLength: 20 },
      email: { type: ['string', 'null'], maxLength: 255 },
      openingHours: { type: ['string', 'null'], maxLength: 255 },
      isActive: { type: 'boolean', default: true },
      createdBy: { type: 'string' },
      updatedBy: { type: ['string', 'null'] },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
    },
  };

  static relationMappings: RelationMappings = {
    creator: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'locations.createdBy',
        to: 'users.id',
      },
    },
    updater: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'locations.updatedBy',
        to: 'users.id',
      },
    },
  };

  static modifiers = {
    active(builder: any) {
      return builder.where('isActive', true);
    },
    byCategory(builder: any, category: string) {
      return builder.where('category', category);
    },
    nearPoint(builder: any, lat: number, lng: number, radiusKm: number = 5) {
      return builder
        .whereRaw(`
          ST_DWithin(
            coordinates, 
            ST_MakePoint(?, ?)::geography, 
            ?
          )
        `, [lng, lat, radiusKm * 1000]); // Convert km to meters
    },
    withinBoundingBox(builder: any, minLat: number, minLng: number, maxLat: number, maxLng: number) {
      return builder
        .whereRaw(`
          ST_Within(
            coordinates,
            ST_MakeEnvelope(?, ?, ?, ?, 4326)
          )
        `, [minLng, minLat, maxLng, maxLat]);
    },
  };

  // Virtual properties
  get latitude(): number | null {
    if (this.coordinates && typeof this.coordinates === 'object' && 'y' in this.coordinates) {
      return this.coordinates.y;
    }
    return null;
  }

  get longitude(): number | null {
    if (this.coordinates && typeof this.coordinates === 'object' && 'x' in this.coordinates) {
      return this.coordinates.x;
    }
    return null;
  }

  get formattedCoordinates(): string {
    const lat = this.latitude;
    const lng = this.longitude;
    return lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'N/A';
  }

  // Static methods for spatial queries
  static async findNearby(lat: number, lng: number, radiusKm: number = 5, category?: string) {
    let query = this.query()
      .modify('active')
      .modify('nearPoint', lat, lng, radiusKm)
      .withGraphFetched('[creator]');

    if (category) {
      query = query.modify('byCategory', category);
    }

    return await query.orderByRaw(`
      ST_Distance(
        coordinates, 
        ST_MakePoint(?, ?)::geography
      )
    `, [lng, lat]);
  }

  static async findWithinBounds(minLat: number, minLng: number, maxLat: number, maxLng: number, category?: string) {
    let query = this.query()
      .modify('active')
      .modify('withinBoundingBox', minLat, minLng, maxLat, maxLng)
      .withGraphFetched('[creator]');

    if (category) {
      query = query.modify('byCategory', category);
    }

    return await query;
  }

  static async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    // Use Haversine formula as fallback for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static async getCategories() {
    const categories = await this.query()
      .select('category')
      .where('isActive', true)
      .groupBy('category')
      .orderBy('category');

    return categories.map(cat => cat.category);
  }
}
