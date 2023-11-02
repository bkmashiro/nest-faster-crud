import { Catch, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
const logger = new Logger('Global')
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    logger.error(exception)

    response
      .status(500) // 设置适当的HTTP状态码
      .json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Internal server error', // 自定义错误信息
      });
  }
}
