import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { renameMovedMigrations } from '#providers/automigrate_provider'

test.group('providers / automigrate / renameMovedMigrations', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should rename migrations from `database/migrations/`', async function ({ assert }) {
    await db.table('adonis_schema').insert({ batch: 1, name: 'database/migrations/1_a' })
    await renameMovedMigrations()
    const result = await db.from('adonis_schema').where('name', 'like', '%1_a').select('name')

    assert.deepEqual(result, [{ name: 'app/database/migrations/1_a' }])
  })

  test('should not change other migrations', async function ({ assert }) {
    const before = await db.from('adonis_schema').orderBy('id').select('name')
    await renameMovedMigrations()
    const result = await db.from('adonis_schema').orderBy('id').select('name')

    assert.deepEqual(result, before)
  })
})
