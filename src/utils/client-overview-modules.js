import {
  addClientTabKeys,
} from 'components/constants.js'
import {
  ADD_CLIENT_MAIN_TABS,
  ADD_CLIENT_SUB_TABS,
} from 'src/composables/useAddClientSubTabs.js'
import { filterSubTabs, canViewMainTab } from
  'src/composables/useAddClientTabPermissions.js'

const MODULE_TONES = {
  contact: 'blue',
  allergies: 'red',
  familyHistory: 'purple',
  screenings: 'blue',
  vitals: 'teal',
  clinicalNotes: 'slate',
  carePlans: 'green',
  labs: 'purple',
  referrals: 'orange',
  appointments: 'blue',
  careTeam: 'slate',
  authorizations: 'orange',
  tasks: 'slate',
  followUps: 'teal',
  billing: 'green',
  claims: 'purple',
  payments: 'green',
  attachments: 'slate',
  consents: 'blue',
  signedForms: 'teal',
  scannedDocs: 'slate',
}

const SIDEBAR_TAB_KEYS = new Set([
  addClientTabKeys.basic,
  addClientTabKeys.insurance,
  addClientTabKeys.contact,
])

export function buildClientOverviewModuleConfigs() {
  const modules = []

  for (const tab of ADD_CLIENT_MAIN_TABS) {
    if (SIDEBAR_TAB_KEYS.has(tab.key)) {
      continue
    }

    if (tab.hasSubTabs) {
      for (const sub of ADD_CLIENT_SUB_TABS[tab.key] ?? []) {
        modules.push({
          id: `${tab.key}.${sub.key}`,
          tabKey: tab.key,
          subTabKey: sub.key,
          icon: sub.icon,
          labelKey: sub.labelKey,
          parentLabelKey: tab.labelKey,
          tone: MODULE_TONES[sub.key] ?? 'slate',
          comingSoon: isComingSoonSubTab(tab.key, sub.key),
        })
      }
      continue
    }

    modules.push({
      id: tab.key,
      tabKey: tab.key,
      subTabKey: null,
      icon: tab.icon,
      labelKey: tab.labelKey,
      parentLabelKey: null,
      tone: MODULE_TONES[tab.key] ?? 'slate',
      comingSoon: false,
    })
  }

  return modules
}

function isComingSoonSubTab(parentKey, subTabKey) {
  if (parentKey === addClientTabKeys.financials) {
    return true
  }
  if (parentKey === addClientTabKeys.documents) {
    return true
  }
  if (parentKey === addClientTabKeys.careCoordination) {
    return ['careTeam', 'authorizations', 'tasks'].includes(subTabKey)
  }

  return false
}

export function filterOverviewModulesByPermissions(permissions) {
  return buildClientOverviewModuleConfigs().filter(module => {
    if (module.subTabKey) {
      const visible = filterSubTabs(permissions, module.tabKey)

      return visible.some(item => item.key === module.subTabKey)
    }

    if (module.tabKey === addClientTabKeys.allergies) {
      return canViewMainTab(permissions, module.tabKey, false)
    }

    return false
  })
}
