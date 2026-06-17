const express = require('express');
const authMiddleware = require('../middleware/auth');
const { db } = require('../db/schema');
const { calcBaseline } = require('../utils/co2Calculator');

const router = express.Router();

const TIPS_BY_CATEGORY = {
  transport: [
    { title: 'Switch to Public Transit', description: 'Taking the bus or train instead of driving can cut your transport emissions by up to 60%.', impact: 'high', icon: '🚌' },
    { title: 'Try Cycling', description: 'Cycling for short trips eliminates transport emissions entirely and improves your health.', impact: 'high', icon: '🚲' },
    { title: 'Carpool Regularly', description: 'Sharing rides with colleagues or neighbors halves your per-person transport footprint.', impact: 'medium', icon: '🚗' },
    { title: 'Consider an EV', description: 'Electric vehicles produce ~50-70% fewer lifecycle emissions than petrol cars.', impact: 'high', icon: '⚡' },
    { title: 'Work From Home', description: 'Even one WFH day per week can reduce your annual transport emissions by 20%.', impact: 'medium', icon: '🏠' },
  ],
  diet: [
    { title: 'Try Meatless Mondays', description: 'One meat-free day per week reduces your diet emissions by about 14%.', impact: 'medium', icon: '🥗' },
    { title: 'Eat Less Beef', description: 'Beef produces 20x more emissions than plant proteins. Swapping once a week makes a big difference.', impact: 'high', icon: '🥦' },
    { title: 'Buy Local & Seasonal', description: 'Local food travels shorter distances, cutting food transport emissions significantly.', impact: 'low', icon: '🌽' },
    { title: 'Reduce Food Waste', description: 'About 8% of global emissions come from food waste. Plan meals and compost leftovers.', impact: 'medium', icon: '♻️' },
    { title: 'Try Plant-Based Proteins', description: 'Legumes, tofu, and nuts have a fraction of the carbon footprint of meat.', impact: 'high', icon: '🫘' },
  ],
  energy: [
    { title: 'Switch to LED Bulbs', description: 'LED bulbs use 75% less energy than incandescent and last 25x longer.', impact: 'low', icon: '💡' },
    { title: 'Install a Smart Thermostat', description: 'Smart thermostats can reduce heating/cooling energy use by 10-15%.', impact: 'medium', icon: '🌡️' },
    { title: 'Air-Dry Your Clothes', description: 'Skipping the dryer for one load saves about 0.6 kg CO2 each time.', impact: 'medium', icon: '👕' },
    { title: 'Switch to Renewable Energy', description: 'Many utilities offer green energy tariffs that dramatically cut your electricity footprint.', impact: 'high', icon: '☀️' },
    { title: 'Unplug Idle Electronics', description: 'Standby power accounts for up to 10% of household electricity use.', impact: 'low', icon: '🔌' },
  ],
  travel: [
    { title: 'Take the Train', description: 'Rail travel produces ~90% fewer emissions than flying for equivalent distances.', impact: 'high', icon: '🚄' },
    { title: 'Offset Your Flights', description: 'Purchase verified carbon offsets for unavoidable flights through Gold Standard projects.', impact: 'medium', icon: '✈️' },
    { title: 'Choose Staycations', description: 'Local holidays eliminate travel emissions entirely while supporting local economies.', impact: 'high', icon: '🏖️' },
    { title: 'Fly Economy Class', description: 'Business class has a 3x larger carbon footprint per seat than economy class.', impact: 'medium', icon: '💺' },
    { title: 'Bundle Your Trips', description: 'Combining multiple destinations into one trip is more efficient than separate journeys.', impact: 'medium', icon: '🗺️' },
  ],
  shopping: [
    { title: 'Buy Second-Hand', description: 'Thrift shopping extends product life and avoids new manufacturing emissions.', impact: 'medium', icon: '🛍️' },
    { title: 'Repair Before Replacing', description: 'Fixing items instead of buying new ones can save significant embedded carbon.', impact: 'medium', icon: '🔧' },
    { title: 'Choose Sustainable Brands', description: 'Support companies with verified sustainability certifications.', impact: 'high', icon: '🌿' },
  ],
};

const GENERAL_TIPS = [
  { title: 'Track Your Progress', description: 'Logging your eco-actions daily builds awareness and sustains motivation.', impact: 'low', icon: '📊' },
  { title: 'Talk to Friends & Family', description: 'Social influence is one of the most powerful drivers of behavior change.', impact: 'medium', icon: '👨‍👩‍👧' },
  { title: 'Plant a Tree', description: 'A single tree absorbs about 22 kg of CO2 per year over its lifetime.', impact: 'low', icon: '🌳' },
];

// GET /api/tips
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const onboarding = db.prepare('SELECT * FROM onboarding WHERE user_id = ?').get(userId);

  if (!onboarding) {
    return res.json({ tips: GENERAL_TIPS, top_category: null });
  }

  const breakdown = calcBaseline({
    transportType: onboarding.transport_type,
    weeklyKm: onboarding.weekly_km,
    dietType: onboarding.diet_type,
    electricityKwh: onboarding.electricity_kwh,
    flightsPerYear: onboarding.flights_per_year,
  });

  const categories = [
    { key: 'transport', value: breakdown.transport },
    { key: 'diet', value: breakdown.diet },
    { key: 'energy', value: breakdown.energy },
    { key: 'travel', value: breakdown.travel },
  ].sort((a, b) => b.value - a.value);

  const topCategory = categories[0].key;
  const secondCategory = categories[1].key;

  const tips = [
    ...(TIPS_BY_CATEGORY[topCategory] || []),
    ...(TIPS_BY_CATEGORY[secondCategory] || []).slice(0, 2),
    ...GENERAL_TIPS.slice(0, 2),
  ];

  res.json({ tips, top_category: topCategory, breakdown, category_ranking: categories });
});

module.exports = router;
