interface QuickAction {
  id: string
  label: string
  icon: string
  color: string
  onClick: () => void
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`p-4 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all duration-200 group ${action.color}`}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
              {action.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}