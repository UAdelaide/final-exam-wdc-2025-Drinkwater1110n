const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

app.use(express.json());

let db;

(async () => {
  try {
    // Connect to the DogWalkService database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    console.log('✅ Connected to DogWalkService');

    // Clear existing data and insert test data
    await db.query('DELETE FROM WalkRatings');
    await db.query('DELETE FROM WalkApplications');
    await db.query('DELETE FROM WalkRequests');
    await db.query('DELETE FROM Dogs');
    await db.query('DELETE FROM Users');

    await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES
        ('alice123', 'alice@example.com', 'hash1', 'owner'),
        ('carol123', 'carol@example.com', 'hash2', 'owner'),
        ('bobwalker', 'bob@example.com', 'hash3', 'walker'),
        ('newwalker', 'new@example.com', 'hash4', 'walker')
    `);

    await db.query(`
      INSERT INTO Dogs (owner_id, name, size)
      VALUES
        ((SELECT user_id FROM Users WHERE username='alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username='carol123'), 'Bella', 'small')
    `);

    await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      VALUES
        ((SELECT dog_id FROM Dogs WHERE name='Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name='Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted')
    `);

    await db.query(`
      INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments)
      VALUES (
        (SELECT request_id FROM WalkRequests WHERE status='accepted'),
        (SELECT user_id FROM Users WHERE username='bobwalker'),
        (SELECT user_id FROM Users WHERE username='carol123'),
        5, 'Great job!'
      )
    `);
  } catch (err) {
    console.error('❌ Startup error:', err.message);
  }
})();

// /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.query(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [walks] = await db.query(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(walks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// /api/walkers/summary



app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
