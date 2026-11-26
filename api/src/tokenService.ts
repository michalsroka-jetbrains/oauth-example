import axios from "axios";
import dotenv from "dotenv";
import qs from "qs";
import { OAuth2Client, DownscopedClient, CredentialAccessBoundary } from 'google-auth-library';
import { BigQuery } from '@google-cloud/bigquery';
import { GoogleAuth } from 'google-auth-library';
import { google, GoogleApis } from 'googleapis';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export function createDownscopedBigQueryClient(accessToken: string, projectId: string) {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const credentialAccessBoundary: CredentialAccessBoundary = {
        accessBoundary: {
            accessBoundaryRules: [
                // {
                //     availableResource: `//bigquery.googleapis.com/projects/_`,
                //     availablePermissions: [
                //         'inRole:roles/bigquery.dataViewer',
                //         'inRole:roles/bigquery.jobUser',
                //     ],
                // },
                {
                    availableResource: `//cloudresourcemanager.googleapis.com/projects/${projectId}`,
                    availablePermissions: [
                        // BigQuery Data Viewer permissions
                        'bigquery.tables.get',
                        'bigquery.tables.list',
                        'bigquery.tables.getData',

                        // BigQuery Job User permissions
                        'bigquery.jobs.create',
                        'bigquery.jobs.get'
                    ],
                },
            ],
        }
    };

    const downscopedClient = new DownscopedClient(oauth2Client, credentialAccessBoundary);

    return google.bigquery({ version: 'v2', auth: downscopedClient as unknown as OAuth2Client });


    // return new BigQuery({
    //     projectId,
    //     authClient: downscopedClient as unknown as JSONClient,
    // });
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string, expiresIn: number }> {
    try {
        const response = await axios.post(
            'https://oauth2.googleapis.com/token',
            qs.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        const { access_token, expires_in } = response.data;

        return { accessToken: access_token, expiresIn: expires_in };
    } catch (error: any) {
        if (error.response?.data?.error === 'invalid_grant') {
            throw new RefreshTokenRevokedError();
        }
        console.error('Error refreshing access token:', error.response?.data || error.message);
        throw error;
    }
}

/** Thrown when Google rejects a refresh token as revoked or expired; the user must sign in again. */
export class RefreshTokenRevokedError extends Error {
    constructor() {
        super('The refresh token was revoked or has expired');
        this.name = 'RefreshTokenRevokedError';
    }
}

export async function getPrincipalFromAccessToken(accessToken: string) {
    const oauth2Client = new OAuth2Client();

    try {
        // getTokenInfo will call Google's token introspection endpoint
        const tokenInfo = await oauth2Client.getTokenInfo(accessToken);

        console.log(`Access type: ${tokenInfo.access_type}`);
        console.log(`AUD: ${tokenInfo.aud}`);
        console.log(`AZP: ${tokenInfo.azp}`);
        console.log(`Email: ${tokenInfo.email}`);
        console.log(`Email verified: ${tokenInfo.email_verified}`);
        console.log(`Expiry date: ${tokenInfo.expiry_date}`);
        console.log(`Scopes: ${tokenInfo.scopes}`);
        console.log(`SUB: ${tokenInfo.sub}`);
        console.log(`User ID: ${tokenInfo.user_id}`);

        // tokenInfo.email will contain the user’s or service account’s email address
        const principalEmail = tokenInfo.email ?? ''; // e.g. 'alice@example.com' or 'my-service@my-proj.iam.gserviceaccount.com'

        // Differentiate user vs service account
        if (principalEmail.endsWith('iam.gserviceaccount.com')) {
            console.log('Service Account Email:', principalEmail);
        } else {
            console.log('User Account Email:', principalEmail);
        }

    } catch (error) {
        console.error('Error retrieving token info:', error);
        // e.g. token invalid or expired
    }
}
