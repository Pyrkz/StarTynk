import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  className
}) => {
  return (
    <div className={cn(
      'bg-error-50 border border-error-200 rounded-lg p-6',
      'flex items-start gap-4',
      className
    )}>
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-error-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-error-600" />
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-error-900 mb-1">
          Wystąpił błąd
        </h3>
        <p className="text-sm text-error-700">
          {error}
        </p>
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 border-error-300 text-error-700 hover:bg-error-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Spróbuj ponownie
          </Button>
        )}
      </div>
    </div>
  )
}