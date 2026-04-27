"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
class Location extends BaseModel_1.default {
    get latitude() {
        if (this.coordinates && typeof this.coordinates === 'object') {
            if ('y' in this.coordinates) {
                return this.coordinates.y;
            }
            if (typeof this.coordinates === 'string') {
                const match = this.coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
                if (match) {
                    return parseFloat(match[2]);
                }
            }
        }
        return null;
    }
    get longitude() {
        if (this.coordinates && typeof this.coordinates === 'object') {
            if ('x' in this.coordinates) {
                return this.coordinates.x;
            }
            if (typeof this.coordinates === 'string') {
                const match = this.coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
                if (match) {
                    return parseFloat(match[1]);
                }
            }
        }
        return null;
    }
    get formattedCoordinates() {
        const lat = this.latitude;
        const lng = this.longitude;
        return lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'N/A';
    }
    static async findNearby(lat, lng, radiusKm = 5, category) {
        let query = this.query()
            .modify('active')
            .modify('nearPoint', lat, lng, radiusKm)
            .withGraphFetched('[creator]');
        if (category) {
            query = query.modify('byCategory', category);
        }
        return await query.orderByRaw(`
      ST_Distance_Sphere(
        coordinates, 
        POINT(?, ?)
      )
    `, [lng, lat]);
    }
    static async findWithinBounds(minLat, minLng, maxLat, maxLng, category) {
        let query = this.query()
            .modify('active')
            .modify('withinBoundingBox', minLat, minLng, maxLat, maxLng)
            .withGraphFetched('[creator]');
        if (category) {
            query = query.modify('byCategory', category);
        }
        return await query;
    }
    static async calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
Location.tableName = 'locations';
Location.jsonSchema = {
    type: 'object',
    required: ['name', 'description', 'address', 'coordinates', 'category'],
    properties: {
        id: { type: 'string' },
        name: { type: 'string', minLength: 2, maxLength: 200 },
        description: { type: 'string', minLength: 10 },
        address: { type: 'string', minLength: 5, maxLength: 255 },
        coordinates: { type: 'object' },
        category: { type: 'string', minLength: 2, maxLength: 100 },
        imageUrl: { type: ['string', 'null'], maxLength: 255 },
        website: { type: ['string', 'null'], maxLength: 255 },
        phone: { type: ['string', 'null'], maxLength: 20 },
        email: { type: ['string', 'null'], maxLength: 255 },
        openingHours: { type: ['string', 'null'], maxLength: 255 },
        is_active: { type: 'boolean', default: true },
        createdBy: { type: 'string' },
        updatedBy: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
};
Location.relationMappings = {
    creator: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'locations.createdBy',
            to: 'users.id',
        },
    },
    updater: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'locations.updatedBy',
            to: 'users.id',
        },
    },
};
Location.modifiers = {
    active(builder) {
        return builder.where('is_active', true);
    },
    byCategory(builder, category) {
        return builder.where('category', category);
    },
    nearPoint(builder, lat, lng, radiusKm = 5) {
        return builder
            .whereRaw(`
          ST_Distance_Sphere(
            coordinates, 
            POINT(?, ?)
          ) <= ?
        `, [lng, lat, radiusKm * 1000]);
    },
    withinBoundingBox(builder, minLat, minLng, maxLat, maxLng) {
        return builder
            .whereRaw(`
          MBRContains(
            ST_Envelope(ST_GeomFromText('LINESTRING(? ?, ? ?)')),
            coordinates
          )
        `, [minLng, minLat, maxLng, maxLat]);
    },
};
exports.default = Location;
//# sourceMappingURL=Location.js.map