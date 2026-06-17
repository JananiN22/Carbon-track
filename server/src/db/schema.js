/**
 * sql.js wrapper that exposes a better-sqlite3-compatible synchronous API.
 * Loads the DB from disk on startup, saves after every write operation.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = path.resolve(process.env.DB_PATH || './carbontrack.db');

// We export a promise that resolves to the db instance.
// server.js awaits this before starting.
let _db = null;

function saveDB() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * Creates a prepared-statement-like object compatible with better-sqlite3.
 * Supports .get(), .all(), .run() with positional params.
 */
function makePrepared(sql) {
  return {
    get(...args) {
      const params = args.flat();
      const stmt = _db.prepare(sql);
      try {
        stmt.bind(params.length ? params : []);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const obj = {};
          cols.forEach((c, i) => obj[c] = vals[i]);
          return obj;
        }
        return undefined;
      } finally {
        stmt.free();
      }
    },
    all(...args) {
      const params = args.flat();
      const stmt = _db.prepare(sql);
      const rows = [];
      try {
        stmt.bind(params.length ? params : []);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const obj = {};
          cols.forEach((c, i) => obj[c] = vals[i]);
          rows.push(obj);
        }
      } finally {
        stmt.free();
      }
      return rows;
    },
    run(...args) {
      const params = args.flat();
      _db.run(sql, params.length ? params : []);
      // Get last insert rowid + changes before export() clears it
      const meta = _db.exec('SELECT last_insert_rowid(), changes()');
      const vals = meta[0]?.values[0] || [0, 0];
      saveDB();
      return { lastInsertRowid: vals[0], changes: vals[1] };
    },
  };
}

/**
 * Thin wrapper object mimicking better-sqlite3's Database interface.
 */
const dbProxy = {
  prepare: (sql) => makePrepared(sql),
  exec(sql) {
    _db.run(sql);
    saveDB();
    return this;
  },
  pragma(str) {
    _db.run(`PRAGMA ${str}`);
    return this;
  },
  transaction(fn) {
    return (...args) => {
      _db.run('BEGIN');
      try {
        const result = fn(...args);
        _db.run('COMMIT');
        saveDB();
        return result;
      } catch (e) {
        _db.run('ROLLBACK');
        throw e;
      }
    };
  },
};

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({
    locateFile: (file) =>
      path.join(__dirname, '../../node_modules/sql.js/dist/', file),
  });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
    console.log(`✅ Loaded existing DB from ${DB_PATH}`);
  } else {
    _db = new SQL.Database();
    console.log(`✅ Created new DB at ${DB_PATH}`);
  }

  // Create schema
  _db.run(`PRAGMA foreign_keys = ON;`);

  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      onboarding_complete INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS onboarding (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      transport_type TEXT DEFAULT 'car',
      weekly_km REAL DEFAULT 0,
      diet_type TEXT DEFAULT 'omnivore',
      electricity_kwh REAL DEFAULT 0,
      flights_per_year INTEGER DEFAULT 0,
      baseline_kg_co2 REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS eco_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      co2_saved_kg REAL NOT NULL,
      icon TEXT DEFAULT '🌱'
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action_id INTEGER,
      action_name TEXT NOT NULL,
      category TEXT NOT NULL,
      co2_saved_kg REAL NOT NULL,
      notes TEXT,
      logged_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_log_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  saveDB();

  // Seed eco_actions if empty
  const countResult = _db.exec('SELECT COUNT(*) as c FROM eco_actions');
  const rowCount = countResult[0]?.values[0]?.[0] ?? 0;

  if (rowCount === 0) {
    const seedActions = [
      ['transport', 'Bike Instead of Car', 'Cycle to work or errands instead of driving', 2.1, '🚲'],
      ['transport', 'Use Public Transit', 'Take bus/train instead of driving', 1.5, '🚌'],
      ['transport', 'Walk Short Distances', 'Walk trips under 2km instead of driving', 0.8, '🚶'],
      ['transport', 'Carpool to Work', 'Share a car ride with a colleague', 1.2, '🚗'],
      ['transport', 'Work From Home', 'Avoid commute entirely for one day', 1.8, '🏠'],
      ['diet', 'Eat Vegan Meal', 'Have a fully plant-based meal', 1.5, '🥗'],
      ['diet', 'Eat Vegetarian Meal', 'Skip meat for one meal', 0.9, '🥦'],
      ['diet', 'Reduce Food Waste', 'Compost or plan meals to avoid waste', 0.5, '♻️'],
      ['diet', 'Buy Local Produce', 'Purchase locally sourced food', 0.3, '🌽'],
      ['energy', 'Turn Off Lights', 'Switch off unused lights for 8 hours', 0.2, '💡'],
      ['energy', 'Unplug Devices', 'Unplug electronics when not in use', 0.15, '🔌'],
      ['energy', 'Shorter Shower', 'Reduce shower time by 5 minutes', 0.1, '🚿'],
      ['energy', 'Air Dry Clothes', 'Skip the dryer and air dry laundry', 0.6, '👕'],
      ['energy', 'Adjust Thermostat', 'Lower heating/cooling by 2°C', 0.5, '🌡️'],
      ['travel', 'Skip One Flight', 'Choose train or video call instead', 180.0, '✈️'],
      ['travel', 'Stay Local for Holiday', 'Vacation within driving distance', 90.0, '🏖️'],
      ['travel', 'Take Economy Class', 'Fly economy instead of business', 40.0, '💺'],
      ['shopping', 'Buy Second-Hand', 'Purchase used item instead of new', 5.0, '🛍️'],
      ['shopping', 'Refuse Single-Use Plastic', 'Decline plastic bags and straws', 0.1, '♻️'],
      ['shopping', 'Repair Instead of Replace', 'Fix a broken item instead of buying new', 8.0, '🔧'],
    ];

    for (const [cat, name, desc, co2, icon] of seedActions) {
      _db.run(
        'INSERT INTO eco_actions (category, name, description, co2_saved_kg, icon) VALUES (?, ?, ?, ?, ?)',
        [cat, name, desc, co2, icon]
      );
    }
    saveDB();
    console.log('✅ Seeded eco_actions table');
  }

  console.log('✅ Database ready');
  return dbProxy;
}

module.exports = { initDB, db: dbProxy };
