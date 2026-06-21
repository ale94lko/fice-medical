<template>
  <div class="add-client-form" :data-testid="tid.form">
    <template v-if="!isEditMode">
      <Teleport
        v-if="duplicateBannerTeleportReady"
        to="#banner-anchor"
        :disabled="!duplicateBannerTeleportEnabled">
        <BannerComponent
          :matches="duplicateFilteredMatches"
          :loading="duplicateMatchLoading"
          :ignored="duplicateIgnoredBanner"
          :in-page-header="duplicateBannerTeleportEnabled"
          @review="onDuplicateReview"
          @ignore="onDuplicateIgnore"
        />
      </Teleport>
    </template>
    <AppLoadingOverlay
      v-if="!isEditMode"
      :showing="formBusy"
      scope="content"
      :message="formBusyMessage"
    />
    <div class="chrome">
      <div class="tabs-row">
        <q-tabs
          v-model="activeTab"
          dense
          no-caps
          outside-arrows
          mobile-arrows
          class="add-client-tabs"
          active-color="white"
          indicator-color="transparent"
          align="left">
          <q-tab
            v-for="tab in mainTabs"
            :key="tab.key"
            :name="tab.key"
            :data-testid="tid.tab(tab.key)"
            :class="mainTabClass(tab)">
            <span class="label row items-center no-wrap">
              <q-icon
                :name="tab.icon"
                size="18px"
                class="icon"
              />
              <span class="text">{{ t(tab.labelKey) }}</span>
              <span
                v-if="tabErrorCount(tab.key) > 0"
                class="error-badge"
                :aria-label="t('tabErrorCountAria', {
                  count: tabErrorCount(tab.key),
                })">
                {{ tabErrorCount(tab.key) }}
              </span>
              <q-icon
                v-if="tab.hasSubTabs"
                name="arrow_drop_down"
                size="18px"
                class="chevron q-ml-xs"
              />
            </span>
          </q-tab>
        </q-tabs>
      </div>

      <div
        v-if="hasSubTabs"
        class="subtabs-row">
      <q-tabs
        v-model="activeSubTab"
        dense
        no-caps
        outside-arrows
        mobile-arrows
        class="add-client-subtabs"
        active-color="primary"
        indicator-color="primary"
        align="left">
        <q-tab
          v-for="subTab in filteredCurrentSubTabs"
          :key="subTab.key"
          :name="subTab.key"
          :data-testid="tid.subTab(subTab.key)"
          :icon="subTab.icon"
          :label="t(subTab.labelKey)"
        />
      </q-tabs>
      </div>

      <div
        v-else-if="isContactTabActive"
        class="subtabs-row">
        <q-tabs
          v-model="activeContactSubTab"
          dense
          no-caps
          outside-arrows
          mobile-arrows
          class="add-client-subtabs add-client-subtabs--contact"
          active-color="primary"
          indicator-color="primary"
          align="left">
          <q-tab
            v-for="subTab in contactSubTabs"
            :key="contactSubTabRenderKey(subTab)"
            :name="subTab.key"
            :disable="Boolean(subTab.disabled)"
            :data-testid="tid.subTab(subTab.key)"
            :icon="subTab.removable ? undefined : subTab.icon"
            :label="subTab.removable ? undefined : subTab.label"
            :class="{
              'contact-subtab--removable': subTab.removable,
            }">
            <div
              v-if="subTab.removable"
              class="contact-subtab-label row items-center no-wrap">
              <q-icon
                name="contacts"
                size="18px"
                class="contact-subtab-icon"
              />
              <span class="contact-subtab-text ellipsis">
                {{ contactSubTabLabel(subTab.key) }}
              </span>
              <q-btn
                flat
                round
                dense
                size="sm"
                class="contact-subtab-remove app-btn-icon-action"
                icon="close"
                :aria-label="t('removeOtherContact')"
                :data-testid="tid.otherContactRemove"
                @click.stop="onRemoveContactTab(subTab.key, $event)"
                @mousedown.stop
              />
            </div>
          </q-tab>
        </q-tabs>
      </div>
    </div>

    <div class="content">
      <div
        ref="panelScrollRef"
        class="panel-scroll">
      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
        :data-testid="tid.formFields"
        @submit.prevent="onSave">
        <q-tab-panels
          v-model="activeTab"
          keep-alive
          animated
          class="bg-transparent">
        <q-tab-panel
          :name="addClientTabKeys.basic"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.basic">
          <fieldset
            :disabled="basicInfoReadonly"
            class="add-client-form__readonly-fieldset">
          <AddClientAccordionSection
            icon="person"
            :title="t('personalInformation')"
            section-test-id="add-client-accordion-personal-information"
            :toggle-test-id="tid.accordionToggle('personal-information')">
            <div class="row q-col-gutter-sm q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('prefix')"
                    :test-id="tid.field(ck.prefix)">
                    <FormSelect
                      v-model="form[ck.prefix]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="prefixSelectOptions"
                      :placeholder="t('prefixSelect')"
                      :test-id="tid.field(ck.prefix)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.firstName]"
                    :external-label="true"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="requiredLabel(t('firstName'))"
                    :rules="rules.firstName"
                    :test-id="tid.field(ck.firstName)"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.middleName]"
                    :external-label="true"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="t('middleName')"
                    :rules="rules.middleName"
                    :test-id="tid.field(ck.middleName)"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.lastName]"
                    :external-label="true"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="requiredLabel(t('lastName'))"
                    :rules="rules.lastName"
                    :test-id="tid.field(ck.lastName)"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('suffix')"
                    :test-id="tid.field(ck.suffix)">
                    <FormSelect
                      v-model="form[ck.suffix]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="suffixSelectOptions"
                      :placeholder="t('suffixSelect')"
                      :test-id="tid.field(ck.suffix)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('ssnItin')"
                    :test-id="tid.field(ck.socialSecurityNumber)">
                    <q-input
                      ref="ssnInputRef"
                      outlined
                      hide-bottom-space
                      class="full-width"
                      :data-testid="tid.field(ck.socialSecurityNumber)"
                      :model-value="ssnDisplayValue"
                      :rules="ssnFieldRules"
                      maxlength="11"
                      :placeholder="t('taxIdPlaceholder')"
                      inputmode="numeric"
                      autocomplete="off"
                      @focus="onSsnFocus"
                      @blur="onSsnBlur"
                      @keydown="onSsnKeydown"
                      @update:model-value="onSsnInput"
                    >
                      <template
                        v-if="taxIdTypeBadge"
                        #append>
                        <span
                          class="add-client-form__tax-id-type-badge"
                          :class="`add-client-form__tax-id-type-badge--${
                            taxIdTypeBadge
                          }`">
                          {{ taxIdTypeBadgeLabel }}
                        </span>
                      </template>
                    </q-input>
                    <template
                      v-if="ssnEditFullNumberHint"
                      #hint>
                      <span class="text-body2 text-grey-7">
                        {{ t('taxIdEditFullNumberHint') }}
                      </span>
                    </template>
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('dob')"
                    :test-id="tid.field(ck.dob)">
                    <ClientDateField
                      v-model="form[ck.dob]"
                      max-today
                      :min-year="dobMinYear"
                      :rules="rules.dob"
                      :close-label="t('close')"
                      :test-id="tid.field(ck.dob)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <AddClientLabeledField
                        :label="t('age')"
                        :test-id="tid.field(ck.age)">
                        <q-input
                          v-model="form[ck.age]"
                          class="age-input"
                          outlined
                          hide-bottom-space
                          :data-testid="tid.field(ck.age)"
                          type="number"
                          step="1"
                          :rules="rules.age"
                          :readonly="ageFieldsLocked"
                          :disable="ageFieldsLocked"
                          :filled="ageFieldsLocked"
                          min="0"
                          :max="ageMaxForUnit"
                          @update:model-value="onAgeInput"
                        >
                        <template v-if="!ageFieldsLocked" #append>
                          <div
                            class="age-stepper"
                            role="group"
                            :aria-label="t('age')">
                            <button
                              type="button"
                              class="age-stepper-btn"
                              :disabled="ageAtMax"
                              :aria-label="t('ageIncrement')"
                              @click.stop="bumpAge(1)">
                              <q-icon name="expand_less" size="18px" />
                            </button>
                            <span
                              class="age-stepper-divider"
                              aria-hidden="true" />
                            <button
                              type="button"
                              class="age-stepper-btn"
                              :disabled="ageAtMin"
                              :aria-label="t('ageDecrement')"
                              @click.stop="bumpAge(-1)">
                              <q-icon name="expand_more" size="18px" />
                            </button>
                          </div>
                        </template>
                        </q-input>
                      </AddClientLabeledField>
                    </div>
                    <div class="col-6">
                      <AddClientLabeledField
                        :label="t('ageUnit')"
                        :test-id="tid.field(ck.ageUnit)">
                        <FormSelect
                          v-model="form[ck.ageUnit]"
                          outlined
                          hide-bottom-space
                          emit-value
                          map-options
                          class="full-width"
                          :loading="catalogsLoading"
                          :options="ageUnitSelectOptions"
                          :rules="rules.ageUnit"
                          :readonly="ageFieldsLocked"
                          :disable="ageFieldsLocked"
                          :test-id="tid.field(ck.ageUnit)"
                          :key="
                            `age-unit-${catalogsLoaded}-${form[ck.ageUnit]}`
                          "
                        />
                      </AddClientLabeledField>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('race')"
                    :test-id="tid.field(ck.race)">
                    <FormSelect
                      v-model="form[ck.race]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="raceSelectOptions"
                      :placeholder="t('raceSelect')"
                      :test-id="tid.field(ck.race)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('ethnicity')"
                    :test-id="tid.field(ck.ethnicity)">
                    <FormSelect
                      v-model="form[ck.ethnicity]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="ethnicitySelectOptions"
                      :placeholder="t('ethnicitySelect')"
                      :test-id="tid.field(ck.ethnicity)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12">
                  <AddClientLabeledField
                    :label="t('gender')"
                    required
                    :test-id="tid.field(ck.gender)">
                    <div
                      class="gender-options"
                      role="radiogroup"
                      :aria-label="t('gender')">
                      <button
                        v-for="opt in genderOptions"
                        :key="opt.value"
                        type="button"
                        role="radio"
                        class="gender-option"
                        :aria-checked="genderValuesMatch(
                          form[ck.gender],
                          opt.value,
                        )"
                        :disabled="catalogsLoading"
                        :data-testid="tid.genderOption(opt.value)"
                        :class="{
                          'gender-option--selected':
                            genderValuesMatch(form[ck.gender], opt.value),
                        }"
                        @click="form[ck.gender] = opt.value">
                        <span
                          class="gender-option-radio"
                          aria-hidden="true"
                        />
                        <span class="gender-option-label">
                          {{ opt.label }}
                        </span>
                      </button>
                    </div>
                  </AddClientLabeledField>
                </div>
              </div>
          </AddClientAccordionSection>

          <q-separator class="section-separator" />

          <AddClientAccordionSection
            icon="admin_panel_settings"
            :title="t('administrativeInformation')"
            section-test-id="add-client-accordion-administrative-information"
            :toggle-test-id="
              tid.accordionToggle('administrative-information')">
            <div class="row q-col-gutter-sm q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="requiredLabel(t('admissionDate'))"
                    :test-id="tid.field(ck.admissionDate)">
                    <ClientDateField
                      v-model="form[ck.admissionDate]"
                      :rules="rules.admissionDate"
                      :max-today="true"
                      :close-label="t('close')"
                      :test-id="tid.field(ck.admissionDate)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('clinicians')"
                    :test-id="tid.field(ck.clinicians)">
                    <FormSelect
                      v-model="form[ck.clinicians]"
                      multiple
                      use-chips
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="cliniciansLoading"
                      :options="assignedClinicianOptions"
                      :test-id="tid.field(ck.clinicians)"
                    />
                  </AddClientLabeledField>
                </div>
              </div>
          </AddClientAccordionSection>
          </fieldset>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.contact"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.contact">
          <AddClientContactTab
            ref="addClientContactTabRef"
            v-model="form[contactSectionKey]"
            :active-sub-tab="activeContactSubTab"
            :readonly="contactReadonly"
            :can-view="canViewContactTab"
            :rules="contactRules"
            :prefix-select-options="prefixSelectOptions"
            :suffix-select-options="suffixSelectOptions"
            :contact-type-options="contactTypeSelectOptions"
            :relationship-type-options="relationshipTypeSelectOptions"
            :catalogs-loading="catalogsLoading"
            @remove-other-contact="removeOtherContact"
            @responsible-for-payments-change="onResponsibleForPaymentsChange"
            @preferred-point-of-contact-change="
              onPreferredPointOfContactChange"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.allergies"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.allergies">
          <AddClientAllergiesTab
            ref="allergiesTabRef"
            v-model="form[clientFormSections.allergies]"
            :readonly="allergiesReadonly"
            :can-view="canViewAllergiesTab"
            :patient-dob="form[ck.dob]"
            :allergy-catalog-options="allergyNameSelectOptions"
            :allergy-catalog-loading="catalogsLoading"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.insurance"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.insurance">
          <AddClientInsuranceTab
            v-model="form[clientFormSections.insurance]"
            :readonly="insuranceReadonly"
            :can-view="canViewInsuranceTab"
            :patient-name="patientFullName"
            :payer-catalog-items="payerCatalogItems"
            :payer-catalog-loading="catalogsLoading"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.clinical"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent sub-panels">
            <q-tab-panel
              v-for="subTab in clinicalSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <AddClientFamilyMedicalHistoryTab
                v-if="subTab.key === CLINICAL_FAMILY_HISTORY_SUB_TAB"
                ref="fmhTabRef"
                v-model="form[clientFormSections.familyMedicalHistory]"
              />
              <AddClientVitalsTab
                v-else-if="subTab.key === CLINICAL_VITALS_SUB_TAB"
                ref="vitalsTabRef"
                v-model="form[clientFormSections.vitals]"
                :readonly="vitalsReadonly"
                :can-view="canViewVitalsTab"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientAssessmentsTab
                v-else-if="subTab.key === CLINICAL_ASSESSMENTS_SUB_TAB"
                :patient-id="props.clientId"
                :readonly="assessmentsReadonly"
                :can-view="canViewAssessmentsTab"
              />
              <AddClientLabsTab
                v-else-if="subTab.key === CLINICAL_LABS_SUB_TAB"
                v-model="form[clientFormSections.labs]"
                :patient-id="props.clientId"
                :readonly="labsReadonly"
                :can-view="canViewLabsTab"
                :can-delete="canDeleteLabsTab"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientCarePlansTab
                v-else-if="subTab.key === CLINICAL_CARE_PLANS_SUB_TAB"
                :client-id="props.clientId"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientClinicalNotesTab
                v-else-if="subTab.key === CLINICAL_CLINICAL_NOTES_SUB_TAB"
                :client-id="props.clientId"
                :admission-date="form[ck.admissionDate]"
                :clinician-options="assignedClinicianOptions"
              />
              <div
                v-else
                class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.careCoordination"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent sub-panels">
            <q-tab-panel
              v-for="subTab in careCoordinationSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <AddClientReferralsTab
                v-if="subTab.key === CARE_COORDINATION_REFERRALS_SUB_TAB"
                :client-id="props.clientId"
                :clinician-options="assignedClinicianOptions"
                @schedule-appointment="onReferralSchedule"
                @create-follow-up="onReferralCreateFollowUp"
                @remove-follow-up="onReferralRemoveFollowUp"
              />
              <AddClientAppointmentsTab
                v-else-if="
                  subTab.key === CARE_COORDINATION_APPOINTMENTS_SUB_TAB
                "
                :client-id="props.clientId"
              />
              <AddClientFollowUpsTab
                v-else-if="
                  subTab.key === CARE_COORDINATION_FOLLOW_UPS_SUB_TAB
                    && canViewFollowUpsTab
                    && form[clientFormSections.followUps]?.visible
                "
                v-model="form[clientFormSections.followUps]"
                :client-id="props.clientId"
                :reference-context="followUpReferenceContext"
                :clinician-options="assignedClinicianOptions"
              />
              <div
                v-else
                class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.financials"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent sub-panels">
            <q-tab-panel
              v-for="subTab in financialsSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.documents"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent sub-panels">
            <q-tab-panel
              v-for="subTab in documentsSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>
      </q-tab-panels>

        <footer
          v-if="canGoPreviousFiltered() || canGoNextFiltered()"
          class="nav-footer row items-center">
          <q-btn
            v-if="canGoPreviousFiltered()"
            no-caps
            outline
            color="primary"
            icon="arrow_back"
            class="app-btn-outline nav-btn"
            :data-testid="tid.btn('previous')"
            :label="t('previous')"
            :disable="saving"
            @click="goPreviousTabFiltered"
          />
          <q-space
            v-if="canGoPreviousFiltered() && canGoNextFiltered()"
          />
          <q-btn
            v-if="canGoNextFiltered()"
            no-caps
            outline
            color="primary"
            icon-right="arrow_forward"
            class="app-btn-outline nav-btn"
            :class="{ 'q-ml-auto': !canGoPreviousFiltered() }"
            :data-testid="tid.btn('next')"
            :label="t('next')"
            :disable="saving"
            @click="onNextFiltered"
          />
        </footer>
      </q-form>
      </div>
    </div>

    <ModalComponent
      v-model="duplicateSaveConfirmOpen"
      test-id="duplicate-save-confirm"
      :title="t('duplicateMatchSaveConfirmTitle')"
      :message="t('duplicateMatchSaveConfirmMessage')"
      :confirm-text="t('duplicateMatchCreateAnyway')"
      :cancel-text="t('cancel')"
      :confirm-button-test-id="tid.duplicateMatch.btnSaveConfirmCreate"
      :cancel-button-test-id="tid.duplicateMatch.btnSaveConfirmCancel"
      @confirm="onDuplicateSaveConfirm"
      @cancel="duplicateSaveConfirmOpen = false"
    />
    <ModalComponent
      v-model="duplicateNavigateConfirmOpen"
      test-id="duplicate-navigate-confirm"
      :title="t('duplicateMatchNavigateTitle')"
      :message="t('duplicateMatchNavigateMessage')"
      :confirm-text="t('confirm')"
      :cancel-text="t('cancel')"
      :confirm-button-test-id="tid.duplicateMatch.btnNavigateConfirm"
      :cancel-button-test-id="tid.duplicateMatch.btnNavigateCancel"
      @confirm="onDuplicateNavigateConfirm"
      @cancel="duplicateNavigateConfirmOpen = false"
    />
    <AddClientDuplicateMatchReviewDialog
      v-model="duplicateReviewOpen"
      :loading="duplicateReviewLoading"
      :preview-form="duplicateReviewPreview"
      :new-form="form"
      :selected-match="duplicateReviewMatch"
      @not-match="onDuplicateReviewNotMatch"
      @open-existing="onDuplicateOpenExistingRequest"
      @cancel="onDuplicateReviewCancel"
    />
    <ModalComponent
      v-model="cancelConfirmOpen"
      test-id="cancel-discard"
      :title="cancelModalTitle"
      :message="cancelModalMessage"
      :confirm-text="t('keepEditing')"
      :cancel-text="t('discardChanges')"
      :confirm-button-test-id="tid.modalKeepEditing"
      :cancel-button-test-id="tid.modalCancelDiscard"
      @confirm="dismissCancelConfirm"
      @cancel="confirmDiscard"
    />
  </div>
</template>

<script setup>
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import TextInput from '../FormInput.vue'
import ClientDateField from '../ClientDateField.vue'
import AddClientLabeledField from '../AddClientLabeledField.vue'
import FormSelect from '../FormSelect.vue'
import ModalComponent from '../ModalComponent.vue'
import AddClientContactTab from '../AddClientContactTab.vue'
import AddClientFamilyMedicalHistoryTab
  from '../AddClientFamilyMedicalHistoryTab.vue'
import AddClientVitalsTab from '../AddClientVitalsTab.vue'
import AddClientAssessmentsTab from '../AddClientAssessmentsTab.vue'
import AddClientLabsTab from '../AddClientLabsTab.vue'
import AddClientCarePlansTab from '../AddClientCarePlansTab.vue'
import AddClientClinicalNotesTab from '../AddClientClinicalNotesTab.vue'
import AddClientFollowUpsTab from '../AddClientFollowUpsTab.vue'
import AddClientAppointmentsTab from '../AddClientAppointmentsTab.vue'
import AddClientReferralsTab from '../AddClientReferralsTab.vue'
import AddClientAllergiesTab from '../AddClientAllergiesTab.vue'
import AddClientInsuranceTab from '../AddClientInsuranceTab.vue'
import AddClientAccordionSection from '../AccordionSection.vue'
import AppLoadingOverlay from '../AppLoadingOverlay.vue'
import BannerComponent from '../BannerComponent.vue'
import AddClientDuplicateMatchReviewDialog
  from '../AddClientDuplicateMatchReviewDialog.vue'
import { useSiteStore } from '../../stores/site-store.js'
import { useAddClientForm } from 'src/composables/useAddClientForm.js'
import { useAddClientCatalogs } from 'src/composables/useAddClientCatalogs.js'
import { useContactSubTabs } from 'src/composables/useContactSubTabs.js'
import { resolveOtherContactTabLabel } from 'src/utils/client-contact-form.js'
import {
  addClientTabKeys,
  clientFormSections,
  clientMaxAge,
  clientNameMaxLength,
  quasarNotifyTypes,
} from '../constants.js'
import {
  detectTaxIdType,
  formatSsnMasked,
  formatTaxIdInput,
  getSsnBlockValidationErrorKey,
  hasStoredIdNumberMasked,
  isValidTaxIdDigits,
  maxAgeForUnit,
  normalizeIdNumberMaskedDisplay,
  normalizeSsnDigits,
} from 'src/utils/client-form.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { mapPendingFollowUpFromDraft } from 'src/utils/client-follow-ups.js'
import {
  followUpExistsForReferral,
  removeFollowUpForReferral,
} from 'src/utils/referral-follow-up.js'
import {
  highestAllergySeverity,
  severityTabModifier,
} from 'src/utils/client-allergies.js'
import {
  CLINICAL_FAMILY_HISTORY_SUB_TAB,
  CLINICAL_VITALS_SUB_TAB,
  CLINICAL_ASSESSMENTS_SUB_TAB,
  CLINICAL_LABS_SUB_TAB,
  CLINICAL_CARE_PLANS_SUB_TAB,
  CLINICAL_CLINICAL_NOTES_SUB_TAB,
  CARE_COORDINATION_FOLLOW_UPS_SUB_TAB,
  CARE_COORDINATION_REFERRALS_SUB_TAB,
  CARE_COORDINATION_APPOINTMENTS_SUB_TAB,
} from 'src/composables/useAddClientSubTabs.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useAddClientTabPermissions } from
  'src/composables/useAddClientTabPermissions.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { useClientProgressiveMatch }
  from 'src/composables/useClientProgressiveMatch.js'
import { emitClientDuplicateAudit } from 'src/utils/client-duplicate-audit.js'
import { summarizeNewClientDataForAudit }
  from 'src/utils/client-duplicate-audit-summary.js'
import { hasAddClientDataBeyondFirstLastName }
  from 'src/utils/add-client-beyond-minimal-identity.js'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: value => value === 'create' || value === 'edit',
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  initialActiveTab: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['saved', 'cancel', 'tab-label', 'navigate-existing'])

const isEditMode = computed(() => props.mode === 'edit')

const {
  visibleMainTabs,
  visibleTabOrder,
  canEditBasicInfo,
  canEditContact,
  canEditAllergies,
  canEditInsurance,
  canEditSubTabFor,
  canViewMainTabFor,
  canViewSubTabFor,
  canSaveForm,
  filterSubTabsFor,
} = useAddClientTabPermissions(isEditMode)

const { canDeleteLabs } = useClientPermissions()

const mainTabs = visibleMainTabs

const basicInfoReadonly = computed(() => !canEditBasicInfo.value)
const contactReadonly = computed(() => !canEditContact.value)
const allergiesReadonly = computed(() => !canEditAllergies.value)
const insuranceReadonly = computed(() => !canEditInsurance.value)
const canViewContactTab = canViewMainTabFor(addClientTabKeys.contact)
const canViewAllergiesTab = canViewMainTabFor(addClientTabKeys.allergies)
const canViewInsuranceTab = canViewMainTabFor(addClientTabKeys.insurance)

const vitalsReadonly = computed(
  () => !canEditSubTabFor(CLINICAL_VITALS_SUB_TAB).value,
)
const canViewVitalsTab = canViewSubTabFor(CLINICAL_VITALS_SUB_TAB)
const assessmentsReadonly = computed(
  () => !canEditSubTabFor(CLINICAL_ASSESSMENTS_SUB_TAB).value,
)
const canViewAssessmentsTab = canViewSubTabFor(CLINICAL_ASSESSMENTS_SUB_TAB)
const labsReadonly = computed(
  () => !canEditSubTabFor(CLINICAL_LABS_SUB_TAB).value,
)
const canViewLabsTab = canViewSubTabFor(CLINICAL_LABS_SUB_TAB)
const canViewFollowUpsTab = canViewSubTabFor(
  CARE_COORDINATION_FOLLOW_UPS_SUB_TAB,
)
const canDeleteLabsTab = canDeleteLabs

const duplicateBannerInHeader = inject(
  'addClientDuplicateBannerInHeader',
  false,
)
const duplicateBannerTeleportEnabled = computed(
  () => !isEditMode.value && duplicateBannerInHeader === true,
)
const duplicateBannerTeleportReady = ref(false)

const $q = useQuasar()
const { t } = useI18n()
const siteStore = useSiteStore()

const saving = ref(false)
const initialLoading = ref(false)
const formBusy = computed(
  () => initialLoading.value || saving.value,
)
const formBusyMessage = computed(() =>
  saving.value ? t('appSaving') : t('appLoading'),
)
const cancelConfirmOpen = ref(false)
const ssnEditing = ref(false)
const ssnInputRef = ref(null)
const allergiesTabRef = ref(null)
const addClientContactTabRef = ref(null)
const fmhTabRef = ref(null)
const vitalsTabRef = ref(null)
const panelScrollRef = ref(null)

const catalogs = useAddClientCatalogs(t)
const {
  loading: catalogsLoading,
  loaded: catalogsLoaded,
  cliniciansLoading,
  loadBasicInfoCatalogs,
  loadCliniciansForAddClient,
  payerCatalogItems,
  allergyNameSelectOptions,
} = catalogs

const {
  ck,
  contactSectionKey,
  form,
  formRef,
  activeTab,
  ageFieldsLocked,
  ageUnitSelectOptions,
  assignedClinicianOptions,
  genderOptions,
  prefixSelectOptions,
  suffixSelectOptions,
  raceSelectOptions,
  ethnicitySelectOptions,
  contactTypeSelectOptions,
  relationshipTypeSelectOptions,
  rules,
  contactRules,
  resetForm,
  applyForm,
  markPristine,
  isDirty,
  validateCurrentTabAndUnlock,
  validateAllTabs,
  tabErrorCount,
  tabLabelFor,
  hasSubTabs,
  activeSubTab,
} = useAddClientForm(t, catalogs, {
  allergiesTabRef,
  fmhTabRef,
  vitalsTabRef,
  panelScrollRef,
  initialActiveTab: props.initialActiveTab,
})

const filteredCurrentSubTabs = computed(() => {
  if (!hasSubTabs.value) {
    return []
  }

  return filterSubTabsFor(activeTab.value)
})

const clinicalSubTabs = computed(
  () => filterSubTabsFor(addClientTabKeys.clinical),
)
const careCoordinationSubTabs = computed(
  () => filterSubTabsFor(addClientTabKeys.careCoordination),
)
const financialsSubTabs = computed(
  () => filterSubTabsFor(addClientTabKeys.financials),
)
const documentsSubTabs = computed(
  () => filterSubTabsFor(addClientTabKeys.documents),
)

function tabIndexInVisibleOrder(tab) {
  return visibleTabOrder.value.indexOf(tab)
}

function canGoNextFiltered() {
  const idx = tabIndexInVisibleOrder(activeTab.value)

  return idx >= 0 && idx < visibleTabOrder.value.length - 1
}

function canGoPreviousFiltered() {
  return tabIndexInVisibleOrder(activeTab.value) > 0
}

function goNextTabFiltered() {
  const idx = tabIndexInVisibleOrder(activeTab.value)
  if (idx >= 0 && idx < visibleTabOrder.value.length - 1) {
    activeTab.value = visibleTabOrder.value[idx + 1]
  }
}

function goPreviousTabFiltered() {
  const idx = tabIndexInVisibleOrder(activeTab.value)
  if (idx > 0) {
    activeTab.value = visibleTabOrder.value[idx - 1]
  }
}

function ensureActiveTabVisible() {
  const order = visibleTabOrder.value
  if (!order.length) {
    return
  }
  if (!order.includes(activeTab.value)) {
    activeTab.value = order[0]
  }
  if (!hasSubTabs.value) {
    return
  }
  const subs = filterSubTabsFor(activeTab.value)
  if (!subs.length) {
    return
  }
  if (!subs.some(item => item.key === activeSubTab.value)) {
    activeSubTab.value = subs[0].key
  }
}

const progressiveMatchEnabled = computed(() => !isEditMode.value)
const {
  filteredMatches: duplicateFilteredMatches,
  loading: duplicateMatchLoading,
  hasActiveMatches: duplicateHasActiveMatches,
  highestMatchScore: duplicateHighestMatchScore,
  ignoredBanner: duplicateIgnoredBanner,
  openedAnyMatchForSaveGate: duplicateOpenedAnyMatch,
  ignoreMatchesBanner: duplicateIgnoreMatchesBanner,
  discardMatch: duplicateDiscardMatch,
  markOpenedMatch: duplicateMarkOpenedMatch,
} = useClientProgressiveMatch(form, progressiveMatchEnabled)

const followUpReferenceContext = computed(() => {
  const id = String(props.clientId ?? '').trim()
  const rawClient = id ? siteStore.clientListSourceById[id] : null

  return {
    client: rawClient,
    labs: form.value[clientFormSections.labs] ?? [],
    insuranceProfiles:
      form.value[clientFormSections.insurance]?.profiles ?? [],
    referrals: rawClient?.referrals ?? [],
    carePlans: rawClient?.care_plans ?? rawClient?.carePlans ?? [],
  }
})

const isContactTabActive = computed(
  () => activeTab.value === addClientTabKeys.contact,
)

const contactCatalogOptions = computed(() => ({
  contactTypeOptions: contactTypeSelectOptions.value,
  relationshipTypeOptions: relationshipTypeSelectOptions.value,
}))

const {
  activeContactSubTab,
  contactSubTabs,
  removeOtherContact,
  onResponsibleForPaymentsChange,
  onPreferredPointOfContactChange,
  CONTACT_SUB_TAB_SELF,
} = useContactSubTabs(
  () => form.value[contactSectionKey],
  contactCatalogOptions,
)

watch(activeTab, (tab, prev) => {
  if (tab === addClientTabKeys.contact && prev !== tab) {
    activeContactSubTab.value = CONTACT_SUB_TAB_SELF
  }
})

watch(activeContactSubTab, () => {
  if (isContactTabActive.value) {
    scrollFormPanelToTop()
  }
})

function onRemoveContactTab(contactId, event) {
  event?.preventDefault?.()
  addClientContactTabRef.value?.requestRemoveOtherContactById(contactId)
}

function contactSubTabLabel(tabKey) {
  const section = form.value[contactSectionKey] ?? {}
  const others = section.otherContacts ?? []
  const index = others.findIndex(row => row.id === tabKey)
  if (index < 0) {
    return ''
  }

  return resolveOtherContactTabLabel(
    others[index],
    index,
    t,
    contactCatalogOptions.value,
    others,
  )
}

function contactSubTabRenderKey(subTab) {
  if (!subTab.removable) {
    return subTab.key
  }

  return `${subTab.key}-${contactSubTabLabel(subTab.key)}`
}

const duplicateSaveConfirmOpen = ref(false)
const duplicateNavigateConfirmOpen = ref(false)
const duplicatePendingNavigateClientId = ref(null)
const duplicateReviewOpen = ref(false)
const duplicateReviewLoading = ref(false)
const duplicateReviewPreview = ref(null)
const duplicateReviewMatch = ref(null)

const dobMinYear = computed(
  () => new Date().getFullYear() - clientMaxAge,
)

function normalizeGenderToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function genderValuesMatch(stored, optionValue) {
  const a = normalizeGenderToken(stored)
  const b = normalizeGenderToken(optionValue)
  if (!a || !b) {
    return false
  }

  return a === b
}

const ageMaxForUnit = computed(() => maxAgeForUnit(form.value[ck.ageUnit]))

const ageNumericValue = computed(() => {
  const raw = String(form.value[ck.age] ?? '').trim()
  if (!raw) {
    return 0
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : 0
})

const ageAtMin = computed(() => ageNumericValue.value <= 0)
const ageAtMax = computed(
  () => ageNumericValue.value >= ageMaxForUnit.value,
)

function onAgeInput(val) {
  if (ageFieldsLocked.value) {
    return
  }
  const raw = String(val ?? '').trim()
  if (!raw) {
    form.value[ck.age] = ''

    return
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    return
  }
  form.value[ck.age] = String(Math.max(0, Math.trunc(n)))
}

function bumpAge(delta) {
  const max = ageMaxForUnit.value
  const next = Math.min(max, Math.max(0, ageNumericValue.value + delta))
  form.value[ck.age] = String(next)
}

const allergiesTabClass = computed(() => {
  const classes = ['allergies']
  const top = highestAllergySeverity(
    form.value[clientFormSections.allergies]?.entries,
  )
  const modifier = severityTabModifier(top)
  if (modifier) {
    classes.push(`allergies-${modifier}`)
  }

  return classes
})

function mainTabClass(tab) {
  if (tab.key === addClientTabKeys.allergies) {
    return allergiesTabClass.value
  }

  return undefined
}

const ssnDisplayValue = computed(() => {
  const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
  if (ssnEditing.value) {
    return formatTaxIdInput(digits)
  }
  if (digits.length) {
    return formatSsnMasked(digits)
  }
  const storedMask = normalizeIdNumberMaskedDisplay(
    form.value[ck.idNumberMasked],
  )
  if (storedMask) {
    return storedMask
  }

  return ''
})

const taxIdTypeBadge = computed(() => {
  const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
  if (!digits.length) {
    return null
  }

  return detectTaxIdType(digits)
})

const taxIdTypeBadgeLabel = computed(() => {
  if (taxIdTypeBadge.value === 'ITIN') {
    return t('taxIdTypeItin')
  }
  if (taxIdTypeBadge.value === 'SSN') {
    return t('taxIdTypeSsn')
  }

  return ''
})

const ssnEditFullNumberHint = computed(() => {
  if (!isEditMode.value || !ssnEditing.value) {
    return false
  }
  if (!hasStoredIdNumberMasked(form.value, ck)) {
    return false
  }
  const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])

  return digits.length < 9
})

const ssnFieldRules = computed(() => [
  () => {
    const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
    if (!digits.length && hasStoredIdNumberMasked(form.value, ck)) {
      return true
    }
    if (!digits.length) {
      return true
    }
    const blockKey = getSsnBlockValidationErrorKey(digits)
    if (blockKey) {
      return t(blockKey)
    }
    if (ssnEditing.value) {
      return true
    }

    return isValidTaxIdDigits(digits) || t('taxIdInvalid')
  },
])

const activeTabLabel = computed(() => tabLabelFor(activeTab.value))

const patientFullName = computed(() => {
  const parts = [
    form.value[ck.firstName],
    form.value[ck.middleName],
    form.value[ck.lastName],
  ]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
  const suffix = String(form.value[ck.suffix] ?? '').trim()
  let name = parts.join(' ')
  if (suffix) {
    name = `${name} ${suffix}`.trim()
  }

  return name
})

const cancelModalTitle = computed(() =>
  isEditMode.value
    ? t('cancelClientEditTitle')
    : t('cancelClientRegistrationTitle'),
)

const cancelModalMessage = computed(() =>
  isEditMode.value
    ? t('cancelClientEditMessage')
    : t('cancelClientRegistrationMessage'),
)

const saveSuccessMessage = computed(() =>
  isEditMode.value
    ? t('clientUpdatedSuccess')
    : t('clientSavedSuccess'),
)

function scrollFormPanelToTop() {
  nextTick(() => {
    const el = panelScrollRef.value
    if (el) {
      el.scrollTop = 0
    }
  })
}

watch([activeTab, activeSubTab], () => {
  emit('tab-label', activeTabLabel.value)
  scrollFormPanelToTop()
}, { immediate: true })

function getClientMapOptions() {
  return {
    resolveAgeUnitCode: catalogs.resolveAgeUnitCode,
    defaultAgeUnitValue: catalogs.defaultAgeUnitValue,
    resolveCatalogSelectValue: catalogs.resolveCatalogSelectValue,
    prefixSelectOptions: prefixSelectOptions.value,
    suffixSelectOptions: suffixSelectOptions.value,
    raceSelectOptions: raceSelectOptions.value,
    ethnicitySelectOptions: ethnicitySelectOptions.value,
    genderSelectOptions: genderOptions.value,
    contactTypeSelectOptions: contactTypeSelectOptions.value,
    relationshipTypeSelectOptions: relationshipTypeSelectOptions.value,
  }
}

async function loadClientForEdit() {
  const id = props.clientId
  if (id == null || id === '') {
    throw new Error(t('clientLoadError'))
  }
  const mapped = await siteStore.buildEditFormForClient(
    id,
    getClientMapOptions(),
  )
  applyForm(mapped)
}

let addClientFormMountAlive = true
onBeforeUnmount(() => {
  addClientFormMountAlive = false
})

async function runCatalogLoadSafely() {
  try {
    await loadBasicInfoCatalogs()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('catalogLoadError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
  }
}

async function runCliniciansLoadSafely() {
  try {
    await loadCliniciansForAddClient()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('cliniciansLoadError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
  }
}

async function runEditClientLoad() {
  try {
    await loadClientForEdit()
    markPristine()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('clientLoadError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
    emit('cancel')
  }
}

async function initializeAddClientForm() {
  await runCatalogLoadSafely()
  if (!addClientFormMountAlive) {
    return
  }

  await runCliniciansLoadSafely()
  if (!addClientFormMountAlive) {
    return
  }

  if (isEditMode.value) {
    await runEditClientLoad()

    return
  }

  await nextTick()
  if (!addClientFormMountAlive) {
    return
  }
  resetForm()
  markPristine()
  await nextTick()
  if (!addClientFormMountAlive) {
    return
  }
  duplicateBannerTeleportReady.value = true
}

onMounted(async() => {
  if (isEditMode.value) {
    initialLoading.value = true
  }

  try {
    await initializeAddClientForm()
  } finally {
    if (isEditMode.value) {
      initialLoading.value = false
    }
  }
})

function requiredLabel(text) {
  return `${text} *`
}

function onSsnFocus() {
  ssnEditing.value = true
  ssnInputRef.value?.resetValidation?.()
}

function onSsnKeydown(evt) {
  const controlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]
  if (controlKeys.includes(evt.key) || evt.ctrlKey || evt.metaKey) {
    return
  }
  if (!/^\d$/.test(evt.key)) {
    evt.preventDefault()
  }
}

function onSsnInput(val) {
  form.value[ck.socialSecurityNumber] = normalizeSsnDigits(val)
  nextTick(() => {
    ssnInputRef.value?.validate?.()
  })
}

async function onSsnBlur() {
  ssnEditing.value = false
  form.value[ck.socialSecurityNumber] = normalizeSsnDigits(
    form.value[ck.socialSecurityNumber],
  )
  await nextTick()
  await ssnInputRef.value?.validate?.()
}

async function onNextFiltered() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  await nextTick()
  const ok = await validateCurrentTabAndUnlock()
  if (!ok) {
    return
  }
  goNextTabFiltered()
}

async function onNext() {
  return onNextFiltered()
}

function onReferralSchedule() {
  activeSubTab.value = CARE_COORDINATION_APPOINTMENTS_SUB_TAB
  $q.notify({
    type: quasarNotifyTypes.info,
    message: t('referralScheduleRedirect'),
    position: 'top',
  })
}

function onReferralCreateFollowUp(draft) {
  const section = form.value[clientFormSections.followUps]
  if (!section?.visible || !draft?.reference) {
    return
  }
  if (followUpExistsForReferral(section, draft.reference)) {
    return
  }
  const pendingItem = mapPendingFollowUpFromDraft(draft)
  form.value[clientFormSections.followUps] = {
    ...section,
    pending: [...(section.pending ?? []), pendingItem],
  }
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('referralFollowUpAdded'),
    position: 'top',
  })
}

function onReferralRemoveFollowUp(referralId) {
  const section = form.value[clientFormSections.followUps]
  if (!section?.visible || !referralId) {
    return
  }
  if (!followUpExistsForReferral(section, referralId)) {
    return
  }
  form.value[clientFormSections.followUps] = removeFollowUpForReferral(
    section,
    referralId,
  )
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('referralFollowUpRemoved'),
    position: 'top',
  })
}

function duplicateSaveGateActive() {
  return (
    !isEditMode.value
    && duplicateHasActiveMatches.value
    && !duplicateIgnoredBanner.value
    && !duplicateOpenedAnyMatch.value
  )
}

function emitNavigateExistingClient(clientId) {
  emit('navigate-existing', { clientId: String(clientId) })
}

function onDuplicateIgnore() {
  duplicateIgnoreMatchesBanner()
}

async function onDuplicateReview(match) {
  duplicateMarkOpenedMatch()
  duplicateReviewMatch.value = match
  duplicateReviewOpen.value = true
  duplicateReviewLoading.value = true
  duplicateReviewPreview.value = null
  try {
    duplicateReviewPreview.value = await siteStore.buildEditFormForClient(
      String(match.patientId),
      getClientMapOptions(),
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('clientLoadError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
    duplicateReviewOpen.value = false
  } finally {
    duplicateReviewLoading.value = false
  }
}

function onDuplicateReviewNotMatch() {
  const id = duplicateReviewMatch.value?.patientId
  if (id != null) {
    duplicateDiscardMatch(id)
  }
  duplicateReviewMatch.value = null
  duplicateReviewPreview.value = null
}

function onDuplicateReviewCancel() {
  duplicateReviewMatch.value = null
  duplicateReviewPreview.value = null
}

function onDuplicateOpenExistingRequest() {
  const rawId = duplicateReviewMatch.value?.patientId
  duplicateReviewOpen.value = false
  if (rawId == null || rawId === '') {
    return
  }
  if (hasAddClientDataBeyondFirstLastName(form.value)) {
    duplicatePendingNavigateClientId.value = rawId
    duplicateNavigateConfirmOpen.value = true

    return
  }
  emitNavigateExistingClient(rawId)
}

function onDuplicateNavigateConfirm() {
  const id = duplicatePendingNavigateClientId.value
  duplicateNavigateConfirmOpen.value = false
  duplicatePendingNavigateClientId.value = null
  if (id != null && id !== '') {
    emitNavigateExistingClient(id)
  }
}

function onDuplicateSaveConfirm() {
  duplicateSaveConfirmOpen.value = false
  emitClientDuplicateAudit('CREATE_NEW_CLIENT_DESPITE_DUPLICATES', {
    actionTaken: 'Create New Client Anyway',
    newClientDataSummary: summarizeNewClientDataForAudit(form.value),
    matchedClientIds: duplicateFilteredMatches.value.map(m => m.patientId),
    highestMatchPercentage: duplicateHighestMatchScore.value,
  })
  void executeSave()
}

function applyMappedClientSections(mapped) {
  if (!mapped) {
    return
  }
  const nextAllergies = mapped[clientFormSections.allergies]
  if (nextAllergies) {
    form.value[clientFormSections.allergies] = nextAllergies
  }
  const nextFollowUps = mapped[clientFormSections.followUps]
  if (nextFollowUps) {
    form.value[clientFormSections.followUps] = nextFollowUps
  }
}

async function executeSave() {
  saving.value = true
  try {
    let savedClientId = props.clientId
    if (isEditMode.value) {
      const updated = await siteStore.updateClient(
        props.clientId,
        form.value,
        t,
      )

      // Keep allergy rows in sync with backend-generated ids so:
      // - the table refreshes after save
      // - delete reason requirements apply to persisted rows
      const mapped = (updated && typeof updated === 'object')
        ? siteStore.buildEditFormFromClient(
          updated,
          getClientMapOptions(),
        )
        : null

      applyMappedClientSections(mapped)
    } else {
      const created = await siteStore.createClient(form.value, t)
      savedClientId = created?.id ?? created?.client_id ?? savedClientId
      if (created && typeof created === 'object') {
        const mappedCreate = siteStore.buildEditFormFromClient(
          created,
          getClientMapOptions(),
        )
        applyMappedClientSections(mappedCreate)
      }
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: saveSuccessMessage.value,
      position: 'top',
    })
    emit('saved', {
      clientId: savedClientId,
      activeTab: activeTab.value,
    })
    markPristine()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('clientSaveError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

async function onSave() {
  if (!canSaveForm.value) {
    return
  }
  const ok = await validateAllTabs()
  if (!ok) {
    return
  }
  if (duplicateSaveGateActive()) {
    duplicateSaveConfirmOpen.value = true

    return
  }
  await executeSave()
}

function dismissCancelConfirm() {
  cancelConfirmOpen.value = false
}

function confirmDiscard() {
  cancelConfirmOpen.value = false
  emit('cancel')
}

function requestClose() {
  if (isDirty()) {
    cancelConfirmOpen.value = true

    return
  }
  emit('cancel')
}

watch(visibleTabOrder, () => {
  ensureActiveTabVisible()
}, { immediate: true })

watch([activeTab, visibleTabOrder], () => {
  ensureActiveTabVisible()
})

defineExpose({
  requestClose,
  onSave,
  onNext,
  goPreviousTab: goPreviousTabFiltered,
  canGoNext: canGoNextFiltered,
  canGoPrevious: canGoPreviousFiltered,
  canSaveForm,
  saving,
  initialLoading,
  formBusy,
  formBusyMessage,
})
</script>

