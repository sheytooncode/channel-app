import { createClient }  from '../../lib/supabase/server'
import { redirect }       from 'next/navigation'
import { getWeekStart }   from '../../lib/supabase/utils'
import Dashboard          from '../../components/Dashboard'

export default async function DashboardPage() {
  const supabase  = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStart()

  // Fetch goals and this week's tasks in parallel
  const [{ data: goals }, { data: tasks }] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', user.id).order('position'),
    supabase.from('tasks').select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .order('day_index').order('created_at'),
  ])

  return (
    <Dashboard
      user={{ id: user.id, email: user.email }}
      initialGoals={goals  || []}
      initialTasks={tasks  || []}
      weekStart={weekStart}
    />
  )
}
