import { useState, useEffect, useRef } from 'react'
import { useAuth, API } from '../App'

export default function Editor({ project, onBack }) {
  const { token } = useAuth()
  const [files, setFiles] = useState([])
  const [clipDuration, setClipDuration] = useState(project?.clip_duration || 3)
  const [transition, setTransition] = useState(project?.transition || 'fade')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [genDone, setGenDone] = useState(project?.status === 'done')
  const [copied, setCopied] = useState(false)
  const imgRef = useRef(); const vidRef = useRef(); const musRef = useRef()
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetch(API + '/api/projects', { headers })
      .then(r => r.json())
      .then(data => {
        const p = Array.isArray(data) ? data.find(x => x.uuid === project.uuid) : null
        if (p) setFiles(p.files || [])
      })
  }, [])

  const uploadFile = async (file, type) => {
    setUploading(true)
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        const f = JSON.parse(xhr.responseText)
        setFiles(prev => [...prev, f])
      }
      setUploading(false)
      setUploadProgress(0)
    }
    xhr.open('POST', `${API}/api/upload/${project.uuid}/${type}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  }

  const handleFile = (e, type) => {
    const file = e.target.files[0]
    if (file) uploadFile(file, type)
  }

  const generateReel = async () => {
    setGenerating(true)
    setGenProgress(0)
    const steps = [10, 25, 45, 65, 80, 95, 100]
    const labels = ['Processing images...', 'Encoding clips...', 'Mixing audio...', 'Applying transitions...', 'Compositing...', 'Finalizing...', 'Done!']
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600))
      setGenProgress(steps[i])
    }
    await fetch(API + `/api/projects/${project.uuid}/generate`, { method: 'POST', headers })
    setGenerating(false)
    setGenDone(true)
  }

  const copyUUID = () => {
    navigator.clipboard?.writeText(project.uuid)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const imgFiles = files.filter(f => f.type === 'image')
  const vidFiles = files.filter(f => f.type === 'video')
  const musFiles = files.filter(f => f.type === 'audio')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1 style={{ marginTop: 6 }}>{project?.name}</h1>
          <div className="uuid-row">
            <span className="uuid-label">UUID:</span>
            <span className="uuid-val">{project?.uuid}</span>
            <button className="uuid-copy" onClick={copyUUID}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>
      </div>

      <div className="upload-grid">
        {[
          { label: 'Images', sub: 'JPG, PNG, GIF', type: 'image', ref: imgRef, files: imgFiles, color: '#1a3a1a', tc: '#4caf50' },
          { label: 'Video clips', sub: 'MP4, WebM, MOV', type: 'video', ref: vidRef, files: vidFiles, color: '#1a1a3a', tc: '#7c8cff' },
          { label: 'Music / Audio', sub: 'MP3, WAV, AAC', type: 'audio', ref: musRef, files: musFiles, color: '#3a1a1a', tc: '#ff7070' },
        ].map(({ label, sub, type, ref, files: fl, color, tc }) => (
          <div key={type} className="upload-box" onClick={() => !uploading && ref.current?.click()}>
            <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => handleFile(e, type)} />
            <div style={{ fontSize: 22, marginBottom: 6 }}>
              {type === 'image' ? '🖼' : type === 'video' ? '🎬' : '🎵'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#666' }}>{sub}</div>
            {fl.length > 0 && (
              <div style={{ marginTop: 8, background: color, color: tc, fontSize: 11, padding: '3px 10px', borderRadius: 4 }}>
                {fl.length} file{fl.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {uploading && (
        <div className="progress-section">
          <div style={{ fontSize: 13, marginBottom: 6 }}>Uploading... {uploadProgress}%</div>
          <div className="progress-wrap"><div className="progress-bar" style={{ width: uploadProgress + '%' }}></div></div>
        </div>
      )}

      {files.length > 0 && (
        <div className="timeline-box">
          <div className="timeline-title">Timeline ({files.length} files)</div>
          <div className="timeline-track">
            {files.map((f, i) => (
              <div key={i} className={`clip clip-${f.type}`}>
                <div className="clip-type">{f.type === 'image' ? 'IMG' : f.type === 'video' ? 'VID' : 'MUS'}</div>
                <div className="clip-name">{(f.original_name || f.filename || '').slice(0, 10)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="options-box">
        <div className="options-title">Options</div>
        <div className="options-row">
          <div>
            <div className="opt-label">Clip duration: {clipDuration}s</div>
            <input type="range" min="1" max="10" step="1" value={clipDuration}
              onChange={e => setClipDuration(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div>
            <div className="opt-label">Transition</div>
            <select value={transition} onChange={e => setTransition(e.target.value)}
              style={{ width: '100%', background: '#111', border: '0.5px solid #333', color: '#ccc', padding: '7px 10px', borderRadius: 7, fontSize: 13 }}>
              <option>fade</option><option>cut</option><option>slide</option><option>zoom</option>
            </select>
          </div>
        </div>
      </div>

      {generating && (
        <div className="progress-section">
          <div style={{ fontSize: 13, marginBottom: 6 }}>Generating reel... {genProgress}%</div>
          <div className="progress-wrap"><div className="progress-bar" style={{ width: genProgress + '%', background: '#ff4545' }}></div></div>
        </div>
      )}

      <div className="actions-row">
        <button className="btn-primary" onClick={generateReel} disabled={generating || files.length === 0}>
          {generating ? 'Generating...' : 'Generate Reel'}
        </button>
        {genDone && (
          <button className="btn-success">Download MP4</button>
        )}
      </div>
    </div>
  )
}
