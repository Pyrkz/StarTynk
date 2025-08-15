import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchInput } from '../SearchInput'

describe('SearchInput', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders with placeholder text', () => {
    render(<SearchInput value="" onChange={mockOnChange} />)
    
    expect(screen.getByPlaceholderText('Szukaj po nazwie, emailu lub telefonie...')).toBeInTheDocument()
  })

  it('displays the provided value', () => {
    render(<SearchInput value="test search" onChange={mockOnChange} />)
    
    expect(screen.getByDisplayValue('test search')).toBeInTheDocument()
  })

  it('debounces onChange calls', async () => {
    render(<SearchInput value="" onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText('Szukaj po nazwie, emailu lub telefonie...')
    
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Should not call immediately
    expect(mockOnChange).not.toHaveBeenCalled()
    
    // Fast forward timers
    jest.advanceTimersByTime(300)
    
    // Now it should have been called
    expect(mockOnChange).toHaveBeenCalledWith('test')
  })

  it('cancels previous debounce on new input', () => {
    render(<SearchInput value="" onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText('Szukaj po nazwie, emailu lub telefonie...')
    
    fireEvent.change(input, { target: { value: 'test' } })
    jest.advanceTimersByTime(200)
    
    fireEvent.change(input, { target: { value: 'test new' } })
    jest.advanceTimersByTime(300)
    
    // Should only be called once with the latest value
    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith('test new')
  })

  it('is disabled when loading', () => {
    render(<SearchInput value="" onChange={mockOnChange} loading={true} />)
    
    const input = screen.getByPlaceholderText('Szukaj po nazwie, emailu lub telefonie...')
    expect(input).toBeDisabled()
  })

  it('has search icon', () => {
    const { container } = render(<SearchInput value="" onChange={mockOnChange} />)
    
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon?.parentElement).toHaveClass('pointer-events-none')
  })
})