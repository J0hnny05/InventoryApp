import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, switchMap, throwError, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Attach the Bearer token to every same-API request. On a 401 it attempts ONE silent
 * refresh, then retries the original request with the new token.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  // Only attach to our own API; let third-party calls pass through untouched.
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);

  // Don't loop the refresh endpoint through itself.
  const isRefresh = req.url.endsWith('/auth/refresh');
  const token = auth.getAccessToken();
  const authed = token && !isRefresh ? withBearer(req, token) : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || isRefresh) {
        return throwError(() => err);
      }
      // Try one refresh; retry on success, propagate on failure.
      return from(auth.refreshAccessToken()).pipe(
        switchMap((newToken) => {
          if (!newToken) return throwError(() => err);
          return next(withBearer(req, newToken));
        }),
      );
    }),
  );
};

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
