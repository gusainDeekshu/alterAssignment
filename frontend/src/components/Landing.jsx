import {  useGoogleLogin } from '@react-oauth/google';
import  { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if a token exists in localStorage
        const token = localStorage.getItem('google_token');
        if (token) {
            navigate('/main'); // Auto-login if token exists
        }
    }, [navigate]);

    

   
    const googleLogin = useGoogleLogin({
        
        onSuccess: async ({ code }) => {
          const tokens = await axios.post('http://localhost:3001/auth/google', {  // http://localhost:3001/auth/google backend that will exchange the code
            code,
          });
      
          // console.log(tokens.data.token);
          localStorage.setItem('google_token', tokens.data.token);
          navigate('/main');
        },
        flow: 'auth-code',
      });

    return (
        <div>
            <button onClick={() => googleLogin()}>Login with Google</button>            
        </div>
    );
}

export default Landing;
