import { ProfileField } from '../../components/common/ProfileField'
import { SectionHeading } from '../../components/common/SectionHeading'
import type { UserProfile } from '../../types'
import { formatDate } from '../../utils/format'

type ProfilSayaProps = {
  isEditing: boolean
  profile: UserProfile
  profileDraft: UserProfile
  saveProfile: () => void
  setIsEditing: (isEditing: boolean) => void
  setProfileDraft: (profile: UserProfile) => void
}

export function ProfilSaya({
  isEditing,
  profile,
  profileDraft,
  saveProfile,
  setIsEditing,
  setProfileDraft,
}: ProfilSayaProps) {
  return (
    <section className="content-section account-page">
      <SectionHeading title="Profil Saya" description="Data dasar customer untuk reservasi." />
      <div className="profile-card">
        {isEditing ? (
          <div className="form-grid">
            <label>
              Nama Lengkap
              <input
                value={profileDraft.name}
                onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileDraft.email}
                onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })}
              />
            </label>
            <label>
              Nomor Telepon
              <input
                value={profileDraft.phone}
                onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })}
              />
            </label>
            <label>
              Tanggal Lahir
              <input
                type="date"
                value={profileDraft.birthDate}
                onChange={(event) => setProfileDraft({ ...profileDraft, birthDate: event.target.value })}
              />
            </label>
            <div className="full-field profile-actions">
              <button className="primary-button" type="button" onClick={saveProfile}>
                Simpan Profil
              </button>
              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setProfileDraft(profile)
                  setIsEditing(false)
                }}
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <>
            <ProfileField label="Nama Lengkap" value={profile.name} />
            <ProfileField label="Email" value={profile.email} />
            <ProfileField label="Nomor Telepon" value={profile.phone} />
            <ProfileField label="Tanggal Lahir" value={profile.birthDate ? formatDate(profile.birthDate) : '-'} />
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setProfileDraft(profile)
                setIsEditing(true)
              }}
            >
              Edit Profil
            </button>
          </>
        )}
      </div>
    </section>
  )
}
