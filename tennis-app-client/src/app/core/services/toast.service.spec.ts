import { TestBed } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let toasts: Toast[] = [];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    toasts = [];
    
    // Subscribe to toast observable to capture emitted toasts
    service.toast$.subscribe(toast => {
      toasts.push(toast);
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show', () => {
    it('should emit a toast with generated ID if not provided', (done) => {
      const toast: Toast = {
        message: 'Test message',
        type: 'info'
      };

      service.show(toast);

      setTimeout(() => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].id).toBeTruthy();
        expect(toasts[0].id).toContain('toast-');
        expect(toasts[0].message).toBe('Test message');
        expect(toasts[0].type).toBe('info');
        done();
      }, 0);
    });

    it('should use provided ID if given', (done) => {
      const toast: Toast = {
        id: 'custom-id',
        message: 'Test message',
        type: 'success'
      };

      service.show(toast);

      setTimeout(() => {
        expect(toasts[0].id).toBe('custom-id');
        done();
      }, 0);
    });

    it('should set default duration of 5000ms if not provided', (done) => {
      const toast: Toast = {
        message: 'Test message',
        type: 'warning'
      };

      service.show(toast);

      setTimeout(() => {
        expect(toasts[0].duration).toBe(5000);
        done();
      }, 0);
    });

    it('should use provided duration', (done) => {
      const toast: Toast = {
        message: 'Test message',
        type: 'error',
        duration: 10000
      };

      service.show(toast);

      setTimeout(() => {
        expect(toasts[0].duration).toBe(10000);
        done();
      }, 0);
    });

    it('should allow duration of 0 for persistent toasts', (done) => {
      const toast: Toast = {
        message: 'Test message',
        type: 'info',
        duration: 0
      };

      service.show(toast);

      setTimeout(() => {
        expect(toasts[0].duration).toBe(0);
        done();
      }, 0);
    });
  });

  describe('success', () => {
    it('should create a success toast', (done) => {
      service.success('Success message', 'Success Title', 3000);

      setTimeout(() => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].message).toBe('Success message');
        expect(toasts[0].title).toBe('Success Title');
        expect(toasts[0].duration).toBe(3000);
        done();
      }, 0);
    });

    it('should work without title and duration', (done) => {
      service.success('Success message');

      setTimeout(() => {
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].message).toBe('Success message');
        expect(toasts[0].title).toBeUndefined();
        expect(toasts[0].duration).toBe(5000);
        done();
      }, 0);
    });
  });

  describe('error', () => {
    it('should create an error toast with default 8000ms duration', (done) => {
      service.error('Error message', 'Error Title');

      setTimeout(() => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('error');
        expect(toasts[0].message).toBe('Error message');
        expect(toasts[0].title).toBe('Error Title');
        expect(toasts[0].duration).toBe(8000);
        done();
      }, 0);
    });

    it('should use custom duration if provided', (done) => {
      service.error('Error message', undefined, 10000);

      setTimeout(() => {
        expect(toasts[0].duration).toBe(10000);
        done();
      }, 0);
    });
  });

  describe('warning', () => {
    it('should create a warning toast', (done) => {
      service.warning('Warning message', 'Warning Title', 4000);

      setTimeout(() => {
        expect(toasts[0].type).toBe('warning');
        expect(toasts[0].message).toBe('Warning message');
        expect(toasts[0].title).toBe('Warning Title');
        expect(toasts[0].duration).toBe(4000);
        done();
      }, 0);
    });
  });

  describe('info', () => {
    it('should create an info toast', (done) => {
      service.info('Info message', 'Info Title', 2000);

      setTimeout(() => {
        expect(toasts[0].type).toBe('info');
        expect(toasts[0].message).toBe('Info message');
        expect(toasts[0].title).toBe('Info Title');
        expect(toasts[0].duration).toBe(2000);
        done();
      }, 0);
    });
  });

  describe('toast with action', () => {
    it('should include action in toast', (done) => {
      const actionHandler = jasmine.createSpy('actionHandler');
      const toast: Toast = {
        message: 'Action toast',
        type: 'info',
        action: {
          label: 'Undo',
          handler: actionHandler
        }
      };

      service.show(toast);

      setTimeout(() => {
        expect(toasts[0].action).toBeDefined();
        expect(toasts[0].action?.label).toBe('Undo');
        expect(toasts[0].action?.handler).toBe(actionHandler);
        done();
      }, 0);
    });
  });

  describe('multiple toasts', () => {
    it('should emit multiple toasts in sequence', (done) => {
      service.success('First toast');
      service.error('Second toast');
      service.info('Third toast');

      setTimeout(() => {
        expect(toasts.length).toBe(3);
        expect(toasts[0].message).toBe('First toast');
        expect(toasts[0].type).toBe('success');
        expect(toasts[1].message).toBe('Second toast');
        expect(toasts[1].type).toBe('error');
        expect(toasts[2].message).toBe('Third toast');
        expect(toasts[2].type).toBe('info');
        done();
      }, 0);
    });
  });
});