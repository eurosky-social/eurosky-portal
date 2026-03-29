import { Data } from '@generated/data'
import { Avatar } from '~/lib/avatar'
import { Badge } from '~/lib/badge'
import { ClickableCard } from '~/lib/card'
import { Heading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { siAndroid, siIos, SimpleIcon } from 'simple-icons'
import { GlobeAltIcon } from '@heroicons/react/24/solid'

function SvgIcon({ icon, alt }: { icon: SimpleIcon; alt: string }) {
  return (
    <svg data-slot="icon" className="fill-current" viewBox="0 0 40 20" aria-hidden="true">
      {alt && <title>{alt}</title>}
      <path d={icon.path} />
    </svg>
  )
}

export function App({ app }: { app: Data.App }) {
  return (
    <li className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
      <ClickableCard
        href={app.url}
        target="_blank"
        className="w-full focus:outline-hidden p-4 flex flex-col space-between gap-4"
      >
        <div className="flex flex-row grow flex-1 gap-4">
          <Avatar
            square
            src={app.icon.path}
            className={`size-12 mb-2 bg-${app.icon.fallback.color}-400 text-white outline-none!`}
            initials={app.icon.fallback.initials}
          />
          <div className="flex flex-col">
            <Heading level={4} className="text-base!">
              {app.name}
            </Heading>
            <Text className="mb-2 dark:text-slate-400!">{app.summary}</Text>
          </div>
        </div>
        <div className="self-end w-full mt-3">
          <div className="flex flex-row space-between gap-2">
            <div className="flex grow">
              {app.madeInEU ? <Badge color="blue">Made in EU</Badge> : null}
            </div>

            <div className="flex flex-row self-center items-center align-middle text-gray-500">
              {app.platforms.includes('web') && (
                <div className="w-8 h-6 flex">
                  <GlobeAltIcon title="Web" />
                </div>
              )}
              {app.platforms.includes('android') && (
                <div className="w-10 h-8 flex">
                  <SvgIcon icon={siAndroid} alt="Android" />
                </div>
              )}
              {app.platforms.includes('ios') && (
                <div className="w-10 h-8 flex">
                  <SvgIcon icon={siIos} alt="iOS" />
                </div>
              )}
            </div>
          </div>
        </div>
      </ClickableCard>
    </li>
  )
}
