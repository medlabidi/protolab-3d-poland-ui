import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';

interface GoogleLoginButtonProps {
  onSuccess: (token: string, sessionId?: string) => void;
  sessionId?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, sessionId }) => {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded: any = jwt_decode(credentialResponse.credential);

      const response = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name,
        }),
      });

      if (!response.ok) throw new Error('Google auth failed');

      const data = await response.json();
      const token = data.token;

      // Bind session if present
      if (sessionId && token) {
        await fetch('/api/upload/bind-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
      }

      onSuccess(token, sessionId);
    } catch (err: any) {
      console.error('Google login failed:', err.message);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.error('Google login failed')}
    />
  );
};

export default GoogleLoginButton;
