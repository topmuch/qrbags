// Phone number utilities — country dial codes & formatting

export interface CountryInfo {
  code: string;       // ISO 2-letter code: 'FR', 'SN', 'SA'...
  dial: string;       // Dial code: '+33', '+221', '+966'...
  flag: string;       // Emoji flag: '🇫🇷', '🇸🇳', '🇸🇦'...
  name: string;       // Country name (French)
}

// Complete country dial code map — covers all COUNTRY_LANGUAGE_MAP entries + extras
export const COUNTRIES: CountryInfo[] = [
  // ─── French speaking ───
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: 'LU', dial: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: 'MC', dial: '+377', flag: '🇲🇨', name: 'Monaco' },
  { code: 'MG', dial: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'CF', dial: '+236', flag: '🇨🇫', name: 'République centrafricaine' },
  { code: 'TD', dial: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CD', dial: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: 'GA', dial: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'RW', dial: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: 'BI', dial: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: 'DJ', dial: '+253', flag: '🇩🇯', name: 'Djibouti' },
  { code: 'KM', dial: '+269', flag: '🇰🇲', name: 'Comores' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'MR', dial: '+222', flag: '🇲🇷', name: 'Mauritanie' },
  { code: 'SC', dial: '+248', flag: '🇸🇨', name: 'Seychelles' },

  // ─── English speaking ───
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong' },

  // ─── Arabic speaking ───
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: 'EG', dial: '+20',  flag: '🇪🇬', name: 'مصر' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'المغرب' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'الجزائر' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'تونس' },
  { code: 'LY', dial: '+218', flag: '🇱🇾', name: 'ليبيا' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: 'SY', dial: '+963', flag: '🇸🇾', name: 'سوريا' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'عُمان' },
  { code: 'YE', dial: '+967', flag: '🇾🇪', name: 'اليمن' },
  { code: 'PS', dial: '+970', flag: '🇵🇸', name: 'فلسطين' },
  { code: 'SD', dial: '+249', flag: '🇸🇩', name: 'السودان' },

  // ─── Other popular destinations ───
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Türkiye' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italia' },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'España' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Deutschland' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Nederland' },
  { code: 'CH', dial: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: '中国' },
  { code: 'JP', dial: '+81',  flag: '🇯🇵', name: '日本' },
  { code: 'KR', dial: '+82',  flag: '🇰🇷', name: '대한민국' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'México' },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Россия' },
  { code: 'TH', dial: '+66',  flag: '🇹🇭', name: 'ไทย' },
  { code: 'ID', dial: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: 'VN', dial: '+84',  flag: '🇻🇳', name: 'Việt Nam' },
  { code: 'BN', dial: '+673', flag: '🇧🇳', name: 'Brunei' },
  { code: 'SL', dial: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: 'GM', dial: '+220', flag: '🇬🇲', name: 'Gambia' },
  { code: 'LR', dial: '+231', flag: '🇱🇷', name: 'Liberia' },
  { code: 'CV', dial: '+238', flag: '🇨🇻', name: 'Cabo Verde' },
  { code: 'ST', dial: '+239', flag: '🇸🇹', name: 'São Tomé' },
  { code: 'GQ', dial: '+240', flag: '🇬🇶', name: 'Guinée équatoriale' },
  { code: 'ER', dial: '+291', flag: '🇪🇷', name: 'Eritrea' },
  { code: 'ET', dial: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: 'SO', dial: '+252', flag: '🇸🇴', name: 'Somalia' },
  { code: 'MW', dial: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: 'ZM', dial: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: 'ZW', dial: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: 'MZ', dial: '+258', flag: '🇲🇿', name: 'Moçambique' },
  { code: 'AO', dial: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: 'GW', dial: '+245', flag: '🇬🇼', name: 'Guiné-Bissau' },
  { code: 'SZ', dial: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: 'LS', dial: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: 'NA', dial: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: 'BW', dial: '+267', flag: '🇧🇼', name: 'Botswana' },
];

// Lookup map: countryCode → CountryInfo
export const COUNTRY_MAP: Record<string, CountryInfo> = {};
COUNTRIES.forEach(c => { COUNTRY_MAP[c.code] = c; });

/**
 * Get the dial code for a country code.
 * Returns '+33' for 'FR', etc. Defaults to '+33' (France).
 */
export function getDialCode(countryCode: string): string {
  return COUNTRY_MAP[countryCode.toUpperCase()]?.dial ?? '+33';
}

/**
 * Get full CountryInfo for a country code.
 * Returns France as default.
 */
export function getCountryInfo(countryCode: string): CountryInfo {
  return COUNTRY_MAP[countryCode.toUpperCase()] ?? COUNTRIES[0];
}

/**
 * Normalize a phone number to international format (digits only, with country code).
 * If the number already starts with the dial code digits, keep as-is.
 * Otherwise, prepend the dial code digits (without +).
 *
 * Examples:
 *   normalizePhone('0612345678', 'FR') → '33612345678'
 *   normalizePhone('+33612345678', 'FR') → '33612345678'
 *   normalizePhone('33612345678', 'FR') → '33612345678'
 *   normalizePhone('771234567', 'SN') → '221771234567'
 */
export function normalizePhone(raw: string, countryCode: string): string {
  // Strip all non-digit characters
  const digits = raw.replace(/\D/g, '');
  const dialDigits = getDialCode(countryCode).replace('+', '');

  // Already starts with country dial digits
  if (digits.startsWith(dialDigits)) {
    return digits;
  }

  // Starts with '00' (international prefix) → replace with country code
  if (digits.startsWith('00')) {
    return dialDigits + digits.slice(2);
  }

  // Local number (starts with 0 or not) → prepend dial code, remove leading 0
  const localNumber = digits.startsWith('0') ? digits.slice(1) : digits;
  return dialDigits + localNumber;
}

/**
 * Format phone number for display: dial code + spaced local number.
 * Example: '+33 6 12 34 56 78'
 */
export function formatPhoneDisplay(raw: string, countryCode: string): string {
  const normalized = normalizePhone(raw, countryCode);
  const dialDigits = getDialCode(countryCode).replace('+', '');
  const localPart = normalized.startsWith(dialDigits) ? normalized.slice(dialDigits.length) : normalized;
  const dial = getDialCode(countryCode);

  // Group digits in pairs for readability
  const spaced = localPart.replace(/(\d{1,2})(?=\d)/g, '$1 ');
  return `${dial} ${spaced}`;
}

// ─── Country detection (client-side fallbacks, zéro appel réseau) ───────────

/** True si le code ISO 2 lettres fait partie des pays supportés par le sélecteur. */
export function isSupportedCountry(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return !!COUNTRY_MAP[code.toUpperCase()];
}

/**
 * Fuseau horaire principal → pays ISO pour chaque pays de COUNTRIES.
 * Utilisé comme repli hors-ligne quand la géoloc IP échoue :
 * 'Africa/Dakar' → 'SN', 'Asia/Riyadh' → 'SA', 'Europe/Paris' → 'FR'...
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Europe
  'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Luxembourg': 'LU',
  'Europe/Monaco': 'MC', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES',
  'Europe/Berlin': 'DE', 'Europe/Lisbon': 'PT', 'Europe/Amsterdam': 'NL',
  'Europe/Zurich': 'CH', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR',
  // Afrique francophone & anglophone
  'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Bamako': 'ML',
  'Africa/Ouagadougou': 'BF', 'Africa/Niamey': 'NE', 'Africa/Lome': 'TG',
  'Africa/Porto-Novo': 'BJ', 'Africa/Bangui': 'CF', 'Africa/Ndjamena': 'TD',
  'Africa/Brazzaville': 'CG', 'Africa/Kinshasa': 'CD', 'Africa/Lubumbashi': 'CD',
  'Africa/Libreville': 'GA', 'Africa/Douala': 'CM', 'Africa/Kigali': 'RW',
  'Africa/Bujumbura': 'BI', 'Africa/Djibouti': 'DJ', 'Africa/Comoro': 'KM',
  'Africa/Conakry': 'GN', 'Africa/Nouakchott': 'MR', 'Africa/Mahe': 'SC',
  'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN',
  'Africa/Tripoli': 'LY', 'Africa/Cairo': 'EG', 'Africa/Khartoum': 'SD',
  'Africa/Nairobi': 'KE', 'Africa/Kampala': 'UG', 'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Addis_Ababa': 'ET',
  'Africa/Maputo': 'MZ', 'Africa/Harare': 'ZW', 'Africa/Lusaka': 'ZM',
  'Africa/Windhoek': 'NA', 'Africa/Gaborone': 'BW', 'Africa/Maseru': 'LS',
  'Africa/Mbabane': 'SZ', 'Africa/Antananarivo': 'MG', 'Africa/Freetown': 'SL',
  'Africa/Monrovia': 'LR', 'Africa/Banjul': 'GM', 'Africa/Sao_Tome': 'ST',
  'Africa/Malabo': 'GQ', 'Africa/Asmara': 'ER', 'Africa/Mogadishu': 'SO',
  'Africa/Blantyre': 'MW', 'Africa/Luanda': 'AO', 'Africa/Bissau': 'GW',
  // Moyen-Orient / monde arabe
  'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY', 'Asia/Baghdad': 'IQ',
  'Asia/Kuwait': 'KW', 'Asia/Qatar': 'QA', 'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM', 'Asia/Aden': 'YE', 'Asia/Gaza': 'PS', 'Asia/Hebron': 'PS',
  // Amériques, Asie, Océanie
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ',
  'Asia/Kolkata': 'IN', 'Asia/Karachi': 'PK', 'Asia/Manila': 'PH',
  'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Hong_Kong': 'HK',
  'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
  'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Ho_Chi_Minh': 'VN',
};

/** 'Africa/Dakar' → 'SN' (null si fuseau inconnu ou pays non supporté). */
export function countryFromTimezone(tz: string): string | null {
  if (!tz) return null;
  const cc = TIMEZONE_TO_COUNTRY[tz];
  return cc && isSupportedCountry(cc) ? cc : null;
}

/**
 * Détection pays 100 % locale (aucun réseau) — repli quand l'API IP échoue.
 * 1. Région des locales navigateur : 'fr-SN' → 'SN', 'ar-SA' → 'SA'
 * 2. Fuseau horaire : 'Africa/Dakar' → 'SN'
 * Retourne null si rien de fiable (l'appelant garde alors son défaut).
 */
export function detectCountryClientSide(): string | null {
  if (typeof navigator === 'undefined') return null;

  // 1. Région des locales (Intl.Locale gère les cas exotiques 'zh-Hant-TW')
  const locales: string[] = [
    ...((navigator.languages as readonly string[] | undefined) ?? []),
    navigator.language,
  ].filter((l): l is string => typeof l === 'string' && l.length > 0);
  for (const loc of locales) {
    try {
      const region = new Intl.Locale(loc).region; // ex. 'SN'
      if (region && isSupportedCountry(region)) return region.toUpperCase();
    } catch {
      // Intl.Locale indisponible / locale malformée → segment régional simple
      const m = loc.match(/[-_]([A-Za-z]{2})$/);
      if (m && isSupportedCountry(m[1])) return m[1].toUpperCase();
    }
  }

  // 2. Fuseau horaire
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cc = countryFromTimezone(tz ?? '');
    if (cc) return cc;
  } catch {
    /* Intl indisponible */
  }

  return null;
}
