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

  const imgRef = useRef()
  const vidRef = useRef()
  const musRef = useRef()

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetch(API + '/api/projects', { headers })
      .then(r => r.json())
      .then(data => {
        const p = Array.isArray(data) ? data.find(x => x.uuid === project.uuid) : null
        if (p) setFiles(p.files || [])
      })
  }, [])

  // ✅ FINAL DOWNLOAD FIX (TOKEN INCLUDED)
  const handleDownload = async () => {
    try {
      const res = await fetch(`${API}/api/projects/${project.uuid}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error("Download failed")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'reel.mp4'
      document.body.appendChild(a)
      a.click()
      a.remove()

    } catch (err) {
      console.error(err)
      alert("Download failed")
    }
  }

  const uploadFile = async (file, type) => {
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
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

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600))
      setGenProgress(steps[i])
    }

    await fetch(API + `/api/projects/${project.uuid}/generate`, {
      method: 'POST',
      headers
    })

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
        <button onClick={onBack}>← Back</button>
        <h1>{project?.name}</h1>

        <div>
          UUID: {project?.uuid}
          <button onClick={copyUUID}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="upload-grid">
        {[
          { label: 'Images', type: 'image', ref: imgRef, files: imgFiles },
          { label: 'Video', type: 'video', ref: vidRef, files: vidFiles },
          { label: 'Audio', type: 'audio', ref: musRef, files: musFiles }
        ].map(({ label, type, ref, files: fl }) => (
          <div key={type} onClick={() => !uploading && ref.current?.click()}>
            <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => handleFile(e, type)} />
            <div>{label}</div>
            {fl.length > 0 && <div>{fl.length} file(s)</div>}
          </div>
        ))}
      </div>

      {uploading && <div>Uploading... {uploadProgress}%</div>}

      {generating && <div>Generating... {genProgress}%</div>}

      <div>

        <button onClick={generateReel} disabled={generating || files.length === 0}>
          {generating ? 'Generating...' : 'Generate Reel'}
        </button>

        {genDone && (
          <button onClick={handleDownload}>
            Download MP4
          </button>
        )}

      </div>

    </div>
  )
}