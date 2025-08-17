/**
 * Quality control types for web UI
 * These types extend the base types from @repo/shared/types with UI-specific fields
 */

import type {
  QualityControlDTO,
  QualityStatus
} from '@repo/shared/types';

// Extended QualityControl type with UI-specific fields
export interface QualityControl extends QualityControlDTO {
  qualityScore: number;
  task: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
    };
    assignments?: Array<{
      user: {
        id: string;
        name: string;
      };
    }>;
  };
}

// Quality score option for UI
export interface QualityScoreOption {
  value: number;
  label: string;
  description: string;
  color: string;
}

// Quality score options
export const QUALITY_SCORE_OPTIONS: QualityScoreOption[] = [
  {
    value: 100,
    label: 'Doskonałe',
    description: 'Wykonanie bez zastrzeżeń, najwyższa jakość pracy',
    color: 'text-green-700'
  },
  {
    value: 90,
    label: 'Bardzo dobre',
    description: 'Drobne niedociągnięcia, które nie wpływają na funkcjonalność',
    color: 'text-green-600'
  },
  {
    value: 80,
    label: 'Dobre',
    description: 'Kilka drobnych usterek do poprawy',
    color: 'text-green-500'
  },
  {
    value: 70,
    label: 'Zadowalające',
    description: 'Wymaga poprawek, ale ogólnie akceptowalne',
    color: 'text-yellow-600'
  },
  {
    value: 50,
    label: 'Wymagające poprawy',
    description: 'Znaczące problemy wymagające interwencji',
    color: 'text-orange-600'
  },
  {
    value: 25,
    label: 'Niedostateczne',
    description: 'Poważne braki, konieczne przerobienie pracy',
    color: 'text-red-600'
  }
];

// Get color class for quality score
export const getQualityScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-700';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

// Get background color class for quality score
export const getQualityScoreBgColor = (score: number): string => {
  if (score >= 90) return 'bg-green-100';
  if (score >= 80) return 'bg-green-50';
  if (score >= 70) return 'bg-yellow-50';
  if (score >= 50) return 'bg-orange-50';
  return 'bg-red-50';
};

// Get color class for status
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'text-green-700';
    case 'REJECTED':
      return 'text-red-700';
    case 'PARTIALLY_APPROVED':
      return 'text-yellow-700';
    case 'PENDING':
    default:
      return 'text-gray-700';
  }
};

// Get background color class for status
export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100';
    case 'REJECTED':
      return 'bg-red-100';
    case 'PARTIALLY_APPROVED':
      return 'bg-yellow-100';
    case 'PENDING':
    default:
      return 'bg-gray-100';
  }
};