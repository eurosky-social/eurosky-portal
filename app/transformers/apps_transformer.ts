import { BaseTransformer } from '@adonisjs/core/transformers'
import type { App } from '#services/atstore_service'
import AppSummaryTransformer from '#transformers/app_summary_transformer'

export default class AppsTransformer extends BaseTransformer<{
  apps: ReadonlyArray<App>
}> {
  toObject() {
    const byCategory = new Map<string, App[]>()
    const recommended: App[] = []

    for (const app of this.resource.apps) {
      const apps = byCategory.get(app.category) ?? []
      apps.push(app)
      byCategory.set(app.category, apps)
      if (app.recommended) recommended.push(app)
    }

    const categories = [...byCategory.entries()]
      .map(([category, apps]) => ({ apps, category }))
      .sort((a, b) => a.category.localeCompare(b.category))
    const sections =
      recommended.length > 0
        ? [{ apps: recommended, category: 'recommended' }, ...categories]
        : categories

    return {
      sections: sections.map(({ category, apps }) => ({
        apps: [...apps]
          .sort((a, b) => a.listing.name.localeCompare(b.listing.name))
          .map((app) => new AppSummaryTransformer(app).toObject()),
        category,
      })),
    }
  }
}
