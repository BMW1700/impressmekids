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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL =
  'https://sjigkjwkgovculkovcjy.supabase.co/storage/v1/object/public/email-assets/nabulearn-logo.png'

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your NabuLearn sign-in link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="NabuLearn" style={logo} />
          <Text style={brand}>NabuLearn</Text>
        </Section>
        <Section style={accentBar} />
        <Heading style={h1}>Sign in to NabuLearn</Heading>
        <Text style={text}>
          Click the button below to sign in to {siteName}. This link expires
          shortly for your security.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Sign in
          </Button>
        </Section>
        <Text style={footer}>
          Didn't request this link? You can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
