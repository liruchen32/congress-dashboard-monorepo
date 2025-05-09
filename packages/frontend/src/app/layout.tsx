import React from 'react'
import type { Metadata } from 'next'
// utils
import StyledComponentsRegistry from '@/utils/style-registry'
import { notoSans } from '@/utils/font'
// style
import GlobalStyles from '@/styles/global-styles'
// component
import Header from '@/components/header'
import Footer from '@/components/footer'
import SnackBar from '@/components/snack-bar'
// context
import { ScrollProvider } from '@/contexts/scroll-context'

export const metadata: Metadata = {
  title: 'Twreporter Congress Dashboard',
  description: '報導者議會透視版',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-tw" className={notoSans.className}>
      <body>
        <StyledComponentsRegistry>
          <ScrollProvider>
            <GlobalStyles />
            <Header />
            <main>{children}</main>
            <Footer />
          </ScrollProvider>
          <SnackBar />
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
