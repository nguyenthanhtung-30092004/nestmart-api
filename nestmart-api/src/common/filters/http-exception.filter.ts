import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // 1. Chuyển đổi bối cảnh sang HTTP
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 2. Lấy mã lỗi và nội dung lỗi
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exception.message;

    // 3. Chuẩn hóa lại định dạng trả về cho Frontend
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
