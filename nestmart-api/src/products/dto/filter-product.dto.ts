import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class FilterProductDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1 // Mặc định trang 1 nếu client không truyền

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10 // mặc định 10 sản phẩm / trang

    @IsOptional()
    @IsString()
    search?: string // từ khóa tìm kiếm

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    categoryId?: number  // lọc theo danh mục cụ thể
}