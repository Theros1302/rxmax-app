# RxMax Admin Panel - Quick Start Guide

## Installation & Running

### Step 1: Install Dependencies
```bash
cd /sessions/amazing-funny-galileo/mnt/Pharmacy\ App/rxmax-app/admin-panel
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

The application will open at `http://localhost:3000`

### Step 3: Login
Use the demo credentials:
- **Phone:** 9999999999
- **Password:** rxmaxadmin2026

## Navigation

### Sidebar Menu
- **Dashboard** - Platform overview with KPIs
- **Stores** - Manage all pharmacy stores
- **Patients** - View all patients across platform
- **Orders** - Manage all orders
- **Analytics** - Platform insights and trends
- **Refills** - Refill performance and reminders
- **Settings** - Admin settings and API keys

## Key Features

### Dashboard
- 6 KPI cards showing platform metrics
- Revenue trend over last 6 months
- Orders distribution by city
- Recent store signups

### Stores Management
- View all 12 stores with details
- Click any store to see detailed analytics
- Search by store name or owner
- Filter by city or plan

### Store Details
- Store profile information
- 30-day revenue chart
- Patient list for the store
- Order history
- Management actions (Activate, Change Plan, Verify, Send Notification)

### Patients
- Search 50+ patients across all stores
- Filter by risk level (Low/Medium/High)
- View lifetime values and order counts

### Orders
- View 40+ orders across platform
- Filter by status (Delivered/Processing/Pending)
- Search by order ID or patient name

### Analytics
- Revenue distribution by city (pie chart)
- Store growth trends (line chart)
- Patient growth trends (line chart)
- Top 10 stores by revenue
- Top 10 medicines by orders
- Store performance comparison

### Refills
- Active reminders count
- Conversion rate metrics
- Revenue recovered
- Refill performance by store
- Overdue reminders with escalation levels

### Settings
- View admin profile
- Platform configuration
- Subscription plans details
- API key management (masked)

## Data Structure

### Available Data
- **12 Stores** across 6 cities (Mumbai, Delhi, Hyderabad, Bangalore, Chennai, Pune)
- **50+ Patients** with lifetime values ranging from 4,800 to 18,800 rupees
- **40+ Orders** with various statuses and amounts
- **6 Months** of platform revenue data
- **Complete Analytics** including medicine popularity and city-wise distribution

### Cities Covered
- Mumbai (3 stores)
- Delhi (2 stores)
- Hyderabad (2 stores)
- Bangalore (2 stores)
- Chennai (2 stores)
- Pune (1 store)

## Important URLs & Routes

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Admin login page |
| Dashboard | `/` or `/dashboard` | Platform overview |
| Stores | `/stores` | All stores list |
| Store Detail | `/stores/:id` | Individual store details |
| Patients | `/patients` | All patients list |
| Orders | `/orders` | All orders list |
| Analytics | `/analytics` | Platform analytics |
| Refills | `/refills` | Refill analytics |
| Settings | `/settings` | Admin settings |

## Common Tasks

### Search for a Store
1. Go to Stores page
2. Use the search input to find by store name or owner
3. Click on a store to view details

### Check Patient Risk Level
1. Go to Patients page
2. Filter by risk level using dropdown
3. View all patients in that category

### View Store Revenue
1. Go to Stores page
2. Click on any store
3. See 30-day revenue chart and stats

### Check Order Status
1. Go to Orders page
2. Filter by status (Delivered/Processing/Pending)
3. Search by order ID if needed

### View Analytics
1. Go to Analytics page
2. Scroll through multiple charts
3. See store performance table

### Review Refill Performance
1. Go to Refills page
2. Check conversion rate trend
3. View overdue reminders with escalation levels

## Responsive Features

- **Desktop:** Full sidebar layout with all features
- **Tablet:** Compact sidebar (1024px breakpoint)
- **Mobile:** Optimized for smaller screens (768px breakpoint)

## Dark Theme

The entire application uses a professional dark theme:
- Dark navy background (#0D1B2A)
- Blue accents (#1B4F72)
- Green for success states (#27AE60)
- Red for alerts (#E74C3C)
- Orange for warnings (#F39C12)

## Session Management

- Login credentials are stored in localStorage
- Closing the browser doesn't log you out
- Use Logout button in sidebar to sign out
- Session expires when you logout

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
PORT=3001 npm start
```

### Dependencies Not Installing
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Login Not Working
- Ensure you're using correct credentials:
  - Phone: `9999999999`
  - Password: `rxmaxadmin2026`
- Check browser console for errors
- Try clearing localStorage: `localStorage.clear()`

## File Structure Reference

```
admin-panel/
├── src/
│   ├── pages/               # 8 main pages
│   ├── components/          # 4 reusable components
│   ├── services/            # API service with mock data
│   ├── App.js              # Main app with routing
│   ├── index.js            # React root
│   └── index.css           # 2000+ lines of styling
├── public/
│   └── index.html          # HTML entry point
├── package.json            # Dependencies
├── README.md               # Full documentation
├── QUICK_START.md          # This file
└── BUILD_SUMMARY.md        # Build details
```

## API Service

All data is mocked in `src/services/api.js`. No backend required for development.

### Main API Functions
- `api.getDashboardMetrics()` - Dashboard data
- `api.getAllStores()` - All stores list
- `api.getStore(id)` - Store details
- `api.getAnalytics()` - Analytics data
- `api.getRefillMetrics()` - Refill data
- `api.login(phone, password)` - Authentication

## Tips & Tricks

- Use DataTable search and filters for quick navigation
- Click on table rows to view details (except settings table)
- Hover over stat cards for additional information
- Charts are interactive - hover for detailed tooltips
- All data is real-looking mock data with proper formatting
- Status badges use color coding for quick identification

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review BUILD_SUMMARY.md for architecture details
- Inspect API responses in browser DevTools
- Check console for any error messages

---

**Happy exploring the RxMax Admin Panel!**

For complete documentation, see `README.md`
