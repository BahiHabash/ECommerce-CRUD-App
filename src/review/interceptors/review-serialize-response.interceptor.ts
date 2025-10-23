import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ReviewResponseDto } from '../dtos/review-response.dto';
import type { Review } from '../review.entity';

@Injectable()
export class ReviewSerializeResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((reviewRes: Review | Review[]) => {
        if (!Array.isArray(reviewRes)) {
          reviewRes = [reviewRes];
        }

        const serialized: ReviewResponseDto[] = [];

        for (const review of reviewRes) {
          serialized.push({
            id: review.id,
            comment: review.comment,
            rating: review.rating,
            userId: review?.user?.id,
            productId: review?.product?.id,
          });
        }

        return Array.isArray(reviewRes) ? serialized : serialized[0];
      }),
    );
  }
}
