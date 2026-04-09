// Sauvegarde une subscription push (appelé depuis le frontend)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  // La sauvegarde est gérée côté client via Supabase directement
  res.status(200).json({ ok: true })
}
