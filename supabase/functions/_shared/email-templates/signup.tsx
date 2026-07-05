/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const LOGO_URL =
  'https://sjigkjwkgovculkovcjy.supabase.co/storage/v1/object/public/email-assets/yubilearn-logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to YubiLearn — confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="YubiLearn" style={logo} />
          <Text style={brand}>YubiLearn</Text>
        </Section>
        <Section style={accentBar} />
        <Heading style={h1}>Welcome to YubiLearn</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          {' '}— AI-powered literacy that helps every student grow.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to start your learning journey:
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Confirm my email
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't create a YubiLearn account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const header = { marginBottom: '24px' }
const logo = { borderRadius: '12px', display: 'inline-block', verticalAlign: 'middle' as const, marginRight: '12px' }
const brand = {
  fontSize: '20px',
  fontWeight: 700 as const,
  color: 'hsl(270, 40%, 15%)',
  margin: 0,
  display: 'inline-block',
  verticalAlign: 'middle' as const,
}
const accentBar = {
  height: '4px',
  width: '64px',
  backgroundColor: 'hsl(48, 100%, 60%)',
  borderRadius: '4px',
  marginBottom: '24px',
}
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  color: 'hsl(270, 40%, 15%)',
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: 'hsl(270, 20%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const link = { color: 'hsl(270, 70%, 55%)', textDecoration: 'underline' }
const buttonWrap = { margin: '28px 0' }
const button = {
  backgroundColor: 'hsl(270, 70%, 55%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '16px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = {
  fontSize: '13px',
  color: 'hsl(270, 20%, 60%)',
  margin: '32px 0 0',
  borderTop: '1px solid hsl(270, 20%, 92%)',
  paddingTop: '20px',
}
