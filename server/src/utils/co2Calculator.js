/**
 * CO2 Calculation Utilities
 * All values in kg CO2 per year unless noted
 */

const TRANSPORT_FACTORS = {
  car: 0.21,        // kg CO2 per km
  motorcycle: 0.11,
  transit: 0.089,
  electric: 0.05,
  bike: 0,
  walk: 0,
};

const DIET_FACTORS = {
  'meat-heavy': 3.3,    // kg CO2 per day
  omnivore: 2.5,
  vegetarian: 1.7,
  vegan: 1.5,
};

const GRID_EMISSION_FACTOR = 0.233; // kg CO2 per kWh (global avg)
const AVG_FLIGHT_KM = 2000;         // average flight distance in km
const FLIGHT_EMISSION_FACTOR = 0.255; // kg CO2 per km

function calcTransportCO2(transportType, weeklyKm) {
  const factor = TRANSPORT_FACTORS[transportType] || TRANSPORT_FACTORS.car;
  return weeklyKm * 52 * factor;
}

function calcDietCO2(dietType) {
  const factor = DIET_FACTORS[dietType] || DIET_FACTORS.omnivore;
  return factor * 365;
}

function calcElectricityCO2(monthlyKwh) {
  return monthlyKwh * 12 * GRID_EMISSION_FACTOR;
}

function calcTravelCO2(flightsPerYear) {
  return flightsPerYear * AVG_FLIGHT_KM * FLIGHT_EMISSION_FACTOR;
}

function calcBaseline({ transportType, weeklyKm, dietType, electricityKwh, flightsPerYear }) {
  const transport = calcTransportCO2(transportType, weeklyKm);
  const diet = calcDietCO2(dietType);
  const energy = calcElectricityCO2(electricityKwh);
  const travel = calcTravelCO2(flightsPerYear);
  return {
    transport: Math.round(transport * 10) / 10,
    diet: Math.round(diet * 10) / 10,
    energy: Math.round(energy * 10) / 10,
    travel: Math.round(travel * 10) / 10,
    total: Math.round((transport + diet + energy + travel) * 10) / 10,
  };
}

module.exports = {
  calcBaseline,
  calcTransportCO2,
  calcDietCO2,
  calcElectricityCO2,
  calcTravelCO2,
  TRANSPORT_FACTORS,
  DIET_FACTORS,
};
