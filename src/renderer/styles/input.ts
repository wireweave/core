/**
 * Input component styles (Input, Textarea, Select, Checkbox, Radio, Switch, Slider)
 */

import type { ThemeConfig } from '../types';

export function generateInputStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Input Components */
.${prefix}-form-field {
  margin-bottom: 16px;
}

.${prefix}-input-label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
}

.${prefix}-input,
.${prefix}-textarea,
.${prefix}-select {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  font-family: inherit;
  font-size: 14px;
  background: var(--${prefix}-bg);
  color: var(--${prefix}-fg);
  transition: border-color 0.15s ease;
}

/* Inputs in flex rows should not take full width */
.${prefix}-row > .${prefix}-input,
.${prefix}-row > .${prefix}-select {
  width: auto;
  flex: 1 1 auto;
  min-width: 120px;
}

.${prefix}-input:focus,
.${prefix}-textarea:focus,
.${prefix}-select:focus {
  outline: none;
  border-color: var(--${prefix}-fg);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.${prefix}-input:disabled,
.${prefix}-textarea:disabled,
.${prefix}-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.03);
}

.${prefix}-input::placeholder,
.${prefix}-textarea::placeholder {
  color: var(--${prefix}-muted);
}

.${prefix}-input-error {
  border-color: var(--${prefix}-danger);
}

/* Input with icon */
.${prefix}-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.${prefix}-input-wrapper .${prefix}-input {
  padding-left: 36px;
}

.${prefix}-input-icon {
  position: absolute;
  left: 12px;
  color: var(--${prefix}-muted);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.${prefix}-input-icon svg {
  width: 16px;
  height: 16px;
}

/* Input wrapper in flex rows */
.${prefix}-row > .${prefix}-input-wrapper {
  flex: 1 1 auto;
  min-width: 120px;
}

.${prefix}-textarea {
  min-height: 80px;
  resize: vertical;
}

.${prefix}-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.${prefix}-checkbox,
.${prefix}-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.${prefix}-checkbox input,
.${prefix}-radio input {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.${prefix}-checkbox-label,
.${prefix}-radio-label {
  font-size: 14px;
}

.${prefix}-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.${prefix}-switch input[type="checkbox"] {
  appearance: none;
  width: 40px;
  height: 22px;
  background: var(--${prefix}-muted);
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.${prefix}-switch input[type="checkbox"]::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.${prefix}-switch input[type="checkbox"]:checked {
  background: var(--${prefix}-fg);
}

.${prefix}-switch input[type="checkbox"]:checked::after {
  transform: translateX(18px);
}

.${prefix}-switch-label {
  font-size: 14px;
}

.${prefix}-slider {
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--${prefix}-border);
  border-radius: 3px;
  outline: none;
}

.${prefix}-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--${prefix}-fg);
  border-radius: 50%;
  cursor: pointer;
}

.${prefix}-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--${prefix}-fg);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}`;
}
