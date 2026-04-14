import { useState, useEffect, createContext, useContext } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import './index.css'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export { API }

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('rf_token'))
  const [view, setView] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    const u = localStorage.getItem('rf_user')
    if (u && token) setUser(JSON.parse(u))
  }, [token])

  const login = (data) => {
    localStorage.setItem('rf_token', data.token)
    localStorage.setItem('rf_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('rf_token')
    localStorage.removeItem('rf_user')
    setToken(null)
    setUser(null)
  }

  const openEditor = (project) => {
    setSelectedProject(project)
    setView('editor')
  }

  if (!user || !token) return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Login />
    </AuthContext.Provider>
  )

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="app">
        <nav className="topbar">
          <div className="logo">
            <div className="logo-icon"><div className="play-tri"></div></div>
            ReelForge
          </div>
          <div className="nav-right">
            <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>My Reels</button>
            {selectedProject && (
              <button className={`nav-link ${view === 'editor' ? 'active' : ''}`} onClick={() => setView('editor')}>Editor</button>
            )}
            <div className="user-pill" onClick={logout} title="Click to logout">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
            </div>
          </div>
        </nav>
        <main className="main-content">
          {view === 'dashboard' && <Dashboard onOpen={openEditor} />}
          {view === 'editor' && <Editor project={selectedProject} onBack={() => setView('dashboard')} />}
        </main>
      </div>
    </AuthContext.Provider>
  )
}
