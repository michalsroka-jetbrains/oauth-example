
import express, { Express } from 'express';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import cors from "cors";

const app: Express = express();
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

const port = 8001;

const DATA_API_URL = 'http://localhost:8000/api/sa/bigquery/data';

async function getBigQueryAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    keyFilename: 'melodic-arcadia-446313-u1-f46c22fed0b1.json', // path the JSON key
    scopes: ['https://www.googleapis.com/auth/bigquery', 'openid', 'email'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse) {
    throw new Error('Failed to acquire BigQuery access token.');
  }

  return typeof tokenResponse === 'string'
    ? tokenResponse
    : tokenResponse.token;
}

async function callDataApi() {
  const accessToken = await getBigQueryAccessToken();

  const response = await axios.get(
    DATA_API_URL,
    {
      headers: {
        'x-oauth-token': accessToken,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/data', async (req, res) => {
  try {

    const dataApiResponse = await callDataApi();

    res.json({
      success: true,
      data: dataApiResponse,
    });
  } catch (error) {
    console.error('Error calling Data API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to call Data API',
    });
  }
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
