import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CheckoutSession, ConfirmPaymentRequest, PaymentSummary } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly BASE = environment.services.payment;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(`${this.BASE}/payments/summary`);
  }

  createCheckout(): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>(`${this.BASE}/payments/checkout`, {});
  }

  confirmPayment(payload: ConfirmPaymentRequest): Observable<PaymentSummary> {
    return this.http.post<PaymentSummary>(`${this.BASE}/payments/confirm`, payload);
  }
}
