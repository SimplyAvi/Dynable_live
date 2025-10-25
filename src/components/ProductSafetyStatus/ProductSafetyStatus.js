// New component for showing product allergen safety status
import React, { useState, useEffect, useRef } from 'react';
import { analyzeProductAllergensSemantic } from '../../utils/semanticAllergenDetection';
import './ProductSafetyStatus.css';

const ProductSafetyStatus = ({ product, userAllergens = [] }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 🛡️ ADDED: Debounce mechanism to prevent excessive API calls
  const debounceTimeoutRef = useRef(null);
  const lastAnalysisRef = useRef(null);
  
  useEffect(() => {
    const analyzeProduct = async () => {
      // 🛡️ ADDED: Skip if no description or allergens
      if (!product.description || userAllergens.length === 0) {
        setAnalysis(null);
        setError(null);
        return;
      }
      
      // 🛡️ ADDED: Create analysis key for caching
      const analysisKey = `${product.id}_${userAllergens.sort().join(',')}`;
      
      // 🛡️ ADDED: Check if we already have this analysis
      if (lastAnalysisRef.current === analysisKey && analysis) {
        return;
      }
      
      // 🛡️ ADDED: Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // 🛡️ ADDED: Debounce the analysis
      debounceTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);
        
        try {
          const result = await analyzeProductAllergensSemantic(product.description, userAllergens);
          setAnalysis(result);
          lastAnalysisRef.current = analysisKey;
        } catch (error) {
          console.error('Error analyzing product allergens:', error);
          setError('Unable to verify allergen safety');
          setAnalysis({
            isSafeForUser: false,
            warnings: ['Unable to verify allergen safety']
          });
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms debounce
    };
    
    analyzeProduct();
    
    // 🛡️ ADDED: Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [product.description, product.id, userAllergens.join(',')]); // 🛡️ ADDED: More specific dependencies
  
  // 🛡️ ADDED: Skip rendering if no allergens
  if (userAllergens.length === 0) return null;
  
  if (loading) {
    return (
      <div className="product-safety-status loading">
        🔄 Checking allergen safety...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="product-safety-status error">
        ⚠️ {error}
      </div>
    );
  }
  
  if (!analysis) return null;
  
  return (
    <div className={`product-safety-status ${analysis.isSafeForUser ? 'safe' : 'unsafe'}`}>
      {analysis.isSafeForUser ? (
        <div className="safety-indicator safe">
          ✅ Safe for your allergies
          {analysis.safeForAllergens.length > 0 && (
            <div className="safe-details">
              🛡️ Certified free from: {analysis.safeForAllergens.join(', ')}
            </div>
          )}
        </div>
      ) : (
        <div className="safety-indicator unsafe">
          ⚠️ Contains allergens you avoid
          {analysis.detectedAllergens.length > 0 && (
            <div className="allergen-details">
              Contains: {analysis.detectedAllergens.join(', ')}
            </div>
          )}
        </div>
      )}
      
      {analysis.hasCrossContamination && (
        <div className="cross-contamination-warning">
          ⚡ May contain allergens (cross-contamination risk)
        </div>
      )}
      
      {analysis.warnings.length > 0 && (
        <div className="safety-warnings">
          {analysis.warnings.map((warning, index) => (
            <div key={index} className="warning">{warning}</div>
          ))}
        </div>
      )}
      
      {analysis.overallConfidence < 0.8 && (
        <div className="confidence-warning">
          🔍 Low confidence - manual verification recommended
        </div>
      )}
    </div>
  );
};

export default ProductSafetyStatus; 