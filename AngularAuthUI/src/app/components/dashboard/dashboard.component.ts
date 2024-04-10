import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy{
  public users: any = [];
  public fullName: string = '';
  public role: string = '';

  constructor(private auth: AuthService, private api: ApiService, private userStore: UserStoreService) { }
  
  ngOnInit(): void {
    this.api.getUsers()
    .subscribe((data: any) => {
      this.users = data;
    });
    this.userStore.getFullNameFromStore()
    .subscribe(val => {
      let fullNameFromToken = this.auth.getFullNameFromToken(); 
      this.fullName = val || fullNameFromToken; // 2 options: from token or from store (because for example if the user refresh the page, the store will be empty, but the token will still be there)
    });
    this.userStore.getRoleFromStore()
    .subscribe(val => {
      let roleFromToken = this.auth.getRoleFroMToken();
      this.role = val || roleFromToken;
    });
  }

  ngOnDestroy(): void {
  }

  logOut(){
    this.auth.signOut();
  }

}
