import { computed, ref } from 'vue'
import {
  addClientBasicInfoCatalogNames,
  catalogNames,
  clientAgeUnitOptions,
  clientAgeUnitValues,
  clientGenderValues,
  clientSuffixOptions,
} from 'components/constants.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'

function fallbackGenderOptions(t) {
  return [
    { label: t('genderMale'), value: clientGenderValues.male },
    { label: t('genderFemale'), value: clientGenderValues.female },
    { label: t('genderUnknown'), value: clientGenderValues.unknown },
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

  const genderOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.gender]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return fallbackGenderOptions(t)
  })

  const prefixSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.prefix]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
        { emptyOption: { label: t('prefixSelect'), value: '' } },
      )
    }

    return [{ label: t('prefixSelect'), value: '' }]
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

  const raceSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.race]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
        { emptyOption: { label: t('raceSelect'), value: '' } },
      )
    }

    return [{ label: t('raceSelect'), value: '' }]
  })

  const ethnicitySelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.ethnicity]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
        { emptyOption: { label: t('ethnicitySelect'), value: '' } },
      )
    }

    return [{ label: t('ethnicitySelect'), value: '' }]
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
    genderOptions,
    prefixSelectOptions,
    suffixSelectOptions,
    raceSelectOptions,
    ethnicitySelectOptions,
    ageUnitSelectOptions,
    resolveAgeUnitCode,
    yearsAgeUnitValue,
    defaultAgeUnitValue,
  }
}
