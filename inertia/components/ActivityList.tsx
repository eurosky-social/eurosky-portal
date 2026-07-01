import type { Activity } from '#services/activity_service'
import { ActivityItem } from '~/components/ActivityItem'

export function ActivityList({ activities }: { activities: Array<Activity> }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {activities.map((activity) => (
        <ActivityItem activity={activity} key={activity.uri} />
      ))}
    </ul>
  )
}
