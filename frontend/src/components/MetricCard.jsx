import React from 'react'

export const MetricCard = ({ label, value, icon: Icon, trend }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </h3>
      {Icon && <Icon size={20} className="text-legal-blue" />}
    </div>
    <div className="flex items-baseline justify-between">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {trend && (
        <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
)
