import { Component, Input, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      <input
        #inputElement
        [id]="inputId"
        [type]="actualType"
        [placeholder]="floatingLabel ? ' ' : placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [required]="required"
        [attr.autocomplete]="autocomplete"
        [attr.aria-label]="label || placeholder"
        [attr.aria-invalid]="hasError"
        [attr.aria-describedby]="helperText ? inputId + '-helper' : null"
        [(ngModel)]="value"
        (ngModelChange)="onChange($event)"
        (blur)="onTouched()"
        (focus)="onFocus()"
        [class]="inputClasses"
      />
      
      @if (floatingLabel) {
        <label 
          [for]="inputId"
          [class]="labelClasses"
        >
          {{ label }}
          @if (required) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }
      
      @if (icon) {
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span [innerHTML]="icon" class="text-gray-400"></span>
        </div>
      }
      
      @if (type === 'password' && showPasswordToggle) {
        <button
          type="button"
          (click)="togglePasswordVisibility()"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          @if (showPassword) {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
          }
        </button>
      }
    </div>
    
    @if (helperText && !hasError) {
      <p [id]="inputId + '-helper'" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ helperText }}
      </p>
    }
    
    @if (errorMessage && hasError) {
      <p class="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-down">
        {{ errorMessage }}
      </p>
    }
  `,
  styles: []
})
export class InputComponent implements ControlValueAccessor {
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;
  
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' = 'text';
  @Input() floatingLabel = true;
  @Input() icon?: string;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() autocomplete = 'off';
  @Input() showPasswordToggle = true;
  @Input() hasError = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() className = '';

  value = '';
  showPassword = false;
  isFocused = false;
  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_: string) => { /* ControlValueAccessor callback - implemented when registered */ };
  onTouched = () => { /* ControlValueAccessor callback */ };

  get inputClasses(): string {
    const base = 'w-full border-2 rounded-lg transition-all duration-200 bg-white dark:bg-gray-800';
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg'
    };
    
    const states = this.hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-300 focus:border-grass-500 focus:ring-grass-500/20 dark:border-gray-600 dark:focus:border-grass-400';
    
    const focus = 'focus:outline-none focus:ring-2';
    const disabled = this.disabled ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed' : '';
    const withIcon = this.icon ? 'pl-10' : '';
    const withPasswordToggle = this.type === 'password' && this.showPasswordToggle ? 'pr-10' : '';
    const floating = this.floatingLabel ? 'placeholder-transparent pt-6 pb-1' : '';
    
    return `${base} ${sizes[this.size]} ${states} ${focus} ${disabled} ${withIcon} ${withPasswordToggle} ${floating} ${this.className}`.trim();
  }

  get labelClasses(): string {
    const base = 'absolute transition-all duration-200 pointer-events-none';
    const positioned = this.icon ? 'left-10' : 'left-4';
    
    const floating = this.isFocused || this.value
      ? 'top-1.5 text-xs text-grass-600 dark:text-grass-400'
      : 'top-4 text-base text-gray-500';
    
    return `${base} ${positioned} ${floating}`.trim();
  }

  get actualType(): string {
    if (this.type === 'password' && this.showPassword) {
      return 'text';
    }
    return this.type;
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  focus(): void {
    this.inputElement?.nativeElement.focus();
  }
}