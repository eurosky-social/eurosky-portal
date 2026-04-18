import { defineConfig, store, drivers } from '@adonisjs/cache'

const cacheConfig = defineConfig({
  default: 'default',

  stores: {
    memoryOnly: store().useL1Layer(drivers.memory({ maxSize: '400mb' })),

    default: store()
      .useL1Layer(drivers.memory())
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
