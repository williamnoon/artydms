# AutoSale Financial System

A comprehensive financial management system for automotive sales, featuring role-based access control, asset tracking, fund management, and financial calculations.

## Features

- **Asset Management**: Track vehicle inventory with complete details
- **Fund Management**: Organize vehicles into different partnership funds
- **Transaction Tracking**: Record and analyze vehicle transactions
- **Role-Based Access**: Different views for administrators and partners
- **Financial Calculator**: Calculate payments, fees, and taxes
- **Admin Dashboard**: View metrics and financial performance
- **Document Generation**: Create buyers' orders, bills of sale, and receipts

## Tech Stack

- React 18
- Tailwind CSS
- Supabase for database
- Vite for build system

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/autosale.git
   cd autosale
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Project Structure

- `/src`: Application source code
  - `/components`: Reusable UI components
  - `/services`: API services and business logic
  - `/styles`: CSS and styling
  - `/utils`: Utility functions
  - `/assets`: Static assets

## License

MIT
