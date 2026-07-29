import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Burhan - Powering Your Digital Lifestyle',
  description: 'Premium consumer electronics and mobile accessories in Pakistan. Shop wireless earbuds, headphones, chargers, power banks, smart watches and gaming accessories.',
  keywords: 'burhan, electronics, pakistan, earbuds, headphones, chargers, power banks, smart watches, gaming accessories',
  openGraph: {
    title: 'Burhan - Powering Your Digital Lifestyle',
    description: 'Premium consumer electronics and mobile accessories in Pakistan',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}