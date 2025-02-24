import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const Callback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1)); // Remove the '#' character
            const token = params.get('access_token');

            if (token) {
                // Save token in localStorage or send it to the server
                localStorage.setItem('google_token', token);

                // Redirect to the homepage or wherever
                navigate('/');
            }
        }
    }, [navigate]);

    return <div>Loading...</div>;
};

export default Callback;
