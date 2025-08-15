import { useState, useEffect } from 'react'
// import { useSession } from 'next-auth/react' // Temporarily disabled for client demo
import { useSession } from '@/lib/mock-auth'

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  employeePosition: string
  period: string
  hoursWorked: number
  hourlyRate: number
  baseSalary: number
  bonuses: {
    id: string
    type: 'quality' | 'performance' | 'project_completion' | 'attendance' | 'other'
    amount: number
    description: string
  }[]
  deductions: {
    id: string
    type: 'absence' | 'damage' | 'advance' | 'other'
    amount: number
    description: string
  }[]
  netPay: number
  status: 'pending' | 'processing' | 'paid'
  paymentDate?: Date
  paymentMethod?: 'bank_transfer' | 'cash' | 'check'
  tasksCompleted: number
  apartmentsCompleted: string[]
}

export interface PayrollSummary {
  totalPayroll: number
  totalHours: number
  averageHourlyRate: number
  employeeCount: number
  paidCount: number
  pendingCount: number
}

export function useProjectPayroll(projectId: string, period?: string) {
  const { data: session } = useSession()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [summary, setSummary] = useState<PayrollSummary>({
    totalPayroll: 0,
    totalHours: 0,
    averageHourlyRate: 0,
    employeeCount: 0,
    paidCount: 0,
    pendingCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !projectId) return

    const fetchPayroll = async () => {
      try {
        setLoading(true)
        const url = period 
          ? `/api/projects/${projectId}/payroll?period=${period}`
          : `/api/projects/${projectId}/payroll`
          
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch project payroll')
        }

        const data = await response.json()
        
        // Transform dates
        const transformedRecords = data.records.map((record: any) => ({
          ...record,
          paymentDate: record.paymentDate ? new Date(record.paymentDate) : undefined
        }))
        
        setRecords(transformedRecords)
        setSummary(data.summary)
        setError(null)
      } catch (err) {
        console.error('Error fetching project payroll:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPayroll()
  }, [projectId, period, session])

  const createPayrollRecord = async (data: {
    userId: string
    period: string
    hoursWorked: number
    hourlyRate: number
    bonuses?: Array<{
      type: 'QUALITY' | 'PERFORMANCE' | 'PROJECT_COMPLETION' | 'ATTENDANCE' | 'OTHER'
      amount: number
      description: string
    }>
    deductions?: Array<{
      type: 'ABSENCE' | 'DAMAGE' | 'ADVANCE' | 'OTHER'
      amount: number
      description: string
    }>
  }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/payroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payroll record')
      }

      // Refresh payroll list
      const url = period 
        ? `/api/projects/${projectId}/payroll?period=${period}`
        : `/api/projects/${projectId}/payroll`
      const updatedResponse = await fetch(url)
      const updatedData = await updatedResponse.json()
      
      const transformedRecords = updatedData.records.map((record: any) => ({
        ...record,
        paymentDate: record.paymentDate ? new Date(record.paymentDate) : undefined
      }))
      
      setRecords(transformedRecords)
      setSummary(updatedData.summary)
      
      return { success: true }
    } catch (err) {
      console.error('Error creating payroll record:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create payroll record' 
      }
    }
  }

  const updatePayrollStatus = async (
    payrollId: string, 
    updates: {
      status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED'
      paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHECK'
      paymentDate?: string
      bankReference?: string
    }
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/payroll?payrollId=${payrollId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update payroll status')
      }

      // Refresh payroll list
      const url = period 
        ? `/api/projects/${projectId}/payroll?period=${period}`
        : `/api/projects/${projectId}/payroll`
      const updatedResponse = await fetch(url)
      const updatedData = await updatedResponse.json()
      
      const transformedRecords = updatedData.records.map((record: any) => ({
        ...record,
        paymentDate: record.paymentDate ? new Date(record.paymentDate) : undefined
      }))
      
      setRecords(transformedRecords)
      setSummary(updatedData.summary)
      
      return { success: true }
    } catch (err) {
      console.error('Error updating payroll status:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update payroll status' 
      }
    }
  }

  return {
    records,
    summary,
    loading,
    error,
    refetch: () => {
      if (session && projectId) {
        const fetchPayroll = async () => {
          try {
            setLoading(true)
            const url = period 
              ? `/api/projects/${projectId}/payroll?period=${period}`
              : `/api/projects/${projectId}/payroll`
              
            const response = await fetch(url)
            
            if (!response.ok) {
              throw new Error('Failed to fetch project payroll')
            }

            const data = await response.json()
            
            // Transform dates
            const transformedRecords = data.records.map((record: any) => ({
              ...record,
              paymentDate: record.paymentDate ? new Date(record.paymentDate) : undefined
            }))
            
            setRecords(transformedRecords)
            setSummary(data.summary)
            setError(null)
          } catch (err) {
            console.error('Error fetching project payroll:', err)
            setError(err instanceof Error ? err.message : 'An error occurred')
          } finally {
            setLoading(false)
          }
        }

        fetchPayroll()
      }
    },
    createPayrollRecord,
    updatePayrollStatus
  }
}