import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { Subject } from 'rxjs';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastSubject: Subject<Toast>;

  beforeEach(async () => {
    toastSubject = new Subject<Toast>();
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [], {
      toast$: toastSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent, BrowserAnimationsModule],
      providers: [
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty toasts array', () => {
    expect(component.toasts).toEqual([]);
  });

  describe('Toast Display', () => {
    it('should add toast when service emits', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        message: 'Test message',
        type: 'success',
        duration: 5000
      };

      toastSubject.next(toast);
      tick();

      expect(component.toasts.length).toBe(1);
      expect(component.toasts[0]).toEqual(toast);
    }));

    it('should display multiple toasts', fakeAsync(() => {
      const toast1: Toast = {
        id: 'test-1',
        message: 'First toast',
        type: 'success',
        duration: 5000
      };

      const toast2: Toast = {
        id: 'test-2',
        message: 'Second toast',
        type: 'error',
        duration: 5000
      };

      toastSubject.next(toast1);
      toastSubject.next(toast2);
      tick();

      expect(component.toasts.length).toBe(2);
      expect(component.toasts[0]).toEqual(toast1);
      expect(component.toasts[1]).toEqual(toast2);
    }));

    it('should render toast with title and message', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        title: 'Success',
        message: 'Operation completed',
        type: 'success',
        duration: 5000
      };

      toastSubject.next(toast);
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const toastElement = compiled.querySelector('.toast');
      expect(toastElement).toBeTruthy();
      expect(toastElement.textContent).toContain('Success');
      expect(toastElement.textContent).toContain('Operation completed');
    }));

    it('should apply correct CSS class based on toast type', fakeAsync(() => {
      const successToast: Toast = {
        id: 'test-1',
        message: 'Success',
        type: 'success',
        duration: 5000
      };

      toastSubject.next(successToast);
      tick();
      fixture.detectChanges();

      const toastElement = fixture.nativeElement.querySelector('.toast');
      expect(toastElement.classList.contains('toast-success')).toBeTruthy();
    }));
  });

  describe('Auto-dismiss', () => {
    it('should auto-remove toast after duration', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        message: 'Auto dismiss',
        type: 'info',
        duration: 3000
      };

      toastSubject.next(toast);
      tick();

      expect(component.toasts.length).toBe(1);

      tick(3000);

      expect(component.toasts.length).toBe(0);
    }));

    it('should not auto-remove toast with duration 0', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        message: 'Persistent toast',
        type: 'info',
        duration: 0
      };

      toastSubject.next(toast);
      tick();

      expect(component.toasts.length).toBe(1);

      tick(10000); // Wait a long time

      expect(component.toasts.length).toBe(1); // Should still be there
    }));

    it('should clear timeout when toast is manually removed', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        message: 'Manual remove',
        type: 'info',
        duration: 5000
      };

      toastSubject.next(toast);
      tick();

      expect(component.toasts.length).toBe(1);

      component.removeToast(toast);

      expect(component.toasts.length).toBe(0);
      expect(component['timeouts'].has('test-1')).toBeFalsy();
    }));
  });

  describe('Manual removal', () => {
    it('should remove toast when removeToast is called', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        message: 'Remove me',
        type: 'warning',
        duration: 0
      };

      toastSubject.next(toast);
      tick();

      expect(component.toasts.length).toBe(1);

      component.removeToast(toast);

      expect(component.toasts.length).toBe(0);
    }));

    it('should only remove specified toast', fakeAsync(() => {
      const toast1: Toast = {
        id: 'test-1',
        message: 'First',
        type: 'info',
        duration: 0
      };

      const toast2: Toast = {
        id: 'test-2',
        message: 'Second',
        type: 'info',
        duration: 0
      };

      toastSubject.next(toast1);
      toastSubject.next(toast2);
      tick();

      expect(component.toasts.length).toBe(2);

      component.removeToast(toast1);

      expect(component.toasts.length).toBe(1);
      expect(component.toasts[0]).toEqual(toast2);
    }));
  });

  describe('Toast actions', () => {
    it('should handle toast action click', fakeAsync(() => {
      const actionHandler = jasmine.createSpy('actionHandler');
      const toast: Toast = {
        id: 'test-1',
        message: 'Action toast',
        type: 'info',
        duration: 0,
        action: {
          label: 'Undo',
          handler: actionHandler
        }
      };

      toastSubject.next(toast);
      tick();

      component.handleAction(toast);

      expect(actionHandler).toHaveBeenCalled();
      expect(component.toasts.length).toBe(0); // Toast should be removed after action
    }));

    it('should not error if action has no handler', fakeAsync(() => {
      const toast: Toast = {
        id: 'test-1',
        message: 'Action toast',
        type: 'info',
        duration: 0,
        action: {
          label: 'Undo',
          handler: (() => { /* noop */ }) as (() => void)
        }
      };

      toastSubject.next(toast);
      tick();

      expect(() => component.handleAction(toast)).not.toThrow();
      expect(component.toasts.length).toBe(0);
    }));
  });

  describe('Component lifecycle', () => {
    it('should clear all timeouts on destroy', fakeAsync(() => {
      const toast1: Toast = {
        id: 'test-1',
        message: 'First',
        type: 'info',
        duration: 5000
      };

      const toast2: Toast = {
        id: 'test-2',
        message: 'Second',
        type: 'info',
        duration: 5000
      };

      toastSubject.next(toast1);
      toastSubject.next(toast2);
      tick();

      expect(component['timeouts'].size).toBe(2);

      component.ngOnDestroy();

      expect(component['timeouts'].size).toBe(0);
    }));

    it('should unsubscribe from toast service on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle removing non-existent toast', () => {
      const toast: Toast = {
        id: 'non-existent',
        message: 'Not in array',
        type: 'info',
        duration: 0
      };

      expect(() => component.removeToast(toast)).not.toThrow();
      expect(component.toasts.length).toBe(0);
    });

    it('should handle toast without ID for timeout management', fakeAsync(() => {
      const toast: Toast = {
        message: 'No ID',
        type: 'info',
        duration: 3000
      };

      toastSubject.next(toast);
      tick();

      expect(component.toasts.length).toBe(1);

      tick(3000);

      expect(component.toasts.length).toBe(0);
    }));
  });
});