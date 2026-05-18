"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { WizardQuestion } from "@/app/api/refine-idea/route";
import { buildRefinedIdea } from "@/lib/wizard/refine";
import { WIZARD_PRESETS, applyPreset, type WizardPresetId } from "@/lib/wizard/presets";

// Re-export so callers can import from one place
export type { WizardQuestion };
export { buildRefinedIdea };

type Props = {
  idea: string;
  questions: WizardQuestion[];
  onComplete: (refinedIdea: string, answers: Record<string, string>) => void;
  onSkip: () => void;
};

export function IdeaWizard({ idea, questions, onComplete, onSkip }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [showOther, setShowOther] = useState<Record<string, boolean>>({});
  const [activePreset, setActivePreset] = useState<WizardPresetId | null>(null);

  const questionIds = questions.map((q) => q.id);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handlePresetClick(presetId: WizardPresetId) {
    const preset = WIZARD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    if (presetId === "custom") {
      // Custom = clear all pre-filled answers
      setAnswers({});
      setOtherText({});
      setShowOther({});
    } else {
      const filled = applyPreset(preset, questionIds);
      setAnswers(filled);
    }
  }

  function handleChipClick(id: string, suggestion: string) {
    if (suggestion === "Skip") {
      setAnswer(id, "");
      setShowOther((prev) => ({ ...prev, [id]: false }));
      return;
    }
    if (suggestion === "Other...") {
      setShowOther((prev) => ({ ...prev, [id]: true }));
      return;
    }
    setAnswer(id, suggestion);
    setShowOther((prev) => ({ ...prev, [id]: false }));
  }

  function handleOtherInput(id: string, value: string) {
    setOtherText((prev) => ({ ...prev, [id]: value }));
    setAnswer(id, value);
  }

  function handleSubmit() {
    const refinedIdea = buildRefinedIdea(idea, answers);
    onComplete(refinedIdea, answers);
  }

  function isVibeQuestion(question: WizardQuestion) {
    return /\bvibe\b/i.test(`${question.id} ${question.label}`);
  }

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Idea refinement">
      <div className="wizard-panel">
        <div className="wizard-header">
          <div>
            <h2 className="wizard-title">Refine your idea</h2>
            <p className="wizard-subtitle">Answer a few quick questions so the search and handoff are tailored to you.</p>
          </div>
          <button type="button" className="wizard-close" onClick={onSkip} aria-label="Skip refinement">
            <X size={16} />
          </button>
        </div>

        <div className="wizard-idea-preview">
          <span className="wizard-idea-label">Idea</span>
          <span className="wizard-idea-text">{idea}</span>
        </div>

        {/* ── Quickstart Presets ── */}
        <div className="wizard-presets">
          <span className="wizard-presets-label">Quick start:</span>
          <div className="wizard-presets-chips">
            {WIZARD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`wizard-preset-chip ${activePreset === preset.id ? "wizard-preset-chip-active" : ""}`}
                onClick={() => handlePresetClick(preset.id)}
                title={preset.blurb}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {activePreset && activePreset !== "custom" && (
            <p className="wizard-preset-note">
              Pre-filled with {WIZARD_PRESETS.find((p) => p.id === activePreset)?.label} defaults. Edit any answer below.
            </p>
          )}
        </div>

        <div className="wizard-questions">
          {questions.map((q, index) => {
            const isVibe = isVibeQuestion(q);

            return (
              <div key={q.id} className="wizard-question brand-question">
                <span className="bq-step">Step {index + 1} of {questions.length}</span>
                <h4 className="wizard-q-label">{q.label}</h4>

                {q.kind === "color" ? (
                  <div className="wizard-color-row swatch-row">
                    <div
                      className="wizard-color-swatch swatch selected"
                      style={{
                        background: /^#[0-9a-f]{3,6}$/i.test(answers[q.id] ?? "") ? answers[q.id] : "#374151"
                      }}
                    />
                    <input
                      type="text"
                      className="wizard-text-input bq-input"
                      placeholder={q.placeholder ?? "#2563eb"}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      maxLength={9}
                    />
                    <button type="button" className="wizard-skip-inline" onClick={() => setAnswer(q.id, "")}>
                      Skip
                    </button>
                  </div>
                ) : q.kind === "text" ? (
                  <div className="wizard-text-row">
                    <input
                      type="text"
                      className="wizard-text-input wizard-text-full bq-input"
                      placeholder={q.placeholder ?? ""}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                    <button type="button" className="wizard-skip-inline" onClick={() => setAnswer(q.id, "")}>
                      Skip
                    </button>
                  </div>
                ) : (
                  /* kind === "select" */
                  <div className={`wizard-chips ${isVibe ? "vibe-row" : "chips-multi"}`}>
                    {(q.suggestions ?? []).map((suggestion) => {
                      const isActive = answers[q.id] === suggestion && suggestion !== "Skip";
                      const prototypeCardClass = isVibe ? "vibe-card" : "chip-multi";
                      const activeClass = isActive ? "wizard-chip-active selected" : "";

                      return (
                        <button
                          key={suggestion}
                          type="button"
                          className={`wizard-chip ${prototypeCardClass} ${activeClass} ${suggestion === "Skip" ? "wizard-chip-skip" : ""}`}
                          onClick={() => handleChipClick(q.id, suggestion)}
                        >
                          {isVibe ? <span className="vname">{suggestion}</span> : suggestion}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`wizard-chip ${isVibe ? "vibe-card" : "chip-multi"} ${showOther[q.id] ? "wizard-chip-active selected" : ""}`}
                      onClick={() => {
                        setShowOther((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
                      }}
                    >
                      {isVibe ? <span className="vname">Other...</span> : "Other..."}
                    </button>

                    {showOther[q.id] ? (
                      <input
                        type="text"
                        className="wizard-text-input wizard-other-input bq-input"
                        placeholder={q.placeholder ?? "Type your answer"}
                        value={otherText[q.id] ?? ""}
                        onChange={(e) => handleOtherInput(q.id, e.target.value)}
                        autoFocus
                      />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="wizard-actions bq-foot">
          <button type="button" className="wizard-submit" onClick={handleSubmit}>
            Refine and search
          </button>
          <button type="button" className="wizard-skip-link" onClick={onSkip}>
            Skip questions and search
          </button>
        </div>
      </div>
    </div>
  );
}
