/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class RoutesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async processSchedule(file: any): Promise<any> {
    try {
      const openai = new OpenAI({ apiKey: process.env.ASSISTANT_API_KEY });
      const text = file.buffer.toString();
      // Step 1: Get GTFS JSON from OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: `Process this transit schedule:\n${text}\nOutput GTFS JSON with OSM coordinates.`,
          },
        ],
      });

      const response = completion.choices[0].message.content;

      const jsonMatch = response.match(/{.*}/s);

      if (!jsonMatch) {
        throw new Error('No valid JSON found in the string.');
      }

      // Parse extracted JSON
      //   const str = jsonMatch[0];
      //   const parsedData = JSON.parse(str);
      //   return parsedData;

      const format = this.convertGtfsJsonStringToHtml(
        completion.choices[0].message.content,
      );
      return format;

      // Step 2: Convert to GeoJSON for Leaflet
      //   const gtfsData = JSON.parse(completion.choices[0].message.content);
      //   const geoJson = this.convertToGeoJSON(gtfsData);
      //   return geoJson;
    } catch (error) {
      Logger.error('Request Error', error.stack, 'Routes Assistant');
      console.log(error.data);
      throw new BadRequestException(`Request Failed`);
    }
  }

  //   convertToGeoJSON(gtfs) {
  //     return {
  //       type: 'FeatureCollection',
  //       features: gtfs.routes.map((route) => ({
  //         type: 'Feature',
  //         properties: {
  //           color: `#${route.route_color}`,
  //           sacco: gtfs.agencies.find((a) => a.agency_id === route.agency_id)
  //             .agency_name,
  //         },
  //         geometry: {
  //           type: 'LineString',
  //           coordinates: 'getRouteCoordinates(route.route_id, gtfs)',
  //         },
  //       })),
  //     };
  //   }

  //   // Method to convert the provided GTFS-like data string into GeoJSON format
  //   convertGtfsJsonStringToGeoJson(jsonString) {
  //     try {
  //       const jsonMatch = jsonString.match(/{.*}/s); // Match everything between curly braces

  //       if (!jsonMatch) {
  //         throw new Error('No valid JSON found in the string.');
  //       }

  //       // Parse the extracted JSON
  //       const str = jsonMatch[0];
  //       const parsedData = JSON.parse(str);

  //       // Create GeoJSON from GTFS stops data
  //       const geoJson = {
  //         type: 'FeatureCollection',
  //         features: parsedData.stops.map((stop) => ({
  //           type: 'Feature',
  //           geometry: {
  //             type: 'Point',
  //             coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)],
  //           },
  //           properties: {
  //             stop_id: stop.stop_id,
  //             stop_name: stop.stop_name,
  //           },
  //         })),
  //       };

  //       return geoJson;
  //     } catch (error) {
  //       console.error('Error converting GTFS to GeoJSON:', error.message);
  //       throw new Error(`Request Failed`);
  //     }
  //   }

  //   convertGtfsJsonStringToHtml(jsonString) {
  //     try {
  //       const jsonMatch = jsonString.match(/{.*}/s); // Extract JSON from unclean string

  //       if (!jsonMatch) {
  //         throw new Error('No valid JSON found in the string.');
  //       }

  //       // Parse extracted JSON
  //       const str = jsonMatch[0];
  //       const parsedData = JSON.parse(str);

  //       // Create GeoJSON from GTFS stops data
  //       const geoJson = {
  //         type: 'FeatureCollection',
  //         features: parsedData.stops.map((stop) => ({
  //           type: 'Feature',
  //           geometry: {
  //             type: 'Point',
  //             coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)],
  //           },
  //           properties: {
  //             stop_id: stop.stop_id,
  //             stop_name: stop.stop_name,
  //             sacco: stop.sacco, // Include Sacco name for grouping
  //             stop_sequence: stop.stop_sequence || 0, // Ensure correct order
  //           },
  //         })),
  //       };

  //       // Group stops by Sacco and sort them by sequence
  //       const saccoRoutes = {};
  //       geoJson.features.forEach((feature) => {
  //         const saccoName = feature.properties.sacco || 'Default';
  //         if (!saccoRoutes[saccoName]) saccoRoutes[saccoName] = [];
  //         saccoRoutes[saccoName].push({
  //           lat: feature.geometry.coordinates[1],
  //           lon: feature.geometry.coordinates[0],
  //           sequence: feature.properties.stop_sequence,
  //         });
  //       });

  //       // Sort each Sacco's route by stop sequence
  //       Object.keys(saccoRoutes).forEach((sacco) => {
  //         saccoRoutes[sacco].sort((a, b) => a.sequence - b.sequence);
  //       });

  //       // Generate unique colors for each Sacco
  //       const saccoColors = {};
  //       const colorPalette = [
  //         'red',
  //         'blue',
  //         'green',
  //         'orange',
  //         'purple',
  //         'brown',
  //         'pink',
  //         'cyan',
  //       ];
  //       Object.keys(saccoRoutes).forEach((sacco, index) => {
  //         saccoColors[sacco] = colorPalette[index % colorPalette.length];
  //       });

  //       // Generate HTML with Leaflet.js, routes & labels
  //       return `
  //         <!DOCTYPE html>
  //         <html lang="en">
  //         <head>
  //             <meta charset="UTF-8">
  //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //             <title>GTFS Stops Map</title>
  //             <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  //             <style>
  //                 body { font-family: Arial, sans-serif; }
  //                 #map { height: 600px; width: 100%; }
  //                 .leaflet-label {
  //                     font-size: 14px;
  //                     font-weight: bold;
  //                     color: white;
  //                     background: black;
  //                     padding: 3px;
  //                     border-radius: 5px;
  //                 }
  //             </style>
  //         </head>
  //         <body>

  //             <h2>GTFS Stops Map with Routes (Color-coded by Sacco)</h2>
  //             <div id="map"></div>

  //             <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  //             <script>
  //                 function initMap(geoJsonData, saccoRoutes, saccoColors) {
  //                     const map = L.map("map").setView([0.0236, 37.9062], 6); // Center on Kenya

  //                     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  //                         attribution: "&copy; OpenStreetMap contributors",
  //                     }).addTo(map);

  //                     // Add stops as markers
  //                     geoJsonData.features.forEach((feature) => {
  //                         const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
  //                         L.marker(latlng).addTo(map)
  //                             .bindPopup(\`<b>\${feature.properties.stop_name}</b> <br> Stop ID: \${feature.properties.stop_id} <br> Sacco: \${feature.properties.sacco}\`);
  //                     });

  //                     // Draw polyline routes grouped by Sacco with labels
  //                     Object.keys(saccoRoutes).forEach((sacco) => {
  //                         const routeCoordinates = saccoRoutes[sacco].map(stop => [stop.lat, stop.lon]);

  //                         if (routeCoordinates.length > 1) {
  //                             const polyline = L.polyline(routeCoordinates, {
  //                                 color: saccoColors[sacco], // Unique color per Sacco
  //                                 weight: 4,
  //                                 opacity: 0.8,
  //                                 smoothFactor: 1.5
  //                             }).addTo(map);

  //                             // Add route label (midway on the route)
  //                             const midIndex = Math.floor(routeCoordinates.length / 2);
  //                             const midPoint = routeCoordinates[midIndex];

  //                             L.marker(midPoint, {
  //                                 icon: L.divIcon({
  //                                     className: "leaflet-label",
  //                                     html: \`<b>\${sacco}</b>\`,
  //                                     iconSize: [80, 20]
  //                                 })
  //                             }).addTo(map);
  //                         }
  //                     });

  //                     // Auto-fit map to show all stops & routes
  //                     map.fitBounds(Object.values(saccoRoutes).flat().map(stop => [stop.lat, stop.lon]));
  //                 }

  //                 // Insert dynamic JSON data
  //                 const geoJsonData = ${JSON.stringify(geoJson)};
  //                 const saccoRoutes = ${JSON.stringify(saccoRoutes)};
  //                 const saccoColors = ${JSON.stringify(saccoColors)};

  //                 document.addEventListener("DOMContentLoaded", () => initMap(geoJsonData, saccoRoutes, saccoColors));
  //             </script>

  //         </body>
  //         </html>`;
  //     } catch (error) {
  //       console.error('Error converting GTFS to HTML:', error.message);
  //       throw new Error(`Request Failed`);
  //     }
  //   }

  // This function is now outside of convertGtfsJsonStringToHtml
  // Helper function to get the route from OSRM

  convertGtfsJsonStringToHtml(gtfsJsonString) {
    // Parse the GTFS JSON string
    const jsonMatch = gtfsJsonString.match(/{.*}/s); // Match everything between curly braces

    if (!jsonMatch) {
      throw new Error('No valid JSON found in the string.');
    }

    // Parse the extracted JSON
    const str = jsonMatch[0];
    const gtfsData = JSON.parse(str);

    // Generate the HTML structure
    const htmlOutput = `
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GTFS Routes with OSRM</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
    </head>
    <body>
        <h1>GTFS Routes with OSRM Routing</h1>
        <div id="map" style="height: 600px"></div>
        <script>
            // Sample GeoJSON data for GTFS Stops (replace with your real data)
            const geoJsonData = {
                type: 'FeatureCollection',
                features: ${JSON.stringify(
                  gtfsData.stops.map((stop) => ({
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [stop.stop_lon, stop.stop_lat], // Longitude and Latitude
                    },
                    properties: {
                      stop_id: stop.stop_id,
                      stop_name: stop.stop_name,
                    },
                  })),
                )}
            };

            // Initialize the map
            const map = L.map('map').setView([0.0236, 37.9062], 6); // Set initial view to Africa

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);

            // Function to get route from OSRM
            async function getRouteFromOSRM(start, end) {
                const osrmUrl = \`https://router.project-osrm.org/route/v1/driving/\${start[1]},\${start[0]};\${end[1]},\${end[0]}?overview=full&geometries=geojson\`;
                const response = await fetch(osrmUrl);
                const data = await response.json();
                return data.routes[0].geometry.coordinates; // Return the coordinates of the route
            }

            // Add markers and routes to the map
            async function addRoutes() {
                const markers = [];

                // Loop through the GTFS stops and add markers
                geoJsonData.features.forEach((feature) => {
                    const stop = feature.geometry.coordinates;
                    const marker = L.marker([stop[1], stop[0]])
                        .addTo(map)
                        .bindPopup(
                            \`<b>\${feature.properties.stop_name}</b><br>Stop ID: \${feature.properties.stop_id}\`,
                        );
                    markers.push([stop[1], stop[0]]);
                });

                // Loop through stops and fetch route from OSRM for each consecutive stop
                for (let i = 0; i < markers.length - 1; i++) {
                    const start = markers[i];
                    const end = markers[i + 1];

                    // Fetch route from OSRM
                    const routeCoordinates = await getRouteFromOSRM(start, end);

                    // Draw the route on the map as a polyline
                    const polyline = L.polyline(
                        routeCoordinates.map((coord) => [coord[1], coord[0]]),
                        {
                            color: 'blue',
                            weight: 5,
                            opacity: 0.7,
                        },
                    ).addTo(map);
                }

                // Adjust map view to fit all markers and routes
                map.fitBounds(markers.map((marker) => [marker[0], marker[1]]));
            }

            // Call the function to add routes
            addRoutes();
        </script>
    </body>
    </html>
    `;

    return htmlOutput;
  }
}
