import { HttpErrorResponse, HttpHandler, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';
import { TokenApiModel } from '../models/token-api.model';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(NgToastService);
  const router = inject(Router);
  const myToken = auth.getToken();

  // Clone the request and add the authorization header
  if (myToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${myToken}`
      }
    });
  }

  // Pass the cloned request with the updated header to the next handler
  return next(req).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          // Handle unauthorized error
          let tokenPayload = new TokenApiModel();
          tokenPayload.accessToken = auth.getToken();
          tokenPayload.refreshToken = auth.getRefreshToken();
          return auth.renewToken(tokenPayload)
                                .pipe(
                                  switchMap((data: TokenApiModel) => {
                                    auth.storeToken(data.accessToken);
                                    auth.storeRefreshToken(data.refreshToken);
                                    req = req.clone({setHeaders: {Authorization: `Bearer ${data.accessToken}`}});
                                    return next(req);
                                  }),
                                  catchError((err: any) => {
                                    return throwError(() => {
                                      toast.warning ({detail: "WARNING", summary: "Your session has expired. Please log in again.", duration: 5000});
                                      router.navigate(['login']);
                                    });
                                  })
                                );
        } else {
          // Handle other HTTP error codes
          console.error('HTTP error:', err);
        }
      } else {
        // Handle non-HTTP errors
        console.error('An error occurred:', err);
      }

      // Re-throw the error to propagate it further
      return throwError(() => new Error('Some other error occurred'));
    })
  );
};