import { SWAP_ASSISTANT_SKILLS } from "./capabilities"
import { SWAP_ASSISTANT_GUIDE } from "./description"
import { SWAP_AGENT_ID } from "./name"
import { SWAP_TOOLKIT } from "./tools"

import type { AssistantProfile } from "@/ai/agent"

export const swapExecutor: AssistantProfile = {
  id: SWAP_AGENT_ID,
  label: "swap-executor",
  extensions: SWAP_TOOLKIT,
  promptBase: SWAP_ASSISTANT_GUIDE,
  features: SWAP_ASSISTANT_SKILLS
}