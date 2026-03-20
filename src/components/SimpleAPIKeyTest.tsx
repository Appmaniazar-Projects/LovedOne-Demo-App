import React, { useEffect, useState } from 'react';

const SimpleAPIKeyTest: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    setApiKey(key || 'No API key found');
    
    if (key) {
      // Test REST API
      fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=${key}`)
        .then(response => response.json())
        .then(data => {
          setTestResult(JSON.stringify(data, null, 2));
        })
        .catch(error => {
          setTestResult(`Error: ${error.message}`);
        });
    }
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Google API Key Test</h3>
      <div className="space-y-4">
        <div>
          <strong>API Key:</strong> {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found'}
        </div>
        <div>
          <strong>Test Result:</strong>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
            {testResult || 'Testing...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SimpleAPIKeyTest;
