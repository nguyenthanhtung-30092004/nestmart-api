import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Lấy thông tin về request
    const method = req.method;
    const url = req.originalUrl;
    const time = new Date().toISOString();

    // 2. Ghi ra sổ (In ra màn hình)
    console.log(`[${time}] Khách truy cập: ${method} ${url}`);

    // 3. Mở cửa cho khách đi tiếp vào controller
    next();
  }
}
