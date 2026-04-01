import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "norskly"

interface Props {
  studentName?: string
  date?: string
  time?: string
  note?: string
}

const LessonBookedTeacherEmail = ({ studentName, date, time, note }: Props) => (
  <Html lang="sr" dir="ltr">
    <Head />
    <Preview>Novi čas zakazan — {studentName || 'učenik'} za {date}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Novi čas zakazan 📚</Heading>
        <Text style={text}>
          Učenik je upravo zakazao čas sa tobom.
        </Text>
        <Section style={detailsBox}>
          <Text style={detailLabel}>👤 Učenik</Text>
          <Text style={detailValue}>{studentName || 'Nepoznat'}</Text>
          <Text style={detailLabel}>📅 Datum</Text>
          <Text style={detailValue}>{date || '—'}</Text>
          <Text style={detailLabel}>🕐 Vreme</Text>
          <Text style={detailValue}>{time || '—'}</Text>
          {note && (
            <>
              <Text style={detailLabel}>📝 Napomena učenika</Text>
              <Text style={detailValue}>{note}</Text>
            </>
          )}
        </Section>
        <Hr style={hr} />
        <Text style={text}>
          Proveri svoj kalendar i pripremi se za čas!
        </Text>
        <Text style={footer}>— {SITE_NAME} sistem</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LessonBookedTeacherEmail,
  subject: (data: Record<string, any>) => `Novi čas: ${data.studentName || 'učenik'} — ${data.date || ''}`,
  displayName: 'Obaveštenje o čas — nastavnik',
  previewData: { studentName: 'Marko Petrović', date: '15.01.2025', time: '14:00 – 15:30', note: 'Želim da vežbam razgovor' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '500px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a5f', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3d4f5f', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f5f0eb', borderRadius: '12px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '12px', color: '#7a8a96', margin: '8px 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const detailValue = { fontSize: '15px', color: '#1e3a5f', fontWeight: '600' as const, margin: '0 0 4px' }
const hr = { borderColor: '#e8e0d8', margin: '20px 0' }
const footer = { fontSize: '13px', color: '#999', margin: '20px 0 0' }
