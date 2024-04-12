import { FormGroup } from "@angular/forms";

export function ConfirmPasswordValidator(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
        const passwordControl = formGroup.controls[controlName];
        const confirmPasswordControl = formGroup.controls[matchingControlName];
        if (confirmPasswordControl.errors && !confirmPasswordControl.errors.confirmPasswordValidator) {
            return;
        }
        if (passwordControl.value !== confirmPasswordControl.value) {
            confirmPasswordControl.setErrors({ confirmPasswordValidator: true });
        } else {
            confirmPasswordControl.setErrors(null);
        }
    }
}