const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/schema');
const authMiddleware = require('../middleware/auth');
const { calcBaseline } = require('../utils/co2Calculator');

const router = express.Router();

// POST /api/onboarding
router.post(
  '/',
  authMiddleware,
  [
    body('transport_type').isIn(['car', 'motorcycle', 'transit', 'electric', 'bike', 'walk']),
    body('weekly_km').isFloat({ min: 0 }),
    body('diet_type').isIn(['meat-heavy', 'omnivore', 'vegetarian', 'vegan']),
    body('electricity_kwh').isFloat({ min: 0 }),
    body('flights_per_year').isInt({ min: 0 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transport_type, weekly_km, diet_type, electricity_kwh, flights_per_year } = req.body;
    const userId = req.user.id;

    const breakdown = calcBaseline({
      transportType: transport_type,
      weeklyKm: weekly_km,
      dietType: diet_type,
      electricityKwh: electricity_kwh,
      flightsPerYear: flights_per_year,
    });

    // Check if record exists
    const existing = db.prepare('SELECT id FROM onboarding WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare(`
        UPDATE onboarding SET
          transport_type = ?, weekly_km = ?, diet_type = ?,
          electricity_kwh = ?, flights_per_year = ?, baseline_kg_co2 = ?,
          updated_at = datetime('now')
        WHERE user_id = ?
      `).run(transport_type, weekly_km, diet_type, electricity_kwh, flights_per_year, breakdown.total, userId);
    } else {
      db.prepare(`
        INSERT INTO onboarding (user_id, transport_type, weekly_km, diet_type, electricity_kwh, flights_per_year, baseline_kg_co2)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, transport_type, weekly_km, diet_type, electricity_kwh, flights_per_year, breakdown.total);
    }

    db.prepare('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(userId);

    const streakExists = db.prepare('SELECT id FROM streaks WHERE user_id = ?').get(userId);
    if (!streakExists) {
      db.prepare('INSERT INTO streaks (user_id) VALUES (?)').run(userId);
    }

    res.json({ message: 'Onboarding saved', breakdown });
  }
);

// GET /api/onboarding
router.get('/', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM onboarding WHERE user_id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'No onboarding data found.' });

  const breakdown = calcBaseline({
    transportType: row.transport_type,
    weeklyKm: row.weekly_km,
    dietType: row.diet_type,
    electricityKwh: row.electricity_kwh,
    flightsPerYear: row.flights_per_year,
  });

  res.json({ onboarding: row, breakdown });
});

module.exports = router;
