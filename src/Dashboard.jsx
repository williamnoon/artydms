import React, { useState } from 'react';

import AssetManager from './AssetManager';
import FundManager from './FundManager';
import FileUploader from './FileUploader';
import RoleBasedVehicleCalculator from './RoleBasedVehicleCalculator';
import AdminDashboard from './components/AdminDashboard';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  
  // User simulation - in a real app, this would come from authentication
  const [userRole, setUserRole] = useState('Admin');
  const [userName, setUserName] = useState('Admin');
  
  // All possible users for demo
  const demoUsers = [
    { label: 'Admin', role: 'Admin', name: 'Admin' },
    { label: 'Partner One', role: 'Partner One', name: 'Partner One' },
    { label: 'Partner Two', role: 'Partner Two', name: 'Partner Two' },
    { label: 'External Owner 1', role: 'Owner', name: 'External Owner 1' },
    { label: 'External Owner 2', role: 'Owner', name: 'External Owner 2' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-bold">AutoSale Financial System</h1>
          </div>
          
          {/* User Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm">Logged in as:</span>
            <select
              value={userName}
              onChange={e => {
                const selectedUser = demoUsers.find(u => u.name === e.target.value);
                setUserName(selectedUser.name);
                setUserRole(selectedUser.role === 'Owner' ? selectedUser.name : selectedUser.role);
              }}
              className="p-1 text-sm bg-blue-700 border border-blue-600 rounded"
            >
              {demoUsers.map(u => (
                <option key={u.name} value={u.name}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-1">
            {userRole === 'Admin' && (
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-3 font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                >
                  Dashboard
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-3 font-medium ${activeTab === 'calculator' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
              >
                Financial Calculator
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-4 py-3 font-medium ${activeTab === 'assets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
              >
                Assets
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('funds')}
                className={`px-4 py-3 font-medium ${activeTab === 'funds' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
              >
                Funds
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-3 font-medium ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
              >
                Upload
              </button>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'calculator' && <RoleBasedVehicleCalculator userRole={userRole} userName={userName} />}
        {activeTab === 'assets' && <AssetManager userRole={userRole} />}
        {activeTab === 'funds' && <FundManager userRole={userRole} />}
        {activeTab === 'upload' && <FileUploader userRole={userRole} />}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          &copy; {new Date().getFullYear()} AutoSale Financial System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
