const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../db/schema');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/activities/presets
router.get('/presets', authMiddleware, (req, res) => {
  const actions = db.prepare('SELECT * FROM eco_actions ORDER BY category, name').all();
  res.json({ actions });
});

// POST /api/activities/log
router.post(
  '/log',
  authMiddleware,
  [
    body('action_name').trim().notEmpty().withMessage('Action name is required'),
    body('category').isIn(['transport', 'diet', 'energy', 'travel', 'shopping', 'custom']),
    body('co2_saved_kg').isFloat({ min: 0 }).withMessage('CO2 saved must be a positive number'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action_id, action_name, category, co2_saved_kg, notes } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const logResult = db.prepare(`
      INSERT INTO activity_logs (user_id, action_id, action_name, category, co2_saved_kg, notes, logged_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, action_id || null, action_name, category, co2_saved_kg, notes || null, today);

    // Update streak
    let streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    if (!streak) {
      db.prepare('INSERT INTO streaks (user_id) VALUES (?)').run(userId);
      streak = { current_streak: 0, longest_streak: 0, last_log_date: null };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = streak.current_streak;
    if (streak.last_log_date === today) {
      // Already logged today — no change
    } else if (streak.last_log_date === yesterdayStr) {
      newStreak = (streak.current_streak || 0) + 1;
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, streak.longest_streak || 0);
    db.prepare(`
      UPDATE streaks SET current_streak = ?, longest_streak = ?, last_log_date = ? WHERE user_id = ?
    `).run(newStreak, newLongest, today, userId);

    const updatedStreak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    res.status(201).json({
      message: 'Activity logged successfully',
      log_id: logResult.lastInsertRowid,
      streak: updatedStreak,
    });
  }
);

// GET /api/activities/history
router.get('/history', authMiddleware, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const logs = db.prepare(`
    SELECT * FROM activity_logs WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(limit), parseInt(offset));

  const countRow = db.prepare('SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ?').get(req.user.id);
  res.json({ logs, total: countRow ? countRow.count : 0 });
});

// GET /api/activities/stats
router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.user.id;

  const totalRow = db.prepare(`
    SELECT COALESCE(SUM(co2_saved_kg), 0) as total FROM activity_logs WHERE user_id = ?
  `).get(userId);

  const byCategory = db.prepare(`
    SELECT category, COALESCE(SUM(co2_saved_kg), 0) as total_saved, COUNT(*) as count
    FROM activity_logs WHERE user_id = ?
    GROUP BY category ORDER BY total_saved DESC
  `).all(userId);

  // Last 30 days trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const trend = db.prepare(`
    SELECT logged_date as date, COALESCE(SUM(co2_saved_kg), 0) as co2_saved
    FROM activity_logs
    WHERE user_id = ? AND logged_date >= ?
    GROUP BY logged_date ORDER BY logged_date ASC
  `).all(userId, thirtyDaysAgoStr);

  const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId) || {
    current_streak: 0,
    longest_streak: 0,
    last_log_date: null,
  };

  const onboarding = db.prepare('SELECT * FROM onboarding WHERE user_id = ?').get(userId);

  res.json({
    total_saved: totalRow ? totalRow.total : 0,
    by_category: byCategory,
    trend,
    streak,
    baseline: onboarding ? onboarding.baseline_kg_co2 : null,
  });
});

module.exports = router;
