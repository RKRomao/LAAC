import Location from '../models/Location';
export interface CreateLocationData {
    name: string;
    description: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    category: string;
    imageUrl?: string;
    website?: string;
    phone?: string;
    email?: string;
    openingHours?: string;
}
export interface UpdateLocationData {
    name?: string;
    description?: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    category?: string;
    imageUrl?: string;
    website?: string;
    phone?: string;
    email?: string;
    openingHours?: string;
    isActive?: boolean;
}
export interface LocationQuery {
    category?: string;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minLat?: number;
    minLng?: number;
    maxLat?: number;
    maxLng?: number;
    page?: number;
    limit?: number;
}
declare class LocationService {
    getAllLocations(query?: LocationQuery): Promise<{
        data: {
            distance: number;
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
            createdAt: string;
            updatedAt: string;
            $modelClass: import("objection").ModelClass<Location>;
            QueryBuilderType: import("objection").QueryBuilder<Location, Location[]>;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    } | {
        data: Location[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getLocationById(id: string): Promise<Location>;
    createLocation(data: CreateLocationData, userId: string): Promise<Location | undefined>;
    updateLocation(id: string, data: UpdateLocationData, userId: string): Promise<Location | undefined>;
    deleteLocation(id: string): Promise<void>;
    getCategories(): Promise<string[]>;
    findNearby(lat: number, lng: number, radiusKm?: number, category?: string): Promise<{
        distance: number;
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
        createdAt: string;
        updatedAt: string;
        $modelClass: import("objection").ModelClass<Location>;
        QueryBuilderType: import("objection").QueryBuilder<Location, Location[]>;
    }[]>;
    findWithinBounds(minLat: number, minLng: number, maxLat: number, maxLng: number, category?: string): Promise<Location[]>;
    searchLocations(searchTerm: string, limit?: number, category?: string): Promise<Location[]>;
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number>;
}
declare const _default: LocationService;
export default _default;
//# sourceMappingURL=locationService.d.ts.map