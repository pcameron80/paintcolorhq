import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TURNSTILE_ACTION = "contact";

// Cloudflare Turnstile siteverify. Fails closed on any error or mismatch.
async function verifyTurnstile(token: unknown, remoteip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );

  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || !secret || expectedHostnames.size === 0) {
    return false;
  }

  const params = new URLSearchParams({ secret, response: token });
  if (remoteip) params.set("remoteip", remoteip);

  let result;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: params,
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    result = await res.json();
  } catch (err) {
    console.error("Contact form Turnstile siteverify failed:", err);
    return false;
  }

  const passed =
    result.success === true &&
    result.action === TURNSTILE_ACTION &&
    expectedHostnames.has(result.hostname);

  if (!passed) {
    console.warn("Contact form Turnstile rejected:", {
      success: result.success,
      errorCodes: result["error-codes"],
      action: result.action,
      hostname: result.hostname,
    });
  }
  return passed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, category, message, turnstileToken } = body;

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

    if (!process.env.TURNSTILE_SECRET || !process.env.TURNSTILE_HOSTNAMES) {
      console.error("TURNSTILE_SECRET or TURNSTILE_HOSTNAMES env var not set");
      return NextResponse.json(
        { error: "Contact form is not configured." },
        { status: 500 }
      );
    }

    const remoteip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    if (!(await verifyTurnstile(turnstileToken, remoteip))) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 403 }
      );
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
