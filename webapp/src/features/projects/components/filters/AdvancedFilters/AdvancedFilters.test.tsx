import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdvancedFilters } from './AdvancedFilters'

describe('AdvancedFilters', () => {
  const mockDevelopers = [
    { id: '1', name: 'Developer A' },
    { id: '2', name: 'Developer B' },
    { id: '3', name: 'Developer C' }
  ]

  const defaultProps = {
    isOpen: true,
    onToggle: jest.fn(),
    developerId: undefined,
    onDeveloperChange: jest.fn(),
    dateRange: undefined,
    onDateRangeChange: jest.fn(),
    sortBy: 'name',
    onSortByChange: jest.fn(),
    sortOrder: 'asc' as const,
    onSortOrderChange: jest.fn(),
    onReset: jest.fn(),
    developers: mockDevelopers
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when open', () => {
    render(<AdvancedFilters {...defaultProps} />)
    
    expect(screen.getByText('Filtry zaawansowane')).toBeInTheDocument()
    expect(screen.getByText('Deweloper')).toBeInTheDocument()
    expect(screen.getByText('Zakres dat')).toBeInTheDocument()
    expect(screen.getByText('Sortowanie')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<AdvancedFilters {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Deweloper')).not.toBeInTheDocument()
    expect(screen.queryByText('Zakres dat')).not.toBeInTheDocument()
  })

  it('calls onToggle when header is clicked', () => {
    render(<AdvancedFilters {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Filtry zaawansowane'))
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows selected developer', () => {
    render(<AdvancedFilters {...defaultProps} developerId="1" />)
    
    const select = screen.getByRole('combobox', { name: /deweloper/i })
    expect(select).toHaveValue('1')
  })

  it('calls onDeveloperChange when developer is selected', () => {
    render(<AdvancedFilters {...defaultProps} />)
    
    const select = screen.getByRole('combobox', { name: /deweloper/i })
    fireEvent.change(select, { target: { value: '2' } })
    
    expect(defaultProps.onDeveloperChange).toHaveBeenCalledWith('2')
  })

  it('shows selected sort options', () => {
    render(<AdvancedFilters {...defaultProps} sortBy="endDate" sortOrder="desc" />)
    
    const sortBySelect = screen.getByRole('combobox', { name: /sortuj według/i })
    expect(sortBySelect).toHaveValue('endDate')
    
    const descButton = screen.getByRole('button', { name: /malejąco/i })
    expect(descButton).toHaveClass('bg-primary-500')
  })

  it('calls onReset when reset button is clicked', () => {
    render(<AdvancedFilters {...defaultProps} developerId="1" />)
    
    fireEvent.click(screen.getByText('Resetuj filtry'))
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1)
  })

  it('shows active filters count', () => {
    render(<AdvancedFilters {...defaultProps} developerId="1" />)
    
    expect(screen.getByText('1')).toHaveClass('bg-primary-500')
  })

  it('shows loading state', () => {
    render(<AdvancedFilters {...defaultProps} isLoading />)
    
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument()
  })

  it('disables inputs when loading', () => {
    render(<AdvancedFilters {...defaultProps} isLoading />)
    
    const select = screen.getByRole('combobox', { name: /deweloper/i })
    expect(select).toBeDisabled()
  })
})