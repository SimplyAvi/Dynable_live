import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsOfService.css';

const TermsOfService = () => {
    const navigate = useNavigate();

    const handleContinueToDynable = () => {
        navigate('/');
    };

    return (
        <div className="terms-of-service-page">
            <div className="terms-of-service-container">
                <div className="terms-of-service-header">
                    <h1>Dynable Terms of Service</h1>
                    <p className="effective-date">Effective Date: 10/1/2025</p>
                </div>

                <div className="terms-of-service-content">
                    <div className="intro-section">
                        <p>
                            Welcome to Dynable. These Terms of Service ("Terms") govern your use of our website, applications, and related services ("Services"). By accessing or using Dynable, you agree to be bound by these Terms. If you do not agree, do not use our Services.
                        </p>
                    </div>

                    <section className="terms-section">
                        <h2>1. Purpose of Services</h2>
                        <p>
                            Dynable provides an online platform to help users discover recipes, food products, and utensils. Our Services include food allergy filters and dietary preference features intended to assist users in identifying potential allergens in products or recipes.
                        </p>
                        <p className="important-notice">
                            <strong>Important:</strong> These Services are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a physician or qualified healthcare provider with questions about your allergies, diet, or health.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>2. No Medical Advice</h2>
                        <ul>
                            <li>Dynable does not provide medical or nutritional advice.</li>
                            <li>The content and filters offered on our platform are generalized and may not reflect the specific sensitivities, allergies, or health conditions of any individual.</li>
                            <li>You acknowledge and agree that you are solely responsible for verifying product labels, ingredients, and dietary safety before consumption.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>3. User Responsibilities</h2>
                        <p>By using Dynable, you agree:</p>
                        <ul>
                            <li>To independently confirm all food labels, ingredients, and allergen information prior to purchase or consumption.</li>
                            <li>To consult a healthcare provider for personalized allergy and dietary advice.</li>
                            <li>That you will not rely solely on Dynable's filters for health-related decisions.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>4. Limitation of Liability</h2>
                        <p>To the fullest extent permitted by law:</p>
                        <ul>
                            <li>Dynable, its officers, employees, contractors, and affiliates are not liable for any injury, illness, allergic reaction, or other damages (direct, indirect, incidental, consequential, or punitive) arising from or related to the use of our Services.</li>
                            <li>Dynable disclaims all warranties, express or implied, including but not limited to accuracy, completeness, reliability, or fitness for a particular purpose.</li>
                            <li>You agree that your use of our Services is at your own risk.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>5. No Guarantee of Accuracy</h2>
                        <ul>
                            <li>Product data, recipes, and allergen information may contain errors, omissions, or inaccuracies.</li>
                            <li>Dynable relies on third-party data sources, user submissions, and manufacturers, which may not always be complete or up to date.</li>
                            <li>We do not guarantee that our filters will identify every allergen or dietary risk.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>6. Indemnification</h2>
                        <p>You agree to defend, indemnify, and hold harmless Dynable and its affiliates from any claims, damages, liabilities, or expenses (including legal fees) arising out of:</p>
                        <ul>
                            <li>Your use of the Services,</li>
                            <li>Your reliance on allergy filter results, or</li>
                            <li>Your violation of these Terms.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>7. Age & Eligibility</h2>
                        <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to use Dynable's Services.</p>
                    </section>

                    <section className="terms-section">
                        <h2>8. Changes to Terms</h2>
                        <p>Dynable may update these Terms from time to time. Updates will be posted with a new "Effective Date." Your continued use of the Services constitutes acceptance of the updated Terms.</p>
                    </section>

                    <section className="terms-section">
                        <h2>9. Governing Law</h2>
                        <p>These Terms are governed by the laws of the State of Delaware (where Dynable is incorporated), without regard to conflict of law principles. Any disputes must be resolved in the state or federal courts located in Delaware.</p>
                    </section>

                    <section className="terms-section">
                        <h2>10. Contact</h2>
                        <p>For questions about these Terms, contact us at:</p>
                        <div className="contact-info">
                            <p><strong>Dynable Bites LLC.</strong></p>
                            <p>Email: <a href="mailto:avi.dynable@gmail.com">avi.dynable@gmail.com</a></p>
                        </div>
                    </section>
                </div>

                <div className="continue-section">
                    <button 
                        className="continue-to-dynable-btn"
                        onClick={handleContinueToDynable}
                    >
                        Continue to Dynable
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
