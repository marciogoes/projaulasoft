import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Portal Cartorial', template: '%s | Portal Cartorial' },
  description: 'Plataforma digital para servicos cartoriais — TJPA',
  keywords: ['cartorio', 'certidao', 'reconhecimento de firma', 'tjpa'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
