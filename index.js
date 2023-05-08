// server.js
import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { nanoid } from 'nanoid';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import urlRegex from 'url-regex';

const app = express();
const port = process.env.PORT || 8080;
const mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb+srv://testing:4Pw0VFVYlDjKJ8NH@url-shortener.ig7cz5n.mongodb.net/urlShortener', { useUnifiedTopology: true });

var redisClient = createClient({
  password: "TvSWop8f5ndl6uupnJ1el2cskmqXEORw",
  socket: {
    host: "redis-14006.c275.us-east-1-4.ec2.cloud.redislabs.com",
    port: 14006,
  },
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('common'));
app.use(json());
app.use(compression());

// Routes
app.post('/newurl', async (req, res) => {
  const { url } = req.body;

  if (!urlRegex({ exact: true }).test(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const key = nanoid(9);
  const existingUrl = await redisClient.get(`url:${key}`);

  if (existingUrl) {
    return res.status(409).json({ error: 'Short URL already exists' });
  }

  try {
    const result = await mongoClient.db().collection('urls').insertOne({ key, url });
    await redisClient.set(`url:${key}`, url);
    res.json({ url, shortenUri: `http://localhost:${port}/${key}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/:key', async (req, res) => {
  const { key } = req.params;
  const url = await redisClient.get(`url:${key}`);

  if (!url) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  res.redirect(302, url);
});

// Start server
Promise.all([redisClient.connect(), mongoClient.connect()])
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
