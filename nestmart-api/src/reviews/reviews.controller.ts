import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  addReview(@Req() req: any, @Body() body: CreateReviewDto) {
    return this.reviewService.addReview(req.user.userId, body);
  }

  @Get('stats/:productId')
  getProductStats(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewService.getProductStats(productId);
  }
}
