"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class BaseModel extends objection_1.Model {
    $beforeInsert() {
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
    $beforeUpdate() {
        this.updatedAt = new Date().toISOString();
    }
}
exports.default = BaseModel;
//# sourceMappingURL=BaseModel.js.map