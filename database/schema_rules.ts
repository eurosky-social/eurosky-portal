import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    accounts: {
      columns: {
        welcome_dismissed: {
          decorator: '@column({ consume: (value) => !!value })',
          tsType: `boolean`,
        },
      },
    },
  },
} satisfies SchemaRules
