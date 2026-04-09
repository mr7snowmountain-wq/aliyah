/**
 * Cron Vercel — s'exécute toutes les 15 min
 * Vérifie les tâches à venir et envoie des rappels
 * Configurer dans vercel.json : "crons": [{"path": "/api/cron-reminders", "schedule": "*/15 * * * *"}]
 */
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:contact@aliyah.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // clé service (pas anon) pour bypasser RLS
)

export default async function handler(req, res) {
  // Sécurité : Vercel envoie ce header pour les crons
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end()
  }

  const now    = new Date()
  const today  = now.toISOString().split('T')[0]
  const hhmm   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  // Fenêtre : tâches dans les 15 prochaines minutes
  const inMin  = new Date(now.getTime() + 15 * 60000)
  const hhmmIn = `${String(inMin.getHours()).padStart(2,'0')}:${String(inMin.getMinutes()).padStart(2,'0')}`

  // Récupérer tous les plannings du jour
  const { data: plannings } = await supabase
    .from('plannings')
    .select('user_id, tasks')
    .eq('date', today)

  if (!plannings?.length) return res.status(200).json({ sent: 0 })

  let sent = 0

  for (const planning of plannings) {
    // Trouver les tâches dans la fenêtre
    const upcoming = planning.tasks.filter(t =>
      !t.done && t.heure >= hhmm && t.heure <= hhmmIn
    )
    if (!upcoming.length) continue

    // Récupérer la subscription de l'utilisateur
    const { data: subRow } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', planning.user_id)
      .single()

    if (!subRow?.subscription) continue

    // Envoyer une notif par tâche
    for (const task of upcoming) {
      try {
        await webpush.sendNotification(
          subRow.subscription,
          JSON.stringify({
            title  : `${task.emoji} Dans 15 min`,
            body   : task.tache,
            url    : '/planning',
            tag    : `task-${task.heure}`,
          })
        )
        sent++
      } catch (err) {
        console.error('Push failed:', err.statusCode, planning.user_id)
      }
    }
  }

  res.status(200).json({ sent })
}
