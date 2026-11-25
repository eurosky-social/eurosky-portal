/**
 * Real PDS (and PLC directory) for tests, with its data in a temporary folder;
 * started by `startPds` in `tests/pds.ts`, in its own process, as it brings
 * other versions of native dependencies (such as `sharp`).
 *
 * Prints its URL when ready,
 * stops on `SIGTERM`.
 */

import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { TestNetworkNoAppView } from '@atproto/dev-env'

const directory = await mkdtemp(path.join(tmpdir(), 'eurosky-test-pds-'))
const blobstoreDiskLocation = path.join(directory, 'blobs')
const dataDirectory = path.join(directory, 'data')
await mkdir(blobstoreDiskLocation)
await mkdir(dataDirectory)

const network = await TestNetworkNoAppView.create({ pds: { blobstoreDiskLocation, dataDirectory } })

process.once('SIGTERM', async function () {
  await network.close()
  await rm(directory, { force: true, recursive: true })
  process.exit()
})

process.stdout.write(network.pds.url + '\n')
