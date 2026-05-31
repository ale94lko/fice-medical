<template>
  <div
    v-if="profiles.length"
    class="add-client-form__insurance-table-wrap">
    <table class="add-client-form__insurance-table">
      <thead>
        <tr>
          <th>{{ t('insuranceColPriority') }}</th>
          <th>{{ t('insuranceColPayerPlan') }}</th>
          <th>{{ t('insuranceColType') }}</th>
          <th>{{ t('insuranceColMemberId') }}</th>
          <th>{{ t('insuranceColStatus') }}</th>
          <th class="add-client-form__insurance-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="profile in profiles" :key="profile.id">
          <td>
            <span
              :class="[
                'add-client-form__insurance-priority-badge',
                priorityBadgeClass(profile.priority),
              ]">
              {{ profile.priority }}
            </span>
          </td>
          <td>
            <div class="add-client-form__insurance-payer-cell">
              <span class="add-client-form__insurance-payer-name">
                {{ profile.payerName || '—' }}
              </span>
              <span
                v-if="profile.planName"
                class="add-client-form__insurance-plan-name">
                {{ profile.planName }}
              </span>
            </div>
          </td>
          <td>{{ profile.insuranceType || '—' }}</td>
          <td>{{ profile.memberId || '—' }}</td>
          <td>
            <span
              :class="[
                'add-client-form__insurance-status-badge',
                statusBadgeClass(profile.status),
              ]">
              {{ statusLabel(profile.status) }}
            </span>
          </td>
          <td class="add-client-form__insurance-table-actions">
            <q-btn
              flat
              round
              dense
              color="grey-7"
              icon="visibility"
              :data-testid="tid.insuranceRowView(profile.id)"
              :aria-label="t('insuranceActionView')"
              @click="emit('view', profile)"
            />
            <q-btn
              flat
              round
              dense
              color="grey-7"
              icon="edit"
              :data-testid="tid.insuranceRowEdit(profile.id)"
              :aria-label="t('edit')"
              @click="emit('edit', profile)"
            />
            <q-btn
              flat
              round
              dense
              color="grey-7"
              icon="delete"
              :data-testid="tid.insuranceRowDelete(profile.id)"
              :aria-label="t('delete')"
              @click="emit('delete', profile)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="add-client-form__insurance-empty text-body2 text-grey-7">
    {{ emptyLabel }}
  </p>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  clientInsurancePriorityValues,
  clientInsuranceStatusValues,
} from 'components/constants.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

defineProps({
  profiles: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['view', 'edit', 'delete'])

const { t } = useI18n()

function priorityBadgeClass(priority) {
  if (priority === clientInsurancePriorityValues.primary) {
    return 'add-client-form__insurance-priority-badge--primary'
  }
  if (priority === clientInsurancePriorityValues.secondary) {
    return 'add-client-form__insurance-priority-badge--secondary'
  }
  if (priority === clientInsurancePriorityValues.tertiary) {
    return 'add-client-form__insurance-priority-badge--tertiary'
  }

  return ''
}

function statusBadgeClass(status) {
  if (status === clientInsuranceStatusValues.active) {
    return 'add-client-form__insurance-status-badge--active'
  }
  if (status === clientInsuranceStatusValues.pendingVerification) {
    return 'add-client-form__insurance-status-badge--pending'
  }
  if (status === clientInsuranceStatusValues.expired) {
    return 'add-client-form__insurance-status-badge--expired'
  }

  return 'add-client-form__insurance-status-badge--inactive'
}

function statusLabel(status) {
  if (status === clientInsuranceStatusValues.pendingVerification) {
    return t('insuranceStatusPendingShort')
  }

  return status || '—'
}
</script>
