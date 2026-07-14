import type { Images } from '#utils/embed'
import { BlobImage } from '~/components/BlobImage'

export function EmbedImages({ embed }: { embed: Images }) {
  if (embed.images.length > 4) {
    return (
      <div className="-mx-6 px-6 flex gap-2 overflow-x-auto sm:-mx-8 sm:px-8">
        {embed.images.map((image, key) => (
          <BlobImage
            alt={image.alt}
            blob={image.blob}
            className="aspect-square w-[45%] shrink-0 rounded-lg object-cover sm:w-[30%]"
            key={key}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {embed.images.map((image, key) => (
        <BlobImage
          alt={image.alt}
          blob={image.blob}
          className="aspect-square w-full rounded-lg object-cover"
          key={key}
        />
      ))}
    </div>
  )
}
