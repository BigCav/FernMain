import { useState } from 'react';
import { ChevronDown, HelpCircle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router';
import { AnimatedSection } from '../components/AnimatedSection';

interface FAQItem {
  q: string;
  a: string | React.ReactNode;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const SECTIONS: FAQSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'How do I set up my farm for the first time?',
        a: 'When you first sign in, the onboarding wizard walks you through entering your property name, location, and farm type. Once complete, head to Paddocks to add your paddocks, then Animals to start registering your stock.',
      },
      {
        q: 'Can I use Fern on multiple devices?',
        a: 'Yes. Your data is stored securely in the cloud and syncs across any device you sign in to. Changes on your phone appear instantly on your desktop and vice versa.',
      },
      {
        q: 'Is there an offline mode?',
        a: 'Fern requires an internet connection to load and save data. We recommend entering records as soon as you have signal. Most farms have coverage in the yards where you would typically be logging.',
      },
    ],
  },
  {
    title: 'Animals',
    items: [
      {
        q: 'How do I record a weight for an animal?',
        a: 'Go to the Animals page and tap the animal, then use the Weight tab to add a reading. You can also use Quick Log on the Dashboard to log a weight without leaving the home screen.',
      },
      {
        q: 'What does the health status mean?',
        a: 'Health status is a quick flag you set manually: Healthy, Monitor, or Sick. It appears as a colour dot throughout the app. Fern does not connect to veterinary systems, so it is a field-level indicator only.',
      },
      {
        q: 'Can I track treatments and withholding periods?',
        a: 'Yes. From an animal\'s detail page, open the Treatment tab to log a product, meat WHP, and milk WHP. Fern calculates the clearance date automatically and flags animals still inside their withholding period.',
      },
      {
        q: 'How do I record a sale or transfer?',
        a: 'Open the animal\'s detail page and tap Transfer. You can record the purpose (sale, breeding loan, slaughter, etc.), destination, and price. Transferred animals are archived rather than deleted so the record is preserved.',
      },
    ],
  },
  {
    title: 'Paddocks',
    items: [
      {
        q: 'How do I add a paddock?',
        a: 'Go to Paddocks and tap New Paddock. Enter the name, size in hectares, current status, grass cover, and fence condition. Paddocks appear in the treemap sized proportionally to their hectares.',
      },
      {
        q: 'Can I edit a paddock after creating it?',
        a: 'Yes. Select any paddock on the map or in the list below, then tap the pencil icon in the detail panel to open the edit form. All fields including name, size, and conditions can be updated.',
      },
      {
        q: 'What does the Fence Alerts stat count?',
        a: 'Fence Alerts counts paddocks with a condition of Fair or Poor. Paddocks set to No Fence are excluded, as these are assumed to be intentionally unfenced (e.g. open ranges or lanes).',
      },
    ],
  },
  {
    title: 'Feed & Supplies',
    items: [
      {
        q: 'How is the stock bar percentage calculated?',
        a: 'When you add a feed item, the amount you enter becomes the "full" reference point. The bar shows how much of that original stock remains. If you later update stock, you can also update the Max/Full amount to recalibrate the bar.',
      },
      {
        q: 'What triggers the low-stock task?',
        a: 'When a feed item drops below its reorder threshold, Fern automatically creates a high-priority task in your task list so it shows up in Quick Log and on the Dashboard.',
      },
      {
        q: 'Can I track multiple feed types?',
        a: 'Yes, hay, nuts, supplements, and custom types are all supported. Each item tracks current stock, daily use rate, reorder threshold, and supplier notes.',
      },
    ],
  },
  {
    title: 'Water & Tanks',
    items: [
      {
        q: 'How do I add a water tank?',
        a: 'Go to Rainfall, switch to the Tanks tab, and tap Add Tank. Enter the name, capacity in litres, and location. Once added you can log readings to track the level over time.',
      },
      {
        q: 'What happens when a tank goes below 20%?',
        a: 'Fern automatically creates a high-priority "Refill water supply" task for that tank. The task appears in your task list and in Quick Log on the Dashboard.',
      },
      {
        q: 'Can I log rainfall manually?',
        a: 'Yes. On the Rainfall page, switch to Rainfall Log and tap Add Reading. Enter the date and millimetres recorded at your gauge. Fern charts these over the last few months.',
      },
    ],
  },
  {
    title: 'Tasks',
    items: [
      {
        q: 'Where do automated tasks come from?',
        a: 'Fern watches your feed stock levels, tank readings, and breeding records in the background. When a threshold is crossed (e.g. low feed, low water, breeding due), a task is created automatically in the relevant category.',
      },
      {
        q: 'Can I create recurring tasks?',
        a: 'Yes. When creating a task you can set the recurrence to Daily, Weekly, or Monthly. Once you mark a recurring task as complete, Fern automatically schedules the next one at the right interval.',
      },
      {
        q: 'How do I complete a task from the Dashboard?',
        a: 'Tap Quick Log, then choose "Complete a task". You will see tasks due today or overdue. Tap the task to select it, then tap Mark Complete.',
      },
    ],
  },
  {
    title: 'Data & Privacy',
    items: [
      {
        q: 'Where is my data stored?',
        a: 'All farm data is stored in a secure cloud database. Data is encrypted in transit and at rest. We do not sell or share your data with third parties.',
      },
      {
        q: 'Can I export my data?',
        a: 'CSV export for transactions is available on the Finance page. Export for other modules (animals, tasks, feed) is on the roadmap.',
      },
      {
        q: 'What happens if I cancel my subscription?',
        a: 'Your data is retained for 90 days after cancellation. You can re-subscribe at any time within that window to restore full access. After 90 days, data is permanently deleted.',
      },
    ],
  },
  {
    title: 'Account & Billing',
    items: [
      {
        q: 'What is included in the free plan?',
        a: 'The free plan supports one user with up to 50 animals, basic task management, and manual record keeping. Fern+ unlocks unlimited animals, advanced analytics, priority support, and more.',
      },
      {
        q: 'How do I upgrade to Fern+?',
        a: (
          <>
            Go to <Link to="/fern-plus" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>Fern+</Link> in the menu to see plans and subscribe. You can also refer a friend to earn a free month.
          </>
        ),
      },
      {
        q: 'Something is not working. How do I get help?',
        a: (
          <>
            Head to the <Link to="/support" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>Support</Link> page and submit a ticket. We typically respond within 1–2 business days.
          </>
        ),
      },
    ],
  },
];

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #f5f5f5' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', lineHeight: 1.45 }}>{item.q}</p>
        <ChevronDown
          width={15}
          height={15}
          style={{
            color: '#9ca3af',
            flexShrink: 0,
            marginTop: '2px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
      <AnimatedSection open={open}>
        <div className="px-5 pb-4">
          <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.65 }}>{item.a}</p>
        </div>
      </AnimatedSection>
    </div>
  );
}

export function FAQ() {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const filtered: FAQSection[] = q
    ? SECTIONS.map(s => ({
        ...s,
        items: s.items.filter(
          i => i.q.toLowerCase().includes(q) || (typeof i.a === 'string' && i.a.toLowerCase().includes(q)),
        ),
      })).filter(s => s.items.length > 0)
    : SECTIONS;

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>
          FAQ
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
          Answers to common questions about Fern
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <HelpCircle
          width={15}
          height={15}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder="Search questions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '38px',
            paddingRight: '14px',
            paddingTop: '10px',
            paddingBottom: '10px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            background: '#fefefe',
            fontSize: '13px',
            color: '#111',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#fb923c')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f5f5f5' }}>
            <HelpCircle width={20} height={20} style={{ color: '#9ca3af' }} />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>No results found</p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            Try different words, or{' '}
            <Link to="/support" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>
              submit a support ticket
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(section => (
            <div key={section.title} className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
              <div className="px-5 py-3.5" style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {section.title}
                </p>
              </div>
              {section.items.map((item, i) => (
                <FAQRow key={i} item={item} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div
        className="mt-8 rounded-2xl p-5 flex items-start gap-3"
        style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
      >
        <LinkIcon width={15} height={15} style={{ color: '#ea580c', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>Still have questions?</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', lineHeight: 1.55 }}>
            Submit a ticket on the{' '}
            <Link to="/support" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>
              Support page
            </Link>{' '}
            and we will get back to you within 1–2 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
