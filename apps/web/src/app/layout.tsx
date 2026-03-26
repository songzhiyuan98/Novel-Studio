import './globals.css'

export const metadata = {
  title: 'Novel Studio',
  description: 'AI-powered serial fiction workbench',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
