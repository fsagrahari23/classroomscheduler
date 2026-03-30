# Quick Start Guide - ClassMate Admin UI

Get up and running with the ClassMate admin interface in 5 minutes.

---

## Installation (1 minute)

### Option 1: Docker (Recommended)
```bash
# Navigate to project root
cd classroom-scheduler

# Start all services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
# Redis: localhost:6379
```

### Option 2: Manual Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Login Credentials

Demo accounts are pre-configured:

### Admin Account
```
Email: admin@example.com
Password: password123
Role: admin
Access: /admin/dashboard, /classrooms
```

### Teacher Account
```
Email: teacher@example.com
Password: password123
Role: teacher
Access: /dashboard
```

### Staff Account
```
Email: staff@example.com
Password: password123
Role: staff
Access: /dashboard
```

---

## File Navigation

### Components You'll Use Often
```
frontend/components/
├── DashboardLayout.js       👈 Main wrapper
├── StatCard.js              👈 Metric cards
├── RequestsTable.js         👈 Data table
├── FilterTabs.js            👈 Tab filtering
├── ReviewActivity.js        👈 Activity feed
├── ClassroomSearch.js       👈 Search input
└── FacultyFilter.js         👈 Faculty dropdown
```

### Pages
```
frontend/app/
├── login/page.js            👈 Login page
├── dashboard/page.js        👈 User dashboard
├── admin/dashboard/page.js  👈 Admin dashboard ⭐
└── classrooms/page.js       👈 Classroom mgmt ⭐
```

### State Management
```
frontend/lib/store/
├── index.js                 👈 Store config
├── authSlice.js            👈 Auth state
├── classroomsSlice.js      👈 Classrooms
└── schedulesSlice.js       👈 Requests/schedules
```

---

## Common Tasks

### Task 1: Create a New Admin Page

```jsx
// File: frontend/app/mynewpage/page.js

'use client';

import { useSelector, useDispatch } from 'react-redux';
import DashboardLayout from '@/components/DashboardLayout.js';
import StatCard from '@/components/StatCard.js';
import { Users, AlertCircle } from 'lucide-react';

export default function MyNewPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <DashboardLayout activeTab="mynewpage">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-100">My Page</h1>
          <p className="text-slate-400">Description here</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Items"
            value={42}
            icon={Users}
            variant="primary"
          />
          <StatCard
            label="Pending"
            value={8}
            icon={AlertCircle}
            variant="warning"
          />
        </div>

        {/* Content */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Content</h2>
          {/* Your content here */}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### Task 2: Add a New Stat Card to a Page

```jsx
import StatCard from '@/components/StatCard.js';
import { TrendingUp } from 'lucide-react';

// In your page component:
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatCard
    label="Growth"
    value="23%"
    icon={TrendingUp}
    variant="success"
    subtext="+12% this month"
  />
</div>
```

### Task 3: Create a Filtered Table

```jsx
import { useState } from 'react';
import RequestsTable from '@/components/RequestsTable.js';
import FilterTabs from '@/components/FilterTabs.js';

export default function MyTable() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All', count: data.length },
    { id: 'active', label: 'Active', count: activeItems.length },
    { id: 'archived', label: 'Archived', count: archivedItems.length },
  ];

  const filteredData = () => {
    switch (activeTab) {
      case 'active':
        return activeItems;
      case 'archived':
        return archivedItems;
      default:
        return data;
    }
  };

  return (
    <div className="card">
      <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      <RequestsTable
        requests={filteredData()}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
```

### Task 4: Use Redux State

```jsx
import { useSelector, useDispatch } from 'react-redux';

// In component:
const { token, user } = useSelector((state) => state.auth);
const { items, loading } = useSelector((state) => state.classrooms);
const dispatch = useDispatch();

// Dispatch actions:
dispatch(fetchClassrooms({ token }));
dispatch(approveRequest({ requestId, token }));
```

### Task 5: Style a Component

```jsx
// Use these ready-made classes:

// Cards
<div className="card">Content</div>

// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-danger">Danger</button>
<button className="btn btn-warning">Warning</button>
<button className="btn btn-info">Info</button>

// Inputs
<input type="text" className="input" placeholder="Search..." />

// Badges
<span className="badge badge-success">Approved</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Rejected</span>

// Text
<p className="text-slate-100">Primary text</p>
<p className="text-slate-400">Secondary text</p>
<p className="text-slate-500">Muted text</p>
```

---

## Admin Dashboard - How It Works

### What You See
```
User logs in as admin
    ↓
Redirected to /admin/dashboard
    ↓
Page loads RequestsTable with pending requests
    ↓
Stats show metrics (pending, approved, rejected, utilization)
    ↓
Click tabs to filter requests
    ↓
Click approve/reject buttons for actions
    ↓
Activity feed updates in real-time
```

### State Flow
```
Redux Store
  ├── auth (user, token)
  ├── classrooms (items, filters)
  └── schedules (items, loading)
        ↓
Component renders based on state
        ↓
User interaction triggers dispatch
        ↓
Async thunk fetches from API
        ↓
Redux updates state
        ↓
Component re-renders
```

---

## Troubleshooting

### Issue: Page shows "Not authorized"
**Solution**: Make sure you're logged in as admin account
```
Email: admin@example.com
Password: password123
```

### Issue: Table is empty
**Solution**: Check if requests exist in database
```
# Check backend logs for API errors
docker logs classroom-scheduler-backend-1
```

### Issue: Styles look broken
**Solution**: Clear cache and rebuild
```bash
# Frontend
rm -rf .next
npm run dev

# Or with Docker
docker-compose down
docker-compose up --build
```

### Issue: Can't connect to API
**Solution**: Check NEXT_PUBLIC_API_URL in .env
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Issue: Redux state is empty
**Solution**: Make sure Redux Provider wraps app
```jsx
// In app/layout.js
import { Provider } from 'react-redux';
import store from '@/lib/store/index.js';

<Provider store={store}>
  {children}
</Provider>
```

---

## Key Concepts

### Components Explained

**StatCard**
- Shows a metric with icon and color
- Variants: default, success, warning, danger, primary, info
- Use for: Key metrics, summary stats

**RequestsTable**
- Professional table with actions
- Columns: Registrar, Course, Room, Status, Actions
- Use for: Data listing, request management

**FilterTabs**
- Tab-based filtering
- Shows badge counts
- Use for: Categorizing content

**ReviewActivity**
- Activity feed sidebar
- Types: approved, rejected, warning, default
- Use for: Recent actions, notifications

**DashboardLayout**
- Main page wrapper
- Sidebar + header + content
- Use for: Wrapping all pages

### Design Pattern

```
Page Layout:
├── Header Section (title, description, actions)
├── Stats Grid (1-4 StatCards)
├── Content Card (table, form, etc)
└── Footer Section (pagination, activity)
```

### Color Usage

```
Primary Accent (Indigo #6366f1)
├── Main buttons
├── Links
└── Important UI elements

Status Colors:
├── Green (#10b981) → Success, Approved
├── Red (#ef4444) → Danger, Rejected
├── Amber (#f59e0b) → Warning, Pending
└── Blue (#3b82f6) → Info, Additional
```

---

## Next Steps

1. **Explore the code**
   - Check out `/admin/dashboard/page.js`
   - Review components in `/components`
   - Study Redux slices in `/lib/store`

2. **Try customizing**
   - Change colors in globals.css
   - Add new stat cards
   - Create a new filter tab

3. **Connect your data**
   - Update API endpoints
   - Test with real classrooms
   - Verify request flow

4. **Deploy**
   - Run tests
   - Build optimized bundles
   - Deploy to production

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build          # Build for production
npm run lint           # Check code quality

# Docker
docker-compose up      # Start all services
docker-compose down    # Stop all services
docker-compose logs -f # View logs

# Database
npm run seed           # Seed demo data
npm run migrate        # Run migrations
```

---

## Important Files

| File | Purpose |
|------|---------|
| `/frontend/app/admin/dashboard/page.js` | Admin dashboard page |
| `/frontend/app/classrooms/page.js` | Classroom management |
| `/frontend/components/StatCard.js` | Metric cards |
| `/frontend/components/RequestsTable.js` | Request table |
| `/frontend/app/globals.css` | All styles |
| `/frontend/lib/store/index.js` | Redux setup |
| `/backend/routes/schedules.js` | Request API |
| `/backend/models/Classroom.js` | Data schema |

---

## Resources

📚 **Documentation**
- UI_DESIGN.md - Design system
- COMPONENT_REFERENCE.md - Component guide
- USAGE_EXAMPLES.md - Code examples
- SETUP.md - Full setup guide

🔗 **External Links**
- Next.js: https://nextjs.org
- Redux: https://redux.js.org
- Tailwind: https://tailwindcss.com
- Socket.IO: https://socket.io

💬 **Getting Help**
1. Check the documentation files
2. Look at USAGE_EXAMPLES.md for similar code
3. Review existing components
4. Check backend logs for API errors

---

## Tips & Tricks

### 💡 Pro Tips

1. **Use Redux DevTools**
   - Install Redux DevTools browser extension
   - Debug state changes in real-time

2. **Tailwind Intellisense**
   - Install VS Code Tailwind extension
   - Get class name auto-completion

3. **Component Composition**
   - Build complex UIs from small components
   - Reuse StatCard, RequestsTable, FilterTabs

4. **Hot Reload**
   - Next.js hot reloads on save
   - Redux state persists during reload

5. **Keyboard Shortcuts**
   - Tab navigation through buttons
   - Enter to submit forms
   - Escape to close modals (when added)

### 🎨 Styling Tips

1. Use semantic classes: `btn btn-primary`
2. Responsive with prefixes: `md:grid-cols-3`
3. Customize with Tailwind: `hover:bg-indigo-700`
4. Dark theme ready with CSS variables
5. Professional with proper spacing

---

**Ready to build?** Start with `/admin/dashboard/page.js` and modify from there!

Last updated: March 2026
