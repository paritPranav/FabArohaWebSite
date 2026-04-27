// apps/server/src/utils/email.js
const nodemailer = require('nodemailer');

const FROM = process.env.EMAIL_FROM || 'FabAroha <noreply@fabaroha.com>';

// Create transporter — uses Ethereal (test) if no real SMTP creds provided
async function getTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // Fallback: Ethereal test account (preview emails at ethereal.email)
  const testAccount = await nodemailer.createTestAccount();
  console.log('[email] No SMTP creds — using Ethereal test account:', testAccount.user);
  return nodemailer.createTransport({
    host:   'smtp.ethereal.email',
    port:   587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function itemRows(items = []) {
  return items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F0EBE3;">
        <span style="font-weight:500;color:#3D2E22;">${i.title}</span><br/>
        <span style="font-size:12px;color:#9B8EA0;">Size: ${i.size} &middot; Qty: ${i.quantity}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #F0EBE3;text-align:right;font-weight:500;color:#3D2E22;">
        &#8377;${(i.price * i.quantity).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');
}

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#3D2E22;padding:28px 32px;border-radius:16px 16px 0 0;text-align:center;">
            <span style="font-size:24px;font-weight:700;color:#FAF7F2;letter-spacing:1px;">FabAroha</span><br/>
            <span style="font-size:11px;color:#C5B8A8;letter-spacing:2px;">STYLE · COMFORT · ELEGANCE</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFFFF;padding:32px;border-radius:0 0 16px 16px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="font-size:11px;color:#B0A09A;margin:0;">
              &copy; ${new Date().getFullYear()} FabAroha &mdash; Style, Comfort &amp; Elegance<br/>
              Questions? Email us at <a href="mailto:hello@fabaroha.in" style="color:#8FAF89;">hello@fabaroha.in</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

function orderPlacedHtml(order, userName) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabaroha.com';
  return baseTemplate(`
    <h2 style="font-size:22px;color:#3D2E22;margin:0 0 4px;">Order Confirmed!</h2>
    <p style="font-size:14px;color:#9B8EA0;margin:0 0 24px;">Hi ${userName}, your order has been placed successfully.</p>

    <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#9B8EA0;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#3D2E22;font-family:monospace;">
        #${order._id.toString().slice(-10).toUpperCase()}
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${itemRows(order.items)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${order.discount > 0 ? `<tr>
        <td style="font-size:13px;color:#9B8EA0;padding:3px 0;">Discount</td>
        <td style="font-size:13px;color:#8FAF89;text-align:right;">−&#8377;${order.discount.toLocaleString('en-IN')}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size:13px;color:#9B8EA0;padding:3px 0;">Delivery</td>
        <td style="font-size:13px;color:#8FAF89;text-align:right;">Free</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:700;color:#3D2E22;padding:8px 0 0;border-top:1px solid #F0EBE3;">Total</td>
        <td style="font-size:15px;font-weight:700;color:#3D2E22;text-align:right;padding:8px 0 0;border-top:1px solid #F0EBE3;">
          &#8377;${order.totalAmount.toLocaleString('en-IN')}
        </td>
      </tr>
    </table>

    <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#3D2E22;">
      <strong>Delivering to:</strong><br/>
      ${order.shippingAddress?.fullName || ''}<br/>
      ${order.shippingAddress?.line1 || ''}${order.shippingAddress?.line2 ? ', ' + order.shippingAddress.line2 : ''}<br/>
      ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} — ${order.shippingAddress?.pincode || ''}
    </div>

    <div style="text-align:center;">
      <a href="${siteUrl}/profile/orders/${order._id}"
        style="display:inline-block;background:#3D2E22;color:#FAF7F2;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;">
        View Order
      </a>
    </div>
  `);
}

function orderStatusHtml(order, userName) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabaroha.com';
  const statusMessages = {
    confirmed:  'Great news! Your order has been confirmed and is being prepared.',
    processing: 'Your order is being packed and will be dispatched soon.',
    shipped:    'Your order is on its way! Track it using the details below.',
    delivered:  'Your order has been delivered. We hope you love it!',
    cancelled:  'Your order has been cancelled. Contact us if you have questions.',
  };
  const message = statusMessages[order.orderStatus] || `Your order status has been updated to ${order.orderStatus}.`;

  return baseTemplate(`
    <h2 style="font-size:22px;color:#3D2E22;margin:0 0 4px;">Order Update</h2>
    <p style="font-size:14px;color:#9B8EA0;margin:0 0 20px;">Hi ${userName}, here's an update on your order.</p>

    <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:12px;color:#9B8EA0;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#3D2E22;font-family:monospace;">
        #${order._id.toString().slice(-10).toUpperCase()}
      </p>
    </div>

    <div style="background:#F0EBF6;border-left:4px solid #8FAF89;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#3D2E22;text-transform:capitalize;">
        Status: ${order.orderStatus}
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#5C4A3A;">${message}</p>
    </div>

    ${order.trackingNumber ? `
    <div style="background:#FAF7F2;border-radius:12px;padding:14px 20px;margin-bottom:20px;font-size:13px;color:#3D2E22;">
      <strong>Tracking Number:</strong> <span style="font-family:monospace;">${order.trackingNumber}</span><br/>
      ${order.estimatedDelivery ? `<strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}` : ''}
    </div>` : ''}

    <div style="text-align:center;">
      <a href="${siteUrl}/profile/orders/${order._id}"
        style="display:inline-block;background:#3D2E22;color:#FAF7F2;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;">
        Track Order
      </a>
    </div>
  `);
}

// ── Send functions ────────────────────────────────────────────────────────────

async function sendOrderPlacedEmail(order, user) {
  if (!user?.email) return;
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from:    FROM,
      to:      user.email,
      subject: `Order Confirmed — #${order._id.toString().slice(-10).toUpperCase()} | FabAroha`,
      html:    orderPlacedHtml(order, user.name || 'there'),
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[email] Preview URL: ${preview}`);
    else console.log(`[email] Order placed email sent to ${user.email}`);
  } catch (err) {
    console.error('[email] Failed to send order placed email:', err.message);
  }
}

async function sendOrderStatusEmail(order, user) {
  if (!user?.email) return;
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from:    FROM,
      to:      user.email,
      subject: `Order Update: ${order.orderStatus} — #${order._id.toString().slice(-10).toUpperCase()} | FabAroha`,
      html:    orderStatusHtml(order, user.name || 'there'),
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[email] Preview URL: ${preview}`);
    else console.log(`[email] Status update email sent to ${user.email}`);
  } catch (err) {
    console.error('[email] Failed to send status email:', err.message);
  }
}

module.exports = { sendOrderPlacedEmail, sendOrderStatusEmail };
