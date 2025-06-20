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

    console.log(' Connected to DogWalkService');

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
    console.error(' Startup error:', err.message);
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
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.username AS walker_username,
        COUNT(DISTINCT r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        COUNT(DISTINCT wa.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      LEFT JOIN WalkApplications wa
        ON u.user_id = wa.walker_id
        AND wa.status = 'accepted'
        AND wa.request_id IN (
          SELECT request_id FROM WalkRequests WHERE status = 'completed'
        )
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(' Error in /api/walkers/summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
