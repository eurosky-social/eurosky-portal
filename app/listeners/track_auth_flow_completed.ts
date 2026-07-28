import type { default as AuthFlowCompleted, Outcome, Source } from '#events/auth_flow_completed'
import plausibleService from '#services/plausible_service'

const names = {
  login: {
    denied: 'Login cancelled',
    error: 'Login failed',
    success: 'Login succeeded',
  },
  signup: {
    denied: 'Signup cancelled',
    error: 'Signup failed',
    success: 'Signup succeeded',
  },
} as const satisfies Record<Source, Record<Outcome, string>>

export default class TrackAuthFlowCompleted {
  async handle(event: AuthFlowCompleted): Promise<undefined> {
    await plausibleService.track(names[event.source][event.outcome], {
      ip: event.ip,
      userAgent: event.userAgent,
    })
  }
}
