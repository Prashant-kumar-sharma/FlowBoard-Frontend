export interface PaymentSummary {
  userId: number;
  premium: boolean;
  planCode: string;
  planName: string;
  workspaceLimit: number | null;
  memberLimit: number | null;
  premiumAmountPaise: number;
  currency: string;
  razorpayKeyId: string;
  activatedAt?: string | null;
}

export interface CheckoutSession {
  provider: string;
  keyId: string;
  providerOrderId: string;
  planCode: string;
  amountPaise: number;
  currency: string;
  displayAmount: string;
  title: string;
  description: string;
  customerMessage: string;
  premiumAlreadyActive: boolean;
}

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface ConfirmPaymentRequest {
  providerOrderId: string;
  providerPaymentId: string;
  razorpaySignature?: string;
}
