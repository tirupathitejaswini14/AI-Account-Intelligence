import { Navigation } from '@/components/Navigation'
import '@/app/globals.css'
import { Outfit } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata = {
  title: 'AccountIQ - AI Account Intelligence',
  description: 'Convert anonymous visitor signals into structured B2B sales intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/30 selection:text-primary-foreground`}>
        {/* Subtle mesh glowing background */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        <Navigation />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
