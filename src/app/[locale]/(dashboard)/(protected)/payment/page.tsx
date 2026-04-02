import { PaymentCard } from '@/components/payment/payment-card';
import { constructMetadata } from '@/lib/metadata';

export const metadata = constructMetadata({
  title: 'Payment - Railway Template',
  description: 'Complete your payment.',
  noIndex: true,
});

export default function PaymentPage() {
  return <PaymentCard />;
}
