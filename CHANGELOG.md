# Changelog

## [0.1.4] - 2025-02-27

### Changed
- **i18n Default Locale** - Changed default locale from Turkish (`tr`) to English (`en`) for better global accessibility
- **Parent Page Language Detection** - Added automatic detection of parent page language from `html[lang]` attribute or `navigator.language`
- **Locale Priority** - Implemented priority order: `prop.locale` > `config.locale` > `parent page lang` > `browser detect` > `en` (fallback)

### Improved
- Enhanced internationalization strategy for multi-language support
- Better language detection for seamless user experience across different locales

## [0.1.3] - 2025-02-20

### Added
- Initial React package release
