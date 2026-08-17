import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartService } from './cart.service';

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService){}

    @Post()
    addToCart(@Req() req: any, @Body() dto: AddToCartDto){
        return this.cartService.addToCart(req.user.userId, dto);
    }

    @Get()
    getCart(@Req() req: any){
        return this.cartService.getCart(req.user.userId);
    }

    @Delete(':itemId')
    removeItem(@Req() req: any, @Param('itemId', ParseIntPipe) itemId: number){
        return this.cartService.removeItem(req.user.userId, itemId);
    }
}
