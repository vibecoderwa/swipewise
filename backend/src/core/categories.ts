import { CategoryId } from './data.js';

// Maps Plaid's personal_finance_category (primary + optional detailed) to our 15 buckets.
// Reference: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.pdf
type PlaidMapping = Record<string, CategoryId>;

const PRIMARY: PlaidMapping = {
  FOOD_AND_DRINK:             'dining',
  GENERAL_MERCHANDISE:        'shopping',
  HOME_IMPROVEMENT:           'utilities',
  MEDICAL:                    'health',
  PERSONAL_CARE:              'health',
  ENTERTAINMENT:              'entertainment',
  GENERAL_SERVICES:           'other',
  GOVERNMENT_AND_NON_PROFIT:  'other',
  INCOME:                     'other',
  LOAN_PAYMENTS:              'other',
  RENT_AND_UTILITIES:         'utilities',
  TRANSFER_IN:                'other',
  TRANSFER_OUT:               'other',
  TRANSPORTATION:             'other',
  TRAVEL:                     'travel',
};

// Detailed overrides take priority over primary
const DETAILED: PlaidMapping = {
  // Dining / groceries
  'FOOD_AND_DRINK_COFFEE':                      'dining',
  'FOOD_AND_DRINK_RESTAURANTS':                 'dining',
  'FOOD_AND_DRINK_FAST_FOOD':                   'dining',
  'FOOD_AND_DRINK_BAR':                         'dining',
  'FOOD_AND_DRINK_FOOD_DELIVERY_SERVICES':      'dining',
  'FOOD_AND_DRINK_CATERING_SERVICES':           'dining',
  'FOOD_AND_DRINK_GROCERIES':                   'groceries',
  'FOOD_AND_DRINK_FOOD_AND_DRINK_OTHER':        'dining',

  // Travel
  'TRAVEL_FLIGHTS':                             'flights',
  'TRAVEL_AIRLINES':                            'flights',
  'TRAVEL_LODGING':                             'hotels',
  'TRAVEL_HOTELS':                              'hotels',
  'TRAVEL_CAR_RENTAL':                          'travel',
  'TRAVEL_CRUISES':                             'travel',
  'TRAVEL_TAXI':                                'rideshare',
  'TRAVEL_PARKING':                             'travel',
  'TRAVEL_TOLLS':                               'travel',
  'TRAVEL_TRAVEL_OTHER':                        'travel',

  // Transportation
  'TRANSPORTATION_TAXIS_AND_RIDE_SHARING':      'rideshare',
  'TRANSPORTATION_PUBLIC_TRANSIT':              'transit',
  'TRANSPORTATION_GAS_STATIONS':                'gas',
  'TRANSPORTATION_PARKING':                     'travel',
  'TRANSPORTATION_TOLLS':                       'travel',
  'TRANSPORTATION_AUTOMOTIVE':                  'gas',

  // Entertainment
  'ENTERTAINMENT_MUSIC_AND_AUDIO':              'streaming',
  'ENTERTAINMENT_TV_AND_MOVIES':                'streaming',
  'ENTERTAINMENT_STREAMING_SERVICES':           'streaming',
  'ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_ARCADES': 'entertainment',
  'ENTERTAINMENT_CASINOS_AND_GAMBLING':         'entertainment',
  'ENTERTAINMENT_CONCERTS_AND_EVENTS':          'entertainment',
  'ENTERTAINMENT_ENTERTAINMENT_OTHER':          'entertainment',

  // Shopping
  'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES':    'online',
  'GENERAL_MERCHANDISE_BOOKSTORES':             'shopping',
  'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES': 'shopping',
  'GENERAL_MERCHANDISE_DEPARTMENT_STORES':      'shopping',
  'GENERAL_MERCHANDISE_ELECTRONICS':            'shopping',
  'GENERAL_MERCHANDISE_SPORTING_GOODS':         'shopping',

  // Utilities / bills
  'RENT_AND_UTILITIES_GAS_AND_ELECTRICITY':     'utilities',
  'RENT_AND_UTILITIES_INTERNET_AND_CABLE':      'utilities',
  'RENT_AND_UTILITIES_TELEPHONE':               'utilities',
  'RENT_AND_UTILITIES_WATER':                   'utilities',
  'RENT_AND_UTILITIES_RENT':                    'utilities',

  // Health
  'MEDICAL_DENTIST':                            'health',
  'MEDICAL_DOCTOR':                             'health',
  'MEDICAL_EYE_CARE':                           'health',
  'MEDICAL_PHARMACIES_AND_SUPPLEMENTS':         'health',
  'MEDICAL_VETERINARY_SERVICES':                'health',
  'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS':     'health',
  'PERSONAL_CARE_HAIR_AND_BEAUTY':              'health',
};

export function mapPlaidCategory(
  primary: string | undefined,
  detailed: string | undefined,
): CategoryId {
  if (detailed) {
    const key = detailed.toUpperCase().replace(/[^A-Z_]/g, '_');
    if (DETAILED[key]) return DETAILED[key];
  }
  if (primary) {
    const key = primary.toUpperCase().replace(/[^A-Z_]/g, '_');
    if (PRIMARY[key]) return PRIMARY[key];
  }
  return 'other';
}
