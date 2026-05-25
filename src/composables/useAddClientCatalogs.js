import { computed, ref } from 'vue'
import {
  addClientBasicInfoCatalogNames,
  catalogNames,
  clientAgeUnitOptions,
  clientAgeUnitValues,
  clientSexValues,
  clientSuffixOptions,
} from 'components/constants.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'

function fallbackSexOptions(t) {
  return [
    { label: t('sexMale'), value: clientSexValues.male },
    { label: t('sexFemale'), value: clientSexValues.female },
    { label: t('sexUnknown'), value: clientSexValues.unknown },
  ]
}

function fallbackSuffixOptions(t) {
  return clientSuffixOptions.map(o => ({
    label: t(o.labelKey),
    value: o.value,
  }))
}

function fallbackAgeUnitOptions(t) {
  return clientAgeUnitOptions.map(o => ({
    label: t(o.labelKey),
    value: o.value,
  }))
}

export function useAddClientCatalogs(t) {
  const loading = ref(false)
  const loaded = ref(false)
  const catalogsByName = ref({})

  async function loadBasicInfoCatalogs() {
    if (loading.value) {
      return
    }
    loading.value = true
    try {
      catalogsByName.value = await fetchCatalogsByNames(
        addClientBasicInfoCatalogNames,
      )
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  const sexOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.sex]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return fallbackSexOptions(t)
  })

  const suffixSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.suffix]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
        { emptyOption: { label: t('suffixSelect'), value: '' } },
      )
    }

    return fallbackSuffixOptions(t)
  })

  const ageUnitSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.ageUnit]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return fallbackAgeUnitOptions(t)
  })

  function resolveAgeUnitCode(code) {
    const needle = String(code ?? '').trim().toLowerCase()
    if (!needle) {
      return null
    }
    const match = ageUnitSelectOptions.value.find(
      option => String(option.value).trim().toLowerCase() === needle,
    )

    return match?.value ?? null
  }

  function yearsAgeUnitValue() {
    return (
      resolveAgeUnitCode(clientAgeUnitValues.years)
      ?? clientAgeUnitValues.years
    )
  }

  function defaultAgeUnitValue() {
    return yearsAgeUnitValue()
  }

  return {
    loading,
    loaded,
    catalogsByName,
    loadBasicInfoCatalogs,
    sexOptions,
    suffixSelectOptions,
    ageUnitSelectOptions,
    resolveAgeUnitCode,
    yearsAgeUnitValue,
    defaultAgeUnitValue,
  }
}
