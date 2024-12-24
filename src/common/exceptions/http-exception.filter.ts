import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '@/common/enums';
import { exceptionCase } from '@/common/exceptions';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let responseData = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errorCode: ErrorCode.SERVER_ERROR,
    };
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const exceptionDetails =
        exceptionCase[(exceptionResponse as any).message];
      if (exceptionDetails) {
        responseData = { ...exceptionDetails };
      } else {
        responseData = {
          status: exception.getStatus(),
          message:
            typeof (exceptionResponse as any).message === 'object'
              ? (exceptionResponse as any).message[0]
              : (exceptionResponse as any).message || exception.message,
          errorCode: (exceptionResponse as any).error,
        };
      }
    } else if (exception instanceof Error) {
      const exceptionDetails = exceptionCase[exception.message];
      if (exceptionDetails) {
        responseData = { ...exceptionDetails };
      } else {
        responseData.message = exception.message;
      }
    }

    response.status(responseData.status).json(responseData);
  }
}
