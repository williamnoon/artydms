// React Query Diagnostic Tool
// This script mimics the exact query pattern used in AssetManager.jsx component

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env
const supabaseUrl = 'https://yycoegubidzazcxdfgqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Y29lZ3ViaWR6YXpjeGRmZ3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDAyMjUsImV4cCI6MjA1NzExNjIyNX0.jkO7P579jPIyjMN9zMiAug5-8vhU3oawhWlp3K9ZV84';
const supabase = createClient(supabaseUrl, supabaseKey);

// Debug function to pretty print objects
function prettyPrint(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// This function exactly mimics the fetchAssets function in AssetManager.jsx
async function fetchAssetsExactly() {
  console.log('=== Exactly Mimicking AssetManager.jsx fetchAssets Function ===');
  try {
    console.log('Fetching assets...');
    
    // Get assets with their fund associations - EXACT SAME QUERY FROM COMPONENT
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        fund_assets(fund_id, disposition_price)
      `);
    
    console.log('Query completed.');
    
    if (error) {
      console.error('Supabase fetch error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`Fetched ${data?.length || 0} assets`);
    
    // Process the data exactly like in AssetManager.jsx
    if (data && data.length > 0) {
      console.log('First raw data item:', data[0]);
      
      // Process the data to include fund information (exactly as in AssetManager.jsx)
      const processedAssets = (data || []).map(asset => {
        // Get fund ID from fund_assets if available (exactly as in component)
        const fundId = asset.fund_assets && asset.fund_assets.length > 0 
          ? asset.fund_assets[0].fund_id 
          : null;
          
        return {
          ...asset,
          fundId,
          // Generate random values for demo purposes, just as in component
          mileage: Math.floor(Math.random() * 250000),
          dealerCode: Math.floor(Math.random() * 1000000).toString(),
          location: 'AAA - Charleston | SC',
          disposition_price: asset.fund_assets && asset.fund_assets.length > 0 ? asset.fund_assets[0].disposition_price : null
        };
      });
      
      console.log('Processed first asset:', processedAssets[0]);
      console.log(`Total processed assets: ${processedAssets.length}`);
    } else {
      console.log('No assets found in the database');
    }
  } catch (error) {
    console.error('Error fetching assets:', error);
  }
}

// Let's examine the database schema with a simplified query
async function checkDatabaseSchema() {
  console.log('\n=== Checking Database Schema ===');
  try {
    // Check assets table
    console.log('Checking assets table...');
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .limit(1);
    
    if (assetsError) {
      console.error('Error querying assets:', assetsError.message);
    } else {
      console.log('Assets table exists.');
      if (assetsData && assetsData.length > 0) {
        console.log('Assets table columns:', Object.keys(assetsData[0]));
      } else {
        console.log('Assets table is empty.');
      }
    }
    
    // Check fund_assets table
    console.log('\nChecking fund_assets table...');
    const { data: fundAssetsData, error: fundAssetsError } = await supabase
      .from('fund_assets')
      .select('*')
      .limit(1);
    
    if (fundAssetsError) {
      console.error('Error querying fund_assets:', fundAssetsError.message);
    } else {
      console.log('fund_assets table exists.');
      if (fundAssetsData && fundAssetsData.length > 0) {
        console.log('fund_assets table columns:', Object.keys(fundAssetsData[0]));
      } else {
        console.log('fund_assets table is empty.');
      }
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

// Try a very simplified query
async function trySimplifiedQuery() {
  console.log('\n=== Trying Simplified Query ===');
  try {
    // Just query assets without any joins
    const { data, error } = await supabase
      .from('assets')
      .select('id, vin, year, make, model')
      .limit(5);
    
    if (error) {
      console.error('Error with simplified query:', error.message);
    } else {
      console.log(`Retrieved ${data?.length || 0} assets with simplified query`);
      if (data && data.length > 0) {
        console.log('Simplified query result:', data);
      } else {
        console.log('No results from simplified query');
      }
    }
  } catch (error) {
    console.error('Error with simplified query:', error);
  }
}

// Try a modified join query
async function tryModifiedJoinQuery() {
  console.log('\n=== Trying Modified Join Query ===');
  try {
    // Modified join query that uses explicit join syntax
    const { data, error } = await supabase
      .from('assets')
      .select(`
        id, vin, year, make, model,
        fund_assets!inner(fund_id, disposition_price)
      `)
      .limit(5);
    
    if (error) {
      console.error('Error with modified join query:', error.message);
    } else {
      console.log(`Retrieved ${data?.length || 0} assets with modified join query`);
      if (data && data.length > 0) {
        prettyPrint(data);
      } else {
        console.log('No results from modified join query.');
        
        // If no results with inner join, try left join
        console.log('\nTrying with left join instead of inner join...');
        const { data: leftJoinData, error: leftJoinError } = await supabase
          .from('assets')
          .select(`
            id, vin, year, make, model,
            fund_assets(fund_id, disposition_price)
          `)
          .limit(5);
        
        if (leftJoinError) {
          console.error('Error with left join query:', leftJoinError.message);
        } else {
          console.log(`Retrieved ${leftJoinData?.length || 0} assets with left join query`);
          if (leftJoinData && leftJoinData.length > 0) {
            prettyPrint(leftJoinData);
          } else {
            console.log('No results from left join query either.');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error with modified join query:', error);
  }
}

// Main function to run all diagnostics
async function runAllDiagnostics() {
  console.log('======================================================');
  console.log('STARTING REACT QUERY DIAGNOSTICS');
  console.log('======================================================');
  
  // Exact query from component
  await fetchAssetsExactly();
  
  // Check database structure
  await checkDatabaseSchema();
  
  // Simple query test
  await trySimplifiedQuery();
  
  // Modified join query test
  await tryModifiedJoinQuery();
  
  console.log('\n======================================================');
  console.log('DIAGNOSTICS COMPLETE');
  console.log('======================================================');
}

// Run all diagnostics
runAllDiagnostics()
  .catch(error => {
    console.error('Unhandled error in diagnostics:', error);
  });
