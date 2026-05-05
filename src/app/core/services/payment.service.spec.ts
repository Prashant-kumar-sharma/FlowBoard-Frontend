import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const base = 'http://localhost:8080/api/v1/payments';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PaymentService]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers payment endpoints', () => {
    service.getSummary().subscribe();
    httpMock.expectOne(`${base}/summary`).flush({});

    service.createCheckout().subscribe();
    const checkout = httpMock.expectOne(`${base}/checkout`);
    expect(checkout.request.body).toEqual({});
    checkout.flush({});

    service.confirmPayment({ sessionId: 'abc' } as any).subscribe();
    const confirm = httpMock.expectOne(`${base}/confirm`);
    expect(confirm.request.method).toBe('POST');
    expect(confirm.request.body).toEqual({ sessionId: 'abc' });
    confirm.flush({});
  });
});
