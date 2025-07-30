// New component for showing product allergen safety status
import React, { useState, useEffect } from 'react';
import { analyzeProductAllergens } from '../../utils/allergenDetection';
import './ProductSafetyStatus.css';

const ProductSafetyStatus = ({ product, userAllergens = [] }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const analyzeProduct = async () => {
      if (!product.description || userAllergens.length === 0) {
        setAnalysis(null);
        return;
      }
      
      setLoading(true);
      try {
        const result = await analyzeProductAllergens(product.description, userAllergens);
        setAnalysis(result);
      } catch (error) {
        console.error('Error analyzing product allergens:', error);
        setAnalysis({
          isSafeForUser: false,
          warnings: ['Unable to verify allergen safety']
        });
      } finally {
        setLoading(false);
      }
    };
    
    analyzeProduct();
  }, [product.description, userAllergens]);
  
  if (userAllergens.length === 0) return null;
  
  if (loading) {
    return (
      <div className="product-safety-status loading">
        🔄 Checking allergen safety...
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