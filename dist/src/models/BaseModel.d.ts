import { Model } from 'objection';
export default class BaseModel extends Model {
    createdAt: string;
    updatedAt: string;
    $beforeInsert(): void;
    $beforeUpdate(): void;
}
//# sourceMappingURL=BaseModel.d.ts.map