import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { RemoveFakeTransparency } from './pages/RemoveFakeTransparency'
import { Compress } from './pages/Compress'
import { Resize } from './pages/Resize'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/remove-fake-transparency" element={<RemoveFakeTransparency />} />
          <Route path="/compress" element={<Compress />} />
          <Route path="/resize" element={<Resize />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
