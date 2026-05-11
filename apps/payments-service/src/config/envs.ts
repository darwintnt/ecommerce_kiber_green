export const configuration = () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  paymentDemoMode: process.env.PAYMENT_DEMO_MODE === 'true',
});
