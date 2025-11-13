import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when STRIPE_SECRET_KEY is not available
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      appInfo: {
        name: 'Leaderboard Saas',
        version: '0.1.0'
      }
    });
  }
  return stripeInstance;
}; 