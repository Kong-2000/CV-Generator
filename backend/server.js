// ============================================================
// CV Generator – server.js
// Express backend that proxies Anthropic Claude API calls
// ============================================================

// Load .env from the same directory as this file (must be first)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'CV Generator API is running.' });
});

// ── POST /api/generate ───────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { fullName, jobTitle, workExperience, skills, education } = req.body;

  // Basic validation
  const missing = [];
  if (!fullName?.trim())       missing.push('fullName');
  if (!jobTitle?.trim())       missing.push('jobTitle');
  if (!workExperience?.trim()) missing.push('workExperience');
  if (!skills?.trim())         missing.push('skills');
  if (!education?.trim())      missing.push('education');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}.`,
    });
  }

  // API key check
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Please add your key to backend/.env.',
    });
  }

  // ── Build prompt ──────────────────────────────────────────
  const prompt = `You are a professional CV writer with 15 years of experience writing winning CVs for candidates across all industries.

Write a polished, professional CV for the following candidate. The CV must:
- Use clear, action-oriented language
- Highlight accomplishments over duties wherever possible
- Be structured with standard sections: Personal Summary, Work Experience, Skills, and Education
- Be ready to submit to employers — no placeholders or notes to the candidate
- Be formatted in plain text with clear section headings using ALL CAPS and dashes as separators

--- CANDIDATE DETAILS ---
Full Name:       ${fullName.trim()}
Job Title:       ${jobTitle.trim()}
Work Experience: ${workExperience.trim()}
Skills:          ${skills.trim()}
Education:       ${education.trim()}
---

Write the complete CV now:`;

  // ── Call Anthropic Claude API ─────────────────────────────
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg  = errBody?.error?.message || `Anthropic API error (${response.status}).`;
      console.error('[Anthropic Error]', errMsg);
      return res.status(502).json({ error: errMsg });
    }

    const data    = await response.json();
    const cvText  = data?.content?.[0]?.text;

    if (!cvText) {
      return res.status(502).json({ error: 'No content returned from Claude.' });
    }

    return res.json({ cv: cvText });

  } catch (err) {
    console.error('[Anthropic Error]', err);
    const errMsg = err?.message || 'Failed to reach the Anthropic API. Check your API key and try again.';
    return res.status(502).json({ error: errMsg });
  }
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✦  CV Generator API is running`);
  console.log(`   → http://localhost:${PORT}\n`);
});
