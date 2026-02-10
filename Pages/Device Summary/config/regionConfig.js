// A structured mapping of Indian states to their geographical regions.
// Updated to include a separate North East Zone.
export const stateToRegion = {
  // North Zone
  'jammu and kashmir': 'North',
  'ladakh': 'North',
  'himachal pradesh': 'North',
  'punjab': 'North',
  'haryana': 'North',
  'uttarakhand': 'North',
  'uttar pradesh': 'North',
  'delhi': 'North',
  'chandigarh': 'North',

  // West Zone
  'rajasthan': 'West',
  'gujarat': 'West',
  'goa': 'West',
  'maharashtra': 'West',
  'dadra and nagar haveli and daman and diu': 'West',

  // South Zone
  'andhra pradesh': 'South',
  'telangana': 'South',
  'karnataka': 'South',
  'kerala': 'South',
  'tamil nadu': 'South',
  'puducherry': 'South',
  'andaman and nicobar islands': 'South',
  'lakshadweep': 'South',

  // East Zone
  'bihar': 'East',
  'jharkhand': 'East',
  'odisha': 'East',
  'west bengal': 'East',
  
  // North East Zone
  'sikkim': 'North East',
  'arunachal pradesh': 'North East',
  'assam': 'North East',
  'manipur': 'North East',
  'meghalaya': 'North East',
  'mizoram': 'North East',
  'nagaland': 'North East',
  'tripura': 'North East',

  // Central Zone
  'madhya pradesh': 'Central',
  'chhattisgarh': 'Central',

  // Africa Zone
  'tanzania': 'East Africa',
};

// A comprehensive mapping of districts to their respective states.
// This list does not need to be changed.
export const districtToState = {
  // Andhra Pradesh
  'visakhapatnam': 'andhra pradesh', 'vijayawada': 'andhra pradesh', 'guntur': 'andhra pradesh', 'nellore': 'andhra pradesh', 'kurnool': 'andhra pradesh',

  // Arunachal Pradesh
  'itanagar': 'arunachal pradesh', 'tawang': 'arunachal pradesh',

  // Assam
  'guwahati': 'assam', 'dispur': 'assam', 'dibrugarh': 'assam', 'silchar': 'assam',

  // Bihar
  'patna': 'bihar', 'gaya': 'bihar', 'muzaffarpur': 'bihar', 'bhagalpur': 'bihar',

  // Chhattisgarh
  'raipur': 'chhattisgarh', 'bilaspur': 'chhattisgarh', 'durg': 'chhattisgarh',

  // Goa
  'panaji': 'goa', 'margao': 'goa',

  // Gujarat
  'ahmedabad': 'gujarat', 'surat': 'gujarat', 'vadodara': 'gujarat', 'rajkot': 'gujarat', 'gandhinagar': 'gujarat',

  // Haryana
  'faridabad': 'haryana', 'gurgaon': 'haryana', 'gurugram': 'haryana', 'panipat': 'haryana', 'ambala': 'haryana',

  // Himachal Pradesh
  'shimla': 'himachal pradesh', 'manali': 'himachal pradesh', 'dharamshala': 'himachal pradesh',

  // Jharkhand
  'ranchi': 'jharkhand', 'jamshedpur': 'jharkhand', 'dhanbad': 'jharkhand',

  // Karnataka
  'bengaluru': 'karnataka', 'bangalore': 'karnataka', 'mysuru': 'karnataka', 'mysore': 'karnataka', 'mangaluru': 'karnataka', 'hubballi-dharwad': 'karnataka', 'belagavi': 'karnataka',

  // Kerala
  'thiruvananthapuram': 'kerala', 'kochi': 'kerala', 'kozhikode': 'kerala', 'thrissur': 'kerala',

  // Madhya Pradesh
  'indore': 'madhya pradesh', 'bhopal': 'madhya pradesh', 'jabalpur': 'madhya pradesh', 'gwalior': 'madhya pradesh',

  // Maharashtra
  'mumbai': 'maharashtra', 'pune': 'maharashtra', 'nagpur': 'maharashtra', 'thane': 'maharashtra', 'nashik': 'maharashtra', 'aurangabad': 'maharashtra', 'solapur': 'maharashtra', 'kolhapur': 'maharashtra',

  // Manipur
  'imphal': 'manipur',

  // Meghalaya
  'shillong': 'meghalaya',

  // Mizoram
  'aizawl': 'mizoram',

  // Nagaland
  'kohima': 'nagaland', 'dimapur': 'nagaland',

  // Delhi
  'delhi': 'delhi', 'new delhi': 'delhi',

  // Odisha
  'bhubaneswar': 'odisha', 'cuttack': 'odisha', 'puri': 'odisha',

  // Punjab
  'amritsar': 'punjab', 'ludhiana': 'punjab', 'jalandhar': 'punjab', 'patiala': 'punjab', 'chandigarh': 'punjab',

  // Rajasthan
  'jaipur': 'rajasthan', 'jodhpur': 'rajasthan', 'udaipur': 'rajasthan', 'kota': 'rajasthan', 'ajmer': 'rajasthan',

  // Sikkim
  'gangtok': 'sikkim',

  // Tamil Nadu
  'chennai': 'tamil nadu', 'coimbatore': 'tamil nadu', 'madurai': 'tamil nadu', 'tiruchirappalli': 'tamil nadu',

  // Telangana
  'hyderabad': 'telangana', 'warangal': 'telangana', 'karimnagar': 'telangana',

  // Tripura
  'agartala': 'tripura',

  // Uttar Pradesh
  'lucknow': 'uttar pradesh', 'kanpur': 'uttar pradesh', 'ghaziabad': 'uttar pradesh', 'agra': 'uttar pradesh', 'varanasi': 'uttar pradesh', 'noida': 'uttar pradesh', 'meerut': 'uttar pradesh',

  // Uttarakhand
  'dehradun': 'uttarakhand', 'haridwar': 'uttarakhand', 'nainital': 'uttarakhand',

  // West Bengal
  'kolkata': 'west bengal', 'howrah': 'west bengal', 'durgapur': 'west bengal', 'siliguri': 'west bengal',

  'zanzibar': 'tanzania',
};