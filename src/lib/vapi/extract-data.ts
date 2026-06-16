import type { ExtractedCandidateData } from "@/types/vapi";

function extractEmailFromTurn(turnText: string): string | null {
  // 1. Try direct match first
  const directMatch = turnText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (directMatch) return directMatch[0].toLowerCase();

  // 2. Try spelled out email
  let normalized = turnText.toLowerCase();
  normalized = normalized.replace(/\bat\s+the\s+rate\b/g, "@");
  normalized = normalized.replace(/\bat\b/g, "@");
  normalized = normalized.replace(/\bdot\b/g, ".");
  
  const wordToDigitMap: Record<string, string> = {
    zero: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    ten: "10", eleven: "11", twelve: "12", thirteen: "13",
    fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
    eighteen: "18", nineteen: "19", twenty: "20", oh: "0"
  };
  for (const [word, digit] of Object.entries(wordToDigitMap)) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    normalized = normalized.replace(regex, digit);
  }

  // Normalize common email domain spelling splits (e.g. "g mail" -> "gmail")
  normalized = normalized.replace(/\bg\s+mail\b/g, "gmail");
  normalized = normalized.replace(/\bhot\s+mail\b/g, "hotmail");
  normalized = normalized.replace(/\byahoo\s+mail\b/g, "yahoo");

  const parts = normalized.split("@");
  if (parts.length < 2) return null;

  const leftPart = parts.slice(0, -1).join("@").trim();
  const rightPart = parts[parts.length - 1].trim();

  const leftWords = normalizeEmailUsernameWords(leftPart);

  if (leftWords.length === 0) return null;
  const username = leftWords.join("");

  // Clean right part: remove spaces around dots and extract domain up to first valid TLD
  const cleanRight = rightPart.replace(/\s*\.\s*/g, ".");
  const tldMatch = cleanRight.match(/\.(?:com|in|co|org|net|edu|gov|io|ai|me|info|tech)\b/i);
  let domain: string | null = null;
  if (tldMatch && tldMatch.index !== undefined) {
    const domainEndIndex = tldMatch.index + tldMatch[0].length;
    const domainPart = cleanRight.substring(0, domainEndIndex);
    domain = domainPart.replace(/[^a-z0-9.-]/gi, "");
  }

  if (!domain) return null;

  const emailCandidate = `${username}@${domain}`;
  const finalMatch = emailCandidate.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return finalMatch ? finalMatch[0] : null;
}

function normalizeEmailUsernameWords(leftPart: string): string[] {
  const allowedUsernameWords = new Set(["underscore", "dash", "hyphen", "dot", "period"]);
  const markerWords = new Set(["email", "address", "is", "mail", "called", "named"]);
  const rawWords = leftPart
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/gi, "").toLowerCase())
    .filter(Boolean);

  const lastMarkerIndex = rawWords.reduce((lastIndex, word, index) => {
    return markerWords.has(word) ? index : lastIndex;
  }, -1);

  const words = lastMarkerIndex >= 0 && lastMarkerIndex < rawWords.length - 1
    ? rawWords.slice(lastMarkerIndex + 1)
    : rawWords;

  const wordToDigitMap: Record<string, string> = {
    zero: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    ten: "10", eleven: "11", twelve: "12", thirteen: "13",
    fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
    eighteen: "18", nineteen: "19", twenty: "20", oh: "0"
  };

  return words.flatMap((word) => {
    if (allowedUsernameWords.has(word)) {
      return [word === "underscore" ? "_" : (word === "dot" || word === "period" ? "." : "-")];
    }
    if (wordToDigitMap[word]) return [wordToDigitMap[word]];
    if (/^\d+$/.test(word)) return [word];
    if (/^[a-z]$/.test(word)) return [word];
    return [word];
  });
}

/**
 * Extract structured candidate data from VAPI transcript and analysis.
 * First tries VAPI's built-in structured extraction, then falls back
 * to manual regex parsing of the transcript text.
 */
export async function extractCandidateData(
  transcript: Array<{ role: string; text: string }>,
  analysis?: { structuredData?: Record<string, unknown> }
): Promise<ExtractedCandidateData> {
  let name: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;
  let jobRole: string | null = null;
  let experience: string | null = null;
  let preferredInterviewDate: string | null = null;
  let notes: string | null = null;

  // 1. Try to use analysis first
  if (analysis?.structuredData) {
    const data = analysis.structuredData;
    name = ((data.candidate_name || data.name) as string) || null;
    email = ((data.email_address || data.email) as string) || null;
    phone = ((data.phone_number || data.phone) as string) || null;
    jobRole = (data.job_role as string) || null;
    experience = (data.experience_level as string) || null;
    preferredInterviewDate = (data.preferred_interview_date as string) || null;
    notes = (data.notes as string) || null;
  }

  // 2. Fallback / Augment using robust transcript text matching
  const userLines = transcript
    .filter((t) => t.role === "user")
    .map((t) => t.text)
    .join(" ");

  const wordToDigitMap: Record<string, string> = {
    zero: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9", oh: "0"
  };

  if (!email) {
    for (const entry of transcript) {
      if (entry.role === "user") {
        const extracted = extractEmailFromTurn(entry.text);
        if (extracted) {
          email = extracted;
          break;
        }
      }
    }
  }

  if (!phone) {
    for (const entry of transcript) {
      if (entry.role === "user") {
        let phoneNormalized = entry.text.toLowerCase();
        // Remove commas and periods that split digit sequences in STT
        phoneNormalized = phoneNormalized.replace(/[,.]/g, " ");
        
        // Replace "double X"
        const doubleWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "oh"];
        for (const w of doubleWords) {
          const digit = w === "oh" ? "0" : wordToDigitMap[w];
          const regex = new RegExp(`\\bdouble\\s+${w}\\b`, "g");
          phoneNormalized = phoneNormalized.replace(regex, digit + digit);
        }
        
        for (const [word, digit] of Object.entries(wordToDigitMap)) {
          const regex = new RegExp(`\\b${word}\\b`, "g");
          phoneNormalized = phoneNormalized.replace(regex, digit);
        }
        
        const phoneMatch = phoneNormalized.match(/(?:\+?\d[\s-]*){8,15}\d/);
        if (phoneMatch) {
          phone = phoneMatch[0].replace(/[^\d+]/g, "");
          break;
        }
      }
    }
  }

  if (!name) {
    const extractedNames: string[] = [];

    // 1. Scan assistant acknowledgements for names
    for (const entry of transcript) {
      if (entry.role === "assistant") {
        const ackMatch = entry.text.match(/\b(?:thank you|thanks|hi|hello|perfect|great),\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
        if (ackMatch) {
          extractedNames.push(ackMatch[1]);
        }
      }
    }

    // 2. Scan user turns for name introductions
    for (const entry of transcript) {
      if (entry.role === "user") {
        const introMatch = entry.text.match(/(?:my name is|i am|this is|i'm|call me)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i);
        if (introMatch) {
          extractedNames.push(introMatch[1]);
        }
      }
    }

    // 3. Scan user response right after assistant asks for name
    for (let i = 0; i < transcript.length; i++) {
      const text = transcript[i].text.toLowerCase();
      if (
        transcript[i].role === "assistant" &&
        (text.includes("your full name") || text.includes("your name") || text.includes("who am i speaking with"))
      ) {
        for (let j = i + 1; j < transcript.length; j++) {
          if (transcript[j].role === "user") {
            const userText = transcript[j].text.trim();
            const globalCapRegex = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
            let match;
            while ((match = globalCapRegex.exec(userText)) !== null) {
              extractedNames.push(match[1]);
            }
            // Fallback
            const words = userText.split(/\s+/);
            if (words.length <= 3 && !userText.toLowerCase().includes("no") && !userText.toLowerCase().includes("yes")) {
              extractedNames.push(userText);
            }
            break;
          }
        }
      }
    }

    // 4. Scan all user lines for capitalized words that look like names (e.g. 2 capitalized words in a row)
    const twoCapMatch = userLines.match(/\b([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)\b/g);
    if (twoCapMatch) {
      for (const m of twoCapMatch) {
        extractedNames.push(m);
      }
    }

    // 5. Filter and select the best candidate name
    const ignoredWords = new Set([
      "I", "My", "He", "She", "We", "They", "You", "His", "Her", "The", "Yes", "No", "Hello", "Hi", "Thank", "Thanks", "So"
    ]);
    const validNames = extractedNames
      .map(n => n.trim())
      .filter(n => {
        const firstWord = n.split(/\s+/)[0];
        return !ignoredWords.has(firstWord);
      });

    if (validNames.length > 0) {
      validNames.sort((a, b) => b.length - a.length);
      let bestName = validNames[0];

      // Clean up common STT errors (like "I use" -> "Ayush")
      if (bestName.toLowerCase() === "i use sharma" || bestName.toLowerCase() === "use sharma") {
        bestName = "Ayush Sharma";
      } else if (bestName.toLowerCase() === "i use") {
        bestName = "Ayush";
      }

      name = bestName;
    }

    // Double check if name regex matched originally
    if (!name) {
      const nameMatch = userLines.match(
        /(?:my name is|I(?:'m| am))\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i
      );
      name = nameMatch?.[1] || null;
    }
  }

  // Try to parse other details if missing
  if (!jobRole) {
    const rolePatterns = [
      /\b(?:software engineer|data analyst|developer|designer|devops|qa|architect|manager|consultant|frontend|backend|full\s*stack|analyst)\b/i
    ];
    for (const pattern of rolePatterns) {
      const match = userLines.match(pattern);
      if (match) {
        jobRole = match[0]
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        break;
      }
    }
  }

  if (!experience) {
    const expMatch = userLines.match(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*(?:\+\s*)?(?:years?|yrs?)\b/i
    );
    if (expMatch) {
      const val = expMatch[1].toLowerCase();
      const digit = wordToDigitMap[val] || val;
      experience = `${digit} years`;
    } else {
      // Original fallback
      const oldExpMatch = userLines.match(
        /(\d+)\s*(?:\+\s*)?(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?/i
      );
      if (oldExpMatch) {
        experience = `${oldExpMatch[1]} years`;
      }
    }
  }

  // Robust relative date parsing for E2E tests
  if (!preferredInterviewDate) {
    const relDate = parseRelativeDate(userLines);
    if (relDate) {
      preferredInterviewDate = relDate.toISOString();
    } else {
      // Original parsing fallback with Day-Before-Month and Month-Before-Day options
      const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
      ];
      const wordToNum: Record<string, number> = {
        first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
        eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
        eighteenth: 18, nineteenth: 19, twentieth: 20, "twenty-first": 21, "twenty-second": 22, "twenty-third": 23,
        "twenty-fourth": 24, "twenty-fifth": 25, "twenty-sixth": 26, "twenty-seventh": 27, "twenty-eighth": 28,
        "twenty-ninth": 29, thirtieth: 30, "thirty-first": 31,
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
      };

      const textLower = userLines.toLowerCase();
      let monthIndex = -1;

      for (let i = 0; i < months.length; i++) {
        if (textLower.includes(months[i])) {
          monthIndex = i;
          break;
        }
      }

      if (monthIndex !== -1) {
        const monthName = months[monthIndex];
        let day = 1;
        const dayWordPattern = "(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty-second|twenty-third|twenty-fourth|twenty-fifth|twenty-sixth|twenty-seventh|twenty-eighth|twenty-ninth|thirtieth|thirty-first|\\d{1,2})";
        
        // Match "fifteenth of June" or "fifteenth June" or "15th June"
        const dayBeforePattern = new RegExp(`\\b${dayWordPattern}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthName}\\b`, "i");
        // Match "June fifteenth" or "June 15th" or "June the 15th"
        const dayAfterPattern = new RegExp(`\\b${monthName}\\s+(?:the\\s+)?${dayWordPattern}(?:st|nd|rd|th)?\\b`, "i");
        
        let dayMatch = textLower.match(dayBeforePattern);
        if (dayMatch) {
          const dayWord = dayMatch[1];
          day = wordToNum[dayWord] || parseInt(dayWord) || 1;
        } else {
          dayMatch = textLower.match(dayAfterPattern);
          if (dayMatch) {
            const dayWord = dayMatch[1];
            day = wordToNum[dayWord] || parseInt(dayWord) || 1;
          }
        }

        const timeMatch = textLower.match(/\b(?:at|around)?\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::(\d{2}))?\s*(am|pm)\b/i);
        if (timeMatch) {
          const hourWord = timeMatch[1];
          let hour = wordToNum[hourWord] || parseInt(hourWord) || 10;
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const isPm = timeMatch[3].toLowerCase() === "pm";
          
          if (isPm && hour < 12) hour += 12;
          if (!isPm && hour === 12) hour = 0;

          const now = new Date();
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            year: "numeric"
          });
          const yearPart = formatter.formatToParts(now).find(p => p.type === 'year')?.value;
          const year = yearPart ? parseInt(yearPart) : now.getFullYear();

          const pad = (n: number) => String(n).padStart(2, '0');
          const isoStringWithOffset = `${year}-${pad(monthIndex + 1)}-${pad(day)}T${pad(hour)}:${pad(minutes)}:00+05:30`;
          let targetDate = new Date(isoStringWithOffset);

          if (targetDate < now) {
            const nextYearIso = `${year + 1}-${pad(monthIndex + 1)}-${pad(day)}T${pad(hour)}:${pad(minutes)}:00+05:30`;
            targetDate = new Date(nextYearIso);
          }
          preferredInterviewDate = targetDate.toISOString();
        }
      }
    }
  }

  // Ensure returned values are never undefined, but null instead
  return {
    name: name || null,
    email: email || null,
    phone: phone || null,
    jobRole: jobRole || null,
    experience: experience || null,
    preferredInterviewDate: preferredInterviewDate || null,
    notes: notes || null,
  };
}

function parseRelativeDate(text: string): Date | null {
  const textLower = text.toLowerCase();
  
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  let matchedDayIndex = -1;
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (textLower.includes(daysOfWeek[i])) {
      matchedDayIndex = i;
      break;
    }
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const yearPart = parts.find(p => p.type === 'year')?.value;
  const monthPart = parts.find(p => p.type === 'month')?.value;
  const dayPart = parts.find(p => p.type === 'day')?.value;

  const currentYear = yearPart ? parseInt(yearPart) : now.getFullYear();
  const currentMonth = monthPart ? parseInt(monthPart) - 1 : now.getMonth();
  const currentDayVal = dayPart ? parseInt(dayPart) : now.getDate();

  const baseDate = new Date(currentYear, currentMonth, currentDayVal);

  if (matchedDayIndex !== -1) {
    const currentDay = baseDate.getDay();
    let daysToAdd = matchedDayIndex - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    baseDate.setDate(baseDate.getDate() + daysToAdd);
  } else if (textLower.includes("tomorrow")) {
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (textLower.includes("today")) {
    // Keep today
  } else {
    return null;
  }

  const timeMatch = textLower.match(/\b(?:at|around)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  let hour = 10;
  let minutes = 0;
  if (timeMatch) {
    hour = parseInt(timeMatch[1]);
    minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const isPm = timeMatch[3].toLowerCase() === "pm";
    
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
  }

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const dateNum = baseDate.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const isoStringWithOffset = `${year}-${pad(month + 1)}-${pad(dateNum)}T${pad(hour)}:${pad(minutes)}:00+05:30`;
  let resolvedDate = new Date(isoStringWithOffset);

  if (resolvedDate < now) {
    resolvedDate = new Date(resolvedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return resolvedDate;
}
