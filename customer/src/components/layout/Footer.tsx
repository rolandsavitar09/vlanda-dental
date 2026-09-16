import { useState } from 'react'
import instagramLogo from '../../assets/Logo instagram.svg'
import whatsappLogo from '../../assets/Logo Whatsapp.svg'
import footerLogo from '../../assets/logo vlanda dental 2.svg'
import { navItems } from '../../data/navigation'
import type { ServiceCategory, View } from '../../types'
import { Icon } from '../common/Icon'

type FooterProps = {
  navigate: (view: View) => void
  serviceCategories: ServiceCategory[]
  startReservation: (serviceId?: string) => void
}

export function Footer({ navigate, serviceCategories, startReservation }: FooterProps) {
  const [openFooterSection, setOpenFooterSection] = useState<'menu' | 'services' | null>(null)
  const whatsappUrl = 'https://wa.me/6281335455194'
  const instagramUrl = 'https://www.instagram.com/vlanda.dental'

  function toggleFooterSection(section: 'menu' | 'services') {
    setOpenFooterSection((current) => (current === section ? null : section))
  }

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="footer-logo-box">
            <img className="footer-logo" src={footerLogo} alt="Vlanda Dental" />
          </span>
          <p>Klinik gigi terpercaya dengan layanan profesional, modern, dan nyaman untuk semua usia.</p>
          <div className="footer-socials" aria-label="Media sosial Vlanda Dental">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp Vlanda Dental">
              <img src={whatsappLogo} alt="" />
            </a>
            <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram Vlanda Dental">
              <img src={instagramLogo} alt="" />
            </a>
          </div>
        </div>
        <div className={openFooterSection === 'menu' ? 'footer-links footer-menu is-open' : 'footer-links footer-menu'}>
          <h3>
            <button
              className="footer-section-toggle"
              type="button"
              aria-expanded={openFooterSection === 'menu'}
              onClick={() => toggleFooterSection('menu')}
            >
              Menu
            </button>
          </h3>
          {navItems.map((item) => (
            <button key={item.view} type="button" onClick={() => navigate(item.view)}>
              {item.label}
            </button>
          ))}
        </div>
        <div
          className={
            openFooterSection === 'services' ? 'footer-links footer-services is-open' : 'footer-links footer-services'
          }
        >
          <h3>
            <button
              className="footer-section-toggle"
              type="button"
              aria-expanded={openFooterSection === 'services'}
              onClick={() => toggleFooterSection('services')}
            >
              Layanan
            </button>
          </h3>
          {serviceCategories.slice(0, 5).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => startReservation(category.services[0]?.id)}
            >
              {category.title}
            </button>
          ))}
        </div>
        <div className="footer-contact">
          <h3>Kontak Kami</h3>
          <div className="footer-contact-item">
            <Icon name="location" />
            <span>Jl. ayam alas RT 3/ RW 1, Mantup tengah, Kec. Mantup, Kab. Lamongan</span>
          </div>
          <div className="footer-contact-item">
            <Icon name="phone" />
            <a href={whatsappUrl} target="_blank" rel="noreferrer">081335455194</a>
          </div>
          <div className="footer-contact-item footer-hours">
            <Icon name="clock" />
            <div>
              <strong>Senin - Jumat</strong>
              <span>15.30 WIB - 20.30 WIB</span>
              <strong>Sabtu - Minggu</strong>
              <span>07.30 WIB - 12.00 WIB</span>
              <span>15.30 WIB - 20.30 WIB</span>
            </div>
          </div>
        </div>
      </div>
      <p className="copyright">&copy; 2026 Vlanda Dental. All rights reserved.</p>
    </footer>
  )
}
