// src/config/dashboardConfig.js

/**
 * This file centralizes configuration for the Management Dashboard.
 */

// This list is used to nullify data for KPIs and Charts from faulty vehicles.
export const excludedImeis = new Set([
  // "861409075136896", "861919088633267", "861409075032996",
  // "861409075137449", "861409075083106", "861919088658017",
  // "861919088636864", "861919088636369", "861919088608947",
  // "861409075083841", "861919088616056", "861919088637078",
  // "861919088636658", "867950074294073", "861409075032574",
  // "861409075127796", "861409075137480", "861409075144957",
  // "867950074346543", "867409071405836", "861919088607386"
]);

// Defines the vehicle models that fall under each platform category.
export const platformCategories = { 
  "Bus": ["13.5M", "12M", "9M", "7M"], 
  "Truck": ["55T", "7T"], 
  "3W": ["6S", "3S"] 
};