export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="size-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-stone-800">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-stone-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
