import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:contact@aliyah.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { subscription, title, body, url } = req.body
  if (!subscription) return res.status(400).json({ error: 'subscription manquante' })

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url || '/planning', tag: 'aliyah-planning' })
    )
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Push error:', err)
    res.status(500).json({ error: err.message })
  }
}
