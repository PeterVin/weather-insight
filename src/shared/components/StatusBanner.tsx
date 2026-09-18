interface StatusBannerProps {
  kind: 'loading' | 'error' | 'empty';
  title: string;
  message: string;
  onRetry?: () => void;
}

export function StatusBanner({
  kind,
  title,
  message,
  onRetry,
}: StatusBannerProps): React.JSX.Element {
  return (
    <section
      className={`status-banner status-banner--${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className="status-banner__icon" aria-hidden="true">
        {kind === 'loading' ? '◌' : kind === 'error' ? '!' : '○'}
      </span>
      <div className="status-banner__content">
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </section>
  );
}
