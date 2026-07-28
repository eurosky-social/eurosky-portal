import type { default as AuthFlowStarted, Source } from '#events/auth_flow_started'
import plausibleService from '#services/plausible_service'

const names = {
  login: 'Login started',
  signup: 'Signup started',
} as const satisfies Record<Source, string>

export default class TrackAuthFlowStarted {
  async handle(event: AuthFlowStarted): Promise<undefined> {
    await plausibleService.track(names[event.source], {
      ip: event.ip,
      userAgent: event.userAgent,
    })
  }
}
