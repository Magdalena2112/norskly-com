import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  activationUrl?: string
  hasAccount?: boolean
}

const TeacherApprovedEmail = ({ name, activationUrl, hasAccount }: Props) => (
  <Html lang="sr" dir="ltr">
    <Head />
    <Preview>Tvoja prijava za profesora na Norskly je odobrena</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Čestitamo! 🎉</Heading>
        <Text style={text}>Zdravo {name || ''},</Text>
        <Text style={text}>
          Sa zadovoljstvom te obaveštavamo da je tvoja prijava za profesora prihvaćena. Tvoj profesorski radni prostor je spreman.
        </Text>
        <Text style={text}>
          {hasAccount
            ? 'Prijavi se sa svojom postojećom lozinkom i počni sa radom kao profesor.'
            : 'Klikni na dugme ispod, postavi lozinku i pristupi kalendaru i alatima za nastavu.'}
        </Text>
        <Button href={activationUrl || 'https://norskly.com/profesori/aktivacija'} style={button}>
          {hasAccount ? 'Prijava za profesore' : 'Aktiviraj profesorski nalog'}
        </Button>
        <Hr style={hr} />
        <Text style={footer}>— Norskly tim</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeacherApprovedEmail,
  subject: 'Tvoja prijava za profesora na Norskly je odobrena 🎉',
  displayName: 'Prijava profesora odobrena',
  previewData: { name: 'Ana', activationUrl: 'https://norskly.com/profesori/aktivacija?email=ana@example.com', hasAccount: false },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '500px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a5f', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3d4f5f', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#1e3a5f', color: '#ffffff', borderRadius: '999px', padding: '12px 24px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e8e0d8', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999', margin: '20px 0 0' }
