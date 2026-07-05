/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL =
  'https://sjigkjwkgovculkovcjy.supabase.co/storage/v1/object/public/email-assets/yubilearn-logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your YubiLearn verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="YubiLearn" style={logo} />
          <Text style={brand}>YubiLearn</Text>
        </Section>
        <Section style={accentBar} />
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Enter the code below to verify your identity:</Text>
        <Section style={codeWrap}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          This code expires shortly. If you didn't request this, you can safely
          ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeWrap = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  border: '1px solid hsl(270, 20%, 92%)',
  borderRadius: '16px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0 24px',
}
const codeStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '28px',
  fontWeight: 700 as const,
  letterSpacing: '6px',
  color: 'hsl(270, 70%, 55%)',
  margin: 0,
}
const footer = {
  fontSize: '13px',
  color: 'hsl(270, 20%, 60%)',
  margin: '32px 0 0',
  borderTop: '1px solid hsl(270, 20%, 92%)',
  paddingTop: '20px',
}
