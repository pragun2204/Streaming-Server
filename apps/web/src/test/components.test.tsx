import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';

describe('Component Rendering', () => {
  it('renders LandingPage with headline and CTA', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Watch/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Host a Watch Party/i)).toBeInTheDocument();
  });

  it('renders DiagnosticsPanel with real-time statistics', () => {
    render(
      <DiagnosticsPanel
        stats={{
          resolutionWidth: 1920,
          resolutionHeight: 1080,
          frameRate: 60,
          bitrateKbps: 4500,
          packetLossPercent: 0,
          rttMs: 20,
          jitterMs: 3,
          codec: 'H.264',
        }}
        driftMs={12}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/Real-Time Stream Diagnostics/i)).toBeInTheDocument();
    expect(screen.getByText(/1920 × 1080/i)).toBeInTheDocument();
    expect(screen.getByText(/60 fps/i)).toBeInTheDocument();
    expect(screen.getByText(/\+12 ms/i)).toBeInTheDocument();
  });
});
