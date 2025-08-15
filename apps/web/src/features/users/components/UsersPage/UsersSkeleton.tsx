import React from 'react'

export const UsersSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-neutral-200 rounded w-24"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-neutral-200 rounded w-32"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-neutral-200 rounded w-20"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-neutral-200 rounded w-28"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-neutral-200 rounded w-16"></div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {[...Array(5)].map((_, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
                  <div className="ml-4">
                    <div className="h-4 bg-neutral-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-24"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-neutral-200 rounded w-20"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-6 bg-neutral-200 rounded-full w-16"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-neutral-200 rounded w-24"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <div className="h-8 bg-neutral-200 rounded w-16"></div>
                  <div className="h-8 bg-neutral-200 rounded w-16"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}