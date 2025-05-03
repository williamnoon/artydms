// Supabase Vehicle Import Test Script
// Run this script with Node.js to test importing vehicles to Supabase

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://yycoegubidzazcxdfgqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Y29lZ3ViaWR6YXpjeGRmZ3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDAyMjUsImV4cCI6MjA1NzExNjIyNX0.jkO7P579jPIyjMN9zMiAug5-8vhU3oawhWlp3K9ZV84';
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample vehicle data
const sampleVehicles = [
  {
    "id": "b4ef3477-2640-4a83-b9d5-04be8aaa7e54",
    "vin": "1GKFK13038J127695",
    "year": 2008,
    "make": "GMC",
    "model": "Yukon",
    "trim": "SLT w/4SB",
    "drivetrain": "4WD",
    "body_style": "4D SUV",
    "engine": "5.3",
    "fuel_type": "Flex Fuel",
    "color": "BLUE",
    "odometer": 231107,
    "mmr": null,
    "title_status": "Title Absent",
    "sold_price": "2600",
    "charges": "615",
    "total_cost": "3215",
    "stock_number": "969092",
    "sale_date": "2025-03-07",
    "location": "AAA - Charleston | Moncks Corner, SC",
    "buyer": "T00486 - TRANSFLEX LLC",
    "grade": null,
    "created_at": "2025-03-09 17:27:24.484619+00",
    "updated_at": "2025-03-09 17:27:24.484619+00",
    "sales_price": null
  },
  {
    "id": "7ef76bf3-0d7a-4c1c-852f-55147854c207",
    "vin": "3VWPW31C98M518041",
    "year": 2008,
    "make": "Volkswagen",
    "model": "New Beetle Coupe",
    "trim": "S",
    "drivetrain": "FWD",
    "body_style": "2D Coupe",
    "engine": "2.5",
    "fuel_type": "Gasoline",
    "color": "WHITE",
    "odometer": 161413,
    "mmr": null,
    "title_status": "At Auction",
    "sold_price": "1000",
    "charges": "375",
    "total_cost": "1375",
    "stock_number": "965799",
    "sale_date": "2025-01-31",
    "location": "AAA - Charleston | Moncks Corner, SC",
    "buyer": "T00486 - TRANSFLEX LLC",
    "grade": null,
    "created_at": "2025-03-09 17:27:24.484619+00",
    "updated_at": "2025-03-09 17:27:24.484619+00",
    "sales_price": null
  },
  {
    "id": "6de909fe-5e8e-4387-a3f6-fccbbc3b65d8",
    "vin": "1G1ZS58FX8F101877",
    "year": 2008,
    "make": "Chevrolet",
    "model": "Malibu Classic",
    "trim": "LS w/1FL",
    "drivetrain": "FWD",
    "body_style": "4D Sedan",
    "engine": "2.2",
    "fuel_type": "Gasoline",
    "color": "GRAY",
    "odometer": 148649,
    "mmr": null,
    "title_status": "At Auction",
    "sold_price": "400",
    "charges": "440",
    "total_cost": "840",
    "stock_number": "965947",
    "sale_date": "2025-01-17",
    "location": "AAA - Charleston | Moncks Corner, SC",
    "buyer": "T00486 - TRANSFLEX LLC",
    "grade": null,
    "created_at": "2025-03-09 17:27:24.484619+00",
    "updated_at": "2025-03-09 17:27:24.484619+00",
    "sales_price": null
  },
  {
    "id": "fd9b6f15-8899-41ee-b6c8-9ccec120a31f",
    "vin": "3C4PDCBGXET144082",
    "year": 2014,
    "make": "Dodge",
    "model": "Journey",
    "trim": "SXT",
    "drivetrain": "FWD",
    "body_style": "4D SUV",
    "engine": "3.6",
    "fuel_type": "Flex Fuel",
    "color": "WHITE",
    "odometer": 184973,
    "mmr": null,
    "title_status": "At Auction",
    "sold_price": "800",
    "charges": "505",
    "total_cost": "1305",
    "stock_number": "959730",
    "sale_date": "2024-11-15",
    "location": "AAA - Charleston | Moncks Corner, SC",
    "buyer": "T00486 - TRANSFLEX LLC",
    "grade": "2.5",
    "created_at": "2025-03-09 17:27:24.484619+00",
    "updated_at": "2025-03-09 17:27:24.484619+00",
    "sales_price": null
  }
];

// Test functions
async function testDescribeTable() {
  console.log('----------------------------------------------');
  console.log('Testing table description for assets table...');
  try {
    // This doesn't work with Supabase directly, but we can check if the table exists
    const { data: columns, error } = await supabase
      .from('assets')
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (columns) {
      console.log('Table exists. Column structure from sample row:');
      if (columns.length > 0) {
        console.log(Object.keys(columns[0]));
      } else {
        console.log('Table exists but is empty.');
      }
    }
  } catch (error) {
    console.error('Error describing table:', error.message);
  }
}

async function testQueryTable() {
  console.log('----------------------------------------------');
  console.log('Testing simple query to assets table...');
  try {
    const { data, error, count } = await supabase
      .from('assets')
      .select('*', { count: 'exact' });
    
    if (error) {
      throw error;
    }
    
    console.log(`Query successful. Found ${data?.length || 0} records.`);
    if (data && data.length > 0) {
      console.log('First record:', data[0]);
    }
  } catch (error) {
    console.error('Error querying table:', error.message);
  }
}

async function testInsertVehicles() {
  console.log('----------------------------------------------');
  console.log('Testing insert of sample vehicles...');
  try {
    // First try to insert a single vehicle to test permissions
    const firstVehicle = sampleVehicles[0];
    console.log('Attempting to insert:', firstVehicle.vin);
    
    const { data: insertedData, error: insertError } = await supabase
      .from('assets')
      .upsert([firstVehicle], { onConflict: 'vin' })
      .select();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('Successfully inserted/updated vehicle:', insertedData);
    
    // Now try batch insert for all vehicles
    console.log('Attempting batch insert of all vehicles...');
    
    const { data: batchData, error: batchError } = await supabase
      .from('assets')
      .upsert(sampleVehicles, { onConflict: 'vin' });
    
    if (batchError) {
      throw batchError;
    }
    
    console.log('Batch insert successful!');
  } catch (error) {
    console.error('Error inserting vehicles:', error.message);
    console.error('Error details:', error);
  }
}

async function testFundAssociations() {
  console.log('----------------------------------------------');
  console.log('Testing fund associations...');
  try {
    // First check if fund_assets table exists
    const { data: fundAssets, error: fundAssetsError } = await supabase
      .from('fund_assets')
      .select('*')
      .limit(1);
    
    if (fundAssetsError) {
      throw fundAssetsError;
    }
    
    console.log('fund_assets table exists. Attempting to create associations...');
    
    // Create fund associations for vehicles (just for testing)
    const fundAssociations = sampleVehicles.map(vehicle => ({
      asset_id: vehicle.id,
      fund_id: 'cha10', // Using Charleston fund as example
      display_order: 0
    }));
    
    const { data: insertedAssocs, error: insertError } = await supabase
      .from('fund_assets')
      .upsert(fundAssociations, { onConflict: ['asset_id', 'fund_id'] });
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('Fund associations created successfully!');
  } catch (error) {
    console.error('Error with fund associations:', error.message);
    console.error('Error details:', error);
  }
}

async function runTests() {
  console.log('==============================================');
  console.log('STARTING SUPABASE VEHICLE IMPORT TESTS');
  console.log('==============================================');
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Testing with sample vehicles:', sampleVehicles.length);
  
  // Run tests in sequence
  await testDescribeTable();
  await testQueryTable();
  await testInsertVehicles();
  await testFundAssociations();
  
  console.log('==============================================');
  console.log('ALL TESTS COMPLETED');
  console.log('==============================================');
}

// Execute tests
runTests()
  .catch(error => {
    console.error('Error running tests:', error);
  });
