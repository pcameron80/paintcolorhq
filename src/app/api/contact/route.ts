import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RECAPTCHA_THRESHOLD = 0.5;

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // Skip if not configured

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  });

  const data = await res.json();
  return data.success && data.score >= RECAPTCHA_THRESHOLD;
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

    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY) {
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

    await resend.emails.send({
      from: "Paint Color HQ <delivered@resend.dev>",
      to,
      replyTo: email,
      subject,
      text: `Name: ${name}\nEmail: ${email}\nCategory: ${category || "General"}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
