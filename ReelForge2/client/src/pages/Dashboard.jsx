import { useState, useEffect } from 'react'
import { useAuth, API } from '../App'

export default function Dashboard({ onOpen }) {
  const { token } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showModal, setShowModal] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchProjects = async () => {
    setLoading(true)
    const res = await fetch(API + '/api/projects', { headers })
    const data = await res.json()
    setProjects(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  const createProject = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch(API + '/api/projects', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    })
    const project = await res.json()
    setProjects(p => [project, ...p])
    setNewName('')
    setShowModal(false)
    setCreating(false)
    onOpen(project)
  }

  const deleteProject = async (uuid, e) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its files?')) return
    await fetch(API + `/api/projects/${uuid}`, { method: 'DELETE', headers })
    setProjects(p => p.filter(x => x.uuid !== uuid))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Reels</h1>
          <p className="sub">Manage and create your reel projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Reel</button>
      </div>

      {loading ? (
        <div className="loading-msg">Loading projects...</div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div className="project-card" key={p.uuid} onClick={() => onOpen(p)}>
              <div className="project-thumb">
                <div className="play-tri-lg"></div>
              </div>
              <div className="project-info">
                <div className="project-name">{p.name}</div>
                <div className="project-meta">{p.files?.length || 0} files · {new Date(p.created_at).toLocaleDateString()}</div>
                <div className="project-footer">
                  <span className={`badge ${p.status === 'done' ? 'badge-done' : 'badge-draft'}`}>{p.status}</span>
                  <button className="delete-btn" onClick={e => deleteProject(p.uuid, e)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          <div className="new-card" onClick={() => setShowModal(true)}>
            <span className="plus-icon">+</span>
            <span>New project</span>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6, fontWeight: 500 }}>New reel project</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>A unique UUID folder will be created automatically</p>
            <input className="input" placeholder="Project name" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createProject()} autoFocus />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createProject} disabled={creating}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
