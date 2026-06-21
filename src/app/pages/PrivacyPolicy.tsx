import { useNavigate } from 'react-router';
import { ArrowLeft, Leaf } from 'lucide-react';

export function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ background: '#f0eeeb', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Minimal header */}
      <div className="sticky top-0 z-10 px-4 py-3 md:px-8 flex items-center gap-3" style={{ background: '#f0eeeb', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#fefefe', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
        >
          <ArrowLeft width={13} height={13} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#ea580c' }}>
            <Leaf width={11} height={11} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>Fern</span>
        </div>
      </div>

      <div className="px-4 pt-8 md:px-8 max-w-3xl mx-auto pb-16">
        <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Privacy Policy
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Last updated May 2026</p>

        <div className="space-y-6" style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Overview</p>
            <p>Fern is a lifestyle block management app designed to help New Zealand property owners manage their land, animals, and farm records. We take your privacy seriously and are committed to being transparent about how we handle your data.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Data We Collect</p>
            <p>Fern stores all data you enter, including animal records, paddock information, financial transactions, tasks, and journal entries, locally on your device. We do not transmit personal farm data to external servers unless you explicitly enable a cloud sync feature.</p>
            <p style={{ marginTop: '8px' }}>If you submit a support ticket through the app, we collect your name, email address (if provided), and the contents of your message in order to respond to your enquiry.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>How We Use Your Data</p>
            <p>Data you enter into Fern is used solely to provide the features of the app. We do not sell, share, or use your farm data for advertising or any purpose other than delivering the service to you.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Weather Data</p>
            <p>The weather widget fetches forecast information from a third-party weather service using your configured location. No personally identifiable information is sent alongside this request beyond the location coordinates or place name you have set.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Data Storage & Security</p>
            <p>Your farm records are stored in your browser's local storage. We recommend using a modern, up-to-date browser and keeping your device secure. Fern does not currently offer encrypted cloud backup; back up your device regularly to protect your data.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Your Rights</p>
            <p>You may delete all app data at any time by clearing your browser's local storage or uninstalling the app. For any questions about data we hold relating to support correspondence, contact us through the Support page.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Changes to This Policy</p>
            <p>We may update this privacy policy from time to time. We will note the updated date at the top of this page when changes are made.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Contact</p>
            <p>If you have any questions about this policy, please reach out via the Support page inside the app.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
