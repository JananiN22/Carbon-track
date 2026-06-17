const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { db } = require('../db/schema');
const { calcBaseline } = require('../utils/co2Calculator');

const router = express.Router();

// POST /api/simulator
router.post(
  '/',
  authMiddleware,
  [
    body('transport_type').optional().isIn(['car', 'motorcycle', 'transit', 'electric', 'bike', 'walk']),
    body('weekly_km').optional().isFloat({ min: 0 }),
    body('diet_type').optional().isIn(['meat-heavy', 'omnivore', 'vegetarian', 'vegan']),
    body('electricity_kwh').optional().isFloat({ min: 0 }),
    body('flights_per_year').optional().isInt({ min: 0 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const current = db.prepare('SELECT * FROM onboarding WHERE user_id = ?').get(userId);

    const baseline = current
      ? calcBaseline({
          transportType: current.transport_type,
          weeklyKm: current.weekly_km,
          dietType: current.diet_type,
          electricityKwh: current.electricity_kwh,
          flightsPerYear: current.flights_per_year,
        })
      : { transport: 0, diet: 0, energy: 0, travel: 0, total: 0 };

    const {
      transport_type = current?.transport_type || 'car',
      weekly_km = current?.weekly_km || 0,
      diet_type = current?.diet_type || 'omnivore',
      electricity_kwh = current?.electricity_kwh || 0,
      flights_per_year = current?.flights_per_year || 0,
    } = req.body;

    const projected = calcBaseline({
      transportType: transport_type,
      weeklyKm: weekly_km,
      dietType: diet_type,
      electricityKwh: electricity_kwh,
      flightsPerYear: flights_per_year,
    });

    const savings = {
      transport: Math.round((baseline.transport - projected.transport) * 10) / 10,
      diet: Math.round((baseline.diet - projected.diet) * 10) / 10,
      energy: Math.round((baseline.energy - projected.energy) * 10) / 10,
      travel: Math.round((baseline.travel - projected.travel) * 10) / 10,
      total: Math.round((baseline.total - projected.total) * 10) / 10,
    };

    const percentReduction =
      baseline.total > 0
        ? Math.round(((baseline.total - projected.total) / baseline.total) * 100)
        : 0;

    res.json({ current: baseline, projected, savings, percent_reduction: percentReduction });
  }
);

module.exports = router;
