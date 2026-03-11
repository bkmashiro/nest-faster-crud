import 'reflect-metadata';
export declare namespace Rule {
    function required(message?: string): PropertyDecorator;
    function length(min: number, max: number, message?: string): PropertyDecorator;
    function range(min: number, max: number, message?: string): PropertyDecorator;
    function email(message?: string): PropertyDecorator;
    function pattern(regex: RegExp, message?: string): PropertyDecorator;
}
//# sourceMappingURL=rules.d.ts.map