import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Giá tiền không được nhỏ hơn 0' })
  price: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'ID Danh mục phải là số' })
  @Min(1, { message: 'ID danh mục k hợp lệ' })
  categoryId: number;
}
