const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'bot_home.db');
let db;

function getDb() {
  if (!db || !db.open) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Database opened successfully.');
      }
    });
  }
  return db;
}

function initDb(callback) {
  const db = getDb();
  db.run(
    `CREATE TABLE IF NOT EXISTS home_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT,
      schematic TEXT,
      chunk_x INTEGER,
      chunk_z INTEGER,
      world TEXT
    )`,
    (err) => {
      if (callback) callback(err);
    }
  );
}

function saveHomeChunk(botId, schematic, chunkX, chunkZ, world = 'overworld') {
  const db = getDb();
  db.run(
    `INSERT INTO home_chunks (bot_id, schematic, chunk_x, chunk_z, world) VALUES (?, ?, ?, ?, ?)`,
    [botId, schematic, chunkX, chunkZ, world],
    function (err) {
      if (err) console.error('DB insert error:', err);
    }
  );
}

function getHomeChunks(botId, world = 'overworld', cb) {
  const db = getDb();
  db.all(
    `SELECT DISTINCT schematic, chunk_x, chunk_z FROM home_chunks WHERE bot_id = ? AND world = ?`,
    [botId, world],
    (err, rows) => {
      cb(err, rows);
    }
  );
}

function getBarrelPositions(chunkX, chunkZ) {
  // Returns the NW and NE corners of the chunk
  return [
    { x: chunkX * 16, z: chunkZ * 16 },
    { x: chunkX * 16 + 15, z: chunkZ * 16 }
  ];
}

module.exports = {
  initDb,
  saveHomeChunk,
  getHomeChunks,
  getBarrelPositions,
};
