require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/db/schema');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initDB();

    // Mount routes AFTER DB is ready
    const authRoutes = require('./src/routes/auth');
    const onboardingRoutes = require('./src/routes/onboarding');
    const activitiesRoutes = require('./src/routes/activities');
    const calculatorRoutes = require('./src/routes/calculator');
    const simulatorRoutes = require('./src/routes/simulator');
    const tipsRoutes = require('./src/routes/tips');

    app.use('/api/auth', authRoutes);
    app.use('/api/onboarding', onboardingRoutes);
    app.use('/api/activities', activitiesRoutes);
    app.use('/api/calculator', calculatorRoutes);
    app.use('/api/simulator', simulatorRoutes);
    app.use('/api/tips', tipsRoutes);

    app.listen(PORT, () => {
      console.log(`🌿 CarbonTrack server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
