<template>
  <div
    v-if="profiles.length"
    class="fmh-table-wrap">
    <table
      class="fmh-table
        fmh-table--wide">
      <thead>
        <tr>
          <th>{{ t('insuranceColPriority') }}</th>
          <th>{{ t('insuranceColPayerPlan') }}</th>
          <th>{{ t('insuranceColType') }}</th>
          <th>{{ t('insuranceColMemberId') }}</th>
          <th>{{ t('insuranceColStatus') }}</th>
          <th class="fmh-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="profile in profiles" :key="profile.id">
          <td>
            <span
              :class="[
                'insurance-priority-badge',
                priorityBadgeClass(profile.priority),
              ]">
              {{ profile.priority }}
            </span>
          </td>
          <td>
            <div class="insurance-payer-cell">
              <span class="insurance-payer-name">
                {{ profile.payerName || '—' }}
              </span>
              <span
                v-if="profile.planName"
                class="insurance-plan-name">
                {{ profile.planName }}
              </span>
            </div>
          </td>
          <td>{{ profile.insuranceType || '—' }}</td>
          <td>{{ profile.memberId || '—' }}</td>
          <td>
            <span
              :class="[
                'insurance-status-badge',
                statusBadgeClass(profile.status),
              ]">
              {{ statusLabel(profile.status) }}
            </span>
          </td>
          <td class="fmh-table-actions">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="visibility"
              :data-testid="tid.insuranceRowView(profile.id)"
              :aria-label="t('insuranceActionView')"
              @click="emit('view', profile)"
            />
            <q-btn
              v-if="canEdit"
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="edit"
              :data-testid="tid.insuranceRowEdit(profile.id)"
              :aria-label="t('edit')"
              @click="emit('edit', profile)"
            />
            <q-btn
              v-if="canEdit && canDeactivate(profile)"
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="toggle_off"
              :data-testid="tid.insuranceRowDeactivate(profile.id)"
              :aria-label="t('insuranceActionDeactivate')"
              @click="emit('deactivate', profile)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="fmh-empty text-body2 text-grey-7">
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
  canEdit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'deactivate'])

const { t } = useI18n()

function priorityBadgeClass(priority) {
  if (priority === clientInsurancePriorityValues.primary) {
    return 'insurance-priority-badge--primary'
  }
  if (priority === clientInsurancePriorityValues.secondary) {
    return 'insurance-priority-badge--secondary'
  }
  if (priority === clientInsurancePriorityValues.tertiary) {
    return 'insurance-priority-badge--tertiary'
  }

  return ''
}

function statusBadgeClass(status) {
  if (status === clientInsuranceStatusValues.active) {
    return 'insurance-status-badge--active'
  }
  if (status === clientInsuranceStatusValues.pendingVerification) {
    return 'insurance-status-badge--pending'
  }
  if (status === clientInsuranceStatusValues.expired) {
    return 'insurance-status-badge--expired'
  }

  return 'insurance-status-badge--inactive'
}

function statusLabel(status) {
  if (status === clientInsuranceStatusValues.pendingVerification) {
    return t('insuranceStatusPendingShort')
  }

  return status || '—'
}

function canDeactivate(profile) {
  const s = profile?.status

  return (
    s === clientInsuranceStatusValues.active
    || s === clientInsuranceStatusValues.pendingVerification
  )
}
</script>
