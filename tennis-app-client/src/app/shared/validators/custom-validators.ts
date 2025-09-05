import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  // Email validator with more strict rules
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values to allow optional controls
      }
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const valid = emailRegex.test(control.value);
      
      return valid ? null : { email: { value: control.value } };
    };
  }
  
  // Phone number validator
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      // Supports formats like: +1234567890, 123-456-7890, (123) 456-7890
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      const valid = phoneRegex.test(control.value);
      
      return valid ? null : { phoneNumber: { value: control.value } };
    };
  }
  
  // Date in the past validator
  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return date < today ? null : { pastDate: { value: control.value } };
    };
  }
  
  // Date in the future validator
  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return date > today ? null : { futureDate: { value: control.value } };
    };
  }
  
  // Age validator (minimum and maximum age)
  static age(minAge: number, maxAge?: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < minAge) {
        return { minAge: { min: minAge, actual: age } };
      }
      
      if (maxAge && age > maxAge) {
        return { maxAge: { max: maxAge, actual: age } };
      }
      
      return null;
    };
  }
  
  // Password strength validator
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const password = control.value;
      const errors: ValidationErrors = {};
      
      if (password.length < 8) {
        errors['minLength'] = { requiredLength: 8, actualLength: password.length };
      }
      
      if (!/[A-Z]/.test(password)) {
        errors['uppercase'] = true;
      }
      
      if (!/[a-z]/.test(password)) {
        errors['lowercase'] = true;
      }
      
      if (!/[0-9]/.test(password)) {
        errors['digit'] = true;
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors['specialChar'] = true;
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }
  
  // Match other field validator (useful for password confirmation)
  static matchField(fieldName: string, errorKey = 'mismatch'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) {
        return null;
      }
      
      const fieldToMatch = parent.get(fieldName);
      if (!fieldToMatch) {
        return null;
      }
      
      if (control.value !== fieldToMatch.value) {
        return { [errorKey]: { field: fieldName } };
      }
      
      return null;
    };
  }
  
  // URL validator
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: { value: control.value } };
      }
    };
  }
  
  // Numeric range validator
  static range(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null;
      }
      
      const value = Number(control.value);
      
      if (isNaN(value)) {
        return { range: { min, max, actual: control.value } };
      }
      
      if (value < min || value > max) {
        return { range: { min, max, actual: value } };
      }
      
      return null;
    };
  }
  
  // File size validator (in MB)
  static fileSize(maxSizeMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const file = control.value as File;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        return { 
          fileSize: { 
            maxSize: `${maxSizeMB}MB`, 
            actualSize: `${(file.size / 1024 / 1024).toFixed(2)}MB` 
          } 
        };
      }
      
      return null;
    };
  }
  
  // File type validator
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const file = control.value as File;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return { 
          fileType: { 
            allowedTypes: allowedTypes.join(', '), 
            actualType: fileExtension || 'unknown' 
          } 
        };
      }
      
      return null;
    };
  }
  
  // No whitespace validator
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const isWhitespace = (control.value || '').trim().length === 0;
      return isWhitespace ? { whitespace: true } : null;
    };
  }
  
  // Date range validator for form groups
  static dateRange(startField: string, endField: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const start = formGroup.get(startField);
      const end = formGroup.get(endField);
      
      if (!start || !end || !start.value || !end.value) {
        return null;
      }
      
      const startDate = new Date(start.value);
      const endDate = new Date(end.value);
      
      if (startDate >= endDate) {
        return { dateRange: { start: startField, end: endField } };
      }
      
      return null;
    };
  }
  
  // Tournament draw size validator (must be power of 2)
  static tournamentDrawSize(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const validSizes = [2, 4, 8, 16, 32, 64, 128, 256];
      const value = Number(control.value);
      
      if (!validSizes.includes(value)) {
        return { 
          drawSize: { 
            validSizes: validSizes.join(', '), 
            actual: value 
          } 
        };
      }
      
      return null;
    };
  }
  
  // Tennis score validator
  static tennisScore(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      // Basic tennis score format: "6-4, 7-5" or "6-4 6-3 6-2"
      const scoreRegex = /^(\d{1,2}-\d{1,2}[,\s]*)+$/;
      
      if (!scoreRegex.test(control.value)) {
        return { tennisScore: { value: control.value } };
      }
      
      return null;
    };
  }
}