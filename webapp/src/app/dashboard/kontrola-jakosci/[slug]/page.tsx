import React from 'react'
import { QualityControlAssessment } from '@/features/quality-control'

interface QualityAssessmentPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function QualityAssessmentPage({ params }: QualityAssessmentPageProps) {
  const { slug } = await params;
  return <QualityControlAssessment taskId={slug} />
}