import React, { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from './supabaseClient';
import AssetCard from './components/AssetCard';
import AddToFundModal from './components/AddToFundModal';

const AssetManager = ({ userRole }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('year');
  const [sortDirection, setSortDirection] = useState('desc');
  // Local state for admin-set and partner-suggested prices
  const [adminPrices, setAdminPrices] = useState({});
  const [partnerSuggestions, setPartnerSuggestions] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAddToFund, setShowAddToFund] = useState(false);
  const [selectedFund, setSelectedFund] = useState('');
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);

  // Fetch assets from Supabase
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        
        // Get assets with their fund associations
        const { data, error } = await supabase
          .from('assets')
          .select(`
            *,
            fund_assets(fund_id, disposition_price)
          `);
        console.log('Fetched assets:', data);
        if (error) {
          console.error('Supabase fetch error:', error);
          throw new Error(handleSupabaseError(error));
        }
        
        // Process the data to include fund information
        const processedAssets = (data || []).map(asset => {
          // Get fund ID from fund_assets if available
          const fundId = asset.fund_assets && asset.fund_assets.length > 0 
            ? asset.fund_assets[0].fund_id 
            : null;
            
          return {
            ...asset,
            fundId,
            // Generate random values for demo purposes
            mileage: Math.floor(Math.random() * 250000),
            dealerCode: Math.floor(Math.random() * 1000000).toString(),
            location: 'AAA - Charleston | SC',
            disposition_price: asset.fund_assets && asset.fund_assets.length > 0 ? asset.fund_assets[0].disposition_price : null
          };
        });
        
        setAssets(processedAssets);

        // Initialize admin prices with total_cost values
        if (userRole === 'Admin') {
          const initialPrices = {};
          processedAssets.forEach(asset => {
            initialPrices[asset.id] = asset.disposition_price || asset.total_cost || '';
          });
          setAdminPrices(initialPrices);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
        setError('Failed to load assets: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, [userRole]);

  // Filter assets based on search term (show all assets if search is empty)
  const filteredAssets = searchTerm.trim() === ''
    ? assets
    : assets.filter(asset => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          asset.vin?.toLowerCase().includes(searchTermLower) ||
          asset.make?.toLowerCase().includes(searchTermLower) ||
          asset.model?.toLowerCase().includes(searchTermLower) ||
          asset.year?.toString().includes(searchTermLower)
        );
      });

  // Sort assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortBy === 'year') {
      return sortDirection === 'asc' 
        ? (a.year || 0) - (b.year || 0)
        : (b.year || 0) - (a.year || 0);
    } else {
      return sortDirection === 'asc'
        ? (a[sortBy] || '').localeCompare(b[sortBy] || '')
        : (b[sortBy] || '').localeCompare(a[sortBy] || '');
    }
  });

  // Handle adding asset to fund
  const handleAddToFund = (asset) => {
    setSelectedAsset(asset);
    setShowAddToFund(true);
  };

  // Initialize all asset prices with total_cost
  const initializeAllPrices = async () => {
    if (userRole !== 'Admin') return;
    
    try {
      // First, update local state
      const newPrices = {};
      assets.forEach(asset => {
        newPrices[asset.id] = asset.total_cost || '';
      });
      setAdminPrices(newPrices);
      
      // Then, update in database for assets already in funds
      const updates = assets
        .filter(asset => asset.fundId)
        .map(asset => ({
          asset_id: asset.id,
          fund_id: asset.fundId,
          disposition_price: Number(asset.total_cost) || null
        }));
      
      if (updates.length > 0) {
        const { error } = await supabase
          .from('fund_assets')
          .upsert(updates, { onConflict: ['asset_id', 'fund_id'] });
          
        if (error) throw new Error(handleSupabaseError(error));
        
        // Update local asset state
        setAssets(assets.map(asset => {
          if (asset.fundId) {
            return { ...asset, disposition_price: Number(asset.total_cost) || null };
          }
          return asset;
        }));
      }
      
      setShowBulkPriceModal(false);
    } catch (error) {
      console.error('Error initializing prices:', error);
      setError('Failed to initialize prices: ' + error.message);
    }
  };

  // Submit add to fund
  const submitAddToFund = async () => {
    if (!selectedAsset || !selectedFund) return;
    try {
      // Check if asset is already in any fund
      const { data: existingRelation, error: checkExistingError } = await supabase
        .from('fund_assets')
        .select('id, fund_id')
        .eq('asset_id', selectedAsset.id);
      if (checkExistingError) throw new Error(handleSupabaseError(checkExistingError));
      
      // Use total_cost as default price if adminPrice is not set
      const adminPrice = adminPrices[selectedAsset.id] 
        ? Number(adminPrices[selectedAsset.id]) 
        : Number(selectedAsset.total_cost) || null;
      
      if (existingRelation && existingRelation.length > 0) {
        const existingFund = existingRelation[0];
        
        if (existingFund.fund_id === selectedFund) {
          // Asset already in this fund, just update disposition_price
          const { error: updateError } = await supabase
            .from('fund_assets')
            .update({ disposition_price: adminPrice })
            .eq('id', existingFund.id);
          if (updateError) throw new Error(handleSupabaseError(updateError));
        } else {
          // Asset in a different fund - update the fund_id
          const { error: updateError } = await supabase
            .from('fund_assets')
            .update({ 
              fund_id: selectedFund,
              disposition_price: adminPrice 
            })
            .eq('id', existingFund.id);
          if (updateError) throw new Error(handleSupabaseError(updateError));
        }
      } else {
        // Asset not in any fund, create new fund association
        const { error: insertError } = await supabase
          .from('fund_assets')
          .insert({
            asset_id: selectedAsset.id,
            fund_id: selectedFund,
            display_order: 0,
            disposition_price: adminPrice
          });
        if (insertError) throw new Error(handleSupabaseError(insertError));
      }
      // Update local state
      setAssets(assets.map(a => {
        if (a.id === selectedAsset.id) {
          return { ...a, fundId: selectedFund, disposition_price: adminPrice };
        }
        return a;
      }));
      // Reset form
      setShowAddToFund(false);
      setSelectedAsset(null);
      setSelectedFund('');
    } catch (error) {
      console.error('Error adding asset to fund:', error);
      setError('Failed to add asset to fund: ' + error.message);
    }
  };

  // Check if user has access to an asset based on fund
  const hasAccess = (asset) => {
    if (userRole === 'Admin') return true;
    if (userRole === 'Partner One' && (!asset.fundId || asset.fundId === 'cha10' || asset.fundId === 'bhph' || asset.fundId === 'caps')) return true;
    if (userRole === 'Partner Two' && (!asset.fundId || asset.fundId === 'tra10' || asset.fundId === 'bhph' || asset.fundId === 'caps')) return true;
    return false;
  };

  // Filter assets: first remove assets that are already in a fund, then filter by user role
  const unassignedAssets = sortedAssets.filter(asset => !asset.fundId);
  const visibleAssets = unassignedAssets.filter(asset => hasAccess(asset));
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };
  
  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  return (
    <div className="bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Unassigned Assets</h2>
        {userRole === 'Admin' && (
          <button 
            onClick={() => initializeAllPrices()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Initialize All Prices to Total Cost
          </button>
        )}
      </div>
      
      {/* Search bar */}
      <div className="relative mb-8">
        <div className="flex items-center bg-white rounded-lg border border-gray-300 px-4 py-2">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search assets or type / to chat with ARTY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none"
          />
        </div>
        <div className="text-center text-blue-600 mt-2">
          <button className="text-sm flex items-center justify-center mx-auto">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Chat with ARTY
          </button>
        </div>
      </div>
    
      {/* Loading state */}
      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading assets...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {/* Assets grid */}
      {!loading && !error && (
        <div>
          <div className="mb-2 text-xs text-gray-400">Fetched assets: {assets.length}, After filter: {visibleAssets.length}</div>
          {visibleAssets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No assets found. Please check your database or filter settings.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  userRole={userRole}
                  adminPrices={adminPrices}
                  partnerSuggestions={partnerSuggestions}
                  setAdminPrices={setAdminPrices}
                  setPartnerSuggestions={setPartnerSuggestions}
                  handleAddToFund={handleAddToFund}
                  formatCurrency={formatCurrency}
                  formatNumber={formatNumber}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {showAddToFund && selectedAsset && (
        <AddToFundModal
          selectedAsset={selectedAsset}
          selectedFund={selectedFund}
          setSelectedFund={setSelectedFund}
          setShowAddToFund={setShowAddToFund}
          setSelectedAsset={setSelectedAsset}
          submitAddToFund={submitAddToFund}
        />
      )}
    </div>
  );
};

export default AssetManager;
