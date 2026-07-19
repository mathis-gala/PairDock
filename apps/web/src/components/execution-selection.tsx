import type { DeveloperSetupAgentModel } from '@pairdock/shared-contracts';
import { type ChangeEvent, useId, useState } from 'react';
import { Button } from './button.js';
import { SelectInput } from './select-input.js';

export interface ExecutionSelection {
  modelId: string;
  reasoningEffort: string;
}

interface ExecutionSelectionProps {
  defaultModelId: string;
  defaultReasoningEffort: string;
  disabled?: boolean;
  models?: DeveloperSetupAgentModel[];
  onStart: (selection: ExecutionSelection) => Promise<void> | void;
  pending: boolean;
  startLabel: string;
}

export function ExecutionSelectionControls({
  defaultModelId,
  defaultReasoningEffort,
  disabled = false,
  models = [],
  onStart,
  pending,
  startLabel,
}: ExecutionSelectionProps) {
  const controlId = useId();
  const modelControlId = `${controlId}-model`;
  const reasoningControlId = `${controlId}-reasoning`;
  const availableModels =
    models.length > 0
      ? models
      : [
          {
            id: defaultModelId,
            label: defaultModelId,
            provider: 'agent',
            reasoningEfforts: [{ id: 'medium', label: 'Medium' }],
            defaultReasoningEffort: 'medium',
          },
        ];
  const defaultModel = availableModels.find((model) => model.id === defaultModelId) ?? availableModels[0];
  const [selectedModelId, setSelectedModelId] = useState(defaultModel?.id ?? '');
  const currentModel = availableModels.find((model) => model.id === selectedModelId) ?? defaultModel;
  const reasoningEfforts = currentModel?.reasoningEfforts?.length
    ? currentModel.reasoningEfforts
    : [{ id: 'medium', label: 'Medium' }];
  const modelDefaultEffort =
    currentModel?.id === defaultModelId && reasoningEfforts.some((effort) => effort.id === defaultReasoningEffort)
      ? defaultReasoningEffort
      : (currentModel?.defaultReasoningEffort ?? reasoningEfforts[0]?.id ?? 'medium');
  const [selectedReasoningEffort, setSelectedReasoningEffort] = useState(modelDefaultEffort);
  const reasoningEffort = reasoningEfforts.some((effort) => effort.id === selectedReasoningEffort)
    ? selectedReasoningEffort
    : modelDefaultEffort;
  const startDisabled = disabled || pending || !currentModel || !reasoningEffort;

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    const modelId = event.target.value;
    const model = availableModels.find((candidate) => candidate.id === modelId);
    setSelectedModelId(modelId);
    setSelectedReasoningEffort(model?.defaultReasoningEffort ?? model?.reasoningEfforts?.[0]?.id ?? 'medium');
  }

  function handleReasoningChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedReasoningEffort(event.target.value);
  }

  async function handleStart() {
    if (startDisabled || !currentModel) {
      return;
    }

    await onStart({ modelId: currentModel.id, reasoningEffort });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1.5 text-xs text-slate-400" htmlFor={modelControlId}>
        <span className="block">Modèle</span>
        <SelectInput
          disabled={disabled || pending}
          id={modelControlId}
          onChange={handleModelChange}
          value={currentModel?.id ?? ''}
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </SelectInput>
      </label>
      <label className="space-y-1.5 text-xs text-slate-400" htmlFor={reasoningControlId}>
        <span className="block">Raisonnement</span>
        <SelectInput
          disabled={disabled || pending}
          id={reasoningControlId}
          onChange={handleReasoningChange}
          value={reasoningEffort}
        >
          {reasoningEfforts.map((effort) => (
            <option key={effort.id} value={effort.id}>
              {effort.label}
            </option>
          ))}
        </SelectInput>
      </label>
      <div className="sm:col-span-2">
        <Button disabled={startDisabled} onClick={handleStart}>
          {pending ? 'Enregistrement…' : startLabel}
        </Button>
      </div>
    </div>
  );
}
