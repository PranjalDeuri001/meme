// src/Data/data2.jsx

// --- Import High-Res Carousel Images (from "Vehicle Images Blured") ---
import PumaImg_Carousel from "../Assets/Vehicle Images Blured/EKA_Puma.png";
import Bus7m_Carousel from "../Assets/Vehicle Images Blured/7M.png"; // Corrected this path too
import Bus9m_Carousel from "../Assets/Vehicle Images Blured/Bus_9M.png";
import Bus12m_Carousel from "../Assets/Vehicle Images Blured/12M.png";
import S6_Carousel from "../Assets/Vehicle Images Blured/6S.png";
import S3_Carousel from "../Assets/Vehicle Images Blured/3S.png";
import Coach_Carousel from "../Assets/Vehicle Images Blured/13.5m.png";
import Truck_Carousel from "../Assets/Vehicle Images Blured/55T.png";
import img7_5t_Carousel from '../Assets/Vehicle Images Blured/7.5t.png';
import img5T_Carousel from '../Assets/Vehicle Images Blured/5T.png';

// --- Import Low-Res Home Page Images (from "Home_fleetInfo") ---
import PumaImg_Home from "../Assets/Home_fleetInfo/EKA_Puma.png";
import Bus7m_Home from "../Assets/Home_fleetInfo/Bus_7m.png";
import Bus9m_Home from "../Assets/Home_fleetInfo/Bus_9M.png";
import Bus12m_Home from "../Assets/Home_fleetInfo/12M.png";
import S6_Home from "../Assets/Home_fleetInfo/6S.png";
import S3_Home from "../Assets/Home_fleetInfo/3S.png";
import Coach_Home from "../Assets/Home_fleetInfo/13.5m.png";
import Truck_Home from "../Assets/Home_fleetInfo/55T.png";
import img7_5t_Home from '../Assets/Home_fleetInfo/7.5t.png';
import img5T_Home from '../Assets/Home_fleetInfo/5T.png';

// --- Import Low-Res List Images (from "Home_fleetInfo") ---
// *** THIS IS THE FIX ***
// These now point to the correct low-res folder
import PumaImg_List from "../Assets/Home_fleetInfo/EKA_Puma.png";
import Bus7m_List from "../Assets/Home_fleetInfo/Bus_7m.png";
import Bus9m_List from "../Assets/Home_fleetInfo/Bus_9M.png";
import Bus12m_List from "../Assets/Home_fleetInfo/12M.png";
import Saarthi_List from "../Assets/Home_fleetInfo/6S.png";
import Micky_List from "../Assets/Home_fleetInfo/3S.png";
import Coach_List from "../Assets/Home_fleetInfo/13.5m.png";
import Truck55t_List from "../Assets/Home_fleetInfo/55T.png";
import img5T_List from '../Assets/Home_fleetInfo/5T.png';
import Default_List from "../Assets/Home_fleetInfo/6S.png"; // Default image

// --- The Master Data Object ---
export const VEHICLE_MASTER_DATA = {
  "7m": {
    name: "7m",
    vehicleModel: "EKA 7M",
    apiFilterKeys: ["7M", "7m"],
    homeImage: Bus7m_Home,
    carouselImage: Bus7m_Carousel,
    listImage: Bus7m_List,
    specs: {
      dimentions: "7150 x 2190 x 3235",
      hvBatteryVoltage: "660",
      hvBatterCapacity: "100",
      motorPeakCtPw: "1500,123",
      grossWeight: "8200",
      timeToCharge: "1.25 (120kWh)",
    },
  },
  "9m": {
    name: "9m",
    vehicleModel: "EKA 9M",
    apiFilterKeys: ["9M", "9m"],
    homeImage: Bus9m_Home,
    carouselImage: Bus9m_Carousel,
    listImage: Bus9m_List,
    specs: {
      dimentions: "9200 x 2500 x 3200",
      hvBatteryVoltage: "660",
      hvBatterCapacity: "200",
      motorPeakCtPw: "2352,213",
      grossWeight: "12500",
      timeToCharge: "1.45 (120kWh)",
    },
  },
  "12m": {
    name: "12m",
    vehicleModel: "EKA 12M",
    apiFilterKeys: ["12m", "12M"],
    homeImage: Bus12m_Home,
    carouselImage: Bus12m_Carousel,
    listImage: Bus12m_List,
    specs: {
      dimentions: "12000 x 2600 x 3600",
      hvBatteryVoltage: "660",
      hvBatterCapacity: "300",
      motorPeakCtPw: "240,3000",
      grossWeight: "19500",
      timeToCharge: "2.10 (180kWh)",
    },
  },
  "1.5t": {
    name: "1.5t",
    vehicleModel: "EKA 1.5T",
    apiFilterKeys: ["1.5T", "1.5t"],
    homeImage: PumaImg_Home,
    carouselImage: PumaImg_Carousel,
    listImage: PumaImg_List,
    specs: {
      dimentions: "4660 x 1885 x 1925",
      hvBatteryVoltage: "307",
      hvBatterCapacity: "32",
      motorPeakCtPw: "60,220",
      grossWeight: "2840",
      timeToCharge: "4",
    },
  },
  "6s": {
    name: "6s",
    vehicleModel: "EKA 6S",
    apiFilterKeys: ["6S", "6s"],
    homeImage: S6_Home,
    carouselImage: S6_Carousel,
    listImage: Saarthi_List,
    specs: {
      dimentions: "3545 x 1580 x 1930",
      hvBatteryVoltage: "51.2",
      hvBatterCapacity: "15",
      motorPeakCtPw: "65,12",
      grossWeight: "1235",
      timeToCharge: "2",
    },
  },
  "3s": {
    name: "3s",
    vehicleModel: "EKA 3S",
    apiFilterKeys: ["3S", "3s"],
    homeImage: S3_Home,
    carouselImage: S3_Carousel,
    listImage: Micky_List,
    specs: {
      dimentions: "2770 X 1330 X 1850",
      hvBatteryVoltage: "60",
      hvBatterCapacity: "10.5",
      motorPeakCtPw: "36, 9",
      grossWeight: "790",
      timeToCharge: "2",
    },
  },
  "13.5m": {
    name: "13.5m",
    vehicleModel: "EKA Coach 13.5M",
    apiFilterKeys: ["13.5M", "13.5m", "Coach"],
    homeImage: Coach_Home,
    carouselImage: Coach_Carousel,
    listImage: Coach_List,
    specs: {
      dimentions: "13480 x 2600 x 4085",
      hvBatteryVoltage: "614",
      hvBatterCapacity: "451",
      motorPeakCtPw: " 3000,339",
      grossWeight: "19500",
      timeToCharge: "2 ( 360kWh )",
    },
  },
  "55t": {
    name: "55t",
    vehicleModel: "EKA 55T (w ADAS/DMS)",
    apiFilterKeys: ["55T", "55t"],
    homeImage: Truck_Home,
    carouselImage: Truck_Carousel,
    listImage: Truck55t_List,
    specs: {
      dimentions: "7140 x 2490 x 3028",
      hvBatteryVoltage: "614",
      hvBatterCapacity: "322",
      motorPeakCtPw: "2100,330 ",
      grossWeight: "55000",
      timeToCharge: "3 ( 240kWh )",
    },
  },
  "7.5t": {
    name: "7.5t",
    vehicleModel: "EKA 7.5T",
    apiFilterKeys: ["7.5t", "7.5T"],
    homeImage: img7_5t_Home,
    carouselImage: img7_5t_Carousel,
    listImage: Default_List,
    isComingSoon: true,
    specs: {
      dimentions: "N/A",
      hvBatteryVoltage: "N/A",
      hvBatterCapacity: "N/A",
      motorPeakCtPw: "N/A,N/A",
      grossWeight: "N/A",
      timeToCharge: "N/A",
    },
  },
  "5t": {
    name: "5t",
    vehicleModel: "EKA 5T",
    apiFilterKeys: ["5t", "5T"],
    homeImage: img5T_Home,
    carouselImage: img5T_Carousel,
    listImage: img5T_List,
    isComingSoon: true,
    specs: {
      dimentions: "N/A",
      hvBatteryVoltage: "N/A",
      hvBatterCapacity: "N/A",
      motorPeakCtPw: "N/A,N/A",
      grossWeight: "N/A",
      timeToCharge: "N/A",
    },
  },
};

// --- Auto-generated Helper Maps ---

// Used by FleetInfo.jsx (Low-Res Home Images)
export const VEHICLE_HOME_IMAGE_MAP = Object.fromEntries(
  Object.values(VEHICLE_MASTER_DATA).map((v) => [v.name, v.homeImage])
);

// Used by Carousel.jsx (High-Res Carousel Images)
export const VEHICLE_CAROUSEL_IMAGE_MAP = Object.fromEntries(
  Object.values(VEHICLE_MASTER_DATA).map((v) => [v.name, v.carouselImage])
);

// Used by VehicleSelectionList.jsx (Low-Res List Images)
export const VEHICLE_LIST_IMAGE_MAP = Object.fromEntries(
  Object.values(VEHICLE_MASTER_DATA).map((v) => [v.name, v.listImage])
);
VEHICLE_LIST_IMAGE_MAP.default = Default_List;

// Used by Info.jsx
export const VEHICLE_FILTERS = Object.fromEntries(
  Object.values(VEHICLE_MASTER_DATA).map((v) => [v.name, v.apiFilterKeys])
);

// Used by VehicleSelection.jsx
export const API_NAME_TO_INTERNAL_NAME_MAP = new Map();
Object.values(VEHICLE_MASTER_DATA).forEach((vehicle) => {
  vehicle.apiFilterKeys.forEach((key) => {
    API_NAME_TO_INTERNAL_NAME_MAP.set(key, vehicle.name);
  });
});

// Used by VehicleSelectionList.jsx
export const SERVICE_CONTACTS_MAP = {
  MBMT: { name: "Mr. Mahesh Landge", contact: "+91 7710023656" },
  UMC: { name: "Mr. Mahesh Landge", contact: "+91 7710023656" },
  AEROMALL: { name: "Mr. Mahesh Landge", contact: "+91 7710023656" },
  UBER: { name: "Mr. Mahesh Landge", contact: "+91 7710023656" },
  WTI: { name: "Mr. Rohit Kumar", contact: "+91 7678194269" },
  DHERADUN: { name: "Mr. Virender Singh", contact: "+91 7018377597" },
  Siemens: { name: "Mr. Virender Singh", contact: "+91 7018377597" },
  Empire: { name: "Mr. Virender Singh", contact: "+91 7018377597" },
  EKA: { name: "Mr. Virender Singh", contact: "+91 7018377597" },
  Cnem: { name: "", contact: "" },
  PINNACLE: { name: "Mr. Jaspal Singh", contact: "+91 8120009132" },
  "2.5t": { name: "Mr. Ganesh", contact: "+9F1 7030107080" },
};