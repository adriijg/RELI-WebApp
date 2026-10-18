export default function EmptyState({ title, message, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-muted/20 border border-card-border flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 13V7a2 2 0 00-2-2h-5.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 009.586 3H6a2 2 0 00-2 2v8m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0H4"
          />
        </svg>
      </div>
      {title && <p className="font-black tracking-tight text-foreground">{title}</p>}
      {message && <p className="text-sm font-bold text-muted-foreground mt-1 max-w-md">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
