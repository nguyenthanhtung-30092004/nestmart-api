import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  content: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Điểm thấp nhất là 1 sao' })
  @Max(5, { message: 'Điểm cao nhất là 5 sao' })
  rating: number;
}
