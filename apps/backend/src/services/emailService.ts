import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Gmail SMTP transport — requires GMAIL_USER and GMAIL_APP_PASSWORD in env
// Set up: Google Account → Security → 2-Step Verification → App Passwords
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'tastybites.almhult@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_NAME = 'Tasty Bites';
const FROM_ADDRESS = process.env.GMAIL_USER || 'tastybites.almhult@gmail.com';
const FROM = `${FROM_NAME} <${FROM_ADDRESS}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const NOTIFY_EMAIL = 'gurulakshmi25@gmail.com';

interface OrderItem {
  dish: { name: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  totalAmount: number;
  paymentMethod: string;
  pickupMessage: string | null;
  orderItems: OrderItem[];
}

interface DishSummaryEntry { name: string; totalQty: number }

function buildOrderHtml(order: Order, forCustomer = false, dishSummary?: DishSummaryEntry[]): string {
  const itemsHtml = order.orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.dish.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">×${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">SEK ${Number(item.price) * item.quantity}</td>
        </tr>`
    )
    .join('');

  const adminLink = forCustomer ? '' : `
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders"
         style="display:inline-block;background:#C2185B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        View in Admin Panel →
      </a>
    </div>`;

  const subtitle = forCustomer ? 'Your order is confirmed! 🎉' : 'New Order Received! 🎉';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:#C2185B;padding:32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">🍛 Tasty Bites</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${subtitle}</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 20px;font-size:20px;color:#111;">Order from ${order.customerName}</h2>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">📱 Mobile: <strong>${order.mobileNumber}</strong></p>
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">💳 Payment: <strong>${order.paymentMethod}</strong></p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">Order ID: ${order.id.slice(0, 8).toUpperCase()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Dish</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;font-weight:700;font-size:15px;color:#111;">Total</td>
            <td style="padding:12px;font-weight:700;font-size:18px;color:#C2185B;text-align:right;">SEK ${Number(order.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      ${order.pickupMessage ? `
      <div style="background:#fdf2f8;border:1px solid #f9c6e0;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#C2185B;">📍 Pickup Instructions</p>
        <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${order.pickupMessage}</p>
      </div>` : ''}
      ${!forCustomer && dishSummary && dishSummary.length > 0 ? `
      <div style="margin-top:28px;border-top:2px solid #f0f0f0;padding-top:24px;">
        <h3 style="margin:0 0 12px;font-size:15px;color:#111;font-weight:700;">📊 Live Preparation Summary</h3>
        <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;">Total dishes ordered across all active orders after this new order:</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:7px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Dish</th>
              <th style="padding:7px 12px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Total Qty</th>
            </tr>
          </thead>
          <tbody>
            ${dishSummary.map((d) => `<tr>
              <td style="padding:7px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;color:#374151;">${d.name}</td>
              <td style="padding:7px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;font-weight:700;color:#C2185B;text-align:right;">×${d.totalQty}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
      ${adminLink}
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Tasty Bites · Authentic Indian Food · Hjortvägen, Älmhult, Sweden</p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">📞 +46 769677497</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(
  order: Order,
  customerEmail?: string | null,
  dishSummary?: DishSummaryEntry[],
): Promise<void> {
  const sends: Promise<unknown>[] = [];
  const adminHtml = buildOrderHtml(order, false, dishSummary);
  const subject = `🍛 New Order — ${order.customerName} — SEK ${Number(order.totalAmount)}`;

  // Always notify admin
  if (ADMIN_EMAIL) {
    sends.push(
      transporter.sendMail({ from: FROM, to: ADMIN_EMAIL, subject, html: adminHtml })
        .catch((err) => logger.error('Failed to send admin email:', err))
    );
  }

  // Always notify the kitchen/preparation email
  sends.push(
    transporter.sendMail({ from: FROM, to: NOTIFY_EMAIL, subject, html: adminHtml })
      .catch((err) => logger.error('Failed to send notify email:', err))
  );

  // Send confirmation to customer if they provided email
  if (customerEmail) {
    sends.push(
      transporter.sendMail({
        from: FROM,
        to: customerEmail,
        subject: `✅ Your Tasty Bites order is confirmed! Order #${order.id.slice(0, 8).toUpperCase()}`,
        html: buildOrderHtml(order, true),
      }).catch((err) => logger.error('Failed to send customer email:', err))
    );
  }

  await Promise.all(sends);
  logger.info(`Emails sent for order ${order.id} (customer: ${!!customerEmail})`);
}

export async function sendTestEmail(): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: NOTIFY_EMAIL,
      subject: '✅ Tasty Bites Email Setup Successful!',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;">
          <h1 style="color:#C2185B;">🍛 Tasty Bites</h1>
          <p>Your Gmail email notifications are working perfectly!</p>
          <p style="color:#6b7280;font-size:14px;">You will receive an email like this every time a new order is placed.</p>
        </div>`,
    });
    return { success: true, id: info.messageId };
  } catch (err: unknown) {
    return { success: false, error: String(err) };
  }
}
