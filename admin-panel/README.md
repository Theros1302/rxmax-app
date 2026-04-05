# RxMax Admin Panel

A complete platform-level admin dashboard for RxMax - a B2B2C pharmacy platform. This is a fully functional, production-ready React application for managing stores, patients, orders, and platform analytics.

## Features

### 1. Authentication
- **LoginPage** - Secure admin login with demo credentials
  - Phone + password authentication
  - Dark-themed login interface
  - Demo Credentials: Phone: `9999999999` | Password: `rxmaxadmin2026`

### 2. Dashboard
- **Platform Overview** with 6 KPI stat cards:
  - Total Stores (with growth %)
  - Total Patients (with growth %)
  - Total Orders (this month)
  - Total Revenue (this month in lakhs ₹)
  - Active Refill Reminders
  - Platform GMV (all-time)
- **Revenue Trend Chart** (last 6 months, LineChart)
- **Orders by City** (BarChart - 6 major cities)
- **Recent Store Signups Table** (5 most recent)
- **Platform Health Indicators** (System status, API uptime, active users, response time)

### 3. Stores Management
- **DataTable** with comprehensive store information:
  - Store Name, Owner, City, Plan, Patients, Orders, Revenue, Status, Verified
- **Filters & Search** - City dropdown, Plan dropdown, Text search
- **Store Details Page** with:
  - Store profile information
  - 4 stat cards (Patients, Orders, Revenue, Avg Order Value)
  - 30-day revenue trend chart
  - Patient list table
  - Order history table
  - Actions: Activate/Deactivate, Change Plan, Verify, Send Notification

### 4. Patients Management
- **DataTable** with patient information:
  - Name, Phone, Connected Store, Orders, Lifetime Value, Risk Level, Last Active
- **Search & Filter** - Search by name/phone/store, filter by risk level
- Risk level indicators (Low, Medium, High)

### 5. Orders Management
- **DataTable** with order information:
  - Order ID, Store, Patient, Amount, Status, Date
- **Filter & Search** - Filter by status, search by order ID/patient/store
- Status indicators (Delivered, Processing, Pending)

### 6. Platform Analytics
- **Revenue by City** (PieChart)
- **Store Growth Trend** (LineChart - new stores per month)
- **Patient Growth Trend** (LineChart - new patients per month)
- **Top 10 Stores by Revenue** (Horizontal BarChart)
- **Top 10 Medicines by Orders** (Horizontal BarChart)
- **Store Performance Comparison Table** with detailed metrics

### 7. Refill Analytics
- **Summary Cards:**
  - Active Reminders
  - Conversion Rate
  - Revenue Recovered
- **Refill Performance by Store** (BarChart)
- **Escalation Level Distribution** (PieChart)
- **Conversion Rate Trend** (LineChart)
- **Overdue Reminders Table** with escalation levels

### 8. Settings Page
- **Admin Profile** - User account information
- **Platform Configuration** - System settings (name, version, support email)
- **Subscription Plans** - View all available pricing tiers and features
- **API Key Management** - View and manage API credentials (masked display)
- **Security Settings** - Change password, 2FA, login activity

## Technology Stack

- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization and charts
- **Lucide React** - Icon library
- **CSS Variables** - Theming and styling

## Color Scheme

- Primary: `#0D1B2A` (Dark Navy)
- Accent: `#1B4F72` (Blue)
- Success: `#27AE60` (Green)
- Warning: `#F39C12` (Orange)
- Danger: `#E74C3C` (Red)
- Background: `#0F1419` (Very Dark)
- Surface: `#151D28` (Dark)

## File Structure

```
rxmax-app/admin-panel/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   ├── StoresPage.js
│   │   ├── StoreDetailPage.js
│   │   ├── PatientsPage.js
│   │   ├── OrdersPage.js
│   │   ├── AnalyticsPage.js
│   │   ├── RefillsPage.js
│   │   └── SettingsPage.js
│   ├── components/
│   │   ├── AdminSidebar.js
│   │   ├── StatCard.js
│   │   ├── DataTable.js
│   │   └── StatusBadge.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Components

### AdminSidebar
Fixed navigation sidebar with:
- RxMax branding/logo
- Navigation links with active states
- Badge indicators for alerts
- User profile section with logout

### StatCard
Reusable stat card component displaying:
- Icon
- Label
- Value with proper formatting
- Change percentage with trend indicator
- Support for custom units (₹, %)

### DataTable
Comprehensive data table with:
- Pagination (10 rows/page)
- Search functionality
- Filter dropdowns
- Custom cell renderers
- Row click handlers
- Responsive design

### StatusBadge
Status indicator badges for:
- Active/Inactive states
- Verified/Unverified states
- Order statuses (Delivered, Processing, Pending)
- Plan types (Free, Basic, Pro)
- Risk levels (Low, Medium, High)

## Mock Data

The API service includes comprehensive mock data:
- **12 Stores** across 6 cities (Mumbai, Delhi, Hyderabad, Bangalore, Chennai, Pune)
- **50+ Patients** across all stores with lifetime values and risk levels
- **40+ Orders** with various statuses and dates
- **6 Months** of revenue data
- **30 Days** of store-specific revenue trends
- Medicine analytics with top 10 medicines by orders
- Store performance metrics and growth trends

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## Usage

1. Navigate to the login page
2. Enter demo credentials:
   - Phone: `9999999999`
   - Password: `rxmaxadmin2026`
3. Access the dashboard and all admin features
4. Use sidebar navigation to browse different sections
5. All data tables support search and filtering

## API Structure

All API calls are mocked in `src/services/api.js` with the following endpoints:

- `getDashboardMetrics()` - Dashboard KPIs and charts data
- `getAllStores()` - List all stores
- `getStore(id)` - Get specific store details
- `getStorePatients(storeId)` - Get patients for a store
- `getStoreOrders(storeId)` - Get orders for a store
- `getStoreRevenue30Days(storeId)` - Get 30-day revenue for a store
- `getAllPatients()` - List all patients
- `getPatient(id)` - Get specific patient
- `getAllOrders()` - List all orders
- `getOrder(id)` - Get specific order
- `getAnalytics()` - Platform analytics data
- `getRefillMetrics()` - Refill performance data
- `login(phone, password)` - Authentication
- `getPlatformSettings()` - Settings and configuration

## Responsive Design

The application is designed with desktop-first approach but includes responsive breakpoints:
- Desktop: Full sidebar + content layout
- Tablet (1024px): Adjusted sidebar width
- Mobile (768px): Optimized for smaller screens with flexible layouts

## Features

- Dark theme optimized for extended use
- Smooth animations and transitions
- Comprehensive data tables with pagination
- Interactive charts with tooltips
- Status indicators and badges
- Real-time data filtering and search
- Professional admin interface

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - RxMax Platform

## Author

Built as a complete B2B2C admin platform for RxMax pharmacy operations.
