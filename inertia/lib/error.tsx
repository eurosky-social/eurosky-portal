import clsx from 'clsx'
import { Text } from './text'

export function Error({ className, children, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <Text className={clsx('text-orange-500!', className)} {...props}>
      {children}
    </Text>
  )
}
