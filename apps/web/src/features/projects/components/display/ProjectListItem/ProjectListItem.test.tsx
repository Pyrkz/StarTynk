import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectListItem } from './ProjectListItem'
import { Project } from '@/features/projekty/types'

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  address: 'Test Address 123',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'ACTIVE',
  developer: {
    id: 'dev1',
    name: 'Test Developer'
  },
  _count: {
    apartments: 42
  }
}

describe('ProjectListItem', () => {
  const defaultColumns = {
    developer: true,
    dates: true,
    status: true,
    progress: true,
    value: true,
    actions: true
  }

  it('renders project information correctly', () => {
    render(<ProjectListItem project={mockProject} showColumns={defaultColumns} />)
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Test Address 123')).toBeInTheDocument()
    expect(screen.getByText('Test Developer')).toBeInTheDocument()
    expect(screen.getByText('W trakcie')).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<ProjectListItem project={mockProject} showColumns={defaultColumns} />)
    
    expect(screen.getByText(/01 sty 2024/)).toBeInTheDocument()
    expect(screen.getByText(/31 gru 2024/)).toBeInTheDocument()
  })

  it('shows progress for active projects', () => {
    render(<ProjectListItem project={mockProject} showColumns={defaultColumns} />)
    
    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars).toHaveLength(1)
  })

  it('hides columns based on showColumns prop', () => {
    render(
      <ProjectListItem 
        project={mockProject} 
        showColumns={{
          ...defaultColumns,
          developer: false,
          progress: false
        }} 
      />
    )
    
    expect(screen.queryByText('Test Developer')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(
      <ProjectListItem 
        project={mockProject} 
        onClick={handleClick}
        showColumns={defaultColumns}
      />
    )
    
    fireEvent.click(screen.getByRole('row'))
    expect(handleClick).toHaveBeenCalledWith(mockProject)
  })

  it('shows apartment count', () => {
    render(<ProjectListItem project={mockProject} showColumns={defaultColumns} />)
    
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('mieszkań')).toBeInTheDocument()
  })

  it('applies hover styles when interactive', () => {
    const { container } = render(
      <ProjectListItem 
        project={mockProject} 
        onClick={jest.fn()}
        showColumns={defaultColumns}
      />
    )
    
    const row = container.querySelector('tr')
    expect(row).toHaveClass('hover:bg-neutral-50')
  })

  it('shows correct status badge color', () => {
    const completedProject = { ...mockProject, status: 'COMPLETED' as const }
    render(<ProjectListItem project={completedProject} showColumns={defaultColumns} />)
    
    const badge = screen.getByText('Ukończony')
    expect(badge.parentElement).toHaveClass('bg-neutral-100')
  })

  it('handles missing apartment count', () => {
    const projectWithoutCount = { ...mockProject, _count: undefined }
    render(<ProjectListItem project={projectWithoutCount} showColumns={defaultColumns} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})