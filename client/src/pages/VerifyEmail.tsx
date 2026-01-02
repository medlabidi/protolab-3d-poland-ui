import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmail.invalidLink'));
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || t('verifyEmail.verificationFailed'));
          toast.error(data.error || t('verifyEmail.verificationFailed'));
          return;
        }

        setStatus('success');
        setMessage(data.message);
        toast.success(t('verifyEmail.toasts.success'));

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(t('verifyEmail.connectionError'));
        toast.error(t('verifyEmail.toasts.connectionError'));
      }
    };

    verifyEmail();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="w-16 h-16 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-16 h-16 text-green-500" />}
            {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && t('verifyEmail.verifying')}
            {status === 'success' && t('verifyEmail.verified')}
            {status === 'error' && t('verifyEmail.failed')}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('verifyEmail.redirecting')}
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                {t('verifyEmail.goToLogin')}
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                {t('verifyEmail.goToLogin')}
              </Button>
              <Button onClick={() => window.location.reload()} className="w-full">
                {t('verifyEmail.tryAgain')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
