import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResetPassword } from '../models/reset-password.model';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService {
  private baseURL: string = "https://localhost:44335/api/User";

  constructor(private http: HttpClient) { }

  sendResetPasswordLink(email: string) {
    return this.http.post<any>(`${this.baseURL}/send-reset-email/${email}`,{});
  }

  resetPassword(resetPasswordObj: ResetPassword) {
    return this.http.post<any>(`${this.baseURL}/reset-password`, resetPasswordObj);
  }
}
