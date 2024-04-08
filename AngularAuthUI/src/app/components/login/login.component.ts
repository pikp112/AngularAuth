import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import ValidateForm from '../../helpers/validateForm';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';

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

  constructor(private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private toast: NgToastService) {}

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
      console.log(this.loginForm.value);
      //send the obj to db
      this.auth.login(this.loginForm.value).subscribe({
        next: (res) => {
          //alert(res.message);
          this.toast.success({detail: "SUCCESS", summary: res.message, duration: 5000});
          this.loginForm.reset();
          this.router.navigate(['dashboard']);
        },
        error: (err) => {
          //alert(err?.error.message);
          this.toast.error({detail: "ERROR", summary: "Something when wrong!", duration: 5000});
        },
      });
    } else {
      //throw the error using toaster and with required fields
      ValidateForm.validateAllFormFields(this.loginForm);
      alert("Your form is invalid");
    }
  }
}