import { featuredJobDepthPrompts } from "./featured-job-prompt-depth";
import { platformExpansionPrompts } from "./platform-expansion-prompt-data";

// The Prompt Workbench already consumes platformExpansionPrompts. Extend that shared
// array once at module evaluation so featured GGW jobs meet the depth standard
// without duplicating prompt-rendering logic.
platformExpansionPrompts.push(...featuredJobDepthPrompts);
