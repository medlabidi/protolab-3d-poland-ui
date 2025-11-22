import React, { useState } from 'react';
import { PrintParametersForm } from '../components/PrintParametersForm';
import { EstimationResults } from '../components/EstimationResults';

export const PrintJobPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [estimation, setEstimation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAnalyze = async (params: any) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          sessionId,
          quality: params.quality,
          material: params.material,
          purpose: params.purpose,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setEstimation(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Print Job Estimator</h1>
      <PrintParametersForm onAnalyze={handleAnalyze} loading={loading} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {estimation && <EstimationResults data={estimation} />}
    </div>
  );
};
