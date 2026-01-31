'use client';

import { Container, Stack } from '@mui/material';

import { FeaturesSection } from './FeaturesSection';
import { FinalCTASection } from './FinalCTASection';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { LandingFooter } from './LandingFooter';

export function LandingPageContent() {
  return (
    <Container maxWidth="md">
      <Stack spacing={6}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FinalCTASection />
        <LandingFooter />
      </Stack>
    </Container>
  );
}
