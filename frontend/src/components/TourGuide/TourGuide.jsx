import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TourGuide.css';

// ─── Role-specific tour steps ────────────────────────────────────────────────

const TOUR_STEPS = {
  project_manager: [
    {
      id: 'welcome',
      icon: '🎉',
      title: 'Welcome to GrantOS!',
      description:
        'You\'re logged in as a Project Manager. This quick tour will walk you through the key features available to you. It only takes a minute!',
      target: null,
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard',
      description:
        'Your Dashboard gives you a real-time snapshot of all your contracts — how many are in draft, under review, approved, or expiring soon.',
      target: 'button[title="Dashboard"]',
      placement: 'right',
    },
    {
      id: 'upload',
      icon: '☁️',
      title: 'Upload a Contract',
      description:
        'Click Upload to submit a new grant contract. You can attach supporting documents and fill in key details before sending it for review.',
      target: 'button[title="Upload"]',
      placement: 'right',
    },
    {
      id: 'drafts',
      icon: '📝',
      title: 'My Drafts',
      description:
        'The Drafts panel on the right shows all contracts you\'ve saved. Switch to the "My Drafts" tab to edit, complete, and submit them whenever you\'re ready.',
      target: '.draft-tabs .draft-tab:nth-child(1)',
      placement: 'left',
    },
    {
      id: 'assigned',
      icon: '📋',
      title: 'Assigned to Me',
      description:
        'When a Program Manager sends a draft back to you for revisions, it appears under the "Assigned to Me" tab in the Drafts panel on the right.',
      target: '.draft-tabs .draft-tab:nth-child(2)',
      placement: 'left',
    },
    {
      id: 'approved',
      icon: '✅',
      title: 'Approved Contracts',
      description:
        'All contracts that have been fully approved appear here. Use this as your archive of successful grant agreements.',
      target: 'button[title="Approved"]',
      placement: 'right',
    },
    {
      id: 'grants',
      icon: '📁',
      title: 'Grants',
      description:
        'The Grants section gives you a searchable, filterable view of every contract in the system — with status, value, and deadline at a glance.',
      target: 'button[title="Grants"]',
      placement: 'right',
    },
    {
      id: 'done',
      icon: '🚀',
      title: 'You\'re all set!',
      description:
        'That\'s everything you need to get started as a Project Manager. If you ever need help, reach out to your Program Manager or admin.',
      target: null,
    },
  ],

  program_manager: [
    {
      id: 'welcome',
      icon: '🎉',
      title: 'Welcome to GrantOS!',
      description:
        'You\'re logged in as a Program Manager. This tour covers the tools you\'ll use to review, assign, and track grant contracts. Let\'s go!',
      target: null,
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard',
      description:
        'Your Dashboard shows a live overview of contracts in your review queue, director decisions pending, and overall workflow health.',
      target: 'button[title="Dashboard"]',
      placement: 'right',
    },
    {
      id: 'review',
      icon: '🔍',
      title: 'Review Queue',
      description:
        'Contracts submitted by Project Managers land here. Open each one to read details, add comments, and forward to the Director for approval.',
      target: 'button[title="Review"]',
      placement: 'right',
    },
    {
      id: 'assigned-to-me',
      icon: '📋',
      title: 'Assigned to Me',
      description:
        'Contracts routed to you by a Director or fellow Program Manager appear in the "To Me" tab of the panel on the right — keeping your queue organized.',
      target: '.draft-tabs .draft-tab:nth-child(1)',
      placement: 'left',
    },
    {
      id: 'assigned-by-me',
      icon: '📤',
      title: 'Assigned by Me',
      description:
        'Contracts you\'ve forwarded to others are tracked under the "By Me" tab in the panel on the right. Monitor progress and step in when needed.',
      target: '.draft-tabs .draft-tab:nth-child(2)',
      placement: 'left',
    },
    {
      id: 'director-decisions',
      icon: '⚖️',
      title: 'Director Decisions',
      description:
        'After a Director approves or rejects a contract you reviewed, their feedback appears here so you can communicate results back to the PM.',
      target: null,
      placement: 'right',
    },
    {
      id: 'grants',
      icon: '📁',
      title: 'Grants',
      description:
        'A complete searchable view of all contracts across all statuses — great for cross-checking details or finding a specific agreement.',
      target: 'button[title="Grants"]',
      placement: 'right',
    },
    {
      id: 'done',
      icon: '🚀',
      title: 'You\'re all set!',
      description:
        'You\'re ready to manage the review pipeline as a Program Manager. For any questions, check with your Director or platform admin.',
      target: null,
    },
  ],

  director: [
    {
      id: 'welcome',
      icon: '🎉',
      title: 'Welcome to GrantOS!',
      description:
        'You\'re logged in as a Director. This tour highlights the approval controls and visibility tools you have at your level.',
      target: null,
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Executive Dashboard',
      description:
        'Your Dashboard shows the complete pipeline — contracts awaiting your approval, recently approved agreements, and team activity at a glance.',
      target: 'button[title="Dashboard"]',
      placement: 'right',
    },
    {
      id: 'approvals',
      icon: '✍️',
      title: 'Approvals Queue',
      description:
        'Every contract that has cleared the Program Manager review stage lands here for your final decision. Approve, reject, or request changes.',
      target: 'button[title="Approvals"]',
      placement: 'right',
    },
    {
      id: 'assigned-to-me',
      icon: '📋',
      title: 'Assigned to Me',
      description:
        'Contracts escalated to you by the system or another Director appear in the "To Me" tab of the panel on the right — ready for your priority review.',
      target: '.draft-tabs .draft-tab:nth-child(1)',
      placement: 'left',
    },
    {
      id: 'assigned-by-me',
      icon: '📤',
      title: 'Assigned by Me',
      description:
        'All contracts you\'ve delegated to Program Managers are tracked under the "By Me" tab in the panel on the right. Monitor status and step in when needed.',
      target: '.draft-tabs .draft-tab:nth-child(2)',
      placement: 'left',
    },
    {
      id: 'grants',
      icon: '📁',
      title: 'Grants',
      description:
        'Full visibility into every contract in the organization — search, filter by status or date, and export for reporting.',
      target: 'button[title="Grants"]',
      placement: 'right',
    },
    {
      id: 'done',
      icon: '🚀',
      title: 'You\'re all set!',
      description:
        'You have full oversight and approval authority in GrantOS. For platform-level settings, contact your system administrator.',
      target: null,
    },
  ],
};

// Fallback for roles not explicitly defined above
const FALLBACK_STEPS = [
  {
    id: 'welcome',
    icon: '🎉',
    title: 'Welcome to GrantOS!',
    description:
      'This platform helps your team manage grant contracts end-to-end — from upload and review to director approval and archiving.',
    target: null,
  },
  {
    id: 'grants',
    icon: '📁',
    title: 'Grants',
    description:
      'Browse all contracts in the system using the Grants section. Filter by status, date, or keyword to find what you need.',
    target: 'button[title="Grants"]',
    placement: 'right',
  },
  {
    id: 'done',
    icon: '🚀',
    title: 'You\'re all set!',
    description:
      'Explore the sidebar to discover the tools available to your role. Reach out to an admin if you need help.',
    target: null,
  },
];

// ─── Spotlight helper ─────────────────────────────────────────────────────────

function getElementRect(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  // Element is hidden or inside a collapsed submenu — treat as not found
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    top: rect.top - 6,
    left: rect.left - 6,
    width: rect.width + 12,
    height: rect.height + 12,
  };
}

function computeCardPosition(spotlightRect, placement, cardWidth = 376) {
  // No element found — always center the card
  if (!spotlightRect) return { style: null, arrowClass: '' };

  const gap = 18;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let style = null;
  let arrowClass = '';

  if (placement === 'right') {
    const left = spotlightRect.left + spotlightRect.width + gap;
    const top = Math.min(Math.max(spotlightRect.top, 16), vh - 340);
    if (left + cardWidth < vw - 16) {
      style = { position: 'fixed', top, left };
      arrowClass = 'arrow-left';
    } else {
      // flip to left of the spotlight
      const flippedLeft = spotlightRect.left - cardWidth - gap;
      style = { position: 'fixed', top, left: Math.max(flippedLeft, 16) };
      arrowClass = 'arrow-right';
    }
  } else if (placement === 'left') {
    const top = Math.min(Math.max(spotlightRect.top, 16), vh - 340);
    const left = Math.max(spotlightRect.left - cardWidth - gap, 16);
    style = { position: 'fixed', top, left };
    arrowClass = 'arrow-right';
  } else if (placement === 'bottom') {
    style = {
      position: 'fixed',
      top: spotlightRect.top + spotlightRect.height + gap,
      left: Math.min(Math.max(spotlightRect.left, 16), vw - cardWidth - 16),
    };
    arrowClass = 'arrow-top';
  } else if (placement === 'top') {
    style = {
      position: 'fixed',
      top: Math.max(spotlightRect.top - gap - 300, 16),
      left: Math.min(Math.max(spotlightRect.left, 16), vw - cardWidth - 16),
    };
    arrowClass = 'arrow-bottom';
  }

  return { style, arrowClass };
}

// ─── Role label mapping ───────────────────────────────────────────────────────

const ROLE_LABELS = {
  project_manager: 'Project Manager',
  program_manager: 'Program Manager',
  director: 'Director',
  super_admin: 'Super Admin',
};

const ROLE_EMOJIS = {
  project_manager: '🗂️',
  program_manager: '📋',
  director: '🏛️',
  super_admin: '⚙️',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourGuide({ user }) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const animFrameRef = useRef(null);

  const steps = TOUR_STEPS[user?.role] || FALLBACK_STEPS;
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex === 0;

  // Decide whether to show tour on mount
  useEffect(() => {
    if (!user?.id) return;
    const key = `tour_seen_${user.id}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      // Small delay so sidebar/topbar finish rendering
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  // Update spotlight when step changes
  useEffect(() => {
    if (!visible) return;

    const updateRect = () => {
      const rect = getElementRect(currentStep?.target);
      setSpotlightRect(rect);
    };

    // Poll a few times to handle transitions / lazy renders
    updateRect();
    const t1 = setTimeout(updateRect, 150);
    const t2 = setTimeout(updateRect, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible, stepIndex, currentStep?.target]);

  const dismiss = useCallback(() => {
    localStorage.setItem(`tour_seen_${user.id}`, 'true');
    setVisible(false);
  }, [user?.id]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      dismiss();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isLastStep, dismiss]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!visible) return null;

  const hasSpotlight = !!spotlightRect && !!currentStep?.target;
  const { style: cardStyle, arrowClass } = computeCardPosition(
    hasSpotlight ? spotlightRect : null,
    currentStep?.placement
  );
  // Center the card whenever there's no live spotlight (no target, or target not found in DOM)
  const isCentered = !hasSpotlight;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Backdrop — clicking it skips the tour */}
      <div className="tour-backdrop" onClick={dismiss} />

      {/* Spotlight cutout */}
      {hasSpotlight && (
        <div
          className="tour-spotlight"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Step card */}
      <div
        className={`tour-card${isCentered ? ' tour-card-center' : ''}`}
        style={isCentered ? undefined : cardStyle}
        key={stepIndex}
      >
        {/* Arrow for non-centered cards */}
        {hasSpotlight && arrowClass && (
          <div className={`tour-card-arrow ${arrowClass}`} />
        )}

        {/* Icon banner for centered steps (welcome, done, or element not found) */}
        {isCentered && (
          <div className="tour-welcome-image">{currentStep.icon}</div>
        )}

        {/* Role badge on welcome step */}
        {isFirstStep && (
          <div className="tour-role-badge">
            <span>{ROLE_EMOJIS[user?.role] || '👤'}</span>
            <span>{ROLE_LABELS[user?.role] || user?.role || 'User'}</span>
          </div>
        )}

        <div className="tour-header">
          {!isCentered && (
            <div className="tour-icon-wrap" aria-hidden="true">
              {currentStep.icon}
            </div>
          )}
          <div>
            <div className="tour-step-label">
              Step {stepIndex + 1} of {steps.length}
            </div>
            <div className="tour-title">{currentStep.title}</div>
          </div>
        </div>

        <p className="tour-desc">{currentStep.description}</p>

        {/* Progress dots */}
        <div className="tour-progress" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemax={steps.length}>
          {steps.map((_, i) => (
            <div
              key={i}
              className={`tour-dot${i === stepIndex ? ' active' : i < stepIndex ? ' done' : ''}`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="tour-actions">
          {!isLastStep && (
            <button className="tour-btn-skip" onClick={dismiss} aria-label="Skip tour">
              Skip tour
            </button>
          )}

          <div className="tour-btn-group">
            {!isFirstStep && (
              <button className="tour-btn-back" onClick={handleBack}>
                Back
              </button>
            )}
            <button className="tour-btn-next" onClick={handleNext} autoFocus>
              {isLastStep ? 'Get started' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
