import { Link } from 'react-router';
import { Zap, Bug, Wrench, Sparkles } from 'lucide-react';

type ChangeType = 'new' | 'improved' | 'fixed' | 'removed';

interface Change {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  label?: string;
  labelColor?: string;
  changes: Change[];
}

const TAG: Record<ChangeType, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  new:      { label: 'New',      bg: '#f0fdf4', color: '#16a34a', Icon: Sparkles },
  improved: { label: 'Improved', bg: '#fff7ed', color: '#ea580c', Icon: Zap      },
  fixed:    { label: 'Fixed',    bg: '#fef2f2', color: '#dc2626', Icon: Bug      },
  removed:  { label: 'Removed',  bg: '#f9fafb', color: '#6b7280', Icon: Wrench   },
};

export const RELEASES: Release[] = [
  {
    version: '1.8.0',
    date: '26 May 2026',
    label: 'Latest',
    labelColor: '#ea580c',
    changes: [
      { type: 'new',      text: 'Custom date picker — all date fields app-wide now open a Fern-styled popup calendar with Monday-first grid, orange today/selected highlight, and Clear + Today footer buttons' },
      { type: 'new',      text: 'Feed reorder alert filter — amber "X below reorder level" text in the header is now clickable and toggles a filter showing only low-stock items, matching the Animals attention filter pattern' },
      { type: 'improved', text: 'AnimatedSection open animation — sections now expand and fade in cleanly with no background flash; fixed by deferring CSS transition state one animation frame so opacity always starts from zero' },
      { type: 'improved', text: 'AnimatedSection close animation — removed the translateY transform that caused content to shoot upward before collapsing' },
      { type: 'improved', text: 'AnimatedSection layout bounce — removed !adding guard from empty-state conditions in Breeding, Withholding and Health Records so the card height stays stable when the form opens' },
      { type: 'improved', text: 'Add buttons in Breeding, Withholding, Weight Log and Health Records now use visibility:hidden instead of display:none, preventing layout shift when the form opens' },
      { type: 'improved', text: 'Withholding product field replaced with the modern dropdown component — tap to select from common drenches and treatments, with a Custom option for unlisted products' },
      { type: 'improved', text: 'Withholding form layout — Treatment Date now sits on its own full-width row above the Meat WHP / Milk WHP pair' },
      { type: 'improved', text: 'Task stat cards redesigned — white background with coloured icon bubbles matching the app card style' },
      { type: 'improved', text: 'Calendar month view — fixed height (560px) so the grid never stretches or collapses based on event count' },
      { type: 'improved', text: 'Feed cards — Location always displayed (shows "None" in grey when empty), Supplier and Storage Location share a 50/50 row' },
      { type: 'fixed',    text: 'Health Records Add Event button visibility fix was missed in the previous release — now correctly hidden when the form is open' },
      { type: 'fixed',    text: 'Date picker popup now portals to document.body, preventing it being clipped by overflow:hidden card containers' },
    ],
  },
  {
    version: '1.7.0',
    date: '24 May 2026',
    changes: [
      { type: 'new',      text: 'Calendar page — full month grid showing tasks, breeding due dates, and withholding clearance dates in one place' },
      { type: 'new',      text: 'Calendar upcoming view — chronological list of all events in the next 60 days, grouped by date and linked to the relevant record' },
      { type: 'new',      text: 'Paddock search — live search bar filters both the paddock table and dims non-matching tiles in the treemap' },
      { type: 'improved', text: 'Notifications redesigned — date group headers (Today / Yesterday / Earlier), orange unread accent bar and tinted background, dismiss on hover' },
      { type: 'improved', text: 'Task priority display — replaced small coloured dot with High (red) and Medium (amber) pill badges; low priority is intentionally silent' },
      { type: 'improved', text: 'Task date alignment — overdue label now vertically centres in the card regardless of content height' },
      { type: 'improved', text: 'Dashboard alert banner links now navigate to the correct filtered views — Tasks opens the overdue filter, Animals opens the attention filter' },
      { type: 'improved', text: 'Weather widget caches last result — returns instantly when revisiting the page and refreshes numbers silently in the background' },
      { type: 'improved', text: 'Sidebar version number is now driven by the changelog automatically — no more manual updates needed' },
    ],
  },
  {
    version: '1.6.0',
    date: '24 May 2026',
    changes: [
      { type: 'new',      text: 'Quick notes field on each animal profile — jot down vet instructions, behavioural observations or reminders, auto-saved on blur' },
      { type: 'new',      text: 'Breeding countdown notifications — bell alert fires on app load for any birth due within 7 days' },
      { type: 'new',      text: 'Withholding expiry notifications — automatic alert on the day a meat clearance period ends' },
      { type: 'new',      text: 'Offline mode indicator — animated slide-down banner appears when connection is lost and dismisses when back online' },
      { type: 'new',      text: 'True offline support — all changes write to local cache immediately and sync to the server automatically when connection restores' },
      { type: 'improved', text: 'Notification polling — bell badge now refreshes every 30 seconds and on tab focus, no manual refresh needed' },
      { type: 'improved', text: 'Paddock selector on the add animal form replaced with the modern custom dropdown component' },
      { type: 'improved', text: 'Entire animal row in paddock detail is now tappable, not just the name' },
      { type: 'improved', text: 'Delete confirmation on animal profile now shows Yes on the left and Cancel on the right, matching the feed style' },
      { type: 'fixed',    text: 'Duplicate delete button removed from bottom of animal profile — trash icon at top right is the single control' },
      { type: 'fixed',    text: 'Tab key on login email field now jumps directly to password, skipping the Forgot password link' },
    ],
  },
  {
    version: '1.5.0',
    date: '21 May 2026',
    label: undefined,
    labelColor: undefined,
    changes: [
      { type: 'new',      text: 'FAQ page with searchable questions across all modules' },
      { type: 'new',      text: 'Paddock editing — tap the pencil icon in any paddock detail panel to update name, size, status and conditions' },
      { type: 'new',      text: 'No fence option for paddocks — hides fence condition display when not applicable' },
      { type: 'new',      text: 'Daily repeat option added to task creation alongside weekly and monthly' },
      { type: 'new',      text: 'Water tanks are now fully user-managed — add, edit and remove tanks from the Rainfall page' },
      { type: 'improved', text: 'Feed stock bar now uses the original stock amount as the 100% reference, giving accurate percentages' },
      { type: 'improved', text: 'Weather forecast day cards redesigned — individual frosted pills, Today card highlighted, rain only shown at 1mm or above' },
      { type: 'improved', text: 'Paddock status, grass cover and fence condition dropdowns now use the modern custom dropdown component' },
      { type: 'improved', text: 'Quick Log mode transitions now animate with a smooth fade and slide' },
      { type: 'fixed',    text: 'Reorder alert task note was showing "threshold: undefined kg" due to a mismatched field name' },
      { type: 'fixed',    text: 'Fence alert count and filters incorrectly included paddocks with no fence' },
      { type: 'fixed',    text: 'Onboarding name field no longer auto-focuses on mobile, preventing the keyboard popping up on load' },
    ],
  },
  {
    version: '1.4.0',
    date: '19 May 2026',
    changes: [
      { type: 'new',      text: 'Register page with two-step email and password flow' },
      { type: 'new',      text: 'Login page with password visibility toggle' },
      { type: 'new',      text: 'Fern Plus page with free vs paid feature comparison' },
      { type: 'new',      text: 'Changelog page' },
      { type: 'improved', text: 'Referrals page added to nav, previously labelled Fern Plus' },
      { type: 'improved', text: 'Weather widget sky gradient matches across clear and cloudy conditions' },
      { type: 'fixed',    text: 'Paddock map was showing stale owner data instead of live profile' },
      { type: 'fixed',    text: 'Mobile nav slides off-screen when virtual keyboard opens' },
    ],
  },
  {
    version: '1.3.0',
    date: '12 May 2026',
    changes: [
      { type: 'new',      text: 'Pasture and soil page with pasture cover, soil tests and fertiliser logs' },
      { type: 'new',      text: 'Season planner with monthly farm calendar' },
      { type: 'improved', text: 'Dashboard reordered for mobile: weather above tasks this week' },
      { type: 'improved', text: 'Date format in tasks changed to day/month/year (NZ locale)' },
      { type: 'improved', text: 'Priority buttons locked to consistent height regardless of date input state' },
      { type: 'fixed',    text: 'Date parsing off-by-one for users in UTC+ timezones (e.g. typing Friday showed Thursday)' },
      { type: 'fixed',    text: 'Create buttons not working on pasture cover, soil tests and fertiliser tabs' },
      { type: 'fixed',    text: 'Animals page auto-opening keyboard on navigation due to stray autoFocus' },
    ],
  },
  {
    version: '1.2.0',
    date: '3 May 2026',
    changes: [
      { type: 'new',      text: 'Finance page with income, expense tracking and monthly summaries' },
      { type: 'new',      text: 'Rainfall and water tracking with tank levels and dry spell alerts' },
      { type: 'new',      text: 'Journal page for daily notes and farm diary entries' },
      { type: 'improved', text: 'Weather widget redesigned with gradient sky backgrounds' },
      { type: 'improved', text: 'Snooze and delete task actions hidden on mobile to save space' },
      { type: 'fixed',    text: 'Date picker cross-origin error resolved with transparent overlay approach' },
    ],
  },
  {
    version: '1.1.0',
    date: '22 Apr 2026',
    changes: [
      { type: 'new',      text: 'Paddock map with grass cover, fence conditions and animal assignment' },
      { type: 'new',      text: 'Feed management with stock levels and reorder alerts' },
      { type: 'new',      text: 'Referral program with shareable invite link' },
      { type: 'improved', text: 'Animal detail page expanded with weight, health, breeding and withholding sections' },
      { type: 'improved', text: 'Onboarding setup guide with step-by-step walkthrough' },
      { type: 'fixed',    text: 'Task recurring reminders not re-scheduling after completion' },
    ],
  },
  {
    version: '1.0.0',
    date: '7 Apr 2026',
    changes: [
      { type: 'new', text: 'Initial release of Fern' },
      { type: 'new', text: 'Animal register with health, weight and breeding records' },
      { type: 'new', text: 'Tasks and reminders with categories and priorities' },
      { type: 'new', text: 'Dashboard with weather forecast and farm overview' },
      { type: 'new', text: 'Profile and settings pages' },
      { type: 'new', text: 'Privacy policy and terms of service' },
    ],
  },
];

export function Changelog() {
  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="mb-8">
        <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>Changelog</p>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
          Every update, fix and improvement to Fern.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-3 top-3 bottom-3 w-px"
          style={{ background: '#e5e7eb' }}
        />

        <div className="space-y-8">
          {RELEASES.map((release) => (
            <div key={release.version} className="flex gap-5">
              {/* Dot */}
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center z-10 relative"
                  style={{ background: release.label ? '#ea580c' : '#fff', border: `2px solid ${release.label ? '#ea580c' : '#d1d5db'}` }}
                >
                  {release.label && <div className="w-2 h-2 rounded-full" style={{ background: '#fefefe' }} />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
                    v{release.version}
                  </span>
                  {release.label && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ fontSize: '10px', fontWeight: 700, color: release.labelColor, background: '#fff7ed', border: '1px solid #fed7aa', letterSpacing: '0.04em' }}
                    >
                      {release.label.toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{release.date}</span>
                </div>

                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
                >
                  {release.changes.map((change, i) => {
                    const { label, bg, color, Icon } = TAG[change.type];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-3"
                        style={{ borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: bg }}
                        >
                          <Icon width={10} height={10} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className="inline-block px-1.5 py-px rounded mr-1.5"
                            style={{ fontSize: '9px', fontWeight: 700, color, background: bg, verticalAlign: 'middle' }}
                          >
                            {label.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{change.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.7 }}>
          Have feedback or found a bug?{' '}
          <Link to="/support" style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}>
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
