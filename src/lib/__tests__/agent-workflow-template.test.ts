/** Guards the review-gated docs-agent receiver inherited by every new site. */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(
  join(process.cwd(), '.github', 'workflows', 'thally-agent.yml'),
  'utf8',
)

describe('canonical docs-agent workflow', () => {
  it('ships the v4 readiness repair contract', () => {
    expect(workflow).toContain('# Contract: thally-track/v4')
    expect(workflow).toContain('types: [thally-document, thally-readiness]')
    expect(workflow).toContain('id-token: write')
  })

  it('uses a signed grant and GitHub OIDC without exposing an App token', () => {
    expect(workflow).toContain('github.event.client_payload.thally_pr_grant')
    expect(workflow).toContain('audience=thally-readiness-pr')
    expect(workflow).toContain('/api/github/readiness-pr')
    expect(workflow).not.toContain('thally_github_token')
  })
})
