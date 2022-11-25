import Interval, { io, ctx } from '@interval/sdk';
import 'dotenv/config'; // loads environment variables from .env
import { getCharges, refundCharge } from './payments';
import { getCoupons, createCoupon, createPromo } from './coupons';

const interval = new Interval({
  apiKey: process.env.INTERVAL_KEY,
  actions: {
    refund_user: async () => {
      const customerEmail = await io.input.email(
        'Email of the customer to refund:'
      );
      console.log('Email:', customerEmail);
      const charges = await getCharges(customerEmail);

      const chargesToRefund = await io.select.table(
        'Select one or more charges to refund',
        {
          data: charges,
        }
      );

      await ctx.loading.start({
        title: 'Refunding charges',
        // Because we specified `itemsInQueue`, Interval will render a progress bar versus an indeterminate loading indicator.
        itemsInQueue: chargesToRefund.length,
      });

      for (const charge of chargesToRefund) {
        await refundCharge(charge.id);
        await ctx.loading.completeOne();
      }

      // Values returned from actions are automatically stored with Interval transaction logs
      return { chargesRefunded: chargesToRefund.length };
    },
    add_coupon: async () => {
      const [ name, amount ] = await io.group([
        io.input.text('Name or Description'),
        io.input.number('Amount', {
          decimals: 2
        })
      ], {
        continueButton: {
          label: 'Create Coupon'
        }
      });

      const coupon = await createCoupon(name, amount * 100);

      await io.group([
        io.display.table('Coupons', {
          data: [coupon]
        })
      ], {
        continueButton: {
          label: 'Finish'
        }
      });

      return { couponCreated: 1 };
    },
    add_promo: async () => {
      const coupons = await getCoupons();

      const [promoCoupon] = await io.group([
        io.select.single('Coupons', {
          options: coupons.data.map(coupon => {
            return {
              label: coupon.name,
              value: coupon.id
            }
          }),
          helpText: 'Select one coupon to use for promo code'
        })
      ], {
        continueButton: {
          label: 'Create Promo Code'
        }
      })

      const promo = await createPromo(promoCoupon.value);

      await io.group([
        io.display.table('Promo', {
          data: [promo]
        }),

        io.display.code('Code', {
          code: promo.code
        }),
      ], {
        continueButton: {
          label: 'Finish'
        }
      });

      return { promoCreated: 1 };
    },
  },
});

// Establishes a persistent connection between Interval and your app.
interval.listen();
