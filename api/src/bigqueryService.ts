import { error } from 'console';
import { google } from 'googleapis';
import { createDownscopedBigQueryClient } from './tokenService';

const BIGQUERY_LOCATION = process.env.BIGQUERY_LOCATION ?? 'us-east1';

export async function executeBigQuery(accessToken: string, projectId: string, query: string): Promise<any> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const bigQuery = google.bigquery({ version: 'v2', auth });

    // const bigQuery = createDownscopedBigQueryClient(accessToken, projectId);

    try {
        const res = await bigQuery.jobs.insert({
            projectId,
            requestBody: {
                configuration: {
                    query: {
                        query,
                        useLegacySql: false,
                    },
                },
            },
        });

        const job = res.data;
        const jobId = job.jobReference?.jobId;

        if (!jobId) {
            throw error(`BigQuery jobId is: ${jobId}`);
        }

        await waitForJobCompletion(projectId, jobId);

        const result = await bigQuery.jobs.getQueryResults({
            projectId,
            jobId: jobId,
            location: BIGQUERY_LOCATION,
        });

        return result.data.rows;
    } catch (error) {
        console.error('BigQuery API error:', error);
        throw error;
    }

    async function waitForJobCompletion(
        projectId: string,
        jobId: string
    ): Promise<void> {
        const maxRetries = 10;

        let isJobComplete = false;
        let retries = 0;
        while (!isJobComplete) {
            if (retries > maxRetries) {
                break;
            }
            const jobStatusResponse = await bigQuery.jobs.get({
                location: BIGQUERY_LOCATION,
                projectId,
                jobId,
            });

            const jobStatus = jobStatusResponse.data.status;

            if (jobStatus?.errorResult) {
                throw new Error(
                    `Job failed with error: ${jobStatus.errorResult.message}`
                );
            }

            if (jobStatus?.state === 'DONE') {
                isJobComplete = true;
            } else {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
            ++retries;
        }
    }
}