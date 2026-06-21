import { useNavigate } from 'react-router';
import { ArrowLeft, Leaf } from 'lucide-react';

export function TermsOfService() {
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
          Terms of Service
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Last updated May 2026</p>

        <div className="space-y-6" style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Acceptance</p>
            <p>By using Fern, you agree to these terms. If you do not agree, please discontinue use of the app. These terms apply to all users of the Fern lifestyle block management application.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Use of the App</p>
            <p>Fern is intended for personal and small-scale farm management use. You agree to use the app only for lawful purposes and in a manner consistent with all applicable New Zealand laws and regulations.</p>
            <p style={{ marginTop: '8px' }}>You are responsible for the accuracy of information you enter into the app, including animal records, financial data, and paddock details. Fern does not verify the accuracy of data you input.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>No Professional Advice</p>
            <p>The information and tools provided in Fern, including health event tracking, weight monitoring, withholding period calculations, and financial summaries, are for record-keeping and reference purposes only. They do not constitute veterinary, legal, financial, or agricultural advice. Always consult a qualified professional for important decisions relating to animal health, food safety, and farm management.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Withholding Periods</p>
            <p>Withholding period information displayed in Fern is based on data you have entered. It is your sole responsibility to verify withholding periods with the product label and your veterinarian before sending animals to slaughter or processing milk or other products. Fern accepts no liability for errors in withholding period records.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Intellectual Property</p>
            <p>All content, design, and functionality of the Fern app is the property of its developers. You may not copy, reproduce, or redistribute any part of the app without written permission.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Limitation of Liability</p>
            <p>Fern is provided "as is" without warranties of any kind. To the fullest extent permitted by law, the developers of Fern are not liable for any loss or damage arising from your use of the app, including loss of data, financial loss, or decisions made based on information displayed in the app.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Changes to These Terms</p>
            <p>We may update these terms from time to time. Continued use of the app after changes are posted constitutes your acceptance of the revised terms.</p>
          </section>

          <section>
            <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>Governing Law</p>
            <p>These terms are governed by the laws of New Zealand. Any disputes will be subject to the jurisdiction of the New Zealand courts.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
