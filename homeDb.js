const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'bot_home.db');

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

function initDb() {
  const db = getDb();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS home_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT,
      schematic TEXT,
      chunk_x INTEGER,
      chunk_z INTEGER,
      world TEXT
    )`);
  });
  db.close();
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
  db.close();
}

function getHomeChunks(botId, world = 'overworld', cb) {
  const db = getDb();
  db.all(
    `SELECT schematic, chunk_x, chunk_z FROM home_chunks WHERE bot_id = ? AND world = ?`,
    [botId, world],
    (err, rows) => {
      db.close();
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
