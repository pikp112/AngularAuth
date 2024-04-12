import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgModel, Validators } from '@angular/forms';
import ValidateForm from '../../helpers/validateForm';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { UserStoreService } from '../../services/user-store.service';
import { ResetPasswordService } from '../../services/reset-password.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  type: string = 'password';
  isText: boolean = false;
  eyeIcon: string = 'fa-eye-slash';
  loginForm: FormGroup;
  public resetPasswordEmail!: string;
  public isValidEmail: boolean = false;
  @ViewChild('emailInput') emailInput: NgModel;
  
  constructor(private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private userStore: UserStoreService,
    private resetService: ResetPasswordService,
    private toastService: NgToastService) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  hideShowPass() {
    this.isText = !this.isText;
    this.isText ? (this.eyeIcon = 'fa-eye') : (this.eyeIcon = 'fa-eye-slash');
    this.isText ? (this.type = 'text') : (this.type = 'password');
  }
 
  onLogin() {
    if (this.loginForm.valid) {
      this.auth.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.loginForm.reset();
          this.auth.storeToken(res.accessToken);
          this.auth.storeRefreshToken(res.refreshToken); 
          const tokenPayload = this.auth.decodedToken();
          this.userStore.setFullNameInStore(tokenPayload.unique_name);
          this.userStore.setRoleInStore(tokenPayload.role);
          this.toastService.success({detail: 'SUCCESS', summary: 'Login Success', duration: 5000});
          this.router.navigate(['dashboard']);
        },
        error: (err) => {
          this.toastService.error({detail: 'ERROR', summary: 'Please fill all details correctly', duration: 5000});
        },
      });
    } else {
      ValidateForm.validateAllFormFields(this.loginForm);
    }
  }

  checkValidEmail(event: string) {
    const value = event;
    const pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/; //email pattern
    this.isValidEmail = pattern.test(value);
    return this.isValidEmail;
  }

  resetModalValues() {
    if (this.emailInput) {
      this.emailInput.control.markAsUntouched();
    }
  }

  confirmToSend(){
    if (this.checkValidEmail(this.resetPasswordEmail)){
      this.resetService.sendResetPasswordLink(this.resetPasswordEmail)
      .subscribe({
        next: (res) => {
          this.toastService.success({ detail: 'SUCCESS', summary: `Reset email sent to ${this.resetPasswordEmail}!`, duration: 5000 });
          this.resetPasswordEmail = '';
          const buttonRef = document.getElementById('closeBtn');
          buttonRef?.click();    
        },
        error: (err) => {
          this.toastService.error({detail: 'ERROR', summary: 'Something went wrong!', duration: 5000});
        }
      })
    }
  }
}