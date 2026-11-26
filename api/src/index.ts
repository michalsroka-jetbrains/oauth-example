import express, { Express, Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import qs from "qs";
import session from 'express-session';
import { executeBigQuery } from "./bigqueryService";
import { getPrincipalFromAccessToken, refreshAccessToken } from "./tokenService";

const app: Express = express();

app.use(express.json());
app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true,
    })
);
app.use(
    session({
        secret: process.env.SESSION_SECRET ?? '',
        resave: false,
        saveUninitialized: true,
    })
);

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/auth/callback', async (req, res) => {
    const { code, scope } = req.query;

    try {
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            qs.stringify({
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        getPrincipalFromAccessToken(access_token);

        req.session.accessToken = access_token;
        req.session.refreshToken = refresh_token;
        req.session.tokenExpiry = Date.now() + expires_in * 1000;

        res.status(200).send('Auth completed. This window can be closed.');
    } catch (error: any) {
        console.error('Error exchanging code for tokens:', error.response?.data || error.message);
        res.status(500).send('Authentication failed.');
    }
});

app.get('/api/bigquery/data', async (req, res) => {
    try {
        if (!req.session.accessToken || !req.session.refreshToken) {
            res.status(401).send('Unauthorized');
            return;
        }

        if (!req.session.tokenExpiry || Date.now() >= req.session.tokenExpiry) {
            const tokenData = await refreshAccessToken(req.session.refreshToken);
            req.session.accessToken = tokenData.accessToken;
            req.session.tokenExpiry = Date.now() + tokenData.expiresIn * 1000;
        }

        const accessToken = req.session.accessToken;
        const projectId = process.env.GCP_PROJECT_ID ?? '';
        const query = 'SELECT text_col, num_col FROM `test_id.test_table_a` LIMIT 25;';

        const data = await executeBigQuery(accessToken, projectId, query);

        console.log(`Response: ${data}`);

        res.json(data);
    } catch (error) {
        console.error('Error fetching BigQuery data:', error);
        res.status(500).send('Failed to fetch BigQuery data.');
    }
});

app.get('/api/sa/bigquery/data', async (req, res) => {
    try {
        const accessToken = req.headers['x-oauth-token'];

        if (!accessToken || typeof accessToken !== 'string') {
            res.status(401).send('Unauthorized');
            return;
        }
        getPrincipalFromAccessToken(accessToken);
        
        const projectId = process.env.GCP_PROJECT_ID ?? '';
        const query = 'SELECT text_col, num_col FROM `test_id.test_table_a` LIMIT 25;';

        const data = await executeBigQuery(accessToken, projectId, query);

        res.json(data);
    } catch (error) {
        console.error('Error fetching BigQuery data:', error);
        res.status(500).send('Failed to fetch BigQuery data.');
    }
});

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
