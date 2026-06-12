import fetch from "node-fetch";

const mockTranscript = [
  {
    "role": "assistant",
    "text": "Hello.",
    "timestamp": "2026-06-12T16:10:02.787Z"
  },
  {
    "role": "user",
    "text": "Hello. Hi.",
    "timestamp": "2026-06-12T16:10:05.857Z"
  },
  {
    "role": "assistant",
    "text": "Hello. Thank you for contacting Zentar Technologies recruitment team. My name is the Zentar virtual recruitment assistant. I'm here to guide you through the next steps of your recruitment process and answer any questions you may have about, uh, Zentar.",
    "timestamp": "2026-06-12T16:10:23.250Z"
  },
  {
    "role": "assistant",
    "text": "May I start by confirming your name? Could you please tell me your full name?",
    "timestamp": "2026-06-12T16:10:26.356Z"
  },
  {
    "role": "user",
    "text": "So my name is Batman.",
    "timestamp": "2026-06-12T16:10:31.276Z"
  },
  {
    "role": "assistant",
    "text": "Thank you, Batman. Could you please confirm the best phone number to reach you for interview updates?",
    "timestamp": "2026-06-12T16:10:38.369Z"
  },
  {
    "role": "user",
    "text": "So my phone number is one, two, three, four, five, six, seven, eight, nine",
    "timestamp": "2026-06-12T16:10:44.956Z"
  },
  {
    "role": "assistant",
    "text": "Thank you for providing your phone number. May I also have your email address so we can send interview details and updates.",
    "timestamp": "2026-06-12T16:10:49.635Z"
  },
  {
    "role": "user",
    "text": "So my email address is a y u s h one seven s s h at g mail dot com.",
    "timestamp": "2026-06-12T16:11:01.415Z"
  },
  {
    "role": "assistant",
    "text": "Thank you, Batman. I have your email as a u seventeen s s h at g mail dot com. Is that correct?",
    "timestamp": "2026-06-12T16:11:09.298Z"
  },
  {
    "role": "user",
    "text": "Yes.",
    "timestamp": "2026-06-12T16:11:11.017Z"
  },
  {
    "role": "assistant",
    "text": "Are you contacting us regarding your application or would you like to learn more about opportunities at Sensor Technologies?",
    "timestamp": "2026-06-12T16:11:16.702Z"
  },
  {
    "role": "user",
    "text": "Regarding my",
    "timestamp": "2026-06-12T16:11:18.410Z"
  },
  {
    "role": "assistant",
    "text": "Thank you for confirming, Batman. Uh, you're contacting us regarding your application. Would you like me to, uh, schedule the next step of your recruitment process such as an interview,",
    "timestamp": "2026-06-12T16:11:30.346Z"
  },
  {
    "role": "user",
    "text": "Yes, please do so.",
    "timestamp": "2026-06-12T16:11:31.085Z"
  },
  {
    "role": "assistant",
    "text": "Great. Please let me know your preferred date and time for the interview.",
    "timestamp": "2026-06-12T16:11:36.590Z"
  },
  {
    "role": "user",
    "text": "So it would be seventeenth of June at ten AM.",
    "timestamp": "2026-06-12T16:11:47.587Z"
  },
  {
    "role": "assistant",
    "text": "Just to confirm, you would like to schedule your interview on seventeenth June at ten AM. Is that correct?",
    "timestamp": "2026-06-12T16:11:54.085Z"
  },
  {
    "role": "user",
    "text": "Yes. Correct.",
    "timestamp": "2026-06-12T16:11:56.609Z"
  }
];

async function runTest() {
  console.log("Sending save-call request...");
  try {
    const res = await fetch("http://localhost:3000/api/vapi/save-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vapiCallId: `test-batman-${Date.now()}`,
        transcript: mockTranscript,
        duration: 190,
      }),
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Request failed:", error);
  }
}

runTest();
