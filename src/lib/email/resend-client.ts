import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface InterviewConfirmationParams {
  candidateName: string;
  candidateEmail: string;
  scheduledAt: Date;
  meetLink?: string;
  jobRole?: string;
  experience?: string;
}

export async function sendInterviewConfirmation(
  params: InterviewConfirmationParams
) {
  if (!resend) {
    console.warn("[Resend] Email client not configured — skipping email");
    return null;
  }

  const { candidateName, candidateEmail, scheduledAt, meetLink, jobRole, experience } = params;

  try {
    const formattedDate = scheduledAt.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = scheduledAt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const roleDisplayName = jobRole || "Software Engineer";
    const experienceText = experience ? `${experience} of experience` : "relevant experience";

    const isTeams = meetLink?.includes("teams.live.com") || meetLink?.includes("teams.microsoft.com");
    const platformName = isTeams ? "Microsoft Teams" : "Google Meet";
    const platformButtonColor = isTeams ? "#4b53bc" : "#6366f1"; // Purple accent for Teams, Indigo for Meet/Fallback

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Confirmation - Zensar Technologies</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">
                <!-- Header with Gradient Brand Color -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 32px; text-align: center;">
                    <div style="font-size: 13px; font-weight: 700; color: #e0e7ff; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Zensar Technologies</div>
                    <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.5px;">Interview Confirmed 🎉</h1>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td style="padding: 32px; background-color: #ffffff;">
                    <p style="font-size: 16px; line-height: 24px; color: #1e293b; margin: 0 0 16px 0;">Dear <strong>${candidateName}</strong>,</p>
                    <p style="font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 24px 0;">
                      Thank you for completing the preliminary voice screening with our Virtual Recruitment Assistant. 
                      Based on your profile showing <strong>${experienceText}</strong>, we are pleased to confirm the schedule for your technical round for the <strong>${roleDisplayName}</strong> role.
                    </p>
                    
                    <!-- Schedule Details Card -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">
                          <strong style="color: #475569; display: block; margin-bottom: 2px;">📅 INTERVIEW DATE</strong>
                          <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">
                          <strong style="color: #475569; display: block; margin-bottom: 2px;">🕐 INTERVIEW TIME</strong>
                          <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${formattedTime} (IST)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">
                          <strong style="color: #475569; display: block; margin-bottom: 2px;">💻 TARGET POSITION</strong>
                          <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${roleDisplayName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #64748b;">
                          <strong style="color: #475569; display: block; margin-bottom: 2px;">🏢 FORMAT</strong>
                          <span style="font-size: 15px; font-weight: 600; color: #0f172a;">Virtual Call (${platformName})</span>
                        </td>
                      </tr>
                    </table>

                    ${meetLink ? `
                    <!-- Action CTA Button -->
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                      <a href="${meetLink}" target="_blank" style="background-color: ${platformButtonColor}; background: linear-gradient(135deg, ${platformButtonColor} 0%, #312e81 180%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1); letter-spacing: 0.2px;">
                        Join Interview via ${platformName}
                      </a>
                    </div>
                    ` : ""}

                    <!-- Preparation Checklist -->
                    <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin: 32px 0 16px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Quick Preparation Tips</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 22px;">
                      <li style="margin-bottom: 8px;">Ensure you have a stable high-speed internet connection.</li>
                      <li style="margin-bottom: 8px;">Please join from a quiet location using a desktop/laptop for best coding/presentation compatibility.</li>
                      <li style="margin-bottom: 8px;">Test your microphone, headset, and web-camera prior to the scheduled slot.</li>
                      <li style="margin-bottom: 8px;">We recommend joining the interview link 5 minutes prior to the start time.</li>
                    </ul>

                    <!-- Footer Details -->
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                    <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0;">
                      Need to reschedule or cancel? Reply directly to this email at least 24 hours prior to the slot, and our team will get in touch with you.
                    </p>
                    <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 12px 0 0 0;">
                      Best regards,<br />
                      <strong>Zensar Technologies Recruitment Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Email Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                      This is an automated notification from Zensar Recruitment Portal. Please do not reply to this email directly unless requesting a reschedule.
                    </p>
                    <p style="font-size: 11px; color: #94a3b8; margin: 6px 0 0 0;">
                      &copy; 2026 Zensar Technologies. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    let data = null;
    let error: { statusCode?: number | null; message?: string; name?: string } | null = null;

    const ccEmails = candidateEmail.toLowerCase() !== "ayush17v@gmail.com"
      ? ["ayush17v@gmail.com"]
      : undefined;

    try {
      const res = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: [candidateEmail],
        cc: ccEmails,
        subject: `Interview Confirmation: ${roleDisplayName} - Zensar Technologies`,
        html: htmlContent,
      });
      data = res.data;
      if (res.error) {
        error = res.error;
      }
    } catch (e) {
      error = e as { statusCode?: number | null; message?: string; name?: string };
    }

    if (error) {
      const isSandboxError =
        error.statusCode === 403 ||
        (error.message &&
          error.message.toLowerCase().includes("you can only send testing emails"));

      if (isSandboxError && candidateEmail.toLowerCase() !== "ayush17v@gmail.com") {
        console.warn(
          `[Resend] Email to ${candidateEmail} blocked by Resend sandbox. Redirecting to ayush17v@gmail.com.`
        );

        const redirectedHtmlContent = htmlContent.replace(
          `<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">`,
          `<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <div style="background-color: #fffbeb; border-bottom: 1px solid #fde68a; color: #b45309; padding: 12px; font-size: 13px; text-align: center; font-weight: 500; font-family: sans-serif;">
            ⚠️ <strong>Resend Sandbox Mode:</strong> This email was originally sent to <strong>${candidateEmail}</strong> but was redirected to you (sandbox owner).
          </div>`
        );

        const retryRes = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: ["ayush17v@gmail.com"],
          subject: `[Sandbox Redirect] Interview Confirmation: ${roleDisplayName} - Zensar Technologies`,
          html: redirectedHtmlContent,
        });

        if (retryRes.error) {
          console.error("[Resend] Redirect retry failed:", retryRes.error);
          throw retryRes.error;
        }

        console.log(
          "[Resend] Sandbox redirected email sent to ayush17v@gmail.com:",
          retryRes.data?.id
        );
        return retryRes.data;
      }

      console.error("[Resend] Email error:", error);
      throw error;
    }

    console.log("[Resend] Email sent to", candidateEmail, ":", data?.id);
    return data;
  } catch (err) {
    console.error("[Resend] Failed to send email:", err);
    throw err;
  }
}
