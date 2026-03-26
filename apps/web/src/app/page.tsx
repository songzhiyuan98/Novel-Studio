import { PACKAGE_NAME } from '@novel-studio/core'

export default function Home() {
  return (
    <main>
      <h1>Novel Studio</h1>
      <p>AI-powered serial fiction workbench</p>
      <p>Core: {PACKAGE_NAME}</p>
    </main>
  )
}
