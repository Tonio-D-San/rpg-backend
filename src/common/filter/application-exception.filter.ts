import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus,} from '@nestjs/common';
import {Request, Response,} from 'express';
import {ConflictException as ApplicationConflictException} from '../exception/conflict.exception.js';
import {ExternalDataException} from '../exception/external-data.exception.js';
import {KeycloakCallException} from '../exception/keycloak-call.exception.js';
import {NotFoundException as ApplicationNotFoundException} from '../exception/not-found.exception.js';

@Catch(
  ApplicationConflictException,
  ApplicationNotFoundException,
  ExternalDataException,
  KeycloakCallException,
)
export class ApplicationExceptionFilter
  implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = this.resolveStatus(exception);
    response.status(status).json({
      statusCode: status,
      message: this.resolveMessage(exception, status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveStatus(exception: Error): number {
    if (exception instanceof ApplicationConflictException) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof ApplicationNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ExternalDataException || exception instanceof KeycloakCallException) {
      return HttpStatus.BAD_GATEWAY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: Error, status: number): string {
    if (status === HttpStatus.BAD_GATEWAY) {
      return 'External identity service error';
    }
    return exception.message;
  }
}
