import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Energy | Smart Home',
};

export default function EnergyLayout({ children }: { children: ReactNode }) {
  return children;
}