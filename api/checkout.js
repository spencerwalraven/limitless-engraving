module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
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
        unit_amount: Math.round(item.price * 100),
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

    const origin = req.headers.origin || 'https://limitless-engraving.vercel.app';

    // Use fetch directly to Stripe API
    const params = new URLSearchParams();
    lineItems.forEach((item, i) => {
      params.append(`line_items[${i}][price_data][currency]`, item.price_data.currency);
      params.append(`line_items[${i}][price_data][product_data][name]`, item.price_data.product_data.name);
      if (item.price_data.product_data.description) {
        params.append(`line_items[${i}][price_data][product_data][description]`, item.price_data.product_data.description);
      }
      params.append(`line_items[${i}][price_data][unit_amount]`, item.price_data.unit_amount);
      params.append(`line_items[${i}][quantity]`, item.quantity);
    });
    params.append('mode', 'payment');
    params.append('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${origin}/checkout.html`);
    if (customer?.email) params.append('customer_email', customer.email);
    if (customer?.name) params.append('metadata[customer_name]', customer.name);
    if (customer?.phone) params.append('metadata[customer_phone]', customer.phone);
    if (customer?.address) params.append('metadata[shipping_address]', customer.address);
    if (customer?.notes) params.append('metadata[order_notes]', customer.notes);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Stripe error' });
    }

    res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
