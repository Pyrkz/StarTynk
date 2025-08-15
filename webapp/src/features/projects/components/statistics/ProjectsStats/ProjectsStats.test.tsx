import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProjectsStats } from './ProjectsStats'
import { ProjectMetrics } from '@/features/projects/types'

describe('ProjectsStats', () => {
  const mockMetrics: ProjectMetrics = {
    totalProjects: 42,
    activeProjects: 15,
    completedProjects: 20,
    onHoldProjects: 7,
    totalValue: 125000000,
    averageProgress: 68,
    upcomingDeadlines: 3
  }

  it('renders all metric cards', () => {
    render(<ProjectsStats metrics={mockMetrics} />)
    
    expect(screen.getByText('Wszystkie projekty')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    
    expect(screen.getByText('Aktywne')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    
    expect(screen.getByText('Ukończone')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    
    expect(screen.getByText('Wstrzymane')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('formats large numbers correctly', () => {
    render(<ProjectsStats metrics={mockMetrics} />)
    
    expect(screen.getByText('125 mln zł')).toBeInTheDocument()
  })

  it('shows percentage for average progress', () => {
    render(<ProjectsStats metrics={mockMetrics} />)
    
    expect(screen.getByText('68%')).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', () => {
    render(<ProjectsStats metrics={mockMetrics} isLoading />)
    
    const skeletons = screen.getAllByTestId('stats-skeleton')
    expect(skeletons).toHaveLength(7)
  })

  it('applies custom className', () => {
    const { container } = render(
      <ProjectsStats metrics={mockMetrics} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('highlights upcoming deadlines when greater than 0', () => {
    render(<ProjectsStats metrics={mockMetrics} />)
    
    const deadlineCard = screen.getByText('Zbliżające się terminy').closest('div')
    expect(deadlineCard).toHaveClass('border-warning-200')
  })

  it('shows zero values correctly', () => {
    const zeroMetrics: ProjectMetrics = {
      ...mockMetrics,
      upcomingDeadlines: 0,
      onHoldProjects: 0
    }
    
    render(<ProjectsStats metrics={zeroMetrics} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})