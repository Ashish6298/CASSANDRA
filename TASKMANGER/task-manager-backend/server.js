// server.js

const express = require('express');
const cors = require('cors');
const { Client } = require('cassandra-driver');
const { v4: uuidv4 } = require('uuid'); // Import uuidv4 from uuid module

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cassandra connection setup
const client = new Client({
  contactPoints: ['localhost'], // Replace with your Cassandra contact points
  localDataCenter: 'datacenter1', // Replace with your Cassandra local data center
  keyspace: 'your_keyspace' // Replace with your Cassandra keyspace
});

client.connect()
  .then(() => console.log('Connected to Cassandra'))
  .catch(err => console.error('Error connecting to Cassandra:', err));

// Example query to create table (run once)
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title TEXT,
    description TEXT,
    status TEXT
  );
`;

client.execute(createTableQuery)
  .then(() => console.log('Tasks table created'))
  .catch(err => console.error('Error creating tasks table:', err));

// GET all tasks
app.get('/tasks', async (req, res) => {
  const query = 'SELECT * FROM tasks';
  try {
    const result = await client.execute(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST a new task
app.post('/tasks', async (req, res) => {
  const { title, description, status } = req.body;
  const id = uuidv4(); // Generate UUID
  const query = 'INSERT INTO tasks (id, title, description, status) VALUES (?, ?, ?, ?)';
  const params = [id, title, description, status];

  try {
    await client.execute(query, params, { prepare: true });
    res.status(201).json({ id, title, description, status });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// PUT update a task
app.put('/tasks/:id', async (req, res) => {
  const { title, description, status } = req.body;
  const id = req.params.id;
  const query = 'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?';
  const params = [title, description, status, id];

  try {
    await client.execute(query, params, { prepare: true });
    res.json({ id, title, description, status });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE a task
app.delete('/tasks/:id', async (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM tasks WHERE id = ?';
  const params = [id];

  try {
    await client.execute(query, params, { prepare: true });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
