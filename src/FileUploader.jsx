import React, { useState, useRef } from 'react';
import { supabase, handleSupabaseError } from './supabaseClient';

const FileUploader = ({ userRole }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const fileInputRef = useRef(null);
  
  // T21 parser API endpoint from environment variables
  const T21_API_URL = import.meta.env.VITE_T21_API_URL;
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setUploadResults([]);
    setError(null);
  };
  
  // Check API availability
  const checkApiAvailability = async () => {
    try {
      const response = await fetch(`${T21_API_URL}/health-check`, { 
        method: 'GET',
        headers: {
          'x-api-key': import.meta.env.VITE_T21_API_KEY
        },
        timeout: 5000 // 5 second timeout
      });
      setApiAvailable(response.ok);
      return response.ok;
    } catch (error) {
      console.error('T21 API is unavailable:', error);
      setApiAvailable(false);
      return false;
    }
  };

  // Process T21 document
  const processT21Document = async (file) => {
    try {
      // First check if API is available
      const apiIsUp = await checkApiAvailability();
      if (!apiIsUp) {
        throw new Error('T21 parser API is currently unavailable. Please try again later.');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Call T21 parser API
      const response = await fetch(`${T21_API_URL}/api/process-t21`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-api-key': import.meta.env.VITE_T21_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data || !data.vehicles || !Array.isArray(data.vehicles)) {
        throw new Error('Invalid data format received from T21 parser');
      }
      
      return data;
    } catch (error) {
      console.error('Error processing T21 document:', error);
      throw error;
    }
  };
  
  // Add vehicle to database
  const addVehicleToDatabase = async (vehicleData) => {
    try {
      // Extract vehicle info from T21 data
      const { vin, year, make, model, purchase_price } = vehicleData;
      
      // Validate required fields
      if (!vin || vin.length !== 17) {
        throw new Error(`Invalid VIN: ${vin}`);
      }
      
      if (!year || !make || !model) {
        throw new Error('Missing required vehicle information (year, make, or model)');
      }
      
      // Check if vehicle already exists
      const { data: existingVehicles, error: checkError } = await supabase
        .from('assets')
        .select('id')
        .eq('vin', vin);
        
      if (checkError) throw checkError;
      
      if (existingVehicles && existingVehicles.length > 0) {
        // Vehicle exists, update it
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            year,
            make,
            model,
            purchase_price
          })
          .eq('vin', vin);
          
        if (updateError) throw updateError;
        
        return {
          id: existingVehicles[0].id,
          vin,
          status: 'updated'
        };
      } else {
        // Vehicle doesn't exist, insert it
        const { data: newVehicle, error: insertError } = await supabase
          .from('assets')
          .insert({
            vin,
            year,
            make,
            model,
            purchase_price,
            status: 'active'
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        
      // Add to appropriate fund based on deal type
      const fundId = vehicleData.deal_type === 'BHPH Financed' ? 'bhph' : 
                    vehicleData.deal_type === 'Cash' ? 'caps' : 'cos10';
                    
      const { error: fundError } = await supabase
        .from('fund_assets')
        .insert({
          asset_id: newVehicle.id,
          fund_id: fundId,
          display_order: 0
        });
        
      if (fundError) {
        // If fund association fails, we should clean up the vehicle to avoid orphaned records
        await supabase.from('assets').delete().eq('id', newVehicle.id);
        throw fundError;
      }
        
        return {
          id: newVehicle.id,
          vin,
          status: 'created',
          fund: fundId
        };
      }
    } catch (error) {
      console.error('Error adding vehicle to database:', error);
      throw error;
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadResults([]);
    setError(null);
    
    const results = [];
    
    try {
      for (const file of files) {
        // Process file with T21 parser
        const t21Data = await processT21Document(file);
        
        // For each vehicle in the T21 data
        for (const vehicle of t21Data.vehicles || []) {
          // Add vehicle to database
          const result = await addVehicleToDatabase(vehicle);
          
          results.push({
            fileName: file.name,
            vehicleVin: vehicle.vin,
            vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            status: result.status,
            fund: result.fund,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      setUploadResults(results);
    } catch (error) {
      console.error('Error during upload process:', error);
      setError('Failed to process files: ' + error.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFiles([]);
    }
  };
  
  // Check if user has upload permission
  const canUpload = userRole === 'Admin' || userRole === 'Partner One' || userRole === 'Partner Two';
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Upload T21 Documents</h2>
      
      {!canUpload ? (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md mb-4">
          You do not have permission to upload documents. Please contact an administrator.
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Upload T21 PDF documents to automatically extract vehicle information and add them to your inventory.
              The system will detect VIN, make, model, year, and purchase price from the documents.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf"
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Select T21 PDF Files
              </label>
              
              <p className="mt-2 text-sm text-gray-500">
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : 'Drag and drop files here or click to select'}
              </p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Selected Files:</h3>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
              
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`mt-4 px-4 py-2 rounded ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Process & Upload'
                )}
              </button>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {/* Upload results */}
          {uploadResults.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Upload Results:</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadResults.map((result, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.fileName}</td>
                        <td className="px-4 py-2 text-sm font-mono">{result.vehicleVin}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.vehicleInfo}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.status === 'created' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {result.status === 'created' ? 'Added' : 'Updated'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.fund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FileUploader;
