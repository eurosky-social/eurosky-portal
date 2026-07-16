import type { ActivityRow } from '#services/activity_service'
import { ActivityItem } from '~/components/ActivityItem'

export function ActivityList({ activities }: { activities: Array<ActivityRow> }) {
  return (
    <ul className="flex flex-col gap-3">
      {activities.map((activity) => (
        <ActivityItem activity={activity} key={activity.uri} />
      ))}
    </ul>
  )
}
