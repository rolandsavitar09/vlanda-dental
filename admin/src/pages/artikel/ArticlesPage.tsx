import { useEffect, useState } from 'react'
import { deleteAdminArticle, getAdminArticles, saveAdminArticle } from '../../services/api'
import type { AdminArticle } from '../../types'

type ArticlesPageProps = {
  articles: AdminArticle[]
  setArticles: (articles: AdminArticle[]) => void
  token: string
}

const emptyArticle: AdminArticle = {
  id: '',
  title: '',
  category: 'Tips & Edukasi',
  excerpt: '',
  imageName: '',
  content: '',
  status: 'Draft',
  updatedAt: new Date().toISOString().slice(0, 10),
}

export function ArticlesPage({ articles, setArticles, token }: ArticlesPageProps) {
  const [selectedId, setSelectedId] = useState(articles[0]?.id ?? '')
  const selectedArticle = articles.find((article) => article.id === selectedId)
  const [draft, setDraft] = useState<AdminArticle>(selectedArticle ?? emptyArticle)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')

    getAdminArticles(token)
      .then((nextArticles) => {
        setArticles(nextArticles)
        setSelectedId((currentId) => currentId || nextArticles[0]?.id || '')
        setDraft(nextArticles[0] ?? emptyArticle)
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Artikel belum bisa dimuat.')
      })
      .finally(() => setIsLoading(false))
  }, [setArticles, token])

  function selectArticle(article: AdminArticle) {
    setSelectedId(article.id)
    setDraft(article)
    setImageFile(null)
    setMessage('')
    setError('')
  }

  function createArticle() {
    setSelectedId('')
    setDraft({ ...emptyArticle, updatedAt: new Date().toISOString().slice(0, 10) })
    setImageFile(null)
    setMessage('')
    setError('')
  }

  async function saveArticle(status = draft.status) {
    if (!draft.title.trim() || !draft.excerpt.trim() || !draft.content.trim()) {
      setError('Judul, ringkasan, dan isi artikel wajib diisi.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const savedArticle = await saveAdminArticle(token, { ...draft, status }, imageFile)
      const exists = articles.some((article) => article.id === savedArticle.id)
      const nextArticles = exists
        ? articles.map((article) => (article.id === savedArticle.id ? savedArticle : article))
        : [savedArticle, ...articles]

      setArticles(nextArticles)
      setSelectedId(savedArticle.id)
      setDraft(savedArticle)
      setImageFile(null)
      setMessage(status === 'Published' ? 'Artikel berhasil dipublish.' : 'Artikel berhasil disimpan sebagai draft.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Artikel gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteArticle(id: string) {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await deleteAdminArticle(token, id)
      const nextArticles = articles.filter((article) => article.id !== id)
      setArticles(nextArticles)
      setSelectedId(nextArticles[0]?.id ?? '')
      setDraft(nextArticles[0] ?? emptyArticle)
      setImageFile(null)
      setMessage('Artikel berhasil dihapus.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Artikel gagal dihapus.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="content-management-page">
      <article className="admin-panel content-list-panel">
        <div className="panel-heading">
          <div>
            <h2>Daftar Artikel</h2>
          </div>
          <button type="button" onClick={createArticle}>Tambah</button>
        </div>

        <div className="content-list">
          {isLoading ? <p className="admin-empty-state">Memuat artikel dari database...</p> : null}
          {!isLoading && articles.length === 0 ? (
            <p className="admin-empty-state">Belum ada artikel. Tambahkan artikel pertama.</p>
          ) : null}
          {articles.map((article) => (
            <button
              className={article.id === selectedId ? 'content-item active' : 'content-item'}
              key={article.id}
              type="button"
              onClick={() => selectArticle(article)}
            >
              <strong>{article.title}</strong>
              <span>{article.category}</span>
              <small>{article.updatedAt}</small>
              <em>{article.status}</em>
            </button>
          ))}
        </div>
      </article>

      <article className="admin-panel editor-panel">
        <div className="panel-heading compact">
          <div>
            <h2>{selectedId ? 'Edit Artikel' : 'Tambah Artikel'}</h2>
          </div>
        </div>

        <div className="editor-form">
          {message ? <p className="admin-success-state full-field">{message}</p> : null}
          {error ? <p className="admin-inline-error full-field">{error}</p> : null}
          <label>
            Judul Artikel
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label>
            Kategori
            <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
          </label>
          <label>
            Upload Gambar
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null
                setImageFile(nextFile)
                setDraft({ ...draft, imageName: nextFile?.name ?? draft.imageName })
              }}
            />
          </label>
          <label>
            Nama Gambar
            <input value={draft.imageName} onChange={(event) => setDraft({ ...draft, imageName: event.target.value })} />
          </label>
          <label className="full-field">
            Ringkasan
            <textarea value={draft.excerpt} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} />
          </label>
          <label className="full-field">
            Isi Artikel
            <textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} />
          </label>
        </div>

        <div className="editor-actions">
          <button type="button" disabled={isSaving} onClick={() => saveArticle('Draft')}>
            Draft
          </button>
          <button className="confirm" type="button" disabled={isSaving} onClick={() => saveArticle('Published')}>
            Publish
          </button>
          <button className="confirm" type="button" disabled={isSaving} onClick={() => saveArticle()}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
          {selectedId ? (
            <button className="cancel" type="button" disabled={isSaving} onClick={() => deleteArticle(selectedId)}>Hapus</button>
          ) : null}
        </div>
      </article>
    </section>
  )
}