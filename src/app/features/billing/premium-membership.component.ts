import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService } from '../../core/services/payment.service';
import { CheckoutSession, PaymentSummary, RazorpaySuccessPayload } from '../../core/models/payment.model';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

@Component({
  selector: 'app-premium-membership',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="billing-shell min-h-screen">
      <div class="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section class="billing-hero rounded-[32px] px-6 py-8 text-white shadow-[0_26px_80px_rgba(15,23,42,0.22)] sm:px-8">
          <div class="grid gap-8 lg:grid-cols-[1.2fr,0.9fr] lg:items-end">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <span class="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)]"></span>
                Razorpay checkout
              </div>

              <h1 class="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">FlowBoard Premium</h1>
              <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                This page now uses the real Razorpay checkout flow in test mode, so you can demonstrate an actual payment gateway integration without charging real money.
              </p>

              <div *ngIf="reasonCopy" class="mt-6 inline-flex max-w-2xl items-start gap-3 rounded-3xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                <mat-icon>info</mat-icon>
                <span>{{ reasonCopy }}</span>
              </div>

              <div class="mt-8 flex flex-wrap gap-3">
                <button *ngIf="!summary?.premium" mat-flat-button color="primary" class="billing-primary-button" type="button" (click)="startCheckout()" [disabled]="loading || processingPayment">
                  <mat-icon>workspace_premium</mat-icon>
                  Open Razorpay Checkout
                </button>
                <div *ngIf="summary?.premium" class="active-plan-pill">
                  <mat-icon>verified</mat-icon>
                  Premium Active
                </div>
                <a mat-stroked-button routerLink="/dashboard" class="billing-secondary-button">
                  <mat-icon>apps</mat-icon>
                  Back to dashboard
                </a>
              </div>
            </div>

            <div class="grid gap-3">
              <article class="billing-metric">
                <p class="billing-label">Plan</p>
                <p class="billing-value">{{ summary?.planName || 'Loading...' }}</p>
                <p class="billing-copy">{{ summary?.premium ? 'Unlimited workspaces and members unlocked.' : 'Free plan stops at five workspaces and five members per workspace.' }}</p>
              </article>
              <article class="billing-metric">
                <p class="billing-label">Premium price</p>
                <p class="billing-value">{{ displayAmount }}</p>
                <p class="billing-copy">Razorpay key: {{ summary?.razorpayKeyId || 'rzp_test_flowboard' }}</p>
              </article>
            </div>
          </div>
        </section>

        <section class="grid gap-6" [class.lg:grid-cols-[1.02fr,1.08fr]]="!summary?.premium" [class.lg:grid-cols-[1fr]]="summary?.premium">
          <article class="plan-card rounded-[28px] p-6">
            <p class="section-kicker">What changes</p>
            <h2 class="section-title">{{ summary?.premium ? 'Premium is active on this workspace account' : 'Choose premium for larger teams' }}</h2>
            <div class="mt-6 grid gap-3">
              <div class="plan-row">
                <span>Owned workspaces</span>
                <strong>{{ summary?.premium ? 'Unlimited' : 'Up to 5' }}</strong>
              </div>
              <div class="plan-row">
                <span>Members in a workspace</span>
                <strong>{{ summary?.premium ? 'Unlimited' : 'Up to 5' }}</strong>
              </div>
              <div class="plan-row">
                <span>Premium activated</span>
                <strong>{{ summary?.activatedAt ? (summary?.activatedAt | date:'MMM d, y, h:mm a') : 'Not active yet' }}</strong>
              </div>
            </div>
            <div class="benefit-strip mt-6">
              <div class="benefit-pill"><mat-icon>all_inclusive</mat-icon> Unlimited access</div>
              <div class="benefit-pill"><mat-icon>bolt</mat-icon> Instant activation</div>
              <div class="benefit-pill"><mat-icon>groups</mat-icon> Bigger team collaboration</div>
              <div class="benefit-pill" *ngIf="!summary?.premium"><mat-icon>verified_user</mat-icon> Test-mode payment</div>
            </div>

            <div *ngIf="summary?.premium" class="premium-feature-board mt-6">
              <div class="feature-card">
                <mat-icon>dashboard_customize</mat-icon>
                <div>
                  <h3>Unlimited workspaces</h3>
                  <p>Create as many team spaces as you need without hitting the free-tier cap.</p>
                </div>
              </div>
              <div class="feature-card">
                <mat-icon>group_add</mat-icon>
                <div>
                  <h3>Unlimited members</h3>
                  <p>Invite larger teams into a workspace without stopping at five members.</p>
                </div>
              </div>
              <div class="feature-card">
                <mat-icon>verified_user</mat-icon>
                <div>
                  <h3>Premium access confirmed</h3>
                  <p>Your account is already upgraded, so this page now focuses on plan benefits instead of payment.</p>
                </div>
              </div>
            </div>
          </article>

          <article *ngIf="!summary?.premium" class="checkout-card rounded-[28px] p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="section-kicker !text-slate-500">Payment panel</p>
                <h2 class="section-title text-slate-950">{{ checkout?.title || 'Ready to generate a payment order' }}</h2>
                <p class="mt-3 text-sm leading-7 text-slate-600">
                  {{ checkout?.description || 'Create a Razorpay order, then launch checkout and complete the payment using test mode.' }}
                </p>
              </div>
              <div class="checkout-badge">
                <mat-icon>{{ processingPayment ? 'hourglass_top' : 'credit_score' }}</mat-icon>
              </div>
            </div>

            <div class="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
              <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">Checkout status</p>
                <div class="payment-status" [class.is-processing]="processingPayment" [class.is-ready]="!processingPayment">
                  <span class="status-dot"></span>
                  {{ processingPayment ? 'Waiting for Razorpay' : 'Ready to launch checkout' }}
                </div>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <button type="button" class="method-card" [class.is-selected]="selectedMethod === 'UPI'" (click)="selectedMethod = 'UPI'">
                  <mat-icon>smartphone</mat-icon>
                  <span>UPI</span>
                </button>
                <button type="button" class="method-card" [class.is-selected]="selectedMethod === 'CARD'" (click)="selectedMethod = 'CARD'">
                  <mat-icon>credit_card</mat-icon>
                  <span>Card</span>
                </button>
                <button type="button" class="method-card" [class.is-selected]="selectedMethod === 'NETBANKING'" (click)="selectedMethod = 'NETBANKING'">
                  <mat-icon>account_balance</mat-icon>
                  <span>Netbanking</span>
                </button>
              </div>

              <div class="mt-5 grid gap-4 lg:grid-cols-[1.08fr,0.92fr]">
                <div class="payer-panel">
                  <p class="panel-title">Payer details</p>
                  <label class="input-group">
                    <span>Name</span>
                    <input [(ngModel)]="payerName" placeholder="Enter full name" />
                  </label>
                  <label class="input-group">
                    <span>Email</span>
                    <input [(ngModel)]="payerEmail" placeholder="Enter email" />
                  </label>
                  <label class="input-group">
                    <span>Phone</span>
                    <input [(ngModel)]="payerPhone" placeholder="Enter phone number" />
                  </label>
                </div>

                <div class="order-panel">
                  <p class="panel-title">Order summary</p>
                  <div class="summary-row">
                    <span>Order ID</span>
                    <strong>{{ checkout?.providerOrderId || 'Generate order first' }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Method</span>
                    <strong>{{ selectedMethod }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Currency</span>
                    <strong>{{ checkout?.currency || 'INR' }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Features</span>
                    <strong>Unlimited plan</strong>
                  </div>
                  <div class="summary-total">
                    <span>Total</span>
                    <strong>{{ checkout?.displayAmount || displayAmount }}</strong>
                  </div>
                </div>
              </div>

              <p class="mt-4 text-sm leading-6 text-slate-600">{{ checkout?.customerMessage || 'Generate a Razorpay order to continue.' }}</p>
            </div>

            <div *ngIf="checkout" class="mt-5 grid gap-3">
              <div class="checkout-line">
                <span>Provider order</span>
                <strong>{{ checkout.providerOrderId || 'Already active' }}</strong>
              </div>
              <div class="checkout-line">
                <span>Amount</span>
                <strong>{{ checkout.displayAmount }}</strong>
              </div>
              <div class="checkout-line">
                <span>Currency</span>
                <strong>{{ checkout.currency }}</strong>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <button mat-flat-button color="primary" class="billing-primary-button" type="button" (click)="startCheckout()" [disabled]="loading || processingPayment || summary?.premium">
                <mat-icon>receipt_long</mat-icon>
                {{ checkout ? 'Refresh order' : 'Create payment order' }}
              </button>
              <button mat-stroked-button class="confirm-button" type="button" (click)="launchCheckout()" [disabled]="loading || processingPayment || !checkout || checkout.premiumAlreadyActive || summary?.premium || !isPayerFormValid">
                <mat-icon>{{ processingPayment ? 'hourglass_top' : 'open_in_new' }}</mat-icon>
                {{ processingPayment ? 'Waiting...' : 'Pay with Razorpay' }}
              </button>
            </div>
          </article>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .billing-shell {
      background:
        radial-gradient(circle at top left, rgba(6, 182, 212, 0.14), transparent 24rem),
        radial-gradient(circle at 88% 10%, rgba(34, 197, 94, 0.14), transparent 22rem),
        linear-gradient(180deg, #f8fbff 0%, #eef6fb 48%, #f8fafc 100%);
    }
    .billing-hero {
      background:
        radial-gradient(circle at top right, rgba(103, 232, 249, 0.18), transparent 18rem),
        linear-gradient(135deg, #0f172a 0%, #155e75 52%, #0f766e 100%);
    }
    .billing-metric, .plan-card, .checkout-card {
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
    }
    .billing-metric {
      border-radius: 24px;
      padding: 1.2rem;
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.16);
      color: white;
      backdrop-filter: blur(14px);
    }
    .billing-label, .section-kicker {
      margin: 0;
      font-size: 0.72rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(224, 242, 254, 0.74);
      font-weight: 700;
    }
    .section-kicker {
      color: rgba(3, 105, 161, 0.7);
    }
    .section-title {
      margin: 0.75rem 0 0;
      font-size: 1.7rem;
      line-height: 1.2;
      font-weight: 700;
    }
    .billing-value {
      margin: 0.7rem 0 0;
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.05;
    }
    .billing-copy {
      margin: 0.75rem 0 0;
      font-size: 0.92rem;
      line-height: 1.6;
      color: rgba(226, 232, 240, 0.82);
    }
    .plan-row, .checkout-line {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      border-radius: 18px;
      border: 1px solid rgba(226, 232, 240, 0.95);
      background: rgba(248, 250, 252, 0.92);
      padding: 1rem 1.1rem;
      color: #475569;
    }
    .plan-row strong, .checkout-line strong {
      color: #0f172a;
      text-align: right;
      word-break: break-word;
    }
    .benefit-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .benefit-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: 9999px;
      background: #f0fdfa;
      color: #0f766e;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .active-plan-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 9999px;
      background: rgba(236, 253, 245, 0.18);
      border: 1px solid rgba(167, 243, 208, 0.24);
      color: #d1fae5;
      padding: 0.85rem 1.15rem;
      font-weight: 700;
    }
    .premium-feature-board {
      display: grid;
      gap: 1rem;
    }
    .feature-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      align-items: start;
      border-radius: 22px;
      border: 1px solid rgba(226, 232, 240, 0.95);
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,253,250,0.95));
      padding: 1.1rem 1.15rem;
    }
    .feature-card mat-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.75rem;
      width: 2.75rem;
      border-radius: 16px;
      background: #ecfeff;
      color: #0f766e;
      padding: 0.65rem;
    }
    .feature-card h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .feature-card p {
      margin: 0.4rem 0 0;
      color: #475569;
      line-height: 1.6;
      font-size: 0.92rem;
    }
    .checkout-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 3.5rem;
      width: 3.5rem;
      border-radius: 20px;
      background: linear-gradient(135deg, #dbeafe, #ccfbf1);
      color: #0f766e;
    }
    .payment-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 9999px;
      padding: 0.45rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .payment-status.is-ready {
      background: #ecfeff;
      color: #0f766e;
    }
    .payment-status.is-processing {
      background: #fff7ed;
      color: #c2410c;
    }
    .status-dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 9999px;
      background: currentColor;
    }
    .method-card {
      display: inline-flex;
      width: 100%;
      min-height: 5rem;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      border-radius: 20px;
      border: 1px solid rgba(203, 213, 225, 0.95);
      background: white;
      color: #0f172a;
      font-weight: 600;
      flex-direction: column;
      transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
    }
    .method-card.is-selected {
      border-color: #0f766e;
      box-shadow: 0 14px 28px rgba(13, 148, 136, 0.14);
      transform: translateY(-2px);
    }
    .payer-panel, .order-panel {
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.95);
      background: white;
      padding: 1rem;
    }
    .panel-title {
      margin: 0 0 0.9rem;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #475569;
    }
    .input-group {
      display: grid;
      gap: 0.45rem;
      margin-top: 0.85rem;
      color: #334155;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .input-group:first-of-type {
      margin-top: 0;
    }
    .input-group input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 0.85rem 0.95rem;
      font-size: 0.95rem;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
    }
    .input-group input:focus {
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
      background: white;
    }
    .summary-row, .summary-total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.8rem 0;
      color: #475569;
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);
    }
    .summary-total {
      border-bottom: 0;
      padding-bottom: 0;
      margin-top: 0.2rem;
      color: #0f172a;
      font-size: 1rem;
      font-weight: 700;
    }
    .billing-primary-button, .billing-secondary-button, .confirm-button {
      border-radius: 9999px;
    }
    .billing-primary-button {
      box-shadow: 0 18px 35px rgba(13, 148, 136, 0.24);
    }
    .billing-secondary-button {
      border-color: rgba(255,255,255,0.24) !important;
      background: rgba(255,255,255,0.08) !important;
      color: white !important;
    }
    .confirm-button {
      border-color: rgba(15, 118, 110, 0.25) !important;
      color: #0f766e !important;
      background: rgba(240, 253, 250, 0.95) !important;
    }
  `]
})
export class PremiumMembershipComponent implements OnInit {
  summary: PaymentSummary | null = null;
  checkout: CheckoutSession | null = null;
  loading = false;
  processingPayment = false;
  checkoutScriptLoaded = false;
  reason = '';
  workspaceId: number | null = null;
  selectedMethod: 'UPI' | 'CARD' | 'NETBANKING' = 'UPI';
  payerName = 'FlowBoard Member';
  payerEmail = 'member@flowboard.app';
  payerPhone = '9876543210';

  constructor(
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.ensureRazorpayScript();
    this.route.queryParamMap.subscribe(params => {
      this.reason = params.get('reason') || '';
      const workspaceId = Number(params.get('workspaceId'));
      this.workspaceId = Number.isFinite(workspaceId) && workspaceId > 0 ? workspaceId : null;
    });
    this.loadSummary();
  }

  get reasonCopy(): string {
    if (this.reason === 'workspace-limit') {
      return 'You have reached the free limit of five owned workspaces. Premium removes that ceiling.';
    }
    if (this.reason === 'member-limit') {
      return 'This workspace has reached the free limit of five members. Premium lets you keep inviting teammates.';
    }
    return '';
  }

  get displayAmount(): string {
    if (!this.summary) {
      return 'Loading...';
    }
    return `Rs. ${(this.summary.premiumAmountPaise / 100).toFixed(2)}`;
  }

  get isPayerFormValid(): boolean {
    return !!this.payerName.trim() && !!this.payerEmail.trim() && !!this.payerPhone.trim();
  }

  startCheckout(): void {
    this.loading = true;
    this.paymentService.createCheckout().subscribe({
      next: (checkout) => {
        this.loading = false;
        this.checkout = checkout;
        if (checkout.premiumAlreadyActive) {
          this.snack.open('Premium is already active on this account.', 'Close', { duration: 3000 });
          this.loadSummary();
          return;
        }
        this.snack.open('Razorpay order created.', 'Close', { duration: 2500 });
      },
      error: (err) => {
        this.loading = false;
        const message = err?.error?.message || err?.message || 'Failed to create Razorpay payment order';
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  launchCheckout(): void {
    if (!this.checkout?.providerOrderId || !this.isPayerFormValid) {
      return;
    }
    if (!this.checkoutScriptLoaded || !window.Razorpay) {
      this.snack.open('Razorpay checkout script is still loading. Try again in a moment.', 'Close', { duration: 3500 });
      return;
    }

    this.processingPayment = true;

    const razorpay = new window.Razorpay({
      key: this.checkout.keyId,
      amount: this.checkout.amountPaise,
      currency: this.checkout.currency,
      name: 'FlowBoard',
      description: this.checkout.description,
      order_id: this.checkout.providerOrderId,
      prefill: {
        name: this.payerName,
        email: this.payerEmail,
        contact: this.payerPhone,
      },
      notes: {
        plan: this.checkout.planCode,
        source: 'flowboard-premium',
        methodPreference: this.selectedMethod,
      },
      theme: {
        color: '#0f766e',
      },
      handler: (response: RazorpaySuccessPayload) => {
        this.completePayment(response);
      },
      modal: {
        ondismiss: () => {
          this.processingPayment = false;
          this.snack.open('Razorpay checkout was closed before payment completed.', 'Close', { duration: 3000 });
        },
      },
    });

    razorpay.open();
  }

  private loadSummary(): void {
    this.paymentService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to load premium summary';
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  private completePayment(response: RazorpaySuccessPayload): void {
    this.loading = true;
    this.paymentService.confirmPayment({
      providerOrderId: response.razorpay_order_id,
      providerPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    }).subscribe({
      next: (summary) => {
        this.loading = false;
        this.processingPayment = false;
        this.summary = summary;
        this.snack.open(`Payment completed with ${this.selectedMethod}. Premium activated successfully.`, 'Close', { duration: 3200 });
        if (this.workspaceId) {
          this.router.navigate(['/workspace', this.workspaceId]);
          return;
        }
        this.checkout = null;
      },
      error: (err) => {
        this.loading = false;
        this.processingPayment = false;
        const message = err?.error?.message || err?.message || 'Failed to verify Razorpay payment';
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  private ensureRazorpayScript(): void {
    const existing = document.querySelector('script[data-razorpay-checkout="true"]') as HTMLScriptElement | null;
    if (existing) {
      this.checkoutScriptLoaded = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset['razorpayCheckout'] = 'true';
    script.onload = () => {
      this.checkoutScriptLoaded = true;
    };
    document.body.appendChild(script);
  }
}
