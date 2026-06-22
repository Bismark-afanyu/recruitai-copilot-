export default function EmptyState({
  icon,
  title = "No data found",
  description,
  action,
  actionLabel,
  actionOnClick,
  children,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-gray-300 dark:text-gray-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      )}
      {action ? (
        action
      ) : actionOnClick ? (
        <button
          onClick={actionOnClick}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
        >
          {actionLabel || "Get started"}
        </button>
      ) : null}
      {children}
    </div>
  );
}
