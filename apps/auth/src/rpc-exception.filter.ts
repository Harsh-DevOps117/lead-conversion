// apps/auth/src/rpc-exception.filter.ts
import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { throwError } from 'rxjs';

@Catch(HttpException)
export class MicroserviceExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException) {
    // This grabs the real HTTP error (like 409 Conflict)
    // and correctly fires it over the RabbitMQ message queue.
    return throwError(() => exception.getResponse());
  }
}
