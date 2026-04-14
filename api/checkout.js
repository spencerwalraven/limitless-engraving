module.exports = async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
    timeout: 30000,
  });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customer, shipping } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Build line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || '',
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity || 1,
    }));

    // Add shipping as a line item
    if (shipping && shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Flat rate shipping',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://limitless-engraving.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://limitless-engraving.vercel.app'}/checkout.html`,
      customer_email: customer?.email || undefined,
      metadata: {
        customer_name: customer?.name || '',
        customer_phone: customer?.phone || '',
        shipping_address: customer?.address || '',
        order_notes: customer?.notes || '',
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message, err.type, err.code);
    res.status(500).json({
      error: err.message,
      type: err.type || 'unknown',
      code: err.code || 'unknown',
      keyPresent: !!process.env.STRIPE_SECRET_KEY,
      keyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
      keyStart: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...' : 'missing',
      keyEnd: process.env.STRIPE_SECRET_KEY ? '...' + process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4) : 'missing',
      hasWhitespace: process.env.STRIPE_SECRET_KEY ? /\s/.test(process.env.STRIPE_SECRET_KEY) : false
    });
  }
};
