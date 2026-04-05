import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="page">
      <div className="header">
        <h1>Privacy Policy</h1>
        <p className="header-subtitle">Your data protection and privacy</p>
      </div>

      <div className="section-title">1. Introduction</div>
      <div className="card">
        <p>
          RxMax is committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </p>
        <p>
          We comply with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and other applicable data protection laws.
        </p>
      </div>

      <div className="section-title">2. Information We Collect</div>
      <div className="card">
        <h3>Personal Information:</h3>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Name, phone number, email address</li>
          <li>Home address and delivery information</li>
          <li>Date of birth and gender</li>
          <li>Health conditions and medication allergies</li>
          <li>Family member information (with consent)</li>
        </ul>

        <h3>Medical Information:</h3>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Prescription images and extracted medicine details</li>
          <li>Order history and medicine purchases</li>
          <li>Refill reminders and medication schedules</li>
        </ul>

        <h3>Technical Information:</h3>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Device information and app usage analytics</li>
          <li>Log data and transaction records</li>
        </ul>
      </div>

      <div className="section-title">3. How We Use Your Information</div>
      <div className="card">
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>To process and deliver medicine orders</li>
          <li>To provide prescription reading and AI analysis services</li>
          <li>To send refill reminders and notifications</li>
          <li>To improve our services and user experience</li>
          <li>To comply with legal and regulatory requirements</li>
          <li>To prevent fraud and ensure security</li>
        </ul>
      </div>

      <div className="section-title">4. Data Protection & Security</div>
      <div className="card">
        <p>
          We implement appropriate technical and organizational measures to protect your personal data including:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>End-to-end encryption for sensitive data</li>
          <li>Secure authentication (OTP-based login)</li>
          <li>Regular security audits and updates</li>
          <li>Access controls and data minimization</li>
          <li>Secure data storage and backup procedures</li>
        </ul>
      </div>

      <div className="section-title">5. Your Rights</div>
      <div className="card">
        <p>Under the DPDP Act and other applicable laws, you have the right to:</p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
          <li><strong>Portability:</strong> Receive your data in a structured format</li>
          <li><strong>Grievance:</strong> File a grievance for data protection violations</li>
          <li><strong>Withdraw Consent:</strong> Opt-out of non-essential data processing</li>
        </ul>
      </div>

      <div className="section-title">6. Data Sharing</div>
      <div className="card">
        <p>
          We do not share your personal data with third parties except:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>With pharmacy partners for order fulfillment</li>
          <li>With AI services (Gemini API) for prescription reading (anonymized)</li>
          <li>With law enforcement when legally required</li>
          <li>With your explicit consent</li>
        </ul>
        <p>
          We ensure all partners maintain strict confidentiality and comply with data protection laws.
        </p>
      </div>

      <div className="section-title">7. Data Retention</div>
      <div className="card">
        <p>
          We retain your information as long as necessary to provide services and comply with legal obligations:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Account information: While you are an active user + 2 years</li>
          <li>Medical records: 7 years (per Indian medical standards)</li>
          <li>Transaction records: 7 years (per tax regulations)</li>
          <li>Marketing data: Until you opt-out</li>
        </ul>
      </div>

      <div className="section-title">8. Prescription Handling</div>
      <div className="card">
        <p>
          Your prescription images are highly sensitive medical documents:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Images are processed through AI models for medicine extraction</li>
          <li>We do not store raw prescription images longer than necessary</li>
          <li>All prescription data is encrypted in transit and at rest</li>
          <li>Only you can view your prescription history</li>
          <li>You can delete prescriptions anytime</li>
        </ul>
      </div>

      <div className="section-title">9. Children's Privacy</div>
      <div className="card">
        <p>
          RxMax is not intended for children under 18. We do not knowingly collect information from children. If we learn that we have collected personal information from a child without parental consent, we will delete such information promptly.
        </p>
      </div>

      <div className="section-title">10. Cookies & Tracking</div>
      <div className="card">
        <p>
          This app uses local storage and session management for:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Keeping you logged in (optional)</li>
          <li>Remembering your preferences</li>
          <li>Preventing fraud</li>
        </ul>
        <p>
          You can clear your app data anytime in your device settings.
        </p>
      </div>

      <div className="section-title">11. Third-Party Services</div>
      <div className="card">
        <p>
          We use:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li><strong>Google Gemini API:</strong> For AI-powered prescription reading (subject to Google's privacy policy)</li>
          <li><strong>Analytics:</strong> For understanding app usage (anonymized)</li>
        </ul>
        <p>
          Each third-party service has its own privacy policy, and we encourage you to review them.
        </p>
      </div>

      <div className="section-title">12. Your Consent</div>
      <div className="card">
        <p>
          By using RxMax, you consent to our Privacy Policy. However:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>You can opt-out of marketing communications anytime</li>
          <li>You can request specific data not be processed</li>
          <li>Essential services require minimal data collection</li>
        </ul>
      </div>

      <div className="section-title">13. Policy Changes</div>
      <div className="card">
        <p>
          We may update this Privacy Policy to reflect changes in our practices or applicable laws. We will notify you of significant changes via email or app notification. Continued use of RxMax after changes constitutes acceptance of the updated policy.
        </p>
      </div>

      <div className="section-title">14. Contact Us</div>
      <div className="card">
        <p>
          If you have questions, concerns, or want to exercise your rights:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li><strong>Email:</strong> privacy@rxmax.com</li>
          <li><strong>Phone:</strong> 1-800-RX-MAX-1</li>
          <li><strong>Address:</strong> RxMax Privacy Team, Hyderabad, India</li>
          <li><strong>Data Protection Officer:</strong> dpo@rxmax.com</li>
        </ul>
      </div>

      <div className="section-title">15. Compliance</div>
      <div className="card">
        <p>
          RxMax complies with:
        </p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Digital Personal Data Protection Act, 2023 (DPDP Act)</li>
          <li>Information Technology Act, 2000</li>
          <li>Pharmacy Act and medical regulations</li>
          <li>ISO/IEC 27001 data security standards</li>
        </ul>
      </div>

      <div className="card" style={{
        background: '#E8F5E9',
        border: '1px solid #4CAF50',
        marginTop: '2rem',
        marginBottom: '2rem'
      }}>
        <p style={{ color: '#1B5E20', fontWeight: '600', margin: 0 }}>
          Last Updated: April 2024
        </p>
        <p style={{ color: '#2E7D32', fontSize: '0.9rem', marginTop: '0.5rem', margin: 0 }}>
          Your privacy is our priority. We are committed to transparent and ethical data handling practices.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
