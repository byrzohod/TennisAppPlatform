import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id?: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$ = this.toastSubject.asObservable();

  show(toast: Toast) {
    // Generate unique ID if not provided
    if (!toast.id) {
      toast.id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set default duration if not provided
    if (toast.duration === undefined) {
      toast.duration = 5000; // 5 seconds default
    }
    
    this.toastSubject.next(toast);
  }

  success(message: string, title?: string, duration?: number) {
    this.show({
      message,
      title,
      type: 'success',
      duration
    });
  }

  error(message: string, title?: string, duration?: number) {
    this.show({
      message,
      title,
      type: 'error',
      duration: duration || 8000 // Errors stay longer
    });
  }

  warning(message: string, title?: string, duration?: number) {
    this.show({
      message,
      title,
      type: 'warning',
      duration
    });
  }

  info(message: string, title?: string, duration?: number) {
    this.show({
      message,
      title,
      type: 'info',
      duration
    });
  }
}