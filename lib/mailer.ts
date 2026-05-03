import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'apps@saishreevitalife.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const DEPT_COLOR: Record<string, string> = {
  Nursing:      '#1a73e8',
  Housekeeping: '#34a853',
  Maintenance:  '#f29900',
};

export async function sendAlertEmail({
  room,
  department,
  notes,
}: {
  room: string;
  department: string;
  notes: string | null;
}) {
  const color = DEPT_COLOR[department] || '#888';
  const subject = `🔔 Room ${room} — ${department} Request`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">

      <!-- Header -->
      <div style="background:#1a73e8;padding:24px 28px;">
        <div style="color:#fff;font-size:20px;font-weight:800;">Sai Shree Vita Life</div>
        <div style="color:#e8f0fe;font-size:13px;margin-top:4px;">Patient Request Alert</div>
      </div>

      <!-- Alert Banner -->
      <div style="background:#fff8e1;padding:16px 28px;border-left:6px solid ${color};">
        <div style="font-size:16px;font-weight:800;color:${color};">
          🔔 ${department} requested from Room ${room}
        </div>
      </div>

      <!-- Details -->
      <div style="padding:20px 28px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;width:140px;">Room</td>
            <td style="padding:8px 0;font-size:16px;font-weight:800;color:#333;">${room}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;">Department</td>
            <td style="padding:8px 0;">
              <span style="background:${color};color:#fff;padding:4px 14px;border-radius:12px;font-size:14px;font-weight:700;">
                ${department}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;">Date & Time</td>
            <td style="padding:8px 0;font-size:14px;color:#333;">
              ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </td>
          </tr>
        </table>
      </div>

      <!-- Notes -->
      <div style="padding:20px 28px;">
        <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:8px;">Additional Notes</div>
        <div style="background:#f5f5f5;padding:14px;border-radius:8px;font-size:14px;color:#555;min-height:48px;">
          ${notes || '<em style="color:#aaa;">No notes provided</em>'}
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f5f5f5;padding:16px 28px;text-align:center;">
        <div style="font-size:12px;color:#aaa;">Sai Shree Vita Life — Patient Request System</div>
      </div>

    </div>
  `;

  // Per-department recipient, falls back to global ALERT_EMAIL_TO
  const to = process.env[`${department.toUpperCase()}_EMAIL_TO`]
    || process.env.ALERT_EMAIL_TO;

  await transporter.sendMail({
    from: `"SVH Apps" <${process.env.ALERT_EMAIL_FROM}>`,
    to,
    subject,
    html
  });
}
