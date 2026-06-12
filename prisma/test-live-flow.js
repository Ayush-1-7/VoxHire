async function test() {
  console.log("Sending mock completed call payload to local save-call API...");
  
  const payload = {
    vapiCallId: "test-live-call-" + Date.now(),
    duration: 95,
    transcript: [
      { role: "assistant", text: "Hello! May I know your name and the position you're applying for?" },
      { role: "user", text: "Hi, I am Ayush Sharma. I'm applying for the software engineer role." },
      { role: "assistant", text: "Great, Ayush. How many years of experience do you have?" },
      { role: "user", text: "I have 3 years of experience in JavaScript." },
      { role: "assistant", text: "Awesome. Could you please confirm your email address and phone number?" },
      { role: "user", text: "Yes, my email is sharmaayush9900@gmail.com and my phone number is +919876543210." },
      { role: "assistant", text: "Perfect. We have slots available on June sixteenth at two PM. Does that work for you?" },
      { role: "user", text: "Yes, June sixteenth at two PM is great." },
      { role: "assistant", text: "Perfect, I've scheduled your interview for June sixteenth at two PM. You will receive an email confirmation shortly. Thank you!" },
      { role: "user", text: "Thank you, bye." }
    ]
  };

  try {
    const res = await fetch("http://localhost:3000/api/vapi/save-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
