import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import UsersPagination from '../UsersPagination'

describe('UsersPagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    total: 100,
    pageSize: 20,
    loading: false,
    onPageChange: jest.fn(),
  }

  beforeEach(() => {
    defaultProps.onPageChange.mockClear()
  })

  it('displays correct item range', () => {
    render(<UsersPagination {...defaultProps} />)
    
    expect(screen.getByText(/wyświetlanie/i)).toHaveTextContent('Wyświetlanie 1 do 20 z 100 użytkowników')
  })

  it('displays correct item range for middle page', () => {
    render(<UsersPagination {...defaultProps} currentPage={3} />)
    
    expect(screen.getByText(/wyświetlanie/i)).toHaveTextContent('Wyświetlanie 41 do 60 z 100 użytkowników')
  })

  it('disables previous button on first page', () => {
    render(<UsersPagination {...defaultProps} />)
    
    const prevButton = screen.getByRole('button', { name: /poprzednia strona/i })
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<UsersPagination {...defaultProps} currentPage={5} />)
    
    const nextButton = screen.getByRole('button', { name: /następna strona/i })
    expect(nextButton).toBeDisabled()
  })

  it('calls onPageChange when clicking page number', () => {
    render(<UsersPagination {...defaultProps} />)
    
    const page3Button = screen.getByRole('button', { name: '3' })
    fireEvent.click(page3Button)
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange when clicking next button', () => {
    render(<UsersPagination {...defaultProps} currentPage={2} />)
    
    const nextButton = screen.getByRole('button', { name: /następna strona/i })
    fireEvent.click(nextButton)
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3)
  })

  it('shows ellipsis for many pages', () => {
    render(<UsersPagination {...defaultProps} totalPages={10} currentPage={5} />)
    
    const ellipses = screen.getAllByText('...')
    expect(ellipses).toHaveLength(2)
  })

  it('disables all buttons when loading', () => {
    render(<UsersPagination {...defaultProps} loading={true} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })
})