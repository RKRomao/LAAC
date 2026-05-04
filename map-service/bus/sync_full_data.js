import fs from 'fs';

const API_BASE = 'https://cov.elevensystems.pt/api';

async function sync() {
  try {
    console.log('--- Phase 1: Syncing Stops ---');
    const stopsRes = await fetch(`${API_BASE}/stops`);
    const apiStops = await stopsRes.json();
    
    const formattedStops = {
      category: "Todas as Paragens",
      stops: apiStops.map(s => ({
        id: s.id,
        name: s.name,
        lat: s.position.lat,
        lng: s.position.lon
      }))
    };

    fs.writeFileSync('data/stops.json', JSON.stringify([formattedStops], null, 2));
    console.log(`Saved ${apiStops.length} stops to data/stops.json`);

    console.log('\n--- Phase 2: Syncing Schedules (Today) ---');
    const routesRes = await fetch(`${API_BASE}/routes`);
    const routes = await routesRes.json();
    
    const allLines = [];

    for (const route of routes) {
      console.log(`Processing Route ${route.id} (${route.shortName || route.id})...`);
      
      const journeysRes = await fetch(`${API_BASE}/routes/${route.id}/journeys`);
      const journeys = await journeysRes.json();
      
      // We need to group journeys by their stop sequence to fit our current schedules.json structure
      // A "Line" in our JSON is a combination of Route + Direction + Stop Sequence
      const lineGroups = {};

      for (const journey of journeys) {
        // Fetch full detail for each journey to get stops and times
        const detailRes = await fetch(`${API_BASE}/routes/${route.id}/journeys/${journey.id}`);
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();
        
        if (!detail.circulations || detail.circulations.length === 0) continue;

        const stopNames = detail.circulations.map(c => c.stage.name);
        const stopIds = detail.circulations.map(c => c.stage.id);
        const sequenceKey = stopIds.join('|');
        
        // Determine direction name (IDA or VOLTA)
        // Usually direction 0 is IDA, 1 is VOLTA, but let's look at the name
        const direction = journey.direction === 1 ? 'VOLTA' : 'IDA';
        const groupKey = `${route.id}-${direction}-${sequenceKey}`;

        if (!lineGroups[groupKey]) {
          lineGroups[groupKey] = {
            line: `${route.shortName || route.id}-${direction}`,
            lineName: `${route.name} (${direction})`,
            stops: stopNames,
            stopIds: stopIds, // Helpful for debugging
            trips: []
          };
        }

        const formatTime = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        lineGroups[groupKey].trips.push({
          id: `${route.id}_${journey.id}`,
          dayType: "business", // We are assuming today is a business day for this sync
          times: detail.circulations.map(c => formatTime(c.arrivalTime))
        });
      }

      // Add all variants to our master list
      Object.values(lineGroups).forEach(group => {
        // If a route has multiple variants for IDA, we append a suffix
        const variants = Object.values(lineGroups).filter(g => g.line === group.line);
        if (variants.length > 1) {
          const idx = variants.indexOf(group);
          if (idx > 0) group.line += `-${String.fromCharCode(65 + idx)}`; // IDA-B, IDA-C...
        }
        allLines.push(group);
      });
    }

    fs.writeFileSync('data/schedules.json', JSON.stringify(allLines, null, 2));
    console.log(`\nSuccessfully synced ${allLines.length} line variants to data/schedules.json`);

  } catch (error) {
    console.error('Fatal error during sync:', error);
  }
}

sync();
