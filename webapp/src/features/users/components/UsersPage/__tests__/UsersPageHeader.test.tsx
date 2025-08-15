import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import UsersPageHeader from '../UsersPageHeader'

describe('UsersPageHeader', () => {
  const mockOnInviteClick = jest.fn()

  beforeEach(() => {
    mockOnInviteClick.mockClear()
  })

  it('renders the header with title and subtitle', () => {
    render(<UsersPageHeader onInviteClick={mockOnInviteClick} />)
    
    expect(screen.getByText('Użytkownicy')).toBeInTheDocument()
    expect(screen.getByText('Zarządzaj użytkownikami i ich uprawnieniami w systemie')).toBeInTheDocument()
  })

  it('renders the invite button', () => {
    render(<UsersPageHeader onInviteClick={mockOnInviteClick} />)
    
    const button = screen.getByRole('button', { name: /zaproś użytkownika/i })
    expect(button).toBeInTheDocument()
  })

  it('calls onInviteClick when invite button is clicked', () => {
    render(<UsersPageHeader onInviteClick={mockOnInviteClick} />)
    
    const button = screen.getByRole('button', { name: /zaproś użytkownika/i })
    fireEvent.click(button)
    
    expect(mockOnInviteClick).toHaveBeenCalledTimes(1)
  })

  it('has proper styling classes for professional look', () => {
    const { container } = render(<UsersPageHeader onInviteClick={mockOnInviteClick} />)
    
    const header = container.firstChild
    expect(header).toHaveClass('py-8', 'border-b', 'border-neutral-200')
  })
})