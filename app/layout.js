import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LoadingScreen from '@/components/layout/LoadingScreen'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import { OrganizationSchema, WebsiteSchema, LocalBusinessSchema } from '@/components/seo/StructuredData'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com'),
  title: {
    default: 'Burhan - Powering Your Digital Lifestyle | Premium Electronics Pakistan',
    template: '%s | Burhan Store'
  },
  description: 'Premium consumer electronics and mobile accessories in Pakistan. Shop wireless earbuds, headphones, chargers, power banks, smart watches and gaming accessories with fast delivery across Pakistan.',
  keywords: ['burhan store', 'electronics pakistan', 'mobile accessories', 'wireless earbuds', 'power banks', 'fast chargers', 'smart watches', 'gaming accessories', 'online shopping pakistan', 'burhan.com'],
  authors: [{ name: 'Burhan Store' }],
  creator: 'Burhan Store',
  publisher: 'Burhan Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com',
    siteName: 'Burhan Store',
    title: 'Burhan - Powering Your Digital Lifestyle',
    description: 'Premium consumer electronics and mobile accessories in Pakistan. Fast delivery, authentic products, best prices.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Burhan Store - Premium Electronics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Burhan - Powering Your Digital Lifestyle',
    description: 'Premium consumer electronics and mobile accessories in Pakistan',
    images: ['/og-image.jpg'],
    creator: '@burhanstore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com',
  },
  category: 'ecommerce',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
        <LocalBusinessSchema />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <GoogleAnalytics />
        <Providers>
          <LoadingScreen />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}