import { reactive, toValue } from 'vue'

function readEditor(editor, key) {
  return toValue(editor[key])
}

/**
 * Reactive view model for template bindings from useScreeningEditor.
 * Getters unwrap nested refs/computed so vue-i18n and Quasar receive
 * plain values.
 */
export function useScreeningEditorUi(editor) {
  return reactive({
    get statusLabel() {
      return readEditor(editor, 'statusLabel')
    },
    get completionPercent() {
      return readEditor(editor, 'completionPercent')
    },
    get riskLevel() {
      return readEditor(editor, 'riskLevel')
    },
    get sectionStatuses() {
      return readEditor(editor, 'sectionStatuses')
    },
    get canEditDraft() {
      return readEditor(editor, 'canEditDraft')
    },
    get saving() {
      return readEditor(editor, 'saving')
    },
    get saveMode() {
      return readEditor(editor, 'saveMode')
    },
    get isReadonly() {
      return readEditor(editor, 'isReadonly')
    },
    get showMeasurements() {
      return readEditor(editor, 'showMeasurements')
    },
    get bmiDisplay() {
      return readEditor(editor, 'bmiDisplay')
    },
    get completedAtDisplay() {
      return readEditor(editor, 'completedAtDisplay')
    },
    get scoreSummary() {
      return readEditor(editor, 'scoreSummary')
    },
  })
}
