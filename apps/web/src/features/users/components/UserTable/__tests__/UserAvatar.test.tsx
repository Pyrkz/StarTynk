import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserAvatar } from '../UserAvatar'
import { UserWithRelations } from '@/features/users/types'

describe('UserAvatar', () => {
  const mockUser: UserWithRelations = {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserWithRelations

  it('displays initials from full name', () => {
    render(<UserAvatar user={mockUser} />)
    
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('displays single initial when only first name', () => {
    const user = { ...mockUser, name: 'John' }
    render(<UserAvatar user={user} />)
    
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('displays email initial when no name', () => {
    const user = { ...mockUser, name: null }
    render(<UserAvatar user={user} />)
    
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<UserAvatar user={mockUser} size="sm" />)
    expect(screen.getByText('JD').parentElement).toHaveClass('h-8', 'w-8', 'text-xs')
    
    rerender(<UserAvatar user={mockUser} size="md" />)
    expect(screen.getByText('JD').parentElement).toHaveClass('h-10', 'w-10', 'text-sm')
    
    rerender(<UserAvatar user={mockUser} size="lg" />)
    expect(screen.getByText('JD').parentElement).toHaveClass('h-12', 'w-12', 'text-base')
  })

  it('applies consistent background color based on email', () => {
    const { container } = render(<UserAvatar user={mockUser} />)
    const avatar = container.firstChild
    
    expect(avatar).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center', 'text-white')
  })
})