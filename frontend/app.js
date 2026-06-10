/* ============================================================
   CV Generator – app.js
   Handles form validation, API calls, and UI state
   ============================================================ */

const API_URL = 'http://localhost:3000/api/generate';

// ── DOM References ──────────────────────────────────────────
const form          = document.getElementById('cv-form');
const generateBtn   = document.getElementById('generate-btn');
const clearBtn      = document.getElementById('clear-btn');
const outputSection = document.getElementById('output-section');
const errorBanner   = document.getElementById('error-banner');
const errorMessage  = document.getElementById('error-message');
const resultCard    = document.getElementById('result-card');
const cvOutput      = document.getElementById('cv-output');
const resultName    = document.getElementById('result-name');
const copyBtn       = document.getElementById('copy-btn');
const copyIcon      = document.getElementById('copy-icon');
const printBtn      = document.getElementById('print-btn');

// ── Validation ───────────────────────────────────────────────
const FIELDS = ['fullName', 'jobTitle', 'workExperience', 'skills', 'education'];

function validateForm(data) {
  let isValid = true;

  FIELDS.forEach(id => {
    clearFieldError(id);
    const value = (data[id] || '').trim();
    if (!value) {
      showFieldError(id, 'This field is required.');
      isValid = false;
    }
  });

  return isValid;
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`error-${fieldId}`);
  if (input)   input.classList.add('is-error');
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`error-${fieldId}`);
  if (input)   input.classList.remove('is-error');
  if (errorEl) errorEl.textContent = '';
}

function clearAllErrors() {
  FIELDS.forEach(id => clearFieldError(id));
}

// ── State Helpers ────────────────────────────────────────────
function setLoading(loading) {
  generateBtn.disabled = loading;
  if (loading) {
    generateBtn.classList.add('loading');
    generateBtn.setAttribute('aria-busy', 'true');
  } else {
    generateBtn.classList.remove('loading');
    generateBtn.removeAttribute('aria-busy');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorBanner.hidden = false;
  resultCard.hidden  = true;
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  errorBanner.hidden = true;
}

function showResult(cvText, name) {
  resultName.textContent = name ? `Generated for ${name}` : '';
  cvOutput.textContent = cvText;
  resultCard.hidden = false;
  hideError();
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Get Form Data ────────────────────────────────────────────
function getFormData() {
  return {
    fullName:       document.getElementById('fullName').value,
    jobTitle:       document.getElementById('jobTitle').value,
    workExperience: document.getElementById('workExperience').value,
    skills:         document.getElementById('skills').value,
    education:      document.getElementById('education').value,
  };
}

// ── Generate CV ──────────────────────────────────────────────
async function generateCV(formData) {
  setLoading(true);
  hideError();

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Invalid response from server. Please try again.');
    }

    if (!response.ok) {
      const msg = result?.error || `Server error (${response.status}). Please try again.`;
      throw new Error(msg);
    }

    if (!result?.cv) {
      throw new Error('The server returned an empty CV. Please try again.');
    }

    showResult(result.cv, formData.fullName.trim());

  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      showError('Cannot reach the server. Make sure the backend is running on http://localhost:3000.');
    } else {
      showError(err.message || 'Something went wrong. Please try again.');
    }
  } finally {
    setLoading(false);
  }
}

// ── Event Listeners ──────────────────────────────────────────

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const data = getFormData();
  if (!validateForm(data)) {
    // Scroll to first error
    const firstError = form.querySelector('.is-error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  await generateCV(data);
});

// Clear form
clearBtn.addEventListener('click', () => {
  form.reset();
  clearAllErrors();
  hideError();
  resultCard.hidden = true;
  document.getElementById('fullName').focus();
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  const text = cvOutput.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyIcon.textContent = '✅';
    copyBtn.querySelector('span:last-child') && (copyBtn.querySelector('span:last-child').textContent = ' Copied!');
    copyBtn.textContent = '';
    copyBtn.innerHTML = '<span>✅</span> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<span id="copy-icon">📋</span> Copy';
    }, 2000);
  } catch {
    // Fallback for browsers without clipboard API
    const range = document.createRange();
    range.selectNodeContents(cvOutput);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    copyBtn.innerHTML = '<span>✅</span> Copied!';
    setTimeout(() => { copyBtn.innerHTML = '<span id="copy-icon">📋</span> Copy'; }, 2000);
  }
});

// Print
printBtn.addEventListener('click', () => {
  const content = cvOutput.textContent;
  if (!content) return;

  const name = resultName.textContent.replace('Generated for ', '').trim() || 'CV';
  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name} – CV</title>
      <style>
        body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.8; margin: 2.5cm; color: #1a1b2e; }
        pre  { white-space: pre-wrap; word-break: break-word; }
        @page { margin: 2.5cm; }
      </style>
    </head>
    <body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
});

// Clear error on input change
FIELDS.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => clearFieldError(id));
  }
});
