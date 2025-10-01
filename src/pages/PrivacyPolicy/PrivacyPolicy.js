import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    const handleContinueToDynable = () => {
        navigate('/');
    };

    return (
        <div className="privacy-policy-page">
            <div className="privacy-policy-container">
                <div className="privacy-policy-header">
                    <h1>Dynable Privacy Policy</h1>
                    <p className="effective-date">Effective Date: 10/1/2025</p>
                </div>

                <div className="privacy-policy-content">
                    <div className="intro-section">
                        <p>
                            Dynable ("we," "our," "us") values your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our website, mobile application, and related services ("Services"). By using Dynable, you agree to the practices described in this Privacy Policy.
                        </p>
                    </div>

                    <section className="policy-section">
                        <h2>1. Information We Collect</h2>
                        <p>We collect the following types of information:</p>
                        
                        <h3>a. Information You Provide</h3>
                        <ul>
                            <li>Account information (name, email, password)</li>
                            <li>Allergen and dietary preferences you set in your profile</li>
                            <li>Communications with us (support requests, feedback)</li>
                        </ul>

                        <h3>b. Information Collected Automatically</h3>
                        <ul>
                            <li>Device and usage data (IP address, browser type, operating system)</li>
                            <li>Cookies and similar technologies for analytics, preferences, and functionality</li>
                            <li>Log data about how you interact with recipes, filters, and product searches</li>
                        </ul>

                        <h3>c. Information from Third Parties</h3>
                        <ul>
                            <li>Product and recipe data from external suppliers, retailers, or partners</li>
                            <li>Authentication services if you sign in using a third-party account (e.g., Google)</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>2. How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul>
                            <li>Provide and improve our Services (e.g., recipe and allergy filter recommendations)</li>
                            <li>Personalize content and user experience</li>
                            <li>Communicate with you (e.g., service updates, security alerts, marketing—if opted in)</li>
                            <li>Conduct analytics to better understand how our platform is used</li>
                            <li>Enforce our Terms of Service and protect against misuse or fraud</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>3. How We Share Your Information</h2>
                        <p>We do not sell your personal data. We may share your information only in the following cases:</p>
                        <ul>
                            <li>With service providers that help us operate (hosting, analytics, payment processing)</li>
                            <li>For legal reasons, if required by law, subpoena, or government request</li>
                            <li>In case of business transfer, such as a merger, acquisition, or sale of assets</li>
                            <li>With your consent, when you choose to share your data with third parties</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>4. Your Privacy Choices</h2>
                        <p>You may:</p>
                        <ul>
                            <li>Access, update, or delete your account information via your profile settings</li>
                            <li>Opt out of marketing emails by clicking "unsubscribe" in any message</li>
                            <li>Manage cookies through your browser or device settings</li>
                            <li>If you are in the EU/EEA or certain other regions, you may have additional rights (e.g., data portability, right to object, right to withdraw consent)</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>5. Data Retention</h2>
                        <p>We keep your information only as long as necessary to provide our Services, comply with legal obligations, and resolve disputes.</p>
                    </section>

                    <section className="policy-section">
                        <h2>6. Data Security</h2>
                        <p>We use reasonable technical, administrative, and physical safeguards to protect your data. However, no system is 100% secure, and we cannot guarantee absolute security.</p>
                    </section>

                    <section className="policy-section">
                        <h2>7. Children's Privacy</h2>
                        <p>Dynable is not intended for children under 13 (or under 16 in the EU). We do not knowingly collect data from children. If you believe a child has provided us with personal data, contact us and we will delete it.</p>
                    </section>

                    <section className="policy-section">
                        <h2>8. International Users</h2>
                        <p>If you access Dynable from outside the United States, note that your information may be transferred to, stored, and processed in the United States, where privacy laws may differ from your country.</p>
                    </section>

                    <section className="policy-section">
                        <h2>9. Changes to This Privacy Policy</h2>
                        <p>We may update this Privacy Policy from time to time. Updates will be posted with a new Effective Date. Continued use of our Services means you accept the updated policy.</p>
                    </section>

                    <section className="policy-section">
                        <h2>10. Contact Us</h2>
                        <p>For questions about this Privacy Policy, please contact:</p>
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

export default PrivacyPolicy;
