import { useEffect, useState } from 'react'
import {
  createAdminServiceCategory,
  deleteAdminService,
  getAdminServiceCatalog,
  saveAdminService,
} from '../../services/api'
import type { AdminService, AdminServiceCategory } from '../../types'

type ServicesPageProps = {
  services: AdminService[]
  setServices: (services: AdminService[]) => void
  token: string
}

const emptyService: AdminService = {
  id: '',
  title: '',
  categoryId: '',
  category: '',
  description: '',
  duration: '',
  price: '',
  isActive: true,
}

const iconOptions = [
  { label: 'Pemeriksaan', value: 'consultation' },
  { label: 'Orthodonti', value: 'orthodonti' },
  { label: 'Gigi Tiruan', value: 'denture' },
  { label: 'Gigi Dewasa', value: 'adult-tooth' },
  { label: 'Gigi Anak', value: 'child-tooth' },
  { label: 'Gigi Umum', value: 'tooth' },
]

export function ServicesPage({ services, setServices, token }: ServicesPageProps) {
  const [categories, setCategories] = useState<AdminServiceCategory[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState<AdminService>(emptyService)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryIconKey, setCategoryIconKey] = useState('tooth')
  const [categoryIconFile, setCategoryIconFile] = useState<File | null>(null)

  useEffect(() => {
    getAdminServiceCatalog(token)
      .then((catalog) => {
        setCategories(catalog.categories)
        setServices(catalog.services)
        setSelectedId(catalog.services[0]?.id ?? '')
        setDraft(catalog.services[0] ?? createBlankService(catalog.categories))
      })
      .catch(() => setError('Data layanan belum bisa dimuat. Pastikan backend aktif.'))
      .finally(() => setIsLoading(false))
  }, [setServices, token])

  function createBlankService(nextCategories = categories) {
    const firstCategory = nextCategories[0]

    return {
      ...emptyService,
      categoryId: firstCategory?.id ?? '',
      category: firstCategory?.name ?? '',
    }
  }

  function selectService(service: AdminService) {
    setSelectedId(service.id)
    setDraft(service)
    setMessage('')
    setError('')
  }

  function createService() {
    setSelectedId('')
    setDraft(createBlankService())
    setMessage('')
    setError('')
  }

  function updateDraftCategory(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId)
    setDraft({
      ...draft,
      category: category?.name ?? '',
      categoryId,
    })
  }

  async function saveService() {
    if (!draft.title.trim() || !draft.categoryId || !draft.description.trim() || !draft.duration.trim()) {
      setError('Nama layanan, kategori, deskripsi, dan estimasi durasi wajib diisi.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const savedService = await saveAdminService(token, {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        duration: draft.duration.trim(),
        price: draft.price.trim(),
      })
      const exists = services.some((service) => service.id === savedService.id)
      const nextServices = exists
        ? services.map((service) => (service.id === savedService.id ? savedService : service))
        : [savedService, ...services]

      setServices(nextServices)
      setDraft(savedService)
      setSelectedId(savedService.id)
      setMessage('Layanan berhasil disimpan.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Layanan gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeService(id: string) {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await deleteAdminService(token, id)
      const nextServices = services.filter((service) => service.id !== id)
      setServices(nextServices)
      setSelectedId(nextServices[0]?.id ?? '')
      setDraft(nextServices[0] ?? createBlankService())
      setMessage('Layanan berhasil dihapus.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Layanan gagal dihapus.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveCategory() {
    if (!categoryName.trim()) {
      setError('Nama kategori wajib diisi.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const category = await createAdminServiceCategory(
        token,
        { iconKey: categoryIconKey, name: categoryName.trim() },
        categoryIconFile,
      )
      const nextCategories = [...categories, category].sort((first, second) => first.sortOrder - second.sortOrder)
      setCategories(nextCategories)
      setDraft({
        ...draft,
        category: category.name,
        categoryId: category.id,
      })
      setCategoryName('')
      setCategoryIconKey('tooth')
      setCategoryIconFile(null)
      setShowCategoryForm(false)
      setMessage('Kategori berhasil ditambahkan.')
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : 'Kategori gagal ditambahkan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="content-management-page">
      <article className="admin-panel content-list-panel">
        <div className="panel-heading">
          <div>
            <h2>Daftar Layanan</h2>
          </div>
          <button type="button" onClick={createService}>Tambah</button>
        </div>

        {isLoading ? <p className="admin-empty-state">Memuat layanan...</p> : null}
        {!isLoading && services.length === 0 ? <p className="admin-empty-state">Belum ada layanan.</p> : null}

        <div className="content-list">
          {services.map((service) => (
            <button
              className={service.id === selectedId ? 'content-item active' : 'content-item'}
              key={service.id}
              type="button"
              onClick={() => selectService(service)}
            >
              <strong>{service.title}</strong>
              <span>{service.category}</span>
              <small>Estimasi {service.duration}</small>
              <em>{service.isActive ? 'Aktif' : 'Nonaktif'}</em>
            </button>
          ))}
        </div>
      </article>

      <article className="admin-panel editor-panel">
        <div className="panel-heading compact">
          <div>
            <h2>{selectedId ? 'Edit Layanan' : 'Tambah Layanan'}</h2>
          </div>
          <button type="button" onClick={() => setShowCategoryForm((current) => !current)}>
            Tambah Kategori
          </button>
        </div>

        {message ? <p className="admin-success-state">{message}</p> : null}
        {error ? <p className="admin-inline-error">{error}</p> : null}

        {showCategoryForm ? (
          <div className="category-create-panel">
            <label>
              Nama Kategori
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            </label>
            <label>
              Vector Bawaan
              <select value={categoryIconKey} onChange={(event) => setCategoryIconKey(event.target.value)}>
                {iconOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="full-field">
              Upload Vector
              <input
                accept=".svg,image/svg+xml,image/*"
                type="file"
                onChange={(event) => setCategoryIconFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button type="button" disabled={isSaving} onClick={saveCategory}>
              Simpan Kategori
            </button>
          </div>
        ) : null}

        <div className="editor-form">
          <label>
            Nama Layanan
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label>
            Kategori
            <select value={draft.categoryId} onChange={(event) => updateDraftCategory(event.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            Estimasi Durasi
            <input value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} />
          </label>
          <label>
            Harga / Keterangan
            <input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
          </label>
          <label className="full-field">
            Deskripsi
            <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </label>
        </div>

        <div className="editor-actions">
          <button type="button" disabled={isSaving} onClick={() => setDraft({ ...draft, isActive: false })}>Nonaktifkan</button>
          <button className="confirm" type="button" disabled={isSaving} onClick={() => setDraft({ ...draft, isActive: true })}>Aktifkan</button>
          <button className="confirm" type="button" disabled={isSaving} onClick={saveService}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
          {selectedId ? (
            <button className="cancel" type="button" disabled={isSaving} onClick={() => removeService(selectedId)}>Hapus</button>
          ) : null}
        </div>
      </article>
    </section>
  )
}
