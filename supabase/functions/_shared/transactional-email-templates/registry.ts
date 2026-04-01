/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as lessonBookedStudent } from './lesson-booked-student.tsx'
import { template as lessonBookedTeacher } from './lesson-booked-teacher.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lesson-booked-student': lessonBookedStudent,
  'lesson-booked-teacher': lessonBookedTeacher,
}
