import type { ChangeEvent, FormEvent } from "react";
import {
  OPENAI_ENDPOINT_OPTIONS,
  type OpenAISettings,
} from "../settings/openai";

type Props = {
  isSaving: boolean;
  onReset: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  settings: OpenAISettings;
  onUpdate: (key: keyof OpenAISettings) => (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

export function SettingsPanel({
  isSaving,
  onReset,
  onSave,
  settings,
  onUpdate,
}: Props) {
  return (
    <form className="settings-form" onSubmit={onSave}>
      <div className="flex flex-col gap-2 text-left">
        <h1 className="text-2xl font-bold">OpenAI Settings</h1>
        <p className="text-sm opacity-70">
          These values are stored locally inside the extension.
        </p>
      </div>

      <fieldset className="form-control">
        <legend className="label-text">LLM endpoint</legend>
        <div className="endpoint-grid">
          {OPENAI_ENDPOINT_OPTIONS.map((option) => {
            const isSelected = settings.baseUrl === option.baseUrl;

            return (
              <label
                key={option.baseUrl}
                className={`endpoint-option ${
                  isSelected ? "endpoint-option--active" : ""
                }`}
              >
                <input
                  type="radio"
                  name="baseUrl"
                  value={option.baseUrl}
                  checked={isSelected}
                  onChange={onUpdate("baseUrl")}
                />
                <span className="endpoint-option__content">
                  <span className="endpoint-option__title">{option.label}</span>
                  <span className="endpoint-option__description">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="form-control">
        <span className="label-text">Model</span>
        <input
          type="text"
          className="input input-bordered"
          value={settings.model}
          onChange={onUpdate("model")}
          placeholder="gpt-4o-mini"
        />
      </label>

      <label className="form-control">
        <span className="label-text">API token</span>
        <input
          type="password"
          className="input input-bordered"
          value={settings.token}
          onChange={onUpdate("token")}
          placeholder="sk-..."
        />
      </label>

      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn btn-outline" type="button" onClick={onReset}>
          Reset
        </button>
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
