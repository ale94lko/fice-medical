import { computed, ref } from 'vue'
import {
  addClientBasicInfoCatalogNames,
  catalogNames,
  clientAgeUnitOptions,
  clientAgeUnitValues,
  clientContactTypeValues,
  clientGenderValues,
  clientRelationshipTypeValues,
  clientSuffixOptions,
} from 'components/constants.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'
import { fetchAllCliniciansSelectOptions } from 'src/utils/clinicians-api.js'

function fallbackGenderOptions(t) {
  return [
    { label: t('genderMale'), value: clientGenderValues.male },
    { label: t('genderFemale'), value: clientGenderValues.female },
    { label: t('genderUnknown'), value: clientGenderValues.unknown },
  ]
}

function fallbackSuffixOptions(t) {
  return clientSuffixOptions
    .filter(o => o.value !== '')
    .map(o => ({
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

function fallbackContactTypeOptions() {
  return Object.values(clientContactTypeValues).map(value => ({
    label: value,
    value,
  }))
}

function fallbackRelationshipTypeOptions() {
  return Object.values(clientRelationshipTypeValues).map(value => ({
    label: value,
    value,
  }))
}

export function useAddClientCatalogs(t) {
  const loading = ref(false)
  const loaded = ref(false)
  const catalogsByName = ref({})
  const cliniciansLoading = ref(false)
  const cliniciansLoaded = ref(false)
  const assignedClinicianSelectOptions = ref([])

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

  async function loadCliniciansForAddClient() {
    if (cliniciansLoading.value) {
      return
    }
    cliniciansLoading.value = true
    try {
      assignedClinicianSelectOptions.value =
        await fetchAllCliniciansSelectOptions()
      cliniciansLoaded.value = true
    } finally {
      cliniciansLoading.value = false
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

  const preferredLanguageOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.language]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return []
  })

  const prefixSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.prefix]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return []
  })

  const suffixSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.suffix]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return fallbackSuffixOptions(t)
  })

  const raceSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.race]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return []
  })

  const ethnicitySelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.ethnicity]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return []
  })

  const referralSourceSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.referralSource]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return []
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

  const contactTypeSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.contactType]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return fallbackContactTypeOptions()
  })

  const relationshipTypeSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.relationshipType]
    if (catalog) {
      return mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(catalog),
      )
    }

    return fallbackRelationshipTypeOptions()
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

  function resolveCatalogSelectValue(options, raw) {
    const trimmed = String(raw ?? '').trim()
    if (!trimmed || !Array.isArray(options) || !options.length) {
      return null
    }
    const needle = trimmed.toLowerCase()
    const token = needle.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const match = options.find(option => {
      const value = String(option?.value ?? '').trim()
      if (!value) {
        return false
      }
      const valueLower = value.toLowerCase()
      const valueToken = valueLower
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')

      return valueLower === needle || valueToken === token
    })

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

  const payerCatalogItems = computed(() => {
    const catalog = catalogsByName.value[catalogNames.payer]

    return catalogItemsFromCatalog(catalog)
  })

  const allergyNameSelectOptions = computed(() => {
    const catalog = catalogsByName.value[catalogNames.allergyName]
    const items = catalogItemsFromCatalog(catalog)

    if (!Array.isArray(items) || items.length === 0) {
      return []
    }

    const opts = []
    const seen = new Set()

    for (const item of items) {
      const raw = item?.allergy_name ?? item?.name ?? item?.label ?? item?.code
      const label = String(raw ?? '').trim()
      if (!label) {
        continue
      }

      const key = label.toLowerCase()
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      opts.push({ label, value: label })
    }

    opts.sort((a, b) => a.label.localeCompare(b.label))
    return opts
  })

  return {
    loading,
    loaded,
    catalogsByName,
    cliniciansLoading,
    cliniciansLoaded,
    assignedClinicianSelectOptions,
    loadBasicInfoCatalogs,
    loadCliniciansForAddClient,
    genderOptions,
    preferredLanguageOptions,
    prefixSelectOptions,
    suffixSelectOptions,
    raceSelectOptions,
    ethnicitySelectOptions,
    referralSourceSelectOptions,
    ageUnitSelectOptions,
    contactTypeSelectOptions,
    relationshipTypeSelectOptions,
    payerCatalogItems,
    allergyNameSelectOptions,
    resolveAgeUnitCode,
    resolveCatalogSelectValue,
    yearsAgeUnitValue,
    defaultAgeUnitValue,
  }
}
