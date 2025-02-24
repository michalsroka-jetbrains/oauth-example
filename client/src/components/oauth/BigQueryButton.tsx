import React from 'react';
import axios from 'axios';

const BigQueryButton: React.FC = () => {
    const handleBigQueryRequest = () => {
        axios
            .get('http://localhost:8000/api/bigquery/data', { withCredentials: true })
            .then((response) => {
                console.log('BigQuery data:', response.data);
            })
            .catch((error) => {
                console.error('Error fetching BigQuery data:', error);
            });
    };

    return <button onClick={handleBigQueryRequest}>Fetch BigQuery Data</button>;
};

export default BigQueryButton;