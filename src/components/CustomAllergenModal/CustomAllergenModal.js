import React, { useState } from 'react';
import './CustomAllergenModal.css';

const CustomAllergenModal = ({ isOpen, onClose, onSave }) => {
    const [allergenName, setAllergenName] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Simple grammar/spelling validation
    const validateAllergenName = (name) => {
        if (!name || name.trim().length === 0) {
            return { isValid: false, error: 'Please enter an allergen name' };
        }

        const trimmedName = name.trim();
        
        // Check minimum length
        if (trimmedName.length < 2) {
            return { isValid: false, error: 'Allergen name must be at least 2 characters long' };
        }

        // Check for invalid characters
        const invalidChars = /[0-9@#$%^&*()+=[\]{};':"\\|,.<>/?~`]/;
        if (invalidChars.test(trimmedName)) {
            return { isValid: false, error: 'Allergen name contains invalid characters. Please use only letters and spaces.' };
        }

        // Check for common spelling mistakes in allergen names
        const commonAllergens = [
            'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 
            'wheat', 'soy', 'sesame', 'gluten', 'almonds', 'cashews',
            'walnuts', 'pecans', 'hazelnuts', 'pistachios', 'macadamia nuts',
            'crab', 'lobster', 'shrimp', 'clams', 'mussels', 'oysters',
            'scallops', 'celery', 'mustard', 'sulfites', 'artificial sweeteners'
        ];

        // Check if it's too similar to existing allergens (potential typo)
        const lowerName = trimmedName.toLowerCase();
        const similarAllergen = commonAllergens.find(allergen => {
            const similarity = calculateSimilarity(lowerName, allergen.toLowerCase());
            return similarity > 0.8 && similarity < 1.0;
        });

        if (similarAllergen) {
            return { 
                isValid: false, 
                error: `Did you mean "${similarAllergen}"? Please check your spelling.` 
            };
        }

        return { isValid: true, error: '' };
    };

    // Simple similarity calculation (Levenshtein distance based)
    const calculateSimilarity = (str1, str2) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    };

    const levenshteinDistance = (str1, str2) => {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    };

    const handleSave = async () => {
        if (!allergenName.trim()) return;

        setIsValidating(true);
        setValidationError('');

        const validation = validateAllergenName(allergenName);
        
        if (!validation.isValid) {
            setValidationError(validation.error);
            setIsValidating(false);
            return;
        }

        try {
            const customAllergen = {
                id: `custom_${Date.now()}`,
                name: allergenName.trim().toLowerCase(),
                displayName: allergenName.trim(),
                createdAt: new Date().toISOString(),
                isActive: true,
                isCustom: true,
                isUnderReview: true,
                reviewStatus: 'pending'
            };

            await onSave(customAllergen);
            setAllergenName('');
            setValidationError('');
            onClose();
        } catch (error) {
            setValidationError('Failed to save allergen. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleClose = () => {
        setAllergenName('');
        setValidationError('');
        onClose();
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div className="custom-allergen-modal-overlay" onClick={handleBackdropClick}>
            <div className="custom-allergen-modal">
                <div className="custom-allergen-modal-header">
                    <h3>Add Custom Allergen</h3>
                    <button 
                        className="custom-allergen-modal-close"
                        onClick={handleClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>
                
                <div className="custom-allergen-modal-content">
                    <p className="custom-allergen-modal-description">
                        Add a custom allergen that you need to avoid. We'll help you check for spelling errors.
                    </p>
                    <div className="custom-allergen-review-notice">
                        <span className="review-icon">⏳</span>
                        <span className="review-text">
                            <strong>Allergens submitted will be reviewed and integrated.</strong> 
                            Your custom allergen will appear highlighted in yellow while under review.
                        </span>
                    </div>
                    
                    <div className="custom-allergen-input-group">
                        <label htmlFor="allergen-name" className="custom-allergen-label">
                            Allergen Name:
                        </label>
                        <input
                            id="allergen-name"
                            type="text"
                            value={allergenName}
                            onChange={(e) => setAllergenName(e.target.value)}
                            placeholder="e.g., artificial sweeteners, food coloring"
                            className={`custom-allergen-input ${validationError ? 'error' : ''}`}
                            disabled={isValidating}
                        />
                        {validationError && (
                            <div className="custom-allergen-error">
                                ⚠️ {validationError}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="custom-allergen-modal-footer">
                    <button 
                        className="custom-allergen-cancel-btn"
                        onClick={handleClose}
                        disabled={isValidating}
                    >
                        Cancel
                    </button>
                    <button 
                        className="custom-allergen-save-btn"
                        onClick={handleSave}
                        disabled={isValidating || !allergenName.trim()}
                    >
                        {isValidating ? 'Validating...' : 'Add Allergen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomAllergenModal;
