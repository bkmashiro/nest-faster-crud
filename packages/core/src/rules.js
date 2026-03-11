"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
require("reflect-metadata");
const tokens_1 = require("./tokens");
var Rule;
(function (Rule) {
    function required(message) {
        return addRule({ kind: 'required', message });
    }
    Rule.required = required;
    function length(min, max, message) {
        return addRule({ kind: 'length', params: { min, max }, message });
    }
    Rule.length = length;
    function range(min, max, message) {
        return addRule({ kind: 'range', params: { min, max }, message });
    }
    Rule.range = range;
    function email(message) {
        return addRule({ kind: 'email', message });
    }
    Rule.email = email;
    function pattern(regex, message) {
        return addRule({ kind: 'pattern', params: { source: regex.source, flags: regex.flags }, message });
    }
    Rule.pattern = pattern;
    function addRule(rule) {
        return (target, key) => {
            const fields = Reflect.getMetadata(tokens_1.FIELDS_META, target) ?? {};
            const f = fields[key] ?? { key: key, type: 'any' };
            f.rules = [...(f.rules ?? []), rule];
            fields[key] = f;
            Reflect.defineMetadata(tokens_1.FIELDS_META, fields, target);
        };
    }
})(Rule || (exports.Rule = Rule = {}));
//# sourceMappingURL=rules.js.map