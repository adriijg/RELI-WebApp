export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase leading-none">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2 font-medium text-sm max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
