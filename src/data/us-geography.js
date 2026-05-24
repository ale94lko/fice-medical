/** US states and dependent city/county lists for client address forms. */

export const usStates = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'District of Columbia', value: 'DC' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
]

const citiesByState = {
  AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'],
  AR: ['Little Rock', 'Fayetteville', 'Fort Smith'],
  CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Sacramento'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
  CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford'],
  DE: ['Wilmington', 'Dover', 'Newark'],
  DC: ['Washington'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
  GA: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'],
  HI: ['Honolulu', 'Hilo', 'Kailua'],
  ID: ['Boise', 'Meridian', 'Nampa'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
  KY: ['Louisville', 'Lexington', 'Bowling Green'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  ME: ['Portland', 'Lewiston', 'Bangor'],
  MD: ['Baltimore', 'Frederick', 'Rockville', 'Annapolis'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
  MI: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'],
  MN: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth'],
  MS: ['Jackson', 'Gulfport', 'Hattiesburg'],
  MO: ['Kansas City', 'Saint Louis', 'Springfield', 'Columbia'],
  MT: ['Billings', 'Missoula', 'Great Falls'],
  NE: ['Omaha', 'Lincoln', 'Bellevue'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
  NH: ['Manchester', 'Nashua', 'Concord'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Trenton'],
  NM: ['Albuquerque', 'Las Cruces', 'Santa Fe', 'Roswell'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
  OR: ['Portland', 'Salem', 'Eugene', 'Gresham'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
  RI: ['Providence', 'Warwick', 'Cranston'],
  SC: ['Charleston', 'Columbia', 'Greenville', 'Myrtle Beach'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'],
  VT: ['Burlington', 'South Burlington', 'Rutland'],
  VA: ['Virginia Beach', 'Norfolk', 'Richmond', 'Arlington'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'],
  WV: ['Charleston', 'Huntington', 'Morgantown'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
  WY: ['Cheyenne', 'Casper', 'Laramie'],
}

const countiesByStateCity = {
  'AL|Birmingham': ['Jefferson County'],
  'AL|Montgomery': ['Montgomery County'],
  'CA|Los Angeles': ['Los Angeles County'],
  'CA|San Diego': ['San Diego County'],
  'CA|San Francisco': ['San Francisco County'],
  'CA|Sacramento': ['Sacramento County'],
  'CO|Denver': ['Denver County'],
  'DC|Washington': ['District of Columbia'],
  'FL|Miami': ['Miami-Dade County'],
  'FL|Orlando': ['Orange County'],
  'FL|Tampa': ['Hillsborough County'],
  'GA|Atlanta': ['Fulton County'],
  'IL|Chicago': ['Cook County'],
  'MA|Boston': ['Suffolk County'],
  'MI|Detroit': ['Wayne County'],
  'MN|Minneapolis': ['Hennepin County'],
  'MO|Kansas City': ['Jackson County'],
  'NV|Las Vegas': ['Clark County'],
  'NY|New York': ['New York County', 'Kings County', 'Queens County'],
  'NY|Buffalo': ['Erie County'],
  'NC|Charlotte': ['Mecklenburg County'],
  'OH|Columbus': ['Franklin County'],
  'OH|Cleveland': ['Cuyahoga County'],
  'PA|Philadelphia': ['Philadelphia County'],
  'TX|Houston': ['Harris County'],
  'TX|Dallas': ['Dallas County'],
  'TX|Austin': ['Travis County'],
  'TX|San Antonio': ['Bexar County'],
  'VA|Virginia Beach': ['Virginia Beach city'],
  'WA|Seattle': ['King County'],
}

export function getCitiesForState(stateCode) {
  const code = String(stateCode ?? '').trim().toUpperCase()
  if (!code) {
    return []
  }

  return (citiesByState[code] ?? []).map(city => ({
    label: city,
    value: city,
  }))
}

export function getCountiesForStateCity(stateCode, city) {
  const code = String(stateCode ?? '').trim().toUpperCase()
  const cityName = String(city ?? '').trim()
  if (!code || !cityName) {
    return []
  }

  const key = `${code}|${cityName}`
  const counties = countiesByStateCity[key] ?? [`${cityName} County`]

  return counties.map(county => ({
    label: county,
    value: county,
  }))
}
