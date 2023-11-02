import { IsOptional, IsPositive } from "@nestjs/class-validator";

export class PaginationQueryDto {
    @IsOptional()
    @IsPositive()
    limit?: number;

    @IsOptional()
    @IsPositive()
    offset?: number;
}