import 'dotenv/config'

export const env = {
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@vlandadental.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  adminWhatsappNumber: process.env.WHATSAPP_ADMIN_NUMBER ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  port: Number(process.env.PORT ?? 4000),
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN ?? '',
  whatsappApiUrl: process.env.WHATSAPP_API_URL ?? '',
}
