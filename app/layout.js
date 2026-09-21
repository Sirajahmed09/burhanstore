import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LoadingScreen from '@/components/layout/LoadingScreen'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/StructuredData'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com'),
  title: {
    default: 'BURHAN STORE | Premium Mobile Accessories & Electronics in Pakistan',
    template: '%s | BURHAN STORE'
  },
  description: 'Pakistan’s premier destination for high quality mobile accessories and electronics. Shop authentic wireless earbuds, smartwatches, power banks, and fast chargers with nationwide cash on delivery.',
  keywords: [
    'BURHAN STORE',
    'mobile accessories pakistan',
    'wireless earbuds pakistan',
    'smartwatches pakistan',
    'fast chargers',
    'power banks pakistan',
    'electronics online shopping karachi'
  ],
  authors: [{ name: 'BURHAN STORE' }],
  creator: 'BURHAN STORE',
  publisher: 'BURHAN STORE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://burhanstore.com',
    siteName: 'BURHAN STORE',
    title: 'BURHAN STORE | Premium Mobile Accessories & Electronics in Pakistan',
    description: 'Pakistan’s premier destination for high quality mobile accessories and electronics with fast delivery and authentic warranty.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BURHAN STORE - Premium Mobile Accessories & Electronics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BURHAN STORE | Premium Mobile Accessories & Electronics in Pakistan',
    description: 'Authentic mobile accessories, wireless earbuds, smartwatches, and chargers delivered across Pakistan.',
    images: ['/og-image.jpg'],
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
  category: 'ecommerce',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
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
