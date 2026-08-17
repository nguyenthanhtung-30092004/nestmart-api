import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class AddToCartDto {
    @Type(() => Number)
    @IsInt({message: 'Mã sản phẩm phải là số nguyên'})
    @IsNotEmpty({message: 'Mã sản phẩm không được để trống'})
    productId: number;

    @Type(() => Number)
    @IsInt({message: 'Số lượng phải là số nguyên'})
    @Min(1, {message: 'Số lượng phải thêm vào ít nhất là 1'})
    quantity: number
}