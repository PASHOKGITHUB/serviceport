import express from 'express';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ message: 'Server working!' });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});