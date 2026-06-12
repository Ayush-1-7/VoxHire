const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("Seeding last call data...");

  const email = "ayush@example.com";
  
  // Upsert candidate
  const candidate = await db.candidate.upsert({
    where: { email: email },
    update: {
      name: "Ayush Sharma",
      phone: "+919876543210",
      jobRole: "Software Engineer",
      experience: "3 years",
      status: "INTERVIEW_SCHEDULED",
    },
    create: {
      name: "Ayush Sharma",
      email: email,
      phone: "+919876543210",
      jobRole: "Software Engineer",
      experience: "3 years",
      source: "voice-bot",
      status: "INTERVIEW_SCHEDULED",
      consentGiven: true,
    },
  });

  const transcript = [
    { role: "assistant", text: "Hello, thank you for calling Zensar Technologies. May I know your name and what position you're applying for?" },
    { role: "user", text: "My name is Ayush Sharma. I'm applying for the Software Engineer role." },
    { role: "assistant", text: "Great, Ayush. Can you tell me about your experience?" },
    { role: "user", text: "I have 3 years of experience in React, Node.js, and modern web application development." },
    { role: "assistant", text: "Excellent. Can you confirm your email address and phone number?" },
    { role: "user", text: "Yes, my email is ayush@example.com and my phone number is +919876543210." },
    { role: "assistant", text: "Thank you, Ayush. Your interview is scheduled for June fifteenth at ten AM, and you'll receive an email confirmation soon. If you have any questions later, feel free to reach out." },
    { role: "user", text: "Yeah. Thank you." },
    { role: "assistant", text: "You're welcome, Ayush. Uh, best of luck with your interview. If you need any further assistance, feel free to contact us. Have a wonderful day." },
    { role: "user", text: "Yes. Sure." }
  ];

  const call = await db.call.upsert({
    where: { vapiCallId: "local-call-1" },
    update: {
      candidateId: candidate.id,
      duration: 124,
      status: "COMPLETED",
      transcript: transcript,
      summary: "Candidate Ayush Sharma applied for Software Engineer role. 3 years experience. Scheduled interview on June 15, 2026 at 10:00 AM.",
      extractedData: {
        name: "Ayush Sharma",
        email: "ayush@example.com",
        phone: "+919876543210",
        jobRole: "Software Engineer",
        experience: "3 years",
        preferredInterviewDate: "2026-06-15T10:00:00.000Z"
      },
    },
    create: {
      vapiCallId: "local-call-1",
      candidateId: candidate.id,
      duration: 124,
      status: "COMPLETED",
      transcript: transcript,
      summary: "Candidate Ayush Sharma applied for Software Engineer role. 3 years experience. Scheduled interview on June 15, 2026 at 10:00 AM.",
      extractedData: {
        name: "Ayush Sharma",
        email: "ayush@example.com",
        phone: "+919876543210",
        jobRole: "Software Engineer",
        experience: "3 years",
        preferredInterviewDate: "2026-06-15T10:00:00.000Z"
      },
      startedAt: new Date(Date.now() - 124 * 1000),
      endedAt: new Date(),
    },
  });

  // Schedule an appointment
  const scheduledAt = new Date("2026-06-15T10:00:00.000Z");
  await db.appointment.upsert({
    where: { googleEventId: "local-meet-1" },
    update: {
      candidateId: candidate.id,
      scheduledAt: scheduledAt,
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      status: "SCHEDULED",
    },
    create: {
      candidateId: candidate.id,
      googleEventId: "local-meet-1",
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      title: "Interview - Ayush Sharma - Zensar Technologies",
      scheduledAt: scheduledAt,
      durationMinutes: 60,
      status: "SCHEDULED",
    },
  });

  // Update analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [callCount, newCandidates, scheduledInterviews] = await Promise.all([
    db.call.count({ where: { startedAt: { gte: today } } }),
    db.candidate.count({ where: { createdAt: { gte: today } } }),
    db.appointment.count({
      where: { createdAt: { gte: today }, status: "SCHEDULED" },
    }),
  ]);

  const callsToday = await db.call.findMany({
    where: { startedAt: { gte: today } },
    select: { duration: true }
  });
  const totalDuration = callsToday.reduce((acc, c) => acc + (c.duration || 0), 0);
  const avgDuration = callsToday.length > 0 ? totalDuration / callsToday.length : 0;

  await db.analytics.upsert({
    where: { date: today },
    create: { date: today, callCount, newCandidates, scheduledInterviews, avgDuration },
    update: { callCount, newCandidates, scheduledInterviews, avgDuration },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
