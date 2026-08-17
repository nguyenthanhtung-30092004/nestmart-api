import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Khách hàng thêm đánh giá
  async addReview(userId: number, dto: CreateReviewDto) {
    const productExists = await this.prisma.product.findUnique({
      where: {
        id: dto.productId,
      },
    });

    if (!productExists) throw new NotFoundException('Sản phẩm không tồn tại');

    return await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        content: dto.content,
        rating: dto.rating,
      },
    });
  }

  // 2. Tính điểm trung bình
  async getProductStats(productId: number) {
    // Yêu cầu DB gộp nhóm (aggregate) để tính trung bình (_avg) và Đếm tổng (_count)

    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true, // đếm xem có bao nhiêu dòng review
      },
    });

    return {
      productId,
      averageRating: stats._avg.rating
        ? Number(stats._avg.rating.toFixed(1))
        : 0,
      totalReview: stats._count.id,
    };
  }
}
