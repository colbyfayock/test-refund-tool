/*
  Have a real Stripe account you'd like to use?
  You can replace this import with: import Stripe from "stripe";
*/
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY, {
  apiVersion: '2022-11-15',
});

export async function getCoupons() {
  return stripe.coupons.list();
}

export async function createCoupon(name: string, amount: number) {
  return stripe.coupons.create({
    name,
    amount_off: amount,
    currency: 'USD'
  });
}

export async function createPromo(coupon: string) {
  return stripe.promotionCodes.create({
    coupon,
  });
}
