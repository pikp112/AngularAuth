import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResetPassword } from '../../models/reset-password.model';
import { ConfirmPasswordValidator } from '../../helpers/confirm-password.validator';
import { ActivatedRoute, Router } from '@angular/router';
import ValidateForm from '../../helpers/validateForm';
import { ResetPasswordService } from '../../services/reset-password.service';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss',
})
export class ResetComponent implements OnInit{
  resetPasswordForm: FormGroup;
  emaiToReset!: string;
  emailToken!: string;
  resetPasswordObj = new ResetPassword();

  constructor(private fb: FormBuilder, 
    private activatedRoute: ActivatedRoute, 
    private resetPasswordService: ResetPasswordService,
    private toastService: NgToastService,
    private router: Router) {}

  ngOnInit() {
    this.resetPasswordForm = this.fb.group({
      password: [null, Validators.required],
      confirmPassword: [null, Validators.required],
    },{
      validator: ConfirmPasswordValidator('password', 'confirmPassword')
    });

    this.activatedRoute.queryParams.subscribe(params => {
      this.emaiToReset = params['email'];
      let uriToken = params['code'];
      this.emailToken = uriToken.replace(/ /g, '+');
    });
  }

  reset(){
    if(this.resetPasswordForm.valid){
      this.resetPasswordObj.email = this.emaiToReset;
      this.resetPasswordObj.newPassword = this.resetPasswordForm.value.password;
      this.resetPasswordObj.confirmPassword = this.resetPasswordForm.value.confirmPassword;
      this.resetPasswordObj.emailToken = this.emailToken;
      this.resetPasswordService.resetPassword(this.resetPasswordObj)
      .subscribe({
        next: (res) => {
          this.toastService.success({detail: 'SUCCESS', summary: 'Password reset successful', duration: 3000});
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.toastService.error({detail: 'ERROR', summary: 'Error resetting password, please try again', duration: 3000});
        }
      });
    }
    else{
      ValidateForm.validateAllFormFields(this.resetPasswordForm);
    }
  }
}
