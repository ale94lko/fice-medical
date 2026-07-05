export const CONTACT_SAVE_BUSINESS_RULE_BANNERS = {
  minorClientGuardianContactRequired: {
    titleKey: 'minorClientGuardianContactRequiredTitle',
    messageKey: 'minorClientGuardianContactRequiredMessage',
    icon: 'groups',
  },
  otherContactContactMethodRequired: {
    titleKey: 'otherContactContactMethodRequiredTitle',
    messageKey: 'otherContactContactMethodRequiredMessage',
    icon: 'contact_phone',
  },
}

export function resolveContactSaveBusinessRuleBanner(errorKey, t) {
  if (!errorKey) {
    return null
  }

  const config = CONTACT_SAVE_BUSINESS_RULE_BANNERS[errorKey]
  if (config) {
    return {
      title: t(config.titleKey),
      message: t(config.messageKey),
      icon: config.icon,
    }
  }

  return {
    title: null,
    message: t(errorKey),
    icon: 'error_outline',
  }
}
