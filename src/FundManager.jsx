import React, { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from './supabaseClient';

const FundManager = ({ userRole }) => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);

  // Define fund information
  const fundInfo = {
    'cha10': {
      name: 'Charleston (Partner One)',
      description: 'Fund managed by Partner One for Charleston area vehicles',
      owner: 'Partner One',
      feePercentage: 10
    },
    'tra10': {
      name: 'Trade-in (Partner Two)',
      description: 'Fund managed by Partner Two for trade-in vehicles',
      owner: 'Partner Two',
      feePercentage: 10
    },
    'bhph': {
      name: 'Buy Here Pay Here',
      description: 'Joint ownership fund for in-house financed vehicles',
      owner: 'Both Partners',
      feePercentage: 0
    },
    'caps': {
      name: 'Capital Shares',
      description: 'Shared investment fund with equal ownership',
      owner: 'Both Partners',
      feePercentage: 0
    },
    'cos10': {
      name: 'Consignment 10%',
      description: 'Consignment vehicles with 10% fee structure',
      owner: 'External',
      feePercentage: 10
    },
    'disabled': {
      name: 'Disabled',
      description: 'Inactive or disabled vehicles',
      owner: 'N/A',
      feePercentage: 0
    }
  };

  // Fetch fund statistics
  useEffect(() => {
    const fetchFundStats = async () => {
      try {
        setLoading(true);
        
        // Get all fund_assets with their associated assets including purchase_price
        const { data, error } = await supabase
          .from('fund_assets')
          .select(`
            fund_id,
            assets (
              id, 
              sales_price
            )
          `);
          
        if (error) {
          throw new Error(handleSupabaseError(error));
        }
        
        const fundStats = {};
        const fundIds = Object.keys(fundInfo);
        
        // Initialize all funds with zero values
        fundIds.forEach(fundId => {
          fundStats[fundId] = {
            id: fundId,
            name: fundInfo[fundId].name,
            description: fundInfo[fundId].description,
            owner: fundInfo[fundId].owner,
            feePercentage: fundInfo[fundId].feePercentage,
            assetCount: 0,
            totalValue: 0 // Initialize with 0 instead of null
          };
        });
        
        // Aggregate statistics (count and total value)
        data.forEach(item => {
          const fundId = item.fund_id;
          if (!fundStats[fundId]) return;
          
          fundStats[fundId].assetCount += 1;
          
          // Add asset value to total if available
          if (item.assets && item.assets.sales_price) {
            fundStats[fundId].totalValue += Number(item.assets.sales_price) || 0;
          }
        });
        
        // Convert to array and sort by asset count
        const fundsArray = Object.values(fundStats).sort((a, b) => b.assetCount - a.assetCount);
        setFunds(fundsArray);
      } catch (error) {
        console.error('Error fetching fund statistics:', error);
        setError('Failed to load fund statistics: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFundStats();
  }, []);

  // Check if user has access to a fund
  const hasAccess = (fund) => {
    if (userRole === 'Admin') return true;
    if (userRole === 'Partner One' && (fund.owner === 'Partner One' || fund.owner === 'Both Partners')) return true;
    if (userRole === 'Partner Two' && (fund.owner === 'Partner Two' || fund.owner === 'Both Partners')) return true;
    return false;
  };

  // Filter funds based on user role
  const visibleFunds = funds.filter(fund => hasAccess(fund));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Fund Management</h2>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading funds...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Funds grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleFunds.map(fund => (
            <div 
              key={fund.id} 
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-bold text-lg">{fund.name}</h3>
                <p className="text-sm text-gray-600">{fund.description}</p>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Owner:</span>
                  <span className="font-medium">{fund.owner}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Fee Percentage:</span>
                  <span className="font-medium">{fund.feePercentage}%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Asset Count:</span>
                  <span className="font-medium">{fund.assetCount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(fund.totalValue || 0)}
                  </span>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setSelectedFund(fund)}
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Fund details modal */}
      {selectedFund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedFund.name}</h3>
              <button
                onClick={() => setSelectedFund(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">{selectedFund.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Fund Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{selectedFund.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee Percentage:</span>
                    <span className="font-medium">{selectedFund.feePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fund ID:</span>
                    <span className="font-mono text-sm">{selectedFund.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Asset Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets:</span>
                    <span className="font-medium">{selectedFund.assetCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(selectedFund.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Value:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(selectedFund.assetCount > 0 ? selectedFund.totalValue / selectedFund.assetCount : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              {userRole === 'Admin' && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Fund
                </button>
              )}
              <button
                onClick={() => setSelectedFund(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManager;
