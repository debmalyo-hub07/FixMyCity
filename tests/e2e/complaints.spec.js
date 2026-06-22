const { test, expect, request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';
const DATASET = path.join(__dirname, '../../backend/my_dataset');

// Read quarantine log to skip known-bad images
let _quarantined = null;
function isQuarantined(category, filename) {
  if (!_quarantined) {
    const logPath = path.join(__dirname, '../../backend/nsfw_scan_results.json');
    if (fs.existsSync(logPath)) {
      const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      _quarantined = {};
      for (const [cat, r] of Object.entries(data)) {
        _quarantined[cat] = new Set((r.flagged || []).map(f => f.file));
      }
    } else {
      _quarantined = {};
    }
  }
  return (_quarantined[category] || new Set()).has(filename);
}

function getRandomImage(category, index = 5) {
  const dir = path.join(DATASET, category);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
  // Skip quarantined images — find first clean image at or after index
  for (let i = index; i < files.length; i++) {
    if (!isQuarantined(category, files[i])) return path.join(dir, files[i]);
  }
  // Try from beginning if nothing found after index
  for (let i = 0; i < Math.min(index, files.length); i++) {
    if (!isQuarantined(category, files[i])) return path.join(dir, files[i]);
  }
  return null;
}

function imageToBase64(imgPath) {
  const buf = fs.readFileSync(imgPath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function makeComplaint(type, imgPath) {
  return {
    citizenName: 'Playwright E2E Tester',
    citizenPhone: '9000000099',
    citizenLocation: 'E2E Test Colony, Test City',
    title: `E2E test: ${type}`,
    description: `Playwright automated E2E test for category: ${type}`,
    type,
    location: 'E2E Test Street, Test City',
    latitude: 12.9716,
    longitude: 77.5946,
    image: imageToBase64(imgPath),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 1: Browser UI Tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe('UI: Page Structure', () => {

  test('Homepage loads with correct title and h1', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/FixMyCity/i);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const titleText = await h1.textContent();
    console.log(`  h1: "${titleText}"`);
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: false });
  });

  test('Navigation links are visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    // At least one nav/button element should exist
    const navItems = page.locator('nav a, header a, header button').first();
    await expect(navItems).toBeVisible();
  });

  test('Stats section shows numbers', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    // Stats numbers should be visible
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/homepage-stats.png' });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 2: API — Health & System Status
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API: Health & Models', () => {

  test('Health endpoint — civic model loaded', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/health`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.model_loaded).toBe(true);
    console.log(`  Classifier: ${body.classifier}`);
  });

  test('Health endpoint — NSFW model loaded', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/health`);
    const body = await res.json();
    expect(body.nsfw_loaded).toBe(true);
    console.log(`  Content moderation: ${body.content_moderation}`);
  });

  test('Health endpoint — all 4 civic classes present', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/health`);
    const body = await res.json();
    expect(body.classes).toEqual(['drainage', 'others', 'potholes', 'streetlight']);
    expect(Object.keys(body.thresholds)).toHaveLength(4);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 3: API — Correct Category Submissions (ACCEPT)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API: Correct-category images → HTTP 201 ACCEPTED', () => {

  test('Pothole image → Potholes → HTTP 201', async ({ request }) => {
    const imgPath = getRandomImage('potholes', 0);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Potholes', imgPath),
    });
    const body = await res.json();
    expect(res.status(), `Expected 201, got ${res.status()}. Body: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
    console.log(`  Pothole: ACCEPTED — id=${body.id}`);
  });

  test('Drainage image → Drainage problem → HTTP 201', async ({ request }) => {
    const imgPath = getRandomImage('drainage', 0);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Drainage problem', imgPath),
    });
    const body = await res.json();
    expect(res.status(), `Expected 201, got ${res.status()}. Body: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
    console.log(`  Drainage: ACCEPTED — id=${body.id}`);
  });

  test('Streetlight image → Broken street light problem → HTTP 201', async ({ request }) => {
    const imgPath = getRandomImage('streetlight', 0);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Broken street light problem', imgPath),
    });
    const body = await res.json();
    expect(res.status(), `Expected 201, got ${res.status()}. Body: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
    console.log(`  Streetlight: ACCEPTED — id=${body.id}`);
  });

  test('Others image → Others → HTTP 201', async ({ request }) => {
    const imgPath = getRandomImage('others', 5);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Others', imgPath),
    });
    const body = await res.json();
    expect(res.status(), `Expected 201, got ${res.status()}. Body: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
    console.log(`  Others: ACCEPTED — id=${body.id}`);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 4: API — Cross-category Submissions (BLOCK)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API: Cross-category images → HTTP 422 BLOCKED', () => {

  test('Pothole image as "Drainage problem" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('potholes', 10);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Drainage problem', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Pothole→Drainage BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%) vs declared(${body.aiDetails?.declaredConfidence?.toFixed(0)}%)`);
  });

  test('Pothole image as "Broken street light problem" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('potholes', 12);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Broken street light problem', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Pothole→Streetlight BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%)`);
  });

  test('Drainage image as "Potholes" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('drainage', 10);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Potholes', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Drainage→Pothole BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%)`);
  });

  test('Drainage image as "Broken street light problem" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('drainage', 12);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Broken street light problem', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Drainage→Streetlight BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%)`);
  });

  test('Streetlight image as "Potholes" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('streetlight', 10);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Potholes', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Streetlight→Pothole BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%)`);
  });

  test('Streetlight image as "Drainage problem" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('streetlight', 12);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Drainage problem', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Streetlight→Drainage BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%)`);
  });

  test('Others image as "Potholes" → BLOCKED', async ({ request }) => {
    const imgPath = getRandomImage('others', 10);
    if (!imgPath) { test.skip(); return; }
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: makeComplaint('Potholes', imgPath),
    });
    const body = await res.json();
    expect(res.status()).toBe(422);
    expect(body.blocked).toBe(true);
    console.log(`  Others→Pothole BLOCKED: ${body.aiDetails?.topClass}(${body.aiDetails?.topConfidence?.toFixed(0)}%)`);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 5: API — Missing Fields Validation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API: Input validation', () => {

  test('Missing required fields → HTTP 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/complaints`, {
      data: { title: 'Missing fields test' }, // missing citizenName, phone, etc.
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/missing/i);
  });

  test('GET /api/complaints → returns array', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/complaints`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    console.log(`  Total complaints in DB: ${body.length}`);
  });

});
