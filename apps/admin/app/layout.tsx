import './globals.css';

export const metadata = {
  title: 'MobiFund Admin',
  description: 'Loan management dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
