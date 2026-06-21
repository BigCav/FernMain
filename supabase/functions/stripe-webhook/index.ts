import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const sig  = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, sig!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err) {
    console.error('Webhook signature error:', err);
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        const userId  = session.metadata?.userId;
        const subId   = session.subscription as string;
        if (userId && subId) await grantPlus(userId, subId);
        break;
      }
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        if (['canceled', 'unpaid'].includes(sub.status)) {
          await revokePlus(userId);
        } else {
          // Renewal — update the stored renewal date
          const renewalDate = getRenewalDate(sub);
          await patchProfile(userId, { fernPlusRenewalDate: renewalDate });
        }
        break;
      }
      case 'invoice.paid': {
        // Fires each billing cycle — keep renewal date current
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = invoice.subscription as string;
        if (!subId) break;
        const sub    = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.userId;
        if (userId) {
          await patchProfile(userId, { fernPlusRenewalDate: getRenewalDate(sub) });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) await revokePlus(userId);
        break;
      }
    }
  } catch (err) {
    console.error('Handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function getRenewalDate(sub: Stripe.Subscription): string {
  // current_period_end is on the subscription items in newer API versions
  const item = sub.items?.data?.[0];
  const ts   = (item as any)?.current_period_end ?? (sub as any).current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : '';
}

async function getProfile(userId: string) {
  const key = `user:${userId}:profile`;
  const { data } = await supabase
    .from('kv_store_4e6b560b')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return { key, value: (data?.value ?? {}) as Record<string, unknown> };
}

async function patchProfile(userId: string, patch: Record<string, unknown>) {
  const { key, value } = await getProfile(userId);
  await supabase
    .from('kv_store_4e6b560b')
    .update({ value: { ...value, ...patch } })
    .eq('key', key);
}

async function grantPlus(userId: string, subscriptionId: string) {
  const sub         = await stripe.subscriptions.retrieve(subscriptionId);
  const renewalDate = getRenewalDate(sub);
  const customerId  = sub.customer as string;
  await patchProfile(userId, {
    fernPlus: true,
    fernPlusExpiry: null,
    fernPlusSource: 'paid',
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    fernPlusRenewalDate: renewalDate,
  });
}

async function revokePlus(userId: string) {
  const { key, value } = await getProfile(userId);
  const v = { ...value };
  delete v.stripeSubscriptionId;
  delete v.stripeCustomerId;
  delete v.fernPlusRenewalDate;
  await supabase
    .from('kv_store_4e6b560b')
    .update({ value: { ...v, fernPlus: false, fernPlusExpiry: null, fernPlusSource: null } })
    .eq('key', key);
}
