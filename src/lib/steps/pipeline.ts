import { StateMachine } from "../state-machine/state-machine";
import type { LLMProvider } from "../llm/provider";
import { ParseStep } from "./parse-step";
import { CategorizeStep } from "./categorize-step";
import { PrioritizeStep } from "./prioritize-step";
import { ActionPlanStep } from "./action-plan-step";

/**
 * Declarative pipeline composition.
 * Creates a StateMachine with all four steps wired up.
 */
export function createTaskPipeline(llm: LLMProvider): StateMachine {
  return new StateMachine()
    .addStep(new ParseStep(llm))
    .addStep(new CategorizeStep(llm))
    .addStep(new PrioritizeStep(llm))
    .addStep(new ActionPlanStep(llm));
}
