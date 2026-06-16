/**
 * Regression tests for transcript → candidate extraction.
 *
 *   npm run test:extract
 *
 * Exercises realistic speech-to-text phrasings for name, role, email, phone,
 * experience, and date so future changes don't regress real-world calls.
 * Exit code 0 = all pass, 1 = a failure.
 */
import * as fs from "fs";
import * as path from "path";

const shell = new Set(Object.keys(process.env));
for (const f of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p))
    for (const l of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !shell.has(m[1])) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
}

import { extractCandidateData } from "../src/lib/vapi/extract-data";

type Turn = { role: string; text: string };
const u = (text: string): Turn => ({ role: "user", text });
const a = (text: string): Turn => ({ role: "assistant", text });

interface Case {
  name: string;
  turns: Turn[];
  expect: {
    name?: string;
    jobRole?: string;
    email?: string;
    phoneDigits?: string;
    experience?: string;
    hasDate?: boolean;
  };
}

const ASK_NAME = a("Hello! May I know your full name?");
const ASK_ROLE = a("Which role are you applying for?");

const CASES: Case[] = [
  // ---- Names ----
  { name: "name: my name is", turns: [ASK_NAME, u("My name is John Doe.")], expect: { name: "John Doe" } },
  { name: "name: my full name is", turns: [ASK_NAME, u("So my full name is Priya Sharma.")], expect: { name: "Priya Sharma" } },
  { name: "name: I'm X", turns: [ASK_NAME, u("Hi, I'm Ravi.")], expect: { name: "Ravi" } },
  { name: "name: this is X", turns: [ASK_NAME, u("This is Arjun Mehta speaking.")], expect: { name: "Arjun Mehta" } },
  { name: "name: call me X", turns: [ASK_NAME, u("You can call me Sam.")], expect: { name: "Sam" } },
  { name: "name: after question only", turns: [ASK_NAME, u("Meera Nair.")], expect: { name: "Meera Nair" } },
  { name: "name: lowercase STT", turns: [ASK_NAME, u("my name is rohit")], expect: { name: "Rohit" } },
  { name: "name: ignores 'looking for'", turns: [ASK_NAME, u("So my full name is Kavya."), a("What are you applying for?"), u("So I am looking for, uh, my application.")], expect: { name: "Kavya" } },
  { name: "name: no false positive", turns: [a("What are you applying for?"), u("I am looking for a job opportunity.")], expect: { name: undefined } },

  // ---- Roles ----
  { name: "role: job role is X", turns: [ASK_ROLE, u("So the job role is cloud engineer.")], expect: { jobRole: "Cloud Engineer" } },
  { name: "role: applying for X", turns: [ASK_ROLE, u("I'm applying for data scientist.")], expect: { jobRole: "Data Scientist" } },
  { name: "role: position is X", turns: [ASK_ROLE, u("The position is product manager.")], expect: { jobRole: "Product Manager" } },
  { name: "role: keyword devops", turns: [ASK_ROLE, u("I work in devops engineer roles.")], expect: { jobRole: "Devops Engineer" } },
  { name: "role: keyword full stack", turns: [ASK_ROLE, u("Mostly full stack developer work.")], expect: { jobRole: "Full Stack Developer" } },
  { name: "role: data analyst", turns: [ASK_ROLE, u("Guide me for data analyst only.")], expect: { jobRole: "Data Analyst" } },

  // ---- Email (spoken) ----
  { name: "email: spelled letters", turns: [a("Email?"), u("It is j o h n at gmail dot com.")], expect: { email: "john@gmail.com" } },
  { name: "email: with digits", turns: [a("Email?"), u("priya nine nine at gmail dot com")], expect: { email: "priya99@gmail.com" } },

  // ---- Phone (spoken) ----
  { name: "phone: spoken digits", turns: [a("Phone?"), u("nine eight seven six five four three two one zero")], expect: { phoneDigits: "9876543210" } },

  // ---- Experience ----
  { name: "exp: N years", turns: [a("Experience?"), u("I have five years of experience.")], expect: { experience: "5 years" } },

  // ---- Dates ----
  { name: "date: relative weekday word-time", turns: [a("Date?"), u("Friday at eleven AM works.")], expect: { hasDate: true } },
  { name: "date: tomorrow", turns: [a("Date?"), u("Tomorrow at 3 pm please.")], expect: { hasDate: true } },
  { name: "date: absolute month", turns: [a("Date?"), u("The seventeenth of June at ten AM.")], expect: { hasDate: true } },
];

(async () => {
  let pass = 0;
  const failures: string[] = [];

  for (const c of CASES) {
    const r = await extractCandidateData(c.turns);
    const checks: Array<[string, boolean, string]> = [];

    if ("name" in c.expect)
      checks.push(["name", (r.name ?? undefined) === c.expect.name, `got "${r.name}" want "${c.expect.name}"`]);
    if (c.expect.jobRole !== undefined)
      checks.push(["jobRole", r.jobRole === c.expect.jobRole, `got "${r.jobRole}" want "${c.expect.jobRole}"`]);
    if (c.expect.email !== undefined)
      checks.push(["email", r.email === c.expect.email, `got "${r.email}" want "${c.expect.email}"`]);
    if (c.expect.phoneDigits !== undefined)
      checks.push(["phone", (r.phone ?? "").replace(/\D/g, "") === c.expect.phoneDigits, `got "${r.phone}"`]);
    if (c.expect.experience !== undefined)
      checks.push(["experience", r.experience === c.expect.experience, `got "${r.experience}" want "${c.expect.experience}"`]);
    if (c.expect.hasDate !== undefined)
      checks.push(["date", Boolean(r.preferredInterviewDate) === c.expect.hasDate, `got "${r.preferredInterviewDate}"`]);

    const failed = checks.filter(([, ok]) => !ok);
    if (failed.length === 0) {
      pass++;
      console.log(`  PASS  ${c.name}`);
    } else {
      failures.push(c.name);
      console.log(`  FAIL  ${c.name}`);
      for (const [field, , msg] of failed) console.log(`        ${field}: ${msg}`);
    }
  }

  console.log(`\n${pass}/${CASES.length} passed` + (failures.length ? ` — failing: ${failures.join(", ")}` : " ✅"));
  process.exit(failures.length ? 1 : 0);
})();
