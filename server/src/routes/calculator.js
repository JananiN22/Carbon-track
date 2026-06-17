const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { calcBaseline } = require('../utils/co2Calculator');

const router = express.Router();

// POST /api/calculator
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

    const {
      transport_type = 'car',
      weekly_km = 0,
      diet_type = 'omnivore',
      electricity_kwh = 0,
      flights_per_year = 0,
    } = req.body;

    const breakdown = calcBaseline({
      transportType: transport_type,
      weeklyKm: weekly_km,
      dietType: diet_type,
      electricityKwh: electricity_kwh,
      flightsPerYear: flights_per_year,
    });

    const worldAvg = 4800;
    const percentVsAvg = Math.round(((breakdown.total - worldAvg) / worldAvg) * 100);

    res.json({ breakdown, world_avg_kg: worldAvg, percent_vs_avg: percentVsAvg });
  }
);

module.exports = router;
