/**
 * Form UX Rules
 *
 * Rules for ensuring good form UX patterns.
 */

import type { AnyNode } from '../../ast/types';
import type { UXRule, UXRuleContext, UXIssue } from '../types';

/**
 * Check if form has a submit button
 */
export const formRequiresSubmit: UXRule = {
  id: 'form-submit-button',
  category: 'form',
  severity: 'warning',
  name: 'Form should have submit button',
  description: 'Forms with input fields should have a clear submit action',
  appliesTo: ['Card', 'Section', 'Modal', 'Main'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    if (!('children' in node) || !Array.isArray(node.children)) {
      return null;
    }

    // Check if container has form inputs
    let hasInputs = false;
    let hasSubmitButton = false;

    function walkChildren(children: AnyNode[]) {
      for (const child of children) {
        if (['Input', 'Textarea', 'Select', 'Checkbox', 'Radio'].includes(child.type)) {
          hasInputs = true;
        }
        if (child.type === 'Button') {
          const isPrimary = 'primary' in child && child.primary;
          const content = 'content' in child ? String(child.content || '').toLowerCase() : '';
          const submitWords = ['submit', 'save', 'send', 'create', 'add', 'update', 'confirm', 'ok', 'done'];
          if (isPrimary || submitWords.some(w => content.includes(w))) {
            hasSubmitButton = true;
          }
        }
        if ('children' in child && Array.isArray(child.children)) {
          walkChildren(child.children as AnyNode[]);
        }
      }
    }

    walkChildren(node.children as AnyNode[]);

    if (hasInputs && !hasSubmitButton) {
      return {
        ruleId: 'form-submit-button',
        category: 'form',
        severity: 'warning',
        message: 'Form area has inputs but no clear submit button',
        description: 'Users need a clear way to submit form data',
        suggestion: 'Add a primary button with a clear action label (e.g., "Submit", "Save")',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check if required fields are marked
 */
export const requiredFieldIndicator: UXRule = {
  id: 'form-required-indicator',
  category: 'form',
  severity: 'info',
  name: 'Required fields should be clearly marked',
  description: 'Users should know which fields are required before filling out a form',
  appliesTo: ['Input', 'Textarea', 'Select'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const isRequired = 'required' in node && node.required;
    const label = 'label' in node ? String(node.label || '') : '';

    if (isRequired && label && !label.includes('*') && !label.toLowerCase().includes('required')) {
      return {
        ruleId: 'form-required-indicator',
        category: 'form',
        severity: 'info',
        message: 'Required field label does not indicate it is required',
        description: 'Users should see visual indication that a field is required',
        suggestion: 'Add an asterisk (*) to the label or include "required" in the label text',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check password field has confirmation
 */
export const passwordConfirmation: UXRule = {
  id: 'form-password-confirm',
  category: 'form',
  severity: 'info',
  name: 'Password field may need confirmation',
  description: 'Password fields in registration forms should have a confirmation field',
  appliesTo: ['Input'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const inputType = 'inputType' in node ? node.inputType : '';
    if (inputType !== 'password') return null;

    const label = 'label' in node ? String(node.label || '').toLowerCase() : '';
    const isConfirmField = label.includes('confirm') || label.includes('repeat') || label.includes('retype');

    if (isConfirmField) return null;

    // Check if there's a confirmation field nearby
    let hasConfirmField = false;
    for (const sibling of context.siblings) {
      if (sibling.type === 'Input' && 'inputType' in sibling && sibling.inputType === 'password') {
        const siblingLabel = 'label' in sibling ? String(sibling.label || '').toLowerCase() : '';
        if (siblingLabel.includes('confirm') || siblingLabel.includes('repeat') || siblingLabel.includes('retype')) {
          hasConfirmField = true;
          break;
        }
      }
    }

    // Only warn for what looks like a registration/signup context
    const parentLabel = context.parent && 'title' in context.parent ? String(context.parent.title || '').toLowerCase() : '';
    const isRegistration = parentLabel.includes('sign up') || parentLabel.includes('register') || parentLabel.includes('create account');

    if (isRegistration && !hasConfirmField) {
      return {
        ruleId: 'form-password-confirm',
        category: 'form',
        severity: 'info',
        message: 'Registration form password field has no confirmation field',
        description: 'Users may mistype their password without a confirmation field',
        suggestion: 'Add a "Confirm Password" field to prevent typos',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for appropriate input types
 */
export const appropriateInputType: UXRule = {
  id: 'form-input-type',
  category: 'form',
  severity: 'warning',
  name: 'Use appropriate input type',
  description: 'Using the correct input type improves UX on mobile and enables browser validation',
  appliesTo: ['Input'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const inputType = 'inputType' in node ? String(node.inputType || 'text') : 'text';
    const label = 'label' in node ? String(node.label || '').toLowerCase() : '';
    const placeholder = 'placeholder' in node ? String(node.placeholder || '').toLowerCase() : '';
    const combined = label + ' ' + placeholder;

    const suggestions: { keywords: string[]; type: string }[] = [
      { keywords: ['email', 'e-mail'], type: 'email' },
      { keywords: ['phone', 'tel', 'mobile', 'cell'], type: 'tel' },
      { keywords: ['url', 'website', 'link'], type: 'url' },
      { keywords: ['password', 'pwd'], type: 'password' },
      { keywords: ['search', 'find', 'query'], type: 'search' },
      { keywords: ['date', 'birthday', 'dob'], type: 'date' },
      { keywords: ['number', 'quantity', 'amount', 'count', 'age'], type: 'number' },
    ];

    for (const suggestion of suggestions) {
      if (suggestion.keywords.some(k => combined.includes(k)) && inputType !== suggestion.type) {
        return {
          ruleId: 'form-input-type',
          category: 'form',
          severity: 'warning',
          message: `Input appears to be for ${suggestion.type} but uses type="${inputType}"`,
          description: `Using inputType="${suggestion.type}" enables better mobile keyboards and browser validation`,
          suggestion: `Change inputType to "${suggestion.type}"`,
          path: context.path,
          nodeType: node.type,
          location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
        };
      }
    }
    return null;
  },
};

/**
 * All form rules
 */
export const formRules: UXRule[] = [
  formRequiresSubmit,
  requiredFieldIndicator,
  passwordConfirmation,
  appropriateInputType,
];
