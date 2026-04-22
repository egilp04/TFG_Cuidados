import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MessageService } from './message-service';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService],
    });
    service = TestBed.inject(MessageService);
  });

  it('should show message and clear after timeout', fakeAsync(() => {
    service.showMessage('Test', 'success', 1000);
    expect(service.messageData()).toEqual({ mensaje: 'Test', tipo: 'success' });

    tick(1000);
    expect(service.messageData()).toBeNull();
  }));

  it('should clear message manually', () => {
    service.showMessage('Test');
    service.clear();
    expect(service.messageData()).toBeNull();
  });
});
