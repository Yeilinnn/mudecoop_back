import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Respuesta estándar
    const payload: any = {
      statusCode: status,
      message: isHttp ? (exception as HttpException).message : 'Internal server error',
      error: isHttp ? (exception as HttpException).name : 'InternalServerError',
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    // Si la excepción trae un cuerpo con "message" (array o string), úsalo
    if (isHttp) {
      const body = (exception as HttpException).getResponse() as any;
      if (body?.message) payload.message = body.message;
    }

    res.status(status).json(payload);
  }
}
