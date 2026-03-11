"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceMeta = getResourceMeta;
exports.getFieldsMeta = getFieldsMeta;
require("reflect-metadata");
const tokens_1 = require("./tokens");
function getResourceMeta(entity) {
    return Reflect.getMetadata(tokens_1.RESOURCE_META, entity);
}
function getFieldsMeta(entity) {
    return Reflect.getMetadata(tokens_1.FIELDS_META, entity.prototype) ?? {};
}
//# sourceMappingURL=utils.js.map