export async function sendAdminEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ADMIN_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    throw new Error("Set RESEND_API_KEY and ADMIN_FROM_EMAIL to enable admin email verification and password recovery.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`The email service could not send the message (${response.status}).`);
  }
}
