import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RECAPTCHA_THRESHOLD = 0.5;

async function verifyRecaptcha(token: string): Promise<boolean> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const projectId = process.env.RECAPTCHA_PROJECT_ID;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!apiKey || !projectId) return true; // Skip if not configured

  const res = await fetch(
    `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: {
          token,
          siteKey,
          expectedAction: "contact",
        },
      }),
    }
  );

  const data = await res.json();
  const passed =
    data.tokenProperties?.valid === true &&
    data.tokenProperties?.action === "contact" &&
    (data.riskAnalysis?.score ?? 0) >= RECAPTCHA_THRESHOLD;

  if (!passed) {
    console.warn("Contact form reCAPTCHA rejected:", {
      status: res.status,
      apiError: data.error?.message,
      valid: data.tokenProperties?.valid,
      invalidReason: data.tokenProperties?.invalidReason,
      hostname: data.tokenProperties?.hostname,
      action: data.tokenProperties?.action,
      score: data.riskAnalysis?.score,
    });
  }
  return passed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, category, message, recaptchaToken } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA Enterprise
    if (process.env.GOOGLE_CLOUD_API_KEY && process.env.RECAPTCHA_PROJECT_ID) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: "reCAPTCHA verification required." },
          { status: 400 }
        );
      }

      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        return NextResponse.json(
          { error: "reCAPTCHA verification failed. Please try again." },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_EMAIL;
    if (!apiKey || !to) {
      console.error("RESEND_API_KEY or CONTACT_EMAIL env var not set");
      return NextResponse.json(
        { error: "Contact form is not configured." },
        { status: 500 }
      );
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const subject = category
      ? `[Paint Color HQ] ${category}: ${name}`
      : `[Paint Color HQ] Contact: ${name}`;

    // Resend returns API failures (e.g. 401 invalid key) in `error` rather than throwing.
    const { error: sendError } = await resend.emails.send({
      from: "Paint Color HQ <contact@updates.paintcolorhq.com>",
      to,
      replyTo: email,
      subject,
      text: `Name: ${name}\nEmail: ${email}\nCategory: ${category || "General"}\n\nMessage:\n${message}`,
    });

    if (sendError) {
      console.error("Contact form Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
