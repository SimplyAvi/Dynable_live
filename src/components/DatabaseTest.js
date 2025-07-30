import React, { useState } from 'react';
import { runDatabaseTests } from '../utils/supabaseQueries.js';

const DatabaseTest = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const testResults = await runDatabaseTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔍 Database Diagnostic Tests</h2>
      
      <button 
        onClick={runTests}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Database Tests'}
      </button>

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3>📊 Test Results:</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DatabaseTest; 