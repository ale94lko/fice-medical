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
            :class="contactSubTabClass(subTab)">
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
              <span
                v-if="contactSubTabErrorCount(subTab.key) > 0"
                class="contact-subtab-error-badge"
                :aria-label="t('tabErrorCountAria', {
                  count: contactSubTabErrorCount(subTab.key),
                })">
                {{ contactSubTabErrorCount(subTab.key) }}
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
            <div
              v-else-if="subTab.key !== CONTACT_SUB_TAB_ADD"
              class="contact-subtab-label row items-center no-wrap">
              <q-icon
                :name="subTab.icon"
                size="18px"
                class="contact-subtab-icon"
              />
              <span class="contact-subtab-text ellipsis">
                {{ subTab.label }}
              </span>
              <span
                v-if="contactSubTabErrorCount(subTab.key) > 0"
                class="contact-subtab-error-badge"
                :aria-label="t('tabErrorCountAria', {
                  count: contactSubTabErrorCount(subTab.key),
                })">
                {{ contactSubTabErrorCount(subTab.key) }}
              </span>
            </div>
            <div
              v-else
              class="contact-subtab-label row items-center no-wrap">
              <q-icon
                :name="subTab.icon"
                size="18px"
                class="contact-subtab-icon"
              />
              <span class="contact-subtab-text ellipsis">
                {{ subTab.label }}
              </span>
            </div>
          </q-tab>
        </q-tabs>
      </div>
    </div>

    <div class="content">
      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
        class="add-client-form__form"
        :data-testid="tid.formFields"
        @submit.prevent="onSave">
        <div
          ref="panelScrollRef"
          class="panel-scroll">
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
                        :aria-checked="catalogRadioValuesMatch(
                          form[ck.gender],
                          opt.value,
                        )"
                        :disabled="catalogsLoading"
                        :data-testid="tid.genderOption(opt.value)"
                        :class="{
                          'gender-option--selected':
                            catalogRadioValuesMatch(form[ck.gender], opt.value),
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
                <div class="col-12">
                  <AddClientLabeledField
                    :label="t('preferredLanguage')"
                    :test-id="tid.field(ck.preferredLanguage)">
                    <div
                      class="gender-options"
                      role="radiogroup"
                      :aria-label="t('preferredLanguage')">
                      <button
                        v-for="opt in preferredLanguageOptions"
                        :key="opt.value"
                        type="button"
                        role="radio"
                        class="gender-option"
                        :aria-checked="catalogRadioValuesMatch(
                          form[ck.preferredLanguage],
                          opt.value,
                        )"
                        :disabled="catalogsLoading"
                        :data-testid="tid.preferredLanguageOption(opt.value)"
                        :class="{
                          'gender-option--selected':
                            catalogRadioValuesMatch(
                              form[ck.preferredLanguage],
                              opt.value,
                            ),
                        }"
                        @click="form[ck.preferredLanguage] = opt.value">
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

          <template v-if="!isEditMode">
            <q-separator class="section-separator" />

            <AddClientAccordionSection
              icon="groups"
              :title="t('referralInformation')"
              section-test-id="add-client-accordion-referral-information"
              :toggle-test-id="tid.accordionToggle('referral-information')">
              <template #hint>
                {{ t('referralInformationSubtitle') }}
              </template>
              <div class="row q-col-gutter-sm q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="requiredLabel(t('referralSource'))"
                    :test-id="tid.field(ck.referralSource)">
                    <FormSelect
                      v-model="form[ck.referralSource]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="referralSourceSelectOptions"
                      :placeholder="t('referralSourcePlaceholder')"
                      :rules="rules.referralSource"
                      :test-id="tid.field(ck.referralSource)"
                    />
                  </AddClientLabeledField>
                </div>
                <template v-if="!isIntakeSelfReferred">
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="requiredLabel(t('referralDate'))"
                      :test-id="tid.field(ck.referralIntakeDate)">
                      <ClientDateField
                        v-model="form[ck.referralIntakeDate]"
                        :rules="rules.referralIntakeDate"
                        :close-label="t('close')"
                        :test-id="tid.field(ck.referralIntakeDate)"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('referralReferringProvider')"
                      :test-id="tid.field(ck.referringProvider)">
                      <q-input
                        v-model="form[ck.referringProvider]"
                        outlined
                        hide-bottom-space
                        :maxlength="referralProviderNameMaxLength"
                        :placeholder="
                          t('referralReferringProviderPlaceholder')
                        "
                        :data-testid="tid.field(ck.referringProvider)">
                        <template #append>
                          <q-icon name="search" />
                        </template>
                      </q-input>
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('referralReferringOrganization')"
                      :test-id="tid.field(ck.referringOrganization)">
                      <q-input
                        v-model="form[ck.referringOrganization]"
                        outlined
                        hide-bottom-space
                        :maxlength="referralOrganizationMaxLength"
                        :placeholder="
                          t('referralReferringOrganizationPlaceholder')
                        "
                        :data-testid="tid.field(ck.referringOrganization)">
                        <template #append>
                          <q-icon name="search" />
                        </template>
                      </q-input>
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12">
                    <AddClientLabeledField
                      :label="t('referralSourceDetailsOptional')"
                      :test-id="tid.field(ck.referralSourceDetails)">
                      <q-input
                        v-model="form[ck.referralSourceDetails]"
                        outlined
                        hide-bottom-space
                        type="textarea"
                        autogrow
                        counter
                        :maxlength="referralIntakeSourceDetailsMaxLength"
                        :placeholder="t('referralSourceDetailsPlaceholder')"
                        :data-testid="tid.field(ck.referralSourceDetails)"
                      />
                    </AddClientLabeledField>
                  </div>
                </template>
                <div
                  v-else-if="form[ck.referralSource]"
                  class="col-12">
                  <div class="insurance-info-banner">
                    <q-icon name="info" size="20px" class="q-mr-sm" />
                    <div>
                      <div class="text-weight-medium">
                        <strong>
                          {{ t('referralIntakeSelfReferredTitle') }}
                        </strong>
                      </div>
                      <div>
                      {{ t('referralIntakeSelfReferredMessage') }}
                      {{ t('referralIntakeSelfReferredNoRecord') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AddClientAccordionSection>
          </template>

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
                    <ClinicianFormSelect
                      :model-value="form[ck.clinicians]"
                      multiple
                      clearable
                      :show-selected-in-field="false"
                      class="full-width"
                      :disable="basicInfoReadonly"
                      :loading="cliniciansLoading"
                      :options="assignedClinicianOptions"
                      :placeholder="t('assignedCliniciansPlaceholder')"
                      :test-id="tid.field(ck.clinicians)"
                      @update:model-value="onAssignedCliniciansUpdate"
                    />
                  </AddClientLabeledField>
                </div>
                <div
                  v-if="selectedAssignedClinicians.length"
                  class="col-12">
                  <AdminTablePanel
                    class="assigned-clinicians-table-panel"
                    :show-column-settings="false">
                    <AssignedCliniciansTable
                      :entries="selectedAssignedClinicians"
                      :can-edit="!basicInfoReadonly"
                      :empty-label="t('assignedCliniciansEmpty')"
                      @delete="removeAssignedClinician"
                      @set-primary="setPrimaryAssignedClinician"
                    />
                  </AdminTablePanel>
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
            :client-id="props.clientId"
            :readonly="contactReadonly"
            :can-view="canViewContactTab"
            :rules="contactRules"
            :prefix-select-options="prefixSelectOptions"
            :suffix-select-options="suffixSelectOptions"
            :contact-type-options="contactTypeSelectOptions"
            :relationship-type-options="relationshipTypeSelectOptions"
            :catalogs-loading="catalogsLoading"
            :save-business-rule-error-key="contactSaveBusinessRuleErrorKey"
            :other-contact-missing-contact-method-ids="
              otherContactMissingContactMethodIds"
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
            :patient-age="form[ck.age]"
            :patient-age-unit="form[ck.ageUnit]"
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
            :client-id="props.clientId"
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
                :patient-id="props.clientId"
                :can-view="canViewVitalsTab"
                :clinician-options="assignedClinicianOptions"
                :patient-dob="form[ck.dob]"
                :patient-age="form[ck.age]"
                :patient-age-unit="form[ck.ageUnit]"
                :patient-gender="form[ck.gender]"
              />
              <AddClientScreeningsTab
                v-else-if="subTab.key === CLINICAL_SCREENINGS_SUB_TAB"
                :patient-id="props.clientId"
                :screenings="clientScreenings"
                :can-view="canViewScreeningsTab"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientLabsTab
                v-else-if="subTab.key === CLINICAL_LABS_SUB_TAB"
                v-model="form[clientFormSections.labs]"
                :patient-id="props.clientId"
                :can-view="canViewLabsTab"
                :can-add="canAddLabs"
                :can-edit="canEditLabs"
                :can-delete="canDeleteLabs"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientMedicationsTab
                v-else-if="subTab.key === CLINICAL_MEDICATIONS_SUB_TAB"
                :client-id="props.clientId"
                :medications="clientMedications"
                :pharmacies="clientPharmacies"
                :prescription-consent="clientPrescriptionConsent"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientCarePlansTab
                v-else-if="subTab.key === CLINICAL_CARE_PLANS_SUB_TAB"
                :client-id="props.clientId"
                :care-plans="clientCarePlans"
                :clinician-options="assignedClinicianOptions"
              />
              <AddClientClinicalNotesTab
                v-else-if="subTab.key === CLINICAL_CLINICAL_NOTES_SUB_TAB"
                :client-id="props.clientId"
                :clinical-notes="clientClinicalNotes"
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
                :referrals="clientReferrals"
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
                :appointments="clientAppointments"
              />
              <AddClientAuthorizationsTab
                v-else-if="
                  subTab.key === CARE_COORDINATION_AUTHORIZATIONS_SUB_TAB
                "
                :client-id="props.clientId"
                :clinician-options="assignedClinicianOptions"
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
              <AddClientBillingTab
                v-if="subTab.key === FINANCIALS_BILLING_SUB_TAB"
                :client-id="props.clientId"
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
              <AddClientAttachmentsTab
                v-if="subTab.key === DOCUMENTS_ATTACHMENTS_SUB_TAB"
                :client-id="props.clientId"
                :can-view="canViewAttachmentsTab"
                :can-upload="canUploadAttachments"
                :can-delete="canDeleteAttachments"
                @navigate-source="onAttachmentNavigateSource"
              />
              <AddClientConsentsTab
                v-else-if="subTab.key === DOCUMENTS_CONSENTS_SUB_TAB"
                :client-id="props.clientId"
                :client-display-name="patientFullName"
                :contact-section="form[contactSectionKey]"
                :can-view="canViewConsentsTab"
              />
              <div
                v-else
                class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>
          </q-tab-panels>
        </div>

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
import ClinicianFormSelect from '../ClinicianFormSelect.vue'
import AssignedCliniciansTable from '../AssignedCliniciansTable.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ModalComponent from '../ModalComponent.vue'
import AddClientContactTab from '../AddClientContactTab.vue'
import AddClientFamilyMedicalHistoryTab
  from '../AddClientFamilyMedicalHistoryTab.vue'
import AddClientVitalsTab from '../AddClientVitalsTab.vue'
import AddClientScreeningsTab from '../AddClientScreeningsTab.vue'
import AddClientLabsTab from '../AddClientLabsTab.vue'
import AddClientMedicationsTab from '../AddClientMedicationsTab.vue'
import AddClientCarePlansTab from '../AddClientCarePlansTab.vue'
import AddClientClinicalNotesTab from '../AddClientClinicalNotesTab.vue'
import AddClientFollowUpsTab from '../AddClientFollowUpsTab.vue'
import AddClientAppointmentsTab from '../AddClientAppointmentsTab.vue'
import AddClientReferralsTab from '../AddClientReferralsTab.vue'
import AddClientAuthorizationsTab from
  '../AddClientAuthorizationsTab.vue'
import AddClientAllergiesTab from '../AddClientAllergiesTab.vue'
import AddClientInsuranceTab from '../AddClientInsuranceTab.vue'
import AddClientAttachmentsTab from '../AddClientAttachmentsTab.vue'
import AddClientBillingTab from '../AddClientBillingTab.vue'
import AddClientConsentsTab from '../AddClientConsentsTab.vue'
import AddClientAccordionSection from '../AccordionSection.vue'
import AppLoadingOverlay from '../AppLoadingOverlay.vue'
import BannerComponent from '../BannerComponent.vue'
import AddClientDuplicateMatchReviewDialog
  from '../AddClientDuplicateMatchReviewDialog.vue'
import { useSiteStore } from '../../stores/site-store.js'
import { useAddClientForm } from 'src/composables/useAddClientForm.js'
import { useRegisterUnsavedChanges } from
  'src/composables/useUnsavedChangesRegistry.js'
import { useAddClientCatalogs } from 'src/composables/useAddClientCatalogs.js'
import { useContactSubTabs } from 'src/composables/useContactSubTabs.js'
import { resolveOtherContactTabLabel } from 'src/utils/client-contact-form.js'
import { formatClientDisplayName } from 'src/utils/client-display-name.js'
import {
  ensureCliniciansSelectionOrder,
  withPrimaryClinicianFirst,
} from 'src/utils/client-clinicians-form.js'
import {
  addClientTabKeys,
  clientFormSections,
  clientMaxAge,
  clientNameMaxLength,
  clientPermissionNames,
  quasarNotifyTypes,
  referralIntakeSourceDetailsMaxLength,
  referralOrganizationMaxLength,
  referralProviderNameMaxLength,
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
import { clientChartKey } from 'components/helpers.js'
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
  CLINICAL_SCREENINGS_SUB_TAB,
  CLINICAL_LABS_SUB_TAB,
  CLINICAL_MEDICATIONS_SUB_TAB,
  CLINICAL_CARE_PLANS_SUB_TAB,
  CLINICAL_CLINICAL_NOTES_SUB_TAB,
  CARE_COORDINATION_FOLLOW_UPS_SUB_TAB,
  CARE_COORDINATION_REFERRALS_SUB_TAB,
  CARE_COORDINATION_APPOINTMENTS_SUB_TAB,
  CARE_COORDINATION_AUTHORIZATIONS_SUB_TAB,
  DOCUMENTS_ATTACHMENTS_SUB_TAB,
  DOCUMENTS_CONSENTS_SUB_TAB,
  FINANCIALS_BILLING_SUB_TAB,
} from 'src/composables/useAddClientSubTabs.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useAddClientTabPermissions } from
  'src/composables/useAddClientTabPermissions.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import { useClientProgressiveMatch }
  from 'src/composables/useClientProgressiveMatch.js'
import { emitClientDuplicateAudit } from 'src/utils/client-duplicate-audit.js'
import { summarizeNewClientDataForAudit }
  from 'src/utils/client-duplicate-audit-summary.js'
import { hasAddClientDataBeyondFirstLastName }
  from 'src/utils/add-client-beyond-minimal-identity.js'
import { createClientReferral } from 'src/utils/referral-api.js'
import {
  buildIntakeReferralFromForm,
  clearNonSelfReferralIntakeFields,
  isSelfReferredSource,
  shouldCreateIntakeReferral,
} from 'src/utils/referral-intake.js'
import { todayDateUs } from 'src/utils/client-form.js'

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
  initialActiveSubTab: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'saved',
  'cancel',
  'tab-label',
  'navigate-existing',
  'profile-photo-change',
])

const isEditMode = computed(() => props.mode === 'edit')

const {
  visibleMainTabs,
  visibleTabOrder,
  canEditBasicInfo,
  canEditContact,
  canEditAllergies,
  canEditInsurance,
  canViewMainTabFor,
  canViewSubTabFor,
  canSaveForm,
  filterSubTabsFor,
} = useAddClientTabPermissions(isEditMode)

const {
  canDeleteLabs,
  canAddLabs,
  canEditLabs,
} = useClientPermissions()

const mainTabs = visibleMainTabs

const basicInfoReadonly = computed(() => !canEditBasicInfo.value)
const contactReadonly = computed(() => !canEditContact.value)
const allergiesReadonly = computed(() => !canEditAllergies.value)
const insuranceReadonly = computed(() => !canEditInsurance.value)
const canViewContactTab = canViewMainTabFor(addClientTabKeys.contact)
const canViewAllergiesTab = canViewMainTabFor(addClientTabKeys.allergies)
const canViewInsuranceTab = canViewMainTabFor(addClientTabKeys.insurance)

const canViewVitalsTab = canViewSubTabFor(CLINICAL_VITALS_SUB_TAB)
const canViewScreeningsTab = canViewSubTabFor(CLINICAL_SCREENINGS_SUB_TAB)
const canViewLabsTab = canViewSubTabFor(CLINICAL_LABS_SUB_TAB)
const canViewFollowUpsTab = canViewSubTabFor(
  CARE_COORDINATION_FOLLOW_UPS_SUB_TAB,
)
const canViewAttachmentsTab = canViewSubTabFor(DOCUMENTS_ATTACHMENTS_SUB_TAB)
const canViewConsentsTab = canViewSubTabFor(DOCUMENTS_CONSENTS_SUB_TAB)

const authStore = useAuthStore()
const canUploadAttachments = computed(() =>
  hasPermission(authStore.permissions, clientPermissionNames.uploadFiles),
)
const canDeleteAttachments = computed(() =>
  hasPermission(authStore.permissions, clientPermissionNames.deleteFiles),
)
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

const clientScreenings = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.screenings

  return Array.isArray(list) ? list : []
})

const clientClinicalNotes = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.clinical_notes ?? raw?.clinicalNotes

  return Array.isArray(list) ? list : []
})

const clientCarePlans = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.care_plans ?? raw?.carePlans

  return Array.isArray(list) ? list : []
})

const clientMedications = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.medications ?? raw?.Medications

  return Array.isArray(list) ? list : []
})

const clientPharmacies = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.pharmacies ?? raw?.Pharmacies

  return Array.isArray(list) ? list : []
})

const clientPrescriptionConsent = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return null
  }
  const raw = siteStore.clientListSourceById[id]

  return raw?.prescription_consent
    ?? raw?.prescriptionConsent
    ?? null
})

const clientReferrals = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.referrals

  return Array.isArray(list) ? list : []
})

const clientAppointments = computed(() => {
  const id = String(props.clientId ?? '').trim()
  if (!id) {
    return []
  }
  const raw = siteStore.clientListSourceById[id]
  const list = raw?.appointments

  return Array.isArray(list) ? list : []
})

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
  preferredLanguageOptions,
  prefixSelectOptions,
  suffixSelectOptions,
  raceSelectOptions,
  ethnicitySelectOptions,
  referralSourceSelectOptions,
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
  contactSaveBusinessRuleErrorKey,
  contactSubTabErrorCounts,
  otherContactMissingContactMethodIds,
  tabErrorCount,
  tabLabelFor,
  hasSubTabs,
  activeSubTab,
} = useAddClientForm(t, catalogs, {
  allergiesTabRef,
  fmhTabRef,
  vitalsTabRef,
  panelScrollRef,
  contactTabRef: addClientContactTabRef,
  initialActiveTab: props.initialActiveTab,
  initialActiveSubTab: props.initialActiveSubTab,
  validateReferralIntake: () => !isEditMode.value,
})

useRegisterUnsavedChanges(() => isDirty())

const filteredCurrentSubTabs = computed(() => {
  if (!hasSubTabs.value) {
    return []
  }

  return filterSubTabsFor(activeTab.value)
})

const isIntakeSelfReferred = computed(() =>
  isSelfReferredSource(form.value[ck.referralSource]),
)

watch(
  () => form.value[ck.referralSource],
  (source, previous) => {
    if (isSelfReferredSource(source)) {
      clearNonSelfReferralIntakeFields(form.value)

      return
    }
    const switchedFromSelf = source && isSelfReferredSource(previous)
    const needsDefaultDate = !form.value[ck.referralIntakeDate]
    if (switchedFromSelf && needsDefaultDate) {
      form.value[ck.referralIntakeDate] = todayDateUs()
    }
  },
)

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
  CONTACT_SUB_TAB_ADD,
} = useContactSubTabs(
  () => form.value[contactSectionKey],
  contactCatalogOptions,
)

function navigableSubTabKeysFor(tab) {
  if (tab === addClientTabKeys.contact) {
    return contactSubTabs.value
      .filter(item => (
        item.key !== CONTACT_SUB_TAB_ADD && !item.disabled
      ))
      .map(item => item.key)
  }

  return filterSubTabsFor(tab).map(item => item.key)
}

function activeSubTabKeyFor(tab) {
  if (tab === addClientTabKeys.contact) {
    return activeContactSubTab.value
  }

  return activeSubTab.value
}

function setActiveSubTabKey(tab, subKey) {
  if (tab === addClientTabKeys.contact) {
    activeContactSubTab.value = subKey

    return
  }
  activeSubTab.value = subKey
}

function canAdvanceWithinSubTabs() {
  const tab = activeTab.value
  const subs = navigableSubTabKeysFor(tab)
  if (!subs.length) {
    return false
  }
  const subIdx = subs.indexOf(activeSubTabKeyFor(tab))

  return subIdx >= 0 && subIdx < subs.length - 1
}

function canGoBackWithinSubTabs() {
  const tab = activeTab.value
  const subs = navigableSubTabKeysFor(tab)
  if (!subs.length) {
    return false
  }
  const subIdx = subs.indexOf(activeSubTabKeyFor(tab))

  return subIdx > 0
}

function canGoNextFiltered() {
  if (canAdvanceWithinSubTabs()) {
    return true
  }
  const idx = tabIndexInVisibleOrder(activeTab.value)

  return idx >= 0 && idx < visibleTabOrder.value.length - 1
}

function canGoPreviousFiltered() {
  if (canGoBackWithinSubTabs()) {
    return true
  }

  return tabIndexInVisibleOrder(activeTab.value) > 0
}

function goNextTabFiltered() {
  const tab = activeTab.value
  const subs = navigableSubTabKeysFor(tab)
  const subIdx = subs.indexOf(activeSubTabKeyFor(tab))
  if (subs.length && subIdx >= 0 && subIdx < subs.length - 1) {
    setActiveSubTabKey(tab, subs[subIdx + 1])

    return
  }
  const idx = tabIndexInVisibleOrder(tab)
  if (idx < 0 || idx >= visibleTabOrder.value.length - 1) {
    return
  }
  const nextTab = visibleTabOrder.value[idx + 1]
  activeTab.value = nextTab
  const nextSubs = navigableSubTabKeysFor(nextTab)
  if (nextSubs.length) {
    setActiveSubTabKey(nextTab, nextSubs[0])
  }
}

function goPreviousTabFiltered() {
  const tab = activeTab.value
  const subs = navigableSubTabKeysFor(tab)
  const subIdx = subs.indexOf(activeSubTabKeyFor(tab))
  if (subs.length && subIdx > 0) {
    setActiveSubTabKey(tab, subs[subIdx - 1])

    return
  }
  const idx = tabIndexInVisibleOrder(tab)
  if (idx <= 0) {
    return
  }
  const prevTab = visibleTabOrder.value[idx - 1]
  activeTab.value = prevTab
  const prevSubs = navigableSubTabKeysFor(prevTab)
  if (prevSubs.length) {
    setActiveSubTabKey(prevTab, prevSubs[prevSubs.length - 1])
  }
}

watch(activeTab, async(tab, prev) => {
  if (tab === addClientTabKeys.contact && prev !== tab) {
    if (Object.keys(contactSubTabErrorCounts.value).length) {
      await nextTick()
      await addClientContactTabRef.value?.applySaveValidation?.()

      return
    }
    activeContactSubTab.value = CONTACT_SUB_TAB_SELF
  }
})

watch(activeContactSubTab, async() => {
  if (!isContactTabActive.value) {
    return
  }
  scrollFormPanelToTop()
  if (contactSubTabErrorCount(activeContactSubTab.value) === 0) {
    return
  }
  await nextTick()
  await addClientContactTabRef.value?.validateActiveSubTab?.()
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

function contactSubTabErrorCount(tabKey) {
  return contactSubTabErrorCounts.value[tabKey] ?? 0
}

function contactSubTabClass(subTab) {
  return {
    'contact-subtab--removable': subTab.removable,
    'contact-subtab--error': contactSubTabErrorCount(subTab.key) > 0,
  }
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

function catalogRadioValuesMatch(stored, optionValue) {
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

const patientFullName = computed(() => formatClientDisplayName(
  form.value,
  {
    prefixSelectOptions: prefixSelectOptions.value,
    suffixSelectOptions: suffixSelectOptions.value,
  },
))

const selectedAssignedClinicians = computed(() => {
  const selectedIds = Array.isArray(form.value[ck.clinicians])
    ? form.value[ck.clinicians].map(id => String(id))
    : []
  if (!selectedIds.length) {
    return []
  }
  const byId = new Map(
    (assignedClinicianOptions.value ?? []).map(option => [
      String(option.value),
      option,
    ]),
  )

  return selectedIds
    .map((id, index) => {
      const option = byId.get(id)
      if (!option) {
        return null
      }

      return {
        ...option,
        isPrimary: index === 0,
      }
    })
    .filter(Boolean)
})

function onAssignedCliniciansUpdate(nextIds) {
  const previous = Array.isArray(form.value[ck.clinicians])
    ? form.value[ck.clinicians]
    : []
  form.value[ck.clinicians] = ensureCliniciansSelectionOrder(
    previous,
    nextIds,
  )
}

function setPrimaryAssignedClinician(row) {
  const primaryId = String(row?.value ?? '').trim()
  if (!primaryId) {
    return
  }
  const current = Array.isArray(form.value[ck.clinicians])
    ? form.value[ck.clinicians]
    : []
  form.value[ck.clinicians] = withPrimaryClinicianFirst(
    current,
    primaryId,
  )
}

function removeAssignedClinician(row) {
  const removeId = String(row?.value ?? '')
  if (!removeId) {
    return
  }
  const current = Array.isArray(form.value[ck.clinicians])
    ? form.value[ck.clinicians]
    : []
  form.value[ck.clinicians] = current.filter(
    id => String(id) !== removeId,
  )
}

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

watch(
  () => form.value[ck.photoFileId],
  value => {
    emit('profile-photo-change', value ?? null)
  },
  { immediate: true },
)

function setProfilePhotoFileId(fileId) {
  const parsed = Number(fileId)
  form.value[ck.photoFileId] = Number.isFinite(parsed) && parsed > 0
    ? parsed
    : null
}

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
    preferredLanguageSelectOptions: preferredLanguageOptions.value,
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
  if (canAdvanceWithinSubTabs()) {
    goNextTabFiltered()

    return
  }
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

function onAttachmentNavigateSource({ tab, subTab }) {
  if (!tab) {
    return
  }
  activeTab.value = tab
  if (subTab) {
    activeSubTab.value = subTab
  }
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

function matchChartKey(match) {
  return String(match?.clientNumber ?? '').trim()
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
      matchChartKey(match),
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
  const chartKey = matchChartKey(duplicateReviewMatch.value)
  duplicateReviewOpen.value = false
  if (!chartKey) {
    return
  }
  if (hasAddClientDataBeyondFirstLastName(form.value)) {
    duplicatePendingNavigateClientId.value = chartKey
    duplicateNavigateConfirmOpen.value = true

    return
  }
  emitNavigateExistingClient(chartKey)
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
  // Keep clinical rows in sync with backend-generated ids so:
  // - tables refresh after save
  // - delete / deactivate reason requirements apply to persisted rows
  const nextAllergies = mapped[clientFormSections.allergies]
  if (nextAllergies) {
    form.value[clientFormSections.allergies] = nextAllergies
  }
  const nextInsurance = mapped[clientFormSections.insurance]
  if (nextInsurance) {
    form.value[clientFormSections.insurance] = nextInsurance
  }
  const nextFmh = mapped[clientFormSections.familyMedicalHistory]
  if (nextFmh) {
    form.value[clientFormSections.familyMedicalHistory] = nextFmh
  }
  const nextFollowUps = mapped[clientFormSections.followUps]
  if (nextFollowUps) {
    form.value[clientFormSections.followUps] = nextFollowUps
  }
}

async function createIntakeReferralAfterClientSave(clientId) {
  if (!clientId || !shouldCreateIntakeReferral(form.value)) {
    return
  }

  try {
    await createClientReferral(
      clientId,
      buildIntakeReferralFromForm(form.value, t),
    )
  } catch (referralError) {
    if (isAuthSessionEndUIError(referralError)) {
      return
    }
    const referralMsg = referralError?.response?.data?.message
      || referralError?.message
      || t('referralIntakeCreateError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(referralMsg),
      position: 'top',
    })
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

      // Remap clinical sections from the API response so local rows get
      // backend ids (allergies, insurance, FMH, follow-ups).
      const mapped = (updated && typeof updated === 'object')
        ? siteStore.buildEditFormFromClient(
          updated,
          getClientMapOptions(),
        )
        : null

      applyMappedClientSections(mapped)
    } else {
      const created = await siteStore.createClient(form.value, t)
      const createdNumber = clientChartKey(created)
      savedClientId = createdNumber || savedClientId
      if (created && typeof created === 'object') {
        const mappedCreate = siteStore.buildEditFormFromClient(
          created,
          getClientMapOptions(),
        )
        applyMappedClientSections(mappedCreate)
      }
      await createIntakeReferralAfterClientSave(createdNumber)
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
  setProfilePhotoFileId,
  profilePhotoReadonly: basicInfoReadonly,
  patientFullName,
})
</script>

