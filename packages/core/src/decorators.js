"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = Resource;
exports.Col = Col;
exports.Deny = Deny;
exports.Readonly = Readonly;
exports.Hidden = Hidden;
exports.Searchable = Searchable;
exports.Ignore = Ignore;
exports.AdminOnly = AdminOnly;
require("reflect-metadata");
const tokens_1 = require("./tokens");
// ── @Resource(name, options) ── class decorator ──
function Resource(name, options = {}) {
    return (target) => {
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target.prototype) ?? {};
        const nextFields = { ...fields };
        if (options.softDelete) {
            nextFields.deletedAt = {
                key: 'deletedAt',
                type: 'Date',
                ...(nextFields.deletedAt ?? {}),
            };
        }
        const meta = {
            name,
            operations: options.operations ?? ['create', 'list', 'get', 'update', 'remove'],
            guardTokens: options.guardTokens,
            pagination: options.pagination ?? { max: 100 },
            softDelete: options.softDelete ?? false,
            cache: options.cache,
            fields: nextFields,
        };
        Reflect.defineMetadata(tokens_1.FIELDS_META, nextFields, target.prototype);
        Reflect.defineMetadata(tokens_1.RESOURCE_META, meta, target);
    };
}
// ── @Col(options) ── property decorator ──
function Col(options = {}) {
    return (target, key) => {
        const type = Reflect.getMetadata('design:type', target, key);
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
        fields[key] = {
            ...(fields[key] ?? {}),
            key: key,
            type: type?.name ?? 'any',
            ...options,
        };
        Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
    };
}
// ── @Deny(..operations) ── property decorator ──
function Deny(...operations) {
    return (target, key) => {
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
        const f = fields[key] ?? { key: key, type: 'any' };
        f.deny = [...(f.deny ?? []), ...operations];
        fields[key] = f;
        Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
    };
}
// ── @Readonly() ── shorthand for @Deny('create','update')
function Readonly() {
    return Deny('create', 'update');
}
// ── @Hidden(..views) ── omit from response
function Hidden(...views) {
    return (target, key) => {
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
        const f = fields[key] ?? { key: key, type: 'any' };
        f.hidden = [...(f.hidden ?? []), ...views];
        fields[key] = f;
        Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
    };
}
// ── @Searchable() ── property decorator ──
function Searchable() {
    return (target, key) => {
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
        const f = fields[key] ?? { key: key, type: 'any' };
        f.searchable = true;
        fields[key] = f;
        Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
    };
}
// ── @Ignore() ── completely exclude from CRUD
function Ignore() {
    return (target, key) => {
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
        const f = fields[key] ?? { key: key, type: 'any' };
        f.ignore = true;
        fields[key] = f;
        Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
    };
}
// ── @AdminOnly(..operations) ──
function AdminOnly(...operations) {
    return (target, key) => {
        const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
        const f = fields[key] ?? { key: key, type: 'any' };
        f.adminOnly = operations;
        fields[key] = f;
        Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
    };
}
//# sourceMappingURL=decorators.js.map
