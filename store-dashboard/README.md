# RxMax Store Owner Dashboard

A comprehensive B2B2C pharmacy management platform dashboard for store owners. Built with React 18, React Router v6, recharts, and lucide-react icons.

## Features

### 1. Authentication
- **LoginPage**: Phone + password authentication with demo credentials
- **RegisterPage**: Multi-step registration (4 steps) with all required fields including pharmacy license and GST

### 2. Dashboard
- 4 key stat cards: Today's Revenue, Orders Today, Pending Refills, At-Risk Patients
- 30-day revenue trend chart
- Revenue at Risk alert (red)
- Refills Due This Week alert
- Recent orders table (5 most recent)

### 3. Order Management
- **OrdersPage**: Full order workflow with tabs for All, Pending, Confirmed, Preparing, Ready, Delivered
- Status counts on each tab
- Inline status update buttons
- Search and sort capabilities
- **OrderDetailPage**:
  - Visual timeline showing 5-step order progression
  - Patient info and order details
  - Items table with pricing
  - Total calculations
  - Status action buttons

### 4. Patient CRM
- **PatientsPage**:
  - Risk level filters (All, Low, Medium, High)
  - Comprehensive patient table with adherence score progress bar
  - Last order date tracking
  - Lifetime value display
- **PatientDetailPage**:
  - 4 stat cards: Adherence Score, Lifetime Value, Total Orders, Risk Level
  - Personal and medical information
  - Current medications table
  - Private notes (add/view)
  - Quick actions: Send Reminder, View Orders, Prescriptions

### 5. Prescription Management
- **PrescriptionsPage**:
  - Tabs: All, Pending, Reviewed
  - Prescription table with doctor info and submission dates
  - Review and View actions
  - Status badges

### 6. Inventory Management
- **InventoryPage**:
  - Expiry alerts (items expiring within 30 days)
  - Low stock alerts (items with stock < 100)
  - Full medicine list with stock levels
  - Selling price vs MRP display
  - Discount % tracking
  - Color-coded expiry countdown
  - Add Medicine and Bulk Upload buttons

### 7. Refill Intelligence (Key Differentiator)
- **RefillsPage**:
  - 3 summary cards: This Week's Refills, Revenue at Risk (RED), Conversion Rate
  - Auto-Nudge toggle with time configuration
  - Refill conversion trend chart (last 5 weeks)
  - Full refill table with:
    - Days remaining (color-coded)
    - Escalation levels (Low, Normal, Urgent, Critical)
    - Reminder status
    - Estimated value
    - Nudge action button

### 8. Analytics
- **AnalyticsPage**:
  - 4 KPI cards: Total Revenue, Total Orders, Avg Order Value, Repeat Rate
  - 30-day revenue trend line chart
  - Orders by status pie chart
  - New patients per week bar chart
  - Top 10 medicines by revenue (horizontal bar chart)
  - Daily statistics table (last 7 days)

### 9. Store Settings
- **SettingsPage**:
  - Store profile management (editable fields)
  - Business information section
  - Operating hours for all 7 days
  - Delivery settings (radius, charge, free delivery threshold)
  - Refill notifications (auto-nudge toggle, time picker, reminder days)
  - Subscription plan display
  - Danger zone: Deactivate store option

## Project Structure

```
store-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.js         # Navigation sidebar with nav badges
│   │   ├── StatCard.js        # Reusable stat card component
│   │   └── DataTable.js       # Advanced table with pagination, search, sort
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── DashboardPage.js
│   │   ├── OrdersPage.js
│   │   ├── OrderDetailPage.js
│   │   ├── PatientsPage.js
│   │   ├── PatientDetailPage.js
│   │   ├── PrescriptionsPage.js
│   │   ├── InventoryPage.js
│   │   ├── RefillsPage.js
│   │   ├── AnalyticsPage.js
│   │   └── SettingsPage.js
│   ├── services/
│   │   └── api.js             # API service with mock data fallback
│   ├── App.js                 # Main app router
│   ├── index.js               # React entry point
│   └── index.css              # Comprehensive styling (600+ lines)
├── package.json
├── .gitignore
└── README.md
```

## Technical Stack

- **React 18**: Modern React with hooks and functional components
- **React Router v6**: Client-side routing with nested routes
- **Recharts**: Beautiful charts (LineChart, BarChart, PieChart)
- **Lucide React**: 200+ high-quality icons
- **CSS Variables**: Primary #1B4F72, Accent #27AE60
- **Responsive Design**: Desktop-first with mobile breakpoints

## Installation & Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Steps

1. **Navigate to project directory**
```bash
cd /sessions/amazing-funny-galileo/mnt/Pharmacy\ App/rxmax-app/store-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

4. **Build for production**
```bash
npm run build
```

## Demo Credentials

- **Phone**: 9876543200
- **Password**: demo123

These credentials are pre-filled and work with the comprehensive mock data.

## Mock Data

The application includes comprehensive mock data for:
- **15 Patients**: With varying risk levels, adherence scores, and medical conditions
- **20 Orders**: With different statuses and amounts
- **20 Inventory Items**: With stock levels, expiry dates, and pricing
- **10 Refills**: With various escalation levels and reminder statuses
- **30 Days Revenue Data**: For trend analysis
- **5 Prescriptions**: With doctor and patient information
- **1 Store Profile**: Fully populated with all settings

## API Integration

The `api.js` service provides:
- Real backend API calls with proper error handling
- Automatic fallback to mock data when backend is unavailable
- All CRUD operations for patients, orders, inventory, etc.
- Authentication and registration endpoints
- Settings management endpoints

### Backend Integration

To connect to a real backend, set the API URL:
```bash
REACT_APP_API_URL=http://your-api.com/api
```

## Design System

### Colors
- **Primary**: #1B4F72 (Dark Blue)
- **Secondary**: #2E86C1 (Medium Blue)
- **Accent/Success**: #27AE60 (Green)
- **Warning**: #F39C12 (Orange)
- **Danger**: #E74C3C (Red)

### Typography
- **Body Font**: System UI (Segoe UI, -apple-system, etc.)
- **Font Sizes**: 12px to 32px for different hierarchy levels
- **Font Weights**: 400, 500, 600, 700

### Layout
- **Sidebar**: Fixed 280px width, desktop-first
- **Main Content**: Flexible, with 32px padding
- **Card Padding**: 24px
- **Grid Gap**: 24px
- **Max Width**: 1600px

## Key Features Implementation

### DataTable Component
- Search across specified field
- Sort by any column (ascending/descending)
- Pagination (10 items per page)
- Custom cell rendering
- Click to navigate (optional)

### Sidebar Navigation
- Active state indication
- Badge counts (pending orders, refills)
- Icons for visual clarity
- Logout functionality

### Charts
- Responsive containers
- Tooltip on hover
- Legend display
- Currency formatting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Component-based architecture
- Memoization where applicable
- Lazy loading ready
- Optimized re-renders
- CSS variables for theme switching

## Future Enhancements

1. Real-time notifications
2. Advanced analytics filters
3. Prescription image upload
4. Payment integration
5. Customer support chat
6. Bulk operations
7. Export to PDF/Excel
8. Multi-language support
9. Dark mode theme
10. Two-factor authentication

## File Sizes

- **Total CSS**: ~25KB (comprehensive, desktop-first)
- **API Service**: ~30KB (with complete mock data)
- **Page Components**: ~85KB (12 pages)
- **Core Components**: ~8KB (Sidebar, StatCard, DataTable)

## Notes

- All pages are fully functional with comprehensive mock data
- The dashboard works standalone without requiring a backend
- Login automatically stores auth token in localStorage
- Responsive design adapts to tablets and mobile devices
- Form validations are included where necessary

## Support

For issues or questions, refer to the existing codebase structure or the mock data definitions in `src/services/api.js`.
