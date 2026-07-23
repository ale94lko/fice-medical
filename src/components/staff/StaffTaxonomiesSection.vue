<template>
  <AccordionSection
    icon="account_tree"
    :title="t('staffTaxonomiesTitle')">
    <div class="staff-taxonomies-section">
      <div class="row items-start q-mb-md">
        <div class="col">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('staffTaxonomiesSectionSubtitle') }}
          </p>
          <p
            v-if="fieldErrors.taxonomies"
            class="text-negative text-body2 q-mt-sm q-mb-none">
            {{ fieldErrors.taxonomies }}
          </p>
        </div>
        <div v-if="!readonly" class="col-auto">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="add"
            :label="t('staffTaxonomyAddTitle')"
            @click="openAddDialog"
          />
        </div>
      </div>

      <div class="row items-center q-mb-sm">
        <div class="col text-body2 text-weight-medium">
          {{ t('staffTaxonomiesAddedTitle', { count: taxonomies.length }) }}
        </div>
      </div>

      <div class="add-client-form__fmh-list-card">
        <AdminTablePanel
          class="staff-taxonomies-table-panel"
          :show-column-settings="false">
          <StaffTaxonomiesTable
            :taxonomies="taxonomies"
            :can-edit="!readonly"
            :can-delete="!readonly"
            :empty-label="t('staffTaxonomiesEmpty')"
            @set-primary="setPrimary"
            @delete="openDeleteDialog"
          />
        </AdminTablePanel>
      </div>

      <div class="staff-taxonomies-section__footer row items-center q-mt-md">
        <div class="staff-taxonomies-section__info col row items-start">
          <q-icon
            name="info"
            size="18px"
            color="primary"
            class="q-mr-sm"
          />
          <span class="text-body2 text-grey-7">
            {{ t('staffTaxonomiesHint') }}
          </span>
        </div>
        <div class="col-auto text-body2 text-weight-medium">
          {{ t('staffTaxonomiesTotal', { count: taxonomies.length }) }}
        </div>
      </div>
    </div>

    <StaffTaxonomyDialog
      v-model="addDialogOpen"
      :exclude-codes="existingCodes"
      :default-primary="!taxonomies.length"
      @save="onAddTaxonomy"
    />

    <ModalComponent
      v-model="deleteDialogOpen"
      test-id="staff-taxonomy-delete"
      :title="t('staffTaxonomyDeleteTitle')"
      :message="t('staffTaxonomyDeleteMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      @confirm="confirmDelete"
      @cancel="dismissDelete"
    />
  </AccordionSection>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AccordionSection from 'components/AccordionSection.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ModalComponent from 'components/ModalComponent.vue'
import StaffTaxonomiesTable from 'components/staff/StaffTaxonomiesTable.vue'
import StaffTaxonomyDialog from 'components/staff/StaffTaxonomyDialog.vue'
import { fetchProviderTaxonomyByCode } from
  'src/utils/provider-taxonomy-api.js'
import {
  ensureSinglePrimaryTaxonomy,
  mergeTaxonomyRowMeta,
} from 'src/utils/staff-taxonomy-display.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const addDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const pendingDeleteCode = ref(null)
const hydrating = ref(false)

const taxonomies = computed({
  get: () => props.modelValue ?? [],
  set: value => emit('update:modelValue', value),
})

const existingCodes = computed(() =>
  taxonomies.value
    .map(row => String(row.code ?? '').trim())
    .filter(Boolean),
)

function openAddDialog() {
  addDialogOpen.value = true
}

function onAddTaxonomy(row) {
  const code = String(row.code ?? '').trim()
  if (!code) {
    return
  }
  const others = taxonomies.value
    .filter(item => String(item.code ?? '').trim() !== code)
    .map(item => ({
      ...item,
      isPrimary: false,
    }))
  const next = row.isPrimary || !others.length
    ? [{ ...row, isPrimary: true }, ...others]
    : [...others, { ...row, isPrimary: false }]
  taxonomies.value = ensureSinglePrimaryTaxonomy(next)
}

function setPrimary(row) {
  const code = String(row?.code ?? '').trim()
  if (!code) {
    return
  }
  taxonomies.value = ensureSinglePrimaryTaxonomy(
    taxonomies.value.map(item => ({
      ...item,
      isPrimary: String(item.code ?? '').trim() === code,
    })),
  )
}

function openDeleteDialog(row) {
  pendingDeleteCode.value = String(row?.code ?? '').trim() || null
  deleteDialogOpen.value = true
}

function dismissDelete() {
  deleteDialogOpen.value = false
  pendingDeleteCode.value = null
}

function confirmDelete() {
  const code = pendingDeleteCode.value
  if (code) {
    taxonomies.value = ensureSinglePrimaryTaxonomy(
      taxonomies.value.filter(
        row => String(row.code ?? '').trim() !== code,
      ),
    )
  }
  dismissDelete()
}

async function hydrateTaxonomyMeta(rows) {
  if (hydrating.value || props.readonly) {
    return
  }
  const needsMeta = (rows ?? []).filter(row => {
    const code = String(row.code ?? '').trim()

    return code && !(row.grouping || row.classification || row.definition)
  })
  if (!needsMeta.length) {
    return
  }

  hydrating.value = true
  try {
    const updates = new Map()
    await Promise.all(needsMeta.map(async row => {
      const code = String(row.code ?? '').trim()
      try {
        const taxonomy = await fetchProviderTaxonomyByCode(code)
        if (taxonomy?.code) {
          updates.set(code, taxonomy)
        }
      } catch {
        // Keep existing row when catalog lookup fails.
      }
    }))
    if (!updates.size) {
      return
    }
    taxonomies.value = ensureSinglePrimaryTaxonomy(
      taxonomies.value.map(row => {
        const code = String(row.code ?? '').trim()
        const incoming = updates.get(code)
        if (!incoming) {
          return row
        }

        return mergeTaxonomyRowMeta(row, {
          ...incoming,
          isPrimary: row.isPrimary,
        })
      }),
    )
  } finally {
    hydrating.value = false
  }
}

watch(
  () => taxonomies.value.map(row => row.code).join('|'),
  () => {
    hydrateTaxonomyMeta(taxonomies.value)
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.staff-taxonomies-section {
  &__footer {
    gap: 12px;
  }

  &__info {
    padding: 10px 12px;
    border-radius: $radius-md;
    background: rgba($primary, 0.06);
  }
}
</style>
