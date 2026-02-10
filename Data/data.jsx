let vehicles = [];

export const saveVehicles = (vehicleData) => {
  vehicles = vehicleData;
};

export const getVehicles = () => vehicles;

// 18.57800875952871, 73.90739815129179

export const chargingStations = [
  {
    numberOfChargers: 6,
    latitude: 19.28405269,
    longitude: 72.88867587,
    name: "Klick watt",
    kWh: 180,
    chargersOf: "MBMT 12",
    address: "MBMT Depot",
  },
  {
    numberOfChargers: 5,
    latitude: 19.24375081,
    longitude: 73.16165404,
    name: "Klick watt",
    kWh: 180,
    chargersOf: "UMC 12",
    address: "UMT depot",
  },
  {
    numberOfChargers: 6,
    latitude: 19.2842185214046,
    longitude: 72.8883191233244,
    name: "Klick watt",
    kWh: 60,
    chargersOf: "MBMT 9m",
    address: "MBMT Depot",
  },
  {
    numberOfChargers: 1,
    latitude: 28.42416996,
    longitude: 76.99105801,
    name: "Klick watt",
    kWh: 60,
    chargersOf: "WTI and Uber",
    address:
      "ASIAN DIET Sector - 36 Mohammadpur Line 1 Village- 122004, Gurugram, Haryana",
  },
  {
    numberOfChargers: 1,
    latitude: 28.41210008,
    longitude: 77.07400444,
    name: "Hyndai",
    kWh: 180,
    chargersOf: "WTI and Uber",
    address:
      "Golf Course Ext. Road Block , Sushant lok 2, Sector 57, Gurugram , Haryana - 122003",
  },
  {
    numberOfChargers: 1,
    latitude: 28.41210008,
    longitude: 77.07400444,
    name: "Hyndai",
    kWh: 60,
    chargersOf: "WTI and Uber",
    address:
      "Golf Course Ext. Road Block , Sushant lok 2, Sector 57, Gurugram , Haryana - 122003",
  },
  {
    numberOfChargers: 1,
    latitude: 28.46622357,
    longitude: 77.52417325,
    name: "Exicom",
    kWh: 60,
    chargersOf: "WTI and Uber",
    address:
      "Shiv Mandir, Alpha 1, Block B, Jaypee Greens, Greater Noida, Uttar Pardesh - 201308",
  },
  {
    numberOfChargers: 5,
    latitude: 19.24375081,
    longitude: 73.16165404,
    name: "Klick watt",
    kWh: 180,
    chargersOf: "UMC",
    address: "UMT depot",
  },
  {
    numberOfChargers: 1,
    latitude: 18.65409153,
    longitude: 74.0786874,
    name: "Quinch",
    kWh: 140,
    chargersOf: "Pathare Plant",
    address: "Instor Plant",
  },
  {
    numberOfChargers: 2,
    latitude: 18.73953791,
    longitude: 73.84345864,
    name: "Sulzon Energy",
    kWh: 30,
    chargersOf: "EKA Plant - 02",
    address: "Chakan Plant",
  },
  {
    numberOfChargers: 1,
    latitude: 22.62136,
    longitude: 75.69735,
    name: "Ador",
    kWh: "140KWH",
    chargersOf: "Pithampur staff bus",
    address: "Pinnacle Industries Limited - Sector1, Plant 2",
  },
  {
    numberOfChargers: 4,
    latitude: 30.29113,
    longitude: 77.99787,
    name: "Exicom & Servo Tech",
    kWh: "120 & 180 KWH",
    chargersOf: "Dehradun bus",
    address:
      "GLIDA Charging station Saharanpur road , Near ISBT Dehradun PIN 248001 Uttarakhand",
  },
  {
    numberOfChargers: 1,
    latitude: 18.57800875952871,
    longitude: 73.90739815129179,
    name: "TIREX",
    kWh: "180KWH",
    chargersOf: "Aeromall Bus",
    address: "Pune International Airport",
  },
  {
    numberOfChargers: 2,
    latitude: 19.8498521166929,
    longitude: 75.2205628196586,
    name: "Mindra",
    kWh: "240KWH",
    chargersOf: "Siemenes",
    address: "Siemens Ltd.",
  },
  {
    numberOfChargers: 2,
    latitude: 27.0888546388335,
    longitude: 93.6110849004727,
    name: "Mindra",
    kWh: "240KWH",
    chargersOf: "Arunchal Pradesh Bus",
    address: "Itanagar APSTS",
  },
  {
    numberOfChargers: 2,
    latitude: 27.128581655708,
    longitude: 93.7247128679637,
    name: "Mindra",
    kWh: "240KWH",
    chargersOf: "Arunchal Pradesh Bus",
    address: "ISBT Naharlagun",
  },
  {
    numberOfChargers: 2,
    latitude: 28.0704125597968,
    longitude: 95.3222743518598,
    name: "Mindra",
    kWh: "240KWH",
    chargersOf: "Arunchal Pradesh Bus",
    address: "Pasighat APSTS",
  },
  {
    numberOfChargers: 2,
    latitude: 27.6637313947593,
    longitude: 95.8723171859503,
    name: "Mindra",
    kWh: "240KWH",
    chargersOf: "Arunchal Pradesh Bus",
    address: "Namsai APSTS",
  },
  {
    numberOfChargers: 1,
    latitude: 13.1979267282167,
    longitude: 77.7073514174696,
    name: "Exicom",
    kWh: "240KWH",
    chargersOf: "Srushti Outsourcing - Airport Shuttle",
    address: "Kempagowda International Airport, Bangalore",
  },
  {
    numberOfChargers: 3,
    latitude: 21.1543088,
    longitude: 79.1321192,
    name: "Tirex",
    kWh: "240KWH",
    chargersOf: "NMC",
    address:
      "Plot no.30, Matrushakti Depot, Small scaller area, Near Mehta Petrol Pump, Lakadgunj, Nagpur - 440008	",
  },
];

export const pumaChargingStations = [
  {
    "name": "Puma Charger - Site 1",
    "address": "More Wasti",
    "latitude": 18.67178,
    "longitude": 73.78606667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 2",
    "address": "Khed, Pune District, Maharashtra, 410501, India",
    "latitude": 18.73375167,
    "longitude": 73.85611667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 3",
    "address": "Matheran Road, New Panvel",
    "latitude": 19.000395,
    "longitude": 73.13236,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 4",
    "address": "Thane Belapur Road, Turbhe, Navi Mumbai",
    "latitude": 19.08321667,
    "longitude": 73.01628,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 5",
    "address": "Pune Bengaluru Highway, Kikvi",
    "latitude": 18.18196833,
    "longitude": 73.95238667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 6",
    "address": "SH58, Alandi",
    "latitude": 18.6684,
    "longitude": 73.92079,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 7",
    "address": "Manjari",
    "latitude": 18.51881833,
    "longitude": 73.98651,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 8",
    "address": "Central Avenue, Pune",
    "latitude": 18.546645,
    "longitude": 73.901875,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 9",
    "address": "Hi Tech City Main Road, Ward 104 Kondapur, Hyderabad",
    "latitude": 17.43828,
    "longitude": 78.37562833,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 10",
    "address": "Bhiwandi Taluka, Thane, Maharashtra, 421311, India",
    "latitude": 19.26641833,
    "longitude": 73.068985,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 11",
    "address": "Mahalakshmi Layout, Bengaluru",
    "latitude": 13.02309833,
    "longitude": 77.54096833,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 12",
    "address": "Thane Belapur Road, Turbhe, Navi Mumbai",
    "latitude": 19.083585,
    "longitude": 73.01637167,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 13",
    "address": "MDR0107, Ramavaram",
    "latitude": 17.84745333,
    "longitude": 83.25077167,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 14",
    "address": "Ghaziabad",
    "latitude": 28.66344833,
    "longitude": 77.46088,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 15",
    "address": "Central Avenue, Pune",
    "latitude": 18.54674167,
    "longitude": 73.901845,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 16",
    "address": "Bhiwandi Taluka, Thane, Maharashtra, 421311, India",
    "latitude": 19.2663,
    "longitude": 73.06912333,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 17",
    "address": "Bengaluru",
    "latitude": 13.06060667,
    "longitude": 77.629115,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 18",
    "address": "NH753F, Koregaon",
    "latitude": 18.65396667,
    "longitude": 74.08015333,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 19",
    "address": "Nellikuppam - Kattur Road, Ammāpettai",
    "latitude": 12.74172,
    "longitude": 80.12088667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 20",
    "address": "Dadri",
    "latitude": 28.54680333,
    "longitude": 77.46197667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 21",
    "address": "Halol Taluka, Panchmahal, Gujarat, 389350, India",
    "latitude": 22.527015,
    "longitude": 73.46333333,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 22",
    "address": "Bhiwandi Taluka, Thane, Maharashtra, 421102, India",
    "latitude": 19.30970833,
    "longitude": 73.14344167,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 23",
    "address": "Kanpur-Lucknow Road, Sarojni Nagar",
    "latitude": 26.707675,
    "longitude": 80.83828667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 24",
    "address": "Hi Tech City Main Road, Ward 104 Kondapur, Hyderabad",
    "latitude": 17.43805833,
    "longitude": 78.37502,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 25",
    "address": "Dhaulana, Hapur, Uttar Pradesh, 245301, India",
    "latitude": 28.689185,
    "longitude": 77.59566833,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 26",
    "address": "Mehrauli Tehsil, Delhi",
    "latitude": 28.52057333,
    "longitude": 77.171585,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 27",
    "address": "Thane Belapur Road, Turbhe, Navi Mumbai",
    "latitude": 19.08366,
    "longitude": 73.01667333,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 28",
    "address": "Vasai-Virar",
    "latitude": 19.36321333,
    "longitude": 72.88998,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 29",
    "address": "Kanpur",
    "latitude": 26.4448,
    "longitude": 80.189655,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 30",
    "address": "Ward 115 Balaji Nagar, Hyderabad",
    "latitude": 17.47496167,
    "longitude": 78.41512667,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  },
  {
    "name": "Puma Charger - Site 31",
    "address": "Bhiwandi Taluka, Thane, Maharashtra, 421311, India",
    "latitude": 19.266265,
    "longitude": 73.06907333,
    "numberOfChargers": 1,
    "chargersOf": "Puma",

  }
];