import React from 'react';

const AssetCard = ({ asset, userRole, adminPrices, partnerSuggestions, setAdminPrices, setPartnerSuggestions, handleAddToFund, formatCurrency, formatNumber }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <h3 className="font-bold text-lg">{asset.year} {asset.make} {asset.model}</h3>
    </div>
    <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center">
        {userRole === 'Admin' ? (
          <input
            type="number"
            className="w-28 p-1 border border-gray-300 rounded mr-2"
            placeholder="Set price"
            value={adminPrices[asset.id] !== undefined ? adminPrices[asset.id] : (asset.disposition_price || '')}
            onChange={e => setAdminPrices(prices => ({ ...prices, [asset.id]: e.target.value }))}
          />
        ) : userRole.includes('Partner') ? (
          <input
            type="number"
            className="w-28 p-1 border border-gray-300 rounded mr-2"
            placeholder="Suggest price"
            value={partnerSuggestions[asset.id] || ''}
            onChange={e => setPartnerSuggestions(sugs => ({ ...sugs, [asset.id]: e.target.value }))}
          />
        ) : asset.disposition_price ? (
          <span className="font-medium">{formatCurrency(asset.disposition_price)}</span>
        ) : (
          <span className="italic text-gray-400">No price set</span>
        )}
      </div>
      <div className="flex items-center">
        <span className="text-gray-600">{formatNumber(asset.mileage)} mi</span>
      </div>
    </div>
    <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
        <span className="text-gray-600">{asset.dealerCode}</span>
      </div>
      <div className="flex items-center">
        <svg className="w-5 h-5 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-gray-600">{asset.location}</span>
      </div>
    </div>
    <div className="p-4">
      <button 
        onClick={() => handleAddToFund(asset)}
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <span className="mr-1">Add to Fund</span>
      </button>
      <button className="w-full mt-2 text-sm text-gray-600 hover:text-blue-600 flex items-center justify-center">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Details & Transaction History
      </button>
    </div>
  </div>
);

export default AssetCard;
