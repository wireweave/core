// Skeleton single-source + interview slots (scenario A5-SLOTS).

export type {
  SkeletonAxis,
  FieldValueKind,
  FieldSlot,
  SectionSlot,
  SkeletonDef,
  InterviewSlot,
} from './types.js'
export { SKELETONS, getSkeleton, OPEN_HEADING } from './definitions.js'
export { renderSkeletonMarkdown } from './render.js'
export type { RenderSkeletonParams } from './render.js'
export { getInterviewSlots, getOpenSlots } from './slots.js'
