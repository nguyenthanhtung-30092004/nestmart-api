import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService){}

    // 1. Thêm sản phẩm vào giỏ hàng
    async addToCart(userId: number, dto: AddToCartDto){
        const {productId, quantity} = dto;

        // Bước A: Kiểm tra xem sản phẩm có tồn tại trong DB không
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId
            }
        })

        if(!product) throw new NotFoundException(`Không tìm thấy sản phẩm với ID = ${productId}`)

        // Bước B: Tìm giỏ hàng của User, nếu chưa có thì tự động tạo mới (upsert)
        const cart = await this.prisma.cart.upsert({
            where: {
                userId
            },
            update: {}, // nếu có rồi thì giữ nguyên
            create: {userId}
        })

        // Bước C: Kiểm tra xem Món hàng này đã nằm trong giỏ hàng chưa?
        const existingCartItem = await this.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id
                ,productId
            }
        })

        if(existingCartItem) {
            // C1: NẾu đã có món này -> Cộng dồn số lượng
            return await this.prisma.cartItem.update({
                where: {id: existingCartItem.id},
                data: {quantity: existingCartItem.quantity + quantity}
            })
        }
        else {
            // C2: Nếu chưa có món này -> Tạo mới CartItem (Insert)
            return await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity
                }
            })
        }
    }

    // 2. Lấy chi tiết giỏ hàng & tự động tính tổng tiền
    async getCart(userId: number){
        const cart = await this.prisma.cart.findUnique({
            where: {userId},
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if(!cart){
            return {
                id: null,
                items: [],
                totalAmount: 0
            }
        }

        // Backend tự động nhân giá và tính tổng tiền giỏ hàng
        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + item.quantity * item.product.price
        }, 0)

        return {
            ...cart,
            totalAmount,
        }
    }

    async removeItem(userId: number, cartItemId: number){
        // Kiểm tra xem món hàng này có thuộc về giỏ hàng của chính User này không
        const cartItem = await this.prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                cart: {userId}
            }
        })

        if(!cartItem) throw new NotFoundException('Không tìm thấy món hàng này trong giỏ của bạn')

        await this.prisma.cartItem.delete({
            where: {id: cartItemId}
        })

        return { message: 'Đã xóa sản phẩm khỏi giỏ hàng'}
    }

}
