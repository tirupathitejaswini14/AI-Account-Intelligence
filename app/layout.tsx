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
    <html lang="en">
      <body className={`${outfit.className} min-h-screen bg-slate-50 text-foreground flex antialiased selection:bg-primary/30 selection:text-primary`}>
        {/* Sidebar Navigation */}
        <Navigation />
        
        {/* Main Application Content Pane */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden py-4 pr-4">
          <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-y-auto w-full relative h-full">
            <div className="max-w-7xl mx-auto w-full p-6 md:p-10 lg:p-12 relative z-10">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
