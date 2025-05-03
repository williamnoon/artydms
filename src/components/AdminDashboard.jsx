import React, { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../supabaseClient';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    unassignedAssets: 0,
    fundMetrics: [],
    recentTransactions: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all assets to get total count
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('*, fund_assets(fund_id, disposition_price)');
          
        if (assetsError) throw new Error(handleSupabaseError(assetsError));
        
        // Process assets data
        const processedAssets = assets || [];
        const assignedAssets = processedAssets.filter(asset => 
          asset.fund_assets && asset.fund_assets.length > 0
        );
        
        // Get fund data for metrics
        const { data: funds, error: fundsError } = await supabase
          .from('fund_assets')
          .select(`
            fund_id,
            disposition_price,
            assets:asset_id(id, make, model, year, vin, total_cost, sales_price)
          `);
          
        if (fundsError) throw new Error(handleSupabaseError(fundsError));
        
        // Calculate fund metrics
        const fundCounts = {};
        const fundValues = {};
        
        funds.forEach(item => {
          const fundId = item.fund_id;
          
          // Initialize or increment fund count
          fundCounts[fundId] = (fundCounts[fundId] || 0) + 1;
          
          // Add to fund value if disposition_price exists
          const price = item.disposition_price || 
            (item.assets ? item.assets.sales_price || item.assets.total_cost : 0);
            
          fundValues[fundId] = (fundValues[fundId] || 0) + Number(price || 0);
        });
        
        // Convert to array for display
        const fundMetrics = Object.keys(fundCounts).map(fundId => ({
          id: fundId,
          name: getFundName(fundId),
          count: fundCounts[fundId],
          totalValue: fundValues[fundId]
        }));
        
        // Sort by count descending
        fundMetrics.sort((a, b) => b.count - a.count);
        
        // Get recent transactions (fund assignments or changes)
        // For a real app, we'd have a transactions table, but we'll use fund_assets as proxy
        const { data: recentAssignments, error: transError } = await supabase
          .from('fund_assets')
          .select(`
            *,
            assets:asset_id(id, make, model, year, vin)
          `)
          .order('added_at', { ascending: false })
          .limit(5);
          
        if (transError) throw new Error(handleSupabaseError(transError));
        
        const recentTransactions = recentAssignments.map(item => ({
          id: item.id,
          date: new Date(item.added_at).toLocaleDateString(),
          time: new Date(item.added_at).toLocaleTimeString(),
          fundId: item.fund_id,
          fundName: getFundName(item.fund_id),
          asset: item.assets,
          amount: item.disposition_price || 0
        }));
        
        setMetrics({
          totalAssets: processedAssets.length,
          unassignedAssets: processedAssets.length - assignedAssets.length,
          fundMetrics,
          recentTransactions
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(`Failed to load dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Helper function to get fund name from ID
  const getFundName = (fundId) => {
    const fundNames = {
      'cha10': 'Charleston (Partner One)',
      'tra10': 'Trade-in (Partner Two)',
      'bhph': 'Buy Here Pay Here',
      'caps': 'Capital Shares',
      'cos10': 'Consignment 10%',
      'disabled': 'Disabled'
    };
    
    return fundNames[fundId] || fundId;
  };
  
  // Helper function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
      
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-blue-700">{metrics.totalAssets}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Unassigned Assets</div>
          <div className="text-2xl font-bold text-amber-600">{metrics.unassignedAssets}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Active Funds</div>
          <div className="text-2xl font-bold text-green-600">{metrics.fundMetrics.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Total Asset Value</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(metrics.fundMetrics.reduce((sum, fund) => sum + fund.totalValue, 0))}
          </div>
        </div>
      </div>
      
      {/* Fund Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Fund Allocation</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.fundMetrics.map(fund => (
                <tr key={fund.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fund.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fund.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(fund.totalValue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(fund.count > 0 ? fund.totalValue / fund.count : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        {metrics.recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metrics.recentTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date} {transaction.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.asset ? 
                        `${transaction.asset.year} ${transaction.asset.make} ${transaction.asset.model}` : 
                        'Unknown Asset'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.fundName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Partition by Partner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partner One */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Partner One</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Fund Value (Charleston):</span>
              <span className="font-medium">
                {formatCurrency(
                  metrics.fundMetrics
                    .filter(f => f.id === 'cha10')
                    .reduce((sum, fund) => sum + fund.totalValue, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assets in Charleston Fund:</span>
              <span className="font-medium">
                {metrics.fundMetrics
                  .filter(f => f.id === 'cha10')
                  .reduce((sum, fund) => sum + fund.count, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Share of Joint Funds:</span>
              <span className="font-medium">
                {formatCurrency(
                  metrics.fundMetrics
                    .filter(f => f.id === 'bhph' || f.id === 'caps')
                    .reduce((sum, fund) => sum + fund.totalValue / 2, 0)
                )}
              </span>
            </div>
          </div>
        </div>
        
        {/* Partner Two */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Partner Two</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Fund Value (Trade-in):</span>
              <span className="font-medium">
                {formatCurrency(
                  metrics.fundMetrics
                    .filter(f => f.id === 'tra10')
                    .reduce((sum, fund) => sum + fund.totalValue, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assets in Trade-in Fund:</span>
              <span className="font-medium">
                {metrics.fundMetrics
                  .filter(f => f.id === 'tra10')
                  .reduce((sum, fund) => sum + fund.count, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Share of Joint Funds:</span>
              <span className="font-medium">
                {formatCurrency(
                  metrics.fundMetrics
                    .filter(f => f.id === 'bhph' || f.id === 'caps')
                    .reduce((sum, fund) => sum + fund.totalValue / 2, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
