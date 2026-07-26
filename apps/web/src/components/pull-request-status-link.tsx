import type { SharedSessionHistoryItem } from '@pairdock/shared-contracts';
import { GitMergeIcon, GitPullRequestClosedIcon, GitPullRequestIcon } from './brand-icons.js';

type ReviewRequest = NonNullable<SharedSessionHistoryItem['reviewRequest']>;

const stateConfig = {
  open: {
    className: 'border-[#3fb950]/40 bg-[#3fb950]/10 text-[#3fb950] hover:bg-[#3fb950]/15',
    icon: GitPullRequestIcon,
  },
  closed: {
    className: 'border-[#f85149]/40 bg-[#f85149]/10 text-[#f85149] hover:bg-[#f85149]/15',
    icon: GitPullRequestClosedIcon,
  },
  merged: {
    className: 'border-[#a371f7]/40 bg-[#a371f7]/10 text-[#c49aff] hover:bg-[#a371f7]/15',
    icon: GitMergeIcon,
  },
} as const;

export function PullRequestStatusLink({ reviewRequest }: { reviewRequest: ReviewRequest }) {
  if (!reviewRequest.url) {
    return null;
  }

  const state = resolvePullRequestState(reviewRequest.status);
  const config = stateConfig[state];
  const Icon = config.icon;
  const label = resolvePullRequestLabel(reviewRequest.status, state);

  return (
    <a
      aria-label={`Ouvrir la pull request #${reviewRequest.number ?? 'draft'}, statut ${label}`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 ${config.className}`}
      data-pr-state={state}
      href={reviewRequest.url}
      rel="noreferrer"
      target="_blank"
    >
      <Icon className="size-4" />
      <span>PR #{reviewRequest.number ?? 'draft'}</span>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em]">{label}</span>
    </a>
  );
}

function resolvePullRequestState(status: string): keyof typeof stateConfig {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'merged' || normalizedStatus === 'merge') {
    return 'merged';
  }

  if (normalizedStatus === 'closed' || normalizedStatus === 'close') {
    return 'closed';
  }

  return 'open';
}

function resolvePullRequestLabel(status: string, state: keyof typeof stateConfig): string {
  if (status.toLowerCase() === 'draft') {
    return 'Draft';
  }

  return state === 'open' ? 'Open' : state === 'closed' ? 'Closed' : 'Merged';
}
