/**
 * This file matches the size of blobs (in skeets) on `pdsls.dev`,
 * which uses IEC.
 */
const base = 1024

/**
 * IEC binary unit labels mapped to `Intl.NumberFormat` unit names;
 */
const units: Array<{ label: string; unit: string }> = [
  { label: 'B', unit: 'byte' },
  { label: 'KiB', unit: 'kilobyte' },
  { label: 'MiB', unit: 'megabyte' },
  { label: 'GiB', unit: 'gigabyte' },
  { label: 'TiB', unit: 'terabyte' },
  { label: 'PiB', unit: 'petabyte' },
  { label: 'EiB', unit: 'exabyte' },
]

/**
 * Display byte size to humans.
 *
 * @param size
 *   Size in bytes.
 * @returns
 *   Size for humans (example: `297.3 KiB`).
 */
export function displayByteSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) {
    return 'Unknown'
  }

  let value = size
  let index = 0

  while (value >= base && index < units.length - 1) {
    value /= base
    index++
  }

  const { unit, label } = units[index]
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: index ? 1 : 0,
    minimumFractionDigits: 0,
    style: 'unit',
    unitDisplay: 'short',
    unit,
  })
    .formatToParts(value)
    .map(function (part) {
      return part.type === 'unit' ? label : part.value
    })
    .join('')
}
