import 'reflect-metadata';
import { ColOptions, CrudOperation, ResourceMeta } from './types';
export declare function Resource(name: string, options?: Partial<Omit<ResourceMeta, 'name' | 'fields'>>): ClassDecorator;
export declare function Col(options?: ColOptions): PropertyDecorator;
export declare function Deny(...operations: CrudOperation[]): PropertyDecorator;
export declare function Readonly(): PropertyDecorator;
export declare function Hidden(...views: ('list' | 'get')[]): PropertyDecorator;
export declare function Searchable(): PropertyDecorator;
export declare function Ignore(): PropertyDecorator;
export declare function AdminOnly(...operations: CrudOperation[]): PropertyDecorator;
//# sourceMappingURL=decorators.d.ts.map