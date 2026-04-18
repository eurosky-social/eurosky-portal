import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  columns: {
    did: {
      imports: [
        {
          source: '@atproto/lex',
          typeImports: ['l'],
        },
      ],
      tsType: `l.DidString`,
    },
    handle: {
      imports: [
        {
          source: '@atproto/lex',
          typeImports: ['l'],
        },
      ],
      tsType: `l.HandleString`,
    },
  },
  tables: {
    accounts: {
      columns: {
        did: {
          decorator: `@column({ isPrimary: true })`,
          imports: [
            {
              source: '@atproto/lex',
              typeImports: ['l'],
            },
          ],
          tsType: `l.DidString`,
        },
        welcome_dismissed: {
          decorator: '@column({ consume: (value) => !!value })',
          tsType: `boolean`,
        },
      },
    },
  },
} satisfies SchemaRules
