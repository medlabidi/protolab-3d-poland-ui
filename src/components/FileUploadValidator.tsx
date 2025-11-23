import React, { useState } from 'react';

interface ValidationError {
  errors: string[];
  warnings: string[];
  message: string;
}

interface UploadResponse {
  success: boolean;
  error?: string;
  details?: ValidationError;
  result?: any;
  pricing?: any;
  validation?: {
    isValid: boolean;
    warnings: string[];
  };
}

export const FileUploadValidator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidation(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload-temp-file', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        setValidation({
          errors: ['Upload failed'],
          warnings: [],
          message: uploadData.error,
        });
        return;
      }

      // Now analyze the file
      const analyzeRes = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          sessionId: uploadData.sessionId,
          quality: 'standard',
          material: 'PLA',
          color: 'White',
          purpose: 'prototype',
        }),
      });

      const analyzeData: UploadResponse = await analyzeRes.json();

      if (!analyzeData.success) {
        setValidation(analyzeData.details || {
          errors: [analyzeData.error || 'Unknown error'],
          warnings: [],
          message: analyzeData.error || 'Analysis failed',
        });
        return;
      }

      setValidation({
        errors: [],
        warnings: analyzeData.validation?.warnings || [],
        message: 'File is valid ✓',
      });
      setUploadSuccess(true);
    } catch (err: any) {
      setValidation({
        errors: [err.message],
        warnings: [],
        message: 'Upload error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Upload & Validate 3D File</h3>

      <input
        type="file"
        accept=".stl,.obj,.3mf"
        onChange={handleFileSelect}
        disabled={loading}
      />

      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: '10px' }}>
        {loading ? 'Uploading...' : 'Upload & Validate'}
      </button>

      {validation && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '5px',
            backgroundColor: validation.errors.length > 0 ? '#ffebee' : '#e8f5e9',
            borderLeft: `4px solid ${validation.errors.length > 0 ? '#f44336' : '#4caf50'}`,
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>
            {validation.errors.length > 0 ? '❌ Validation Failed' : '✅ File Valid'}
          </h4>

          {validation.errors.length > 0 && (
            <div style={{ color: '#c62828', marginBottom: '10px' }}>
              <strong>Errors:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div style={{ color: '#f57f17', marginBottom: '10px' }}>
              <strong>Warnings:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {validation.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadSuccess && (
            <div style={{ color: '#2e7d32', marginTop: '10px', fontWeight: 'bold' }}>
              Ready to proceed with print estimation!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
