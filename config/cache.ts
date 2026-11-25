import { defineConfig, store, drivers } from '@adonisjs/cache'
import env from '#start/env'

const cacheConfig = defineConfig({
  default: env.get('CACHE_STORE', 'default'),

  stores: {
    memoryOnly: store().useL1Layer(drivers.memory({ maxSize: '400mb' })),

    default: store()
      .useL1Layer(drivers.memory({ maxSize: '400mb' }))
      .useL2Layer(
        drivers.database({
          connectionName: 'sqlite',
          autoCreateTable: false,
          tableName: 'cache',
        })
      ),
  },
})

export default cacheConfig

declare module '@adonisjs/cache/types' {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
