import React, { useState, useEffect } from 'react';

const AddToFundModal = ({ selectedAsset, selectedFund, setSelectedFund, setShowAddToFund, setSelectedAsset, submitAddToFund }) => {
  const [existingFundInfo, setExistingFundInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if asset is already in a fund whenever the selected asset changes
  useEffect(() => {
    const checkExistingFund = async () => {
      if (!selectedAsset) return;
      
      setIsLoading(true);
      try {
        const { supabase } = await import('../supabaseClient');
        
        const { data, error } = await supabase
          .from('fund_assets')
          .select('id, fund_id')
          .eq('asset_id', selectedAsset.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Asset is already in a fund
          const fundNames = {
            'cha10': 'Charleston (Partner One)',
            'tra10': 'Trade-in (Partner Two)',
            'bhph': 'Buy Here Pay Here',
            'caps': 'Capital Shares',
            'cos10': 'Consignment 10%',
            'disabled': 'Disabled'
          };
          
          setExistingFundInfo({
            id: data[0].id,
            fundId: data[0].fund_id,
            fundName: fundNames[data[0].fund_id] || data[0].fund_id
          });
          
          // Pre-select the current fund
          setSelectedFund(data[0].fund_id);
        }
      } catch (error) {
        console.error('Error checking existing fund:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingFund();
  }, [selectedAsset, setSelectedFund]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {existingFundInfo ? 'Update' : 'Add'} {selectedAsset.year} {selectedAsset.make} {selectedAsset.model} to Fund
          </h3>
          <button
            onClick={() => {
              setShowAddToFund(false);
              setSelectedAsset(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Checking fund status...</p>
          </div>
        ) : (
          <>
            {existingFundInfo && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  This asset is currently in the <span className="font-medium">{existingFundInfo.fundName}</span> fund.
                </p>
                <p className="text-xs mt-1 text-yellow-700">
                  {existingFundInfo.fundId === selectedFund
                    ? "You can update the price or keep it in the same fund."
                    : "Selecting a different fund will move it from its current fund."}
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Fund
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={selectedFund}
                onChange={(e) => setSelectedFund(e.target.value)}
              >
                <option value="" disabled>Select a fund...</option>
                <option value="cha10">Charleston (Partner One)</option>
                <option value="tra10">Trade-in (Partner Two)</option>
                <option value="bhph">Buy Here Pay Here</option>
                <option value="caps">Capital Shares</option>
                <option value="cos10">Consignment 10%</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddToFund(false);
                  setSelectedAsset(null);
                  setSelectedFund('');
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAddToFund}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!selectedFund}
              >
                {existingFundInfo ? (existingFundInfo.fundId === selectedFund ? 'Update Fund' : 'Move to Fund') : 'Add to Fund'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddToFundModal;
