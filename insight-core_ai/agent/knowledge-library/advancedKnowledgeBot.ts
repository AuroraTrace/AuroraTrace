import { ADVANCED_ASSISTANT_CAPABILITIES } from "./capabilities"
import { ADVANCED_ASSISTANT_DESCRIPTION } from "./description"
import { ADVANCED_ASSISTANT_ID } from "./name"
import { ADVANCED_TOOLKIT } from "./tools"

import type { AssistantProfile } from "@/ai/agent"

/**
 * Advanced Knowledge Bot Profile
 * Designed for multi-domain reasoning with deep access to toolchains and system knowledge.
 */
export const advancedKnowledgeBot: AssistantProfile = {
  id: ADVANCED_ASSISTANT_ID,
  label: "advanced-knowledge",
  promptBase: ADVANCED_ASSISTANT_DESCRIPTION,
  features: ADVANCED_ASSISTANT_CAPABILITIES,
  extensions: ADVANCED_TOOLKIT
}
