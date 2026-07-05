/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'YubiLearn'
const APP_URL = 'https://yubilearn.com'

interface StudentOnboardingProps {
  fullName?: string
  setupUrl?: string
  classroomName?: string
  schoolName?: string
}

const StudentOnboardingEmail = ({
  fullName,
  setupUrl,
  classroomName,
  schoolName,
}: StudentOnboardingProps) => {
  const greeting = fullName ? `Hi ${fullName},` : 'Welcome!'
  const ctaUrl = setupUrl || `${APP_URL}/auth`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} account is ready — set your password to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {SITE_NAME}</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            An account has been created for you{schoolName ? ` at ${schoolName}` : ''}
            {classroomName ? ` (classroom: ${classroomName})` : ''}.
            Click below to set your password and sign in for the first time.
          </Text>
          <Section style={buttonContainer}>
            <Button href={ctaUrl} style={button}>
              Set my password
            </Button>
          </Section>
          <Text style={muted}>
            If the button doesn't work, copy and paste this link into your browser:
            <br />
            {ctaUrl}
          </Text>
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: StudentOnboardingEmail,
  subject: 'Your YubiLearn account is ready',
  displayName: 'Student onboarding',
  previewData: {
    fullName: 'Alex',
    setupUrl: 'https://yubilearn.com/auth',
    classroomName: 'Room 12',
    schoolName: 'Lincoln Elementary',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const buttonContainer = { margin: '24px 0' }
const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 'bold',
  display: 'inline-block',
}
const muted = { fontSize: '13px', color: '#666666', lineHeight: '1.5', margin: '24px 0 16px' }
const footer = { fontSize: '13px', color: '#999999', margin: '32px 0 0' }
