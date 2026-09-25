import React from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
