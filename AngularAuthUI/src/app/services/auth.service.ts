import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from'@auth0/angular-jwt';
import { TokenApiModel } from '../models/token-api.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl: string = "https://localhost:44335/api/User/";
  private userPayload: any;

  constructor(private http: HttpClient, private router: Router) {
    this.userPayload = this.decodedToken();
   }

  signUp(userObj: any) {
    return this.http.post<any>(`${this.baseUrl}register`, userObj);
  }

  login(loginObj: any) {
    return this.http.post<any>(this.baseUrl + "authenticate", loginObj);
  }

  signOut(){
    //localStorage.removeItem('token'); // remove just the token from the local storage
    localStorage.clear(); // clear the local storage entirely
    this.router.navigate(['login']);
  }

  storeToken(tokenValue: string){
    localStorage.setItem('token', tokenValue);
  }

  storeRefreshToken(refreshTokenValue: string){
    localStorage.setItem('refreshToken', refreshTokenValue);
  }

  getToken(){
    return localStorage.getItem('token');
  }

  getRefreshToken(){
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');// !! converts the value to boolean (if it is null, it will return false, otherwise true)
  }

  decodedToken(){
    const jwtHelper = new JwtHelperService(); 
    return jwtHelper.decodeToken(this.getToken()!);
  }

  getFullNameFromToken(){
    if (this.userPayload){
      return this.userPayload.unique_name;
    }
  }

  getRoleFroMToken(){
    if (this.userPayload){
      return this.userPayload.role;
    }
  }

  renewToken(tokenApi: TokenApiModel){
    return this.http.post<any>(`${this.baseUrl}refresh`, tokenApi);
  }
}
