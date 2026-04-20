const axios = require('axios');

/**
 * Service to fetch real stadium data from Google Maps API
 * Requires GOOGLE_MAPS_API_KEY environment variable
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

/**
 * Fetch stadium coordinates and basic info from Google Maps
 */
const fetchStadiumFromGoogle = async (stadiumName, city) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('GOOGLE_MAPS_API_KEY not set. Using mock data.');
      return generateMockStadiumData(stadiumName, city);
    }

    const query = `${stadiumName} stadium ${city}`;
    const response = await axios.get(GOOGLE_PLACES_URL, {
      params: {
        query,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (!response.data.results || response.data.results.length === 0) {
      console.log(`No results found for ${query}. Using mock data.`);
      return generateMockStadiumData(stadiumName, city);
    }

    const place = response.data.results[0];
    const { lat, lng } = place.geometry.location;

    return {
      name: place.name,
      address: place.formatted_address,
      coordinates: { latitude: lat, longitude: lng },
      google_place_id: place.place_id,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total
    };
  } catch (error) {
    console.error('Error fetching stadium from Google:', error.message);
    return generateMockStadiumData(stadiumName, city);
  }
};

/**
 * Fetch nearby food courts, restrooms, etc. around a stadium
 */
const fetchNearbyAmenities = async (stadiumLat, stadiumLng, amenityType) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('GOOGLE_MAPS_API_KEY not set. Using mock data.');
      return generateMockAmenities(amenityType, 5);
    }

    const typeMap = {
      food: ['restaurant', 'food'],
      restroom: ['rest_area'],
      medical: ['hospital', 'pharmacy', 'doctor'],
      parking: ['parking']
    };

    const types = typeMap[amenityType] || [];
    const allResults = [];

    for (const type of types) {
      try {
        const response = await axios.get(GOOGLE_NEARBY_URL, {
          params: {
            location: `${stadiumLat},${stadiumLng}`,
            radius: 500, // 500 meters
            type,
            key: GOOGLE_MAPS_API_KEY
          }
        });

        if (response.data.results) {
          allResults.push(...response.data.results);
        }
      } catch (err) {
        console.warn(`Error fetching ${type}:`, err.message);
      }
    }

    return allResults.map((place) => ({
      name: place.name,
      type: place.types[0],
      coordinates: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      },
      distance_from_stadium: calculateDistance(
        stadiumLat,
        stadiumLng,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      google_place_id: place.place_id,
      rating: place.rating
    }));
  } catch (error) {
    console.error('Error fetching nearby amenities:', error.message);
    return generateMockAmenities(amenityType, 5);
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
};

/**
 * Calculate walk time in minutes (assuming 1.4 m/s average walking speed)
 */
const calculateWalkTime = (distanceMeters) => {
  const avgWalkingSpeed = 1.4; // meters per second
  const timeSeconds = distanceMeters / avgWalkingSpeed;
  return Math.ceil(timeSeconds / 60); // Convert to minutes and round up
};

/**
 * Generate mock stadium data for testing (when API key not available)
 */
const generateMockStadiumData = (stadiumName, city) => {
  const mockStadiums = {
    'M. Chinnaswamy Stadium': {
      coordinates: { latitude: 13.197, longitude: 77.6016 },
      address: 'Chinnaswamy Stadium, Bengaluru, Karnataka',
      city: 'Bengaluru'
    },
    'Sree Kanteerava Stadium': {
      coordinates: { latitude: 13.1939, longitude: 77.5707 },
      address: 'Sree Kanteerava Stadium, Bengaluru, Karnataka',
      city: 'Bengaluru'
    },
    'Wankhede Stadium': {
      coordinates: { latitude: 19.0176, longitude: 72.8263 },
      address: 'Wankhede Stadium, Mumbai, Maharashtra',
      city: 'Mumbai'
    },
    'Eden Gardens': {
      coordinates: { latitude: 22.5645, longitude: 88.3639 },
      address: 'Eden Gardens, Kolkata, West Bengal',
      city: 'Kolkata'
    },
    'Arun Jaitley Stadium': {
      coordinates: { latitude: 28.5921, longitude: 77.2507 },
      address: 'Arun Jaitley Stadium, Delhi',
      city: 'Delhi'
    }
  };

  return (
    mockStadiums[stadiumName] || {
      name: stadiumName,
      address: `${stadiumName}, ${city}`,
      coordinates: { latitude: 28.6139, longitude: 77.209 }, // Default to Delhi
      city
    }
  );
};

/**
 * Generate mock amenities for testing
 */
const generateMockAmenities = (type, count) => {
  const mockData = {
    food: [
      { name: 'Food Court A', type: 'restaurant', distance_from_stadium: 50 },
      { name: 'Food Court B', type: 'restaurant', distance_from_stadium: 150 },
      { name: 'Snack Bar', type: 'restaurant', distance_from_stadium: 200 }
    ],
    restroom: [
      { name: 'Restroom Block A', type: 'rest_area', distance_from_stadium: 30 },
      { name: 'Restroom Block B', type: 'rest_area', distance_from_stadium: 120 }
    ],
    medical: [
      { name: 'Medical Center', type: 'hospital', distance_from_stadium: 50 },
      { name: 'First Aid Station', type: 'pharmacy', distance_from_stadium: 100 }
    ],
    parking: [
      { name: 'Parking Lot A', type: 'parking', distance_from_stadium: 200 },
      { name: 'Parking Lot B', type: 'parking', distance_from_stadium: 300 }
    ]
  };

  return (mockData[type] || []).slice(0, count);
};

module.exports = {
  fetchStadiumFromGoogle,
  fetchNearbyAmenities,
  calculateDistance,
  calculateWalkTime
};
